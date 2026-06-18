const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');
const { verifyToken } = require('../middleware/auth');
const { calculateIRTScore } = require('../services/irtScoringService');

// Submit latihan (practice) result with IRT scoring
router.post('/latihan/submit', verifyToken, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { subject_id, subject_name, topic_id, latihan_id, questions, answers } = req.body;

    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ success: false, error: 'Questions data required' });
    }

    // Build IRT answer objects from client data
    const irtAnswers = questions.map((q, idx) => {
      const chosenId = answers[idx] || answers[String(idx)] || null;
      let isCorrect = false;
      let chosenChoice = null;

      if (q.question_type === 'short_answer') {
        const correctChoice = (q.choices || []).find(c => c.is_correct);
        isCorrect = !!(correctChoice && chosenId && correctChoice.content.trim().toLowerCase() === String(chosenId).trim().toLowerCase());
      } else {
        chosenChoice = chosenId ? (q.choices || []).find(c => c.id === chosenId) : null;
        isCorrect = chosenChoice?.is_correct === true;
      }

      return {
        chosen_choice_id: q.question_type === 'short_answer' ? null : chosenId,
        is_correct: isCorrect,
        question_id: q.id,
        difficulty: q.difficulty || 'medium',
        subject_name: subject_name || 'Latihan',
        time_spent_sec: 0,
      };
    });

    const totalQuestions = questions.length;

    // If latihan_id is provided, use custom scoring from um_latihan_soal
    let irtResult;
    let customScoring = null;
    if (latihan_id) {
      const latihanRes = await pool.query(
        'SELECT points_correct, points_incorrect, points_unanswered FROM um_latihan_soal WHERE id = $1',
        [latihan_id]
      );
      const ptCorrect = latihanRes.rows[0]?.points_correct ?? 4;
      const ptIncorrect = latihanRes.rows[0]?.points_incorrect ?? -1;
      const ptUnanswered = latihanRes.rows[0]?.points_unanswered ?? 0;

      const correctCount = irtAnswers.filter(a => a.is_correct).length;
      const unansweredCount = irtAnswers.filter(a => !a.chosen_choice_id).length;
      const incorrectCount = totalQuestions - correctCount - unansweredCount;
      const customScore = (correctCount * ptCorrect) + (incorrectCount * ptIncorrect) + (unansweredCount * ptUnanswered);

      customScoring = { ptCorrect, ptIncorrect, ptUnanswered };

      // Build a compatible irtResult object for storage
      irtResult = {
        benar: correctCount,
        salah: incorrectCount,
        kosong: unansweredCount,
        total: totalQuestions,
        totalScore: customScore,
        theta: 0,
        percentile: 0,
        mastery: totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0,
        pointsCorrect: ptCorrect,
        pointsIncorrect: ptIncorrect,
        pointsUnanswered: ptUnanswered,
        scoringMethod: `Custom (Benar: ${ptCorrect > 0 ? '+' : ''}${ptCorrect}, Salah: ${ptIncorrect > 0 ? '+' : ''}${ptIncorrect}, Kosong: ${ptUnanswered > 0 ? '+' : ''}${ptUnanswered})`,
        itemAnalysis: irtAnswers.map((a, idx) => ({
          questionIndex: idx,
          questionId: a.question_id,
          difficulty: a.difficulty || 'medium',
          isCorrect: a.is_correct,
          chosenChoiceId: a.chosen_choice_id,
          subjectName: a.subject_name || 'Latihan',
        })),
      };
    } else {
      // Calculate IRT score (standard latihan)
      irtResult = calculateIRTScore(irtAnswers);
    }

    const correctCount = irtResult.benar;
    const incorrectCount = irtResult.salah;
    const unansweredCount = irtResult.kosong;

    // Save to latihan_sessions
    const insertRes = await pool.query(`
      INSERT INTO latihan_sessions
        (user_id, subject_id, topic_id, latihan_id, subject_name, total_questions, correct_count, incorrect_count, unanswered_count, irt_score, theta, percentile, score_breakdown)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING id
    `, [
      userId, subject_id, topic_id || null, latihan_id || null, subject_name, totalQuestions,
      correctCount, incorrectCount, unansweredCount,
      irtResult.totalScore, irtResult.theta || 0, irtResult.percentile || 0,
      JSON.stringify(irtResult)
    ]);

    res.json({
      success: true,
      data: {
        sessionId: insertRes.rows[0].id,
        irtScore: irtResult.totalScore,
        theta: irtResult.theta || 0,
        percentile: irtResult.percentile || 0,
        correct: correctCount,
        incorrect: incorrectCount,
        unanswered: unansweredCount,
        total: totalQuestions,
        mastery: irtResult.mastery,
        ...(customScoring ? {
          pointsCorrect: customScoring.ptCorrect,
          pointsIncorrect: customScoring.ptIncorrect,
          pointsUnanswered: customScoring.ptUnanswered,
          scoringMethod: irtResult.scoringMethod,
        } : {}),
      }
    });
  } catch (error) {
    console.error('Error submitting latihan:', error);
    next(error);
  }
});

// Get full riwayat (history) with real-time data
router.get('/riwayat', verifyToken, async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Get all submitted tryout sessions WITH the dominant subject of each session
    // (a session typically covers one subtest — we identify it via the most common subject)
    const tryoutRes = await pool.query(`
      SELECT
        ts.id,
        ts.package_id,
        tp.title as name,
        ts.started_at,
        ts.submitted_at,
        ts.total_score as score,
        ts.score_breakdown,
        (
          SELECT s.name
          FROM user_answers ua
          JOIN questions q ON ua.question_id = q.id
          LEFT JOIN subjects s ON q.subject_id = s.id
          WHERE ua.session_id = ts.id AND s.name IS NOT NULL
          GROUP BY s.name
          ORDER BY COUNT(*) DESC
          LIMIT 1
        ) AS subtest_name
      FROM tryout_sessions ts
      JOIN tryout_packages tp ON tp.id = ts.package_id
      WHERE ts.user_id = $1 AND ts.submitted_at IS NOT NULL
      ORDER BY ts.started_at ASC
    `, [userId]);

    // Get all latihan sessions
    const latihanRes = await pool.query(`
      SELECT
        id,
        'latihan' as type,
        subject_name as name,
        subject_id,
        topic_id,
        total_questions,
        correct_count,
        irt_score as score,
        theta,
        percentile,
        score_breakdown,
        started_at,
        submitted_at
      FROM latihan_sessions
      WHERE user_id = $1
      ORDER BY submitted_at DESC
    `, [userId]);

    // Get all Ujian Mandiri tryout sessions
    const umTryoutRes = await pool.query(`
      SELECT 
        ts.id,
        ts.package_id,
        tp.title as name,
        um.nama_ujian as ujian_name,
        tp.ujian_id,
        ts.started_at,
        ts.submitted_at,
        ts.total_score as score,
        ts.score_breakdown
      FROM um_tryout_sessions ts
      JOIN um_tryout_packages tp ON ts.package_id = tp.id
      JOIN ujian_mandiri um ON tp.ujian_id = um.id
      WHERE ts.user_id = $1 AND ts.submitted_at IS NOT NULL
      ORDER BY ts.submitted_at DESC
    `, [userId]);

    // Group tryout sessions into ATTEMPTS: per package, sessions are walked chronologically;
    // a new attempt starts when we encounter a subtest already present in the current group,
    // OR when more than 12 hours has passed since the last session in the group.
    // This correctly handles repeated attempts of the same subtest.
    const openGroupByPackage = new Map(); // package_id -> current open group
    const allGroups = [];

    tryoutRes.rows.forEach(row => {
      const subtest = row.subtest_name || 'Unknown';
      const startedAt = new Date(row.started_at);
      let group = openGroupByPackage.get(row.package_id);

      const timeSinceLast = group ? (startedAt - new Date(group.latestStartedAt)) / 3600000 : Infinity; // hours
      const subtestAlreadyUsed = group && group.subtestSet.has(subtest);

      if (!group || subtestAlreadyUsed || timeSinceLast > 12) {
        // Start a new attempt
        group = {
          package_id: row.package_id,
          name: row.name,
          sessions: [],
          subtestSet: new Set(),
          earliestStartedAt: row.started_at,
          latestStartedAt: row.started_at,
          latestSubmittedAt: row.submitted_at,
        };
        openGroupByPackage.set(row.package_id, group);
        allGroups.push(group);
      }

      group.sessions.push(row);
      group.subtestSet.add(subtest);
      if (startedAt > new Date(group.latestStartedAt)) group.latestStartedAt = row.started_at;
      if (row.submitted_at && (!group.latestSubmittedAt || new Date(row.submitted_at) > new Date(group.latestSubmittedAt))) {
        group.latestSubmittedAt = row.submitted_at;
      }
    });

    const tryoutGroups = { values: () => allGroups };

    // Build aggregated tryout history: one entry per group, score = avg of subtest totalScores
    const tryoutHistory = Array.from(tryoutGroups.values()).map(group => {
      const breakdowns = group.sessions.map(s => {
        try {
          return typeof s.score_breakdown === 'string' ? JSON.parse(s.score_breakdown) : (s.score_breakdown || {});
        } catch { return {}; }
      });

      // Aggregate subjectScores from all sessions in this group
      const aggregatedSubjects = {};
      breakdowns.forEach(b => {
        if (b.subjectScores) {
          Object.entries(b.subjectScores).forEach(([subjName, subjData]) => {
            if (!aggregatedSubjects[subjName] || (subjData.score || 0) > (aggregatedSubjects[subjName].score || 0)) {
              aggregatedSubjects[subjName] = subjData;
            }
          });
        }
      });

      // Total = average of all subtest scores from aggregated subjects (real-time)
      const subjScores = Object.values(aggregatedSubjects).map(s => s.score || 0);
      const aggregatedScore = subjScores.length > 0
        ? Math.round(subjScores.reduce((a, b) => a + b, 0) / subjScores.length)
        : (breakdowns[0]?.totalScore || group.sessions[0]?.score || 0);

      // Average theta + percentile across sessions
      const thetas = breakdowns.map(b => b.theta).filter(t => typeof t === 'number');
      const percentiles = breakdowns.map(b => b.percentile).filter(p => typeof p === 'number');
      const masteries = breakdowns.map(b => b.mastery).filter(m => typeof m === 'number');

      return {
        id: group.sessions[0].id, // use first session id as representative
        sessionIds: group.sessions.map(s => s.id),
        packageId: group.package_id,
        type: 'tryout',
        name: group.name,
        score: aggregatedScore,
        theta: thetas.length > 0 ? thetas.reduce((a, b) => a + b, 0) / thetas.length : 0,
        percentile: percentiles.length > 0 ? Math.round(percentiles.reduce((a, b) => a + b, 0) / percentiles.length) : 0,
        mastery: masteries.length > 0 ? Math.round(masteries.reduce((a, b) => a + b, 0) / masteries.length) : 0,
        subtestCount: group.sessions.length,
        date: group.latestSubmittedAt || group.earliestStartedAt,
      };
    });

    // Format Ujian Mandiri tryout entries
    const umTryoutHistory = umTryoutRes.rows.map(row => {
      let b = {};
      try {
        b = typeof row.score_breakdown === 'string' ? JSON.parse(row.score_breakdown) : (row.score_breakdown || {});
      } catch { b = {}; }

      return {
        id: row.id,
        packageId: row.package_id,
        ujianId: row.ujian_id,
        type: 'ujian_mandiri_tryout',
        name: `${row.ujian_name} - ${row.name}`,
        score: row.score || 0,
        theta: 0,
        percentile: 0,
        mastery: b.total && b.benar ? Math.round((b.benar / b.total) * 100) : 0,
        date: row.submitted_at || row.started_at,
        correct: b.benar || 0,
        total: b.total || 0,
      };
    });

    // Format latihan entries
    const latihanHistory = latihanRes.rows.map(row => ({
      id: row.id,
      type: 'latihan',
      name: row.name || 'Latihan',
      subject_id: row.subject_id,
      topic_id: row.topic_id,
      score: row.score || 0,
      theta: row.theta || 0,
      percentile: row.percentile || 0,
      mastery: row.correct_count && row.total_questions ? Math.round((row.correct_count / row.total_questions) * 100) : 0,
      date: row.submitted_at || row.started_at,
      correct: row.correct_count,
      total: row.total_questions,
    }));

    // Combine and sort by date
    const allHistory = [...tryoutHistory, ...latihanHistory, ...umTryoutHistory]
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    // Calculate summary stats
    const allScores = allHistory.filter(h => h.score > 0).map(h => h.score);
    const avgScore = allScores.length > 0 ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length) : 0;
    const totalTryouts = tryoutHistory.length + umTryoutHistory.length;
    const totalLatihan = latihanHistory.length;

    // Best percentile from the latest entry
    const latestPercentile = allHistory.find(h => h.percentile > 0)?.percentile || 0;

    // Score trend (last 10 entries with scores, chronological)
    const scoreTrend = allHistory
      .filter(h => h.score > 0)
      .slice(0, 10)
      .reverse()
      .map(h => ({
        date: h.date,
        score: h.score,
        type: h.type,
        name: h.name,
      }));

    // Score change from previous month
    const now = new Date();
    const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    const thisMonthScores = allScores.filter((_, i) => new Date(allHistory[i]?.date) >= oneMonthAgo);
    const prevMonthScores = allScores.filter((_, i) => {
      const d = new Date(allHistory[i]?.date);
      return d < oneMonthAgo;
    });
    const thisMonthAvg = thisMonthScores.length > 0 ? thisMonthScores.reduce((a, b) => a + b, 0) / thisMonthScores.length : 0;
    const prevMonthAvg = prevMonthScores.length > 0 ? prevMonthScores.reduce((a, b) => a + b, 0) / prevMonthScores.length : 0;
    const scoreChange = prevMonthAvg > 0 ? Math.round(((thisMonthAvg - prevMonthAvg) / prevMonthAvg) * 100 * 10) / 10 : 0;

    // Subject strength breakdown (from latihan data)
    const subjectMap = {};
    latihanHistory.forEach(h => {
      if (!subjectMap[h.name]) {
        subjectMap[h.name] = { scores: [], correct: 0, total: 0 };
      }
      subjectMap[h.name].scores.push(h.score);
      subjectMap[h.name].correct += h.correct || 0;
      subjectMap[h.name].total += h.total || 0;
    });
    const subjectStrength = Object.entries(subjectMap).map(([name, data]) => ({
      name,
      avgScore: Math.round(data.scores.reduce((a, b) => a + b, 0) / data.scores.length),
      mastery: data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0,
      attempts: data.scores.length,
    })).sort((a, b) => b.avgScore - a.avgScore);

    res.json({
      success: true,
      data: {
        summary: {
          avgScore,
          totalExams: totalTryouts + totalLatihan,
          totalTryouts,
          totalLatihan,
          percentile: latestPercentile,
          scoreChange,
        },
        scoreTrend,
        history: allHistory,
        subjectStrength,
      }
    });
  } catch (error) {
    console.error('Riwayat error:', error);
    next(error);
  }
});

// Get user's recent activities (tryout & latihan)
router.get('/', verifyToken, async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Get recent tryout sessions with dominant subtest for proper attempt grouping
    const tryoutSql = `
      SELECT
        ts.id,
        ts.package_id,
        tp.title as name,
        ts.started_at as started_at,
        ts.submitted_at,
        ts.total_score as score,
        ts.score_breakdown,
        (
          SELECT s.name
          FROM user_answers ua
          JOIN questions q ON ua.question_id = q.id
          LEFT JOIN subjects s ON q.subject_id = s.id
          WHERE ua.session_id = ts.id AND s.name IS NOT NULL
          GROUP BY s.name
          ORDER BY COUNT(*) DESC
          LIMIT 1
        ) AS subtest_name
      FROM tryout_sessions ts
      JOIN tryout_packages tp ON tp.id = ts.package_id
      WHERE ts.user_id = $1
      ORDER BY ts.started_at ASC
      LIMIT 100
    `;

    // Get recent Ujian Mandiri tryouts
    const umTryoutSql = `
      SELECT
        ts.id,
        ts.package_id,
        tp.title as name,
        um.nama_ujian as ujian_name,
        tp.ujian_id,
        ts.started_at,
        ts.submitted_at,
        ts.total_score as score,
        ts.score_breakdown
      FROM um_tryout_sessions ts
      JOIN um_tryout_packages tp ON ts.package_id = tp.id
      JOIN ujian_mandiri um ON tp.ujian_id = um.id
      WHERE ts.user_id = $1
      ORDER BY ts.started_at DESC
      LIMIT 10
    `;

    // Get recent latihan sessions for this user
    const latihanSql = `
      SELECT
        ls.id,
        'latihan' as type,
        COALESCE(s.name, ls.subject_name) as name,
        s.bg_color,
        s.icon_color,
        s.icon,
        ls.created_at as started_at,
        ls.submitted_at,
        ls.irt_score as score,
        ls.score_breakdown,
        ls.correct_count,
        ls.total_questions,
        ls.subject_id,
        ls.topic_id
      FROM latihan_sessions ls
      LEFT JOIN subjects s ON s.id = ls.subject_id
      WHERE ls.user_id = $1
      ORDER BY ls.created_at DESC
      LIMIT 10
    `;

    const [tryoutResult, latihanResult, umTryoutResult] = await Promise.all([
      pool.query(tryoutSql, [userId]),
      pool.query(latihanSql, [userId]),
      pool.query(umTryoutSql, [userId])
    ]);

    // Group recent tryout sessions into ATTEMPTS (same logic as /riwayat)
    const openByPkg = new Map();
    const recentGroupsArr = [];
    tryoutResult.rows.forEach(row => {
      const subtest = row.subtest_name || 'Unknown';
      const startedAt = new Date(row.started_at);
      let g = openByPkg.get(row.package_id);
      const timeSinceLast = g ? (startedAt - new Date(g.latestStartedAt)) / 3600000 : Infinity;
      const subtestUsed = g && g.subtestSet.has(subtest);
      if (!g || subtestUsed || timeSinceLast > 12) {
        g = { package_id: row.package_id, name: row.name, sessions: [], subtestSet: new Set(), latestStartedAt: row.started_at, latestSubmittedAt: row.submitted_at };
        openByPkg.set(row.package_id, g);
        recentGroupsArr.push(g);
      }
      g.sessions.push(row);
      g.subtestSet.add(subtest);
      if (startedAt > new Date(g.latestStartedAt)) g.latestStartedAt = row.started_at;
      if (row.submitted_at && (!g.latestSubmittedAt || new Date(row.submitted_at) > new Date(g.latestSubmittedAt))) g.latestSubmittedAt = row.submitted_at;
    });

    const tryoutActivities = recentGroupsArr.map(group => {
      const breakdowns = group.sessions.map(s => {
        try { return typeof s.score_breakdown === 'string' ? JSON.parse(s.score_breakdown) : (s.score_breakdown || {}); } catch { return {}; }
      });
      // Aggregate subjectScores (best of)
      const aggregatedSubjects = {};
      breakdowns.forEach(b => {
        if (b.subjectScores) {
          Object.entries(b.subjectScores).forEach(([k, v]) => {
            if (!aggregatedSubjects[k] || (v.score || 0) > (aggregatedSubjects[k].score || 0)) aggregatedSubjects[k] = v;
          });
        }
      });
      const subjScores = Object.values(aggregatedSubjects).map(s => s.score || 0);
      const score = subjScores.length > 0
        ? Math.round(subjScores.reduce((a, b) => a + b, 0) / subjScores.length)
        : (breakdowns[0]?.totalScore || group.sessions[0]?.score || null);
      const masteries = breakdowns.map(b => b.mastery).filter(m => typeof m === 'number');
      const progress = masteries.length > 0 ? Math.round(masteries.reduce((a, b) => a + b, 0) / masteries.length) : 0;

      return {
        id: group.sessions[0].id,
        sessionIds: group.sessions.map(s => s.id),
        packageId: group.package_id,
        type: 'tryout',
        name: group.name,
        progress,
        score,
        subtestCount: group.sessions.length,
        startedAt: group.latestStartedAt,
        submittedAt: group.latestSubmittedAt,
        bgColor: '#dae1ff',
        iconColor: '#0050cb',
        icon: 'quiz'
      };
    });

    // Format Ujian Mandiri tryouts
    const umActivities = umTryoutResult.rows.map(row => {
      let b = {};
      try { b = typeof row.score_breakdown === 'string' ? JSON.parse(row.score_breakdown) : (row.score_breakdown || {}); } catch { b = {}; }
      const correct = b.benar || 0;
      const total = b.total || 1;
      const progress = Math.round((correct / total) * 100);

      return {
        id: row.id,
        packageId: row.package_id,
        ujianId: row.ujian_id,
        type: 'ujian_mandiri_tryout',
        name: `${row.ujian_name} - ${row.name}`,
        progress,
        score: row.score,
        startedAt: row.started_at,
        submittedAt: row.submitted_at,
        bgColor: '#e8eeff',
        iconColor: '#0050cb',
        icon: 'school'
      };
    });

    // Format Latihan results
    const latihanActivities = latihanResult.rows.map(row => {
      const progress = row.total_questions > 0
        ? Math.round((row.correct_count / row.total_questions) * 100)
        : 0;
      return {
        id: row.id,
        type: 'latihan',
        name: row.name || 'Latihan Topik',
        progress,
        score: row.score,
        subjectId: row.subject_id,
        topicId: row.topic_id,
        startedAt: row.started_at,
        submittedAt: row.submitted_at,
        bgColor: row.bg_color || '#ffdbd0',
        iconColor: row.icon_color || '#a33200',
        icon: row.icon || 'school'
      };
    });

    // Combine and sort by date
    const allActivities = [...tryoutActivities, ...latihanActivities, ...umActivities]
      .sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt))
      .slice(0, 5);

    res.json({
      success: true,
      data: allActivities
    });
  } catch (error) {
    console.error('Activity error:', error);
    res.json({ success: true, data: [] });
  }
});

// Get latihan session result (for UTBK Latihan)
router.get('/latihan/result/:sessionId', verifyToken, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { sessionId } = req.params;

    const sessionRes = await pool.query(
      `SELECT ls.*
       FROM latihan_sessions ls
       WHERE ls.id = $1 AND ls.user_id = $2`,
      [sessionId, userId]
    );

    if (sessionRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Session not found' });
    }

    const session = sessionRes.rows[0];
    const breakdown = typeof session.score_breakdown === 'string'
      ? JSON.parse(session.score_breakdown)
      : session.score_breakdown;

    const itemAnalysis = breakdown?.itemAnalysis || [];

    if (itemAnalysis.length === 0) {
      return res.json({
        success: true,
        data: {
          subjectName: session.subject_name,
          subjectId: session.subject_id,
          topicId: session.topic_id,
          score_breakdown: breakdown,
          questions: [],
        }
      });
    }

    // Fetch questions and their choices from the questions table
    const questionIds = itemAnalysis.map(item => item.questionId).filter(Boolean);
    if (questionIds.length === 0) {
      return res.json({
        success: true,
        data: {
          subjectName: session.subject_name,
          subjectId: session.subject_id,
          topicId: session.topic_id,
          score_breakdown: breakdown,
          questions: [],
        }
      });
    }

    const questionsRes = await pool.query(
      `SELECT q.id, q.content, q.image_url, q.image_position, q.difficulty, q.subject_id, q.question_type,
              json_agg(
                json_build_object(
                  'id', ac.id,
                  'label', ac.label,
                  'content', ac.content,
                  'is_correct', ac.is_correct,
                  'explanation', ac.explanation
                ) ORDER BY ac.label
              ) AS choices
       FROM questions q
       LEFT JOIN answer_choices ac ON ac.question_id = q.id
       WHERE q.id = ANY($1::uuid[])
       GROUP BY q.id
       ORDER BY array_position($1::uuid[], q.id)`,
      [questionIds]
    );

    const questions = questionsRes.rows.map(q => ({
      ...q,
      choices: q.choices.filter(c => c.id !== null),
    }));

    // Merge itemAnalysis data into each question
    const enrichedQuestions = questions.map(q => {
      const analysis = itemAnalysis.find(item => item.questionId === q.id) || {};
      const chosenChoiceId = analysis.chosenChoiceId || null;
      const chosenChoice = chosenChoiceId ? q.choices.find(c => c.id === chosenChoiceId) : null;
      const correctChoice = q.choices.find(c => c.is_correct) || null;
      return {
        ...q,
        chosenChoiceId,
        chosenChoice: chosenChoice || null,
        correctChoice,
        isCorrect: analysis.isCorrect === true,
        isAnswered: !!chosenChoiceId,
        difficulty: analysis.difficulty || q.difficulty || 'medium',
      };
    });

    res.json({
      success: true,
      data: {
        subjectName: session.subject_name,
        subjectId: session.subject_id,
        topicId: session.topic_id,
        score_breakdown: breakdown,
        questions: enrichedQuestions,
      }
    });
  } catch (error) {
    console.error('Error fetching latihan result:', error);
    next(error);
  }
});

module.exports = router;
