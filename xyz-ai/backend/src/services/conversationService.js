/**
 * Conversation Service
 * Handles persistent session and message storage for conversation memory
 */

const { getDatabase } = require('../../db/init');

class ConversationService {
  constructor() {
    this.db = getDatabase();
    this._initStatements();
  }

  _initStatements() {
    // Session statements
    this.createSessionStmt = this.db.prepare(`
      INSERT INTO sessions (id, user_id, role, language, created_at, updated_at)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `);

    this.getSessionStmt = this.db.prepare(`
      SELECT * FROM sessions WHERE id = ?
    `);

    this.getSessionByUserStmt = this.db.prepare(`
      SELECT * FROM sessions WHERE user_id = ? ORDER BY updated_at DESC LIMIT 1
    `);

    this.updateSessionStmt = this.db.prepare(`
      UPDATE sessions SET language = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `);

    // Message statements
    this.addMessageStmt = this.db.prepare(`
      INSERT INTO messages (session_id, sender, content, metadata, created_at)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);

    this.getMessagesStmt = this.db.prepare(`
      SELECT * FROM messages WHERE session_id = ? ORDER BY created_at ASC LIMIT ?
    `);

    this.getRecentMessagesStmt = this.db.prepare(`
      SELECT * FROM messages WHERE session_id = ? ORDER BY created_at DESC LIMIT ?
    `);

    this.getMessageCountStmt = this.db.prepare(`
      SELECT COUNT(*) as count FROM messages WHERE session_id = ?
    `);

    // Cleanup old sessions (optional)
    this.deleteOldSessionsStmt = this.db.prepare(`
      DELETE FROM sessions WHERE updated_at < datetime('now', '-30 days')
    `);
  }

  /**
   * Create a new conversation session
   * @param {string} sessionId - Unique session identifier
   * @param {string} userId - User ID
   * @param {string} role - User role
   * @param {string} language - Language code
   * @returns {Object} Created session
   */
  createSession(sessionId, userId, role, language = 'en') {
    try {
      this.createSessionStmt.run(sessionId, userId, role, language);
      return this.getSession(sessionId);
    } catch (error) {
      if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        // Session already exists, return it
        return this.getSession(sessionId);
      }
      throw error;
    }
  }

  /**
   * Get session by ID
   * @param {string} sessionId - Session ID
   * @returns {Object|null} Session or null if not found
   */
  getSession(sessionId) {
    return this.getSessionStmt.get(sessionId) || null;
  }

  /**
   * Get or create session for user
   * @param {string} userId - User ID
   * @param {string} role - User role
   * @param {string} language - Language code
   * @param {string} sessionId - Optional existing session ID
   * @returns {Object} Session
   */
  getOrCreateSession(userId, role, language = 'en', sessionId = null) {
    if (sessionId) {
      const existing = this.getSession(sessionId);
      if (existing) {
        // Update language if changed
        if (existing.language !== language) {
          this.updateSessionStmt.run(language, sessionId);
          existing.language = language;
        }
        return existing;
      }

      // If a specific sessionId was requested but doesn't exist, create it with that ID
      return this.createSession(sessionId, userId, role, language);
    }

    // Try to get existing session for user only if no sessionId was requested
    const existing = this.getSessionByUserStmt.get(userId);
    if (existing) {
      if (existing.language !== language) {
        this.updateSessionStmt.run(language, existing.id);
        existing.language = language;
      }
      return existing;
    }

    // Create new session with a random ID
    const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    return this.createSession(newSessionId, userId, role, language);
  }

  /**
   * Add a message to the conversation
   * @param {string} sessionId - Session ID
   * @param {'user'|'assistant'} sender - Message sender
   * @param {string} content - Message content
   * @param {Object} metadata - Optional metadata (suggestedFollowUps, needsClarification, etc.)
   * @returns {Object} Created message
   */
  addMessage(sessionId, sender, content, metadata = {}) {
    const metaJson = JSON.stringify(metadata);
    const result = this.addMessageStmt.run(sessionId, sender, content, metaJson);
    return {
      id: result.lastInsertRowid,
      session_id: sessionId,
      sender,
      content,
      metadata,
      created_at: new Date().toISOString()
    };
  }

  /**
   * Get conversation history for a session
   * @param {string} sessionId - Session ID
   * @param {number} limit - Maximum number of messages to retrieve
   * @returns {Array} Array of messages (oldest first)
   */
  getHistory(sessionId, limit = 20) {
    const messages = this.getMessagesStmt.all(sessionId, limit);
    return messages.map(msg => ({
      ...msg,
      metadata: msg.metadata ? JSON.parse(msg.metadata) : {}
    }));
  }

  /**
   * Get recent conversation history (for context injection)
   * @param {string} sessionId - Session ID
   * @param {number} limit - Maximum number of recent messages
   * @returns {Array} Array of recent messages (newest first)
   */
  getRecentHistory(sessionId, limit = 10) {
    const messages = this.getRecentMessagesStmt.all(sessionId, limit);
    return messages.map(msg => ({
      ...msg,
      metadata: msg.metadata ? JSON.parse(msg.metadata) : {}
    })).reverse(); // Return oldest first for context
  }

  /**
   * Format history for LLM context
   * @param {string} sessionId - Session ID
   * @param {number} limit - Number of message pairs to include
   * @returns {string} Formatted conversation history
   */
  formatHistoryForContext(sessionId, limit = 5) {
    const messages = this.getRecentHistory(sessionId, limit * 2);
    if (messages.length === 0) return '';

    const formatted = messages.map(msg => {
      const role = msg.sender === 'user' ? 'User' : 'Assistant';
      return `${role}: ${msg.content}`;
    }).join('\n');

    return `Previous conversation:\n${formatted}\n\n`;
  }

  /**
   * Get message count for a session
   * @param {string} sessionId - Session ID
   * @returns {number} Message count
   */
  getMessageCount(sessionId) {
    const result = this.getMessageCountStmt.get(sessionId);
    return result?.count || 0;
  }

  /**
   * Clean up old sessions (maintenance)
   * @returns {number} Number of deleted sessions
   */
  cleanupOldSessions() {
    const result = this.deleteOldSessionsStmt.run();
    return result.changes;
  }
}

// Export singleton instance
module.exports = new ConversationService();