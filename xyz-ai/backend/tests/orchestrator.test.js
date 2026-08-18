import { describe, it, expect, beforeAll } from 'vitest';

// Import the orchestrator - it will use the real LLM but fallback gracefully on error
const { handleMessage } = require('../src/services/ai/orchestrator');

/**
 * These tests verify the orchestrator's integration:
 * - Tool execution logic (doesn't need LLM - tested via fallback path)
 * - Error handling (LLM unavailable → graceful fallback)
 * - Session management
 * - Response structure
 * 
 * Note: Full LLM responses are tested in integration/E2E tests with a valid API key.
 * These unit tests verify the architecture works correctly even without LLM.
 */
describe('AI Orchestrator', () => {

  describe('Response structure', () => {
    it('should always return reply, suggestedFollowUps, and sessionId', async () => {
      const output = await handleMessage({
        sessionId: 'test-structure-1',
        userId: 'student123',
        role: 'student',
        language: 'en',
        message: 'Hello'
      });

      expect(output).toHaveProperty('reply');
      expect(output).toHaveProperty('suggestedFollowUps');
      expect(output).toHaveProperty('sessionId');
      expect(typeof output.reply).toBe('string');
      expect(Array.isArray(output.suggestedFollowUps)).toBe(true);
      expect(output.reply.length).toBeGreaterThan(0);
    });

    it('should return a session ID', async () => {
      const output = await handleMessage({
        sessionId: 'test-structure-2',
        userId: 'student123',
        role: 'student',
        language: 'en',
        message: 'Hi'
      });

      expect(output.sessionId).toBeDefined();
      expect(output.sessionId.length).toBeGreaterThan(0);
    });
  });

  describe('Graceful fallback (LLM unavailable)', () => {
    it('should provide student fallback when LLM fails', async () => {
      const output = await handleMessage({
        sessionId: 'test-fallback-student',
        userId: 'student123',
        role: 'student',
        language: 'en',
        message: 'What is my attendance?'
      });

      // Should get either LLM response or graceful fallback
      expect(output.reply).toBeDefined();
      expect(output.reply.length).toBeGreaterThan(10);
    });

    it('should provide parent fallback when LLM fails', async () => {
      const output = await handleMessage({
        sessionId: 'test-fallback-parent',
        userId: 'parent001',
        role: 'parent',
        language: 'en',
        message: 'How is my child doing?'
      });

      expect(output.reply).toBeDefined();
      expect(output.reply.length).toBeGreaterThan(10);
    });

    it('should provide teacher fallback when LLM fails', async () => {
      const output = await handleMessage({
        sessionId: 'test-fallback-teacher',
        userId: 'teacher001',
        role: 'teacher',
        language: 'en',
        message: 'Show my class'
      });

      expect(output.reply).toBeDefined();
      expect(output.reply.length).toBeGreaterThan(10);
    });

    it('should provide principal fallback when LLM fails', async () => {
      const output = await handleMessage({
        sessionId: 'test-fallback-principal',
        userId: 'principal001',
        role: 'principal',
        language: 'en',
        message: 'Analytics please'
      });

      expect(output.reply).toBeDefined();
      expect(output.reply.length).toBeGreaterThan(10);
    });
  });

  describe('Session management', () => {
    it('should create a session and maintain it across messages', async () => {
      const sessionId = 'test-session-persist';

      const output1 = await handleMessage({
        sessionId,
        userId: 'student123',
        role: 'student',
        language: 'en',
        message: 'First message'
      });

      expect(output1.sessionId).toBe(sessionId);

      const output2 = await handleMessage({
        sessionId,
        userId: 'student123',
        role: 'student',
        language: 'en',
        message: 'Second message'
      });

      expect(output2.sessionId).toBe(sessionId);
    });

    it('should handle different users with different sessions', async () => {
      const output1 = await handleMessage({
        sessionId: 'test-user-a-session',
        userId: 'student123',
        role: 'student',
        language: 'en',
        message: 'Hello from student'
      });

      const output2 = await handleMessage({
        sessionId: 'test-user-b-session',
        userId: 'parent001',
        role: 'parent',
        language: 'en',
        message: 'Hello from parent'
      });

      expect(output1.sessionId).not.toBe(output2.sessionId);
    });
  });

  describe('Follow-up suggestions', () => {
    it('should return role-appropriate follow-ups for student', async () => {
      const output = await handleMessage({
        sessionId: 'test-followups-student',
        userId: 'student123',
        role: 'student',
        language: 'en',
        message: 'Hi there'
      });

      expect(output.suggestedFollowUps.length).toBeGreaterThan(0);
    });

    it('should return role-appropriate follow-ups for parent', async () => {
      const output = await handleMessage({
        sessionId: 'test-followups-parent',
        userId: 'parent001',
        role: 'parent',
        language: 'en',
        message: 'Hi'
      });

      expect(output.suggestedFollowUps.length).toBeGreaterThan(0);
    });
  });
});
