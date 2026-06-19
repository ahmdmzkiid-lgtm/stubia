const express = require("express");
const router = express.Router();
const { pool } = require("../config/db");
const { verifyToken, verifyAdmin } = require("../middleware/auth");
const {
  generateQuestionHash,
  updateQuestionHash,
} = require("../utils/questionHashUtil");
const {
  checkLatihanAccess,
  assertUtbkGratisContentAccess,
  hasActiveUtbkSubscription,
  isAdminUser,
  SOCIAL_VERIFY_MSG,
} = require("../utils/latihanAccessUtil");

// List Soal
router.get("/", verifyToken, async (req, res, next) => {
  try {
    const {
      subject_id,
      topic_id,
      subject_name,
      difficulty,
      tryout_package_id,
      source,
      exclude_completed,
      page = 1,
      limit = 100,
    } = req.query;

    // Free plan practice limit check (skip untuk admin, termasuk admin baru dipromosikan)
    if (
      !tryout_package_id &&
      !(await isAdminUser(req.user.id, req.user.role))
    ) {
      const hasUtbkUnlimited = await hasActiveUtbkSubscription(req.user.id);

      if (!hasUtbkUnlimited) {
        const planBlock = await assertUtbkGratisContentAccess(
          subject_id,
          topic_id,
        );
        if (planBlock) {
          return res.status(403).json({ success: false, ...planBlock });
        }

        // 1. One-time check per exercise: Free users cannot repeat completed topics/subjects
        let completed = 0;
        if (topic_id) {
          const res = await pool.query(
            "SELECT COUNT(*) as count FROM latihan_sessions WHERE user_id = $1 AND topic_id = $2 AND submitted_at IS NOT NULL",
            [req.user.id, topic_id],
          );
          completed = parseInt(res.rows[0].count);
        } else if (subject_id) {
          const res = await pool.query(
            "SELECT COUNT(*) as count FROM latihan_sessions WHERE user_id = $1 AND subject_id = $2 AND submitted_at IS NOT NULL",
            [req.user.id, subject_id],
          );
          completed = parseInt(res.rows[0].count);
        } else if (subject_name) {
          const res = await pool.query(
            `SELECT COUNT(*) as count FROM latihan_sessions
             WHERE user_id = $1 AND submitted_at IS NOT NULL AND (
               LOWER(subject_name) = LOWER($2)
               OR subject_id = (SELECT id FROM subjects WHERE LOWER(name) = LOWER($2) OR LOWER(title) = LOWER($2) LIMIT 1)
             )`,
            [req.user.id, subject_name],
          );
          completed = parseInt(res.rows[0].count);
        }

        if (completed >= 1) {
          return res.status(403).json({
            success: false,
            error:
              "Akun gratis hanya dapat mengerjakan setiap latihan soal sebanyak 1 kali. Upgrade ke Premium untuk akses tanpa batas.",
            code: "FREE_LIMIT_REACHED",
          });
        }

        // 2. Global total sessions check
        const access = await checkLatihanAccess(req.user.id);
        if (!access.allowed) {
          return res.status(403).json({
            success: false,
            error: SOCIAL_VERIFY_MSG,
            code: access.code || "FREE_LIMIT_REQUIRE_SOCIAL",
            total_sessions: access.totalSessions,
            verified: access.verified,
          });
        }
      }
    }

    let query =
      "SELECT id, subject_id, topic_id, content, image_url, image_position, difficulty, source, display_order, tryout_package_id, question_type, created_at FROM questions WHERE 1=1";
    const values = [];

    // Filter out completed questions by content_hash if exclude_completed is true
    if (exclude_completed === "true") {
      const userId = req.user.id;
      // Get all content_hashes of questions completed by this user (UTBK Tryouts + Latihan)
      const completedRes = await pool.query(
        `WITH completed_hashes AS (
          SELECT q.content_hash FROM user_answers ua
          JOIN tryout_sessions ts ON ua.session_id = ts.id
          JOIN questions q ON ua.question_id = q.id
          WHERE ts.user_id = $1 AND q.content_hash IS NOT NULL
          UNION
          SELECT q.content_hash FROM latihan_sessions ls,
          jsonb_array_elements(ls.score_breakdown->'itemAnalysis') AS item
          JOIN questions q ON (item->>'questionId')::uuid = q.id
          WHERE ls.user_id = $1 AND q.content_hash IS NOT NULL
        )
        SELECT content_hash FROM completed_hashes WHERE content_hash IS NOT NULL`,
        [userId],
      );

      const completedHashes = completedRes.rows.map((r) => r.content_hash);
      if (completedHashes.length > 0) {
        values.push(completedHashes);
        query += ` AND (content_hash IS NULL OR NOT (content_hash = ANY($${values.length}::varchar[])))`;
      }
    }

    if (subject_id) {
      values.push(subject_id);
      query += ` AND subject_id = $${values.length}`;
    } else if (subject_name) {
      // Find subject UUID first by name
      const subjectResult = await pool.query(
        "SELECT id FROM subjects WHERE LOWER(name) = LOWER($1) OR LOWER(title) = LOWER($1) LIMIT 1",
        [subject_name],
      );
      if (subjectResult.rows.length > 0) {
        values.push(subjectResult.rows[0].id);
        query += ` AND subject_id = $${values.length}`;
      } else {
        // Subject not found, return empty
        return res.json({
          success: true,
          data: [],
          message: "Questions retrieved",
        });
      }
    }

    if (topic_id) {
      values.push(topic_id);
      query += ` AND topic_id = $${values.length}`;
    }

    if (difficulty) {
      values.push(difficulty);
      query += ` AND difficulty = $${values.length}`;
    }

    if (tryout_package_id) {
      values.push(tryout_package_id);
      query += ` AND tryout_package_id = $${values.length}`;
      query += ` ORDER BY display_order ASC, created_at ASC, id ASC`;
    } else {
      // Jika tidak ada tryout_package_id (mode latihan), hanya tampilkan soal latihan (bukan soal tryout)
      query += " AND tryout_package_id IS NULL";
      if (source) {
        values.push(source);
        query += ` AND source = $${values.length}`;
      } else {
        query += " AND (source IS NULL OR source != 'battle')";
      }
      query += " ORDER BY display_order ASC, created_at ASC, id ASC";
    }

    query +=
      " LIMIT $" + (values.length + 1) + " OFFSET $" + (values.length + 2);

    const questionsResult = await pool.query(query, [
      ...values,
      limit,
      (page - 1) * limit,
    ]);

    // Fetch choices for these questions
    if (questionsResult.rows.length > 0) {
      const questionIds = questionsResult.rows.map((q) => q.id);
      const placeholders = questionIds.map((_, i) => `$${i + 1}`).join(",");

      const choicesResult = await pool.query(
        `SELECT * FROM answer_choices WHERE question_id IN (${placeholders}) ORDER BY label ASC`,
        questionIds,
      );

      // Map choices to questions
      for (const question of questionsResult.rows) {
        question.choices = choicesResult.rows.filter(
          (c) => c.question_id === question.id,
        );
      }
    }

    res.json({
      success: true,
      data: questionsResult.rows,
      message: "Questions retrieved",
    });
  } catch (error) {
    console.error("Error fetching questions:", error);
    next(error);
  }
});

// Create Soal (Admin Only)
router.post("/", verifyToken, verifyAdmin, async (req, res, next) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const {
      subject_id,
      content,
      difficulty,
      choices,
      image_url,
      image_position,
      question_type,
      correct_answer_text,
    } = req.body;
    const qType = question_type || "multiple_choice";

    // Calculate content hash and check for duplicates
    const hash = generateQuestionHash(content, choices, image_url);
    const existingRes = await client.query(
      `SELECT q.id, s.name as subject_name FROM questions q
       LEFT JOIN subjects s ON q.subject_id = s.id
       WHERE q.content_hash = $1 LIMIT 1`,
      [hash],
    );
    let duplicateWarning = null;
    if (existingRes.rows.length > 0) {
      duplicateWarning = `Soal ini terdeteksi duplikat dengan soal ID ${existingRes.rows[0].id} di subtes ${existingRes.rows[0].subject_name || "tidak diketahui"}`;
    }

    // Get max display_order for this subject
    const maxOrderRes = await client.query(
      "SELECT COALESCE(MAX(display_order), 0) as max_order FROM questions WHERE subject_id = $1",
      [subject_id],
    );
    const nextDisplayOrder = (maxOrderRes.rows[0]?.max_order || 0) + 1;

    const qRes = await client.query(
      "INSERT INTO questions (subject_id, content, difficulty, display_order, image_url, image_position, question_type, content_hash) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *",
      [
        subject_id,
        content,
        difficulty || "medium",
        nextDisplayOrder,
        image_url || null,
        image_position || "after",
        qType,
        hash,
      ],
    );
    const question = qRes.rows[0];

    if (qType === "short_answer") {
      // For short answer: store correct answer as single choice with label 'A'
      const answerText = correct_answer_text || "";
      const explanation = choices?.[0]?.explanation || null;
      await client.query(
        "INSERT INTO answer_choices (question_id, label, content, is_correct, explanation) VALUES ($1, $2, $3, $4, $5)",
        [question.id, "A", answerText, true, explanation],
      );
    } else {
      const choicePromises = choices.map((c) =>
        client.query(
          "INSERT INTO answer_choices (question_id, label, content, is_correct, explanation) VALUES ($1, $2, $3, $4, $5)",
          [question.id, c.label, c.content, c.is_correct, c.explanation],
        ),
      );
      await Promise.all(choicePromises);
    }
    await client.query("COMMIT");

    res
      .status(201)
      .json({
        success: true,
        data: question,
        duplicateWarning,
        message: "Question created",
      });
  } catch (error) {
    await client.query("ROLLBACK");
    next(error);
  } finally {
    client.release();
  }
});

// Shuffle choices for a question (Admin Only)
// Labels A,B,C,D,E stay fixed — only CONTENT + IS_CORRECT + EXPLANATION are shuffled
router.post(
  "/shuffle/:questionId",
  verifyToken,
  verifyAdmin,
  async (req, res, next) => {
    const { questionId } = req.params;

    if (!questionId) {
      return res
        .status(400)
        .json({ success: false, error: "questionId diperlukan" });
    }

    try {
      // Get all choices ordered by label (A,B,C,D,E) — order stays intact
      const choicesResult = await pool.query(
        "SELECT * FROM answer_choices WHERE question_id = $1 ORDER BY label ASC",
        [questionId],
      );

      if (choicesResult.rows.length === 0) {
        return res
          .status(404)
          .json({ success: false, error: "Tidak ada pilihan jawaban" });
      }

      const choices = choicesResult.rows;

      // Extract only the DATA fields (content, is_correct, explanation) — NOT the labels
      let dataSlots = choices.map((c) => ({
        content: c.content,
        is_correct: c.is_correct,
        explanation: c.explanation,
      }));

      // Fisher-Yates shuffle on the data slots only
      for (let i = dataSlots.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [dataSlots[i], dataSlots[j]] = [dataSlots[j], dataSlots[i]];
      }

      // Write shuffled data back — each choice KEEPS its original id & label,
      // but gets the new content/is_correct/explanation
      for (let i = 0; i < choices.length; i++) {
        await pool.query(
          "UPDATE answer_choices SET content = $1, is_correct = $2, explanation = $3 WHERE id = $4",
          [
            dataSlots[i].content,
            dataSlots[i].is_correct,
            dataSlots[i].explanation,
            choices[i].id,
          ],
        );
      }

      res.json({
        success: true,
        message:
          "Jawaban berhasil diacak. Urutan A-E tetap, isi jawaban yang berpindah.",
      });
    } catch (error) {
      console.error("Error shuffling choices:", error);
      next(error);
    }
  },
);

// Delete all questions by subject (Admin Only)
router.delete(
  "/all/by-subject/:subjectId",
  verifyToken,
  verifyAdmin,
  async (req, res, next) => {
    const { subjectId } = req.params;
    const { source } = req.query;

    if (!subjectId) {
      return res
        .status(400)
        .json({ success: false, error: "subjectId diperlukan" });
    }

    try {
      let sourceFilter = "";
      const values = [subjectId];
      if (source) {
        values.push(source);
        sourceFilter = ` AND source = $2`;
      }

      // 1. Delete user_answers that reference questions in this subject (via question_id)
      await pool.query(
        `DELETE FROM user_answers WHERE question_id IN (
        SELECT id FROM questions WHERE subject_id = $1${sourceFilter}
      )`,
        values,
      );

      // 2. Delete user_answers that reference answer_choices of questions in this subject (via chosen_choice_id)
      await pool.query(
        `DELETE FROM user_answers WHERE chosen_choice_id IN (
        SELECT ac.id FROM answer_choices ac
        JOIN questions q ON ac.question_id = q.id
        WHERE q.subject_id = $1${sourceFilter}
      )`,
        values,
      );

      // 3. Delete all answer_choices for questions in this subject
      await pool.query(
        `DELETE FROM answer_choices WHERE question_id IN (
        SELECT id FROM questions WHERE subject_id = $1${sourceFilter}
      )`,
        values,
      );

      // 4. Delete all questions
      const deleteResult = await pool.query(
        `DELETE FROM questions WHERE subject_id = $1${sourceFilter}`,
        values,
      );

      res.json({
        success: true,
        message: `${deleteResult.rowCount} soal berhasil dihapus`,
        deletedCount: deleteResult.rowCount,
      });
    } catch (error) {
      console.error("Error deleting all questions by subject:", error);
      next(error);
    }
  },
);

// Reorder Questions (Admin Only) - Update display_order for multiple questions
router.patch(
  "/reorder/batch",
  verifyToken,
  verifyAdmin,
  async (req, res, next) => {
    try {
      const { questionIds } = req.body;

      if (!Array.isArray(questionIds) || questionIds.length === 0) {
        return res.status(400).json({
          success: false,
          error: "questionIds harus berupa array dan tidak kosong",
        });
      }

      const client = await pool.connect();
      try {
        await client.query("BEGIN");

        // Update display_order for each question based on position in array
        for (let i = 0; i < questionIds.length; i++) {
          await client.query(
            "UPDATE questions SET display_order = $1 WHERE id = $2",
            [i + 1, questionIds[i]],
          );
        }

        await client.query("COMMIT");
        res.json({
          success: true,
          message: "Urutan soal berhasil diperbarui",
          updatedCount: questionIds.length,
        });
      } catch (dbError) {
        await client.query("ROLLBACK");
        throw dbError;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error("Error reordering questions:", error);
      next(error);
    }
  },
);

// Update Soal (Admin Only)
router.patch("/:id", verifyToken, verifyAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { content, difficulty, image_url, image_position } = req.body;

    const updates = [];
    const values = [];
    let paramCount = 0;

    if (content !== undefined) {
      paramCount++;
      updates.push(`content = $${paramCount}`);
      values.push(content);
    }
    if (difficulty !== undefined) {
      paramCount++;
      updates.push(`difficulty = $${paramCount}`);
      values.push(difficulty);
    }
    if (image_url !== undefined) {
      paramCount++;
      updates.push(`image_url = $${paramCount}`);
      values.push(image_url);
    }
    if (image_position !== undefined) {
      paramCount++;
      updates.push(`image_position = $${paramCount}`);
      values.push(image_position);
    }

    if (updates.length === 0) {
      return res
        .status(400)
        .json({ success: false, error: "Tidak ada data yang diperbarui" });
    }

    values.push(id);
    const result = await pool.query(
      `UPDATE questions SET ${updates.join(", ")} WHERE id = $${paramCount + 1} RETURNING *`,
      values,
    );

    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, error: "Soal tidak ditemukan" });
    }

    // Recalculate content hash
    await updateQuestionHash(pool, id, false);
    const updatedRes = await pool.query(
      "SELECT * FROM questions WHERE id = $1",
      [id],
    );

    res.json({
      success: true,
      data: updatedRes.rows[0],
      message: "Soal berhasil diperbarui",
    });
  } catch (error) {
    next(error);
  }
});

// Delete Soal (Admin Only)
router.delete("/:id", verifyToken, verifyAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      "DELETE FROM questions WHERE id = $1 RETURNING id",
      [id],
    );
    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, error: "Soal tidak ditemukan" });
    }
    res.json({ success: true, message: "Soal berhasil dihapus" });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
