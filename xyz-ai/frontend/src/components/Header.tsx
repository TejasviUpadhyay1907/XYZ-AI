import { useState, useEffect } from 'react';
import { Bot, LogOut, Settings, User, Users, GraduationCap, Briefcase, Globe } from 'lucide-react';
import { useChatStore } from '../store/chatStore';
import { getSupportedLanguages, detectLanguage, saveLanguagePreference, getLanguageDirection, type SupportedLanguage } from '../services/languageService';

export function Header() {
  const { currentRole, setRole } = useChatStore();
  const [language, setLanguage] = useState<SupportedLanguage>(detectLanguage());

  const roleIcons = {
    student: GraduationCap,
    parent: User,
    teacher: Users,
    principal: Briefcase
  };

  const RoleIcon = roleIcons[currentRole];

  useEffect(() => {
    saveLanguagePreference(language);
    document.dir = getLanguageDirection(language);
  }, [language]);

  return (
    <header className="bg-white border-b px-6 py-4 flex items-center justify-between shadow-sm sticky top-0 z-10">
      <div className="flex items-center gap-3">
        <div className="bg-indigo-600 p-2 rounded-lg">
          <Bot className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-gray-800">XYZ Assistant</h1>
          <p className="text-xs text-green-600 font-medium flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> Online
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative">
          <select
            value={currentRole}
            onChange={(e) => setRole(e.target.value as any)}
            className="text-sm border-gray-300 rounded-md shadow-sm pl-8 pr-8 py-1.5 bg-gray-50 appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="student">Student</option>
            <option value="parent">Parent</option>
            <option value="teacher">Teacher</option>
            <option value="principal">Principal</option>
          </select>
          <RoleIcon className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        </div>

        <div className="relative">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as SupportedLanguage)}
            className="text-sm border-gray-300 rounded-md shadow-sm pl-8 pr-8 py-1.5 bg-gray-50 appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
            dir={getLanguageDirection(language)}
          >
            {getSupportedLanguages().map(lang => (
              <option key={lang.code} value={lang.code}>
                {lang.nativeName}
              </option>
            ))}
          </select>
          <Globe className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        </div>

        <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors" title="Settings">
          <Settings className="w-5 h-5" />
        </button>
        <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors" title="Logout">
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}