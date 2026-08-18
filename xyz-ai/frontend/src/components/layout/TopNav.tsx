import { Bell, Settings } from 'lucide-react';
import { ThemeToggle } from '../ThemeToggle';

export function TopNav() {
  return (
    <header className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200 dark:bg-gray-800 dark:border-gray-700">
      <div className="flex items-center space-x-3">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          XYZ AI Assistant
        </h1>
      </div>
      <div className="flex items-center space-x-3">
        <ThemeToggle />
        <button className="p-2 rounded-hover hover:bg-gray-200 dark:hover:bg-gray-700">
          <Bell className="h-5 w-5 text-gray-600" />
        </button>
        <button className="p-2 rounded-hover hover:bg-gray-200 dark:hover:bg-gray-700">
          <Settings className="h-5 w-5 text-gray-600" />
        </button>
      </div>
    </header>
  );
}