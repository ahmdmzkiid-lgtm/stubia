const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');
const { verifyToken, verifyAdmin } = require('../middleware/auth');

// Get all notifications for current user
router.get('/', verifyToken, async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT * FROM notifications 
       WHERE user_id = $1 
       ORDER BY created_at DESC`,
      [req.user.id]
    );
    res.json({ success: true, data: result.rows });
  } catch (error) {
    next(error);
  }
});

// Get unshown modal notifications for current user
router.get('/unshown', verifyToken, async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT * FROM notifications 
       WHERE user_id = $1 AND is_modal_shown = false 
       ORDER BY created_at ASC`,
      [req.user.id]
    );
    res.json({ success: true, data: result.rows });
  } catch (error) {
    next(error);
  }
});

// Mark a specific notification as modal shown
router.patch('/:id/modal-shown', verifyToken, async (req, res, next) => {
  try {
    const result = await pool.query(
      `UPDATE notifications SET is_modal_shown = true 
       WHERE id = $1 AND user_id = $2 RETURNING *`,
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Not found' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

// Mark a specific notification as read
router.patch('/:id/read', verifyToken, async (req, res, next) => {
  try {
    const result = await pool.query(
      `UPDATE notifications SET is_read = true 
       WHERE id = $1 AND user_id = $2 RETURNING *`,
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Not found' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

// Mark all as read
router.post('/read-all', verifyToken, async (req, res, next) => {
  try {
    await pool.query(
      `UPDATE notifications SET is_read = true 
       WHERE user_id = $1 AND is_read = false`,
      [req.user.id]
    );
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// ADMIN: Send notification
router.post('/send', [verifyToken, verifyAdmin], async (req, res, next) => {
  try {
    const { title, message, image_url, target_user_id } = req.body;
    
    if (!title || !message) {
      return res.status(400).json({ success: false, error: 'Title and message are required' });
    }

    if (target_user_id) {
      // Send to specific user
      const result = await pool.query(
        `INSERT INTO notifications (user_id, title, message, image_url) 
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [target_user_id, title, message, image_url]
      );
      return res.json({ success: true, data: result.rows[0] });
    } else {
      // Broadcast to all users
      // Ideally we would do this in a batch or background job if there are many users, 
      // but for Eduzet we can just do a simple INSERT ... SELECT.
      const result = await pool.query(
        `INSERT INTO notifications (user_id, title, message, image_url)
         SELECT id, $1, $2, $3 FROM users
         RETURNING *`,
        [title, message, image_url]
      );
      return res.json({ success: true, count: result.rows.length, message: 'Broadcasted to all users' });
    }
  } catch (error) {
    next(error);
  }
});

// ADMIN: Get all notifications sent (for history/logs)
router.get('/admin/history', [verifyToken, verifyAdmin], async (req, res, next) => {
    try {
      // Group by title, message, image_url to show broadcasts, or just show all.
      // Let's just group by content and time for a simpler view.
      const result = await pool.query(
        `SELECT title, message, image_url, MIN(created_at) as sent_at, COUNT(*) as recipient_count 
         FROM notifications 
         GROUP BY title, message, image_url 
         ORDER BY sent_at DESC LIMIT 50`
      );
      res.json({ success: true, data: result.rows });
    } catch (error) {
      next(error);
    }
});

module.exports = router;
