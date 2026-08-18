/**
 * Admin API Routes
 * Exposes audit logs and trace data for the admin/demo panel.
 * Only accessible by principal role (admin).
 */

const express = require('express');
const router = express.Router();
const AuditService = require('../services/auditService');

// GET /api/admin/audit - Get recent audit logs
router.get('/audit', (req, res) => {
  try {
    // Only principal/admin can view audit logs
    if (req.user.role !== 'principal') {
      return res.status(403).json({ error: 'Only management can access audit logs' });
    }

    const limit = parseInt(req.query.limit) || 50;
    const logs = AuditService.getRecent(Math.min(limit, 200));
    res.json({ logs });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

// GET /api/admin/audit/:requestId - Get audit trail for a specific request
router.get('/audit/:requestId', (req, res) => {
  try {
    if (req.user.role !== 'principal') {
      return res.status(403).json({ error: 'Only management can access audit logs' });
    }

    const logs = AuditService.getByRequestId(req.params.requestId);
    res.json({ logs });
  } catch (error) {
    console.error('Error fetching audit by request ID:', error);
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

// GET /api/admin/traces - Get recent traces (stored in memory for demo)
// In production this would be a separate trace store
const traceStore = [];
const MAX_TRACES = 100;

function storeTrace(trace) {
  traceStore.unshift(trace);
  if (traceStore.length > MAX_TRACES) {
    traceStore.pop();
  }
}

router.get('/traces', (req, res) => {
  try {
    if (req.user.role !== 'principal') {
      return res.status(403).json({ error: 'Only management can access traces' });
    }

    const limit = parseInt(req.query.limit) || 20;
    res.json({ traces: traceStore.slice(0, limit) });
  } catch (error) {
    console.error('Error fetching traces:', error);
    res.status(500).json({ error: 'Failed to fetch traces' });
  }
});

// GET /api/admin/stats - Summary statistics
router.get('/stats', (req, res) => {
  try {
    if (req.user.role !== 'principal') {
      return res.status(403).json({ error: 'Only management can access stats' });
    }

    const recentLogs = AuditService.getRecent(100);

    const stats = {
      total_requests: traceStore.length,
      total_audit_entries: recentLogs.length,
      tool_calls: recentLogs.filter(l => l.action.startsWith('tool:')).length,
      auth_decisions: recentLogs.filter(l => l.action.startsWith('auth:')).length,
      security_events: recentLogs.filter(l => l.action.startsWith('security:')).length,
      escalations: recentLogs.filter(l => l.action.startsWith('escalation:')).length,
      denied_count: recentLogs.filter(l => l.result === 'DENIED' || l.result === 'BLOCKED').length,
      avg_duration_ms: traceStore.length > 0
        ? Math.round(traceStore.reduce((sum, t) => sum + (t.total_duration_ms || 0), 0) / traceStore.length)
        : 0
    };

    res.json({ stats });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

module.exports = { adminRouter: router, storeTrace };
