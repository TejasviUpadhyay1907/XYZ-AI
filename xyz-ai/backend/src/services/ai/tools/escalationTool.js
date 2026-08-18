/*
  This tool provides the EscalationTool definition and handler, including I18n support.
*/

const EscalationService = require('../../../mockServices/escalationService');
const StudentService = require('../../../mockServices/studentService');

const EscalationToolDef = {
  name: 'escalate',
  schema: {
    type: 'object',
    properties: {
      studentName: { type: 'string' },
      reason: { type: 'string' },
      targetRole: { type: 'string', enum: ['teacher', 'management'] }
    }
  }
};

async function escalationHandler(args, context) {
  const { studentName, reason, targetRole } = args;
  const { userId, role, language, languageService, sessionId } = context;

  // Only parent and teacher can escalate
  if (!['parent', 'teacher'].includes(role)) {
    return {
      reply: languageService.translate('not_authorized_to_escalate', language) || "❌ You are not authorized to create an escalation.",
      suggestedFollowUps: [],
      needsClarification: false
    };
  }

  // Determine target student ID from studentName (if provided)
  let targetStudentId = null;
  if (studentName) {
    // In a real app, we would do a proper lookup. For demo, we check known names.
    const lowerName = studentName.toLowerCase();
    if (lowerName.includes('rahul')) targetStudentId = 'student123';
    else if (lowerName.includes('priya')) targetStudentId = 'student456';
    else if (lowerName.includes('arjun')) targetStudentId = 'student789';
  }

  // If we couldn't determine the student from name, try to get from context (for parent, we might need to ask)
  // For now, if targetStudentId is still null and we have a session, we might need to clarify.
  // But the NLU should have provided the studentName if it was in the message.

  // For parent, we need to check if they are authorized to escalate about the student
  if (role === 'parent') {
    const AttendanceService = require('../../../mockServices/attendanceService');
    const children = AttendanceService.getChildrenForParent(userId);
    if (targetStudentId) {
      // Check if the targetStudentId is one of the parent's children
      if (!children.includes(targetStudentId)) {
        return {
          reply: languageService.translate('not_authorized_to_escalate_for_student', language) || "❌ You are not authorized to create an escalation for this student.",
          suggestedFollowUps: [],
          needsClarification: false
        };
      }
    } else {
      // If no student name was provided, we need to ask which child (if multiple)
      if (children.length === 0) {
        return {
          reply: languageService.translate('no_children_linked', language) || "I couldn't find any children linked to your account. Please contact the school administration to update your parent-child relationships.",
          suggestedFollowUps: [],
          needsClarification: false
        };
      }
      if (children.length === 1) {
        targetStudentId = children[0];
      } else {
        // Multiple children, need to specify
        return {
          reply: languageService.translate('multiple_children_select', language) + '\n' +
                 children.map((childId, index) => {
                   const student = StudentService.getStudentProfile(childId);
                   return `${index + 1}. ${student ? student.name : 'Unknown'} (Grade: ${student ? student.grade : 'N/A'})`;
                 }).join('\n') +
                 "\n\n" + languageService.translate('please_specify_child_name', language),
          suggestedFollowUps: [],
          needsClarification: true
        };
      }
    }
  }

  // For teacher, we can escalate about any student (or a general issue)
  // If no student is specified, we can still escalate about a general issue (reason required)
  if (!targetStudentId && !reason) {
    return {
      reply: languageService.translate('please_specify_reason_for_escalation', language) || "Please specify the reason for the escalation.",
      suggestedFollowUps: [],
      needsClarification: true
    };
  }

  // Create the escalation
  const escalation = EscalationService.createEscalation(sessionId, userId, targetRole, reason || `Concerns about ${targetStudentId ? StudentService.getStudentProfile(targetStudentId)?.name || 'a student' : 'a general issue'}`);

  const targetRoleName = targetRole === 'teacher' ? languageService.translate('teacher', language) : languageService.translate('management', language);
  const studentNameForMessage = targetStudentId ? StudentService.getStudentProfile(targetStudentId)?.name || targetStudentId : 'the student';

  let reply = `✅ ${languageService.translate('escalation_created_successfully', language) || 'Escalation created successfully'} ${languageService.translate('target_role_has_been_notified_about_your_concern_regarding', language) || `${targetRoleName} has been notified about your concern regarding`} ${studentNameForMessage}.\n\n`;
  reply += `${languageService.translate('escalation_id', language) || 'Escalation ID'}: ${escalation.id}\n`;
  reply += `${languageService.translate('status', language) || 'Status'}: ${escalation.status}`;

  return {
    reply,
    suggestedFollowUps: [],
    needsClarification: false
  };
}

module.exports = { EscalationToolDef, escalationHandler };