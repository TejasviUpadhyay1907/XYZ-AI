import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Header } from './components/Header';
import { ChatArea } from './components/ChatArea';
import { ChatInput } from './components/ChatInput';
import { PrivateRoute } from './components/PrivateRoute';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Landing } from './pages/Landing';
import { AdminPanel } from './pages/AdminPanel';
import { Dashboard } from './pages/Dashboard';
import { Notices } from './pages/Notices';
import { LeaveTracker } from './pages/LeaveTracker';
import { Meetings } from './pages/Meetings';
import { Timetable } from './pages/Timetable';
import { Marks } from './pages/Marks';
import { MyDay } from './pages/MyDay';
import { AITutor } from './pages/AITutor';
import { TeacherCopilot } from './pages/TeacherCopilot';
import { PrincipalIntelligence } from './pages/PrincipalIntelligence';
import { SchoolKnowledge } from './pages/SchoolKnowledge';
import { Avatar } from './components/Avatar';
import { useChatStore } from './store/chatStore';
import { useAuthStore } from './store/authStore';
import { Download } from 'lucide-react';

// Export bar shown above chat input
function ChatExportBar() {
  const { messages } = useChatStore();
  const { user } = useAuthStore();

  const exportAsText = () => {
    if (messages.length === 0) return;
    const lines = messages.map(m => {
      const speaker = m.role === 'user' ? (user?.name || 'You') : 'Eduvia AI';
      return `[${speaker}]\n${m.content}\n`;
    });
    const content = `Eduvia AI Conversation Export\nUser: ${user?.name || 'Unknown'} (${user?.role || ''})\nDate: ${new Date().toLocaleString()}\n\n${'─'.repeat(50)}\n\n${lines.join('\n')}`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `eduvia-ai-chat-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (messages.length <= 1) return null;

  return (
    <div className="flex justify-end mb-1">
      <button
        onClick={exportAsText}
        className="flex items-center gap-1.5 px-3 py-1 text-xs text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
        title="Export conversation"
      >
        <Download className="w-3.5 h-3.5" />
        Export chat
      </button>
    </div>
  );
}

// Chat page layout with avatar sidebar
function ChatLayout() {
  const { avatarState } = useChatStore();

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Avatar Sidebar — Desktop only */}
      <aside className="hidden md:flex flex-col items-center justify-start pt-8 px-4 w-52 bg-gradient-to-b from-indigo-50 to-white border-r border-gray-100 flex-shrink-0">
        <Avatar state={avatarState} size={130} />
        <p className="mt-3 text-sm text-gray-500 text-center font-medium">Eduvia AI</p>
        <div className="mt-4 w-full space-y-1.5">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white shadow-sm">
            <span className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0" />
            <span className="text-xs text-gray-600">Online & Ready</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white shadow-sm">
            <span className="text-xs text-gray-500">🌐 11 languages</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white shadow-sm">
            <span className="text-xs text-gray-500">🎤 Voice enabled</span>
          </div>
        </div>
      </aside>

      {/* Main Chat Area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Mobile Avatar bar */}
        <div className="md:hidden flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-indigo-50 to-purple-50 border-b flex-shrink-0">
          <Avatar state={avatarState} size={48} />
          <div>
            <p className="text-sm font-medium text-gray-700">Eduvia AI Assistant</p>
            <p className="text-xs text-green-600 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" /> Online
            </p>
          </div>
        </div>

        {/* Messages */}
        <ChatArea />

        {/* Input area */}
        <div className="border-t bg-white px-4 py-3 flex-shrink-0">
          <div className="max-w-3xl mx-auto">
            <ChatExportBar />
            <ChatInput />
          </div>
        </div>
      </div>
    </div>
  );
}

// Layout wrapper for all authenticated pages (header + outlet)
function AuthLayout() {
  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <Header />
      <PrivateRoute />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public pages — no header */}
        <Route path="/home" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* All authenticated pages share AuthLayout (Header + PrivateRoute Outlet) */}
        <Route element={<AuthLayout />}>
          <Route path="/" element={<ChatLayout />} />
          <Route path="/myday" element={<MyDay />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/timetable" element={<Timetable />} />
          <Route path="/marks" element={<Marks />} />
          <Route path="/knowledge" element={<SchoolKnowledge />} />
          <Route path="/notices" element={<Notices />} />
          <Route path="/leaves" element={<LeaveTracker />} />
          <Route path="/meetings" element={<Meetings />} />
          <Route path="/tutor" element={<AITutor />} />
          <Route path="/copilot" element={<TeacherCopilot />} />
          <Route path="/school-intel" element={<PrincipalIntelligence />} />
          <Route path="/admin" element={<AdminPanel />} />
        </Route>

        {/* Root: Landing for unauthenticated, myday for authenticated */}
        <Route index element={<Landing />} />
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
