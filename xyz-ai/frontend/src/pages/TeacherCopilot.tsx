import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, AlertTriangle, CheckCircle, MessageCircle, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';

const RISK_CONFIG = {
  CRITICAL: { bg: 'bg-red-50', border: 'border-red-300', text: 'text-red-700', badge: 'bg-red-100 text-red-700', dot: 'bg-red-500' },
  HIGH:     { bg: 'bg-orange-50', border: 'border-orange-300', text: 'text-orange-700', badge: 'bg-orange-100 text-orange-700', dot: 'bg-orange-400' },
  MEDIUM:   { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', badge: 'bg-amber-100 text-amber-700', dot: 'bg-amber-400' },
  LOW:      { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', badge: 'bg-green-100 text-green-700', dot: 'bg-green-400' },
} as const;

export function TeacherCopilot() {
  const { token } = useAuthStore();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => { fetchCopilot(); }, [token]);

  const fetchCopilot = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch('/api/intelligence/teacher/students-needing-attention', {
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
        <p className="text-gray-400 text-sm">Analyzing your class...</p>
      </div>
    </div>
  );

  const summary = data?.summary;
  const students = data?.students || [];

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-50">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/myday')} className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-600" /> Teacher Copilot
              </h2>
              <p className="text-sm text-gray-500">AI-powered student risk analysis</p>
            </div>
          </div>
          <button onClick={fetchCopilot} className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* AI Copilot Message */}
        <div className={`p-4 rounded-xl border mb-5 flex items-start gap-3 ${
          summary?.critical > 0 ? 'bg-red-50 border-red-200' :
          summary?.high > 0 ? 'bg-orange-50 border-orange-200' :
          'bg-green-50 border-green-200'
        }`}>
          <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-bold">AI</span>
          </div>
          <p className="text-sm text-gray-700 leading-relaxed">{data?.copilot_message}</p>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-4 gap-2 mb-5">
          {[
            { label: 'Critical', count: summary?.critical, color: 'text-red-600', bg: 'bg-red-50 border-red-200' },
            { label: 'High', count: summary?.high, color: 'text-orange-600', bg: 'bg-orange-50 border-orange-200' },
            { label: 'Medium', count: summary?.medium, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200' },
            { label: 'Good', count: summary?.low, color: 'text-green-600', bg: 'bg-green-50 border-green-200' },
          ].map((s, i) => (
            <div key={i} className={`p-3 rounded-xl border ${s.bg} text-center`}>
              <p className={`text-2xl font-bold ${s.color}`}>{s.count ?? 0}</p>
              <p className="text-xs text-gray-500 font-medium">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Student list */}
        <div className="space-y-3">
          {students.map((student: any) => {
            const cfg = RISK_CONFIG[student.risk_level as keyof typeof RISK_CONFIG];
            const isOpen = expanded === student.id;

            return (
              <div key={student.id} className={`rounded-xl border shadow-sm overflow-hidden ${cfg.bg} ${cfg.border}`}>
                <button
                  onClick={() => setExpanded(isOpen ? null : student.id)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:brightness-95 transition-all"
                >
                  {/* Risk dot */}
                  <div className={`w-3 h-3 rounded-full flex-shrink-0 ${cfg.dot}`} />

                  {/* Student info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-gray-800">{student.name}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${cfg.badge}`}>
                        {student.risk_level}
                      </span>
                      {student.today_status === 'not_marked' && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 border border-gray-200">
                          Not marked today
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-500">
                      <span>Attendance: <strong className={cfg.text}>{student.attendance_pct}%</strong></span>
                      {student.marks_pct && <span>HY: <strong className="text-indigo-600">{student.marks_pct}%</strong></span>}
                      {student.marks_rank && <span>Rank: <strong>#{student.marks_rank}</strong></span>}
                      {student.recent_absences > 0 && <span className="text-red-500">{student.recent_absences} recent absences</span>}
                    </div>
                  </div>

                  {isOpen ? <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />}
                </button>

                {/* Expanded details */}
                {isOpen && (
                  <div className="border-t border-current border-opacity-20 bg-white px-4 py-4">
                    {/* Reasons */}
                    {student.reasons.length > 0 && (
                      <div className="mb-3">
                        <p className="text-xs font-semibold text-gray-600 mb-2 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Why attention is needed
                        </p>
                        <ul className="space-y-1">
                          {student.reasons.map((r: string, i: number) => (
                            <li key={i} className="text-xs text-gray-600 flex items-start gap-2">
                              <span className="text-red-400 mt-0.5">•</span>{r}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Recommended actions */}
                    <div className="mb-3">
                      <p className="text-xs font-semibold text-gray-600 mb-2 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3 text-green-500" /> Recommended actions
                      </p>
                      <ul className="space-y-1">
                        {student.recommended_actions.map((a: string, i: number) => (
                          <li key={i} className="text-xs text-gray-600 flex items-start gap-2">
                            <span className="text-green-500 mt-0.5">→</span>{a}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-2 flex-wrap">
                      <button
                        onClick={() => navigate(`/?prompt=${encodeURIComponent(`Tell me more about ${student.name}'s performance and what I should do`)}`)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white text-xs rounded-lg hover:bg-indigo-700"
                      >
                        <MessageCircle className="w-3 h-3" /> Ask AI for advice
                      </button>
                      <button
                        onClick={() => navigate(`/?prompt=${encodeURIComponent(`Create a parent communication message for ${student.name} about their attendance`)}`)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 text-gray-600 text-xs rounded-lg hover:bg-gray-50"
                      >
                        Draft parent message
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Chat with copilot */}
        <div className="mt-5 p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
          <p className="text-xs font-semibold text-gray-600 mb-3">Ask your AI Copilot</p>
          <div className="flex flex-wrap gap-2">
            {[
              'Which student should I contact today?',
              'Create an attendance improvement plan',
              'Who needs extra academic support?',
              'Draft a message for all parents',
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
