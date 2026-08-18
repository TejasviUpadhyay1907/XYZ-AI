const { handleMessage } = require('../src/services/ai/orchestrator');
const AttendanceService = require('../src/mockServices/attendanceService');
const StudentService = require('../src/mockServices/studentService');
const EscalationService = require('../src/mockServices/escalationService');
const ConversationService = require('../src/services/conversationService');
const languageService = require('../src/services/languageService');

describe('AI Orchestrator', () => {
  // Clear any existing sessions before each test
  beforeEach(() => {
    const db = require('../db/init').getDatabase();
    db.prepare('DELETE FROM messages').run();
    db.prepare('DELETE FROM sessions').run();
  });

  describe('Student intents', () => {
    const studentInput = {
      sessionId: 'test_student_session',
      userId: 'student123',
      role: 'student',
      language: 'en',
    };

    it('should handle attendance query', async () => {
      const input = { ...studentInput, message: 'What is my attendance?' };
      const output = await handleMessage(input);

      expect(output.reply).toContain('attendance');
      expect(output.suggestedFollowUps).toBeDefined();
      expect(Array.isArray(output.suggestedFollowUps)).toBe(true);
    });

    it('should handle homework query', async () => {
      const input = { ...studentInput, message: 'I need help with homework' };
      const output = await handleMessage(input);

      expect(output.reply).toContain('homework');
      expect(output.suggestedFollowUps).toBeDefined();
    });

    it('should handle generic greeting', async () => {
      const input = { ...studentInput, message: 'Hello!' };
      const output = await handleMessage(input);

      expect(output.reply).toContain('Academic Assistant');
      expect(output.suggestedFollowUps).toBeDefined();
    });

    it('should maintain conversation context for follow-up', async () => {
      // First message
      await handleMessage({ ...studentInput, message: 'What is my attendance?', sessionId: 'context_test' });
      // Follow up
      const input = { ...studentInput, message: 'Show me last month', sessionId: 'context_test' };
      const output = await handleMessage(input);

      expect(output.reply).toContain('attendance');
    });
  });

  describe('Parent intents', () => {
    const parentInput = {
      sessionId: 'test_parent_session',
      userId: 'parent001',
      role: 'parent',
      language: 'en',
    };

    it('should handle child attendance query', async () => {
      const input = { ...parentInput, message: 'What is my child\'s attendance?' };
      const output = await handleMessage(input);

      expect(output.reply).toContain('attendance');
      expect(output.suggestedFollowUps).toBeDefined();
    });

    it('should handle escalation to teacher', async () => {
      const input = { ...parentInput, message: 'I want to escalate to teacher about attendance for rahul', sessionId: 'esc_test' };
      const output = await handleMessage(input);

      expect(output.reply).toContain('Escalation created successfully');
      expect(output.reply.toLowerCase()).toContain('teacher');
      // Check that an escalation was created
      const escalations = EscalationService.getEscalationsForUser('parent001');
      expect(escalations.length).toBeGreaterThan(0);
    });
  });

  describe('Teacher intents', () => {
    const teacherInput = {
      sessionId: 'test_teacher_session',
      userId: 'teacher001',
      role: 'teacher',
      language: 'en',
    };

    it('should handle marking attendance', async () => {
      const input = { ...teacherInput, message: 'Mark Rahul as present', sessionId: 'mark_test' };
      const output = await handleMessage(input);

      expect(output.reply).toContain('Attendance marked successfully');
    });

    it('should handle class attendance query', async () => {
      const input = { ...teacherInput, message: 'Show attendance for my class', sessionId: 'class_test' };
      const output = await handleMessage(input);

      expect(output.reply).toContain('attendance');
      expect(output.suggestedFollowUps).toBeDefined();
    });

    it('should handle escalation to management', async () => {
      const input = { ...teacherInput, message: 'Escalate to management about student behavior', sessionId: 'esc_mgmt_test' };
      const output = await handleMessage(input);

      expect(output.reply).toContain('Escalation created successfully');
      expect(output.reply).toContain('Management');
      const escalations = EscalationService.getEscalationsForUser('teacher001');
      expect(escalations.length).toBeGreaterThan(0);
    });
  });

  describe('Principal intents', () => {
    const principalInput = {
      sessionId: 'test_principal_session',
      userId: 'principal001',
      role: 'principal',
      language: 'en',
    };

    it('should handle school attendance analytics', async () => {
      const input = { ...principalInput, message: 'What is the overall attendance?', sessionId: 'analytics_test' };
      const output = await handleMessage(input);

      expect(output.reply).toContain('attendance');
      expect(output.reply).toContain('school-wide');
      expect(output.suggestedFollowUps).toBeDefined();
    });
  });

  describe('Language support', () => {
    it('should respond in Hindi when language is hi', async () => {
      const input = {
        sessionId: 'lang_test',
        userId: 'student123',
        role: 'student',
        language: 'hi',
        message: 'What is my attendance?'
      };
      const output = await handleMessage(input);

      // The response should be in Hindi (we check for a known Hindi string)
      expect(output.reply).toContain('उपस्थिति'); // part of "उपस्थिति की जानकारी"
    });
  });

  describe('Error handling', () => {
    it('should handle unrecognized role gracefully', async () => {
      const { getDatabase } = require('../db/init');
      const db = getDatabase();

      // Create a user with a known role (so that the foreign key constraint is satisfied)
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('password123', 10);
      const userId = `unknown001_${Date.now()}`;
      const email = `unknown_${Date.now()}@example.com`;
      try {
        db.prepare(`
          INSERT INTO users (id, email, password_hash, role, name)
          VALUES (?, ?, ?, ?, ?)
        `).run(userId, email, hashedPassword, 'student', 'Unknown User');
      } catch (e) {
        // If the user already exists, we can ignore
        if (e.code !== 'SQLITE_CONSTRAINT_PRIMARYKEY') {
          throw e;
        }
      }

      const input = {
        sessionId: 'role_test',
        userId: userId,
        role: 'unknown', // This is the role we are testing
        language: 'en',
        message: 'Hello'
      };
      const output = await handleMessage(input);

      expect(output.reply).toContain('assist you with');
    });
  });
});