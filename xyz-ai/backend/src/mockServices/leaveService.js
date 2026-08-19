/**
 * Leave Application Service (Mock)
 * Handles leave applications for students.
 */

const leaves = [];
let leaveCounter = 1;

class LeaveService {
  /**
   * Submit a leave application
   */
  static applyLeave({ studentId, studentName, parentId, startDate, endDate, reason }) {
    const leave = {
      id: `LA-2026-${String(leaveCounter++).padStart(4, '0')}`,
      studentId,
      studentName,
      parentId,
      startDate,
      endDate,
      reason,
      status: 'pending',
      appliedAt: new Date().toISOString(),
      approvedBy: null,
      approvedAt: null
    };
    leaves.push(leave);
    return leave;
  }

  /**
   * Get leaves for a student
   */
  static getLeavesForStudent(studentId) {
    return leaves.filter(l => l.studentId === studentId);
  }

  /**
   * Get leaves submitted by a parent
   */
  static getLeavesForParent(parentId) {
    return leaves.filter(l => l.parentId === parentId);
  }

  /**
   * Get pending leaves for a teacher's class
   */
  static getPendingLeaves() {
    return leaves.filter(l => l.status === 'pending');
  }

  /**
   * Approve or reject a leave
   */
  static updateLeaveStatus(leaveId, status, approvedBy) {
    const leave = leaves.find(l => l.id === leaveId);
    if (!leave) return null;
    leave.status = status;
    leave.approvedBy = approvedBy;
    leave.approvedAt = new Date().toISOString();
    return leave;
  }

  /**
   * Get all leaves (for admin/principal)
   */
  static getAllLeaves() {
    return leaves;
  }
}

module.exports = LeaveService;
