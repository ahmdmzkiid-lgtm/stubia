const path = require('path');
// Load .env: first try server-local (for Render), then root (for local dev)
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { initializeDatabase } = require('./config/db');
const { populateQuestionHashes } = require('./utils/populateQuestionHashes');

const app = express();

// Helmet
app.use(helmet({
  contentSecurityPolicy: {policy: "same-origin-allow-popups "}, 
  crossOriginEmbedderPolicy: {policy: "cross-origin"}
}));
// Middleware
app.use(cors({
  origin: ['https://stubia.id', 'https://www.stubia.id', 'http://localhost:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());
app.use(morgan('dev'));

// Basic health check route
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'API is running' });
});

// Import routes (will be created later)
const authRoutes = require('./routes/auth');
const soalRoutes = require('./routes/soal');
const tryoutRoutes = require('./routes/tryout');
const bookmarkRoutes = require('./routes/bookmark');
const importRoutes = require('./routes/import');
const subjectsRoutes = require('./routes/subjects');
const topicsRoutes = require('./routes/topics');
const adminRoutes = require('./routes/admin');
const settingsRoutes = require('./routes/settings');
const chatRoutes = require('./routes/chat');
const activityRoutes = require('./routes/activity');
const subscriptionRoutes = require('./routes/subscription');
const battleRoutes = require('./routes/battle');
const uploadRoutes = require('./routes/upload');
const ujianMandiriRoutes = require('./routes/ujianMandiri');
const socialRoutes = require('./routes/social');
const teamRoutes = require('./routes/team');
const vouchersRoutes = require('./routes/vouchers');

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/soal', soalRoutes);
app.use('/api/tryout', tryoutRoutes);
app.use('/api/bookmark', bookmarkRoutes);
app.use('/api/import', importRoutes);
app.use('/api/subjects', subjectsRoutes);
app.use('/api/topics', topicsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/subscription', subscriptionRoutes);
app.use('/api/battle', battleRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/ujian-mandiri', ujianMandiriRoutes);
app.use('/api/social', socialRoutes);
app.use('/api/team', teamRoutes);
app.use('/api/vouchers', vouchersRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal Server Error',
  });
});

const PORT = process.env.PORT || 3001;

async function startServer() {
  try {
    await initializeDatabase();
    await populateQuestionHashes();
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

startServer();

module.exports = app;
