import { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  User,
  Globe,
  Search,
  ChevronDown,
  Moon,
  Sun,
  GraduationCap,
  Check,
  Settings,
  LogOut,
} from 'lucide-react';
import { getSupportedLanguages, detectLanguage, saveLanguagePreference, getLanguageInfo } from '../../services/languageService';

export function Header() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState(detectLanguage());
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Initialize theme from localStorage or system preference
  useEffect(() => {
    const savedTheme = localStorage.getItem('xyz-ai-theme');
    if (savedTheme) {
      setIsDarkMode(savedTheme === 'dark');
      document.documentElement.classList.toggle('dark', savedTheme === 'dark');
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDarkMode(prefersDark);
      document.documentElement.classList.toggle('dark', prefersDark);
    }
  }, []);

  const handleLanguageChange = (language: string) => {
    setCurrentLanguage(language as any);
    saveLanguagePreference(language as any);
    setShowLanguageMenu(false);
    // Reload to apply language changes
    window.location.reload();
  };

  const handleThemeToggle = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem('xyz-ai-theme', newMode ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', newMode);
  };

  return (
    <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-100 shadow-sm z-40">
      {/* Left Side - App Title */}
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
          <GraduationCap className="w-5 h-5 text-indigo-600" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-800">Eduvia AI</h2>
          <p className="text-xs text-gray-500">School Assistant</p>
        </div>
      </div>

      {/* Center - Search (optional) */}
      <div className="hidden md:flex items-center space-x-4">
        <div className="relative w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search..."
            className="pl-10 pr-4 py-2 rounded-full border border-gray-300 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
          />
        </div>
      </div>

      {/* Right Side - User Controls */}
      <div className="flex items-center space-x-4">
        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Bell className="w-5 h-5 text-gray-600" />
            {/* Notification badge */}
            {showNotifications && (
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
            )}
          </button>
        </div>

        {/* Language Selector */}
        <div className="relative">
          <button
            onClick={() => setShowLanguageMenu(!showLanguageMenu)}
            className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Globe className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">{getLanguageInfo(currentLanguage).nativeName}</span>
            <ChevronDown className="w-3 h-3 text-gray-500" />
          </button>
          {showLanguageMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-20">
              {getSupportedLanguages().map(lang => (
                <button
                  key={lang.code}
                  onClick={() => handleLanguageChange(lang.code)}
                  className={`
                    flex items-center w-full px-3 py-2 text-sm text-left
                    ${currentLanguage === lang.code ? 'bg-indigo-50 text-indigo-600 font-medium' : 'hover:bg-gray-50'}
                  `}
                >
                  <span className="mr-2">{lang.nativeName}</span>
                  <span className="flex-1">{lang.name}</span>
                  {currentLanguage === lang.code && (
                    <Check className="w-4 h-4 text-indigo-600" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Theme Toggle */}
        <button
          onClick={handleThemeToggle}
          className="p-2 rounded-lg hover:bg-gray-50 transition-colors"
          title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDarkMode ? (
            <Sun className="w-4 h-4 text-yellow-400" />
          ) : (
            <Moon className="w-4 h-4 text-gray-600" />
          )}
        </button>

        {/* User Profile */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
              <User className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-800">{user?.name?.split(' ')[0] || 'User'}</p>
              <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
            </div>
            <ChevronDown className="w-3 h-3 text-gray-500" />
          </button>
          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-20">
              <button
                onClick={() => {
                  setShowProfileMenu(false);
                  navigate('/profile');
                }}
                className="flex items-center w-full px-3 py-2 text-sm text-left hover:bg-gray-50 transition-colors"
              >
                <User className="w-4 h-4 mr-3" />
                <span>Profile</span>
              </button>
              <button
                onClick={() => {
                  setShowProfileMenu(false);
                  navigate('/settings');
                }}
                className="flex items-center w-full px-3 py-2 text-sm text-left hover:bg-gray-50 transition-colors"
              >
                <Settings className="w-4 h-4 mr-3" />
                <span>Settings</span>
              </button>
              <button
                onClick={() => {
                  setShowProfileMenu(false);
                  // Handle logout
                  // We'll call logout from authStore
                }}
                className="flex items-center w-full px-3 py-2 text-sm text-left text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="w-4 h-4 mr-3" />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}