import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCircle, Clock, Send, ArrowLeft, Plus } from 'lucide-react';

interface Notice {
  id: string;
  title: string;
  content: string;
  sentBy: string;
  sentByName: string;
  targetAudience: string;
  createdAt: string;
  readBy: string[];
}

export function Notices() {
  const { token, user } = useAuthStore();
  const navigate = useNavigate();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Notice | null>(null);
  const [showCompose, setShowCompose] = useState(false);
  const [composing, setComposing] = useState({ title: '', content: '', target: 'all_parents' });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => { fetchNotices(); }, [token]);

  const fetchNotices = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch('/api/dashboard/notices', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setNotices(data.notices || []);
        setUnreadCount(data.unread_count || 0);
      } else {
        throw new Error('Failed');
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const markRead = async (noticeId: string) => {
    await fetch(`/api/dashboard/notices/${noticeId}/read`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    setNotices(prev => prev.map(n => n.id === noticeId ? { ...n, readBy: [...n.readBy, user?.id || ''] } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const openNotice = (notice: Notice) => {
    setSelected(notice);
    if (!notice.readBy.includes(user?.id || '')) markRead(notice.id);
  };

  const sendNotice = async () => {
    if (!composing.title.trim() || !composing.content.trim()) return;
    setSending(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          sessionId: `notice-session-${user?.id}`,
          language: 'en',
          message: `Send a notice titled "${composing.title}" to ${composing.target === 'all_parents' ? 'all parents' : composing.target === 'students' ? 'all students' : 'everyone'} with this content: ${composing.content}`
        })
      });
      if (res.ok) {
        const aiResponse = await res.json();
        // If AI successfully processed the leave action, refresh data
        if (aiResponse.reply && !aiResponse.reply.toLowerCase().includes('error')) {
          setSent(true);
          setShowCompose(false);
          setComposing({ title: '', content: '', target: 'all_parents' });
          // Wait for AI tool to execute before refreshing
          setTimeout(() => { setSent(false); fetchNotices(); }, 2000);
        } else {
          // AI couldn't process it — tell user
          alert('Could not send notice. Please try again.');
        }
      }
    } catch (e) { console.error(e); }
    finally { setSending(false); }
  };

  const isRead = (n: Notice) => n.readBy.includes(user?.id || '');
  const canSend = user?.role === 'teacher' || user?.role === 'principal';

  if (loading) return <div className="flex-1 flex items-center justify-center"><p className="text-gray-400 animate-pulse">Loading notices...</p></div>;
  if (!notices.length && !loading) { /* show empty state below */ }

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
                <Bell className="w-5 h-5 text-indigo-600" />
                School Notices
                {unreadCount > 0 && (
                  <span className="ml-1 px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full">{unreadCount} new</span>
                )}
              </h2>
              <p className="text-sm text-gray-500">{notices.length} announcement{notices.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
          {canSend && (
            <button
              onClick={() => setShowCompose(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Plus className="w-4 h-4" /> Send Notice
            </button>
          )}
        </div>

        {/* Success toast */}
        {sent && (
          <div className="mb-4 flex items-center gap-2 px-4 py-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm font-medium">
            <CheckCircle className="w-4 h-4" /> Notice sent successfully!
          </div>
        )}

        {/* Compose Modal */}
        {showCompose && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Send className="w-5 h-5 text-indigo-600" /> Compose Notice
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Title</label>
                  <input
                    value={composing.title}
                    onChange={e => setComposing(p => ({ ...p, title: e.target.value }))}
                    placeholder="Notice title..."
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Send to</label>
                  <select
                    value={composing.target}
                    onChange={e => setComposing(p => ({ ...p, target: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="all_parents">All Parents</option>
                    <option value="students">All Students</option>
                    <option value="all">Everyone</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Content</label>
                  <textarea
                    value={composing.content}
                    onChange={e => setComposing(p => ({ ...p, content: e.target.value }))}
                    placeholder="Write your notice here..."
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  />
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => setShowCompose(false)}
                    className="flex-1 py-2 text-sm border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={sendNotice}
                    disabled={sending || !composing.title.trim() || !composing.content.trim()}
                    className="flex-1 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {sending ? 'Sending...' : 'Send Notice'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Notice Detail Modal */}
        {selected && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">{selected.title}</h3>
                  <p className="text-sm text-gray-500 mt-1">From: {selected.sentByName} · {new Date(selected.createdAt).toLocaleDateString('en', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                </div>
                <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
              </div>
              <div className="prose text-sm text-gray-700 leading-relaxed whitespace-pre-wrap bg-gray-50 rounded-lg p-4">
                {selected.content}
              </div>
              <div className="mt-4 flex justify-end">
                <button onClick={() => setSelected(null)} className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700">
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Notice List */}
        {notices.length === 0 ? (
          <div className="bg-white rounded-xl border p-12 text-center">
            <Bell className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">No notices yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notices.map(notice => (
              <button
                key={notice.id}
                onClick={() => openNotice(notice)}
                className={`w-full text-left p-4 rounded-xl border transition-all hover:shadow-sm ${
                  isRead(notice) ? 'bg-white border-gray-100' : 'bg-indigo-50 border-indigo-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${isRead(notice) ? 'bg-gray-300' : 'bg-indigo-500'}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className={`text-sm font-medium truncate ${isRead(notice) ? 'text-gray-700' : 'text-indigo-900'}`}>
                        {notice.title}
                      </p>
                      {!isRead(notice) && (
                        <span className="flex-shrink-0 text-xs bg-indigo-600 text-white px-1.5 py-0.5 rounded-full">NEW</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 truncate">{notice.content}</p>
                    <div className="flex items-center gap-2 mt-1.5 text-xs text-gray-400">
                      <Clock className="w-3 h-3" />
                      {new Date(notice.createdAt).toLocaleDateString('en', { day: 'numeric', month: 'short' })}
                      <span>·</span>
                      <span>{notice.sentByName}</span>
                      <span>·</span>
                      <span className="capitalize">{notice.targetAudience.replace('_', ' ')}</span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
