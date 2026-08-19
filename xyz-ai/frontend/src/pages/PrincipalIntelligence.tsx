import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Lightbulb, RefreshCw, Users } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, CartesianGrid } from 'recharts';

const PRIORITY_CONFIG = {
  CRITICAL: { bg: 'bg-red-50 border-red-200', icon: '🚨', text: 'text-red-700' },
  HIGH:     { bg: 'bg-orange-50 border-orange-200', icon: '⚠️', text: 'text-orange-700' },
  MEDIUM:   { bg: 'bg-amber-50 border-amber-200', icon: '📊', text: 'text-amber-700' },
  POSITIVE: { bg: 'bg-green-50 border-green-200', icon: '✅', text: 'text-green-700' },
  INFO:     { bg: 'bg-blue-50 border-blue-200', icon: '📋', text: 'text-blue-700' },
} as const;

export function PrincipalIntelligence() {
  const { token } = useAuthStore();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchIntelligence(); }, [token]);

  const fetchIntelligence = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch('/api/intelligence/principal/school-health', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setData(await res.json());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  if (loading) return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center">
        <RefreshCw className="w-6 h-6 text-indigo-400 animate-spin mx-auto mb-2" />
        <p className="text-gray-400 text-sm">Generating school intelligence...</p>
      </div>
    </div>
  );

  const analytics = data?.school_analytics;
  const trend = data?.trend;
  const trendChartData = trend?.data?.map((pct: number, i: number) => ({
    week: `W${i + 1}`,
    percentage: pct
  })) || [];

  const avgPct = parseFloat(analytics?.average_attendance || '0');
  const trendUp = trend?.direction === 'improving';

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-50">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/myday')} className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-indigo-600" /> School Intelligence
              </h2>
              <p className="text-sm text-gray-500">AI-powered school health briefing</p>
            </div>
          </div>
          <button onClick={fetchIntelligence} className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* AI Briefing */}
        <div className={`p-4 rounded-xl border mb-5 flex items-start gap-3 ${
          avgPct >= 85 ? 'bg-green-50 border-green-200' : avgPct >= 75 ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200'
        }`}>
          <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-bold">AI</span>
          </div>
          <p className="text-sm text-gray-700 leading-relaxed">{data?.ai_briefing}</p>
        </div>

        {/* Top Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          {[
            { label: 'Total Students', value: analytics?.total_students, color: 'text-gray-800', icon: Users },
            { label: 'Avg Attendance', value: `${avgPct}%`, color: avgPct >= 85 ? 'text-green-600' : 'text-amber-600', icon: TrendingUp },
            { label: 'Present Today', value: analytics?.total_present, color: 'text-green-600', icon: CheckCircle },
            { label: 'Absent Today', value: analytics?.total_absent, color: 'text-red-600', icon: AlertTriangle },
          ].map((s, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs text-gray-500">{s.label}</p>
                <s.icon className="w-3.5 h-3.5 text-gray-300" />
              </div>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Trend Chart */}
        {trendChartData.length > 1 && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                {trendUp
                  ? <><TrendingUp className="w-4 h-4 text-green-500" /> School Attendance Trend — Improving</>
                  : <><TrendingDown className="w-4 h-4 text-red-500" /> School Attendance Trend — Declining</>
                }
              </h3>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                trendUp ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
                {trendUp ? `↑ +${trend?.change}%` : `↓ ${trend?.change}%`} this week
              </span>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={trendChartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <defs>
                  <linearGradient id="attendanceGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="week" tick={{ fontSize: 11 }} stroke="#9ca3af" />
                <YAxis domain={[50, 100]} tick={{ fontSize: 11 }} stroke="#9ca3af" />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 8 }}
                  formatter={(val: any) => [`${val}%`, 'School Avg']}
                />
                <ReferenceLine y={85} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: '85% target', fontSize: 10, fill: '#f59e0b' }} />
                <ReferenceLine y={75} stroke="#ef4444" strokeDasharray="4 4" label={{ value: '75% min', fontSize: 10, fill: '#ef4444' }} />
                <Area type="monotone" dataKey="percentage" stroke="#6366f1" strokeWidth={2.5} fill="url(#attendanceGrad)" dot={{ fill: '#6366f1', r: 4 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Grade Breakdown */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Grade-wise Attendance</h3>
          {Object.entries(analytics?.grade_breakdown || {}).map(([grade, info]: [string, any]) => {
            const pct = info.total > 0 ? ((info.present / info.total) * 100).toFixed(1) : '0';
            const pctN = parseFloat(pct);
            return (
              <div key={grade} className="flex items-center gap-3 mb-2.5">
                <span className="text-sm text-gray-600 w-12 font-medium">{grade}</span>
                <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${pctN >= 90 ? 'bg-green-500' : pctN >= 75 ? 'bg-yellow-500' : 'bg-red-500'}`}
                    style={{ width: `${pctN}%` }}
                  />
                </div>
                <span className="text-sm font-semibold text-gray-700 w-14 text-right">{pct}%</span>
                <span className="text-xs text-gray-400 w-20 text-right">{info.present}/{info.total}</span>
              </div>
            );
          })}
        </div>

        {/* AI Recommendations */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-amber-500" /> AI Recommendations
          </h3>
          <div className="space-y-2">
            {data?.recommendations?.map((rec: any, i: number) => {
              const cfg = PRIORITY_CONFIG[rec.priority as keyof typeof PRIORITY_CONFIG];
              return (
                <div key={i} className={`p-3 rounded-lg border ${cfg.bg} flex items-start gap-3`}>
                  <span className="text-base flex-shrink-0">{rec.icon}</span>
                  <p className={`text-sm ${cfg.text}`}>{rec.message}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Students of concern */}
        {data?.concern_areas?.below_threshold?.length > 0 && (
          <div className="bg-white rounded-xl border border-red-100 shadow-sm p-4 mb-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              Students Below 75% Threshold
            </h3>
            <div className="space-y-2">
              {data.concern_areas.below_threshold.map((s: any, i: number) => (
                <div key={i} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                  <div>
                    <span className="text-sm font-medium text-gray-700">{s.name}</span>
                    <span className="text-xs text-gray-400 ml-2">Grade {s.grade}</span>
                  </div>
                  <span className="text-sm font-bold text-red-600">{s.attendance_pct}%</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Ask AI */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs font-semibold text-gray-600 mb-3">Ask Principal AI</p>
          <div className="flex flex-wrap gap-2">
            {[
              'How is the school doing?',
              'Which class needs most attention?',
              'What should I announce tomorrow?',
              'Give me a school attendance report',
            ].map(prompt => (
              <button key={prompt} onClick={() => navigate(`/?prompt=${encodeURIComponent(prompt)}`)}
                className="text-xs px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-200 hover:bg-indigo-100 transition-colors">
                {prompt}
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
