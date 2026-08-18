const NLUService = require('../src/services/ai/NLUService');

describe('NLUService', () => {
  // Test 1: Student Attendance
  it('should detect GET_ATTENDANCE intent for student', async () => {
    const result = await NLUService.analyze('What is my attendance?', 'student');
    expect(result.intent).toBe(NLUService.constructor.Intents.GET_ATTENDANCE);
  });

  // Test 2: Teacher Mark Attendance
  it('should detect MARK_ATTENDANCE intent for teacher', async () => {
    const result = await NLUService.analyze('Mark Rahul absent today', 'teacher');
    expect(result.intent).toBe(NLUService.constructor.Intents.MARK_ATTENDANCE);
    expect(result.entities.status).toBe('absent');
    expect(result.entities.studentName).toBe('rahul');
  });

  // Add more tests as needed
});