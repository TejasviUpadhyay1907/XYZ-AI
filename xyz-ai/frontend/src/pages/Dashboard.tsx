import { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';
import {
  GraduationCap, Users, User, CheckCircle, TrendingUp,
  MessageCircle, Bell, Calendar, FileText, Send, Clock, Lightbulb,
  AlertTriangle, Star, ArrowRight, Award
} from 'lucide-react';

// ============================================
// TYPES
// ============================================
interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  from: string;
  time: string;
  read: boolean;
}

interface Insight {
  type: string;
  icon: string;
  text: string;
}

// ============================================
// MAIN DASHBOARD
// ============================================
export function Dashboard() {
  const { token, user } = useAuthStore();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [markingStatus, setMarkingStatus] = useState<Record<string, string>>({});
  const notifRef = useRef<HTMLDivElement>(null);

  // Close notification dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    if (showNotifications) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showNotifications]);

  useEffect(() => {
    if (token) {
      fetchAll();
    }
  }, [token]);

  // Real-time attendance polling — refreshes every 30 seconds
  // so if teacher marks attendance, student/parent sees it instantly
  useEffect(() => {
    if (!token) return;
    const interval = setInterval(fetchAll, 30000);
    return () => clearInterval(interval);
  }, [token]);

  const fetchAll = async () => {
    setLoading(true);
    const headers = { 'Authorization': `Bearer ${token}` };

    try {
      const [dashRes, notifRes, insightRes] = await Promise.all([
        fetch('/api/dashboard/profile', { headers }),
        fetch('/api/notifications', { headers }),
        fetch('/api/notifications/insights', { headers })
      ]);

      if (dashRes.ok) setData(await dashRes.json());
      else setError('Failed to load dashboard data. Please refresh.');
      if (notifRes.ok) {
        const nd = await notifRes.json();
        setNotifications(nd.notifications || []);
        setUnreadCount(nd.unread_count || 0);
      }
      if (insightRes.ok) {
        const id = await insightRes.json();
        setInsights(id.insights || []);
      }
    } catch (e) {
      setError('Could not connect to server. Please check your connection.');
      console.error('Dashboard fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  const markAttendance = async (studentId: string, status: 'present' | 'absent') => {
    setMarkingStatus(prev => ({ ...prev, [studentId]: 'loading' }));
    try {
      // Use the real-time academic endpoint — updates instantly for student/parent too
      const res = await fetch('/api/academic/attendance/mark', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ studentId, status })
      });
      if (res.ok) {
        setMarkingStatus(prev => ({ ...prev, [studentId]: status }));
        setTimeout(fetchAll, 300); // refresh dashboard data
      }
    } catch {
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

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <p className="text-red-500 font-medium mb-2">⚠️ {error}</p>
          <button onClick={fetchAll} className="text-sm text-indigo-600 hover:underline">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-800">
              {data?.role === 'student' && 'My Dashboard'}
              {data?.role === 'parent' && 'Parent Dashboard'}
              {data?.role === 'teacher' && 'Class Dashboard'}
              {data?.role === 'principal' && 'School Overview'}
            </h2>
            <p className="text-sm text-gray-500">Welcome, {user?.name}</p>
          </div>
          <div className="flex items-center gap-2">
            {/* Notification Bell */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 top-11 w-80 bg-white rounded-xl border border-gray-200 shadow-lg z-50 max-h-96 overflow-y-auto">
                  <div className="p-3 border-b border-gray-100">
                    <h4 className="text-sm font-semibold text-gray-700">Notifications</h4>
                  </div>
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-sm text-gray-400">No notifications</div>
                  ) : (
                    notifications.slice(0, 8).map((n: any) => (
                      <div key={n.id}
                        className={`px-3 py-2.5 border-b border-gray-50 hover:bg-gray-50 cursor-pointer ${n.priority === 'critical' ? 'bg-red-50' : ''}`}
                        onClick={() => n.action?.path && navigate(n.action.path)}>
                        <div className="flex items-start gap-2">
                          <span className="text-base flex-shrink-0 mt-0.5">{n.icon || '🔔'}</span>
                          <div>
                            <p className="text-sm font-medium text-gray-700">{n.title}</p>
                            <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.body}</p>
                            {n.action && <p className="text-xs text-indigo-600 mt-1 font-medium">{n.action.label} →</p>}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              Ask XYZ AI
            </button>
          </div>
        </div>

        {/* Smart Insights */}
        {insights.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm font-semibold text-gray-700">Smart Insights</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {insights.map((insight, i) => (
                <div key={i} className={`flex items-start gap-3 p-3 rounded-lg border ${
                  insight.type === 'warning' ? 'bg-red-50 border-red-200' :
                  insight.type === 'caution' ? 'bg-amber-50 border-amber-200' :
                  insight.type === 'positive' ? 'bg-green-50 border-green-200' :
                  'bg-blue-50 border-blue-200'
                }`}>
                  <span className="text-lg">{insight.icon}</span>
                  <p className="text-sm text-gray-700">{insight.text}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <QuickActions role={data?.role} navigate={navigate} />

        {/* Role-specific content */}
        {data?.role === 'student' && <StudentDashboard data={data} onRefresh={fetchAll} />}
        {data?.role === 'parent' && <ParentDashboard data={data} />}
        {data?.role === 'teacher' && <TeacherDashboard data={data} markAttendance={markAttendance} markingStatus={markingStatus} />}
        {data?.role === 'principal' && <PrincipalDashboard data={data} navigate={navigate} />}
      </div>
    </div>
  );
}

// ============================================
// QUICK ACTIONS
// ============================================
function QuickActions({ role, navigate }: { role: string; navigate: (path: string) => void }) {
  const actions: Record<string, { label: string; icon: any; color: string; chatPrompt: string; link?: string }[]> = {
    student: [
      { label: 'My Attendance', icon: Calendar, color: 'bg-blue-50 text-blue-700 border-blue-200', chatPrompt: 'What is my attendance?' },
      { label: 'Timetable', icon: Clock, color: 'bg-purple-50 text-purple-700 border-purple-200', link: '/timetable', chatPrompt: '' },
      { label: 'My Marks', icon: Award, color: 'bg-green-50 text-green-700 border-green-200', link: '/marks', chatPrompt: '' },
      { label: 'Apply Leave', icon: FileText, color: 'bg-orange-50 text-orange-700 border-orange-200', link: '/leaves', chatPrompt: '' },
      { label: 'Notices', icon: Bell, color: 'bg-indigo-50 text-indigo-700 border-indigo-200', link: '/notices', chatPrompt: '' },
      { label: 'Ask AI', icon: MessageCircle, color: 'bg-gray-50 text-gray-700 border-gray-200', chatPrompt: 'How can you help me today?' },
    ],
    parent: [
      { label: "Child Attendance", icon: Calendar, color: 'bg-blue-50 text-blue-700 border-blue-200', chatPrompt: "How is my child's attendance?" },
      { label: 'Timetable', icon: Clock, color: 'bg-purple-50 text-purple-700 border-purple-200', link: '/timetable', chatPrompt: '' },
      { label: 'Marks', icon: Award, color: 'bg-green-50 text-green-700 border-green-200', link: '/marks', chatPrompt: '' },
      { label: 'Apply Leave', icon: FileText, color: 'bg-orange-50 text-orange-700 border-orange-200', link: '/leaves', chatPrompt: '' },
      { label: 'Schedule Meeting', icon: Clock, color: 'bg-teal-50 text-teal-700 border-teal-200', chatPrompt: 'I want to schedule a meeting with the teacher' },
      { label: 'Notices', icon: Bell, color: 'bg-purple-50 text-purple-700 border-purple-200', link: '/notices', chatPrompt: '' },
    ],
    teacher: [
      { label: 'Mark Attendance', icon: CheckCircle, color: 'bg-green-50 text-green-700 border-green-200', chatPrompt: 'Show attendance for my class' },
      { label: 'Enter Marks', icon: Award, color: 'bg-blue-50 text-blue-700 border-blue-200', link: '/marks', chatPrompt: '' },
      { label: 'Timetable', icon: Clock, color: 'bg-purple-50 text-purple-700 border-purple-200', link: '/timetable', chatPrompt: '' },
      { label: 'Leave Requests', icon: FileText, color: 'bg-orange-50 text-orange-700 border-orange-200', link: '/leaves', chatPrompt: '' },
      { label: 'Send Notice', icon: Send, color: 'bg-indigo-50 text-indigo-700 border-indigo-200', link: '/notices', chatPrompt: '' },
      { label: 'Escalate Issue', icon: AlertTriangle, color: 'bg-red-50 text-red-700 border-red-200', chatPrompt: 'I want to escalate a concern to management' },
    ],
    principal: [
      { label: 'Analytics', icon: TrendingUp, color: 'bg-indigo-50 text-indigo-700 border-indigo-200', chatPrompt: 'Show overall school attendance' },
      { label: 'Send Notice', icon: Send, color: 'bg-blue-50 text-blue-700 border-blue-200', link: '/notices', chatPrompt: '' },
      { label: 'Trace Panel', icon: Star, color: 'bg-amber-50 text-amber-700 border-amber-200', link: '/admin', chatPrompt: '' },
      { label: 'Low Attendance', icon: AlertTriangle, color: 'bg-red-50 text-red-700 border-red-200', chatPrompt: 'Which students have low attendance?' },
    ],
  };

  const roleActions = actions[role] || [];

  return (
    <div className="mb-6">
      <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
        <ArrowRight className="w-4 h-4" /> Quick Actions
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {roleActions.map((action, i) => (
          <button
            key={i}
            onClick={() => {
              if (action.link) {
                navigate(action.link);
              } else if (action.chatPrompt) {
                navigate('/?prompt=' + encodeURIComponent(action.chatPrompt));
              }
            }}
            className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition-all hover:shadow-sm ${action.color}`}
          >
            <action.icon className="w-4 h-4" />
            {action.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ============================================
// ATTENDANCE HEATMAP CALENDAR
// ============================================
function AttendanceHeatmap({ recent, allRecords }: { recent: { date: string; status: string }[]; allRecords?: Record<string, string> }) {
  // Use allRecords if available (full history), otherwise fall back to recent array
  const recordMap: Record<string, string> = allRecords || {};
  if (!allRecords && recent) {
    recent.forEach(r => { recordMap[r.date] = r.status; });
  }

  // Generate last 30 weekdays ending today
  const days: { date: string; status: string | null; dayNum: string }[] = [];
  const today = new Date();

  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dayOfWeek = d.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) continue;
    const dateStr = d.toISOString().split('T')[0];
    days.push({
      date: dateStr,
      status: recordMap[dateStr] || null,
      dayNum: String(d.getDate())
    });
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
      <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
        <Calendar className="w-4 h-4 text-indigo-500" />
        Attendance Calendar (Last 30 Days)
      </h4>
      <div className="grid grid-cols-10 gap-1.5">
        {days.map((day, i) => (
          <div
            key={i}
            title={`${day.date}: ${day.status || 'No data'}`}
            className={`aspect-square rounded-md flex items-center justify-center text-xs font-medium cursor-default ${
              day.status === 'present' ? 'bg-green-400 text-white' :
              day.status === 'absent' ? 'bg-red-400 text-white' :
              day.status === 'leave' ? 'bg-amber-300 text-white' :
              'bg-gray-100 text-gray-400'
            }`}
          >
            {day.dayNum}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-400" /> Present</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-400" /> Absent</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-amber-300" /> Leave</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-gray-100" /> Holiday/No data</span>
      </div>
    </div>
  );
}

// ============================================
// STUDENT DASHBOARD
// ============================================
function StudentDashboard({ data, onRefresh: _onRefresh }: { data: any; onRefresh: () => void }) {
  const { profile, attendance } = data;
  const pct = parseFloat(attendance.percentage);
  const pctColor = pct >= 90 ? 'text-green-600' : pct >= 75 ? 'text-yellow-600' : 'text-red-600';

  return (
    <div className="space-y-4">
      {/* Profile + Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-xl border shadow-sm md:col-span-1">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-800">{profile?.name}</p>
              <p className="text-xs text-gray-500">{profile?.grade} - {profile?.section}</p>
            </div>
          </div>
        </div>
        <StatCard label="Attendance" value={`${attendance.percentage}%`} color={pctColor} />
        <StatCard label="Present" value={String(attendance.present)} color="text-green-600" />
        <StatCard label="Absent" value={String(attendance.absent)} color="text-red-600" />
      </div>

      {/* Heatmap */}
      <AttendanceHeatmap recent={attendance.recent || []} allRecords={attendance.all_records} />
    </div>
  );
}

// ============================================
// PARENT DASHBOARD
// ============================================
function ParentDashboard({ data }: { data: any }) {
  return (
    <div className="space-y-4">
      {data.children?.map((child: any) => {
        const pct = parseFloat(child.attendance.percentage);
        const pctColor = pct >= 90 ? 'text-green-600' : pct >= 75 ? 'text-yellow-600' : 'text-red-600';
        return (
          <div key={child.id} className="space-y-3">
            <div className="bg-white rounded-xl border shadow-sm p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <User className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">{child.profile?.name}</p>
                    <p className="text-xs text-gray-500">Grade {child.profile?.grade} - {child.profile?.section}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-2xl font-bold ${pctColor}`}>{child.attendance.percentage}%</p>
                  <p className="text-xs text-gray-400">{child.attendance.present}/{child.attendance.total} days</p>
                </div>
              </div>
            </div>
            <AttendanceHeatmap recent={child.attendance.recent || []} allRecords={child.attendance.all_records} />
          </div>
        );
      })}
    </div>
  );
}

// ============================================
// TEACHER DASHBOARD
// ============================================
function TeacherDashboard({ data, markAttendance, markingStatus }: any) {
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-700">My Class — Mark Attendance ({today})</h3>
          <span className="text-xs text-gray-400">{data.class_students?.length} students</span>
        </div>
        <div className="divide-y divide-gray-50">
          {data.class_students?.map((student: any) => {
            const status = markingStatus[student.id];
            return (
              <div key={student.id} className="flex items-center justify-between px-4 py-2.5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                    <Users className="w-4 h-4 text-gray-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">{student.name}</p>
                    <p className="text-xs text-gray-400">{student.grade}{student.section} • {student.attendance.percentage}%</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {status === 'present' || status === 'absent' ? (
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                      status === 'present' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>✓ {status}</span>
                  ) : status === 'loading' ? (
                    <span className="text-xs text-gray-400 animate-pulse">...</span>
                  ) : (
                    <>
                      <button onClick={() => markAttendance(student.id, 'present')} className="px-2.5 py-1 text-xs bg-green-50 text-green-700 rounded-md hover:bg-green-100 border border-green-200">Present</button>
                      <button onClick={() => markAttendance(student.id, 'absent')} className="px-2.5 py-1 text-xs bg-red-50 text-red-700 rounded-md hover:bg-red-100 border border-red-200">Absent</button>
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
function PrincipalDashboard({ data, navigate }: any) {
  const analytics = data.analytics;
  if (!analytics) return null;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Total Students" value={String(analytics.totalStudents)} color="text-gray-800" />
        <StatCard label="Avg Attendance" value={`${analytics.averageAttendance}%`} color="text-indigo-600" />
        <StatCard label="Present" value={String(analytics.totalPresent)} color="text-green-600" />
        <StatCard label="Absent" value={String(analytics.totalAbsent)} color="text-red-600" />
      </div>

      {/* Grade Progress Bars */}
      <div className="bg-white rounded-xl border shadow-sm p-4">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Grade-wise Attendance</h4>
        <div className="space-y-2.5">
          {Object.entries(analytics.gradeBreakdown || {}).map(([grade, info]: [string, any]) => {
            const pct = info.total > 0 ? ((info.present / info.total) * 100).toFixed(1) : '0';
            const pctNum = parseFloat(pct);
            return (
              <div key={grade} className="flex items-center gap-3">
                <span className="text-sm text-gray-600 w-16">{grade}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-2.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${pctNum >= 90 ? 'bg-green-500' : pctNum >= 75 ? 'bg-yellow-500' : 'bg-red-500'}`}
                    style={{ width: `${pctNum}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-gray-700 w-14 text-right">{pct}%</span>
              </div>
            );
          })}
        </div>
      </div>

      <button onClick={() => navigate('/admin')} className="w-full p-3 bg-white rounded-xl border shadow-sm text-left hover:bg-gray-50 flex items-center gap-3">
        <TrendingUp className="w-5 h-5 text-indigo-600" />
        <div>
          <p className="text-sm font-medium text-gray-800">Agent Trace Panel</p>
          <p className="text-xs text-gray-400">View AI reasoning pipeline, audit logs, system stats</p>
        </div>
      </button>
    </div>
  );
}

// ============================================
// SHARED
// ============================================
function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
      <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
    </div>
  );
}
