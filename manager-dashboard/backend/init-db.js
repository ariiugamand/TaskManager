// FILE: backend/init-db.js
const { initializeDatabase } = require('./db');

try {
  initializeDatabase();
  console.log('✅ Database tables created successfully');
  process.exit(0);
} catch (err) {
  console.error('❌ Error initializing database:', err);
  process.exit(1);
}
