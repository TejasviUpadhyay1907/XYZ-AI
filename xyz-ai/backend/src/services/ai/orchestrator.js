/**
 * AI Orchestrator - LLM-Powered with Function Calling
 * 
 * Flow:
 * 1. Get conversation history
 * 2. Send message + history + tools to LLM (Groq)
 * 3. If LLM requests a tool call → execute tool → feed result back to LLM
 * 4. LLM generates natural response
 * 5. Save to conversation DB
 */

const ConversationService = require('../conversationService');
const LLMService = require('./LLMService');
const AttendanceService = require('../../mockServices/attendanceService');
const StudentService = require('../../mockServices/studentService');
const EscalationService = require('../../mockServices/escalationService');

/**
 * @typedef {Object} ChatInput
 * @property {string} sessionId
 * @property {string} userId
 * @property {'student'|'parent'|'teacher'|'principal'} role
 * @property {string} language
 * @property {string} message
 */

/**
 * @typedef {Object} ChatOutput
 * @property {string} reply
 * @property {string[]} [suggestedFollowUps]
 * @property {boolean} [needsClarification]
 */

/**
 * Execute a tool call from the LLM
 * @param {string} toolName - Name of the tool to execute
 * @param {Object} args - Arguments from the LLM
 * @param {Object} context - User context (userId, role, etc.)
 * @returns {string} - JSON string result for the LLM
 */
function executeTool(toolName, args, context) {
  const { userId, role } = context;

  switch (toolName) {
    case 'get_attendance': {
      const { student_name, scope } = args;

      if (scope === 'self' && role === 'student') {
        const attendance = AttendanceService.getStudentAttendance(userId);
        const student = StudentService.getStudentProfile(userId);
        return JSON.stringify({
          student_name: student?.name || 'You',
          total_days: attendance.total,
          present: attendance.present,
          absent: attendance.absent,
          percentage: attendance.total > 0 ? ((attendance.present / attendance.total) * 100).toFixed(1) : '0',
          recent: attendance.recent.slice(0, 5)
        });
      }

      if (scope === 'child' && role === 'parent') {
        const children = AttendanceService.getChildrenForParent(userId);
        if (children.length === 0) {
          return JSON.stringify({ error: 'No children linked to this parent account.' });
        }

        // If student name specified, find that child
        if (student_name) {
          const lowerName = student_name.toLowerCase();
          for (const childId of children) {
            const student = StudentService.getStudentProfile(childId);
            if (student && student.name.toLowerCase().includes(lowerName)) {
              const attendance = AttendanceService.getStudentAttendance(childId);
              return JSON.stringify({
                student_name: student.name,
                grade: student.grade,
                section: student.section,
                total_days: attendance.total,
                present: attendance.present,
                absent: attendance.absent,
                percentage: ((attendance.present / attendance.total) * 100).toFixed(1),
                recent: attendance.recent.slice(0, 5)
              });
            }
          }
          return JSON.stringify({ error: `Could not find a child named "${student_name}".` });
        }

        // If only one child, return their data
        if (children.length === 1) {
          const childId = children[0];
          const student = StudentService.getStudentProfile(childId);
          const attendance = AttendanceService.getStudentAttendance(childId);
          return JSON.stringify({
            student_name: student?.name || childId,
            grade: student?.grade,
            section: student?.section,
            total_days: attendance.total,
            present: attendance.present,
            absent: attendance.absent,
            percentage: ((attendance.present / attendance.total) * 100).toFixed(1),
            recent: attendance.recent.slice(0, 5)
          });
        }

        // Multiple children — return list for LLM to ask which one
        const childrenList = children.map(childId => {
          const student = StudentService.getStudentProfile(childId);
          return { id: childId, name: student?.name || 'Unknown', grade: student?.grade };
        });
        return JSON.stringify({
          multiple_children: true,
          children: childrenList,
          message: 'Parent has multiple children. Ask which child they want to check.'
        });
      }

      if (scope === 'class' && role === 'teacher') {
        const teacherId = userId || 'teacher001';
        const students = StudentService.getStudentsForTeacher(teacherId);
        const classData = students.map(student => {
          const att = AttendanceService.getStudentAttendance(student.id);
          return {
            name: student.name,
            grade: student.grade,
            section: student.section,
            present: att.present,
            total: att.total,
            percentage: ((att.present / att.total) * 100).toFixed(1)
          };
        });
        return JSON.stringify({ class_attendance: classData });
      }

      if (scope === 'school' && role === 'principal') {
        const analytics = AttendanceService.getSchoolAttendance();
        return JSON.stringify(analytics);
      }

      // Teacher looking up specific student
      if (role === 'teacher' && student_name) {
        let studentId = null;
        const lowerName = student_name.toLowerCase();
        if (lowerName.includes('rahul')) studentId = 'student123';
        else if (lowerName.includes('priya')) studentId = 'student456';
        else if (lowerName.includes('arjun')) studentId = 'student789';

        if (studentId) {
          const student = StudentService.getStudentProfile(studentId);
          const attendance = AttendanceService.getStudentAttendance(studentId);
          return JSON.stringify({
            student_name: student?.name,
            grade: student?.grade,
            total_days: attendance.total,
            present: attendance.present,
            absent: attendance.absent,
            percentage: ((attendance.present / attendance.total) * 100).toFixed(1),
            recent: attendance.recent.slice(0, 5)
          });
        }
        return JSON.stringify({ error: `Student "${student_name}" not found.` });
      }

      return JSON.stringify({ error: 'Could not determine which attendance to fetch.' });
    }

    case 'mark_attendance': {
      const { student_name, status, date } = args;

      if (role !== 'teacher') {
        return JSON.stringify({ error: 'Only teachers can mark attendance.' });
      }

      let studentId = null;
      const lowerName = (student_name || '').toLowerCase();
      if (lowerName.includes('rahul')) studentId = 'student123';
      else if (lowerName.includes('priya')) studentId = 'student456';
      else if (lowerName.includes('arjun')) studentId = 'student789';

      if (!studentId) {
        return JSON.stringify({ error: `Student "${student_name}" not found. Available: Rahul Sharma, Priya Patel, Arjun Singh.` });
      }

      const teacherId = userId || 'teacher001';
      if (!StudentService.canTeacherAccessStudent(teacherId, studentId)) {
        return JSON.stringify({ error: 'You are not authorized to mark attendance for this student.' });
      }

      const attendanceDate = date || new Date().toISOString().split('T')[0];
      AttendanceService.markAttendance(studentId, attendanceDate, status, teacherId);

      const student = StudentService.getStudentProfile(studentId);
      return JSON.stringify({
        success: true,
        student_name: student?.name || student_name,
        status: status,
        date: attendanceDate
      });
    }

    case 'create_escalation': {
      const { target, reason, student_name } = args;

      if (!['parent', 'teacher'].includes(role)) {
        return JSON.stringify({ error: 'Only parents and teachers can create escalations.' });
      }

      // Validate target based on role
      if (role === 'parent' && target !== 'teacher') {
        return JSON.stringify({ error: 'Parents can only escalate to teachers.' });
      }
      if (role === 'teacher' && target !== 'management') {
        return JSON.stringify({ error: 'Teachers can only escalate to management.' });
      }

      const escalation = EscalationService.createEscalation(
        context.sessionId || 'session',
        userId,
        target,
        reason || `Escalation regarding ${student_name || 'a concern'}`
      );

      return JSON.stringify({
        success: true,
        escalation_id: escalation.id,
        status: escalation.status,
        target: target,
        message: `Escalation request submitted to ${target}. ID: ${escalation.id}`
      });
    }

    case 'get_school_analytics': {
      if (role !== 'principal') {
        return JSON.stringify({ error: 'Only the principal can access school analytics.' });
      }

      const analytics = AttendanceService.getSchoolAttendance();
      return JSON.stringify(analytics);
    }

    default:
      return JSON.stringify({ error: `Unknown tool: ${toolName}` });
  }
}

/**
 * Handles a chat message using the LLM
 * @param {ChatInput} input
 * @returns {Promise<ChatOutput>}
 */
async function handleMessage(input) {
  const { sessionId, userId, role, language, message } = input;

  // Get or create conversation session
  const session = ConversationService.getOrCreateSession(userId, role, language, sessionId);

  // Get conversation history and format for LLM
  const history = ConversationService.getRecentHistory(session.id, 10);
  const llmMessages = [];

  // Convert history to LLM message format
  if (history && history.length > 0) {
    for (const msg of history) {
      if (msg.sender === 'user') {
        llmMessages.push({ role: 'user', content: msg.content });
      } else if (msg.sender === 'assistant') {
        llmMessages.push({ role: 'assistant', content: msg.content });
      }
    }
  }

  // Add current user message
  llmMessages.push({ role: 'user', content: message });

  // Save user message to DB
  ConversationService.addMessage(session.id, 'user', message);

  let reply = '';
  let suggestedFollowUps = [];
  let needsClarification = false;

  try {
    // Call LLM
    let llmResponse = await LLMService.chat(llmMessages, role, language);
    console.log('[Orchestrator] LLM response:', JSON.stringify(llmResponse, null, 2));

    // Handle tool calls (may be multiple rounds)
    let iterations = 0;
    const MAX_ITERATIONS = 3;

    while (llmResponse.tool_calls && llmResponse.tool_calls.length > 0 && iterations < MAX_ITERATIONS) {
      iterations++;
      console.log(`[Orchestrator] Processing ${llmResponse.tool_calls.length} tool call(s), iteration ${iterations}`);

      // Add assistant message with tool calls to conversation
      llmMessages.push(llmResponse);

      // Execute each tool call
      for (const toolCall of llmResponse.tool_calls) {
        const toolName = toolCall.function.name;
        let toolArgs = {};

        try {
          toolArgs = JSON.parse(toolCall.function.arguments);
        } catch (e) {
          console.error('[Orchestrator] Failed to parse tool args:', toolCall.function.arguments);
        }

        console.log(`[Orchestrator] Executing tool: ${toolName}`, toolArgs);

        const context = { userId, role, sessionId: session.id };
        const toolResult = executeTool(toolName, toolArgs, context);

        console.log(`[Orchestrator] Tool result:`, toolResult);

        // Add tool result to messages
        llmMessages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          content: toolResult
        });
      }

      // Call LLM again with tool results
      llmResponse = await LLMService.chatWithToolResults(llmMessages, role, language);
      console.log('[Orchestrator] LLM response after tools:', JSON.stringify(llmResponse, null, 2));
    }

    // Extract final text reply
    reply = llmResponse.content || "I'm sorry, I couldn't process that request. Could you try rephrasing?";

    // Generate follow-up suggestions based on role
    suggestedFollowUps = generateSuggestedFollowUps(role, message, reply);

  } catch (error) {
    console.error('[Orchestrator] Error:', error.message);

    // Fallback response if LLM fails
    reply = getFallbackResponse(role, language);
    suggestedFollowUps = getDefaultFollowUps(role);
  }

  // Save assistant message
  ConversationService.addMessage(session.id, 'assistant', reply, {
    suggestedFollowUps,
    needsClarification
  });

  return {
    reply,
    suggestedFollowUps,
    needsClarification,
    sessionId: session.id
  };
}

/**
 * Generate context-aware follow-up suggestions
 */
function generateSuggestedFollowUps(role, userMessage, assistantReply) {
  const lowerMsg = userMessage.toLowerCase();
  const lowerReply = assistantReply.toLowerCase();

  if (role === 'student') {
    if (lowerReply.includes('attendance')) {
      return ['Show me last month\'s attendance', 'Which days was I absent?', 'Help me improve my attendance'];
    }
    return ['What is my attendance?', 'Help me with homework', 'Show my schedule'];
  }

  if (role === 'parent') {
    if (lowerReply.includes('attendance')) {
      return ['Show detailed attendance', 'How was last month?', 'Talk to teacher about this'];
    }
    if (lowerReply.includes('escalat')) {
      return ['Check escalation status', 'View my child\'s attendance'];
    }
    return ['How is my child\'s attendance?', 'Contact my child\'s teacher', 'Any upcoming events?'];
  }

  if (role === 'teacher') {
    if (lowerReply.includes('marked') || lowerReply.includes('attendance')) {
      return ['Show class attendance', 'Mark another student', 'Who was absent this week?'];
    }
    return ['Show class attendance', 'Mark Rahul absent today', 'Escalate to management'];
  }

  if (role === 'principal') {
    if (lowerReply.includes('analytics') || lowerReply.includes('attendance')) {
      return ['Which grades need improvement?', 'Show monthly trend', 'Generate attendance report'];
    }
    return ['Show overall attendance', 'School analytics', 'Teacher performance'];
  }

  return [];
}

/**
 * Fallback response if LLM is unavailable
 */
function getFallbackResponse(role, language) {
  const fallbacks = {
    student: "Hi! I'm having a brief technical issue, but I'm still here to help. Could you try asking me again in a moment?",
    parent: "Hello! I'm experiencing a brief delay. Please try your question again, and I'll do my best to help you with your child's information.",
    teacher: "Hi! I'm having a momentary issue. Please try your request again — I'm here to help with attendance and class management.",
    principal: "Hello! I'm experiencing a brief technical delay. Please try again, and I'll provide the analytics you need."
  };
  return fallbacks[role] || fallbacks.student;
}

/**
 * Default follow-ups when LLM fails
 */
function getDefaultFollowUps(role) {
  const defaults = {
    student: ['What is my attendance?', 'Help with homework', 'Show my schedule'],
    parent: ['Check my child\'s attendance', 'Contact teacher', 'School events'],
    teacher: ['Show class attendance', 'Mark attendance', 'Escalate a concern'],
    principal: ['School attendance analytics', 'Grade-wise breakdown', 'Monthly report']
  };
  return defaults[role] || defaults.student;
}

module.exports = { handleMessage };
