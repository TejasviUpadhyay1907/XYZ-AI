import { Bot } from 'lucide-react';

export function LoadingIndicator() {
  return (
    <div className="flex gap-4">
      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
        <Bot className="w-5 h-5 text-gray-600" />
      </div>
      <div className="bg-white shadow-sm border border-gray-100 text-gray-800 rounded-2xl rounded-tl-sm px-5 py-3">
        <div className="flex gap-1">
          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></span>
          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></span>
          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></span>
        </div>
      </div>
    </div>
  );
}
