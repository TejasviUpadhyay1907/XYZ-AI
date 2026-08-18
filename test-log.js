const request = require('supertest');
const app = require('./xyz-ai/backend/server');
const { getDatabase } = require('./xyz-ai/backend/db/init');
const db = getDatabase();

async function run() {
  const bcrypt = require('bcryptjs');
  const hashedPassword = await bcrypt.hash('password123', 10);
  const userId = `chat_test_student_12345`;

  db.prepare(`
    INSERT INTO users (id, email, password_hash, role, name)
    VALUES (?, ?, ?, ?, ?)
  `).run(userId, 'chat_test2@example.com', hashedPassword, 'student', 'Chat Test Student');

  const testToken = require('jsonwebtoken').sign(
    { userId, role: 'student', email: 'chat_test2@example.com' },
    'test-secret',
    { expiresIn: '1h' }
  );

  const res1 = await request(app)
    .post('/api/chat')
    .set('Authorization', `Bearer ${testToken}`)
    .send({
      sessionId: 'test_session_3_debug',
      language: 'en',
      message: 'What is my attendance?'
    });

  const res2 = await request(app)
    .get('/api/chat/history?sessionId=test_session_3_debug')
    .set('Authorization', `Bearer ${testToken}`);

  console.log("POST res:", res1.body);
  console.log("GET res:", res2.statusCode, res2.body);
  
  db.prepare('DELETE FROM messages WHERE session_id = ?').run('test_session_3_debug');
  db.prepare('DELETE FROM sessions WHERE id = ?').run('test_session_3_debug');
  db.prepare('DELETE FROM users WHERE id = ?').run(userId);
}
run();
