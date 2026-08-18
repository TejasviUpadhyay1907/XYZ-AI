const express = require('express');
const router = express.Router();
const { handleMessage } = require('../services/ai/orchestrator');
const inputGuard = require('../middleware/inputGuard');

// POST /api/chat - uses authenticated user from JWT token
router.post('/chat', inputGuard, async (req, res) => {
  try {
    const { sessionId, language, message } = req.body;

    // Validate required fields (userId and role come from auth middleware)
    if (!sessionId || !language || !message) {
      return res.status(400).json({ error: 'Missing required fields: sessionId, language, message' });
    }

    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const input = {
      sessionId,
      userId: req.user.id,
      role: req.user.role,
      language,
      message
    };

    const output = await handleMessage(input);
    res.json(output);
  } catch (error) {
    console.error('Error in chat endpoint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/chat/history - get conversation history for current session
router.get('/chat/history', async (req, res) => {
  try {
    const { sessionId, limit = 20 } = req.query;

    if (!sessionId) {
      return res.status(400).json({ error: 'sessionId is required' });
    }

    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Verify session belongs to user
    const { getDatabase } = require('../../db/init');
    const db = getDatabase();
    const session = db.prepare('SELECT * FROM sessions WHERE id = ? AND user_id = ?').get(sessionId, req.user.id);

    if (!session) {
      return res.status(403).json({ error: 'Access denied to this session' });
    }

    const ConversationService = require('../services/conversationService');
    const history = ConversationService.getHistory(sessionId, parseInt(limit));
    res.json({ history });
  } catch (error) {
    console.error('Error getting chat history:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/chat/sessions - get all sessions for current user
router.get('/chat/sessions', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { getDatabase } = require('../../db/init');
    const db = getDatabase();
    const sessions = db.prepare('SELECT * FROM sessions WHERE user_id = ? ORDER BY updated_at DESC').all(req.user.id);
    res.json({ sessions });
  } catch (error) {
    console.error('Error getting sessions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;