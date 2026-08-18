const request = require('supertest');
const app = require('../server');
const { getDatabase } = require('../db/init');
require('dotenv').config();

describe('Chat Endpoints', () => {
  let db;
  let testToken;
  let testUserId;

  beforeAll(async () => {
    db = getDatabase();

    // Create a test user directly with an explicit id
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash('password123', 10);
    const userId = `chat_test_student_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

    const result = db.prepare(`
      INSERT INTO users (id, email, password_hash, role, name)
      VALUES (?, ?, ?, ?, ?)
    `).run(userId, 'chat_test@example.com', hashedPassword, 'student', 'Chat Test Student');

    testUserId = userId;

    // Generate token
    testToken = require('jsonwebtoken').sign(
      { userId: testUserId, role: 'student', email: 'chat_test@example.com' },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );
  });

  afterAll(() => {
    // Cleanup
    db.prepare('DELETE FROM messages WHERE session_id LIKE ?').run('test_session_%');
    db.prepare('DELETE FROM sessions WHERE user_id = ?').run(testUserId);
    db.prepare('DELETE FROM users WHERE email = ?').run('chat_test@example.com');
  });

  describe('POST /api/chat', () => {
    it('should respond to a student attendance query', async () => {
      const res = await request(app)
        .post('/api/chat')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          sessionId: 'test_session_1',
          language: 'en',
          message: 'What is my attendance?'
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('reply');
      expect(res.body).toHaveProperty('sessionId');
      expect(res.body.reply).toContain('attendance');
    });

    it('should respond to a general greeting', async () => {
      const res = await request(app)
        .post('/api/chat')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          sessionId: 'test_session_2',
          language: 'en',
          message: 'Hello!'
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('reply');
      expect(res.body.reply).toContain('Academic Assistant');
    });

    it('should maintain conversation context', async () => {
      // First message
      await request(app)
        .post('/api/chat')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          sessionId: 'test_session_3',
          language: 'en',
          message: 'What is my attendance?'
        });

      // Follow up
      const res = await request(app)
        .post('/api/chat')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          sessionId: 'test_session_3',
          language: 'en',
          message: 'Show me last month'
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('reply');
    });

    it('should fail without authentication', async () => {
      const res = await request(app)
        .post('/api/chat')
        .send({
          sessionId: 'test_session_4',
          language: 'en',
          message: 'Hello'
        });

      expect(res.statusCode).toEqual(401);
    });

    it('should fail with missing required fields', async () => {
      const res = await request(app)
        .post('/api/chat')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          sessionId: 'test_session_5',
          language: 'en'
          // missing message
        });

      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('error');
    });
  });

  describe('GET /api/chat/history', () => {
    it('should return conversation history', async () => {
      const res = await request(app)
        .get('/api/chat/history?sessionId=test_session_3')
        .set('Authorization', `Bearer ${testToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('history');
      expect(Array.isArray(res.body.history)).toBe(true);
      expect(res.body.history.length).toBeGreaterThan(0);
    });

    it('should fail without authentication', async () => {
      const res = await request(app)
        .get('/api/chat/history?sessionId=test_session_3');

      expect(res.statusCode).toEqual(401);
    });

    it('should fail without sessionId', async () => {
      const res = await request(app)
        .get('/api/chat/history')
        .set('Authorization', `Bearer ${testToken}`);

      expect(res.statusCode).toEqual(400);
    });
  });

  describe('GET /api/chat/sessions', () => {
    it('should return all sessions for user', async () => {
      const res = await request(app)
        .get('/api/chat/sessions')
        .set('Authorization', `Bearer ${testToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('sessions');
      expect(Array.isArray(res.body.sessions)).toBe(true);
    });

    it('should fail without authentication', async () => {
      const res = await request(app)
        .get('/api/chat/sessions');

      expect(res.statusCode).toEqual(401);
    });
  });
});