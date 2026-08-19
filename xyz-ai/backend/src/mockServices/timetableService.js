/**
 * Timetable Service (Mock)
 * Full week timetable for each class with subject, teacher, unit, timings.
 */

// Subject definitions with teachers and current units
const SUBJECTS = {
  math:     { name: 'Mathematics',      short: 'Math',    teacher: 'teacher001', teacherName: 'Ms. Priya Desai',    color: '#6366f1' },
  science:  { name: 'Science',          short: 'Sci',     teacher: 'teacher002', teacherName: 'Mr. Amit Kumar',     color: '#10b981' },
  english:  { name: 'English',          short: 'Eng',     teacher: 'teacher001', teacherName: 'Ms. Priya Desai',    color: '#f59e0b' },
  history:  { name: 'History',          short: 'Hist',    teacher: 'teacher002', teacherName: 'Mr. Amit Kumar',     color: '#ef4444' },
  geography:{ name: 'Geography',        short: 'Geo',     teacher: 'teacher001', teacherName: 'Ms. Priya Desai',    color: '#8b5cf6' },
  computer: { name: 'Computer Science', short: 'CS',      teacher: 'teacher002', teacherName: 'Mr. Amit Kumar',     color: '#06b6d4' },
  hindi:    { name: 'Hindi',            short: 'Hindi',   teacher: 'teacher001', teacherName: 'Ms. Priya Desai',    color: '#ec4899' },
  pe:       { name: 'Physical Education','short': 'P.E.', teacher: 'teacher002', teacherName: 'Mr. Amit Kumar',     color: '#84cc16' },
};

// Current units being taught per subject
const CURRENT_UNITS = {
  math:      { unit: 'Unit 4', topic: 'Quadratic Equations',    chapter: 'Chapter 4 — Roots and Factorization' },
  science:   { unit: 'Unit 3', topic: 'Chemical Reactions',     chapter: 'Chapter 3 — Types of Chemical Reactions' },
  english:   { unit: 'Unit 2', topic: 'The Merchant of Venice', chapter: 'Act 2 — The Caskets Scene' },
  history:   { unit: 'Unit 3', topic: 'World War I',            chapter: 'Chapter 5 — Causes and Consequences' },
  geography: { unit: 'Unit 2', topic: 'Natural Resources',      chapter: 'Chapter 2 — Water Resources' },
  computer:  { unit: 'Unit 2', topic: 'Data Structures',        chapter: 'Chapter 2 — Arrays and Linked Lists' },
  hindi:     { unit: 'Unit 3', topic: 'पद्य साहित्य',           chapter: 'Chapter 3 — कबीर के दोहे' },
  pe:        { unit: 'Unit 2', topic: 'Team Sports',            chapter: 'Basketball — Fundamentals' },
};

// Time slots for the day
const TIME_SLOTS = [
  { id: 1, start: '08:00', end: '08:45', type: 'period', label: 'Period 1' },
  { id: 2, start: '08:45', end: '09:30', type: 'period', label: 'Period 2' },
  { id: 3, start: '09:30', end: '10:15', type: 'period', label: 'Period 3' },
  { id: 4, start: '10:15', end: '10:30', type: 'break',  label: 'Short Break' },
  { id: 5, start: '10:30', end: '11:15', type: 'period', label: 'Period 4' },
  { id: 6, start: '11:15', end: '12:00', type: 'period', label: 'Period 5' },
  { id: 7, start: '12:00', end: '12:45', type: 'lunch',  label: 'Lunch Break' },
  { id: 8, start: '12:45', end: '13:30', type: 'period', label: 'Period 6' },
  { id: 9, start: '13:30', end: '14:15', type: 'period', label: 'Period 7' },
  { id: 10, start: '14:15', end: '15:00', type: 'period', label: 'Period 8' },
  { id: 11, start: '15:00', end: '15:00', type: 'end',   label: 'School Ends' },
];

// Full week timetable for Grade 10-B
// Maps: day → slot_id → subject key (null for break/lunch/end)
const TIMETABLE_10B = {
  monday:    { 1: 'math', 2: 'science', 3: 'english', 5: 'history', 6: 'computer', 8: 'geography', 9: 'hindi', 10: 'pe' },
  tuesday:   { 1: 'science', 2: 'math', 3: 'hindi', 5: 'english', 6: 'geography', 8: 'math', 9: 'history', 10: 'computer' },
  wednesday: { 1: 'english', 2: 'history', 3: 'math', 5: 'science', 6: 'hindi', 8: 'computer', 9: 'pe', 10: 'geography' },
  thursday:  { 1: 'geography', 2: 'computer', 3: 'science', 5: 'math', 6: 'english', 8: 'hindi', 9: 'math', 10: 'science' },
  friday:    { 1: 'hindi', 2: 'geography', 3: 'history', 5: 'computer', 6: 'math', 8: 'science', 9: 'english', 10: 'history' },
  saturday:  { 1: 'math', 2: 'english', 3: 'pe', 5: 'science', 6: 'computer', 8: null, 9: null, 10: null }, // half day
};

class TimetableService {
  /**
   * Get full week timetable for a student/class
   */
  static getTimetable(classKey = '10-B') {
    const timetable = TIMETABLE_10B; // expandable per class

    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const result = {};

    for (const day of days) {
      result[day] = TIME_SLOTS.map(slot => {
        const base = {
          slot_id: slot.id,
          time: `${slot.start} – ${slot.end}`,
          start: slot.start,
          end: slot.end,
          type: slot.type,
          label: slot.label,
        };

        if (slot.type !== 'period') {
          return { ...base, subject: null };
        }

        const subjectKey = timetable[day]?.[slot.id];
        if (!subjectKey) {
          // Saturday afternoon - free
          return { ...base, type: 'free', label: 'Free Period', subject: null };
        }

        const subject = SUBJECTS[subjectKey];
        const unit = CURRENT_UNITS[subjectKey];

        return {
          ...base,
          subject: {
            key: subjectKey,
            name: subject.name,
            short: subject.short,
            color: subject.color,
            teacher: subject.teacherName,
            teacherId: subject.teacher,
            unit: unit.unit,
            topic: unit.topic,
            chapter: unit.chapter,
          }
        };
      });
    }

    return { class: classKey, time_slots: TIME_SLOTS, schedule: result };
  }

  /**
   * Get today's schedule
   */
  static getTodaySchedule(classKey = '10-B') {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const today = days[new Date().getDay()];
    const full = this.getTimetable(classKey);

    return {
      day: today,
      is_school_day: today !== 'sunday',
      schedule: full.schedule[today] || null,
    };
  }

  /**
   * Get subjects list with teachers and current units
   */
  static getSubjects() {
    return Object.entries(SUBJECTS).map(([key, s]) => ({
      key,
      ...s,
      current_unit: CURRENT_UNITS[key],
    }));
  }

  static getSubjectKeys() {
    return Object.keys(SUBJECTS);
  }
}

module.exports = TimetableService;
