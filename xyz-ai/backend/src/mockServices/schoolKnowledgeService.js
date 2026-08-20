/**
 * School Knowledge Service (RAG - Retrieval Augmented Generation)
 * 
 * Stores school policy documents and retrieves relevant chunks
 * for answering questions. No external embedding API needed —
 * uses keyword-based relevance scoring (simple but effective for demo).
 */

// School documents — in production these would be uploaded PDFs
const SCHOOL_DOCUMENTS = [
  {
    id: 'attendance-policy',
    title: 'Student Attendance Policy',
    category: 'Policy',
    last_updated: '2026-06-01',
    content: `
Eduvia School — STUDENT ATTENDANCE POLICY

1. MINIMUM ATTENDANCE REQUIREMENT
Students must maintain a minimum of 75% attendance in each subject to be eligible for examinations.
Students with attendance below 75% will not be permitted to appear in the Half-Yearly or Final examinations.
The Principal may grant exemption in exceptional circumstances such as medical emergencies with proper documentation.

2. LEAVE OF ABSENCE
Leave applications must be submitted at least 3 days in advance for planned absences.
Medical leave requires a doctor's certificate within 3 days of return.
Maximum 10 days of medical leave per semester will be considered for attendance condonation.
Leave without prior approval will be marked as unauthorized absence.

3. LATE ARRIVALS
Students arriving more than 15 minutes late to school will be marked as half-absent for the day.
Students arriving more than 30 minutes late must report to the office and will be marked absent for the first period.
Three late arrivals count as one absence for attendance calculation purposes.

4. ATTENDANCE MONITORING
The class teacher will inform parents when a student's attendance falls below 85%.
The principal will issue a warning letter when attendance falls below 75%.
A final notice will be sent when attendance falls below 65%.

5. LONG ABSENCE (MORE THAN 3 DAYS)
For absence of more than 3 consecutive school days, parents must notify the school office.
If absent for more than 5 consecutive days without notification, the school will contact parents.
Extended absence exceeding 15 days may result in the student's name being struck off the rolls.

6. CALCULATION OF ATTENDANCE
Attendance is calculated as: (Days Present / Total School Days) × 100
Leave days are not counted as present days.
Public holidays and school holidays do not count in the total school days.

7. PARENT RESPONSIBILITIES  
Parents are expected to ensure regular attendance of their ward.
Parents must inform the school office before 9:00 AM if a student is absent.
Contact number for absence notification: +91-XXXX-XXXXXX
`.trim()
  },
  {
    id: 'exam-rules',
    title: 'Examination Rules and Guidelines',
    category: 'Academics',
    last_updated: '2026-06-15',
    content: `
Eduvia School — EXAMINATION RULES AND GUIDELINES

1. EXAMINATION SCHEDULE
Half-Yearly Examinations: October 1-15, 2026
Final Examinations: March 1-20, 2027
Class Tests: As scheduled by subject teachers (approximately 3 per semester)

2. CLASS TESTS
Each class test is worth 25 marks.
Three class tests will be held per semester per subject.
The best 2 out of 3 class tests will be counted for assessment.
No re-test will be conducted for missed class tests except in case of medical emergency.

3. HALF-YEARLY EXAMINATION
Worth 100 marks per subject.
Duration: 3 hours per paper.
Students must score minimum 33% in each subject to pass.
Students below 75% attendance are NOT eligible for Half-Yearly examinations.

4. FINAL EXAMINATION  
Worth 100 marks per subject.
Promotion to next class requires 35% aggregate marks.
Students who fail in more than 2 subjects will not be promoted.
Supplementary examinations will be held for students failing in 1-2 subjects.

5. EXAMINATION CONDUCT
Mobile phones are strictly prohibited in examination halls.
Students must carry their examination hall ticket.
Copying or use of unfair means will result in cancellation of the paper.
Repeat offences may result in suspension from examinations.

6. RESULT AND REPORT CARDS
Results will be declared within 15 days of examination completion.
Report cards will be distributed during Parent-Teacher Meeting.
Parents must sign and return the report card acknowledgement slip.

7. GRADING SYSTEM
90-100: A+ (Outstanding)
80-89: A (Excellent)  
70-79: B+ (Very Good)
60-69: B (Good)
50-59: C (Average)
33-49: D (Below Average)
Below 33: F (Fail)
`.trim()
  },
  {
    id: 'school-handbook',
    title: 'Student School Handbook',
    category: 'General',
    last_updated: '2026-06-01',
    content: `
Eduvia School — STUDENT HANDBOOK 2026-27

SCHOOL TIMINGS
School begins at 8:00 AM. Gates close at 8:15 AM.
School ends at 3:00 PM for all classes.
Saturday: 8:00 AM to 12:30 PM (half day).

SCHOOL UNIFORM
Full uniform is mandatory Monday to Friday.
Sports uniform on physical education days (Wednesday for all classes).
Identity card must be worn at all times within school premises.

MOBILE PHONES
Mobile phones are strictly NOT permitted in school.
If found, the phone will be confiscated and returned only to parents.
Smartwatches with phone functionality are also prohibited.

CANTEEN AND FOOD
School canteen operates from 10:15 AM to 10:30 AM (short break) and 12:00 PM to 12:45 PM (lunch break).
Outside food from unauthorized vendors is not permitted.
Students must carry their water bottles.

LIBRARY
Library is open Monday to Saturday from 8:00 AM to 3:00 PM.
Maximum 2 books can be issued at a time.
Books must be returned within 14 days. Fine: Rs. 2/day for late return.

DISCIPLINE
Ragging in any form is strictly prohibited.
Bullying, harassment, or discrimination will result in immediate disciplinary action.
Damage to school property will be charged to the student.

PARENT-TEACHER MEETINGS
PTM is held quarterly. Dates: August 22, November 15, February 10, April 20.
Attendance at PTM is mandatory for parents.
Report cards are distributed only during PTM.

SCHOOL BUS
Bus routes and timings are available on the school website.
Students must carry their bus pass.
Misconduct on the bus will result in cancellation of bus facility.

HOMEWORK POLICY
Homework must be submitted on time.
Maximum 45 minutes of homework per day for classes 9-10.
Parents should sign the homework diary daily.
`.trim()
  },
  {
    id: 'holiday-calendar',
    title: 'School Holiday Calendar 2026-27',
    category: 'Calendar',
    last_updated: '2026-05-01',
    content: `
Eduvia School — HOLIDAY CALENDAR 2026-27

SUMMER VACATION
May 1 – June 30, 2026 (School reopens July 1, 2026)

NATIONAL HOLIDAYS (School Closed)
August 15 – Independence Day
October 2 – Gandhi Jayanti  
October 13 – Dussehra
November 1 – Diwali (School closed October 28 – November 1)
November 15 – Guru Nanak Jayanti
January 26 – Republic Day
February 19 – Chhatrapati Shivaji Maharaj Jayanti
March 17 – Holi
April 14 – Dr. B.R. Ambedkar Jayanti

HALF-TERM BREAK
October 16-20, 2026 (after Half-Yearly examinations)

WINTER BREAK
December 24, 2026 – January 2, 2027

SEMESTER 2 BEGINS
January 3, 2027

ANNUAL SPORTS DAY
August 30, 2026 (School open, sports events all day)

ANNUAL DAY
December 15, 2026

SCIENCE EXHIBITION
August 25, 2026 (Grades 9-11)

PARENT-TEACHER MEETINGS
August 22, 2026
November 15, 2026
February 10, 2027
April 20, 2027

SCHOOL CLOSES FOR THE YEAR
April 30, 2027
`.trim()
  },
  {
    id: 'fee-structure',
    title: 'Fee Structure and Payment Policy',
    category: 'Finance',
    last_updated: '2026-04-01',
    content: `
Eduvia School — FEE STRUCTURE 2026-27

TUITION FEES
Grades 9-10: Rs. 12,000 per month
Grades 11-12: Rs. 14,000 per month

ANNUAL FEES (One-time, payable in April)
Annual maintenance fee: Rs. 8,000
Library fee: Rs. 1,500
Sports fee: Rs. 2,000
Laboratory fee: Rs. 3,000
Computer lab fee: Rs. 2,500

PAYMENT SCHEDULE
Fees must be paid by the 10th of each month.
Late payment fee: Rs. 200 per day after the 10th.

PAYMENT MODES
Online: School portal or bank transfer
Cheque: Payable to "Eduvia School"
Cash: School accounts office (Mon-Sat, 9 AM – 2 PM)

FEE CONCESSION
Siblings: 10% concession on tuition fees for second child, 15% for third.
Merit scholarship: Top 3 students per class receive 25% concession.
Financial hardship cases: Apply to Principal with supporting documents.

IMPORTANT
Fees must be paid regardless of attendance or examination results.
Admission will be cancelled if fees are not paid for 3 consecutive months.
Fee receipts should be kept safely — duplicates will not be issued.
`.trim()
  }
];

/**
 * Simple keyword-based relevance scoring (no external API needed)
 * Scores each chunk based on word overlap with the query
 */
function scoreChunk(chunk, query) {
  const queryWords = query.toLowerCase()
    .split(/\W+/)
    .filter(w => w.length > 3)
    .filter(w => !['what', 'when', 'where', 'which', 'does', 'will', 'have', 'with', 'that', 'this', 'from', 'about', 'tell', 'explain'].includes(w));

  const chunkLower = chunk.toLowerCase();
  let score = 0;

  for (const word of queryWords) {
    const matches = (chunkLower.match(new RegExp(word, 'g')) || []).length;
    score += matches * (word.length > 6 ? 3 : 1); // longer words get higher weight
  }

  return score;
}

/**
 * Split document into paragraphs (natural chunk boundaries)
 */
function chunkDocument(content) {
  return content
    .split(/\n{2,}/)
    .map(chunk => chunk.trim())
    .filter(chunk => chunk.length > 50);
}

class SchoolKnowledgeService {
  /**
   * Search documents for relevant content to answer a query
   * Returns top 3 most relevant chunks with source info
   */
  static search(query) {
    const results = [];

    for (const doc of SCHOOL_DOCUMENTS) {
      const chunks = chunkDocument(doc.content);

      for (const chunk of chunks) {
        const score = scoreChunk(chunk, query);
        if (score > 0) {
          results.push({
            doc_id: doc.id,
            doc_title: doc.title,
            doc_category: doc.category,
            chunk,
            score,
          });
        }
      }
    }

    // Sort by score, return top 3
    results.sort((a, b) => b.score - a.score);
    return results.slice(0, 3);
  }

  /**
   * Get all documents (for browsing)
   */
  static getAllDocuments() {
    return SCHOOL_DOCUMENTS.map(({ id, title, category, last_updated }) => ({
      id, title, category, last_updated,
      preview: SCHOOL_DOCUMENTS.find(d => d.id === id)?.content.substring(0, 150) + '...'
    }));
  }

  /**
   * Get a specific document by ID
   */
  static getDocument(id) {
    return SCHOOL_DOCUMENTS.find(d => d.id === id) || null;
  }

  /**
   * Build RAG context for LLM
   */
  static buildRAGContext(query) {
    const results = this.search(query);
    if (results.length === 0) return null;

    const context = results
      .map((r, i) => `[Source ${i+1}: ${r.doc_title}]\n${r.chunk}`)
      .join('\n\n---\n\n');

    const sources = [...new Set(results.map(r => r.doc_title))];

    return { context, sources, results };
  }
}

module.exports = SchoolKnowledgeService;
