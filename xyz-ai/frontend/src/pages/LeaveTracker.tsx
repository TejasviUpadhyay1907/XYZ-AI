import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';
import { FileText, Clock, CheckCircle, XCircle, ArrowLeft, Plus, Calendar } from 'lucide-react';

interface Leave {
  id: string;
  studentId: string;
  studentName: string;
  parentId: string | null;
  startDate: string;
  endDate: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  appliedAt: string;
  approvedBy: string | null;
  approvedAt: string | null;
}

const statusConfig = {
  pending:  { label: 'Pending',  icon: Clock,         bg: 'bg-amber-50',  border: 'border-amber-200',  text: 'text-amber-700'  },
  approved: { label: 'Approved', icon: CheckCircle,   bg: 'bg-green-50',  border: 'border-green-200',  text: 'text-green-700'  },
  rejected: { label: 'Rejected', icon: XCircle,       bg: 'bg-red-50',    border: 'border-red-200',    text: 'text-red-700'    },
};

export function LeaveTracker() {
  const { token, user } = useAuthStore();
  const navigate = useNavigate();
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [loading, setLoading] = useState(true);
  const [showApply, setShowApply] = useState(false);
  const [form, setForm] = useState({ childName: '', startDate: '', endDate: '', reason: '' });
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState('');

  const isTeacherOrPrincipal = user?.role === 'teacher' || user?.role === 'principal';

  useEffect(() => { fetchLeaves(); }, [token]);

  const fetchLeaves = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch('/api/dashboard/leaves', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setLeaves(data.leaves || []);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const applyLeave = async () => {
    if (!form.startDate || !form.endDate || !form.reason.trim()) return;
    setSubmitting(true);
    try {
      const childPart = (user?.role === 'parent' && form.childName) ? ` for ${form.childName}` : '';
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          sessionId: `leave-session-${user?.id}`,
          language: 'en',
          message: `Apply for leave${childPart} from ${form.startDate} to ${form.endDate} because ${form.reason}`
        })
      });
      if (res.ok) {
        showToast('Leave application submitted successfully!');
        setShowApply(false);
        setForm({ childName: '', startDate: '', endDate: '', reason: '' });
        setTimeout(fetchLeaves, 1000);
      }
    } catch (e) { console.error(e); }
    finally { setSubmitting(false); }
  };

  const updateStatus = async (leaveId: string, status: 'approved' | 'rejected') => {
    try {
      const res = await fetch(`/api/dashboard/leaves/${leaveId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        showToast(`Leave ${status} successfully`);
        fetchLeaves();
      }
    } catch (e) { console.error(e); }
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const totalDays = (start: string, end: string) => {
    const diff = new Date(end).getTime() - new Date(start).getTime();
    return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1);
  };

  if (loading) return (
    <div className="flex-1 flex items-center justify-center">
      <p className="text-gray-400 animate-pulse">Loading leave applications...</p>
    </div>
  );

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-50">
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/dashboard')} className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                {isTeacherOrPrincipal ? 'Leave Requests' : 'My Leave Applications'}
              </h2>
              <p className="text-sm text-gray-500">
                {leaves.filter(l => l.status === 'pending').length} pending · {leaves.length} total
              </p>
            </div>
          </div>
          {(user?.role === 'parent' || user?.role === 'student') && (
            <button
              onClick={() => setShowApply(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Plus className="w-4 h-4" /> Apply Leave
            </button>
          )}
        </div>

        {/* Toast */}
        {toast && (
          <div className="mb-4 flex items-center gap-2 px-4 py-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm font-medium">
            <CheckCircle className="w-4 h-4" /> {toast}
          </div>
        )}

        {/* Apply Leave Modal */}
        {showApply && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-600" /> Apply for Leave
              </h3>
              <div className="space-y-3">
                {user?.role === 'parent' && (
                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1 block">Child's Name</label>
                    <input
                      value={form.childName}
                      onChange={e => setForm(p => ({ ...p, childName: e.target.value }))}
                      placeholder="e.g. Rahul"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1 block">From Date</label>
                    <input
                      type="date"
                      value={form.startDate}
                      onChange={e => setForm(p => ({ ...p, startDate: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1 block">To Date</label>
                    <input
                      type="date"
                      value={form.endDate}
                      onChange={e => setForm(p => ({ ...p, endDate: e.target.value }))}
                      min={form.startDate}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Reason</label>
                  <textarea
                    value={form.reason}
                    onChange={e => setForm(p => ({ ...p, reason: e.target.value }))}
                    placeholder="Reason for leave (e.g. fever, family function)"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  />
                </div>
                {form.startDate && form.endDate && (
                  <p className="text-xs text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg">
                    Duration: {totalDays(form.startDate, form.endDate)} day(s)
                  </p>
                )}
                <div className="flex gap-2 pt-1">
                  <button onClick={() => setShowApply(false)} className="flex-1 py-2 text-sm border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50">
                    Cancel
                  </button>
                  <button
                    onClick={applyLeave}
                    disabled={submitting || !form.startDate || !form.endDate || !form.reason.trim()}
                    className="flex-1 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? 'Submitting...' : 'Submit Application'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Stats row */}
        {leaves.length > 0 && (
          <div className="grid grid-cols-3 gap-3 mb-4">
            {(['pending', 'approved', 'rejected'] as const).map(s => {
              const cfg = statusConfig[s];
              const count = leaves.filter(l => l.status === s).length;
              return (
                <div key={s} className={`p-3 rounded-xl border ${cfg.bg} ${cfg.border}`}>
                  <p className={`text-2xl font-bold ${cfg.text}`}>{count}</p>
                  <p className={`text-xs font-medium ${cfg.text}`}>{cfg.label}</p>
                </div>
              );
            })}
          </div>
        )}

        {/* Leave List */}
        {leaves.length === 0 ? (
          <div className="bg-white rounded-xl border p-12 text-center">
            <FileText className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm font-medium">No leave applications yet</p>
            {(user?.role === 'parent' || user?.role === 'student') && (
              <p className="text-gray-400 text-xs mt-1">Click "Apply Leave" to submit your first application</p>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {leaves.map(leave => {
              const cfg = statusConfig[leave.status];
              const StatusIcon = cfg.icon;
              const days = totalDays(leave.startDate, leave.endDate);
              return (
                <div key={leave.id} className={`bg-white rounded-xl border ${leave.status === 'pending' ? 'border-amber-200' : 'border-gray-100'} shadow-sm p-4`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-gray-800 text-sm">{leave.studentName}</p>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text} border ${cfg.border}`}>
                          <StatusIcon className="w-3 h-3" />
                          {cfg.label}
                        </span>
                        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{days} day{days !== 1 ? 's' : ''}</span>
                      </div>

                      <div className="flex items-center gap-1.5 mt-2 text-sm text-gray-600">
                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                        <span>{leave.startDate}</span>
                        {leave.startDate !== leave.endDate && <><span className="text-gray-400">→</span><span>{leave.endDate}</span></>}
                      </div>

                      <p className="text-sm text-gray-500 mt-1 flex items-start gap-1.5">
                        <span className="text-gray-400 mt-0.5">📋</span>
                        {leave.reason}
                      </p>

                      <p className="text-xs text-gray-400 mt-1.5">
                        Applied {new Date(leave.appliedAt).toLocaleDateString('en', { day: 'numeric', month: 'short', year: 'numeric' })}
                        {leave.approvedAt && ` · ${leave.status} ${new Date(leave.approvedAt).toLocaleDateString('en', { day: 'numeric', month: 'short' })}`}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5 font-mono">ID: {leave.id}</p>
                    </div>

                    {/* Approve / Reject buttons for teacher/principal */}
                    {isTeacherOrPrincipal && leave.status === 'pending' && (
                      <div className="flex flex-col gap-1.5 flex-shrink-0">
                        <button
                          onClick={() => updateStatus(leave.id, 'approved')}
                          className="px-3 py-1.5 text-xs bg-green-50 text-green-700 border border-green-200 rounded-lg hover:bg-green-100 font-medium"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => updateStatus(leave.id, 'rejected')}
                          className="px-3 py-1.5 text-xs bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100 font-medium"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
