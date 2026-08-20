import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';
import {
  Sun, MessageCircle, BookOpen, Calendar, Award,
  Bell, AlertTriangle, CheckCircle, Clock, TrendingUp,
  Users, Lightbulb, ArrowRight, ChevronRight,
  Star, RefreshCw
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';

export function MyDay() {
  const { token, user } = useAuthStore();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [weeklySummary, setWeeklySummary] = useState<any>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [selectedChild, setSelectedChild] = useState<string>('');

  useEffect(() => { fetchMyDay(); }, [token]);

  const fetchMyDay = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch('/api/myday', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const d = await res.json();
        setData(d);
        if (d.children?.length > 0) setSelectedChild(d.children[0].id);
      } else {
        setData(null);
      }
    } catch (e) { setData(null); console.error(e); }
    finally { setLoading(false); }
  };

  const fetchWeeklySummary = async (childId: string) => {
    if (!token || !childId) return;
    setSummaryLoading(true);
    try {
      const res = await fetch('/api/myday/weekly-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ childId })
      });
      if (res.ok) setWeeklySummary(await res.json());
    } catch (e) { console.error(e); }
    finally { setSummaryLoading(false); }
  };

  if (loading) return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center">
        <Sun className="w-8 h-8 text-amber-400 mx-auto animate-spin mb-3" />
        <p className="text-gray-400 text-sm">Preparing your day...</p>
      </div>
    </div>
  );

  if (!data) return <div className="flex-1 flex items-center justify-center"><p className="text-gray-400">Unable to load My Day</p></div>;

  return (
    <div className="flex-1 overflow-y-auto bg-gradient-to-b from-indigo-50 to-gray-50">
      <div className="max-w-4xl mx-auto p-4 md:p-6">
        {/* Greeting Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 mb-5 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Sun className="w-5 h-5 text-yellow-300" />
                <span className="text-indigo-200 text-sm font-medium">
                  {new Date().toLocaleDateString('en', { weekday: 'long', day: 'numeric', month: 'long' })}
                </span>
              </div>
              <h1 className="text-2xl font-bold">{data.greeting}</h1>
              {!data.is_school_day && (
                <p className="text-indigo-200 text-sm mt-1">🏖️ No school today — enjoy your day!</p>
              )}
            </div>
            <button onClick={fetchMyDay} className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors">
              <RefreshCw className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>

        {/* === STUDENT VIEW === */}
        {user?.role === 'student' && data && <StudentMyDay data={data} navigate={navigate} />}

        {/* === PARENT VIEW === */}
        {user?.role === 'parent' && data && (
          <ParentMyDay
            data={data}
            selectedChild={selectedChild}
            setSelectedChild={setSelectedChild}
            weeklySummary={weeklySummary}
            summaryLoading={summaryLoading}
            onRequestSummary={fetchWeeklySummary}
            navigate={navigate}
          />
        )}

        {/* === TEACHER VIEW === */}
        {user?.role === 'teacher' && data && <TeacherMyDay data={data} navigate={navigate} />}

        {/* === PRINCIPAL VIEW === */}
        {user?.role === 'principal' && data && <PrincipalMyDay data={data} navigate={navigate} />}
      </div>
    </div>
  );
}

// ============================================
// ATTENDANCE TREND CHART — shared component
// ============================================
function AttendanceTrendChart({ trend, title }: { trend: any[]; title?: string }) {
  if (!trend || trend.length < 2) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
      <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
        <TrendingUp className="w-4 h-4 text-indigo-600" />
        {title || 'Attendance Trend (Last 8 Weeks)'}
      </h4>
      <ResponsiveContainer width="100%" height={160}>
        <LineChart data={trend} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="week" tick={{ fontSize: 11 }} stroke="#9ca3af" />
          <YAxis domain={[50, 100]} tick={{ fontSize: 11 }} stroke="#9ca3af" />
          <Tooltip
            contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
            formatter={(val: any) => [`${val}%`, 'Attendance']}
          />
          <ReferenceLine y={75} stroke="#ef4444" strokeDasharray="3 3" label={{ value: '75% min', fontSize: 10, fill: '#ef4444' }} />
          <ReferenceLine y={85} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: '85% target', fontSize: 10, fill: '#f59e0b' }} />
          <Line
            type="monotone"
            dataKey="percentage"
            stroke="#6366f1"
            strokeWidth={2}
            dot={{ fill: '#6366f1', r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
      <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
        <span className="flex items-center gap-1"><span className="w-5 h-0.5 bg-red-400 inline-block" /> 75% minimum</span>
        <span className="flex items-center gap-1"><span className="w-5 h-0.5 bg-amber-400 inline-block" /> 85% target</span>
      </div>
    </div>
  );
}

// ============================================
// STUDENT MY DAY
// ============================================
function StudentMyDay({ data, navigate }: any) {
  const pctNum = parseFloat(data.attendance?.percentage || '0');
  const pctColor = pctNum >= 90 ? 'text-green-600' : pctNum >= 75 ? 'text-amber-600' : 'text-red-600';
  const pctBg = pctNum >= 90 ? 'bg-green-50 border-green-200' : pctNum >= 75 ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200';

  return (
    <div className="space-y-4">
      {/* AI Insight Banner */}
      <div className={`p-4 rounded-xl border ${pctBg} flex items-start gap-3`}>
        <Lightbulb className={`w-5 h-5 flex-shrink-0 mt-0.5 ${pctColor}`} />
        <p className="text-sm text-gray-700">{data.ai_insight}</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-3">
          <p className="text-xs text-gray-500 mb-1">Attendance</p>
          <p className={`text-2xl font-bold ${pctColor}`}>{data.attendance?.percentage}%</p>
          <p className="text-xs text-gray-400">{data.attendance?.present}/{data.attendance?.total} days</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-3">
          <p className="text-xs text-gray-500 mb-1">HY Marks</p>
          {data.marks_summary ? (
            <>
              <p className="text-2xl font-bold text-indigo-600">{data.marks_summary.percentage}%</p>
              <p className="text-xs text-gray-400">Rank {data.marks_summary.rank}/{data.marks_summary.class_size}</p>
            </>
          ) : <p className="text-sm text-gray-400">Not published</p>}
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-3">
          <p className="text-xs text-gray-500 mb-1">Homework</p>
          <p className="text-2xl font-bold text-orange-500">{data.homework_pending}</p>
          <p className="text-xs text-gray-400">pending</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-3">
          <p className="text-xs text-gray-500 mb-1">Notices</p>
          <p className="text-2xl font-bold text-purple-600">{data.unread_notices}</p>
          <p className="text-xs text-gray-400">unread</p>
        </div>
      </div>

      {/* Today's Classes */}
      {data.is_school_day && data.today_classes?.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-600" /> Today's Classes
          </h3>
          <div className="space-y-2">
            {data.today_classes.map((cls: any, i: number) => (
              <div key={i} className="flex items-center gap-3 py-1.5 border-b border-gray-50 last:border-0">
                <span className="text-xs font-mono text-gray-400 w-12 flex-shrink-0">{cls.time}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">{cls.subject}</p>
                  <p className="text-xs text-gray-400">{cls.topic} · {cls.teacher}</p>
                </div>
              </div>
            ))}
          </div>
          <button onClick={() => navigate('/timetable')} className="mt-2 text-xs text-indigo-600 hover:underline flex items-center gap-1">
            View full timetable <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Attendance Trend Chart */}
      <AttendanceTrendChart trend={data.attendance?.trend} />

      {/* Upcoming Exams */}
      {data.upcoming_exams?.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <Award className="w-4 h-4 text-indigo-600" /> Upcoming Exams
          </h3>
          <div className="space-y-2">
            {data.upcoming_exams.map((exam: any, i: number) => (
              <div key={i} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                <span className="text-sm font-medium text-gray-700">{exam.subject} Exam</span>
                <div className="text-right">
                  <p className="text-xs text-gray-500">{exam.date}</p>
                  <p className="text-xs font-medium text-orange-600">{exam.days_left} days left</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Weak subject alert */}
      {data.weak_subject && (
        <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-amber-800">Subject needs attention</p>
            <p className="text-xs text-amber-700 mt-0.5">
              Your lowest score is in {data.weak_subject.subject} ({data.weak_subject.pct}%). Consider asking for extra help.
            </p>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Ask AI', icon: MessageCircle, path: '/', color: 'bg-indigo-600 text-white' },
          { label: 'My Marks', icon: Award, path: '/marks', color: 'bg-white border border-gray-200 text-gray-700' },
          { label: 'Notices', icon: Bell, path: '/notices', color: 'bg-white border border-gray-200 text-gray-700' },
        ].map((item, i) => (
          <button key={i} onClick={() => navigate(item.path)}
            className={`flex flex-col items-center gap-1 py-3 rounded-xl text-xs font-medium transition-all hover:shadow-sm ${item.color}`}>
            <item.icon className="w-5 h-5" />
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ============================================
// PARENT MY DAY
// ============================================
function ParentMyDay({ data, selectedChild, setSelectedChild, weeklySummary, summaryLoading, onRequestSummary, navigate }: any) {
  const child = data.children?.find((c: any) => c.id === selectedChild) || data.children?.[0];

  return (
    <div className="space-y-4">
      {/* AI Summary Banner */}
      <div className={`p-4 rounded-xl border flex items-start gap-3 ${
        data.children?.some((c: any) => c.alert?.type === 'danger') ? 'bg-red-50 border-red-200' :
        data.children?.some((c: any) => c.alert) ? 'bg-amber-50 border-amber-200' :
        'bg-green-50 border-green-200'
      }`}>
        <Lightbulb className="w-5 h-5 flex-shrink-0 mt-0.5 text-indigo-600" />
        <p className="text-sm text-gray-700">{data.ai_summary}</p>
      </div>

      {/* Child selector tabs */}
      {data.children?.length > 1 && (
        <div className="flex gap-2">
          {data.children.map((c: any) => (
            <button key={c.id} onClick={() => setSelectedChild(c.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                selectedChild === c.id ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}>
              {c.name?.split(' ')[0]}
              {c.alert && <span className="ml-1.5 w-2 h-2 rounded-full bg-red-400 inline-block" />}
            </button>
          ))}
        </div>
      )}

      {child && (
        <>
          {/* Alert */}
          {child.alert && (
            <div className={`p-3 rounded-xl border flex items-center gap-3 ${
              child.alert.type === 'danger' ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'
            }`}>
              <AlertTriangle className={`w-4 h-4 ${child.alert.type === 'danger' ? 'text-red-600' : 'text-amber-600'}`} />
              <p className="text-sm font-medium text-gray-700">{child.alert.message}</p>
            </div>
          )}

          {/* Child Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Attendance', value: `${child.attendance?.percentage}%`, sub: `${child.attendance?.present}/${child.attendance?.total} days`, color: parseFloat(child.attendance?.percentage) >= 85 ? 'text-green-600' : 'text-amber-600' },
              { label: 'Grade', value: `${child.grade}-${child.section}`, sub: 'Class', color: 'text-indigo-600' },
              { label: 'HY Rank', value: child.marks_summary ? `#${child.marks_summary.rank}` : 'N/A', sub: child.marks_summary ? `of ${child.marks_summary.class_size}` : 'Not published', color: 'text-purple-600' },
              { label: 'Pending Leaves', value: String(child.pending_leaves), sub: 'applications', color: child.pending_leaves > 0 ? 'text-orange-600' : 'text-gray-600' },
            ].map((s, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-100 shadow-sm p-3">
                <p className="text-xs text-gray-500 mb-1">{s.label}</p>
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-gray-400">{s.sub}</p>
              </div>
            ))}
          </div>

          {/* Attendance Trend */}
          <AttendanceTrendChart trend={child.attendance?.trend} title={`${child.name?.split(' ')[0]}'s Attendance Trend`} />

          {/* Weekly AI Summary */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-500" />
                Weekly AI Summary
              </h3>
              <button
                onClick={() => onRequestSummary(child.id)}
                disabled={summaryLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white text-xs rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                {summaryLoading ? (
                  <><RefreshCw className="w-3 h-3 animate-spin" /> Generating...</>
                ) : (
                  <><TrendingUp className="w-3 h-3" /> Generate Summary</>
                )}
              </button>
            </div>

            {!weeklySummary && !summaryLoading && (
              <div className="text-center py-6 text-gray-400">
                <Star className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Click "Generate Summary" to get a full AI report on {child.name?.split(' ')[0]}'s week</p>
              </div>
            )}

            {weeklySummary && (
              <WeeklySummaryCard summary={weeklySummary.summary} navigate={navigate} />
            )}
          </div>

          {/* Upcoming Events */}
          {data.upcoming_events?.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-amber-800 mb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4" /> Upcoming Events
              </h3>
              {data.upcoming_events.map((e: any, i: number) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">{e.title}</span>
                  <span className="text-amber-700 font-medium text-xs">{e.date} · {e.days_left} days</span>
                </div>
              ))}
            </div>
          )}

          {/* Quick Actions */}
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: 'Ask AI', icon: MessageCircle, path: '/' },
              { label: 'Attendance', icon: CheckCircle, path: '/dashboard' },
              { label: 'Marks', icon: Award, path: '/marks' },
              { label: 'Notices', icon: Bell, path: '/notices' },
            ].map((item, i) => (
              <button key={i} onClick={() => navigate(item.path)}
                className="flex flex-col items-center gap-1 py-3 bg-white border border-gray-200 rounded-xl text-xs font-medium text-gray-600 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 transition-all">
                <item.icon className="w-5 h-5" />
                {item.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// Weekly Summary Card
function WeeklySummaryCard({ summary, navigate }: any) {
  if (!summary) return null;
  const colorMap: Record<string, string> = { green: 'text-green-600', blue: 'text-blue-600', amber: 'text-amber-600', red: 'text-red-600' };
  const attColor = colorMap[summary.attendance?.color] || 'text-gray-700';

  return (
    <div className="space-y-3">
      {/* AI Summary text */}
      <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-100">
        <p className="text-sm text-indigo-800 leading-relaxed">{summary.ai_summary}</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Attendance */}
        <div className="p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-500 mb-1">Attendance</p>
          <p className={`text-xl font-bold ${attColor}`}>{summary.attendance?.percentage}%</p>
          <p className="text-xs text-gray-400">{summary.attendance?.status} · {summary.attendance?.present}/{summary.attendance?.total} days</p>
        </div>

        {/* Academics */}
        {summary.academics && (
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500 mb-1">Half Yearly</p>
            <p className="text-xl font-bold text-indigo-600">{summary.academics.percentage}%</p>
            <p className="text-xs text-gray-400">Grade {summary.academics.grade} · Rank #{summary.academics.rank}</p>
          </div>
        )}
      </div>

      {/* Upcoming exams */}
      {summary.upcoming?.length > 0 && (
        <div>
          <p className="text-xs font-medium text-gray-600 mb-1">Upcoming Exams</p>
          {summary.upcoming.map((u: any, i: number) => (
            <div key={i} className="flex items-center justify-between text-xs py-1 border-b border-gray-100 last:border-0">
              <span className="text-gray-700">{u.title}</span>
              <span className="text-orange-600 font-medium">{u.date}</span>
            </div>
          ))}
        </div>
      )}

      {/* Leaves */}
      {summary.leaves?.length > 0 && (
        <div>
          <p className="text-xs font-medium text-gray-600 mb-1">Leave Applications</p>
          {summary.leaves.map((l: any, i: number) => (
            <div key={i} className="flex items-center justify-between text-xs py-1">
              <span className="text-gray-600">{l.dates} — {l.reason}</span>
              <span className={`px-1.5 py-0.5 rounded-full font-medium ${
                l.status === 'approved' ? 'bg-green-100 text-green-700' :
                l.status === 'rejected' ? 'bg-red-100 text-red-700' :
                'bg-amber-100 text-amber-700'
              }`}>{l.status}</span>
            </div>
          ))}
        </div>
      )}

      <button onClick={() => navigate('/?prompt=' + encodeURIComponent('Tell me everything important about my child this week'))}
        className="w-full py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 flex items-center justify-center gap-2">
        <MessageCircle className="w-4 h-4" /> Ask AI for more details
      </button>
    </div>
  );
}

// ============================================
// TEACHER MY DAY
// ============================================
function TeacherMyDay({ data, navigate }: any) {
  return (
    <div className="space-y-4">
      {/* AI Insight */}
      <div className={`p-4 rounded-xl border flex items-start gap-3 ${
        data.students_needing_attention?.length > 0 ? 'bg-amber-50 border-amber-200' : 'bg-green-50 border-green-200'
      }`}>
        <Lightbulb className="w-5 h-5 flex-shrink-0 mt-0.5 text-indigo-600" />
        <p className="text-sm text-gray-700">{data.ai_insight}</p>
      </div>

      {/* Class Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Students', value: data.class_summary?.total_students, color: 'text-gray-800' },
          { label: 'Present Today', value: data.class_summary?.present_today, color: 'text-green-600' },
          { label: 'Absent Today', value: data.class_summary?.absent_today, color: 'text-red-600' },
          { label: 'Not Marked', value: data.class_summary?.not_marked, color: data.class_summary?.not_marked > 0 ? 'text-orange-600' : 'text-gray-400' },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-100 shadow-sm p-3">
            <p className="text-xs text-gray-500 mb-1">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value ?? '—'}</p>
          </div>
        ))}
      </div>

      {/* Today's teaching */}
      {data.today_classes?.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-indigo-600" /> Your Classes Today
          </h3>
          <div className="space-y-2">
            {data.today_classes.map((cls: any, i: number) => (
              <div key={i} className="flex items-center gap-3 py-1.5 border-b border-gray-50 last:border-0">
                <span className="text-xs font-mono text-gray-400 w-12 flex-shrink-0">{cls.time}</span>
                <div>
                  <p className="text-sm font-medium text-gray-800">{cls.subject}</p>
                  <p className="text-xs text-gray-400">{cls.topic}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Students needing attention */}
      {data.students_needing_attention?.length > 0 && (
        <div className="bg-white rounded-xl border border-red-100 shadow-sm p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            Students Needing Attention ({data.students_needing_attention.length})
          </h3>
          <div className="space-y-2">
            {data.students_needing_attention.map((s: any, i: number) => (
              <div key={i} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                <span className="text-sm font-medium text-gray-700">{s.name}</span>
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-bold ${s.alert === 'CRITICAL' ? 'text-red-600' : 'text-amber-600'}`}>
                    {s.attendance_pct}%
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    s.alert === 'CRITICAL' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                  }`}>{s.alert}</span>
                </div>
              </div>
            ))}
          </div>
          <button onClick={() => navigate('/?prompt=' + encodeURIComponent('Which students need my attention today?'))}
            className="mt-3 w-full py-2 bg-indigo-50 text-indigo-700 text-sm rounded-lg hover:bg-indigo-100 border border-indigo-200 flex items-center justify-center gap-2">
            <MessageCircle className="w-4 h-4" /> Ask AI for action plan
          </button>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Mark Attendance', icon: CheckCircle, path: '/dashboard' },
          { label: 'Enter Marks', icon: Award, path: '/marks' },
          { label: 'Leave Requests', icon: Calendar, path: '/leaves' },
        ].map((item, i) => (
          <button key={i} onClick={() => navigate(item.path)}
            className="flex flex-col items-center gap-1 py-3 bg-white border border-gray-200 rounded-xl text-xs font-medium text-gray-600 hover:bg-indigo-50 hover:text-indigo-700 transition-all">
            <item.icon className="w-5 h-5" />
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ============================================
// PRINCIPAL MY DAY
// ============================================
function PrincipalMyDay({ data, navigate }: any) {
  const avgPct = parseFloat(data.school_analytics?.average_attendance || '0');

  return (
    <div className="space-y-4">
      {/* AI Briefing */}
      <div className={`p-4 rounded-xl border flex items-start gap-3 ${
        avgPct >= 85 ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'
      }`}>
        <Lightbulb className="w-5 h-5 flex-shrink-0 mt-0.5 text-indigo-600" />
        <p className="text-sm text-gray-700">{data.ai_briefing}</p>
      </div>

      {/* School Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Students', value: data.school_analytics?.total_students, color: 'text-gray-800' },
          { label: 'Avg Attendance', value: `${data.school_analytics?.average_attendance}%`, color: avgPct >= 85 ? 'text-green-600' : 'text-amber-600' },
          { label: 'Present', value: data.school_analytics?.total_present, color: 'text-green-600' },
          { label: 'Absent', value: data.school_analytics?.total_absent, color: 'text-red-600' },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-100 shadow-sm p-3">
            <p className="text-xs text-gray-500 mb-1">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Grade Breakdown */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-indigo-600" /> Grade-wise Attendance
        </h3>
        {Object.entries(data.school_analytics?.grade_breakdown || {}).map(([grade, info]: [string, any]) => {
          const pct = info.total > 0 ? ((info.present / info.total) * 100).toFixed(1) : '0';
          const pctN = parseFloat(pct);
          return (
            <div key={grade} className="flex items-center gap-3 mb-2">
              <span className="text-sm text-gray-600 w-12">{grade}</span>
              <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${pctN >= 90 ? 'bg-green-500' : pctN >= 75 ? 'bg-yellow-500' : 'bg-red-500'}`}
                  style={{ width: `${pctN}%` }} />
              </div>
              <span className="text-sm font-medium text-gray-700 w-14 text-right">{pct}%</span>
            </div>
          );
        })}
      </div>

      {/* AI Recommendations */}
      {data.recommendations?.length > 0 && (
        <div className="bg-white rounded-xl border border-indigo-100 shadow-sm p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-amber-500" /> AI Recommendations
          </h3>
          <ul className="space-y-2">
            {data.recommendations.map((rec: string, i: number) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                <ArrowRight className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
                {rec}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: 'Ask AI', icon: MessageCircle, path: '/?prompt=' + encodeURIComponent('How is the school doing?') },
          { label: 'Dashboard', icon: TrendingUp, path: '/dashboard' },
          { label: 'Send Notice', icon: Bell, path: '/notices' },
          { label: 'Traces', icon: Users, path: '/admin' },
        ].map((item, i) => (
          <button key={i} onClick={() => navigate(item.path)}
            className="flex flex-col items-center gap-1 py-3 bg-white border border-gray-200 rounded-xl text-xs font-medium text-gray-600 hover:bg-indigo-50 hover:text-indigo-700 transition-all">
            <item.icon className="w-5 h-5" />
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}
