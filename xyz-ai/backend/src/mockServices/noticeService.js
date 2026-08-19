/**
 * Notice/Announcement Service (Mock)
 * Handles school notices sent by teachers/principal.
 */

const notices = [
  {
    id: 'notice-001',
    title: 'Parent-Teacher Meeting',
    content: 'PTM scheduled for August 22, 2026 from 10 AM to 1 PM. All parents are requested to attend.',
    sentBy: 'principal001',
    sentByName: 'Dr. School Principal',
    targetAudience: 'all_parents',
    targetGrade: null,
    createdAt: '2026-08-15T10:00:00Z',
    readBy: ['parent001']
  },
  {
    id: 'notice-002',
    title: 'Science Exhibition',
    content: 'Annual Science Exhibition on August 25. Students from Grade 9-11 can participate. Registration closes Aug 20.',
    sentBy: 'teacher001',
    sentByName: 'Ms. Priya Desai',
    targetAudience: 'students',
    targetGrade: '10th',
    createdAt: '2026-08-16T14:00:00Z',
    readBy: []
  }
];

let noticeCounter = 3;

class NoticeService {
  /**
   * Send a new notice
   */
  static sendNotice({ title, content, sentBy, sentByName, targetAudience, targetGrade }) {
    const notice = {
      id: `notice-${String(noticeCounter++).padStart(3, '0')}`,
      title,
      content,
      sentBy,
      sentByName,
      targetAudience, // 'all_parents', 'students', 'all', 'grade_specific'
      targetGrade,
      createdAt: new Date().toISOString(),
      readBy: []
    };
    notices.push(notice);
    return notice;
  }

  /**
   * Get notices for a specific user based on their role
   */
  static getNoticesForUser(userId, role, grade = null) {
    return notices.filter(n => {
      if (n.targetAudience === 'all') return true;
      if (role === 'parent' && n.targetAudience === 'all_parents') return true;
      if (role === 'student' && n.targetAudience === 'students') {
        if (n.targetGrade && grade && n.targetGrade !== grade) return false;
        return true;
      }
      if (role === 'teacher' || role === 'principal') return true;
      return false;
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  /**
   * Get all notices (for management)
   */
  static getAllNotices() {
    return notices.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  /**
   * Mark a notice as read
   */
  static markAsRead(noticeId, userId) {
    const notice = notices.find(n => n.id === noticeId);
    if (notice && !notice.readBy.includes(userId)) {
      notice.readBy.push(userId);
    }
    return notice;
  }

  /**
   * Get unread count for a user
   */
  static getUnreadCount(userId, role, grade = null) {
    const userNotices = this.getNoticesForUser(userId, role, grade);
    return userNotices.filter(n => !n.readBy.includes(userId)).length;
  }
}

module.exports = NoticeService;
