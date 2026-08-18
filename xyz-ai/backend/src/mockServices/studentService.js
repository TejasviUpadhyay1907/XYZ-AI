// Mock student service
const studentData = {
  student123: {
    id: 'student123',
    name: 'Rahul Sharma',
    grade: '10th',
    section: 'B',
    rollNumber: 23,
    dateOfBirth: '2008-05-15',
    parentId: 'parent001',
    email: 'rahul.student@xyz.edu',
    phone: '555-0123',
    address: '123 School Street, Cityville'
  },
  student456: {
    id: 'student456',
    name: 'Priya Patel',
    grade: '9th',
    section: 'A',
    rollNumber: 12,
    dateOfBirth: '2009-08-22',
    parentId: 'parent001',
    email: 'priya.student@xyz.edu',
    phone: '555-0456',
    address: '456 Learning Ave, Cityville'
  },
  student789: {
    id: 'student789',
    name: 'Arjun Singh',
    grade: '11th',
    section: 'C',
    rollNumber: 34,
    dateOfBirth: '2007-11-03',
    parentId: 'parent002',
    email: 'arjun.student@xyz.edu',
    phone: '555-0789',
    address: '789 Knowledge Rd, Cityville'
  }
};

const teacherData = {
  teacher001: {
    id: 'teacher001',
    name: 'Ms. Priya Desai',
    subject: 'Mathematics',
    department: 'STEM',
    employeeId: 'TCH001',
    email: 'priya.teacher@xyz.edu',
    phone: '555-1000'
  },
  teacher002: {
    id: 'teacher002',
    name: 'Mr. Amit Kumar',
    subject: 'English',
    department: 'Humanities',
    employeeId: 'TCH002',
    email: 'amit.teacher@xyz.edu',
    phone: '555-2000'
  }
};

class StudentService {
  // Get student profile
  static getStudentProfile(studentId) {
    return studentData[studentId] || null;
  }

  // Get teacher profile
  static getTeacherProfile(teacherId) {
    return teacherData[teacherId] || null;
  }

  // Get students for a teacher (simplified)
  static getStudentsForTeacher(teacherId) {
    // Return all students for demo
    return Object.values(studentData);
  }

  // Validate if teacher can access student
  static canTeacherAccessStudent(teacherId, studentId) {
    // In a real app, this would check assignments/enrollments
    // For demo, all teachers can access all students
    return !!studentData[studentId];
  }

  // Validate parent-child relationship
  static canParentAccessChild(parentId, studentId) {
    const student = studentData[studentId];
    return student && student.parentId === parentId;
  }
}

module.exports = StudentService;
