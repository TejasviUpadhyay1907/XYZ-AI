/**
 * Dashboard API Routes
 * Provides structured data for role-specific dashboards.
 */

const express = require('express');
const router = express.Router();
const AttendanceService = require('../mockServices/attendanceService');
const StudentService = require('../mockServices/studentService');

// GET /api/dashboard/profile - Get current user's profile data
router.get('/profile', (req, res) => {
  try {
    const { id, role } = req.user;

    if (role === 'student') {
      const profile = StudentService.getStudentProfile(id);
      const attendance = AttendanceService.getStudentAttendance(id);
      const percentage = attendance.total > 0 ? ((attendance.present / attendance.total) * 100).toFixed(1) : '0';

      return res.json({
        role,
        profile: profile || { name: req.user.name, id },
        attendance: { ...attendance, percentage }
      });
    }

    if (role === 'parent') {
      const children = AttendanceService.getChildrenForParent(id);
      const childrenData = children.map(childId => {
        const profile = StudentService.getStudentProfile(childId);
        const attendance = AttendanceService.getStudentAttendance(childId);
        const percentage = attendance.total > 0 ? ((attendance.present / attendance.total) * 100).toFixed(1) : '0';
        return {
          id: childId,
          profile: profile || { name: 'Unknown', id: childId },
          attendance: { ...attendance, percentage }
        };
      });

      return res.json({ role, children: childrenData });
    }

    if (role === 'teacher') {
      const students = StudentService.getStudentsForTeacher(id);
      const classData = students.map(student => {
        const att = AttendanceService.getStudentAttendance(student.id);
        const percentage = att.total > 0 ? ((att.present / att.total) * 100).toFixed(1) : '0';
        return {
          id: student.id,
          name: student.name,
          grade: student.grade,
          section: student.section,
          attendance: { present: att.present, absent: att.absent, total: att.total, percentage }
        };
      });

      return res.json({ role, class_students: classData });
    }

    if (role === 'principal') {
      const analytics = AttendanceService.getSchoolAttendance();
      return res.json({ role, analytics });
    }

    res.json({ role, message: 'No dashboard data available for this role' });
  } catch (error) {
    console.error('Dashboard profile error:', error);
    res.status(500).json({ error: 'Failed to load dashboard data' });
  }
});

// POST /api/dashboard/mark-attendance - Teacher marks attendance
router.post('/mark-attendance', (req, res) => {
  try {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ error: 'Only teachers can mark attendance' });
    }

    const { studentId, status, date } = req.body;
    if (!studentId || !status) {
      return res.status(400).json({ error: 'studentId and status are required' });
    }

    const teacherId = req.user.id;
    if (!StudentService.canTeacherAccessStudent(teacherId, studentId)) {
      return res.status(403).json({ error: 'Not authorized to mark attendance for this student' });
    }

    const attendanceDate = date || new Date().toISOString().split('T')[0];
    AttendanceService.markAttendance(studentId, attendanceDate, status, teacherId);

    const student = StudentService.getStudentProfile(studentId);
    res.json({
      success: true,
      student_name: student?.name || studentId,
      status,
      date: attendanceDate
    });
  } catch (error) {
    console.error('Mark attendance error:', error);
    res.status(500).json({ error: 'Failed to mark attendance' });
  }
});

module.exports = router;
