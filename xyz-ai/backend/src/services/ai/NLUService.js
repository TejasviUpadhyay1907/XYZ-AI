/**
 * Natural Language Understanding Service
 * Responsible for intent classification and entity extraction.
 * In a real production system, this would call an LLM with structured output or a dedicated NLU model.
 * For this implementation, we use a robust regex/pattern-based fallback that mimics an LLM's structured output.
 */

class NLUService {
  /**
   * Defines supported intents
   */
  static Intents = {
    GET_ATTENDANCE: 'get_attendance',
    MARK_ATTENDANCE: 'mark_attendance',
    ESCALATE: 'escalate',
    GET_SCHOOL_ANALYTICS: 'get_school_analytics',
    GENERAL_QUERY: 'general_query',
    UNKNOWN: 'unknown'
  };

  /**
   * Analyze message to extract intent and entities.
   * Matches the user message against patterns depending on the user's role.
   *
   * @param {string} message - User message
   * @param {string} role - User role (student, parent, teacher, principal)
   * @param {Array} context - Conversation history context
   * @returns {Object} { intent, entities, confidence }
   */
  async analyze(message, role, context = []) {
    const lowerMessage = message.toLowerCase();
    let intent = this.constructor.Intents.UNKNOWN;
    let entities = {};
    let confidence = 0.0;

    // VERY basic temporal resolution
    if (lowerMessage.includes('today')) entities.dateRange = 'today';
    else if (lowerMessage.includes('yesterday')) entities.dateRange = 'yesterday';
    else if (lowerMessage.includes('last month')) entities.dateRange = 'last_month';

    // Role-specific intent detection routing
    if (role === 'student' || role === 'parent') {
      const result = this._analyzeStudentParent(lowerMessage, role);
      intent = result.intent;
      entities = { ...entities, ...result.entities };
      confidence = result.confidence;
    } else if (role === 'teacher') {
      const result = this._analyzeTeacher(lowerMessage);
      intent = result.intent;
      entities = { ...entities, ...result.entities };
      confidence = result.confidence;
    } else if (role === 'principal') {
      const result = this._analyzePrincipal(lowerMessage);
      intent = result.intent;
      entities = { ...entities, ...result.entities };
      confidence = result.confidence;
    }

    // Context resolution (Anaphora/Follow-up)
    // If the message is short or ambiguous, check context for previous topics
    if (confidence < 0.6 && context && context.length > 0) {
      const resolved = this._resolveContext(lowerMessage, context, intent);
      if (resolved) {
        intent = resolved.intent;
        confidence = Math.max(confidence, 0.7); // Boost confidence due to context match
      }
    }

    return {
      intent: confidence > 0.4 ? intent : this.constructor.Intents.GENERAL_QUERY,
      entities,
      confidence
    };
  }

  _analyzeStudentParent(text, role) {
    let intent = this.constructor.Intents.UNKNOWN;
    let entities = {};
    let confidence = 0.0;

    // Escalations (check first to avoid conflict with attendance keywords)
    if (text.includes('escalate') || text.includes('contact the teacher')) {
      intent = this.constructor.Intents.ESCALATE;
      confidence = 0.95;

      const reasonMatch = text.match(/(?:escalate|contact the teacher)(?: about| regarding| for)? (.+)/i);
      if (reasonMatch) {
         entities.reason = reasonMatch[1].trim();
      }

      // Try to extract child name
      if (text.includes('rahul')) entities.studentName = 'rahul';
      if (text.includes('priya')) entities.studentName = 'priya';
      if (text.includes('arjun')) entities.studentName = 'arjun';

      // Extract target role (teacher or management)
      if (text.includes('management')) {
        entities.targetRole = 'management';
      } else if (text.includes('teacher')) {
        entities.targetRole = 'teacher';
      } else {
        // Default to teacher for parent escalations
        entities.targetRole = 'teacher';
      }
    }
    // Attendance Queries
    else if (text.includes('attendance') || text.includes('present') || text.includes('absent')) {
      intent = this.constructor.Intents.GET_ATTENDANCE;
      confidence = 0.9;

      if (role === 'parent') {
        const studentMatch = text.match(/(my child|child|\b[a-z]+)\b/i);
        if (studentMatch && studentMatch[1] !== 'my child' && studentMatch[1] !== 'child' && studentMatch[1] !== 'attendance') {
           // A better NER would go here, currently tries to capture the word right before/after contextual markers
           // For demo, we leave entity extraction simple and rely on orchestrator manual lookup
           if (text.includes('rahul')) entities.studentName = 'rahul';
           if (text.includes('priya')) entities.studentName = 'priya';
           if (text.includes('arjun')) entities.studentName = 'arjun';
        }
      }
    }

    return { intent, entities, confidence };
  }

  _analyzeTeacher(text) {
    let intent = this.constructor.Intents.UNKNOWN;
    let entities = {};
    let confidence = 0.0;

    // Mark Attendance
    if (text.includes('mark') && (text.includes('absent') || text.includes('present'))) {
      intent = this.constructor.Intents.MARK_ATTENDANCE;
      confidence = 0.95;

      entities.status = text.includes('absent') ? 'absent' : 'present';

      // Try to extract student name (Simplified NER)
      const names = ['rahul', 'priya', 'arjun'];
      for (const name of names) {
        if (text.includes(name)) {
          entities.studentName = name;
          break;
        }
      }
    }
    // Get class attendance
    else if (text.includes('attendance') && text.includes('my class')) {
      intent = this.constructor.Intents.GET_ATTENDANCE;
      confidence = 0.9;
      entities.scope = 'class';
    }
    // Escalate
    else if (text.includes('escalate') || text.includes('escalation')) {
      intent = this.constructor.Intents.ESCALATE;
      confidence = 0.95;

      const names = ['rahul', 'priya', 'arjun'];
      for (const name of names) {
        if (text.includes(name)) {
          entities.studentName = name;
          break;
        }
      }

      // Extract target role (teacher or management)
      if (text.includes('management')) {
        entities.targetRole = 'management';
      } else if (text.includes('teacher')) {
        entities.targetRole = 'teacher';
      } else {
        // Default to management for teacher escalations
        entities.targetRole = 'management';
      }

      const reasonMatch = text.match(/escalate(?: about| regarding|)? (.+)/i);
      if (reasonMatch) {
         entities.reason = reasonMatch[1].trim();
      }
    }

    return { intent, entities, confidence };
  }

  _analyzePrincipal(text) {
    let intent = this.constructor.Intents.UNKNOWN;
    let entities = {};
    let confidence = 0.0;

    if (text.includes('overall attendance') || text.includes('school attendance') || text.includes('analytics')) {
      intent = this.constructor.Intents.GET_SCHOOL_ANALYTICS;
      confidence = 0.95;
    }

    return { intent, entities, confidence };
  }

  _resolveContext(text, context, currentIntent) {
    // If current message is just "yes", "no", or refers to time, check previous assistant suggestions
    if (text.includes('last month') || text.includes('missed') || text.includes('detail')) {
       // Look back to see if recent topic was attendance
       for (const msg of context) {
         if (msg.role === 'assistant' && msg.content.toLowerCase().includes('attendance')) {
           return { intent: this.constructor.Intents.GET_ATTENDANCE };
         }
       }
    }
    return null;
  }
}

module.exports = new NLUService();
