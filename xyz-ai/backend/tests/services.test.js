const { getDatabase } = require('../db/init');
const AttendanceService = require('../src/mockServices/attendanceService');
const StudentService = require('../src/mockServices/studentService');
const EscalationService = require('../src/mockServices/escalationService');
const ConversationService = require('../src/services/conversationService');

describe('Services', () => {
  let db;

  beforeAll(() => {
    db = getDatabase();
  });

  describe('AttendanceService', () => {
    it('should get student attendance', () => {
      const attendance = AttendanceService.getStudentAttendance('student123');
      expect(attendance).toHaveProperty('total');
      expect(attendance).toHaveProperty('present');
      expect(attendance).toHaveProperty('absent');
      expect(attendance).toHaveProperty('recent');
      expect(Array.isArray(attendance.recent)).toBe(true);
    });

    it('should get children for parent', () => {
      const children = AttendanceService.getChildrenForParent('parent001');
      expect(Array.isArray(children)).toBe(true);
      expect(children.length).toBeGreaterThan(0);
    });

    it('should get school analytics', () => {
      const analytics = AttendanceService.getSchoolAttendance();
      expect(analytics).toHaveProperty('totalStudents');
      expect(analytics).toHaveProperty('averageAttendance');
      expect(analytics).toHaveProperty('totalPresent');
      expect(analytics).toHaveProperty('totalAbsent');
      expect(analytics).toHaveProperty('gradeBreakdown');
    });

    it('should mark attendance', () => {
      const today = new Date().toISOString().split('T')[0];
      const result = AttendanceService.markAttendance('student123', today, 'present', 'teacher001');
      expect(result).toHaveProperty('success', true);
    });
  });

  describe('StudentService', () => {
    it('should get student profile', () => {
      const student = StudentService.getStudentProfile('student123');
      expect(student).toHaveProperty('id', 'student123');
      expect(student).toHaveProperty('name');
      expect(student).toHaveProperty('grade');
      expect(student).toHaveProperty('section');
    });

    it('should get students for teacher', () => {
      const students = StudentService.getStudentsForTeacher('teacher001');
      expect(Array.isArray(students)).toBe(true);
      expect(students.length).toBeGreaterThan(0);
    });

    it('should validate teacher access', () => {
      const canAccess = StudentService.canTeacherAccessStudent('teacher001', 'student123');
      expect(typeof canAccess).toBe('boolean');
    });
  });

  describe('EscalationService', () => {
    it('should create escalation', () => {
      const escalation = EscalationService.createEscalation('session1', 'user1', 'teacher', 'Test reason');
      expect(escalation).toHaveProperty('id');
      expect(escalation).toHaveProperty('sessionId', 'session1');
      expect(escalation).toHaveProperty('userId', 'user1');
      expect(escalation).toHaveProperty('type', 'teacher');
      expect(escalation).toHaveProperty('reason', 'Test reason');
      expect(escalation).toHaveProperty('status', 'pending');
    });

    it('should get escalations for user', () => {
      const escalations = EscalationService.getEscalationsForUser('user1');
      expect(Array.isArray(escalations)).toBe(true);
    });

    it('should update escalation status', () => {
      const escalation = EscalationService.createEscalation('session2', 'user1', 'management', 'Test reason 2');
      const updated = EscalationService.updateEscalationStatus(escalation.id, 'resolved');
      expect(updated).toBe(true);

      // Verify the escalation was actually updated
      const escalations = EscalationService.getEscalationsForUser('user1');
      const updatedEscalation = escalations.find(e => e.id === escalation.id);
      expect(updatedEscalation).toHaveProperty('status', 'resolved');
    });
  });

  describe('ConversationService', () => {
    it('should create and retrieve session', () => {
      const sessionId = `test_session_${Date.now()}`;
      const session = ConversationService.createSession(sessionId, 'student123', 'student', 'en');
      expect(session).toHaveProperty('id', sessionId);
      expect(session).toHaveProperty('user_id', 'student123');
      expect(session).toHaveProperty('role', 'student');
      expect(session).toHaveProperty('language', 'en');
    });

    it('should get or create session for user', () => {
      const session = ConversationService.getOrCreateSession('student123', 'student', 'en');
      expect(session).toHaveProperty('id');
      expect(session).toHaveProperty('user_id', 'student123');
    });

    it('should add and retrieve messages', () => {
      const sessionId = `test_session_${Date.now()}`;
      ConversationService.createSession(sessionId, 'student123', 'student', 'en');

      const message = ConversationService.addMessage(sessionId, 'user', 'Hello');
      expect(message).toHaveProperty('id');
      expect(message).toHaveProperty('session_id', sessionId);
      expect(message).toHaveProperty('sender', 'user');
      expect(message).toHaveProperty('content', 'Hello');

      const history = ConversationService.getHistory(sessionId, 10);
      expect(Array.isArray(history)).toBe(true);
      expect(history.length).toBeGreaterThan(0);
    });

    it('should format history for context', () => {
      const sessionId = `test_session_${Date.now()}`;
      ConversationService.createSession(sessionId, 'student123', 'student', 'en');
      ConversationService.addMessage(sessionId, 'user', 'Hello');
      ConversationService.addMessage(sessionId, 'assistant', 'Hi there!');

      const context = ConversationService.formatHistoryForContext(sessionId, 5);
      expect(context).toContain('Previous conversation:');
      expect(context).toContain('User: Hello');
      expect(context).toContain('Assistant: Hi there!');
    });
  });
});