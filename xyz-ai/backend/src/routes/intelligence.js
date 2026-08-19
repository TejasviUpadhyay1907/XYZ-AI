/**
 * Intelligence API Routes
 * Teacher Copilot, Principal Intelligence, AI Tutor support.
 */

const express = require('express');
const router = express.Router();
const AttendanceService = require('../mockServices/attendanceService');
const StudentService = require('../mockServices/studentService');
const MarksService = require('../mockServices/marksService');
const LeaveService = require('../mockServices/leaveService');

// ============================================
// TEACHER COPILOT
// ============================================

// GET /api/intelligence/teacher/students-needing-attention
// Returns prioritized list of students with risk levels, reasons, recommended actions
router.get('/teacher/students-needing-attention', (req, res) => {
  try {
    const { id, role } = req.user;
    if (!['teacher', 'principal'].includes(role)) {
      return res.status(403).json({ error: 'Only teachers can use the copilot' });
    }

    const students = StudentService.getStudentsForTeacher(id);
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;

    const analyzed = students.map(student => {
      const att = AttendanceService.getStudentAttendance(student.id);
      const pct = att.total > 0 ? ((att.present / att.total) * 100) : 0;
      const marks = MarksService.getStudentMarks(student.id);
      const pendingLeaves = LeaveService.getPendingLeaves().filter(l => l.studentId === student.id);
      const recentAbsences = att.recent?.filter(r => r.status === 'absent' || r.status === 'leave').slice(-5) || [];

      // Calculate risk score (0-100, higher = more risk)
      let riskScore = 0;
      const reasons = [];
      const actions = [];

      // Attendance risk
      if (pct < 65) { riskScore += 40; reasons.push(`Critical attendance: ${pct.toFixed(1)}% (below 65%)`); actions.push('Immediate parent notification required'); }
      else if (pct < 75) { riskScore += 30; reasons.push(`Low attendance: ${pct.toFixed(1)}% (below 75% threshold)`); actions.push('Schedule parent meeting'); }
      else if (pct < 80) { riskScore += 15; reasons.push(`Below-average attendance: ${pct.toFixed(1)}%`); actions.push('Monitor closely this week'); }

      // Recent absence pattern
      const recentAbsentCount = recentAbsences.length;
      if (recentAbsentCount >= 3) { riskScore += 20; reasons.push(`${recentAbsentCount} absences in last 5 school days`); }
      else if (recentAbsentCount >= 2) { riskScore += 10; reasons.push(`${recentAbsentCount} absences recently`); }

      // Academic risk (from half-yearly marks)
      const hyMarks = marks?.hy;
      if (hyMarks?.percentage) {
        const marksPct = parseFloat(hyMarks.percentage);
        if (marksPct < 50) { riskScore += 25; reasons.push(`Very low HY marks: ${marksPct}% (Grade D)`); actions.push('Academic support needed'); }
        else if (marksPct < 60) { riskScore += 15; reasons.push(`Below average HY marks: ${marksPct}%`); actions.push('Consider remedial classes'); }
      }

      // Pending leaves
      if (pendingLeaves.length > 0) { riskScore += 5; reasons.push(`${pendingLeaves.length} pending leave request(s)`); actions.push('Review and approve/reject leaves'); }

      // Not marked today
      const todayStatus = att.all_records?.[todayStr];
      if (!todayStatus) { riskScore += 5; reasons.push('Attendance not marked for today'); actions.push('Mark today\'s attendance'); }

      // Determine risk level
      let riskLevel = 'LOW';
      let riskColor = 'green';
      if (riskScore >= 50) { riskLevel = 'CRITICAL'; riskColor = 'red'; }
      else if (riskScore >= 30) { riskLevel = 'HIGH'; riskColor = 'orange'; }
      else if (riskScore >= 15) { riskLevel = 'MEDIUM'; riskColor = 'amber'; }

      return {
        id: student.id,
        name: student.name,
        grade: student.grade,
        section: student.section,
        risk_score: riskScore,
        risk_level: riskLevel,
        risk_color: riskColor,
        attendance_pct: pct.toFixed(1),
        marks_pct: hyMarks?.percentage || null,
        marks_rank: hyMarks?.rank || null,
        today_status: todayStatus || 'not_marked',
        recent_absences: recentAbsentCount,
        reasons,
        recommended_actions: actions.length > 0 ? actions : ['Student is doing well — no immediate action needed'],
        pending_leaves: pendingLeaves.length,
      };
    });

    // Sort by risk score descending
    analyzed.sort((a, b) => b.risk_score - a.risk_score);

    const summary = {
      total: analyzed.length,
      critical: analyzed.filter(s => s.risk_level === 'CRITICAL').length,
      high: analyzed.filter(s => s.risk_level === 'HIGH').length,
      medium: analyzed.filter(s => s.risk_level === 'MEDIUM').length,
      low: analyzed.filter(s => s.risk_level === 'LOW').length,
    };

    // AI copilot message
    const criticalStudents = analyzed.filter(s => s.risk_level === 'CRITICAL' || s.risk_level === 'HIGH');
    let copilotMessage = '';
    if (criticalStudents.length === 0) {
      copilotMessage = '✅ All students are performing well. No immediate interventions needed. Keep up the great work with your class!';
    } else {
      copilotMessage = `⚠️ ${criticalStudents.length} student(s) need your attention. ${
        analyzed.find(s => s.risk_level === 'CRITICAL')
          ? `${analyzed.find(s => s.risk_level === 'CRITICAL')?.name} is in critical status — immediate action recommended.`
          : `Focus on ${criticalStudents.map(s => s.name).join(' and ')} this week.`
      }`;
    }

    res.json({ students: analyzed, summary, copilot_message: copilotMessage });
  } catch (error) {
    console.error('Teacher copilot error:', error);
    res.status(500).json({ error: 'Failed to analyze students' });
  }
});

// ============================================
// PRINCIPAL INTELLIGENCE
// ============================================

// GET /api/intelligence/principal/school-health
// Returns comprehensive school health report with trends and AI recommendations
router.get('/principal/school-health', (req, res) => {
  try {
    const { role } = req.user;
    if (role !== 'principal') {
      return res.status(403).json({ error: 'Only principal can access school intelligence' });
    }

    const analytics = AttendanceService.getSchoolAttendance();
    const allStudents = ['student123', 'student456', 'student789'];

    // Per-student analysis
    const studentDetails = allStudents.map(sid => {
      const profile = StudentService.getStudentProfile(sid);
      const att = AttendanceService.getStudentAttendance(sid);
      const pct = att.total > 0 ? ((att.present / att.total) * 100) : 0;
      const marks = MarksService.getStudentMarks(sid);
      return {
        id: sid,
        name: profile?.name,
        grade: profile?.grade,
        attendance_pct: pct.toFixed(1),
        hy_marks_pct: marks?.hy?.percentage || null,
      };
    });

    // Identify areas of concern
    const belowThreshold = studentDetails.filter(s => parseFloat(s.attendance_pct) < 75);
    const belowAverage = studentDetails.filter(s => parseFloat(s.attendance_pct) < 85);
    const avgPct = parseFloat(analytics.averageAttendance);

    // Weekly trend — get trend for each student and average
    const trends = allStudents.map(sid => {
      const att = AttendanceService.getStudentAttendance(sid);
      const allRecords = att.all_records || {};
      const sortedDates = Object.keys(allRecords).sort();
      const weeks = [];
      const today = new Date();

      for (let w = 7; w >= 0; w--) {
        const weekEnd = new Date(today);
        weekEnd.setDate(today.getDate() - (w * 7));
        const weekStart = new Date(weekEnd);
        weekStart.setDate(weekEnd.getDate() - 6);
        const weekDates = sortedDates.filter(d => new Date(d) >= weekStart && new Date(d) <= weekEnd);
        if (weekDates.length === 0) continue;
        const present = weekDates.filter(d => allRecords[d] === 'present').length;
        weeks.push(Math.round((present / weekDates.length) * 100));
      }
      return weeks;
    });

    // Average trend across all students
    const maxWeeks = Math.max(...trends.map(t => t.length));
    const schoolTrend = [];
    for (let i = 0; i < maxWeeks; i++) {
      const vals = trends.map(t => t[i] || 0).filter(v => v > 0);
      schoolTrend.push(vals.length > 0 ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0);
    }

    // Trend direction
    const trendUp = schoolTrend.length >= 2 && schoolTrend[schoolTrend.length - 1] > schoolTrend[schoolTrend.length - 2];

    // Generate AI recommendations
    const recommendations = [];
    if (avgPct < 75) {
      recommendations.push({ priority: 'CRITICAL', message: 'School-wide attendance is critically low. Consider an emergency parent communication.', icon: '🚨' });
    } else if (avgPct < 85) {
      recommendations.push({ priority: 'HIGH', message: `Average attendance ${avgPct}% is below 85% target. Weekly attendance drives may help.`, icon: '⚠️' });
    } else {
      recommendations.push({ priority: 'POSITIVE', message: `Attendance is healthy at ${avgPct}%. Maintain current policies.`, icon: '✅' });
    }

    if (belowThreshold.length > 0) {
      recommendations.push({ priority: 'HIGH', message: `${belowThreshold.length} student(s) below 75% threshold: ${belowThreshold.map(s => s.name).join(', ')}. Immediate intervention needed.`, icon: '⚠️' });
    }

    if (!trendUp && schoolTrend.length >= 2) {
      recommendations.push({ priority: 'MEDIUM', message: 'Attendance trend is declining. Investigate root causes — schedule teacher meetings.', icon: '📉' });
    } else if (trendUp) {
      recommendations.push({ priority: 'POSITIVE', message: 'Attendance is improving week-over-week. Current initiatives are working.', icon: '📈' });
    }

    recommendations.push({ priority: 'INFO', message: 'PTM scheduled Aug 22 — good opportunity to discuss attendance with parents.', icon: '📅' });

    res.json({
      school_analytics: analytics,
      student_details: studentDetails,
      concern_areas: {
        below_threshold: belowThreshold,
        below_average: belowAverage,
      },
      trend: {
        data: schoolTrend,
        direction: trendUp ? 'improving' : 'declining',
        change: schoolTrend.length >= 2 ? schoolTrend[schoolTrend.length - 1] - schoolTrend[schoolTrend.length - 2] : 0,
      },
      recommendations,
      ai_briefing: `School attendance stands at ${avgPct}% — ${
        avgPct >= 85 ? '✅ above target' : avgPct >= 75 ? '⚠️ below target' : '🚨 critically low'
      }. ${belowThreshold.length > 0 ? `${belowThreshold.length} students urgently need attention.` : 'No students in critical zone.'} Trend is ${trendUp ? 'improving' : 'declining'}.`,
    });
  } catch (error) {
    console.error('Principal intelligence error:', error);
    res.status(500).json({ error: 'Failed to generate school intelligence' });
  }
});

module.exports = router;
