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

const LeaveService = require('../mockServices/leaveService');
const NoticeService = require('../mockServices/noticeService');
const MeetingService = require('../mockServices/meetingService');

// GET /api/dashboard/leaves - Get leave applications for current user
router.get('/leaves', (req, res) => {
  try {
    const { id, role } = req.user;
    let leaves = [];

    if (role === 'student') {
      leaves = LeaveService.getLeavesForStudent(id);
    } else if (role === 'parent') {
      leaves = LeaveService.getLeavesForParent(id);
    } else if (role === 'teacher' || role === 'principal') {
      leaves = LeaveService.getPendingLeaves();
    }

    res.json({ leaves });
  } catch (error) {
    console.error('Leaves error:', error);
    res.status(500).json({ error: 'Failed to fetch leaves' });
  }
});

// PATCH /api/dashboard/leaves/:id - Approve or reject a leave (teacher/principal)
router.patch('/leaves/:leaveId', (req, res) => {
  try {
    const { role, id } = req.user;
    if (!['teacher', 'principal'].includes(role)) {
      return res.status(403).json({ error: 'Only teachers and principals can approve leaves' });
    }

    const { status } = req.body; // 'approved' | 'rejected'
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Status must be approved or rejected' });
    }

    const leave = LeaveService.updateLeaveStatus(req.params.leaveId, status, id);
    if (!leave) return res.status(404).json({ error: 'Leave not found' });

    res.json({ leave });
  } catch (error) {
    console.error('Leave update error:', error);
    res.status(500).json({ error: 'Failed to update leave' });
  }
});

// GET /api/dashboard/notices - Get notices for current user
router.get('/notices', (req, res) => {
  try {
    const { id, role } = req.user;
    const grade = role === 'student' ? '10th' : null;
    const notices = NoticeService.getNoticesForUser(id, role, grade);
    res.json({ notices, unread_count: notices.filter(n => !n.readBy.includes(id)).length });
  } catch (error) {
    console.error('Notices error:', error);
    res.status(500).json({ error: 'Failed to fetch notices' });
  }
});

// PATCH /api/dashboard/notices/:id/read - Mark notice as read
router.patch('/notices/:noticeId/read', (req, res) => {
  try {
    const notice = NoticeService.markAsRead(req.params.noticeId, req.user.id);
    res.json({ notice });
  } catch (error) {
    res.status(500).json({ error: 'Failed to mark notice as read' });
  }
});

// GET /api/dashboard/meetings - Get meetings for current user
router.get('/meetings', (req, res) => {
  try {
    const meetings = MeetingService.getMeetingsForUser(req.user.id);
    res.json({ meetings });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch meetings' });
  }
});
