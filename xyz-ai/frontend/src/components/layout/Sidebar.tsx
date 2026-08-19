import { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useNavigate } from 'react-router-dom';
import {
  Home,
  Users,
  GraduationCap,
  ShieldCheck,
  Settings,
  LogOut,
  MessageCircle,
  Menu,
  TrendingUp,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export function Sidebar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className={`fixed left-0 top-16 bottom-0 w-64 bg-white border-r border-gray-100 shadow-lg z-50 flex-shrink-0 transition-transform duration-300 ease-in-out ${isCollapsed ? '-translate-x-full' : 'translate-x-0'}`}>
      <div className="flex h-full flex-col">
        {/* Sidebar Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-800">XYZ AI</h3>
              <p className="text-xs text-gray-500">School Assistant</p>
            </div>
          </div>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 rounded-lg hover:bg-gray-50 transition-colors"
            aria-label="Toggle sidebar"
          >
            {isCollapsed ? (
              <Home className="w-5 h-5 text-gray-600" />
            ) : (
              <Menu className="w-5 h-5 text-gray-600" />
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 pt-4">
          <ul className="space-y-1">
            {/* Dashboard */}
            <li>
              <Link
                to="/"
                className={`
                  flex items-center w-full px-3 py-2 text-sm font-medium transition-colors
                  ${window.location.pathname === '/' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-700 hover:bg-gray-50'}
                `}
              >
                <Home className="w-5 h-5 mr-3" />
                <span>Dashboard</span>
              </Link>
            </li>

            {/* Chat/Assistant */}
            <li>
              <Link
                to="/chat"
                className={`
                  flex items-center w-full px-3 py-2 text-sm font-medium transition-colors
                  ${window.location.pathname === '/chat' || window.location.pathname === '' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-700 hover:bg-gray-50'}
                `}
              >
                <MessageCircle className="w-5 h-5 mr-3" />
                <span>Assistant</span>
              </Link>
            </li>

            {/* Role-based navigation */}
            {user?.role === 'teacher' && (
              <li>
                <Link
                  to="/class"
                  className={`
                    flex items-center w-full px-3 py-2 text-sm font-medium transition-colors
                    ${window.location.pathname === '/class' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-700 hover:bg-gray-50'}
                  `}
                >
                  <Users className="w-5 h-5 mr-3" />
                  <span>My Class</span>
                </Link>
              </li>
            )}

            {user?.role === 'parent' && (
              <li>
                <Link
                  to="/children"
                  className={`
                    flex items-center w-full px-3 py-2 text-sm font-medium transition-colors
                    ${window.location.pathname === '/children' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-700 hover:bg-gray-50'}
                  `}
                >
                  <Users className="w-5 h-5 mr-3" />
                  <span>My Children</span>
                </Link>
              </li>
            )}

            {user?.role === 'principal' && (
              <>
                <li>
                  <Link
                    to="/analytics"
                    className={`
                      flex items-center w-full px-3 py-2 text-sm font-medium transition-colors
                      ${window.location.pathname === '/analytics' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-700 hover:bg-gray-50'}
                    `}
                  >
                    <TrendingUp className="w-5 h-5 mr-3" />
                    <span>Analytics</span>
                  </Link>
                </li>
                <li>
                  <Link
                    to="/admin"
                    className={`
                      flex items-center w-full px-3 py-2 text-sm font-medium transition-colors
                      ${window.location.pathname === '/admin' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-700 hover:bg-gray-50'}
                    `}
                  >
                    <ShieldCheck className="w-5 h-5 mr-3" />
                    <span>Admin Panel</span>
                  </Link>
                </li>
              </>
            )}

            {/* Settings (available to all authenticated users) */}
            <li>
              <Link
                to="/settings"
                className={`
                  flex items-center w-full px-3 py-2 text-sm font-medium transition-colors
                  ${window.location.pathname === '/settings' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-700 hover:bg-gray-50'}
                `}
              >
                <Settings className="w-5 h-5 mr-3" />
                <span>Settings</span>
              </Link>
            </li>
          </ul>
        </nav>

        {/* Footer */}
        <div className="px-4 py-6 border-t border-gray-100">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-start px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors rounded-lg"
          >
            <LogOut className="w-5 h-5 mr-3" />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </aside>
  );
}