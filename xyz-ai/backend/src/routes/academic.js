/**
 * Academic API Routes
 * Timetable, Marks, and Real-time Attendance endpoints.
 */

const express = require('express');
const router = express.Router();
const TimetableService = require('../mockServices/timetableService');
const MarksService = require('../mockServices/marksService');
const AttendanceService = require('../mockServices/attendanceService');
const StudentService = require('../mockServices/studentService');

// ============================================
// TIMETABLE
// ============================================

// GET /api/academic/timetable - Get full week timetable for current user
router.get('/timetable', (req, res) => {
  try {
    const { id, role } = req.user;

    if (role === 'student') {
      const profile = StudentService.getStudentProfile(id);
      const classKey = profile ? `${profile.grade}-${profile.section}` : '10-B';
      const timetable = TimetableService.getTimetable(classKey);
      return res.json({ timetable, today: TimetableService.getTodaySchedule(classKey) });
    }

    if (role === 'parent') {
      const children = AttendanceService.getChildrenForParent(id);
      const result = {};
      for (const childId of children) {
        const profile = StudentService.getStudentProfile(childId);
        const classKey = profile ? `${profile.grade}-${profile.section}` : '10-B';
        result[childId] = {
          student: profile,
          timetable: TimetableService.getTimetable(classKey),
          today: TimetableService.getTodaySchedule(classKey),
        };
      }
      return res.json({ children: result });
    }

    if (role === 'teacher') {
      // Teacher sees the timetable of their class
      const timetable = TimetableService.getTimetable('10-B');
      return res.json({ timetable, today: TimetableService.getTodaySchedule('10-B') });
    }

    res.status(403).json({ error: 'Not authorized' });
  } catch (error) {
    console.error('Timetable error:', error);
    res.status(500).json({ error: 'Failed to fetch timetable' });
  }
});

// ============================================
// MARKS
// ============================================

// GET /api/academic/marks - Get marks for current student
router.get('/marks', (req, res) => {
  try {
    const { id, role } = req.user;

    if (role === 'student') {
      const marks = MarksService.getStudentMarks(id);
      if (!marks) return res.status(404).json({ error: 'No marks found' });
      return res.json({ marks, exam_types: MarksService.getExamTypes(), subjects: MarksService.getSubjectsList() });
    }

    if (role === 'parent') {
      const children = AttendanceService.getChildrenForParent(id);
      const result = {};
      for (const childId of children) {
        const profile = StudentService.getStudentProfile(childId);
        result[childId] = {
          student: profile,
          marks: MarksService.getStudentMarks(childId),
        };
      }
      return res.json({ children: result, exam_types: MarksService.getExamTypes(), subjects: MarksService.getSubjectsList() });
    }

    if (role === 'teacher') {
      // Teacher sees class performance
      const classPerf = {};
      for (const examId of ['ct1', 'ct2', 'ct3', 'hy', 'fin']) {
        classPerf[examId] = MarksService.getClassPerformance(examId);
      }
      return res.json({ class_performance: classPerf, exam_types: MarksService.getExamTypes(), subjects: MarksService.getSubjectsList() });
    }

    if (role === 'principal') {
      const classPerf = {};
      for (const examId of ['ct1', 'ct2', 'ct3', 'hy']) {
        classPerf[examId] = MarksService.getClassPerformance(examId);
      }
      return res.json({ class_performance: classPerf, exam_types: MarksService.getExamTypes() });
    }

    res.status(403).json({ error: 'Not authorized' });
  } catch (error) {
    console.error('Marks error:', error);
    res.status(500).json({ error: 'Failed to fetch marks' });
  }
});

// POST /api/academic/marks - Teacher updates marks for a student
router.post('/marks', (req, res) => {
  try {
    const { role } = req.user;
    if (!['teacher', 'principal'].includes(role)) {
      return res.status(403).json({ error: 'Only teachers can update marks' });
    }

    const { studentId, examId, subject, marks } = req.body;
    if (!studentId || !examId || !subject || marks === undefined) {
      return res.status(400).json({ error: 'studentId, examId, subject, and marks are required' });
    }

    // Validate marks range
    const examTypes = MarksService.getExamTypes();
    const exam = Object.values(examTypes).find(e => e.id === examId);
    if (!exam) return res.status(400).json({ error: 'Invalid exam ID' });
    if (marks < 0 || marks > exam.max_marks) {
      return res.status(400).json({ error: `Marks must be between 0 and ${exam.max_marks}` });
    }

    const result = MarksService.updateMarks(studentId, examId, subject, marks);
    if (!result) return res.status(404).json({ error: 'Student not found' });

    // Return updated marks for the student so frontend can refresh
    const updatedMarks = MarksService.getStudentMarks(studentId);
    res.json({ success: true, update: result, updated_marks: updatedMarks });
  } catch (error) {
    console.error('Update marks error:', error);
    res.status(500).json({ error: 'Failed to update marks' });
  }
});

// ============================================
// REAL-TIME ATTENDANCE (same in-memory store)
// ============================================

// GET /api/academic/attendance/:studentId - Live attendance for a student
router.get('/attendance/:studentId', (req, res) => {
  try {
    const { id, role } = req.user;
    const { studentId } = req.params;

    // Authorization checks
    if (role === 'student' && id !== studentId) {
      return res.status(403).json({ error: 'You can only view your own attendance' });
    }
    if (role === 'parent') {
      const children = AttendanceService.getChildrenForParent(id);
      if (!children.includes(studentId)) {
        return res.status(403).json({ error: 'Not authorized to view this student' });
      }
    }

    const attendance = AttendanceService.getStudentAttendance(studentId);
    const student = StudentService.getStudentProfile(studentId);
    const percentage = attendance.total > 0
      ? ((attendance.present / attendance.total) * 100).toFixed(1)
      : '0';

    res.json({
      studentId,
      student,
      attendance: { ...attendance, percentage },
      last_updated: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Attendance error:', error);
    res.status(500).json({ error: 'Failed to fetch attendance' });
  }
});

// POST /api/academic/attendance/mark - Teacher marks attendance (real-time)
router.post('/attendance/mark', (req, res) => {
  try {
    const { id: teacherId, role } = req.user;
    if (role !== 'teacher') {
      return res.status(403).json({ error: 'Only teachers can mark attendance' });
    }

    const { studentId, status, date } = req.body;
    if (!studentId || !status) {
      return res.status(400).json({ error: 'studentId and status are required' });
    }

    if (!StudentService.canTeacherAccessStudent(teacherId, studentId)) {
      return res.status(403).json({ error: 'Not authorized for this student' });
    }

    const attendanceDate = date || new Date().toISOString().split('T')[0];
    AttendanceService.markAttendance(studentId, attendanceDate, status, teacherId);

    // Return updated attendance immediately so both teacher and student see it
    const updated = AttendanceService.getStudentAttendance(studentId);
    const student = StudentService.getStudentProfile(studentId);
    const percentage = updated.total > 0 ? ((updated.present / updated.total) * 100).toFixed(1) : '0';

    res.json({
      success: true,
      student_name: student?.name || studentId,
      status,
      date: attendanceDate,
      updated_attendance: { ...updated, percentage },
    });
  } catch (error) {
    console.error('Mark attendance error:', error);
    res.status(500).json({ error: 'Failed to mark attendance' });
  }
});

// GET /api/academic/attendance/class - Teacher gets full class attendance live
router.get('/attendance/class', (req, res) => {
  try {
    const { id, role } = req.user;
    if (role !== 'teacher' && role !== 'principal') {
      return res.status(403).json({ error: 'Only teachers can view class attendance' });
    }

    const students = StudentService.getStudentsForTeacher(id);
    const classData = students.map(student => {
      const att = AttendanceService.getStudentAttendance(student.id);
      const percentage = att.total > 0 ? ((att.present / att.total) * 100).toFixed(1) : '0';
      return {
        id: student.id,
        name: student.name,
        grade: student.grade,
        section: student.section,
        attendance: { ...att, percentage },
        today_status: att.recent?.[att.recent.length - 1]?.status || 'unknown',
      };
    });

    res.json({
      class_attendance: classData,
      summary: {
        total_students: classData.length,
        present_today: classData.filter(s => s.today_status === 'present').length,
        absent_today: classData.filter(s => s.today_status === 'absent').length,
      },
      last_updated: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Class attendance error:', error);
    res.status(500).json({ error: 'Failed to fetch class attendance' });
  }
});

module.exports = router;
