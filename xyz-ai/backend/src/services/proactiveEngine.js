/**
 * Proactive AI Engine
 * Detects important conditions and generates intelligent alerts.
 * These are returned via the notifications API and shown in the bell icon.
 */

const AttendanceService = require('../mockServices/attendanceService');
const StudentService = require('../mockServices/studentService');
const MarksService = require('../mockServices/marksService');
const LeaveService = require('../mockServices/leaveService');

/**
 * Generate proactive alerts for a given user based on their role and data.
 * Returns an array of alert objects with type, priority, title, message, and action.
 */
function generateProactiveAlerts(userId, role) {
  const alerts = [];
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;

  // Days until a given date
  function daysUntil(dateStr) {
    const target = new Date(dateStr);
    const diff = target.getTime() - today.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  if (role === 'student') {
    const att = AttendanceService.getStudentAttendance(userId);
    const pct = att.total > 0 ? (att.present / att.total) * 100 : 0;

    // Attendance alerts
    if (pct < 65) {
      alerts.push({
        id: `att-critical-${userId}`,
        type: 'attendance',
        priority: 'critical',
        icon: '🚨',
        title: 'Attendance Critical',
        message: `Your attendance is ${pct.toFixed(1)}%. You are at risk of being barred from examinations. Attend every class immediately.`,
        action: { label: 'Check Attendance', path: '/dashboard' },
        created_at: new Date().toISOString(),
      });
    } else if (pct < 75) {
      alerts.push({
        id: `att-low-${userId}`,
        type: 'attendance',
        priority: 'high',
        icon: '⚠️',
        title: 'Low Attendance Warning',
        message: `Your attendance is ${pct.toFixed(1)}% — below the 75% minimum requirement. You need to attend all upcoming classes.`,
        action: { label: 'View Details', path: '/dashboard' },
        created_at: new Date().toISOString(),
      });
    } else if (pct < 80) {
      alerts.push({
        id: `att-caution-${userId}`,
        type: 'attendance',
        priority: 'medium',
        icon: '📉',
        title: 'Attendance Below Average',
        message: `Your attendance is ${pct.toFixed(1)}%. Stay consistent — missing 2 more days could drop you below 75%.`,
        action: { label: 'View Timetable', path: '/timetable' },
        created_at: new Date().toISOString(),
      });
    }

    // Exam alerts
    const upcomingExams = [
      { name: 'Class Test 3', date: '2026-09-10' },
      { name: 'Half-Yearly Exam', date: '2026-10-01' },
    ];
    for (const exam of upcomingExams) {
      const days = daysUntil(exam.date);
      if (days >= 0 && days <= 7) {
        alerts.push({
          id: `exam-${exam.name}-${userId}`,
          type: 'exam',
          priority: days <= 2 ? 'high' : 'medium',
          icon: '📝',
          title: `${exam.name} in ${days} day${days !== 1 ? 's' : ''}`,
          message: `${exam.name} is on ${exam.date}. ${days <= 2 ? 'Start revision now!' : 'Time to start preparing.'}`,
          action: { label: 'Study with AI Tutor', path: '/tutor' },
          created_at: new Date().toISOString(),
        });
      }
    }

    // Marks alert — if HY marks show weakness
    const marks = MarksService.getStudentMarks(userId);
    if (marks?.hy?.subjects) {
      const subjects = Object.entries(marks.hy.subjects);
      const failingSubjects = subjects.filter(([, data]) =>
        data.obtained !== null && (data.obtained / data.max) * 100 < 40
      );
      if (failingSubjects.length > 0) {
        alerts.push({
          id: `marks-low-${userId}`,
          type: 'academics',
          priority: 'high',
          icon: '📊',
          title: 'Low Marks Alert',
          message: `You scored below 40% in ${failingSubjects.length} subject(s) in Half-Yearly. Consider requesting extra help from your teacher.`,
          action: { label: 'View Marks', path: '/marks' },
          created_at: new Date().toISOString(),
        });
      }
    }

    // Homework reminder (mock)
    alerts.push({
      id: `homework-${userId}`,
      type: 'homework',
      priority: 'low',
      icon: '📚',
      title: '2 Assignments Pending',
      message: 'You have 2 pending homework assignments. Complete them before the deadline.',
      action: { label: 'Check Homework', path: '/dashboard' },
      created_at: new Date().toISOString(),
    });
  }

  if (role === 'parent') {
    const children = AttendanceService.getChildrenForParent(userId);

    for (const childId of children) {
      const profile = StudentService.getStudentProfile(childId);
      const childName = profile?.name?.split(' ')[0] || 'Your child';
      const att = AttendanceService.getStudentAttendance(childId);
      const pct = att.total > 0 ? (att.present / att.total) * 100 : 0;

      if (pct < 75) {
        alerts.push({
          id: `parent-att-${childId}`,
          type: 'attendance',
          priority: 'critical',
          icon: '🚨',
          title: `${childName}'s Attendance Critical`,
          message: `${childName}'s attendance has fallen to ${pct.toFixed(1)}%. Immediate action required to avoid exam ban.`,
          action: { label: 'View Details', path: '/dashboard' },
          created_at: new Date().toISOString(),
        });
      } else if (pct < 85) {
        alerts.push({
          id: `parent-att-low-${childId}`,
          type: 'attendance',
          priority: 'medium',
          icon: '⚠️',
          title: `${childName}'s Attendance: ${pct.toFixed(1)}%`,
          message: `${childName} is below the 85% target. Consider discussing attendance with ${childName} and the class teacher.`,
          action: { label: 'Schedule Meeting', path: '/meetings' },
          created_at: new Date().toISOString(),
        });
      }

      // Today's attendance
      const todayStatus = att.all_records?.[todayStr];
      if (todayStatus === 'absent') {
        alerts.push({
          id: `today-absent-${childId}`,
          type: 'attendance',
          priority: 'high',
          icon: '❌',
          title: `${childName} is Absent Today`,
          message: `${childName} has been marked absent today (${todayStr}). If this is unexpected, contact the school.`,
          action: { label: 'Contact School', path: '/?prompt=' + encodeURIComponent(`I want to contact the school about ${childName}'s absence today`) },
          created_at: new Date().toISOString(),
        });
      }
    }

    // PTM reminder
    const ptmDays = daysUntil('2026-08-22');
    if (ptmDays >= 0 && ptmDays <= 5) {
      alerts.push({
        id: 'ptm-reminder',
        type: 'event',
        priority: 'medium',
        icon: '🏫',
        title: `PTM in ${ptmDays} day${ptmDays !== 1 ? 's' : ''}`,
        message: `Parent-Teacher Meeting is on August 22nd. Report cards will be distributed. Your attendance is mandatory.`,
        action: { label: 'View Details', path: '/notices' },
        created_at: new Date().toISOString(),
      });
    }
  }

  if (role === 'teacher') {
    const students = StudentService.getStudentsForTeacher(userId);
    const belowThreshold = students.filter(s => {
      const att = AttendanceService.getStudentAttendance(s.id);
      const pct = att.total > 0 ? (att.present / att.total) * 100 : 0;
      return pct < 75;
    });

    if (belowThreshold.length > 0) {
      alerts.push({
        id: `teacher-threshold-${userId}`,
        type: 'students',
        priority: 'high',
        icon: '⚠️',
        title: `${belowThreshold.length} Student(s) Below 75%`,
        message: `${belowThreshold.map(s => s.name).join(', ')} ${belowThreshold.length === 1 ? 'has' : 'have'} attendance below 75%. Parent notification recommended.`,
        action: { label: 'Open Copilot', path: '/copilot' },
        created_at: new Date().toISOString(),
      });
    }

    const pendingLeaves = LeaveService.getPendingLeaves();
    if (pendingLeaves.length > 0) {
      alerts.push({
        id: `teacher-leaves-${userId}`,
        type: 'admin',
        priority: 'medium',
        icon: '📋',
        title: `${pendingLeaves.length} Pending Leave Request(s)`,
        message: `You have ${pendingLeaves.length} leave application(s) waiting for your approval.`,
        action: { label: 'Review Leaves', path: '/leaves' },
        created_at: new Date().toISOString(),
      });
    }

    // Students not marked today
    const notMarkedToday = students.filter(s => {
      const att = AttendanceService.getStudentAttendance(s.id);
      return !att.all_records?.[todayStr];
    });
    if (notMarkedToday.length > 0 && notMarkedToday.length === students.length) {
      alerts.push({
        id: `teacher-nomark-${userId}`,
        type: 'attendance',
        priority: 'medium',
        icon: '📝',
        title: 'Attendance Not Marked Today',
        message: `You haven't marked attendance for your class today (${todayStr}). Please mark it now.`,
        action: { label: 'Mark Attendance', path: '/dashboard' },
        created_at: new Date().toISOString(),
      });
    }
  }

  if (role === 'principal') {
    const analytics = AttendanceService.getSchoolAttendance();
    const avgPct = parseFloat(analytics.averageAttendance);

    if (avgPct < 80) {
      alerts.push({
        id: 'principal-school-att',
        type: 'school',
        priority: 'high',
        icon: '📉',
        title: 'School Attendance Below Target',
        message: `School average attendance is ${avgPct}% — below the 85% target. Review attendance trends and consider school-wide initiatives.`,
        action: { label: 'View Intelligence', path: '/school-intel' },
        created_at: new Date().toISOString(),
      });
    }

    const ptmDays = daysUntil('2026-08-22');
    if (ptmDays >= 0 && ptmDays <= 7) {
      alerts.push({
        id: 'ptm-principal',
        type: 'event',
        priority: 'medium',
        icon: '📅',
        title: `PTM in ${ptmDays} day${ptmDays !== 1 ? 's' : ''}`,
        message: `Parent-Teacher Meeting on August 22nd. Ensure all teachers are prepared and notices are sent to parents.`,
        action: { label: 'Send Notice', path: '/notices' },
        created_at: new Date().toISOString(),
      });
    }
  }

  // Sort by priority
  const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  alerts.sort((a, b) => (priorityOrder[a.priority] || 3) - (priorityOrder[b.priority] || 3));

  return alerts;
}

module.exports = { generateProactiveAlerts };
