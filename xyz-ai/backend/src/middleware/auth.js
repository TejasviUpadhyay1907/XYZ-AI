/**
 * Authentication Middleware
 * JWT verification and role-based access control
 */

const authService = require('../services/authService');

/**
 * Middleware to verify JWT token and attach user to request
 */
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  const user = authService.getUserFromToken(token);
  if (!user) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  req.user = user;
  req.token = token;
  next();
}

/**
 * Middleware to require specific role(s)
 * @param {...string} roles - Allowed roles
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        requiredRoles: roles,
        currentRole: req.user.role
      });
    }

    next();
  };
}

/**
 * Middleware to allow optional authentication
 * Attaches user if token is valid, continues without user if not
 */
function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    const user = authService.getUserFromToken(token);
    if (user) {
      req.user = user;
      req.token = token;
    }
  }

  next();
}

/**
 * Check if user can access a specific student's data
 */
function canAccessStudent(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const targetStudentId = req.params.studentId || req.body.studentId || req.query.studentId;

  // If no specific student ID, allow (will be validated at service level)
  if (!targetStudentId) {
    return next();
  }

  const { role, id: userId } = req.user;

  // Students can only access their own data
  if (role === 'student') {
    if (userId !== targetStudentId) {
      return res.status(403).json({ error: 'Students can only access their own data' });
    }
    return next();
  }

  // Parents can only access their children's data
  if (role === 'parent') {
    const { getDatabase } = require('../../db/init');
    const db = getDatabase();

    const student = db.prepare('SELECT parent_id FROM students WHERE id = ?').get(targetStudentId);
    if (!student || student.parent_id !== userId) {
      return res.status(403).json({ error: 'Parents can only access their children\'s data' });
    }
    return next();
  }

  // Teachers and principals can access all students (validated at service level)
  if (role === 'teacher' || role === 'principal') {
    return next();
  }

  return res.status(403).json({ error: 'Access denied' });
}

module.exports = {
  authenticateToken,
  requireRole,
  optionalAuth,
  canAccessStudent
};