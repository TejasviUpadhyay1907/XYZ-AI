import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';
import { Clock, CheckCircle, XCircle, ArrowLeft, Plus, Calendar, Users } from 'lucide-react';

interface Meeting {
  id: string;
  requestedBy: string;
  requestedByName: string;
  requestedWith: string;
  requestedWithName: string;
  purpose: string;
  preferredDate: string | null;
  preferredTime: string | null;
  status: 'requested' | 'confirmed' | 'rejected' | 'completed';
  createdAt: string;
  confirmedAt: string | null;
  notes: string | null;
}

const statusConfig = {
  requested:  { label: 'Requested', icon: Clock,         bg: 'bg-amber-50',  border: 'border-amber-200',  text: 'text-amber-700'  },
  confirmed:  { label: 'Confirmed', icon: CheckCircle,   bg: 'bg-green-50',  border: 'border-green-200',  text: 'text-green-700'  },
  rejected:   { label: 'Declined',  icon: XCircle,       bg: 'bg-red-50',    border: 'border-red-200',    text: 'text-red-700'    },
  completed:  { label: 'Completed', icon: CheckCircle,   bg: 'bg-gray-50',   border: 'border-gray-200',   text: 'text-gray-600'   },
};

export function Meetings() {
  const { token, user } = useAuthStore();
  const navigate = useNavigate();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRequest, setShowRequest] = useState(false);
  const [form, setForm] = useState({ purpose: '', preferredDate: '', preferredTime: '' });
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => { fetchMeetings(); }, [token]);

  const fetchMeetings = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch('/api/dashboard/meetings', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMeetings(data.meetings || []);
      } else {
        showToastMsg('Could not load meetings. Please refresh.');
      }
    } catch (e) { showToastMsg('Connection error.'); console.error(e); }
    finally { setLoading(false); }
  };

  const requestMeeting = async () => {
    if (!form.purpose.trim()) return;
    setSubmitting(true);
    try {
      const withPerson = user?.role === 'parent' ? 'class teacher' : 'parent';
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          sessionId: `meeting-session-${user?.id}`,
          language: 'en',
          message: `Schedule a meeting with the ${withPerson} about: ${form.purpose}${form.preferredDate ? ` on ${form.preferredDate}` : ''}${form.preferredTime ? ` at ${form.preferredTime}` : ''}`
        })
      });
      if (res.ok) {
        const aiResponse = await res.json();
        if (aiResponse.reply && !aiResponse.reply.toLowerCase().includes('error')) {
          showToastMsg('Meeting request submitted!');
          setShowRequest(false);
          setForm({ purpose: '', preferredDate: '', preferredTime: '' });
          setTimeout(fetchMeetings, 2000);
        } else {
          showToastMsg('Could not submit meeting request. Please try again.');
        }
      }
    } catch (e) { console.error(e); }
    finally { setSubmitting(false); }
  };

  const updateMeeting = async (meetingId: string, status: 'confirmed' | 'rejected') => {
    try {
      const res = await fetch(`/api/dashboard/meetings/${meetingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        showToastMsg(`Meeting ${status}`);
        fetchMeetings();
      }
    } catch (e) { console.error(e); }
  };

  const showToastMsg = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const canRequest = user?.role === 'parent' || user?.role === 'teacher';
  const canRespond = user?.role === 'teacher' || user?.role === 'principal';

  if (loading) return (
    <div className="flex-1 flex items-center justify-center">
      <p className="text-gray-400 animate-pulse">Loading meetings...</p>
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
                <Users className="w-5 h-5 text-indigo-600" />
                Meetings
              </h2>
              <p className="text-sm text-gray-500">
                {meetings.filter(m => m.status === 'requested').length} pending · {meetings.length} total
              </p>
            </div>
          </div>
          {canRequest && (
            <button
              onClick={() => setShowRequest(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Plus className="w-4 h-4" /> Request Meeting
            </button>
          )}
        </div>

        {/* Toast */}
        {toast && (
          <div className="mb-4 flex items-center gap-2 px-4 py-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm font-medium">
            <CheckCircle className="w-4 h-4" /> {toast}
          </div>
        )}

        {/* Request Modal */}
        {showRequest && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-600" /> Request a Meeting
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Purpose / Agenda</label>
                  <textarea
                    value={form.purpose}
                    onChange={e => setForm(p => ({ ...p, purpose: e.target.value }))}
                    placeholder="What would you like to discuss?"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1 block">Preferred Date</label>
                    <input
                      type="date"
                      value={form.preferredDate}
                      onChange={e => setForm(p => ({ ...p, preferredDate: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1 block">Preferred Time</label>
                    <input
                      type="time"
                      value={form.preferredTime}
                      onChange={e => setForm(p => ({ ...p, preferredTime: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
                <div className="flex gap-2 pt-1">
                  <button onClick={() => setShowRequest(false)} className="flex-1 py-2 text-sm border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50">Cancel</button>
                  <button
                    onClick={requestMeeting}
                    disabled={submitting || !form.purpose.trim()}
                    className="flex-1 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {submitting ? 'Requesting...' : 'Submit Request'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Meetings List */}
        {meetings.length === 0 ? (
          <div className="bg-white rounded-xl border p-12 text-center">
            <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm font-medium">No meetings yet</p>
            {canRequest && <p className="text-gray-400 text-xs mt-1">Click "Request Meeting" to schedule one</p>}
          </div>
        ) : (
          <div className="space-y-3">
            {meetings.map(meeting => {
              const cfg = statusConfig[meeting.status] || statusConfig.requested;
              const StatusIcon = cfg.icon;
              const isIncoming = meeting.requestedWith === user?.id;
              return (
                <div key={meeting.id} className={`bg-white rounded-xl border shadow-sm p-4 ${meeting.status === 'requested' && isIncoming ? 'border-indigo-200' : 'border-gray-100'}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                          <StatusIcon className="w-3 h-3" /> {cfg.label}
                        </span>
                        {isIncoming && meeting.status === 'requested' && (
                          <span className="text-xs bg-indigo-600 text-white px-1.5 py-0.5 rounded-full">Action needed</span>
                        )}
                      </div>

                      <p className="text-sm font-medium text-gray-800 mt-1">{meeting.purpose}</p>

                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-500 flex-wrap">
                        <span>{isIncoming ? `From: ${meeting.requestedByName}` : `With: ${meeting.requestedWithName}`}</span>
                        {meeting.preferredDate && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {meeting.preferredDate}{meeting.preferredTime ? ` at ${meeting.preferredTime}` : ''}
                          </span>
                        )}
                        <span>Requested {new Date(meeting.createdAt).toLocaleDateString('en', { day: 'numeric', month: 'short' })}</span>
                      </div>
                      {meeting.notes && (
                        <p className="text-xs text-gray-500 mt-1 italic">Note: {meeting.notes}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-1 font-mono">ID: {meeting.id}</p>
                    </div>

                    {/* Confirm / Reject for incoming requests */}
                    {canRespond && isIncoming && meeting.status === 'requested' && (
                      <div className="flex flex-col gap-1.5 flex-shrink-0">
                        <button onClick={() => updateMeeting(meeting.id, 'confirmed')} className="px-3 py-1.5 text-xs bg-green-50 text-green-700 border border-green-200 rounded-lg hover:bg-green-100 font-medium">
                          Confirm
                        </button>
                        <button onClick={() => updateMeeting(meeting.id, 'rejected')} className="px-3 py-1.5 text-xs bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100 font-medium">
                          Decline
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
