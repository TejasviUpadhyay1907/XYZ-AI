/**
 * Notifications API
 * Provides alerts, notices, and smart insights for each user.
 */

const express = require('express');
const router = express.Router();
const NoticeService = require('../mockServices/noticeService');
const LeaveService = require('../mockServices/leaveService');
const MeetingService = require('../mockServices/meetingService');
const AttendanceService = require('../mockServices/attendanceService');
const StudentService = require('../mockServices/studentService');
const { generateProactiveAlerts } = require('../services/proactiveEngine');

// GET /api/notifications - Get all notifications for current user
router.get('/', (req, res) => {
  try {
    const { id, role } = req.user;
    const notifications = [];

    // 1. Proactive AI alerts (highest priority)
    const proactiveAlerts = generateProactiveAlerts(id, role);
    proactiveAlerts.forEach(alert => {
      notifications.push({
        id: alert.id,
        type: alert.type,
        priority: alert.priority,
        title: alert.title,
        body: alert.message,
        icon: alert.icon,
        action: alert.action,
        from: 'Eduvia AI',
        time: alert.created_at,
        read: false,
        is_proactive: true,
      });
    });

    // 2. Unread notices
    const grade = role === 'student' ? '10th' : null;
    const notices = NoticeService.getNoticesForUser(id, role, grade);
    const unreadNotices = notices.filter(n => !n.readBy.includes(id));
    unreadNotices.forEach(n => {
      notifications.push({
        id: `notice-${n.id}`,
        type: 'notice',
        title: n.title,
        body: n.content.substring(0, 100) + (n.content.length > 100 ? '...' : ''),
        from: n.sentByName,
        time: n.createdAt,
        read: false
      });
    });

    // Pending leave approvals (for teacher)
    if (role === 'teacher') {
      const pendingLeaves = LeaveService.getPendingLeaves();
      pendingLeaves.forEach(l => {
        notifications.push({
          id: `leave-${l.id}`,
          type: 'leave_request',
          title: `Leave request: ${l.studentName}`,
          body: `${l.startDate} to ${l.endDate} — ${l.reason}`,
          from: l.studentName,
          time: l.appliedAt,
          read: false
        });
      });
    }

    // Meeting requests
    const meetings = MeetingService.getMeetingsForUser(id);
    const pendingMeetings = meetings.filter(m => m.status === 'requested' && m.requestedWith === id);
    pendingMeetings.forEach(m => {
      notifications.push({
        id: `meeting-${m.id}`,
        type: 'meeting_request',
        title: `Meeting request from ${m.requestedByName}`,
        body: m.purpose,
        from: m.requestedByName,
        time: m.createdAt,
        read: false
      });
    });

    // Sort by time
    notifications.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

    res.json({ notifications, unread_count: notifications.filter(n => !n.read).length });
  } catch (error) {
    console.error('Notifications error:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// GET /api/notifications/insights - Smart insights based on patterns
router.get('/insights', (req, res) => {
  try {
    const { id, role } = req.user;
    const insights = [];

    if (role === 'student') {
      const att = AttendanceService.getStudentAttendance(id);
      const pct = att.total > 0 ? ((att.present / att.total) * 100) : 0;

      if (pct < 75) {
        insights.push({ type: 'warning', icon: '⚠️', text: `Your attendance is ${pct.toFixed(1)}% — below the 75% minimum requirement. You need to improve immediately.` });
      } else if (pct < 85) {
        insights.push({ type: 'caution', icon: '📉', text: `Your attendance is ${pct.toFixed(1)}%. Try to maintain above 85% for good standing.` });
      } else {
        insights.push({ type: 'positive', icon: '🌟', text: `Great job! Your attendance is ${pct.toFixed(1)}%. Keep it up!` });
      }

      // Check recent pattern
      const recentAbsent = att.recent ? att.recent.filter(d => d.status === 'absent').length : 0;
      if (recentAbsent >= 2) {
        insights.push({ type: 'warning', icon: '📅', text: `You've been absent ${recentAbsent} times in the last week. Your teachers may reach out.` });
      }
    }

    if (role === 'parent') {
      const children = AttendanceService.getChildrenForParent(id);
      children.forEach(childId => {
        const student = StudentService.getStudentProfile(childId);
        const att = AttendanceService.getStudentAttendance(childId);
        const pct = att.total > 0 ? ((att.present / att.total) * 100) : 0;

        if (pct < 80) {
          insights.push({ type: 'warning', icon: '⚠️', text: `${student?.name}'s attendance is ${pct.toFixed(1)}% — this needs attention.` });
        }

        const recentAbsent = att.recent ? att.recent.filter(d => d.status === 'absent').length : 0;
        if (recentAbsent >= 2) {
          insights.push({ type: 'caution', icon: '📅', text: `${student?.name} has been absent ${recentAbsent} days recently. Consider discussing with the teacher.` });
        }

        if (pct >= 90) {
          insights.push({ type: 'positive', icon: '⭐', text: `${student?.name} has excellent attendance at ${pct.toFixed(1)}%!` });
        }
      });
    }

    if (role === 'teacher') {
      const students = StudentService.getStudentsForTeacher(id);
      let lowAttendanceCount = 0;
      let totalAbsentToday = 0;

      students.forEach(student => {
        const att = AttendanceService.getStudentAttendance(student.id);
        const pct = att.total > 0 ? ((att.present / att.total) * 100) : 0;
        if (pct < 80) lowAttendanceCount++;
        const recentAbsent = att.recent ? att.recent.filter(d => d.status === 'absent').length : 0;
        if (recentAbsent > 0) totalAbsentToday++;
      });

      if (lowAttendanceCount > 0) {
        insights.push({ type: 'warning', icon: '📊', text: `${lowAttendanceCount} student(s) in your class have attendance below 80%. Consider reaching out.` });
      }

      insights.push({ type: 'info', icon: '📋', text: `${students.length - totalAbsentToday}/${students.length} students have been regular this week.` });

      const pendingLeaves = LeaveService.getPendingLeaves();
      if (pendingLeaves.length > 0) {
        insights.push({ type: 'action', icon: '📝', text: `${pendingLeaves.length} leave application(s) pending your approval.` });
      }
    }

    if (role === 'principal') {
      const analytics = AttendanceService.getSchoolAttendance();
      const avgPct = parseFloat(analytics.averageAttendance);

      if (avgPct < 85) {
        insights.push({ type: 'warning', icon: '📉', text: `School average attendance is ${avgPct}% — below target of 85%.` });
      } else {
        insights.push({ type: 'positive', icon: '📈', text: `School average attendance is healthy at ${avgPct}%.` });
      }

      // Grade comparison
      const grades = Object.entries(analytics.gradeBreakdown);
      let lowestGrade = null;
      let lowestPct = 100;
      grades.forEach(([grade, data]) => {
        const gPct = data.total > 0 ? (data.present / data.total) * 100 : 0;
        if (gPct < lowestPct) {
          lowestPct = gPct;
          lowestGrade = grade;
        }
      });
      if (lowestGrade) {
        insights.push({ type: 'caution', icon: '🔍', text: `${lowestGrade} has the lowest attendance at ${lowestPct.toFixed(1)}%. May need intervention.` });
      }

      insights.push({ type: 'info', icon: '👥', text: `${analytics.totalStudents} total students tracked across all grades.` });
    }

    res.json({ insights });
  } catch (error) {
    console.error('Insights error:', error);
    res.status(500).json({ error: 'Failed to generate insights' });
  }
});

module.exports = router;
