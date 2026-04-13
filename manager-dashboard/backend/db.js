// FILE: backend/db.js
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'database.db');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');
db.pragma('journal_mode = WAL');

// Create all tables
function initializeDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS Department (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS Role (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS Employee (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name TEXT NOT NULL,
      contacts TEXT,
      position TEXT,
      birth_date TEXT,
      id_department INTEGER REFERENCES Department(id),
      id_role INTEGER REFERENCES Role(id),
      is_manager INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS Users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      id_employee INTEGER REFERENCES Employee(id),
      login TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL
    );

    CREATE TABLE IF NOT EXISTS WorkSchedule (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      id_employee INTEGER REFERENCES Employee(id),
      work_date TEXT NOT NULL,
      start_time TEXT,
      end_time TEXT
    );

    CREATE TABLE IF NOT EXISTS Events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      event_date TEXT NOT NULL,
      event_time TEXT,
      importance TEXT DEFAULT 'normal',
      event_type TEXT,
      id_organizer INTEGER REFERENCES Employee(id)
    );

    CREATE TABLE IF NOT EXISTS Employee_Event (
      id_employee INTEGER REFERENCES Employee(id),
      id_event INTEGER REFERENCES Events(id),
      role_in_event TEXT,
      PRIMARY KEY (id_employee, id_event)
    );

    CREATE TABLE IF NOT EXISTS TaskType (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT
    );

    CREATE TABLE IF NOT EXISTS Task (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      deadline TEXT,
      status TEXT DEFAULT 'new',
      percent_complete INTEGER DEFAULT 0,
      created_date TEXT DEFAULT (date('now')),
      id_author INTEGER REFERENCES Employee(id),
      id_type INTEGER REFERENCES TaskType(id)
    );

    CREATE TABLE IF NOT EXISTS Task_Employee (
      id_task INTEGER REFERENCES Task(id) ON DELETE CASCADE,
      id_employee INTEGER REFERENCES Employee(id),
      PRIMARY KEY (id_task, id_employee)
    );

    CREATE TABLE IF NOT EXISTS ApplicationType (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS Application (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      id_type INTEGER REFERENCES ApplicationType(id),
      id_employee INTEGER REFERENCES Employee(id),
      created_date TEXT DEFAULT (datetime('now')),
      comment TEXT,
      status TEXT DEFAULT 'pending',
      id_reviewed INTEGER REFERENCES Employee(id),
      reviewed_result TEXT
    );

    CREATE TABLE IF NOT EXISTS Notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      id_event INTEGER REFERENCES Events(id),
      id_employee INTEGER REFERENCES Employee(id),
      sent_at TEXT DEFAULT (datetime('now')),
      message TEXT
    );

    CREATE TABLE IF NOT EXISTS EmployeeScheduleWish (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      id_employee INTEGER REFERENCES Employee(id),
      wish_date TEXT NOT NULL,
      preferred_start TEXT,
      preferred_end TEXT,
      note TEXT
    );

    CREATE TABLE IF NOT EXISTS PasswordResetCodes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL,
      code TEXT NOT NULL,
      attempts INTEGER DEFAULT 0,
      created_at INTEGER NOT NULL,
      blocked_until INTEGER DEFAULT 0,
      used INTEGER DEFAULT 0
    );
  `);

  console.log('Database initialized successfully');
}

module.exports = { db, initializeDatabase };
