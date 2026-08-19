/**
 * Attendance Service (Mock)
 * 
 * REAL-TIME: markAttendance actually updates the in-memory store.
 * Student/Parent see changes immediately — no hardcoded stale dates.
 * Dates are generated from school start (July 1) to TODAY dynamically.
 */

// School start date — all attendance generated from here
const SCHOOL_START = new Date('2026-07-01');

/**
 * Generate all school days from SCHOOL_START to today
 * Skips weekends and known holidays
 */
function generateSchoolDays() {
  const days = [];
  const today = new Date();
  const cursor = new Date(SCHOOL_START);

  while (cursor.getFullYear() < today.getFullYear() ||
         cursor.getMonth() < today.getMonth() ||
         cursor.getDate() <= today.getDate()) {
    const dow = cursor.getDay();
    if (dow !== 0 && dow !== 6) {
      const y = cursor.getFullYear();
      const mo = String(cursor.getMonth() + 1).padStart(2, '0');
      const da = String(cursor.getDate()).padStart(2, '0');
      days.push(`${y}-${mo}-${da}`);
    }
    cursor.setDate(cursor.getDate() + 1);
    if (cursor > today) break;
  }
  return days;
}

/**
 * Build initial attendance record for a student
 * absentDates: specific dates that are absent
 * leaveRanges: [{from, to}] approved leave periods
 */
function buildAttendanceRecord(absentDates = [], leaveRanges = []) {
  const schoolDays = generateSchoolDays();
  const records = {};

  for (const date of schoolDays) {
    let status = 'present';
    if (absentDates.includes(date)) status = 'absent';

    // Check leave ranges
    for (const range of leaveRanges) {
      if (date >= range.from && date <= range.to) {
        status = 'leave';
        break;
      }
    }
    records[date] = status;
  }
  return records;
}

// Build actual attendance records with realistic patterns
const attendanceRecords = {
  student123: buildAttendanceRecord(
    // Specific absent days for Rahul
    ['2026-07-08', '2026-07-09', '2026-07-22', '2026-08-05', '2026-08-13'],
    // Leave ranges (approved leaves)
    [{ from: '2026-07-28', to: '2026-07-29' }]
  ),
  student456: buildAttendanceRecord(
    // Priya absent days
    ['2026-07-05', '2026-07-06', '2026-07-07', '2026-07-21', '2026-08-01', '2026-08-10', '2026-08-14'],
    []
  ),
  student789: buildAttendanceRecord(
    // Arjun absent days
    ['2026-07-10', '2026-07-11', '2026-07-24', '2026-07-25', '2026-08-04', '2026-08-07', '2026-08-18'],
    [{ from: '2026-08-11', to: '2026-08-12' }]
  ),
};

// Parent-child relationships
const parentChildMap = {
  parent001: ['student123', 'student456'],
  parent002: ['student789'],
};

/**
 * Calculate totals from records object
 */
function calculateTotals(records) {
  const dates = Object.keys(records).sort();
  let present = 0, absent = 0, leave = 0;

  for (const date of dates) {
    if (records[date] === 'present') present++;
    else if (records[date] === 'absent') absent++;
    else if (records[date] === 'leave') leave++;
  }

  // Recent = last 30 days
  const recent = dates.slice(-30).map(date => ({
    date,
    status: records[date]
  }));

  return {
    total: dates.length,
    present,
    absent,
    leave,
    recent,
    all_records: records, // full history for heatmap
  };
}

class AttendanceService {

  /**
   * Get student attendance — returns computed from live in-memory store
   */
  static getStudentAttendance(studentId) {
    const records = attendanceRecords[studentId];
    if (!records) {
      return { total: 0, present: 0, absent: 0, leave: 0, recent: [], all_records: {} };
    }
    return calculateTotals(records);
  }

  /**
   * REAL: Actually updates the attendance record in memory
   * Teacher marks → immediately visible to student/parent
   */
  static markAttendance(studentId, date, status, markedBy) {
    // Create record for student if not exists
    if (!attendanceRecords[studentId]) {
      attendanceRecords[studentId] = {};
    }

    const wasPresent = attendanceRecords[studentId][date] === 'present';
    const isPresent = status === 'present';

    // Actually update the record
    attendanceRecords[studentId][date] = status;

    console.log(`[AttendanceService] MARKED: ${studentId} on ${date} = ${status} by ${markedBy}`);

    return {
      success: true,
      studentId,
      date,
      status,
      markedBy,
      previous_status: wasPresent ? 'present' : 'absent',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Apply a leave range (from leave application approval)
   */
  static applyLeave(studentId, fromDate, toDate) {
    if (!attendanceRecords[studentId]) return;
    const cursor = new Date(fromDate + 'T00:00:00');
    const end = new Date(toDate + 'T00:00:00');
    while (cursor <= end) {
      const dow = cursor.getDay();
      if (dow !== 0 && dow !== 6) {
        const y = cursor.getFullYear();
        const m = String(cursor.getMonth() + 1).padStart(2, '0');
        const d = String(cursor.getDate()).padStart(2, '0');
        attendanceRecords[studentId][`${y}-${m}-${d}`] = 'leave';
      }
      cursor.setDate(cursor.getDate() + 1);
    }
    console.log(`[AttendanceService] Leave applied for ${studentId}: ${fromDate} to ${toDate}`);
  }

  /**
   * Get children for a parent
   */
  static getChildrenForParent(parentId) {
    return parentChildMap[parentId] || [];
  }

  /**
   * Get school-wide attendance analytics (principal)
   */
  static getSchoolAttendance() {
    const students = ['student123', 'student456', 'student789'];
    let totalPresent = 0, totalAbsent = 0, totalLeave = 0;

    for (const sid of students) {
      const data = this.getStudentAttendance(sid);
      totalPresent += data.present;
      totalAbsent += data.absent;
      totalLeave += data.leave || 0;
    }

    const totalRecords = totalPresent + totalAbsent + totalLeave;
    const avgPct = totalRecords > 0 ? ((totalPresent / totalRecords) * 100).toFixed(1) : '0';

    return {
      totalStudents: 3,
      averageAttendance: avgPct,
      totalPresent,
      totalAbsent,
      totalLeave,
      gradeBreakdown: {
        '10th': { present: totalPresent, absent: totalAbsent, total: totalRecords },
      }
    };
  }
}

module.exports = AttendanceService;
