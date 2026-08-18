/**
 * Authentication Service
 * Handles user authentication, JWT token generation and validation
 */

const { getDatabase } = require('../../db/init');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
const JWT_EXPIRES_IN = '24h';

class AuthService {
  constructor() {
    this.db = getDatabase();
    this._initStatements();
  }

  _initStatements() {
    this.getUserByEmailStmt = this.db.prepare(`
      SELECT * FROM users WHERE email = ?
    `);

    this.getUserByIdStmt = this.db.prepare(`
      SELECT * FROM users WHERE id = ?
    `);

    this.createUserStmt = this.db.prepare(`
      INSERT INTO users (id, email, password_hash, role, name, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `);

    this.updateLastLoginStmt = this.db.prepare(`
      UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `);
  }

  /**
   * Register a new user
   * @param {Object} userData - User registration data
   * @returns {Object} Created user (without password hash) and JWT token
   */
  register({ email, password, role, name }) {
    // Check if user already exists
    const existing = this.getUserByEmailStmt.get(email);
    if (existing) {
      throw new Error('User with this email already exists');
    }

    // Validate role
    const validRoles = ['student', 'parent', 'teacher', 'principal'];
    if (!validRoles.includes(role)) {
      throw new Error('Invalid role');
    }

    // Hash password
    const passwordHash = bcrypt.hashSync(password, 10);

    // Generate user ID
    const userId = `${role}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

    // Create user
    this.createUserStmt.run(userId, email, passwordHash, role, name);

    // Generate JWT token
    const token = jwt.sign(
      { userId: userId, role: role, email: email },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // Return user without password hash and token
    const user = this.getUserById(userId);
    return {
      user,
      token
    };
  }

  /**
   * Login user
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Object} User object and JWT token
   */
  login(email, password) {
    const user = this.getUserByEmailStmt.get(email);
    if (!user) {
      throw new Error('Invalid email or password');
    }

    const isValid = bcrypt.compareSync(password, user.password_hash);
    if (!isValid) {
      throw new Error('Invalid email or password');
    }

    // Update last login
    this.updateLastLoginStmt.run(user.id);

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, role: user.role, email: user.email },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // Return user without password hash
    const { password_hash, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      token
    };
  }

  /**
   * Get user by ID
   * @param {string} userId - User ID
   * @returns {Object|null} User object (without password hash)
   */
  getUserById(userId) {
    const user = this.getUserByIdStmt.get(userId);
    if (!user) return null;
    const { password_hash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  /**
   * Verify JWT token
   * @param {string} token - JWT token
   * @returns {Object|null} Decoded token payload or null if invalid
   */
  verifyToken(token) {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (error) {
      return null;
    }
  }

  /**
   * Get user from token
   * @param {string} token - JWT token
   * @returns {Object|null} User object or null
   */
  getUserFromToken(token) {
    const decoded = this.verifyToken(token);
    if (!decoded) return null;
    return this.getUserById(decoded.userId);
  }
}

module.exports = new AuthService();