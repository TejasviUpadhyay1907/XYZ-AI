import { useState, useEffect } from 'react';
import {
  Bot, LogOut, User, Users, GraduationCap, Briefcase,
  Globe, Activity, LayoutDashboard, Bell, FileText,
  MessageCircle, Calendar, Award, Clock, Sun, Sparkles, Brain
} from 'lucide-react';
import { useChatStore } from '../store/chatStore';
import { useAuthStore } from '../store/authStore';
import {
  getSupportedLanguages, detectLanguage, saveLanguagePreference,
  getLanguageDirection, type SupportedLanguage
} from '../services/languageService';
import { useNavigate, useLocation } from 'react-router-dom';

export function Header() {
  const { currentRole, setRole, setLanguage: setChatLanguage } = useChatStore();
  const { user, token, logout } = useAuthStore();
  const [language, setLanguage] = useState<SupportedLanguage>(detectLanguage());
  const navigate = useNavigate();
  const location = useLocation();

  const roleIcons = {
    student: GraduationCap,
    parent: User,
    teacher: Users,
    principal: Briefcase
  };

  const displayRole = (user?.role || currentRole) as keyof typeof roleIcons;
  const RoleIcon = roleIcons[displayRole] || Bot;

  const roleLabels: Record<string, string> = {
    student: 'Student', parent: 'Parent', teacher: 'Teacher', principal: 'Principal'
  };

  useEffect(() => {
    saveLanguagePreference(language);
    setChatLanguage(language);
    document.dir = getLanguageDirection(language);
  }, [language, setChatLanguage]);

  useEffect(() => {
    if (user?.role && user.role !== currentRole) {
      setRole(user.role as any);
    }
  }, [user?.role, currentRole, setRole]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;

  const navItems = token ? [
    { path: '/', icon: MessageCircle, label: 'Chat', show: true },
    { path: '/myday', icon: Sun, label: 'My Day', show: true },
    { path: '/tutor', icon: Sparkles, label: 'AI Tutor', show: user?.role === 'student' },
    { path: '/copilot', icon: Brain, label: 'Copilot', show: user?.role === 'teacher' },
    { path: '/school-intel', icon: Activity, label: 'Intelligence', show: user?.role === 'principal' },
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', show: true },
    { path: '/timetable', icon: Clock, label: 'Timetable', show: user?.role === 'student' || user?.role === 'parent' || user?.role === 'teacher' },
    { path: '/marks', icon: Award, label: 'Marks', show: user?.role === 'student' || user?.role === 'parent' || user?.role === 'teacher' },
    { path: '/notices', icon: Bell, label: 'Notices', show: true },
    { path: '/leaves', icon: FileText, label: 'Leaves', show: user?.role === 'student' || user?.role === 'teacher' },
    { path: '/meetings', icon: Calendar, label: 'Meetings', show: user?.role === 'parent' || user?.role === 'teacher' },
    { path: '/admin', icon: Activity, label: 'Traces', show: user?.role === 'principal' },
  ] : [];

  return (
    <header className="bg-white border-b shadow-sm sticky top-0 z-10">
      <div className="px-4 md:px-6 py-3 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2 rounded-lg">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-800">XYZ AI</h1>
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
              {user ? `${user.name}` : 'School Assistant'}
            </p>
          </div>
        </div>

        {/* Desktop Nav */}
        {token && (
          <nav className="hidden md:flex items-center gap-1">
            {navItems.filter(n => n.show).map(item => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive(item.path)
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-500 hover:text-indigo-600 hover:bg-indigo-50'
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </button>
            ))}
          </nav>
        )}

        {/* Right side */}
        <div className="flex items-center gap-2">
          {token && (
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 bg-indigo-50 rounded-lg border border-indigo-100">
              <RoleIcon className="w-3.5 h-3.5 text-indigo-600" />
              <span className="text-xs font-medium text-indigo-700">{roleLabels[displayRole] || displayRole}</span>
            </div>
          )}

          <div className="relative">
            <select
              value={language}
              onChange={e => setLanguage(e.target.value as SupportedLanguage)}
              className="text-xs border border-gray-200 rounded-lg pl-7 pr-5 py-1.5 bg-gray-50 appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              dir={getLanguageDirection(language)}
            >
              {getSupportedLanguages().map(lang => (
                <option key={lang.code} value={lang.code}>{lang.nativeName}</option>
              ))}
            </select>
            <Globe className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
          </div>

          {token && (
            <button
              onClick={handleLogout}
              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Mobile Nav */}
      {token && (
        <div className="md:hidden flex items-center gap-1 px-4 pb-2 overflow-x-auto">
          {navItems.filter(n => n.show).map(item => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                isActive(item.path)
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-500 bg-gray-100 hover:bg-indigo-50 hover:text-indigo-600'
              }`}
            >
              <item.icon className="w-3.5 h-3.5" />
              {item.label}
            </button>
          ))}
        </div>
      )}
    </header>
  );
}
