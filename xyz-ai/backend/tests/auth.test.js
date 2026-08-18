const request = require('supertest');
const app = require('../server');
const { getDatabase } = require('../db/init');
const jwt = require('jsonwebtoken');
require('dotenv').config();

describe('Authentication Endpoints', () => {
  let db;
  let testUserToken;

  beforeAll(() => {
    db = getDatabase();
    // Clear test data
    db.prepare('DELETE FROM users WHERE email = ?').run('test@example.com');
  });

  afterAll(() => {
    // Cleanup
    db.prepare('DELETE FROM users WHERE email = ?').run('test@example.com');
  });

  describe('POST /api/auth/register', () => {
    it('should register a new student user', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'password123',
          role: 'student',
          name: 'Test Student'
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user).toHaveProperty('email', 'test@example.com');
      expect(res.body.user).toHaveProperty('role', 'student');

      // Save token for later tests
      testUserToken = res.body.token;
    });

    it('should hash the password', async () => {
      const user = db.prepare('SELECT * FROM users WHERE email = ?').get('test@example.com');
      expect(user.password_hash).not.toBe('password123');
      expect(user.password_hash).toHaveLength(60); // bcrypt hash length
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user).toHaveProperty('email', 'test@example.com');
    });

    it('should fail with invalid password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword'
        });

      expect(res.statusCode).toEqual(401);
      expect(res.body).toHaveProperty('error');
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return user info with valid token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${testUserToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.user).toHaveProperty('email', 'test@example.com');
      expect(res.body.user).toHaveProperty('role', 'student');
    });

    it('should fail with invalid token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalidtoken');

      expect(res.statusCode).toEqual(401);
    });
  });
});