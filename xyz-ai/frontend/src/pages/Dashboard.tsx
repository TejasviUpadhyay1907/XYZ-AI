import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, Users, User, CheckCircle, XCircle, TrendingUp, MessageCircle } from 'lucide-react';

interface AttendanceData {
  total: number;
  present: number;
  absent: number;
  percentage: string;
  recent?: { date: string; status: string }[];
}

interface StudentProfile {
  id: string;
  name: string;
  grade?: string;
  section?: string;
  roll_number?: number;
}

interface ChildData {
  id: string;
  profile: StudentProfile;
  attendance: AttendanceData;
}

interface ClassStudent {
  id: string;
  name: string;
  grade: string;
  section: string;
  attendance: { present: number; absent: number; total: number; percentage: string };
}

interface SchoolAnalytics {
  totalStudents: number;
  averageAttendance: string;
  totalPresent: number;
  totalAbsent: number;
  gradeBreakdown: Record<string, { present: number; total: number }>;
}

export function Dashboard() {
  const { token, user } = useAuthStore();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [markingStatus, setMarkingStatus] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchDashboard();
  }, [token]);

  const fetchDashboard = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch('/api/dashboard/profile', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setData(await res.json());
      }
    } catch (e) {
      console.error('Dashboard fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  const markAttendance = async (studentId: string, status: 'present' | 'absent') => {
    setMarkingStatus(prev => ({ ...prev, [studentId]: 'loading' }));
    try {
      const res = await fetch('/api/dashboard/mark-attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ studentId, status })
      });
      if (res.ok) {
        setMarkingStatus(prev => ({ ...prev, [studentId]: status }));
        // Refresh data
        setTimeout(fetchDashboard, 500);
      }
    } catch (e) {
      setMarkingStatus(prev => ({ ...prev, [studentId]: 'error' }));
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Loading dashboard...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-gray-500">Unable to load dashboard data.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-50">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-800">
              {data.role === 'student' && 'My Dashboard'}
              {data.role === 'parent' && 'Parent Dashboard'}
              {data.role === 'teacher' && 'Class Dashboard'}
              {data.role === 'principal' && 'School Overview'}
            </h2>
            <p className="text-sm text-gray-500">Welcome, {user?.name}</p>
          </div>
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            Ask XYZ AI
          </button>
        </div>

        {/* Student Dashboard */}
        {data.role === 'student' && <StudentDashboard data={data} />}

        {/* Parent Dashboard */}
        {data.role === 'parent' && <ParentDashboard data={data} />}

        {/* Teacher Dashboard */}
        {data.role === 'teacher' && <TeacherDashboard data={data} markAttendance={markAttendance} markingStatus={markingStatus} />}

        {/* Principal Dashboard */}
        {data.role === 'principal' && <PrincipalDashboard data={data} navigate={navigate} />}
      </div>
    </div>
  );
}

// ============================================
// STUDENT DASHBOARD
// ============================================
function StudentDashboard({ data }: { data: { profile: StudentProfile; attendance: AttendanceData } }) {
  const { profile, attendance } = data;
  const pct = parseFloat(attendance.percentage);
  const pctColor = pct >= 90 ? 'text-green-600' : pct >= 75 ? 'text-yellow-600' : 'text-red-600';

  return (
    <div className="space-y-4">
      {/* Profile Card */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-indigo-100 flex items-center justify-center">
            <GraduationCap className="w-7 h-7 text-indigo-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-800">{profile.name}</h3>
            <p className="text-sm text-gray-500">
              {profile.grade && `Grade ${profile.grade}`}{profile.section && ` - Section ${profile.section}`}
              {profile.roll_number && ` • Roll #${profile.roll_number}`}
            </p>
          </div>
        </div>
      </div>

      {/* Attendance Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Attendance" value={`${attendance.percentage}%`} color={pctColor} />
        <StatCard label="Present" value={String(attendance.present)} color="text-green-600" />
        <StatCard label="Absent" value={String(attendance.absent)} color="text-red-600" />
        <StatCard label="Total Days" value={String(attendance.total)} color="text-gray-800" />
      </div>

      {/* Recent Attendance */}
      {attendance.recent && attendance.recent.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Recent Attendance</h4>
          <div className="space-y-2">
            {attendance.recent.slice(0, 7).map((day, i) => (
              <div key={i} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                <span className="text-sm text-gray-600">{day.date}</span>
                <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                  day.status === 'present' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {day.status === 'present' ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                  {day.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// PARENT DASHBOARD
// ============================================
function ParentDashboard({ data }: { data: { children: ChildData[] } }) {
  return (
    <div className="space-y-4">
      {data.children.map((child) => {
        const pct = parseFloat(child.attendance.percentage);
        const pctColor = pct >= 90 ? 'text-green-600' : pct >= 75 ? 'text-yellow-600' : 'text-red-600';

        return (
          <div key={child.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                <User className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">{child.profile.name}</h3>
                <p className="text-sm text-gray-500">
                  {child.profile.grade && `Grade ${child.profile.grade}`}
                  {child.profile.section && ` - Section ${child.profile.section}`}
                </p>
              </div>
              <div className="ml-auto text-right">
                <p className={`text-2xl font-bold ${pctColor}`}>{child.attendance.percentage}%</p>
                <p className="text-xs text-gray-400">Attendance</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-lg font-bold text-gray-800">{child.attendance.total}</p>
                <p className="text-xs text-gray-500">Total Days</p>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <p className="text-lg font-bold text-green-600">{child.attendance.present}</p>
                <p className="text-xs text-gray-500">Present</p>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <p className="text-lg font-bold text-red-600">{child.attendance.absent}</p>
                <p className="text-xs text-gray-500">Absent</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ============================================
// TEACHER DASHBOARD
// ============================================
function TeacherDashboard({ data, markAttendance, markingStatus }: {
  data: { class_students: ClassStudent[] };
  markAttendance: (id: string, status: 'present' | 'absent') => void;
  markingStatus: Record<string, string>;
}) {
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-700">My Class — Mark Attendance ({today})</h3>
          <span className="text-xs text-gray-400">{data.class_students.length} students</span>
        </div>
        <div className="divide-y divide-gray-50">
          {data.class_students.map((student) => {
            const status = markingStatus[student.id];
            return (
              <div key={student.id} className="flex items-center justify-between px-5 py-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center">
                    <Users className="w-4 h-4 text-gray-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">{student.name}</p>
                    <p className="text-xs text-gray-400">{student.grade}{student.section} • {student.attendance.percentage}% attendance</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {status === 'present' || status === 'absent' ? (
                    <span className={`text-xs font-medium px-3 py-1 rounded-full ${
                      status === 'present' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      Marked {status}
                    </span>
                  ) : status === 'loading' ? (
                    <span className="text-xs text-gray-400">Marking...</span>
                  ) : (
                    <>
                      <button
                        onClick={() => markAttendance(student.id, 'present')}
                        className="px-3 py-1 text-xs font-medium bg-green-50 text-green-700 rounded-lg hover:bg-green-100 border border-green-200 transition-colors"
                      >
                        Present
                      </button>
                      <button
                        onClick={() => markAttendance(student.id, 'absent')}
                        className="px-3 py-1 text-xs font-medium bg-red-50 text-red-700 rounded-lg hover:bg-red-100 border border-red-200 transition-colors"
                      >
                        Absent
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ============================================
// PRINCIPAL DASHBOARD
// ============================================
function PrincipalDashboard({ data, navigate }: { data: { analytics: SchoolAnalytics }; navigate: (path: string) => void }) {
  const { analytics } = data;

  return (
    <div className="space-y-4">
      {/* Top Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Total Students" value={String(analytics.totalStudents)} color="text-gray-800" />
        <StatCard label="Avg Attendance" value={`${analytics.averageAttendance}%`} color="text-indigo-600" />
        <StatCard label="Total Present" value={String(analytics.totalPresent)} color="text-green-600" />
        <StatCard label="Total Absent" value={String(analytics.totalAbsent)} color="text-red-600" />
      </div>

      {/* Grade Breakdown */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h4 className="text-sm font-medium text-gray-700 mb-4">Grade-wise Attendance</h4>
        <div className="space-y-3">
          {Object.entries(analytics.gradeBreakdown).map(([grade, info]) => {
            const pct = info.total > 0 ? ((info.present / info.total) * 100).toFixed(1) : '0';
            const pctNum = parseFloat(pct);
            return (
              <div key={grade} className="flex items-center gap-4">
                <span className="text-sm font-medium text-gray-700 w-20">{grade}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      pctNum >= 90 ? 'bg-green-500' : pctNum >= 75 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${pctNum}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-gray-600 w-16 text-right">{pct}%</span>
                <span className="text-xs text-gray-400 w-20 text-right">{info.present}/{info.total}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Admin Panel Link */}
      <button
        onClick={() => navigate('/admin')}
        className="w-full p-4 bg-white rounded-xl border border-gray-100 shadow-sm text-left hover:bg-gray-50 transition-colors flex items-center gap-3"
      >
        <TrendingUp className="w-5 h-5 text-indigo-600" />
        <div>
          <p className="text-sm font-medium text-gray-800">Agent Trace Panel</p>
          <p className="text-xs text-gray-400">View AI pipeline traces, audit logs, and system stats</p>
        </div>
      </button>
    </div>
  );
}

// ============================================
// SHARED COMPONENTS
// ============================================
function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
      <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
    </div>
  );
}
