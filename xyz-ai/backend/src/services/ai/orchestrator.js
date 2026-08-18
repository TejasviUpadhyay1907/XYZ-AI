/**
 * AI Orchestrator Core Module
 * Responsible for managing the conversation context, intent detection,
 * and routing the request to the appropriate tool or service.
 */

const AttendanceService = require('../../mockServices/attendanceService');
const StudentService = require('../../mockServices/studentService');
const ConversationService = require('../conversationService');
const EscalationService = require('../../mockServices/escalationService');
const languageService = require('../languageService');
const NLUService = require('./NLUService');
const toolRegistry = require('./index'); // Updated to use the index that registers tools

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
 * Handles a chat message
 * @param {ChatInput} input
 * @returns {Promise<ChatOutput>}
 */
async function handleMessage(input) {
  const { sessionId, userId, role, language, message } = input;

  // Get or create conversation session
  const session = ConversationService.getOrCreateSession(userId, role, language, sessionId);

  // Get conversation history for context (as an array of messages)
  const conversationContext = ConversationService.getRecentHistory(session.id, 5);

  // Perform NLU analysis
  const nluResult = await NLUService.analyze(message, role, conversationContext);
  console.log('[Orchestrator] NLU result:', nluResult);

  // Save user message
  ConversationService.addMessage(session.id, 'user', message);

  let toolResult = null;
  if (nluResult.confidence > 0.6) {
    try {
      toolResult = await toolRegistry.execute(nluResult.intent, nluResult.entities, {
        userId,
        role,
        language,
        languageService
      });
      console.log("[Orchestrator] Tool executed successfully");
    } catch (e) {
      console.error("[Orchestrator] Tool execution error:", e);
      // Fallback to old flow
    }
  }

  let reply;
  let suggestedFollowUps = [];
  let needsClarification = false;

  if (toolResult && typeof toolResult.reply === 'string' && toolResult.reply.trim() !== '') {
    reply = toolResult.reply;
    suggestedFollowUps = toolResult.suggestedFollowUps || [];
    needsClarification = toolResult.needsClarification || false;
  } else {
    // Simple intent detection based on keywords
    const lowerMessage = message.toLowerCase();

    // Check for follow-up questions using conversation context
    const isFollowUp = conversationContext && conversationContext.length > 0;
    let lastTopic = null;

    if (isFollowUp) {
      // Try to determine the last topic from conversation history
      const recentMessages = ConversationService.getRecentHistory(session.id, 4);
      for (const msg of recentMessages) {
        if (msg.sender === 'assistant' && msg.metadata?.suggestedFollowUps) {
          // Check if any follow-up matches current message
          for (const followUp of msg.metadata.suggestedFollowUps) {
            const followUpLower = followUp.toLowerCase();
            if (lowerMessage.includes('last month') && followUpLower.includes('last month')) {
              lastTopic = 'attendance';
              break;
            }
            if (lowerMessage.includes('missed') && followUpLower.includes('missed')) {
              lastTopic = 'attendance';
              break;
            }
          }
          if (lastTopic) break;
        }
      }
    }

    // Student intents
    if (role === 'student') {
      if (lowerMessage.includes('attendance') || lowerMessage.includes('present') || lowerMessage.includes('absent') ||
          (isFollowUp && lastTopic === 'attendance' && (lowerMessage.includes('last month') || lowerMessage.includes('month') || lowerMessage.includes('detail')))) {
        const attendance = AttendanceService.getStudentAttendance(userId);
        if (attendance.total === 0) {
          reply = languageService.translate('attendance_not_found', language) || "Hello! I couldn't find any attendance records for you. Please contact the school administration.";
        } else {
          const percentage = ((attendance.present / attendance.total) * 100 || 0).toFixed(1);
          const header = languageService.translate('attendance_information', language) || "Hello! Here's your attendance information:";
          const totalDaysLabel = languageService.translate('total_days', language) || "Total Days:";
          const presentLabel = languageService.translate('present', language) || "Present:";
          const absentLabel = languageService.translate('absent', language) || "Absent:";
          const attendancePercentageLabel = languageService.translate('attendance_percentage', language) || "Attendance Percentage:";
          const recentAttendanceLabel = languageService.translate('recent_attendance', language) || "Recent Attendance:";

          reply = `${header}\n\n` +
                  `${totalDaysLabel} ${attendance.total}\n` +
                  `${presentLabel} ${attendance.present}\n` +
                  `${absentLabel} ${attendance.absent}\n` +
                  `${attendancePercentageLabel} ${percentage}%\n\n` +
                  `${recentAttendanceLabel}\n` +
                  attendance.recent.slice(0, 5).map(day => `  ${day.date}: ${day.status}`).join('\n');
        }

        suggestedFollowUps = [
          languageService.translate('show_me_my_attendance_for_last_month', language) || 'Show me my attendance for last month',
          languageService.translate('what_subjects_have_i_missed_most', language) || 'What subjects have I missed most?',
          languageService.translate('can_you_help_me_improve_my_attendance', language) || 'Can you help me improve my attendance?'
        ];
      } else if (lowerMessage.includes('homework') || lowerMessage.includes('assignment')) {
        reply = languageService.translate('homework_help_student', language) || "I can help you with homework and assignments! However, I don't have access to your specific assignments right now. You might want to check your school portal or contact your teachers directly.\n\nIs there anything else I can help you with regarding your attendance or schedule?";
        suggestedFollowUps = [
          languageService.translate('show_my_attendance', language) || 'Show my attendance',
          languageService.translate('what_is_my_class_schedule', language) || 'What is my class schedule?',
          languageService.translate('help_me_with_math_homework', language) || 'Help me with math homework'
        ];
      } else {
        reply = languageService.translate('welcome_student_generic', language) || `Hello! I'm your Academic Assistant. I can help you with:\n\n` +
                `• Attendance records\n` +
                `• Class schedules\n` +
                `• Homework help\n` +
                `• Exam preparation\n` +
                `• General school questions\n\n` +
                `What would you like to know about?`;
        suggestedFollowUps = [
          languageService.translate('what_is_my_attendance', language) || 'What is my attendance?',
          languageService.translate('show_my_timetable', language) || 'Show my timetable',
          languageService.translate('help_me_with_math_homework', language) || 'Help me with math homework'
        ];
      }
    }

    // Parent intents
    else if (role === 'parent') {
      const children = AttendanceService.getChildrenForParent(userId);

      if (lowerMessage.includes('attendance') && (lowerMessage.includes('my child') || lowerMessage.includes('child'))) {
        if (children.length === 0) {
          reply = languageService.translate('no_children_linked', language) || "I couldn't find any children linked to your account. Please contact the school administration to update your parent-child relationships.";
        } else if (children.length === 1) {
          const attendance = AttendanceService.getStudentAttendance(children[0]);
          const student = StudentService.getStudentProfile(children[0]);
          if (!student) {
            reply = languageService.translate('child_profile_not_found', language) || `I found a child ID (${children[0]}) but could not retrieve student profile. Please contact school administration.`;
          } else {
            const percentage = ((attendance.present / attendance.total) * 100 || 0).toFixed(1);
            const header = languageService.translate('attendance_information_for_child', language) || `Here's the attendance information for ${student.name} (ID: ${children[0]}):\n\n`;
            const totalDaysLabel = languageService.translate('total_days', language) || "Total Days:";
            const presentLabel = languageService.translate('present', language) || "Present:";
            const absentLabel = languageService.translate('absent', language) || "Absent:";
            const attendancePercentageLabel = languageService.translate('attendance_percentage', language) || "Attendance Percentage:";
            const recentAttendanceLabel = languageService.translate('recent_attendance', language) || "Recent Attendance:";

            reply = `${header}` +
                    `${totalDaysLabel} ${attendance.total}\n` +
                    `${presentLabel} ${attendance.present}\n` +
                    `${absentLabel} ${attendance.absent}\n` +
                    `${attendancePercentageLabel} ${percentage}%\n\n` +
                    `${recentAttendanceLabel}\n` +
                    attendance.recent.slice(0, 5).map(day => `  ${day.date}: ${day.status}`).join('\n');

            suggestedFollowUps = [
              languageService.translate('show_me_my_attendance_for_last_month', language) || `Show me ${student.name}'s attendance for last month`,
              languageService.translate('how_is_my_child_performing_academically', language) || 'How is my child performing academically?',
              languageService.translate('contact_teacher_about_attendance_concerns', language) || 'Can you contact the teacher about attendance concerns?'
            ];
          }
        } else {
          // Multiple children
          reply = languageService.translate('multiple_children_select', language) || "I can see you have multiple children linked to your account. Which child's attendance would you like to check?\n\n" +
                  children.map((childId, index) => {
                    const student = StudentService.getStudentProfile(childId);
                    return `${index + 1}. ${student ? student.name : 'Unknown'} (Grade: ${student ? student.grade : 'N/A'})`;
                  }).join('\n') +
                  "\n\nPlease specify the child's name or ask about a specific child.";
          needsClarification = true;
        }
      } else if (lowerMessage.includes('how much attendance') && lowerMessage.includes('my child')) {
        if (children.length === 0) {
          reply = languageService.translate('no_children_linked', language) || "I couldn't find any children linked to your account. Please contact the school administration.";
        } else if (children.length === 1) {
          const attendance = AttendanceService.getStudentAttendance(children[0]);
          const student = StudentService.getStudentProfile(children[0]);
          if (!student) {
            reply = languageService.translate('child_profile_not_found', language) || "I found a child ID but could not retrieve student profile.";
          } else {
            const percentage = ((attendance.present / attendance.total) * 100 || 0).toFixed(1);
            reply = `${student.name} ${languageService.translate('has_attended_out_of_days', language) || 'has attended'} ${attendance.present} ${languageService.translate('out_of', language) || 'out of'} ${attendance.total} ${languageService.translate('days', language) || 'days'}, which is ${percentage}% ${languageService.translate('attendance', language) || 'attendance'}.`;
          }

          suggestedFollowUps = [
            languageService.translate('show_me_the_detailed_attendance_record', language) || 'Show me the detailed attendance record',
            languageService.translate('how_was_the_attendance_last_month', language) || 'How was the attendance last month?',
            languageService.translate('are_there_any_attendance_concerns_i_should_know_about', language) || 'Are there any attendance concerns I should know about?'
          ];
        } else {
          reply = languageService.translate('you_have_multiple_children_specify', language) || "You have multiple children. Please specify which child you're asking about.";
          needsClarification = true;
        }
      } else if (lowerMessage.includes('escalate') || lowerMessage.includes('escalation') || lowerMessage.includes('contact the teacher')) {
        // Parent can escalate to teacher about their child
        console.log('[DEBUG] Escalation triggered:', { lowerMessage, children });
        if (children.length === 0) {
          reply = languageService.translate('no_children_linked', language) || "I couldn't find any children linked to your account. Please contact the school administration.";
          needsClarification = false;
        } else {
          // Try to identify which child from the message
          let targetStudentId = null;
          for (const childId of children) {
            const student = StudentService.getStudentProfile(childId);
            console.log('[DEBUG] Checking child:', { childId, studentName: student?.name, lowerMessage });
            // Check by studentId
            if (lowerMessage.includes(childId)) {
              targetStudentId = childId;
              console.log('[DEBUG] Matched studentId:', childId);
              break;
            }
            if (student && lowerMessage.includes(student.name.toLowerCase())) {
              targetStudentId = childId;
              console.log('[DEBUG] Matched full name');
              break;
            }
            // Also check first name
            if (student && lowerMessage.includes(student.name.split(' ')[0].toLowerCase())) {
              targetStudentId = childId;
              console.log('[DEBUG] Matched first name:', student.name.split(' ')[0].toLowerCase());
              break;
            }
          }

          if (targetStudentId) {
            // Found the child mentioned in the message
            const student = StudentService.getStudentProfile(targetStudentId);
            const reason = message.substring(message.indexOf('escalate') !== -1 ? message.indexOf('escalate') :
                                     message.indexOf('contact the teacher') !== -1 ? message.indexOf('contact the teacher') : 0).trim();
            const escalation = EscalationService.createEscalation(sessionId, userId, 'teacher', reason || `Parent has concerns about ${student.name}`);
            reply = `✅ ${languageService.translate('escalation_created_successfully', language) || 'Escalation created successfully'} ${languageService.translate('teacher_has_been_notified_about_your_concern_regarding', language) || 'The teacher has been notified about your concern regarding'} ${student.name}.\n\n${languageService.translate('escalation_id', language) || 'Escalation ID'}: ${escalation.id}\n${languageService.translate('status', language) || 'Status'}: ${escalation.status}`;
            suggestedFollowUps = [];
          } else if (children.length === 1) {
            // Only one child, use that one
            const studentId = children[0];
            const student = StudentService.getStudentProfile(studentId);
            if (!student) {
              reply = languageService.translate('child_profile_not_found', language) || "I found a child ID but could not retrieve student profile.";
            } else {
              const reason = message.substring(message.indexOf('escalate') !== -1 ? message.indexOf('escalate') :
                                       message.indexOf('contact the teacher') !== -1 ? message.indexOf('contact the teacher') : 0).trim();
              const escalation = EscalationService.createEscalation(sessionId, userId, 'teacher', reason || `Parent has concerns about ${student.name}`);
              reply = `✅ ${languageService.translate('escalation_created_successfully', language) || 'Escalation created successfully'} ${languageService.translate('teacher_has_been_notified_about_your_concern_regarding', language) || 'The teacher has been notified about your concern regarding'} ${student.name}.\n\n${languageService.translate('escalation_id', language) || 'Escalation ID'}: ${escalation.id}\n${languageService.translate('status', language) || 'Status'}: ${escalation.status}`;
            }
            suggestedFollowUps = [];
          } else {
            // Multiple children - need to specify which child
            reply = languageService.translate('multiple_children_select_for_escalation', language) || "I can see you have multiple children linked to your account. Which child would you like to escalate about?\n\n" +
                    children.map((childId, index) => {
                      const student = StudentService.getStudentProfile(childId);
                      return `${index + 1}. ${student ? student.name : 'Unknown'} (Grade: ${student ? student.grade : 'N/A'})`;
                    }).join('\n') +
                    "\n\nPlease specify the child's name (e.g., 'escalate to teacher about Rahul').";
            needsClarification = true;
            suggestedFollowUps = [];
          }
        }
      } else {
        reply = languageService.translate('welcome_parent_generic', language) || `Hello! I'm your Parent Support Assistant. I can help you with:\n\n` +
                `• Your child's attendance records\n` +
                `• Academic progress updates\n` +
                `• School announcements and events\n` +
                `• Communication with teachers\n` +
                `• Fee and payment information\n\n` +
                `What would you like to know about your child?`;
        suggestedFollowUps = [
          languageService.translate('how_is_my_child_doing_in_school', language) || 'How is my child doing in school?',
          languageService.translate('show_my_childs_attendance', language) || 'Show my child\'s attendance',
          languageService.translate('what_are_the_upcoming_school_events', language) || 'What are the upcoming school events?',
          languageService.translate('can_you_contact_my_childs_teacher', language) || 'Can you contact my child\'s teacher?'
        ];
      }
    }

    // Teacher intents
    else if (role === 'teacher') {
      if (lowerMessage.includes('mark') && (lowerMessage.includes('absent') || lowerMessage.includes('present'))) {
        // Extract student name from message? For demo, we'll assume Rahul
        const studentNameMatch = message.match(/rahul/i);
        let studentId = 'student123'; // default to Rahul
        if (studentNameMatch) {
          // In a real app, we would look up the student by name
          // For demo, we'll just use the first student
          studentId = 'student123';
        }
        // Validate teacher can access student (using teacher001 as default teacher)
        const teacherId = 'teacher001'; // In real app, this would come from auth token
        if (StudentService.canTeacherAccessStudent(teacherId, studentId)) {
          const today = new Date().toISOString().split('T')[0];
          const result = AttendanceService.markAttendance(studentId, today,
            lowerMessage.includes('present') ? 'present' : 'absent', teacherId);
          reply = `✅ ${languageService.translate('attendance_marked_successfully_for', language) || 'Attendance marked successfully for'} ${StudentService.getStudentProfile(studentId)?.name || studentId} ${languageService.translate('on', language) || 'on'} ${today} ${languageService.translate('as', language) || 'as'} ${lowerMessage.includes('present') ? languageService.translate('present', language) || 'present' : languageService.translate('absent', language) || 'absent'}.`;
        } else {
          reply = languageService.translate('not_authorized_to_mark_attendance_for_student', language) || "❌ You are not authorized to mark attendance for this student.";
        }
      } else if (lowerMessage.includes('attendance') && lowerMessage.includes('my class')) {
        // For demo, show all students attendance
        const students = StudentService.getStudentsForTeacher('teacher001');
        let replyText = `${languageService.translate('here_is_the_attendance_for_your_class', language) || 'Here\'s the attendance for your class:'}\n\n`;
        students.forEach(student => {
          const att = AttendanceService.getStudentAttendance(student.id);
          const percentage = ((att.present / att.total) * 100 || 0).toFixed(1);
          replyText += `${student.name} (${student.grade}${student.section}): ${att.present}/${att.total} (${percentage}%)\n`;
        });
        reply = replyText;
        suggestedFollowUps = [
          languageService.translate('mark_rahul_absent_today', language) || 'Mark Rahul absent today',
          languageService.translate('show_attendance_for_my_class', language) || 'Show attendance for my class',
          languageService.translate('help_me_plan_tomorrows_lesson', language) || 'Help me plan tomorrow\'s lesson',
          languageService.translate('which_students_need_extra_attention', language) || 'Which students need extra attention?'
        ];
      } else if (lowerMessage.includes('escalate') || lowerMessage.includes('escalation')) {
        // Teacher can escalate to management about a student or issue
        if (lowerMessage.includes('student') || lowerMessage.includes('rahul') || lowerMessage.includes('priya') || lowerMessage.includes('arjun')) {
          // Extract student name or use context
          let studentId = 'student123'; // default
          if (lowerMessage.includes('priya')) studentId = 'student456';
          else if (lowerMessage.includes('arjun')) studentId = 'student789';

          const reason = message.substring(message.indexOf('escalate') + 8).trim();
          const escalation = EscalationService.createEscalation(sessionId, userId, 'management', reason || 'Teacher requested escalation');
          reply = `✅ ${languageService.translate('escalation_created_successfully', language) || 'Escalation created successfully'} ${languageService.translate('management_has_been_notified_about_your_concern_regarding', language) || 'Management has been notified about your concern regarding'} ${StudentService.getStudentProfile(studentId)?.name || 'the student'}.\n\n${languageService.translate('escalation_id', language) || 'Escalation ID'}: ${escalation.id}\n${languageService.translate('status', language) || 'Status'}: ${escalation.status}`;
        } else {
          reply = languageService.translate('help_you_create_an_escalation_to_management', language) || "I can help you create an escalation to management. Please specify which student or issue you'd like to escalate.\n\nFor example: 'Escalate about Rahul's attendance concerns'";
        }
        suggestedFollowUps = [];
      } else {
        reply = languageService.translate('welcome_teacher_generic', language) || `Hello! I'm your Teaching Assistant. I can help you with:\n\n` +
                `• Marking student attendance\n` +
                `• Viewing attendance records\n` +
                `• Lesson planning assistance\n` +
                `• Student progress tracking\n` +
                `• Communication with parents\n\n` +
                `What would you like to do today?`;
        suggestedFollowUps = [
          languageService.translate('mark_rahul_absent_today', language) || 'Mark Rahul absent today',
          languageService.translate('show_attendance_for_my_class', language) || 'Show attendance for my class',
          languageService.translate('help_me_plan_tomorrows_lesson', language) || 'Help me plan tomorrow\'s lesson',
          languageService.translate('which_students_need_extra_attention', language) || 'Which students need extra attention?'
        ];
      }
    }

    // Principal intents
    else if (role === 'principal') {
      if (lowerMessage.includes('overall attendance') || lowerMessage.includes('school attendance') || lowerMessage.includes('attendance analytics')) {
        const analytics = AttendanceService.getSchoolAttendance();
        const header = languageService.translate('here_is_the_school_wide_attendance_analytics', language) || `Here's the school-wide attendance analytics:\n\n`;
        const totalStudentsLabel = languageService.translate('total_students', language) || `Total Students:`;
        const averageAttendanceLabel = languageService.translate('average_attendance', language) || `Average Attendance:`;
        const totalPresentLabel = languageService.translate('total_present', language) || `Total Present:`;
        const totalAbsentLabel = languageService.translate('total_absent', language) || `Total Absent:`;
        const gradeWiseBreakdownLabel = languageService.translate('grade_wise_breakdown', language) || `Grade-wise Breakdown:`;

        reply = `${header}` +
                `${totalStudentsLabel} ${analytics.totalStudents}\n` +
                `${averageAttendanceLabel} ${analytics.averageAttendance}%\n` +
                `${totalPresentLabel} ${analytics.totalPresent}\n` +
                `${totalAbsentLabel} ${analytics.totalAbsent}\n\n` +
                `${gradeWiseBreakdownLabel}\n` +
                Object.entries(analytics.gradeBreakdown).map(([grade, data]) =>
                  `• ${grade}: ${data.present}/${data.total} present (${((data.present/data.total)*100).toFixed(1)}%)`
                ).join('\n');
        suggestedFollowUps = [
          languageService.translate('show_attendance_by_section', language) || 'Show attendance by section',
          languageService.translate('generate_monthly_attendance_report', language) || 'Generate monthly attendance report',
          languageService.translate('which_grades_need_attendance_improvement', language) || 'Which grades need attendance improvement?'
        ];
      } else {
        reply = languageService.translate('welcome_principal_generic', language) || `Hello! I'm your Management Assistant. I can help you with:\n\n` +
                `• School-wide analytics and reports\n` +
                `• Attendance monitoring\n` +
                `• Teacher and staff management\n` +
                `What would you like to know or do today?`;
        suggestedFollowUps = [
          languageService.translate('what_is_the_overall_attendance', language) || 'What is the overall attendance?',
          languageService.translate('show_teacher_attendance_report', language) || 'Show teacher attendance report',
          languageService.translate('what_are_the_upcoming_school_events', language) || 'What are the upcoming school events?'
        ];
      }
    }

    // Fallback for unrecognized role
    else {
      reply = languageService.translate('hello_i_am_here_to_assist_you_with_xyz_school_inquiries', language) || "Hello! I'm here to assist you with XYZ School inquiries.";
    }
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

module.exports = { handleMessage };