import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Avatar } from '../Avatar';
import { useChatStore } from '../../store/chatStore';

export function ModernLayout() {
  const { avatarState, setAvatarState } = useChatStore();

  // Handle avatar state changes from voice service
  useEffect(() => {
    // This will be connected to voiceService in App.tsx or similar
    return () => {};
  }, [setAvatarState]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <Header />

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <Sidebar />

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Avatar Container (for mobile or as supplementary element) */}
          <div className="md:hidden flex items-center justify-center py-4 bg-white border-t border-gray-100">
            <Avatar state={avatarState} size={56} />
            <span className="ml-3 text-sm font-medium text-gray-700">XYZ AI</span>
          </div>

          {/* Main Content Area */}
          <main className="flex-1 p-6 md:p-8 overflow-y-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}