// Mock attendance service
const attendanceData = {
  // Student attendance records
  student123: {
    total: 95,
    present: 90,
    absent: 5,
    recent: [
      { date: '2026-08-10', status: 'present' },
      { date: '2026-08-11', status: 'present' },
      { date: '2026-08-12', status: 'present' },
      { date: '2026-08-13', status: 'absent' },
      { date: '2026-08-14', status: 'present' },
      { date: '2026-08-15', status: 'present' },
      { date: '2026-08-16', status: 'present' }
    ]
  },
  student456: {
    total: 88,
    present: 80,
    absent: 8,
    recent: [
      { date: '2026-08-10', status: 'absent' },
      { date: '2026-08-11', status: 'present' },
      { date: '2026-08-12', status: 'present' },
      { date: '2026-08-13', status: 'present' },
      { date: '2026-08-14', status: 'absent' },
      { date: '2026-08-15', status: 'present' },
      { date: '2026-08-16', status: 'present' }
    ]
  },
  student789: {
    total: 92,
    present: 85,
    absent: 7,
    recent: [
      { date: '2026-08-10', status: 'present' },
      { date: '2026-08-11', status: 'present' },
      { date: '2026-08-12', status: 'present' },
      { date: '2026-08-13', status: 'present' },
      { date: '2026-08-14', status: 'absent' },
      { date: '2026-08-15', status: 'present' },
      { date: '2026-08-16', status: 'present' }
    ]
  }
};

// Parent-child relationships
const parentChildMap = {
  parent001: ['student123', 'student456'],
  parent002: ['student789']
};

class AttendanceService {
  // Get student attendance
  static getStudentAttendance(studentId) {
    console.log(`[AttendanceService] getStudentAttendance called with studentId: ${studentId}`);
    const data = attendanceData[studentId];
    if (data) {
      console.log(`[AttendanceService] Found data:`, data);
      return data;
    }
    console.log(`[AttendanceService] No data found for ${studentId}, returning default`);
    return {
      total: 0,
      present: 0,
      absent: 0,
      recent: []
    };
  }

  // Get children for a parent
  static getChildrenForParent(parentId) {
    console.log(`[AttendanceService] getChildrenForParent called with parentId: ${parentId}`);
    const children = parentChildMap[parentId] || [];
    console.log(`[AttendanceService] Children:`, children);
    return children;
  }

  // Mark attendance (teacher action)
  static markAttendance(studentId, date, status, markedBy) {
    // In a real app, this would update a database
    // For mock, we'll just return success
    return {
      success: true,
      message: `Attendance marked for ${studentId} on ${date} as ${status}`,
      record: { studentId, date, status, markedBy, timestamp: new Date() }
    };
  }

  // Get school-wide attendance analytics (principal)
  static getSchoolAttendance() {
    return {
      totalStudents: 150,
      averageAttendance: 92.5,
      totalPresent: 139,
      totalAbsent: 11,
      gradeBreakdown: {
        '9th': { present: 45, absent: 5, total: 50 },
        '10th': { present: 42, absent: 8, total: 50 },
        '11th': { present: 38, absent: 7, total: 45 },
        '12th': { present: 34, absent: 6, total: 40 }
      }
    };
  }
}

module.exports = AttendanceService;
