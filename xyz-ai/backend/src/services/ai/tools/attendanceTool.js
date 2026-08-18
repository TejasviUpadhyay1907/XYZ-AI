/*
  This tool provides the AttendanceTool definition and handler, including I18n support.
*/

const AttendanceService = require('../../../mockServices/attendanceService');
const StudentService = require('../../../mockServices/studentService');

const AttendanceToolDef = {
  name: 'get_attendance',
  schema: {
    type: 'object',
    properties: {
      studentId: { type: 'string' },
      studentName: { type: 'string' },
      dateRange: { type: 'string', enum: ['today', 'yesterday', 'last_month', 'none'] },
      scope: { type: 'string', enum: ['student', 'class', 'school'] }
    }
  }
};

async function attendanceHandler(args, context) {
  const { studentId, studentName, dateRange, scope } = args;
  const { role, userId, language, languageService } = context;

  // Resolve target student
  let targetStudentId = studentId;

  if (role === 'student') {
    targetStudentId = userId;
  } else if (role === 'parent') {
    const children = AttendanceService.getChildrenForParent(userId);
    if (children.length === 0) {
      return {
        reply: languageService.translate('no_children_linked', language),
        suggestedFollowUps: [],
        needsClarification: false
      };
    }

    if (children.length === 1) {
      targetStudentId = children[0];
    } else {
      if (studentName) {
        for (const childId of children) {
          const student = StudentService.getStudentProfile(childId);
          if (student && student.name.toLowerCase().includes(studentName.toLowerCase())) {
            targetStudentId = childId;
            break;
          }
        }
      }

      if (!targetStudentId) {
        return {
          reply: languageService.translate('multiple_children_select', language) +
                 '\n' +
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
  } else if (role === 'teacher') {
    if (scope === 'class') {
      const students = StudentService.getStudentsForTeacher(userId);
      let replyText = `${languageService.translate('here_is_the_attendance_for_your_class', language)}\n\n`;
      students.forEach(student => {
        const att = AttendanceService.getStudentAttendance(student.id);
        const percentage = ((att.present / att.total) * 100 || 0).toFixed(1);
        replyText += `${student.name} (${student.grade}${student.section}): ${att.present}/${att.total} (${percentage}%)\n`;
      });
      return {
        reply: replyText,
        suggestedFollowUps: [
          languageService.translate('mark_rahul_absent_today', language),
          languageService.translate('show_attendance_for_my_class', language),
          languageService.translate('help_me_plan_tomorrows_lesson', language),
          languageService.translate('which_students_need_extra_attention', language)
        ],
        needsClarification: false
      };
    }

    if (studentName) {
      if (studentName.toLowerCase().includes('rahul')) targetStudentId = 'student123';
      else if (studentName.toLowerCase().includes('priya')) targetStudentId = 'student456';
      else if (studentName.toLowerCase().includes('arjun')) targetStudentId = 'student789';
    }
  }

  if (!targetStudentId) {
    return {
      reply: languageService.translate('specify_student_lookup', language),
      suggestedFollowUps: [],
      needsClarification: false
    };
  }

  // Fetch attendance for the target student
  const attendance = AttendanceService.getStudentAttendance(targetStudentId);

  if (attendance.total === 0) {
    return {
      reply: languageService.translate('attendance_not_found', language),
      suggestedFollowUps: [],
      needsClarification: false
    };
  }

  const student = StudentService.getStudentProfile(targetStudentId);
  const namePrefix = (role === 'parent' || role === 'teacher') && student ? `${languageService.translate('for', language)} ${student.name} ` : '';

  // Format attendance data
  const percentage = ((attendance.present / attendance.total) * 100 || 0).toFixed(1);

  const reply = `${languageService.translate('attendance_information', language)} ${namePrefix}:\n\n` +
          `${languageService.translate('total_days', language)} ${attendance.total}\n` +
          `${languageService.translate('present', language)} ${attendance.present}\n` +
          `${languageService.translate('absent', language)} ${attendance.absent}\n` +
          `${languageService.translate('attendance_percentage', language)} ${percentage}%\n\n` +
          `${languageService.translate('recent_attendance', language)}\n` +
          attendance.recent.slice(0, 5).map(day => `  ${day.date}: ${day.status}`).join('\n');

  // Generate suggested follow-ups based on role
  let suggestedFollowUps = [];
  if (role === 'student') {
    suggestedFollowUps = [
      languageService.translate('show_me_my_attendance_for_last_month', language),
      languageService.translate('what_subjects_have_i_missed_most', language),
      languageService.translate('can_you_help_me_improve_my_attendance', language)
    ];
  } else if (role === 'parent') {
    suggestedFollowUps = [
      languageService.translate('show_me_my_attendance_for_last_month', language),
      languageService.translate('how_is_my_child_performing_academically', language),
      languageService.translate('contact_teacher_about_attendance_concerns', language)
    ];
  } else if (role === 'teacher') {
    suggestedFollowUps = [
      languageService.translate('mark_rahul_absent_today', language),
      languageService.translate('show_attendance_for_my_class', language),
      languageService.translate('help_me_plan_tomorrows_lesson', language),
      languageService.translate('which_students_need_extra_attention', language)
    ];
  }

  return {
    reply,
    suggestedFollowUps,
    needsClarification: false
  };
}

module.exports = { AttendanceToolDef, attendanceHandler };
