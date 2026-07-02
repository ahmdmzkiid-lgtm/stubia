const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');
const { verifyToken, verifyAdmin } = require('../middleware/auth');
const { getApiKeyManager } = require('../services/apiKeyManager');

const decodeTokenFromRequest = (req) => {
  try {
    let token = null;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.query.token) {
      token = req.query.token;
    }
    if (!token) return null;
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    return null;
  }
};

const ensureAdminFromAny = (req, res, next) => {
  const decoded = decodeTokenFromRequest(req);
  if (!decoded) {
    return res.status(401).json({ success: false, error: 'Access denied. No token provided.' });
  }
  if (decoded.role !== 'admin') {
    return res.status(403).json({ success: false, error: 'Access denied. Admin role required.' });
  }
  req.user = decoded;
  next();
};

const fetchRecentActivities = async (limit = 50, offset = 0) => {
  const safeLimit = Math.max(parseInt(limit, 10) || 50, 1);
  const safeOffset = Math.max(parseInt(offset, 10) || 0, 0);
  const fetchLimit = Math.min(safeLimit + safeOffset + 20, 500); // grab a bit extra to cover pagination window

  const [tryoutRes, umTryoutRes, latihanRes, userRes, counts] = await Promise.all([
    pool.query(
      `SELECT ts.id as ref_id, u.id as user_id, u.name, u.email, 'tryout_submit' as action, 'utbk_tryout' as source,
              COALESCE(ts.submitted_at, ts.started_at, NOW()) as timestamp,
              ts.package_id, ts.total_score
       FROM tryout_sessions ts
       JOIN users u ON u.id = ts.user_id
       ORDER BY timestamp DESC
       LIMIT $1`,
      [fetchLimit]
    ),
    pool.query(
      `SELECT ts.id as ref_id, u.id as user_id, u.name, u.email, 'um_tryout_submit' as action, 'um_tryout' as source,
              COALESCE(ts.submitted_at, ts.started_at, NOW()) as timestamp,
              ts.package_id, ts.total_score
       FROM um_tryout_sessions ts
       JOIN users u ON u.id = ts.user_id
       ORDER BY timestamp DESC
       LIMIT $1`,
      [fetchLimit]
    ),
    pool.query(
      `SELECT ls.id as ref_id, u.id as user_id, u.name, u.email, 'latihan_submit' as action, 'latihan' as source,
              COALESCE(ls.submitted_at, ls.started_at, NOW()) as timestamp,
              ls.latihan_id, ls.subject_name, ls.correct_count, ls.incorrect_count, ls.unanswered_count
       FROM latihan_sessions ls
       JOIN users u ON u.id = ls.user_id
       ORDER BY timestamp DESC
       LIMIT $1`,
      [fetchLimit]
    ),
    pool.query(
      `SELECT u.id as ref_id, u.id as user_id, u.name, u.email, 'user_registered' as action, 'user' as source,
              COALESCE(u.created_at, NOW()) as timestamp
       FROM users u
       ORDER BY timestamp DESC
       LIMIT $1`,
      [fetchLimit]
    ),
    pool.query(
      `SELECT 
         (SELECT COUNT(*) FROM tryout_sessions) as tryout_count,
         (SELECT COUNT(*) FROM um_tryout_sessions) as um_tryout_count,
         (SELECT COUNT(*) FROM latihan_sessions) as latihan_count,
         (SELECT COUNT(*) FROM users) as user_count`
    ),
  ]);

  const merged = [
    ...tryoutRes.rows.map(r => ({
      id: `tryout-${r.ref_id}`,
      ...r,
      severity: 'info',
      meta: { package_id: r.package_id, score: r.total_score },
    })),
    ...umTryoutRes.rows.map(r => ({
      id: `umtryout-${r.ref_id}`,
      ...r,
      severity: 'info',
      meta: { package_id: r.package_id, score: r.total_score },
    })),
    ...latihanRes.rows.map(r => ({
      id: `latihan-${r.ref_id}`,
      ...r,
      severity: 'info',
      meta: {
        latihan_id: r.latihan_id,
        subject_name: r.subject_name,
        correct: r.correct_count,
        incorrect: r.incorrect_count,
        unanswered: r.unanswered_count,
      },
    })),
    ...userRes.rows.map(r => ({
      id: `user-${r.ref_id}`,
      ...r,
      severity: 'info',
      meta: {},
    })),
  ];

  const sorted = merged.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  const items = sorted.slice(safeOffset, safeOffset + safeLimit);

  const totalRaw = counts.rows?.[0] || {};
  const total = ['tryout_count', 'um_tryout_count', 'latihan_count', 'user_count']
    .map((k) => parseInt(totalRaw[k] || 0, 10) || 0)
    .reduce((a, b) => a + b, 0);

  return { items, total };
};

// GET /api/admin/stats - Dashboard statistics
router.get('/stats', verifyToken, verifyAdmin, async (req, res, next) => {
  try {
    // Run all queries in parallel for performance
    const [
      usersResult,
      questionsResult,
      sessionsResult,
      subjectStatsResult,
      difficultyResult,
      recentUsersResult,
      recentQuestionsResult,
    ] = await Promise.all([
      // Total users
      pool.query("SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE role = 'student') as students, COUNT(*) FILTER (WHERE role = 'student' AND current_plan = 'premium') as premium_students, COUNT(*) FILTER (WHERE role = 'student' AND current_plan = 'premium_um') as premium_um_students, COUNT(*) FILTER (WHERE role = 'student' AND current_plan = 'sultan') as sultan_students, COUNT(*) FILTER (WHERE role = 'admin') as admins FROM users"),
      // Total questions
      pool.query("SELECT COUNT(*) as total FROM questions"),
      // Tryout sessions
      pool.query("SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE submitted_at IS NOT NULL) as completed FROM tryout_sessions"),
      // Questions per subject
      pool.query(`
        SELECT s.name, s.category, COUNT(q.id) as question_count 
        FROM subjects s 
        LEFT JOIN questions q ON q.subject_id = s.id 
        GROUP BY s.id, s.name, s.category 
        ORDER BY question_count DESC
      `),
      // Difficulty distribution
      pool.query("SELECT difficulty, COUNT(*) as count FROM questions GROUP BY difficulty"),
      // Recent users (last 10)
      pool.query("SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC LIMIT 10"),
      // Recent questions (last 5)
      pool.query(`
        SELECT q.id, q.content, q.difficulty, q.source, q.created_at, s.name as subject_name 
        FROM questions q 
        LEFT JOIN subjects s ON s.id = q.subject_id 
        ORDER BY q.created_at DESC LIMIT 5
      `),
    ]);

    res.json({
      success: true,
      data: {
        users: {
          total: parseInt(usersResult.rows[0].total),
          students: parseInt(usersResult.rows[0].students),
          premiumStudents: parseInt(usersResult.rows[0].premium_students),
          premiumUmStudents: parseInt(usersResult.rows[0].premium_um_students || 0),
          sultanStudents: parseInt(usersResult.rows[0].sultan_students),
          admins: parseInt(usersResult.rows[0].admins),
        },
        questions: {
          total: parseInt(questionsResult.rows[0].total),
        },
        sessions: {
          total: parseInt(sessionsResult.rows[0].total),
          completed: parseInt(sessionsResult.rows[0].completed),
        },
        subjectStats: subjectStatsResult.rows,
        difficultyDistribution: difficultyResult.rows,
        recentUsers: recentUsersResult.rows,
        recentQuestions: recentQuestionsResult.rows,
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/admin/users - Paginated user list
router.get('/users', verifyToken, verifyAdmin, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const role = req.query.role; // 'student', 'admin', or undefined for all
    const plan = req.query.plan; // 'gratis', 'premium', 'sultan', or undefined for all
    const search = req.query.search || '';

    let whereClause = '';
    const params = [];
    const conditions = [];

    if (role) {
      params.push(role);
      conditions.push(`role = $${params.length}`);
    }
    if (plan) {
      params.push(plan);
      conditions.push(`current_plan = $${params.length}`);
    }
    if (search) {
      params.push(`%${search}%`);
      conditions.push(`(name ILIKE $${params.length} OR email ILIKE $${params.length})`);
    }
    if (conditions.length > 0) {
      whereClause = 'WHERE ' + conditions.join(' AND ');
    }

    const countResult = await pool.query(
      `SELECT COUNT(*) as total FROM users ${whereClause}`,
      params
    );

    const usersResult = await pool.query(
      `SELECT id, name, email, role, current_plan, created_at FROM users ${whereClause} ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );

    const total = parseInt(countResult.rows[0].total);

    res.json({
      success: true,
      data: {
        users: usersResult.rows,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/admin/users/:id/role - Update user role
router.patch('/users/:id/role', verifyToken, verifyAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    const allowedRoles = ['student', 'admin', 'question_writer', 'quality_assurance', 'article_writer'];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ success: false, error: 'Invalid role' });
    }
    const result = await pool.query(
      'UPDATE users SET role = $1 WHERE id = $2 RETURNING id, name, email, role',
      [role, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    res.json({ success: true, data: result.rows[0], message: 'Role updated successfully' });
  } catch (error) {
    next(error);
  }
});

// GET /api/admin/tryout-registrations - Paginated registrations
router.get('/tryout-registrations', verifyToken, verifyAdmin, async (req, res, next) => {
  try {
    const statusFilter = req.query.status;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    let whereClause = '';
    const params = [];

    if (statusFilter) {
      params.push(statusFilter);
      whereClause = `WHERE tr.status = $${params.length}`;
    }

    const countRes = await pool.query(
      `SELECT COUNT(*) as total FROM tryout_registrations tr ${whereClause}`,
      params
    );
    const total = parseInt(countRes.rows[0].total);

    const limitParam = params.length + 1;
    const offsetParam = params.length + 2;
    params.push(limit, offset);

    const query = `
      SELECT tr.*, 
             u.name as user_name, u.email as user_email, u.current_plan as user_plan,
             COALESCE(tp.title, utp.title) as package_title
      FROM tryout_registrations tr
      JOIN users u ON u.id = tr.user_id
      LEFT JOIN tryout_packages tp ON tp.id = tr.utbk_package_id
      LEFT JOIN um_tryout_packages utp ON utp.id = tr.um_package_id
      ${whereClause}
      ORDER BY tr.created_at DESC
      LIMIT $${limitParam} OFFSET $${offsetParam}
    `;

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: {
        registrations: result.rows,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/admin/tryout-registrations/:id - Approve or reject registration
router.patch('/tryout-registrations/:id', verifyToken, verifyAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, rejection_reason } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Status tidak valid.' });
    }

    const check = await pool.query('SELECT * FROM tryout_registrations WHERE id = $1', [id]);
    if (check.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Pendaftaran tidak ditemukan.' });
    }

    const result = await pool.query(
      `UPDATE tryout_registrations 
       SET status = $1, rejection_reason = $2, updated_at = NOW() 
       WHERE id = $3 RETURNING *`,
      [status, status === 'rejected' ? rejection_reason : null, id]
    );

    const reg = result.rows[0];
    
    // Retrieve user and package details to send notification email
    const detailRes = await pool.query(`
      SELECT u.name, u.email, COALESCE(tp.title, utp.title) as package_title
      FROM users u
      LEFT JOIN tryout_packages tp ON tp.id = $2
      LEFT JOIN um_tryout_packages utp ON utp.id = $3
      WHERE u.id = $1
    `, [reg.user_id, reg.utbk_package_id, reg.um_package_id]);

    if (detailRes.rows.length > 0) {
      const detail = detailRes.rows[0];
      const { sendTryoutRegistrationApprovedEmail, sendTryoutRegistrationRejectedEmail } = require('../services/emailService');
      if (status === 'approved') {
        sendTryoutRegistrationApprovedEmail(detail.email, detail.name, detail.package_title, reg.package_type)
          .catch(err => console.error('Tryout approved email error:', err));
      } else if (status === 'rejected') {
        sendTryoutRegistrationRejectedEmail(detail.email, detail.name, detail.package_title, rejection_reason)
          .catch(err => console.error('Tryout rejected email error:', err));
      }
    }

    res.json({
      success: true,
      data: reg,
      message: `Pendaftaran berhasil ${status === 'approved' ? 'disetujui' : 'ditolak'}.`
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/admin/tryout-registrations/:id - Delete approved/rejected registration
router.delete('/tryout-registrations/:id', verifyToken, verifyAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;

    const check = await pool.query('SELECT id, status FROM tryout_registrations WHERE id = $1', [id]);
    if (check.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Pendaftaran tidak ditemukan.' });
    }

    if (check.rows[0].status === 'pending') {
      return res.status(400).json({ success: false, error: 'Tidak bisa menghapus pendaftaran yang masih pending. Setujui atau tolak terlebih dahulu.' });
    }

    await pool.query('DELETE FROM tryout_registrations WHERE id = $1', [id]);

    res.json({ success: true, message: 'Pendaftaran berhasil dihapus.' });
  } catch (error) {
    next(error);
  }
});

// GET /api/admin/activity - preload latest activities
router.get('/activity', verifyToken, verifyAdmin, async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 20;
    const page = parseInt(req.query.page, 10) || 1;
    const offset = (page - 1) * limit;
    const { items, total } = await fetchRecentActivities(limit, offset);
    res.json({
      success: true,
      data: {
        items,
        total,
        page,
        totalPages: Math.ceil(total / limit) || 1,
        limit,
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/admin/activity/stream - SSE live feed
router.get('/activity/stream', ensureAdminFromAny, async (req, res) => {
  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });
  res.flushHeaders?.();

  let alive = true;

  const sendSnapshot = async () => {
    try {
      const { items } = await fetchRecentActivities(50, 0);
      res.write(`event: snapshot\n`);
      res.write(`data: ${JSON.stringify(items)}\n\n`);
    } catch (err) {
      res.write(`event: error\n`);
      res.write(`data: ${JSON.stringify({ message: 'failed_to_fetch' })}\n\n`);
    }
  };

  const sendHeartbeat = () => {
    res.write(`event: ping\n`);
    res.write(`data: ${Date.now()}\n\n`);
  };

  // Initial snapshot
  await sendSnapshot();
  sendHeartbeat();

  const interval = setInterval(async () => {
    if (!alive) return;
    await sendSnapshot();
    sendHeartbeat();
  }, 5000);

  req.on('close', () => {
    alive = false;
    clearInterval(interval);
    res.end();
  });
});

// ──────────────────────────────────
// Tim Stubia CRUD (Admin)
// ──────────────────────────────────

// GET /api/admin/team - List all team members
router.get('/team', verifyToken, verifyAdmin, async (req, res, next) => {
  try {
    const result = await pool.query(
      'SELECT * FROM team_members ORDER BY display_order ASC, created_at ASC'
    );
    res.json({ success: true, data: result.rows });
  } catch (error) {
    next(error);
  }
});

// POST /api/admin/team - Create team member
router.post('/team', verifyToken, verifyAdmin, async (req, res, next) => {
  try {
    const { name, role, photo_url, bio, instagram_url, linkedin_url } = req.body;
    if (!name || !role) {
      return res.status(400).json({ success: false, error: 'Nama dan role wajib diisi.' });
    }
    // Get next display_order
    const maxOrder = await pool.query('SELECT COALESCE(MAX(display_order), 0) + 1 as next_order FROM team_members');
    const display_order = maxOrder.rows[0].next_order;

    const result = await pool.query(
      'INSERT INTO team_members (name, role, photo_url, bio, instagram_url, linkedin_url, display_order) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [name, role, photo_url || null, bio || null, instagram_url || null, linkedin_url || null, display_order]
    );
    res.status(201).json({ success: true, data: result.rows[0], message: 'Anggota tim berhasil ditambahkan.' });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/admin/team/:id - Update team member
router.patch('/team/:id', verifyToken, verifyAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, role, photo_url, bio, instagram_url, linkedin_url, display_order } = req.body;

    const fields = [];
    const values = [];
    let paramIndex = 1;

    if (name !== undefined) { fields.push(`name = $${paramIndex++}`); values.push(name); }
    if (role !== undefined) { fields.push(`role = $${paramIndex++}`); values.push(role); }
    if (photo_url !== undefined) { fields.push(`photo_url = $${paramIndex++}`); values.push(photo_url); }
    if (bio !== undefined) { fields.push(`bio = $${paramIndex++}`); values.push(bio); }
    if (instagram_url !== undefined) { fields.push(`instagram_url = $${paramIndex++}`); values.push(instagram_url); }
    if (linkedin_url !== undefined) { fields.push(`linkedin_url = $${paramIndex++}`); values.push(linkedin_url); }
    if (display_order !== undefined) { fields.push(`display_order = $${paramIndex++}`); values.push(display_order); }
    fields.push(`updated_at = NOW()`);

    if (fields.length === 1) {
      return res.status(400).json({ success: false, error: 'Tidak ada field yang diupdate.' });
    }

    values.push(id);
    const result = await pool.query(
      `UPDATE team_members SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Anggota tim tidak ditemukan.' });
    }

    res.json({ success: true, data: result.rows[0], message: 'Anggota tim berhasil diupdate.' });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/admin/team/:id - Delete team member
router.delete('/team/:id', verifyToken, verifyAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM team_members WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Anggota tim tidak ditemukan.' });
    }
    res.json({ success: true, message: 'Anggota tim berhasil dihapus.' });
  } catch (error) {
    next(error);
  }
});

// GET /api/admin/api-keys-status - Monitor Gemini API keys health
router.get('/api-keys-status', verifyToken, verifyAdmin, async (req, res, next) => {
  try {
    const manager = getApiKeyManager();
    const status = manager.getKeyStatus();

    res.json({
      success: true,
      data: status,
      message: 'API Keys status retrieved successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get API keys status'
    });
  }
});

// POST /api/admin/api-keys-reset - Admin reset all API keys (clear cooldown)
router.post('/api-keys-reset', verifyToken, verifyAdmin, async (req, res, next) => {
  try {
    const manager = getApiKeyManager();
    manager.resetAllKeys();

    res.json({
      success: true,
      message: 'All API keys reset to available status'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to reset API keys'
    });
  }
});

// GET /api/admin/questions/duplicates - Find all duplicate questions in both UTBK and UM
router.get('/questions/duplicates', verifyToken, verifyAdmin, async (req, res, next) => {
  try {
    const utbkDuplicates = await pool.query(`
      SELECT q.content_hash, COUNT(*) as duplicate_count, 
             json_agg(
               json_build_object(
                 'id', q.id,
                 'content', q.content,
                 'difficulty', q.difficulty,
                 'subject_name', s.name
               )
             ) as questions_list
      FROM questions q
      LEFT JOIN subjects s ON q.subject_id = s.id
      WHERE q.content_hash IS NOT NULL
      GROUP BY q.content_hash
      HAVING COUNT(*) > 1
      ORDER BY duplicate_count DESC
    `);

    const umDuplicates = await pool.query(`
      SELECT q.content_hash, COUNT(*) as duplicate_count, 
             json_agg(
               json_build_object(
                 'id', q.id,
                 'content', q.content,
                 'difficulty', q.difficulty,
                 'package_title', tp.title,
                 'latihan_title', ls.title
               )
             ) as questions_list
      FROM um_questions q
      LEFT JOIN um_tryout_packages tp ON q.tryout_package_id = tp.id
      LEFT JOIN um_latihan_soal ls ON q.latihan_id = ls.id
      WHERE q.content_hash IS NOT NULL
      GROUP BY q.content_hash
      HAVING COUNT(*) > 1
      ORDER BY duplicate_count DESC
    `);

    res.json({
      success: true,
      data: {
        utbk: utbkDuplicates.rows,
        um: umDuplicates.rows
      }
    });
  } catch (error) {
    next(error);
  }
});



// GET /api/admin/activity-logs - Admin only: Get paginated admin activity logs
router.get('/activity-logs', verifyToken, verifyAdmin, async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 30;
    const page = parseInt(req.query.page, 10) || 1;
    const offset = (page - 1) * limit;

    const countRes = await pool.query('SELECT COUNT(*) FROM admin_activity_logs');
    const total = parseInt(countRes.rows[0].count, 10) || 0;

    const logsRes = await pool.query(
      `SELECT id, admin_id, admin_name, admin_email, action, target_type, target_name, details, created_at
       FROM admin_activity_logs
       ORDER BY created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    res.json({
      success: true,
      data: {
        items: logsRes.rows,
        total,
        page,
        totalPages: Math.ceil(total / limit) || 1,
        limit
      }
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/admin/activity-logs/clear - Admin only: Clear all admin activity logs
router.delete('/activity-logs/clear', verifyToken, verifyAdmin, async (req, res, next) => {
  try {
    await pool.query('DELETE FROM admin_activity_logs');
    res.json({ success: true, message: 'Semua log aktivitas admin berhasil dihapus.' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
