/*
  This tool provides the AnalyticsTool definition and handler, including I18n support.
*/

const AttendanceService = require('../../../mockServices/attendanceService');

const AnalyticsToolDef = {
  name: 'get_school_analytics',
  schema: {
    type: 'object',
    properties: {
      scope: { type: 'string', enum: ['school', 'grade', 'section'] },
      grade: { type: 'string' },
      section: { type: 'string' }
    }
  }
};

async function analyticsHandler(args, context) {
  const { scope, grade, section } = args;
  const { role, language, languageService } = context;

  // Only principal can access analytics
  if (role !== 'principal') {
    return {
      reply: languageService.translate('not_authorized_for_analytics', language) || "❌ You are not authorized to view school analytics.",
      suggestedFollowUps: [],
      needsClarification: false
    };
  }

  // Default scope to 'school' if not specified
  const actualScope = scope || 'school';

  if (actualScope === 'school') {
    const analytics = AttendanceService.getSchoolAttendance();

    const header = languageService.translate('here_is_the_school_wide_attendance_analytics', language) || `Here's the school-wide attendance analytics:\n\n`;
    const totalStudentsLabel = languageService.translate('total_students', language) || `Total Students:`;
    const averageAttendanceLabel = languageService.translate('average_attendance', language) || `Average Attendance:`;
    const totalPresentLabel = languageService.translate('total_present', language) || `Total Present:`;
    const totalAbsentLabel = languageService.translate('total_absent', language) || `Total Absent:`;
    const gradeWiseBreakdownLabel = languageService.translate('grade_wise_breakdown', language) || `Grade-wise Breakdown:`;

    let reply = `${header}` +
            `${totalStudentsLabel} ${analytics.totalStudents}\n` +
            `${averageAttendanceLabel} ${analytics.averageAttendance}%\n` +
            `${totalPresentLabel} ${analytics.totalPresent}\n` +
            `${totalAbsentLabel} ${analytics.totalAbsent}\n\n` +
            `${gradeWiseBreakdownLabel}\n` +
            Object.entries(analytics.gradeBreakdown).map(([gradeKey, data]) =>
              `• ${gradeKey}: ${data.present}/${data.total} present (${((data.present/data.total)*100).toFixed(1)}%)`
            ).join('\n');

    return {
      reply,
      suggestedFollowUps: [
        languageService.translate('show_attendance_by_section', language) || 'Show attendance by section',
        languageService.translate('generate_monthly_attendance_report', language) || 'Generate monthly attendance report',
        languageService.translate('which_grades_need_attendance_improvement', language) || 'Which grades need attendance improvement?'
      ],
      needsClarification: false
    };
  }

  // For grade/section level analytics, we could extend later
  return {
    reply: languageService.translate('analytics_scope_not_supported', language) || "Analytics for this scope is not yet supported.",
    suggestedFollowUps: [],
    needsClarification: false
  };
}

module.exports = { AnalyticsToolDef, analyticsHandler };