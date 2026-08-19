import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { ModernLayout } from './components/layout/ModernLayout';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { AdminPanel } from './pages/AdminPanel';
import { Dashboard } from './pages/Dashboard';
import { Avatar } from './components/Avatar';
import { ChatArea } from './components/ChatArea';
import { ChatInput } from './components/ChatInput';
import { useChatStore } from './store/chatStore';
import { voiceService } from './services/voiceService';

function App() {
  const { setAvatarState } = useChatStore();

  // Set up voice service avatar state callback
  useEffect(() => {
    voiceService.setStateChangeCallback((event) => {
      switch (event) {
        case 'listening-start':
          setAvatarState('listening');
          break;
        case 'listening-end':
          // If we stopped listening but we aren't handling the auto-submit, go idle
          break;
        case 'speaking-start':
          setAvatarState('speaking');
          break;
        case 'speaking-end':
          setAvatarState('idle');
          break;
      }
    });

    return () => {
      voiceService.setStateChangeCallback(null);
    };
  }, [setAvatarState]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ModernLayout />}>
          <Route index element={<ChatLayout />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="admin" element={<AdminPanel />} />
        </Route>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

// Keep the old ChatLayout for now to avoid breaking changes
function ChatLayout() {
  const { avatarState } = useChatStore();

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Avatar Sidebar */}
      <aside className="hidden md:flex flex-col items-center justify-start pt-8 px-4 w-56 bg-gradient-to-b from-indigo-50 to-white border-r border-gray-100">
        <Avatar state={avatarState} size={140} />
        <p className="mt-4 text-sm text-gray-500 text-center font-medium">XYZ AI Assistant</p>
        <p className="mt-1 text-xs text-gray-400 text-center">Your school helper</p>
        <div className="mt-6 w-full space-y-2">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white shadow-sm">
            <span className="w-2 h-2 rounded-full bg-green-400"></span>
            <span className="text-xs text-gray-600">Online & Ready</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white shadow-sm">
            <span className="text-xs text-gray-600">Supports voice & text</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white shadow-sm">
            <span className="text-xs text-gray-600">11 languages</span>
          </div>
        </div>
      </aside>

      {/* Main Chat Area */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Mobile Avatar - compact */}
        <div className="md:hidden flex items-center justify-center py-3 bg-gradient-to-r from-indigo-50 to-purple-50 border-b">
          <Avatar state={avatarState} size={64} />
          <span className="ml-3 text-sm font-medium text-gray-700">XYZ AI</span>
        </div>

        <ChatArea />
        <div className="border-t bg-white p-4">
          <div className="max-w-3xl mx-auto">
            <ChatInput />
          </div>
        </div>
      </div>
    </div>
  );
}