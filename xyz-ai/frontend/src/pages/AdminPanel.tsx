import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { Activity, Shield, Clock, CheckCircle, XCircle, ChevronDown, ChevronRight } from 'lucide-react';

interface TraceStep {
  step: string;
  elapsed_ms: number;
  duration_ms?: number;
  tool?: string;
  args?: Record<string, any>;
  has_tool_calls?: boolean;
  [key: string]: any;
}

interface Trace {
  request_id: string;
  user_id: string;
  role: string;
  language: string;
  steps: TraceStep[];
  tool_calls: { tool: string; args: Record<string, any>; duration_ms: number; result_preview: string }[];
  total_duration_ms: number;
}

interface AuditLog {
  id: number;
  request_id: string;
  user_id: string;
  role: string;
  action: string;
  target_resource: string | null;
  target_id: string | null;
  result: string;
  reason: string | null;
  duration_ms: number | null;
  created_at: string;
}

interface Stats {
  total_requests: number;
  total_audit_entries: number;
  tool_calls: number;
  auth_decisions: number;
  security_events: number;
  escalations: number;
  denied_count: number;
  avg_duration_ms: number;
}

export function AdminPanel() {
  const { token, user } = useAuthStore();
  const [traces, setTraces] = useState<Trace[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [activeTab, setActiveTab] = useState<'traces' | 'audit' | 'stats'>('traces');
  const [expandedTrace, setExpandedTrace] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchData = async () => {
    if (!token || user?.role !== 'principal') return;
    setLoading(true);
    setError('');

    try {
      const headers = { 'Authorization': `Bearer ${token}` };

      const [tracesRes, auditRes, statsRes] = await Promise.all([
        fetch('/api/admin/traces?limit=20', { headers }),
        fetch('/api/admin/audit?limit=50', { headers }),
        fetch('/api/admin/stats', { headers })
      ]);

      if (tracesRes.ok) {
        const data = await tracesRes.json();
        setTraces(data.traces || []);
      }
      if (auditRes.ok) {
        const data = await auditRes.json();
        setAuditLogs(data.logs || []);
      }
      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data.stats || null);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Auto-refresh every 10 seconds
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [token]);

  if (user?.role !== 'principal') {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <Shield className="w-12 h-12 text-red-400 mx-auto mb-3" />
          <p className="text-gray-600">Admin panel is only accessible to management.</p>
        </div>
      </div>
    );
  }

  const getStepColor = (step: string) => {
    if (step.includes('llm')) return 'text-purple-600 bg-purple-50';
    if (step.includes('tool')) return 'text-blue-600 bg-blue-50';
    if (step.includes('error')) return 'text-red-600 bg-red-50';
    if (step === 'complete') return 'text-green-600 bg-green-50';
    return 'text-gray-600 bg-gray-50';
  };

  const getResultBadge = (result: string) => {
    if (result === 'SUCCESS' || result === 'ALLOWED') {
      return <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-700"><CheckCircle className="w-3 h-3" />{result}</span>;
    }
    if (result === 'DENIED' || result === 'BLOCKED' || result === 'FAILURE') {
      return <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-red-100 text-red-700"><XCircle className="w-3 h-3" />{result}</span>;
    }
    return <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-600">{result}</span>;
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Agent Trace Panel</h2>
            <p className="text-sm text-gray-500">Real-time AI pipeline observability</p>
          </div>
          <button
            onClick={fetchData}
            disabled={loading}
            className="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Requests</p>
              <p className="text-2xl font-bold text-gray-800">{stats.total_requests}</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Tool Calls</p>
              <p className="text-2xl font-bold text-blue-600">{stats.tool_calls}</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Denied</p>
              <p className="text-2xl font-bold text-red-600">{stats.denied_count}</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Avg Latency</p>
              <p className="text-2xl font-bold text-purple-600">{stats.avg_duration_ms}ms</p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 mb-4 bg-white rounded-lg p-1 border border-gray-200 w-fit">
          {(['traces', 'audit', 'stats'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                activeTab === tab ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {tab === 'traces' ? 'Agent Traces' : tab === 'audit' ? 'Audit Log' : 'Statistics'}
            </button>
          ))}
        </div>

        {/* Traces Tab */}
        {activeTab === 'traces' && (
          <div className="space-y-3">
            {traces.length === 0 && (
              <div className="bg-white p-8 rounded-xl border text-center text-gray-500">
                <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No traces yet. Send some chat messages to generate traces.</p>
              </div>
            )}
            {traces.map((trace) => (
              <div key={trace.request_id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                {/* Trace Header */}
                <button
                  onClick={() => setExpandedTrace(expandedTrace === trace.request_id ? null : trace.request_id)}
                  className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {expandedTrace === trace.request_id ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                    <div className="text-left">
                      <p className="text-sm font-mono text-gray-600">{trace.request_id}</p>
                      <p className="text-xs text-gray-400">
                        {trace.role} &bull; {trace.language} &bull; {trace.tool_calls.length} tool call(s)
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 text-xs text-gray-500">
                      <Clock className="w-3 h-3" />
                      {trace.total_duration_ms}ms
                    </span>
                  </div>
                </button>

                {/* Expanded Trace Detail */}
                {expandedTrace === trace.request_id && (
                  <div className="border-t px-4 py-3 bg-gray-50">
                    <div className="space-y-2">
                      {trace.steps.map((step, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <div className="w-16 text-right">
                            <span className="text-xs font-mono text-gray-400">{step.elapsed_ms}ms</span>
                          </div>
                          <div className="w-2 h-2 rounded-full bg-indigo-400" />
                          <div className={`px-2 py-1 rounded text-xs font-medium ${getStepColor(step.step)}`}>
                            {step.step}
                          </div>
                          {step.duration_ms && (
                            <span className="text-xs text-gray-400">({step.duration_ms}ms)</span>
                          )}
                          {step.tool && (
                            <span className="text-xs text-blue-600 font-mono">{step.tool}({JSON.stringify(step.args)})</span>
                          )}
                          {step.has_tool_calls !== undefined && (
                            <span className="text-xs text-gray-400">tools: {step.has_tool_calls ? 'yes' : 'no'}</span>
                          )}
                        </div>
                      ))}
                    </div>

                    {trace.tool_calls.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <p className="text-xs font-medium text-gray-500 mb-2">Tool Calls:</p>
                        {trace.tool_calls.map((tc, i) => (
                          <div key={i} className="bg-white p-2 rounded border text-xs font-mono mb-1">
                            <span className="text-blue-600">{tc.tool}</span>
                            <span className="text-gray-400">(</span>
                            <span className="text-gray-600">{JSON.stringify(tc.args)}</span>
                            <span className="text-gray-400">)</span>
                            <span className="text-gray-400 ml-2">→ {tc.duration_ms}ms</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Audit Tab */}
        {activeTab === 'audit' && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Time</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">User</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Action</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Target</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Result</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Duration</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {auditLogs.length === 0 && (
                    <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No audit logs yet</td></tr>
                  )}
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2 text-xs text-gray-500 font-mono">{new Date(log.created_at).toLocaleTimeString()}</td>
                      <td className="px-4 py-2">
                        <span className="text-xs">{log.user_id}</span>
                        <span className="text-xs text-gray-400 ml-1">({log.role})</span>
                      </td>
                      <td className="px-4 py-2 text-xs font-mono">{log.action}</td>
                      <td className="px-4 py-2 text-xs text-gray-600">{log.target_resource || '-'}</td>
                      <td className="px-4 py-2">{getResultBadge(log.result)}</td>
                      <td className="px-4 py-2 text-xs text-gray-500">{log.duration_ms ? `${log.duration_ms}ms` : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Stats Tab */}
        {activeTab === 'stats' && stats && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h3 className="text-sm font-medium text-gray-700 mb-4">System Overview</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Total Requests Traced</span>
                  <span className="text-sm font-bold">{stats.total_requests}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Tool Executions</span>
                  <span className="text-sm font-bold text-blue-600">{stats.tool_calls}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Authorization Decisions</span>
                  <span className="text-sm font-bold">{stats.auth_decisions}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Security Events</span>
                  <span className="text-sm font-bold text-orange-600">{stats.security_events}</span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Escalations</span>
                  <span className="text-sm font-bold">{stats.escalations}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Denied/Blocked</span>
                  <span className="text-sm font-bold text-red-600">{stats.denied_count}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Average Response Latency</span>
                  <span className="text-sm font-bold text-purple-600">{stats.avg_duration_ms}ms</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Total Audit Entries</span>
                  <span className="text-sm font-bold">{stats.total_audit_entries}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
