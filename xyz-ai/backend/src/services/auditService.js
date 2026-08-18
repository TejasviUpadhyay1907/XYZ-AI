/**
 * Audit Service
 * Logs all tool calls, authorization decisions, and sensitive actions.
 */

const { getDatabase } = require('../../db/init');

class AuditService {
  constructor() {
    this.db = getDatabase();
    this._ensureTable();
    this._initStatements();
  }

  _ensureTable() {
    // Drop old audit_logs table if schema doesn't match
    try {
      this.db.prepare('SELECT request_id FROM audit_logs LIMIT 1').get();
    } catch (e) {
      // Column doesn't exist, recreate table
      this.db.exec('DROP TABLE IF EXISTS audit_logs');
    }

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        request_id TEXT,
        user_id TEXT NOT NULL,
        role TEXT NOT NULL,
        action TEXT NOT NULL,
        target_resource TEXT,
        target_id TEXT,
        result TEXT NOT NULL,
        reason TEXT,
        metadata TEXT,
        duration_ms INTEGER,
        created_at TEXT DEFAULT (datetime('now'))
      )
    `);
  }

  _initStatements() {
    this.insertStmt = this.db.prepare(`
      INSERT INTO audit_logs (request_id, user_id, role, action, target_resource, target_id, result, reason, metadata, duration_ms)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    this.getRecentStmt = this.db.prepare(`
      SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT ?
    `);

    this.getByRequestIdStmt = this.db.prepare(`
      SELECT * FROM audit_logs WHERE request_id = ? ORDER BY created_at ASC
    `);
  }

  logToolCall({ requestId, userId, role, toolName, args, result, durationMs }) {
    this.insertStmt.run(
      requestId || null, userId, role,
      `tool:${toolName}`,
      toolName,
      args?.student_name || args?.scope || null,
      result === 'error' ? 'FAILURE' : 'SUCCESS',
      null,
      JSON.stringify({ args }),
      durationMs || null
    );
  }

  logAuthDecision({ requestId, userId, role, action, targetResource, targetId, allowed, reason }) {
    this.insertStmt.run(
      requestId || null, userId, role,
      `auth:${action}`,
      targetResource || null,
      targetId || null,
      allowed ? 'ALLOWED' : 'DENIED',
      reason || null,
      null, null
    );
  }

  logSecurityEvent({ requestId, userId, role, eventType, details }) {
    this.insertStmt.run(
      requestId || null, userId || 'unknown', role || 'unknown',
      `security:${eventType}`,
      null, null,
      'BLOCKED',
      details || null,
      null, null
    );
  }

  logEscalation({ requestId, userId, role, target, reason, escalationId }) {
    this.insertStmt.run(
      requestId || null, userId, role,
      'escalation:create',
      target, escalationId || null,
      'SUCCESS',
      reason || null,
      null, null
    );
  }

  getRecent(limit = 50) {
    return this.getRecentStmt.all(limit).map(row => ({
      ...row,
      metadata: row.metadata ? JSON.parse(row.metadata) : null
    }));
  }

  getByRequestId(requestId) {
    return this.getByRequestIdStmt.all(requestId).map(row => ({
      ...row,
      metadata: row.metadata ? JSON.parse(row.metadata) : null
    }));
  }
}

module.exports = new AuditService();
