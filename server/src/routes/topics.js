const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');
const { verifyToken, verifyAdmin } = require('../middleware/auth');

// Update topic
router.patch('/:id', [verifyToken, verifyAdmin], async (req, res, next) => {
  const { id } = req.params;
  const { title, description, icon, questions, level, type, isPopular, isFeatured } = req.body;
  try {
    const result = await pool.query(
      `UPDATE topics SET 
      title = $1, description = $2, icon = $3, questions_count = $4, 
      difficulty_level = $5, card_type = $6, is_popular = $7, is_featured = $8 
      WHERE id = $9 RETURNING *`,
      [title, description, icon, questions, level, type, isPopular, isFeatured, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Topic not found' });
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

// Delete topic
router.delete('/:id', [verifyToken, verifyAdmin], async (req, res, next) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM topics WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Topic not found' });
    res.json({ success: true, message: 'Topic deleted' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
