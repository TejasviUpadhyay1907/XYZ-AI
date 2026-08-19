/**
 * Marks Service (Mock)
 * Manages class test marks, half-yearly, and final exam marks.
 * Shared in-memory store — teacher updates reflect instantly to student/parent.
 */

// Exam types
const EXAM_TYPES = {
  CLASS_TEST_1: { id: 'ct1', name: 'Class Test 1',    type: 'class_test',  max_marks: 25,  date: '2026-07-15' },
  CLASS_TEST_2: { id: 'ct2', name: 'Class Test 2',    type: 'class_test',  max_marks: 25,  date: '2026-08-05' },
  CLASS_TEST_3: { id: 'ct3', name: 'Class Test 3',    type: 'class_test',  max_marks: 25,  date: '2026-09-10' },
  HALF_YEARLY:  { id: 'hy',  name: 'Half Yearly Exam', type: 'half_yearly', max_marks: 100, date: '2026-10-01' },
  FINAL:        { id: 'fin', name: 'Final Exam',       type: 'final',       max_marks: 100, date: '2027-03-15' },
};

const SUBJECTS_LIST = ['math', 'science', 'english', 'history', 'geography', 'computer', 'hindi', 'pe'];

// Class students for rank calculation
const CLASS_STUDENTS = ['student123', 'student456', 'student789'];

// Pre-populated marks data
// Structure: marks[studentId][examId][subjectKey] = marks_obtained
const marksStore = {
  student123: { // Rahul Sharma
    ct1: { math: 22, science: 20, english: 19, history: 18, geography: 21, computer: 23, hindi: 17, pe: 24 },
    ct2: { math: 23, science: 21, english: 20, history: 20, geography: 22, computer: 24, hindi: 18, pe: 25 },
    ct3: { math: 21, science: 22, english: 22, history: 19, geography: 20, computer: 22, hindi: 20, pe: 23 },
    hy:  { math: 85, science: 78, english: 82, history: 74, geography: 80, computer: 90, hindi: 72, pe: 95 },
    fin: null, // not yet
  },
  student456: { // Priya Patel
    ct1: { math: 20, science: 23, english: 24, history: 22, geography: 19, computer: 21, hindi: 23, pe: 20 },
    ct2: { math: 21, science: 24, english: 23, history: 21, geography: 20, computer: 22, hindi: 24, pe: 21 },
    ct3: { math: 19, science: 23, english: 25, history: 23, geography: 21, computer: 20, hindi: 22, pe: 22 },
    hy:  { math: 80, science: 88, english: 91, history: 82, geography: 77, computer: 85, hindi: 88, pe: 85 },
    fin: null,
  },
  student789: { // Arjun Singh
    ct1: { math: 18, science: 17, english: 16, history: 19, geography: 17, computer: 18, hindi: 15, pe: 22 },
    ct2: { math: 19, science: 18, english: 17, history: 18, geography: 18, computer: 19, hindi: 16, pe: 23 },
    ct3: { math: 17, science: 16, english: 18, history: 20, geography: 16, computer: 17, hindi: 17, pe: 21 },
    hy:  { math: 70, science: 68, english: 65, history: 72, geography: 63, computer: 71, hindi: 60, pe: 80 },
    fin: null,
  }
};

class MarksService {
  /**
   * Get all marks for a student with ranks calculated
   */
  static getStudentMarks(studentId) {
    const studentMarks = marksStore[studentId];
    if (!studentMarks) return null;

    const result = {};

    for (const [examId, exam] of Object.entries(EXAM_TYPES)) {
      const examMarks = studentMarks[exam.id];
      if (!examMarks) {
        result[exam.id] = { exam: { ...exam }, marks: null, total: null, percentage: null, rank: null };
        continue;
      }

      // Calculate totals
      const subjects = {};
      let totalObtained = 0;
      let totalMax = 0;

      for (const subject of SUBJECTS_LIST) {
        // PE not included in academic percentage
        const marks = examMarks[subject] ?? null;
        subjects[subject] = { obtained: marks, max: exam.max_marks };
        if (marks !== null) {
          totalObtained += marks;
          totalMax += exam.max_marks;
        }
      }

      // Calculate rank (compare with class)
      const rank = this._calculateRank(studentId, exam.id, exam.type);
      const percentage = totalMax > 0 ? ((totalObtained / totalMax) * 100).toFixed(1) : null;

      result[exam.id] = {
        exam: { ...exam },
        subjects,
        total_obtained: totalObtained,
        total_max: totalMax,
        percentage: exam.type !== 'class_test' ? percentage : null, // % only for hy/final
        rank,
        class_size: CLASS_STUDENTS.length,
      };
    }

    return result;
  }

  /**
   * Calculate rank for a student in an exam
   */
  static _calculateRank(studentId, examId, examType) {
    const scores = CLASS_STUDENTS.map(sid => {
      const marks = marksStore[sid]?.[examId];
      if (!marks) return { studentId: sid, total: -1 };
      const total = Object.values(marks).reduce((sum, m) => sum + (m || 0), 0);
      return { studentId: sid, total };
    });

    scores.sort((a, b) => b.total - a.total);
    const rank = scores.findIndex(s => s.studentId === studentId) + 1;
    return rank > 0 ? rank : null;
  }

  /**
   * Update marks for a student in an exam (teacher action)
   */
  static updateMarks(studentId, examId, subjectKey, marksObtained) {
    if (!marksStore[studentId]) return null;
    if (!marksStore[studentId][examId]) {
      marksStore[studentId][examId] = {};
    }
    marksStore[studentId][examId][subjectKey] = marksObtained;

    return {
      studentId,
      examId,
      subject: subjectKey,
      marks: marksObtained,
      updated: true,
    };
  }

  /**
   * Get class performance summary (for teacher/principal)
   */
  static getClassPerformance(examId = 'hy') {
    const exam = Object.values(EXAM_TYPES).find(e => e.id === examId);
    if (!exam) return null;

    const summary = CLASS_STUDENTS.map(studentId => {
      const marks = marksStore[studentId]?.[examId];
      if (!marks) return { studentId, marks: null };

      const total = Object.values(marks).reduce((s, m) => s + (m || 0), 0);
      const maxTotal = SUBJECTS_LIST.length * exam.max_marks;
      const percentage = ((total / maxTotal) * 100).toFixed(1);
      const rank = this._calculateRank(studentId, examId, exam.type);

      return { studentId, subjects: marks, total, maxTotal, percentage, rank };
    });

    summary.sort((a, b) => (b.total || 0) - (a.total || 0));

    // Class averages per subject
    const subjectAverages = {};
    for (const subject of SUBJECTS_LIST) {
      const vals = CLASS_STUDENTS.map(s => marksStore[s]?.[examId]?.[subject]).filter(v => v != null);
      subjectAverages[subject] = vals.length > 0 ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1) : 'N/A';
    }

    return { exam, students: summary, subjectAverages, class_size: CLASS_STUDENTS.length };
  }

  /**
   * Get exam types
   */
  static getExamTypes() { return EXAM_TYPES; }
  static getSubjectsList() { return SUBJECTS_LIST; }
}

module.exports = MarksService;
