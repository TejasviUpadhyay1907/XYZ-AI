import { User, Bot, AlertCircle } from 'lucide-react';

interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
  isError?: boolean;
}

/**
 * Render markdown-like content: bold, bullet points, newlines
 */
function renderContent(content: string) {
  // Split by newlines
  const lines = content.split('\n');

  return lines.map((line, i) => {
    // Bold text: **text** or __text__
    let processed: React.ReactNode = line;

    // Handle bold
    const boldRegex = /\*\*(.+?)\*\*/g;
    const parts = line.split(boldRegex);
    if (parts.length > 1) {
      processed = parts.map((part, j) =>
        j % 2 === 1 ? <strong key={j}>{part}</strong> : <span key={j}>{part}</span>
      );
    }

    // Bullet points
    if (line.trim().startsWith('•') || line.trim().startsWith('-') || line.trim().startsWith('*')) {
      const bulletContent = line.trim().replace(/^[•\-*]\s*/, '');
      const boldParts = bulletContent.split(boldRegex);
      const renderedBullet = boldParts.length > 1
        ? boldParts.map((part, j) => j % 2 === 1 ? <strong key={j}>{part}</strong> : <span key={j}>{part}</span>)
        : bulletContent;

      return (
        <div key={i} className="flex items-start gap-2 ml-1 my-0.5">
          <span className="text-indigo-400 mt-0.5">•</span>
          <span>{renderedBullet}</span>
        </div>
      );
    }

    // Numbered list items
    if (/^\d+\.\s/.test(line.trim())) {
      const num = line.trim().match(/^(\d+)\.\s/)?.[1];
      const listContent = line.trim().replace(/^\d+\.\s*/, '');
      return (
        <div key={i} className="flex items-start gap-2 ml-1 my-0.5">
          <span className="text-indigo-400 font-medium min-w-[1.2rem]">{num}.</span>
          <span>{listContent}</span>
        </div>
      );
    }

    // Checkmarks / success indicators
    if (line.includes('✅')) {
      return (
        <div key={i} className="flex items-start gap-1 my-0.5 text-green-700 font-medium">
          {processed}
        </div>
      );
    }

    // Error indicators
    if (line.includes('❌')) {
      return (
        <div key={i} className="flex items-start gap-1 my-0.5 text-red-700 font-medium">
          {processed}
        </div>
      );
    }

    // Empty lines = paragraph breaks
    if (line.trim() === '') {
      return <div key={i} className="h-2" />;
    }

    return <div key={i} className="my-0.5">{processed}</div>;
  });
}

export function ChatMessage({ role, content, isError }: ChatMessageProps) {
  return (
    <div className={`flex gap-3 ${role === 'user' ? 'flex-row-reverse' : ''}`}>
      {/* Avatar icon */}
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1 ${
        role === 'user' ? 'bg-indigo-600' : isError ? 'bg-red-100' : 'bg-indigo-100'
      }`}>
        {role === 'user' ? (
          <User className="w-4 h-4 text-white" />
        ) : isError ? (
          <AlertCircle className="w-4 h-4 text-red-600" />
        ) : (
          <Bot className="w-4 h-4 text-indigo-600" />
        )}
      </div>

      {/* Message bubble */}
      <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
        role === 'user'
          ? 'bg-indigo-600 text-white rounded-tr-sm'
          : isError
            ? 'bg-red-50 border border-red-200 text-red-800 rounded-tl-sm'
            : 'bg-white shadow-sm border border-gray-100 text-gray-800 rounded-tl-sm'
      }`}>
        <div className="text-[0.925rem] leading-relaxed">
          {role === 'assistant' && !isError
            ? renderContent(content)
            : <p className="whitespace-pre-wrap">{content}</p>
          }
        </div>
      </div>
    </div>
  );
}
