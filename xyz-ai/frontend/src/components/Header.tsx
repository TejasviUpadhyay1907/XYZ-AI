import { useState, useEffect } from 'react';
import { Bot, LogOut, User, Users, GraduationCap, Briefcase, Globe, Activity } from 'lucide-react';
import { useChatStore } from '../store/chatStore';
import { useAuthStore } from '../store/authStore';
import { getSupportedLanguages, detectLanguage, saveLanguagePreference, getLanguageDirection, type SupportedLanguage } from '../services/languageService';
import { useNavigate } from 'react-router-dom';

export function Header() {
  const { currentRole, setRole, setLanguage: setChatLanguage } = useChatStore();
  const { user, token, logout } = useAuthStore();
  const [language, setLanguage] = useState<SupportedLanguage>(detectLanguage());
  const navigate = useNavigate();

  const roleIcons = {
    student: GraduationCap,
    parent: User,
    teacher: Users,
    principal: Briefcase
  };

  // Use the role from JWT auth if available
  const displayRole = user?.role || currentRole;
  const RoleIcon = roleIcons[displayRole];

  useEffect(() => {
    saveLanguagePreference(language);
    setChatLanguage(language);
    document.dir = getLanguageDirection(language);
  }, [language, setChatLanguage]);

  // Sync role from auth
  useEffect(() => {
    if (user?.role && user.role !== currentRole) {
      setRole(user.role);
    }
  }, [user?.role, currentRole, setRole]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const roleLabels = {
    student: 'Student',
    parent: 'Parent',
    teacher: 'Teacher',
    principal: 'Principal'
  };

  return (
    <header className="bg-white border-b px-4 md:px-6 py-3 flex items-center justify-between shadow-sm sticky top-0 z-10">
      <div className="flex items-center gap-3">
        <div className="bg-indigo-600 p-2 rounded-lg">
          <Bot className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-gray-800">XYZ AI</h1>
          <p className="text-xs text-gray-500 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
            {user ? `${user.name} (${roleLabels[displayRole]})` : 'School Assistant'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-3">
        {/* Role badge (read-only, from JWT) */}
        {token && (
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 rounded-lg border border-indigo-100">
            <RoleIcon className="w-3.5 h-3.5 text-indigo-600" />
            <span className="text-xs font-medium text-indigo-700">{roleLabels[displayRole]}</span>
          </div>
        )}

        {/* Language selector */}
        <div className="relative">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as SupportedLanguage)}
            className="text-xs border border-gray-200 rounded-lg pl-7 pr-6 py-1.5 bg-gray-50 appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            dir={getLanguageDirection(language)}
          >
            {getSupportedLanguages().map(lang => (
              <option key={lang.code} value={lang.code}>
                {lang.nativeName}
              </option>
            ))}
          </select>
          <Globe className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
        </div>

        {/* Logout */}
        {token && (
          <>
            {displayRole === 'principal' && (
              <button
                onClick={() => navigate('/admin')}
                className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                title="Agent Trace Panel"
              >
                <Activity className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={handleLogout}
              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </>
        )}
      </div>
    </header>
  );
}
