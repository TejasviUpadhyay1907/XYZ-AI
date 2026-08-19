/**
 * My Day API
 * Generates an intelligent daily briefing for each role.
 * Data is pulled from all services and assembled into one response.
 */

const express = require('express');
const router = express.Router();
const AttendanceService = require('../mockServices/attendanceService');
const StudentService = require('../mockServices/studentService');
const MarksService = require('../mockServices/marksService');
const TimetableService = require('../mockServices/timetableService');
const NoticeService = require('../mockServices/noticeService');
const LeaveService = require('../mockServices/leaveService');

// Helper: get current day name
function getTodayName() {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return days[new Date().getDay()];
}

// Helper: get today's date string
function getTodayStr() {
  const t = new Date();
  return `${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,'0')}-${String(t.getDate()).padStart(2,'0')}`;
}

// Helper: get greeting based on time
function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

// Helper: calculate attendance trend (last 4 weeks, weekly %)
function getAttendanceTrend(studentId) {
  const att = AttendanceService.getStudentAttendance(studentId);
  const allRecords = att.all_records || {};
  const sortedDates = Object.keys(allRecords).sort();

  if (sortedDates.length === 0) return [];

  // Group by week
  const weeks = [];
  const today = new Date();

  for (let w = 7; w >= 0; w--) {
    const weekEnd = new Date(today);
    weekEnd.setDate(today.getDate() - (w * 7));
    const weekStart = new Date(weekEnd);
    weekStart.setDate(weekEnd.getDate() - 6);

    const weekDates = sortedDates.filter(d => {
      const dt = new Date(d);
      return dt >= weekStart && dt <= weekEnd;
    });

    if (weekDates.length === 0) continue;

    const present = weekDates.filter(d => allRecords[d] === 'present').length;
    const total = weekDates.length;
    const pct = total > 0 ? Math.round((present / total) * 100) : 0;

    const label = `${String(weekStart.getDate()).padStart(2,'0')}/${String(weekStart.getMonth()+1).padStart(2,'0')}`;
    weeks.push({ week: label, percentage: pct, present, total });
  }

  return weeks;
}

// GET /api/myday — Get daily briefing for current user
router.get('/', (req, res) => {
  try {
    const { id, role } = req.user;
    const today = getTodayStr();
    const todayDay = getTodayName();
    const greeting = getGreeting();
    const isSchoolDay = !['saturday', 'sunday'].includes(todayDay);

    if (role === 'student') {
      const profile = StudentService.getStudentProfile(id);
      const att = AttendanceService.getStudentAttendance(id);
      const pct = att.total > 0 ? ((att.present / att.total) * 100).toFixed(1) : '0';
      const todayStatus = att.all_records?.[today] || null;

      // Today's timetable
      const timetable = TimetableService.getTodaySchedule('10-B');
      const todayPeriods = (timetable.schedule || []).filter(s => s.type === 'period' && s.subject);

      // Marks insights
      const marks = MarksService.getStudentMarks(id);
      const hyMarks = marks?.hy;

      // Attendance trend
      const trend = getAttendanceTrend(id);

      // Notices
      const notices = NoticeService.getNoticesForUser(id, 'student', '10th');
      const unreadNotices = notices.filter(n => !n.readBy.includes(id));

      // AI insight
      const pctNum = parseFloat(pct);
      let aiInsight = '';
      let insightType = 'positive';
      if (pctNum < 75) {
        aiInsight = `⚠️ Your attendance is ${pct}% — critically below the 75% minimum. You need to attend every class to avoid academic issues.`;
        insightType = 'warning';
      } else if (pctNum < 85) {
        aiInsight = `📉 Your attendance is ${pct}%. Missing more than 2 days this month could push you below 80%.`;
        insightType = 'caution';
      } else {
        aiInsight = `✅ Great job! Your attendance is ${pct}%. Keep it up to maintain your academic standing.`;
        insightType = 'positive';
      }

      // Subject needing attention (lowest marks in HY)
      let weakSubject = null;
      if (hyMarks?.subjects) {
        let lowestPct = 100;
        Object.entries(hyMarks.subjects).forEach(([subj, data]) => {
          if (data.obtained !== null) {
            const subjPct = (data.obtained / data.max) * 100;
            if (subjPct < lowestPct) {
              lowestPct = subjPct;
              weakSubject = { subject: subj, pct: subjPct.toFixed(0) };
            }
          }
        });
      }

      return res.json({
        role,
        greeting: `${greeting}, ${profile?.name?.split(' ')[0] || 'there'}!`,
        date: today,
        day: todayDay,
        is_school_day: isSchoolDay,
        profile,
        attendance: {
          percentage: pct,
          present: att.present,
          absent: att.absent,
          total: att.total,
          today_status: todayStatus,
          trend,
        },
        today_classes: todayPeriods.slice(0, 6).map(p => ({
          time: p.start,
          subject: p.subject?.name,
          teacher: p.subject?.teacher,
          topic: p.subject?.topic,
        })),
        homework_pending: 2, // mock — will be real when homework service is built
        upcoming_exams: [
          { subject: 'Physics', date: '2026-09-15', days_left: 26 },
          { subject: 'Mathematics', date: '2026-09-18', days_left: 29 },
        ],
        marks_summary: hyMarks ? {
          total: hyMarks.total_obtained,
          max: hyMarks.total_max,
          percentage: hyMarks.percentage,
          rank: hyMarks.rank,
          class_size: hyMarks.class_size,
        } : null,
        weak_subject: weakSubject,
        unread_notices: unreadNotices.length,
        ai_insight: aiInsight,
        insight_type: insightType,
      });
    }

    if (role === 'parent') {
      const children = AttendanceService.getChildrenForParent(id);
      const childrenData = children.map(childId => {
        const profile = StudentService.getStudentProfile(childId);
        const att = AttendanceService.getStudentAttendance(childId);
        const pct = att.total > 0 ? ((att.present / att.total) * 100).toFixed(1) : '0';
        const pctNum = parseFloat(pct);
        const marks = MarksService.getStudentMarks(childId);
        const trend = getAttendanceTrend(childId);
        const pendingLeaves = LeaveService.getLeavesForParent(id).filter(l => l.status === 'pending');

        let alert = null;
        if (pctNum < 75) alert = { type: 'danger', message: `${profile?.name?.split(' ')[0]}'s attendance is critically low at ${pct}%` };
        else if (pctNum < 85) alert = { type: 'warning', message: `${profile?.name?.split(' ')[0]}'s attendance is ${pct}% — monitor closely` };

        return {
          id: childId,
          name: profile?.name,
          grade: profile?.grade,
          section: profile?.section,
          attendance: { percentage: pct, present: att.present, absent: att.absent, total: att.total, trend },
          marks_summary: marks?.hy ? {
            percentage: marks.hy.percentage,
            rank: marks.hy.rank,
            class_size: marks.hy.class_size,
          } : null,
          pending_leaves: pendingLeaves.length,
          alert,
        };
      });

      const notices = NoticeService.getNoticesForUser(id, 'parent', null);
      const unreadNotices = notices.filter(n => !n.readBy.includes(id));

      return res.json({
        role,
        greeting: `${greeting}!`,
        date: today,
        is_school_day: isSchoolDay,
        children: childrenData,
        unread_notices: unreadNotices.length,
        upcoming_events: [
          { title: 'Parent-Teacher Meeting', date: '2026-08-22', days_left: 3 },
        ],
        ai_summary: `You have ${children.length} child${children.length > 1 ? 'ren' : ''} enrolled. ${
          childrenData.filter(c => c.alert).length > 0
            ? `⚠️ ${childrenData.filter(c => c.alert).length} child needs your attention.`
            : '✅ All children are attending school regularly.'
        }`,
      });
    }

    if (role === 'teacher') {
      const students = StudentService.getStudentsForTeacher(id);
      const classAttendance = students.map(s => {
        const att = AttendanceService.getStudentAttendance(s.id);
        const pct = att.total > 0 ? ((att.present / att.total) * 100).toFixed(1) : '0';
        return { ...s, attendance_pct: parseFloat(pct), today_status: att.all_records?.[today] || 'not_marked' };
      });

      const needAttention = classAttendance.filter(s => s.attendance_pct < 80);
      const notMarkedToday = classAttendance.filter(s => s.today_status === 'not_marked');
      const pendingLeaves = LeaveService.getPendingLeaves();
      const timetable = TimetableService.getTodaySchedule('10-B');
      const todayPeriods = (timetable.schedule || []).filter(s => s.type === 'period' && s.subject && s.subject.teacherId === id);

      return res.json({
        role,
        greeting: `${greeting}!`,
        date: today,
        is_school_day: isSchoolDay,
        class_summary: {
          total_students: students.length,
          present_today: classAttendance.filter(s => s.today_status === 'present').length,
          absent_today: classAttendance.filter(s => s.today_status === 'absent').length,
          not_marked: notMarkedToday.length,
        },
        today_classes: todayPeriods.map(p => ({
          time: p.start,
          subject: p.subject?.name,
          topic: p.subject?.topic,
        })),
        students_needing_attention: needAttention.map(s => ({
          name: s.name,
          attendance_pct: s.attendance_pct,
          alert: s.attendance_pct < 75 ? 'CRITICAL' : 'LOW',
        })),
        pending_leave_requests: pendingLeaves.length,
        ai_insight: needAttention.length > 0
          ? `⚠️ ${needAttention.length} student(s) have attendance below 80%. Consider reaching out to their parents.`
          : `✅ Your class is doing well. All students above 80% attendance.`,
      });
    }

    if (role === 'principal') {
      const analytics = AttendanceService.getSchoolAttendance();
      const notices = NoticeService.getAllNotices();
      const avgPct = parseFloat(analytics.averageAttendance);

      return res.json({
        role,
        greeting: `${greeting}!`,
        date: today,
        is_school_day: isSchoolDay,
        school_analytics: {
          total_students: analytics.totalStudents,
          average_attendance: analytics.averageAttendance,
          total_present: analytics.totalPresent,
          total_absent: analytics.totalAbsent,
          grade_breakdown: analytics.gradeBreakdown,
        },
        recent_notices: notices.slice(0, 3),
        ai_briefing: `School attendance today is ${analytics.averageAttendance}%. ${
          avgPct < 85
            ? `⚠️ Below target of 85%. Immediate attention needed.`
            : `✅ Above target. School is performing well.`
        }`,
        recommendations: [
          avgPct < 85 ? 'Investigate attendance decline — consider assembly announcement' : null,
          'Review Grade 10th attendance — lowest performing grade',
          'PTM scheduled Aug 22 — ensure parent notifications sent',
        ].filter(Boolean),
      });
    }

    res.json({ error: 'Role not supported' });
  } catch (error) {
    console.error('My Day error:', error);
    res.status(500).json({ error: 'Failed to generate daily briefing' });
  }
});

// GET /api/myday/trend/:studentId — Weekly attendance trend for chart
router.get('/trend/:studentId', (req, res) => {
  try {
    const { id, role } = req.user;
    const { studentId } = req.params;

    // Auth check
    if (role === 'student' && id !== studentId) {
      return res.status(403).json({ error: 'Can only view own trend' });
    }
    if (role === 'parent') {
      const children = AttendanceService.getChildrenForParent(id);
      if (!children.includes(studentId)) return res.status(403).json({ error: 'Not authorized' });
    }

    const trend = getAttendanceTrend(studentId);
    const student = StudentService.getStudentProfile(studentId);

    res.json({ studentId, student_name: student?.name, trend });
  } catch (error) {
    console.error('Trend error:', error);
    res.status(500).json({ error: 'Failed to fetch trend' });
  }
});

// POST /api/myday/weekly-summary — Generate AI weekly summary for parent
router.post('/weekly-summary', async (req, res) => {
  try {
    const { id, role } = req.user;
    if (role !== 'parent') return res.status(403).json({ error: 'Only parents can request weekly summaries' });

    const { childId } = req.body;
    const children = AttendanceService.getChildrenForParent(id);
    if (!children.includes(childId)) return res.status(403).json({ error: 'Not your child' });

    const profile = StudentService.getStudentProfile(childId);
    const att = AttendanceService.getStudentAttendance(childId);
    const pct = att.total > 0 ? ((att.present / att.total) * 100).toFixed(1) : '0';
    const marks = MarksService.getStudentMarks(childId);
    const hyMarks = marks?.hy;
    const notices = NoticeService.getNoticesForUser(id, 'parent', null).slice(0, 2);
    const leaves = LeaveService.getLeavesForParent(id).filter(l => l.studentId === childId).slice(0, 2);

    // Build context for LLM
    const context = `
Student: ${profile?.name}, Grade ${profile?.grade}-${profile?.section}
Attendance: ${att.present}/${att.total} days = ${pct}%
Recent absences: ${att.recent?.filter(r => r.status === 'absent').slice(-3).map(r => r.date).join(', ') || 'None'}
Half-Yearly Marks: ${hyMarks ? `${hyMarks.total_obtained}/${hyMarks.total_max} = ${hyMarks.percentage}%, Rank ${hyMarks.rank} of ${hyMarks.class_size}` : 'Not yet published'}
Recent Notices: ${notices.map(n => n.title).join(', ') || 'None'}
Leave Applications: ${leaves.length > 0 ? leaves.map(l => `${l.startDate}-${l.endDate}: ${l.status}`).join(', ') : 'None'}
    `.trim();

    // Return structured data (we use this for the summary card, not LLM)
    const summary = {
      student_name: profile?.name,
      grade: `${profile?.grade}-${profile?.section}`,
      attendance: {
        percentage: pct,
        present: att.present,
        absent: att.absent,
        status: parseFloat(pct) >= 90 ? 'Excellent' : parseFloat(pct) >= 80 ? 'Good' : parseFloat(pct) >= 75 ? 'Needs Improvement' : 'Critical',
        color: parseFloat(pct) >= 90 ? 'green' : parseFloat(pct) >= 80 ? 'blue' : parseFloat(pct) >= 75 ? 'amber' : 'red',
      },
      academics: hyMarks ? {
        total: hyMarks.total_obtained,
        max: hyMarks.total_max,
        percentage: hyMarks.percentage,
        rank: hyMarks.rank,
        class_size: hyMarks.class_size,
        grade: parseFloat(hyMarks.percentage) >= 90 ? 'A+' : parseFloat(hyMarks.percentage) >= 80 ? 'A' : parseFloat(hyMarks.percentage) >= 70 ? 'B+' : 'B',
      } : null,
      upcoming: [
        { title: 'Physics Class Test 3', date: '2026-09-10', type: 'exam' },
        { title: 'Half Yearly Exam', date: '2026-10-01', type: 'exam' },
      ],
      notices: notices.slice(0, 2).map(n => ({ title: n.title, date: n.createdAt })),
      leaves: leaves.map(l => ({ dates: `${l.startDate} to ${l.endDate}`, reason: l.reason, status: l.status })),
      ai_summary: `${profile?.name?.split(' ')[0]}'s overall performance this week is ${parseFloat(pct) >= 85 ? 'strong' : 'needs attention'}. ${
        parseFloat(pct) < 80 ? `Attendance at ${pct}% is a concern — encourage regular attendance. ` : ''
      }${
        hyMarks?.percentage ? `Half-yearly exam shows ${hyMarks.percentage}% with Rank ${hyMarks.rank} in class. ` : ''
      }${
        parseFloat(pct) >= 85 && parseFloat(hyMarks?.percentage || '0') >= 80 ? `Keep up the great work!` : `Schedule a discussion with the class teacher for guidance.`
      }`,
    };

    res.json({ summary, context_used: context });
  } catch (error) {
    console.error('Weekly summary error:', error);
    res.status(500).json({ error: 'Failed to generate summary' });
  }
});

module.exports = router;
