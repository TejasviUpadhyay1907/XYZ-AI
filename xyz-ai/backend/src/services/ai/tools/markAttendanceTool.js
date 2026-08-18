/**
 * Mark Attendance Tool - Allows teachers to mark student attendance
 */

const AttendanceService = require('../../../mockServices/attendanceService');
const StudentService = require('../../../mockServices/studentService');

const MarkAttendanceToolDef = {
  name: 'mark_attendance',
  schema: {
    type: 'object',
    properties: {
      studentName: { type: 'string' },
      status: { type: 'string', enum: ['present', 'absent'] },
      date: { type: 'string' }
    },
    required: ['studentName', 'status']
  }
};

async function markAttendanceHandler(args, context) {
  const { studentName, status, date } = args;
  const { role, userId, language, languageService } = context;

  // Only teachers can mark attendance
  if (role !== 'teacher') {
    return {
      reply: languageService.translate('not_authorized_to_mark_attendance', language) || "You are not authorized to mark attendance.",
      suggestedFollowUps: [],
      needsClarification: false
    };
  }

  // Resolve student name to ID
  let studentId = null;
  const lowerName = (studentName || '').toLowerCase();
  if (lowerName.includes('rahul')) studentId = 'student123';
  else if (lowerName.includes('priya')) studentId = 'student456';
  else if (lowerName.includes('arjun')) studentId = 'student789';

  if (!studentId) {
    return {
      reply: languageService.translate('student_not_found', language) || `Could not find a student named "${studentName}". Available students: Rahul Sharma, Priya Patel, Arjun Singh.`,
      suggestedFollowUps: [],
      needsClarification: true
    };
  }

  // Validate teacher can access this student
  const teacherId = userId || 'teacher001';
  if (!StudentService.canTeacherAccessStudent(teacherId, studentId)) {
    return {
      reply: languageService.translate('not_authorized_to_mark_attendance_for_student', language) || "You are not authorized to mark attendance for this student.",
      suggestedFollowUps: [],
      needsClarification: false
    };
  }

  // Mark attendance
  const attendanceDate = date || new Date().toISOString().split('T')[0];
  const result = AttendanceService.markAttendance(studentId, attendanceDate, status, teacherId);

  const student = StudentService.getStudentProfile(studentId);
  const studentDisplayName = student ? student.name : studentName;

  return {
    reply: `Attendance marked: ${studentDisplayName} is ${status} on ${attendanceDate}.`,
    suggestedFollowUps: [
      'Show attendance for my class',
      'Mark another student',
    ],
    needsClarification: false
  };
}

module.exports = { MarkAttendanceToolDef, markAttendanceHandler };
