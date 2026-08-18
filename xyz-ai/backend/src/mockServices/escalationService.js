// Mock escalation service
const escalationData = {
  // Store escalations by session ID
  escalations: {},

  // Counters for generating IDs
  nextId: 1
};

class EscalationService {
  // Create a new escalation
  static createEscalation(sessionId, userId, type, reason) {
    const id = `esc${escalationData.nextId++}`;
    const escalation = {
      id,
      sessionId,
      userId,
      type, // 'teacher' or 'management'
      reason,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Store escalation
    if (!escalationData.escalations[sessionId]) {
      escalationData.escalations[sessionId] = [];
    }
    escalationData.escalations[sessionId].push(escalation);

    console.log(`[EscalationService] Created escalation:`, escalation);
    return escalation;
  }

  // Get escalations for a session
  static getEscalationsForSession(sessionId) {
    return escalationData.escalations[sessionId] || [];
  }

  // Get escalations for a user
  static getEscalationsForUser(userId) {
    const userEscalations = [];
    for (const sessionEscalations of Object.values(escalationData.escalations)) {
      for (const escalation of sessionEscalations) {
        if (escalation.userId === userId) {
          userEscalations.push(escalation);
        }
      }
    }
    return userEscalations;
  }

  // Update escalation status
  static updateEscalationStatus(escalationId, status, assignedTo = null) {
    let updated = false;
    for (const sessionEscalations of Object.values(escalationData.escalations)) {
      for (const escalation of sessionEscalations) {
        if (escalation.id === escalationId) {
          escalation.status = status;
          escalation.updatedAt = new Date().toISOString();
          if (assignedTo !== null) {
            escalation.assignedTo = assignedTo;
          }
          updated = true;
          console.log(`[EscalationService] Updated escalation ${escalationId}:`, escalation);
          break;
        }
      }
      if (updated) break;
    }
    return updated;
  }

  // Get pending escalations (for management/teacher view)
  static getPendingEscalations() {
    const pending = [];
    for (const sessionEscalations of Object.values(escalationData.escalations)) {
      for (const escalation of sessionEscalations) {
        if (escalation.status === 'pending') {
          pending.push(escalation);
        }
      }
    }
    return pending;
  }
}

module.exports = EscalationService;