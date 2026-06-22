const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');
const { verifyToken } = require('../middleware/auth');
const { OAuth2Client } = require('google-auth-library');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Register
router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, error: 'All fields are required.' });
    }

    const checkUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (checkUser.rows.length > 0) {
      return res.status(400).json({ success: false, error: 'Email already registered.' });
    }

    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const result = await pool.query(
      'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email, role',
      [name, email, passwordHash]
    );

    const user = result.rows[0];
    const { sendWelcomeEmail } = require('../services/emailService');
    sendWelcomeEmail(user.email, user.name).catch(err => console.error('Welcome email error:', err));

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.status(201).json({ success: true, data: { user, token }, message: 'Registered successfully.' });
  } catch (error) {
    next(error);
  }
});

// Login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required.' });
    }

    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, error: 'Email atau password salah.' });
    }

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);
    
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Email atau password salah.' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    delete user.password_hash;
    res.json({ success: true, data: { user, token }, message: 'Logged in successfully.' });
  } catch (error) {
    next(error);
  }
});

// Google Login
router.post('/google', async (req, res, next) => {
  try {
    const { access_token } = req.body; // Actually an ID token from credential
    if (!access_token) {
      return res.status(400).json({ success: false, error: 'Google token is required.' });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: access_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    
    const payload = ticket.getPayload();
    const { email, name } = payload;

    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    let user;
    
    if (result.rows.length === 0) {
      const randomPassword = require('crypto').randomBytes(16).toString('hex');
      const passwordHash = await bcrypt.hash(randomPassword, 12);
      
      const insertResult = await pool.query(
        'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email, role',
        [name, email, passwordHash]
      );
      user = insertResult.rows[0];
      const { sendWelcomeEmail } = require('../services/emailService');
      sendWelcomeEmail(user.email, user.name).catch(err => console.error('Google welcome email error:', err));
    } else {
      user = result.rows[0];
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    delete user.password_hash;
    res.json({ success: true, data: { user, token }, message: 'Logged in with Google successfully.' });
  } catch (error) {
    console.error('Google login error:', error);
    res.status(401).json({ success: false, error: 'Invalid Google token.' });
  }
});

// Get Current User
router.get('/me', verifyToken, async (req, res, next) => {
  try {
    const result = await pool.query(
      'SELECT id, name, email, role, current_plan, created_at FROM users WHERE id = $1',
      [req.user.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'User not found.' });
    }

    res.json({ success: true, data: result.rows[0], message: 'User profile retrieved.' });
  } catch (error) {
    next(error);
  }
});

// Update Profile Name
router.put('/update-profile', verifyToken, async (req, res, next) => {
  try {
    const { name } = req.body;
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return res.status(400).json({ success: false, error: 'Nama tidak boleh kosong.' });
    }

    if (name.length > 255) {
      return res.status(400).json({ success: false, error: 'Nama tidak boleh melebihi 255 karakter.' });
    }

    const result = await pool.query(
      'UPDATE users SET name = $1 WHERE id = $2 RETURNING id, name, email, role, current_plan, created_at',
      [name.trim(), req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'User tidak ditemukan.' });
    }

    res.json({ success: true, data: result.rows[0], message: 'Profil berhasil diperbarui.' });
  } catch (error) {
    next(error);
  }
});

// Update Password
router.put('/update-password', verifyToken, async (req, res, next) => {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ success: false, error: 'Password lama dan password baru harus diisi.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, error: 'Password baru harus minimal 6 karakter.' });
    }

    // Ambil user dari DB untuk mencocokkan password lama
    const result = await pool.query('SELECT password_hash FROM users WHERE id = $1', [req.user.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'User tidak ditemukan.' });
    }

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(oldPassword, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ success: false, error: 'Password lama tidak sesuai.' });
    }

    // Hash password baru
    const saltRounds = 12;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [newPasswordHash, req.user.id]);

    res.json({ success: true, message: 'Password berhasil diperbarui.' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

