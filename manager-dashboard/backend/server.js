// FILE: backend/server.js
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const express = require('express');
const cors = require('cors');
const path = require('path');
const { initializeDatabase } = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize DB on startup
initializeDatabase();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/employees', require('./routes/employees'));
app.use('/api/schedule', require('./routes/schedule'));
app.use('/api/events', require('./routes/events'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/applications', require('./routes/applications'));

// Convenience alias for application types
const { authenticateToken } = require('./middleware/auth');
app.get('/api/application-types', authenticateToken, (req, res) => {
  const { db } = require('./db');
  const types = db.prepare('SELECT * FROM ApplicationType ORDER BY name').all();
  res.json(types);
});

// SPA fallback — redirect all non-API routes to index.html
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
  } else {
    res.status(404).json({ error: 'Endpoint not found' });
  }
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Внутренняя ошибка сервера' });
});

app.listen(PORT, () => {
  console.log(`\n🚀 Server running at http://localhost:${PORT}`);
  console.log(`📁 Frontend: http://localhost:${PORT}/pages/login.html`);
  console.log(`📡 API: http://localhost:${PORT}/api`);
  console.log('\nTest credentials:');
  console.log('  Login: admin | Password: admin123\n');
});
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
});
