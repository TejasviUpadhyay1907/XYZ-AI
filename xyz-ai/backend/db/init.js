/**
 * Database initialization module
 * Creates SQLite database schema and seeds demo data
 */

const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

const DB_PATH = path.join(__dirname, 'school.db');

// Initialize database connection
const db = new Database(DB_PATH);

// Enable foreign keys
db.pragma('foreign_keys = ON');

/**
 * Create all tables
 */
function createTables() {
  // Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('student', 'parent', 'teacher', 'principal')),
      name TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Students table
  db.exec(`
    CREATE TABLE IF NOT EXISTS students (
      id TEXT PRIMARY KEY,
      user_id TEXT UNIQUE NOT NULL,
      grade TEXT NOT NULL,
      section TEXT NOT NULL,
      roll_number INTEGER NOT NULL,
      date_of_birth TEXT,
      parent_id TEXT,
      email TEXT,
      phone TEXT,
      address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (parent_id) REFERENCES users(id)
    )
  `);

  // Teachers table
  db.exec(`
    CREATE TABLE IF NOT EXISTS teachers (
      id TEXT PRIMARY KEY,
      user_id TEXT UNIQUE NOT NULL,
      subject TEXT NOT NULL,
      department TEXT NOT NULL,
      employee_id TEXT UNIQUE NOT NULL,
      email TEXT,
      phone TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Attendance records table
  db.exec(`
    CREATE TABLE IF NOT EXISTS attendance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id TEXT NOT NULL,
      date TEXT NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'late', 'excused')),
      marked_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (student_id) REFERENCES students(id),
      FOREIGN KEY (marked_by) REFERENCES users(id),
      UNIQUE(student_id, date)
    )
  `);

  // Sessions table (conversation sessions)
  db.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      role TEXT NOT NULL,
      language TEXT DEFAULT 'en',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Messages table (conversation history)
  db.exec(`
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT NOT NULL,
      sender TEXT NOT NULL CHECK (sender IN ('user', 'assistant')),
      content TEXT NOT NULL,
      metadata TEXT, -- JSON for suggestedFollowUps, needsClarification, etc.
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (session_id) REFERENCES sessions(id)
    )
  `);

  // Escalations table
  db.exec(`
    CREATE TABLE IF NOT EXISTS escalations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('teacher', 'management')),
      reason TEXT NOT NULL,
      status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'assigned', 'resolved', 'closed')),
      assigned_to TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (session_id) REFERENCES sessions(id),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (assigned_to) REFERENCES users(id)
    )
  `);

  // Audit logs table
  db.exec(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT,
      action TEXT NOT NULL,
      resource_type TEXT,
      resource_id TEXT,
      payload_hash TEXT,
      ip_address TEXT,
      user_agent TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Create indexes for common queries
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_attendance_student_date ON attendance(student_id, date);
    CREATE INDEX IF NOT EXISTS idx_messages_session ON messages(session_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_escalations_user ON escalations(user_id);
    CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(user_id);
  `);

  console.log('Database tables created successfully');
}

/**
 * Seed demo data
 */
function seedData() {
  // Check if already seeded
  const existingUser = db.prepare('SELECT id FROM users WHERE id = ?').get('student123');
  if (existingUser) {
    console.log('Database already seeded, skipping...');
    return;
  }

  const passwordHash = bcrypt.hashSync('demo123', 10);
  const now = new Date().toISOString();

  // Insert demo users
  const insertUser = db.prepare(`
    INSERT INTO users (id, email, password_hash, role, name, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const users = [
    ['student123', 'rahul.student@xyz.edu', passwordHash, 'student', 'Rahul Sharma', now, now],
    ['student456', 'priya.student@xyz.edu', passwordHash, 'student', 'Priya Patel', now, now],
    ['student789', 'arjun.student@xyz.edu', passwordHash, 'student', 'Arjun Singh', now, now],
    ['parent001', 'parent1@xyz.edu', passwordHash, 'parent', 'Mr. Sharma', now, now],
    ['parent002', 'parent2@xyz.edu', passwordHash, 'parent', 'Mrs. Singh', now, now],
    ['teacher001', 'priya.teacher@xyz.edu', passwordHash, 'teacher', 'Ms. Priya Desai', now, now],
    ['teacher002', 'amit.teacher@xyz.edu', passwordHash, 'teacher', 'Mr. Amit Kumar', now, now],
    ['principal001', 'principal@xyz.edu', passwordHash, 'principal', 'Dr. School Principal', now, now],
  ];

  const insertMany = db.transaction((users) => {
    for (const user of users) {
      insertUser.run(...user);
    }
  });
  insertMany(users);

  // Insert student profiles
  const insertStudent = db.prepare(`
    INSERT INTO students (id, user_id, grade, section, roll_number, date_of_birth, parent_id, email, phone, address, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const students = [
    ['student123', 'student123', '10th', 'B', 23, '2008-05-15', 'parent001', 'rahul.student@xyz.edu', '555-0123', '123 School Street, Cityville', now, now],
    ['student456', 'student456', '9th', 'A', 12, '2009-08-22', 'parent001', 'priya.student@xyz.edu', '555-0456', '456 Learning Ave, Cityville', now, now],
    ['student789', 'student789', '11th', 'C', 34, '2007-11-03', 'parent002', 'arjun.student@xyz.edu', '555-0789', '789 Knowledge Rd, Cityville', now, now],
  ];

  const insertStudents = db.transaction((students) => {
    for (const student of students) {
      insertStudent.run(...student);
    }
  });
  insertStudents(students);

  // Insert teacher profiles
  const insertTeacher = db.prepare(`
    INSERT INTO teachers (id, user_id, subject, department, employee_id, email, phone, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const teachers = [
    ['teacher001', 'teacher001', 'Mathematics', 'STEM', 'TCH001', 'priya.teacher@xyz.edu', '555-1000', now, now],
    ['teacher002', 'teacher002', 'English', 'Humanities', 'TCH002', 'amit.teacher@xyz.edu', '555-2000', now, now],
  ];

  const insertTeachers = db.transaction((teachers) => {
    for (const teacher of teachers) {
      insertTeacher.run(...teacher);
    }
  });
  insertTeachers(teachers);

  // Insert attendance records for the last 7 days
  const insertAttendance = db.prepare(`
    INSERT INTO attendance (student_id, date, status, marked_by, created_at)
    VALUES (?, ?, ?, ?, ?)
  `);

  const attendanceRecords = [
    // student123 (Rahul) - 90% attendance
    ['student123', '2026-08-10', 'present', 'teacher001', now],
    ['student123', '2026-08-11', 'present', 'teacher001', now],
    ['student123', '2026-08-12', 'present', 'teacher001', now],
    ['student123', '2026-08-13', 'absent', 'teacher001', now],
    ['student123', '2026-08-14', 'present', 'teacher001', now],
    ['student123', '2026-08-15', 'present', 'teacher001', now],
    ['student123', '2026-08-16', 'present', 'teacher001', now],
    // student456 (Priya) - ~80% attendance
    ['student456', '2026-08-10', 'absent', 'teacher001', now],
    ['student456', '2026-08-11', 'present', 'teacher001', now],
    ['student456', '2026-08-12', 'present', 'teacher001', now],
    ['student456', '2026-08-13', 'present', 'teacher001', now],
    ['student456', '2026-08-14', 'absent', 'teacher001', now],
    ['student456', '2026-08-15', 'present', 'teacher001', now],
    ['student456', '2026-08-16', 'present', 'teacher001', now],
    // student789 (Arjun) - ~92% attendance
    ['student789', '2026-08-10', 'present', 'teacher002', now],
    ['student789', '2026-08-11', 'present', 'teacher002', now],
    ['student789', '2026-08-12', 'present', 'teacher002', now],
    ['student789', '2026-08-13', 'present', 'teacher002', now],
    ['student789', '2026-08-14', 'absent', 'teacher002', now],
    ['student789', '2026-08-15', 'present', 'teacher002', now],
    ['student789', '2026-08-16', 'present', 'teacher002', now],
  ];

  const insertAttendanceRecords = db.transaction((records) => {
    for (const record of records) {
      insertAttendance.run(...record);
    }
  });
  insertAttendanceRecords(attendanceRecords);

  console.log('Demo data seeded successfully');
}

/**
 * Initialize database - create tables and seed data
 */
function initializeDatabase() {
  try {
    createTables();
    seedData();
    console.log('Database initialized successfully');
    return true;
  } catch (error) {
    console.error('Database initialization failed:', error);
    throw error;
  }
}

/**
 * Get database instance
 */
function getDatabase() {
  return db;
}

/**
 * Close database connection
 */
function closeDatabase() {
  db.close();
  console.log('Database connection closed');
}

module.exports = {
  initializeDatabase,
  getDatabase,
  closeDatabase,
  db
};