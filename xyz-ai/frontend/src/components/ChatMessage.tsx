import { User, Bot, AlertCircle } from 'lucide-react';

interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
  isError?: boolean;
}

export function ChatMessage({ role, content, isError }: ChatMessageProps) {
  return (
    <div className={`flex gap-4 ${role === 'user' ? 'flex-row-reverse' : ''}`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
        role === 'user' ? 'bg-indigo-100' : isError ? 'bg-red-100' : 'bg-gray-200'
      }`}>
        {role === 'user' ? (
          <User className="w-5 h-5 text-indigo-600" />
        ) : isError ? (
          <AlertCircle className="w-5 h-5 text-red-600" />
        ) : (
          <Bot className="w-5 h-5 text-gray-600" />
        )}
      </div>
      <div className={`max-w-[75%] rounded-2xl px-5 py-3 ${
        role === 'user' 
          ? 'bg-indigo-600 text-white rounded-tr-sm' 
          : isError
            ? 'bg-red-50 border border-red-200 text-red-800 rounded-tl-sm'
            : 'bg-white shadow-sm border border-gray-100 text-gray-800 rounded-tl-sm'
      }`}>
        <p className="leading-relaxed whitespace-pre-wrap">{content}</p>
      </div>
    </div>
  );
}
