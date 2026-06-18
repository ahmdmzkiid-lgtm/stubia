const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');
const { verifyToken, verifyAdmin } = require('../middleware/auth');
const upload = require('../middleware/upload');
const XLSX = require('xlsx');
const { generateQuestionHash } = require('../utils/questionHashUtil');

/**
 * POST /api/import/excel
 *
 * Expects multipart/form-data with:
 *   - file              : Excel file (.xlsx or .xls)
 *   - subject_id        : UUID of the subject
 *   - difficulty        : 'easy' | 'medium' | 'hard'  (default: 'medium')
 *   - destination       : 'latihan' | 'tryout' (default: 'latihan')
 *   - tryout_package_id : UUID of tryout package (required if destination is 'tryout')
 *
 * Excel columns (header row required, case-insensitive):
 *   SOAL | OPSI A | OPSI B | OPSI C | OPSI D | OPSI E | KUNCI JAWABAN | PEMBAHASAN
 *
 * No question limit — all rows in the file will be processed.
 */
router.post('/excel', verifyToken, verifyAdmin, upload.single('file'), async (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({ success: false, error: 'No file uploaded' });
  }

  const { subject_id, topic_id, difficulty = 'medium', destination = 'latihan', tryout_package_id } = req.body;
  if (!subject_id) {
    return res.status(400).json({ success: false, error: 'subject_id wajib diisi sebelum import' });
  }
  if (destination === 'tryout' && !tryout_package_id) {
    return res.status(400).json({ success: false, error: 'tryout_package_id wajib diisi jika destination adalah tryout' });
  }

  // Flexible column name resolver (handles BOM, extra spaces, case differences)
  const ALIASES = {
    soal:          ['soal', 'content', 'question', 'pertanyaan'],
    opsi_a:        ['opsi a', 'opsia', 'choice_a', 'pilihan a', 'a'],
    opsi_b:        ['opsi b', 'opsib', 'choice_b', 'pilihan b', 'b'],
    opsi_c:        ['opsi c', 'opsic', 'choice_c', 'pilihan c', 'c'],
    opsi_d:        ['opsi d', 'opsid', 'choice_d', 'pilihan d', 'd'],
    opsi_e:        ['opsi e', 'opsie', 'choice_e', 'pilihan e', 'e'],
    kunci:         ['kunci jawaban', 'kunci', 'correct_label', 'answer', 'jawaban', 'kunci_jawaban'],
    pembahasan:    ['pembahasan', 'explanation', 'penjelasan'],
    image_url:     ['gambar', 'image', 'image_url', 'url gambar', 'foto'],
  };

  const resolve = (row, key) => {
    const aliases = ALIASES[key];
    for (const alias of aliases) {
      for (const rowKey of Object.keys(row)) {
        const clean = rowKey.replace(/^\uFEFF/, '').trim().toLowerCase();
        if (clean === alias) {
          const val = row[rowKey];
          if (val === null || val === undefined) return '';
          return String(val).trim();
        }
      }
    }
    return '';
  };

  // Parse Excel file
  let results;
  try {
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    results = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
  } catch (err) {
    return res.status(400).json({ success: false, error: `Excel parse error: ${err.message}` });
  }

  if (!results || results.length === 0) {
    return res.status(400).json({ success: false, error: 'File Excel kosong atau tidak memiliki data.' });
  }

  let importedCount = 0;
  let rejectedCount = 0;
  const errors = [];

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Get the current max display_order for this subject AND tryout package (if applicable)
    let maxOrderRes;
    if (destination === 'tryout' && tryout_package_id) {
      maxOrderRes = await client.query(
        'SELECT COALESCE(MAX(display_order), 0) as max_order FROM questions WHERE subject_id = $1 AND tryout_package_id = $2',
        [subject_id, tryout_package_id]
      );
    } else {
      maxOrderRes = await client.query(
        'SELECT COALESCE(MAX(display_order), 0) as max_order FROM questions WHERE subject_id = $1 AND tryout_package_id IS NULL',
        [subject_id]
      );
    }
    let nextDisplayOrder = (maxOrderRes.rows[0]?.max_order || 0) + 1;

    for (let i = 0; i < results.length; i++) {
      const row = results[i];
      const rowNum = i + 2; // row 1 = header

      const soal       = resolve(row, 'soal');
      const opsiA      = resolve(row, 'opsi_a');
      const opsiB      = resolve(row, 'opsi_b');
      const opsiC      = resolve(row, 'opsi_c');
      const opsiD      = resolve(row, 'opsi_d');
      const opsiE      = resolve(row, 'opsi_e');
      const kunci      = resolve(row, 'kunci').toUpperCase();
      const pembahasan = resolve(row, 'pembahasan');
      const imageUrl   = resolve(row, 'image_url');

      // ── Validation ──────────────────────────────────────────────
      if (!soal) {
        errors.push(`Baris ${rowNum}: Kolom SOAL kosong`);
        rejectedCount++;
        continue;
      }

      // Detect question type: if ALL options are empty → short_answer
      const isShortAnswer = !opsiA && !opsiB && !opsiC && !opsiD && !opsiE;

      if (isShortAnswer) {
        // Short answer: KUNCI JAWABAN contains the correct text answer
        if (!kunci && !resolve(row, 'kunci')) {
          errors.push(`Baris ${rowNum}: Soal isian singkat harus memiliki KUNCI JAWABAN`);
          rejectedCount++;
          continue;
        }
      } else {
        // Multiple choice validation
        if (!opsiA || !opsiB) {
          errors.push(`Baris ${rowNum}: Minimal OPSI A dan OPSI B harus diisi`);
          rejectedCount++;
          continue;
        }
        if (!['A', 'B', 'C', 'D', 'E'].includes(kunci)) {
          errors.push(`Baris ${rowNum}: KUNCI JAWABAN '${kunci}' tidak valid (harus A/B/C/D/E)`);
          rejectedCount++;
          continue;
        }
      }
      // PEMBAHASAN opsional — tidak wajib diisi

      const questionType = isShortAnswer ? 'short_answer' : 'multiple_choice';

      if (!isShortAnswer) {
        // Build choices — skip empty options (multiple choice)
        var choices = [
          { label: 'A', content: opsiA },
          { label: 'B', content: opsiB },
          { label: 'C', content: opsiC },
          { label: 'D', content: opsiD },
          { label: 'E', content: opsiE },
        ].filter(c => c.content !== '');

        const correctExists = choices.some(c => c.label === kunci);
        if (!correctExists) {
          errors.push(`Baris ${rowNum}: KUNCI '${kunci}' tidak ada di opsi yang tersedia`);
          rejectedCount++;
          continue;
        }
      }

      // Compute content hash
      const hashChoices = isShortAnswer
        ? [resolve(row, 'kunci') || kunci]
        : choices;
      const hash = generateQuestionHash(soal, hashChoices, imageUrl);

      // ── Insert question ──────────────────────────────────────────
      const pkgId = destination === 'tryout' ? tryout_package_id : null;
      const qSource = destination === 'battle' ? 'battle' : 'manual';
      const qRes = await client.query(
        'INSERT INTO questions (subject_id, topic_id, content, difficulty, tryout_package_id, display_order, source, image_url, question_type, content_hash) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id',
        [subject_id, topic_id || null, soal, difficulty, pkgId, nextDisplayOrder, qSource, imageUrl || null, questionType, hash]
      );
      const questionId = qRes.rows[0].id;
      nextDisplayOrder++;

      // ── Insert choices ───────────────────────────────────────────
      if (isShortAnswer) {
        // For short answer: store correct answer as a single choice with label 'A'
        const correctAnswerText = resolve(row, 'kunci') || kunci;
        await client.query(
          'INSERT INTO answer_choices (question_id, label, content, is_correct, explanation) VALUES ($1, $2, $3, $4, $5)',
          [questionId, 'A', correctAnswerText, true, pembahasan || null]
        );
      } else {
        for (const choice of choices) {
          const isCorrect = choice.label === kunci;
          await client.query(
            'INSERT INTO answer_choices (question_id, label, content, is_correct, explanation) VALUES ($1, $2, $3, $4, $5)',
            [questionId, choice.label, choice.content, isCorrect, isCorrect ? (pembahasan || null) : null]
          );
        }
      }

      importedCount++;
    }

    await client.query('COMMIT');

    res.json({
      success: true,
      data: { importedCount, rejectedCount, errors },
      message: `Import selesai. ${importedCount} soal berhasil diimpor, ${rejectedCount} gagal.`,
    });

  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
});

// Keep backward compatibility — redirect old CSV endpoint to Excel
router.post('/csv', verifyToken, verifyAdmin, upload.single('file'), (req, res) => {
  res.status(410).json({ success: false, error: 'Endpoint CSV sudah tidak didukung. Gunakan /api/import/excel dengan file Excel (.xlsx).' });
});

module.exports = router;
