import React, { useRef, useEffect } from 'react';
import { useChatStore } from '../store/chatStore';
import { ChatMessage } from './ChatMessage';
import { useAuthStore } from '../store/authStore';
import { voiceService } from '../services/voiceService';
import type { SupportedLanguage } from '../services/languageService';

export function ChatArea() {
  const { messages, isLoading, setAvatarState, language, addMessage, setLoading } = useChatStore();
  const { user, token } = useAuthStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Set avatar to thinking when loading
  useEffect(() => {
    if (isLoading) {
      setAvatarState('thinking');
    }
  }, [isLoading, setAvatarState]);

  // Send a follow-up chip message to the AI (not just client-side)
  const handleFollowUp = async (followUpText: string) => {
    if (isLoading || !token) return;

    // Add user message
    addMessage({ role: 'user', content: followUpText });
    setLoading(true);
    setAvatarState('thinking');

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          sessionId: `session-${user?.id || 'default'}`,
          language,
          message: followUpText
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed');

      // Speak and show AI response
      voiceService.speakText(data.reply, language as SupportedLanguage);
      setAvatarState('speaking');

      addMessage({
        role: 'assistant',
        content: data.reply,
        suggestedFollowUps: data.suggestedFollowUps,
        needsClarification: data.needsClarification,
        ragSources: data.rag_sources,
      });
    } catch {
      addMessage({
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        isError: true
      });
      setAvatarState('idle');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex-1 overflow-y-auto px-4 py-6">
      <div className="max-w-3xl mx-auto space-y-4">
        {messages.map((msg, index) => (
          <React.Fragment key={index}>
            <ChatMessage
              role={msg.role}
              content={msg.content}
              isError={msg.isError}
              ragSources={msg.ragSources}
            />
            {msg.role === 'assistant' &&
              msg.suggestedFollowUps &&
              msg.suggestedFollowUps.length > 0 && (
                <div className="flex flex-wrap gap-2 ml-12 mt-1">
                  {msg.suggestedFollowUps.map((followUp, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleFollowUp(followUp)}
                      disabled={isLoading}
                      className="px-3 py-1.5 bg-indigo-50 text-indigo-700 text-sm rounded-full hover:bg-indigo-100 border border-indigo-200 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {followUp}
                    </button>
                  ))}
                </div>
              )}
          </React.Fragment>
        ))}

        {isLoading && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <div className="w-4 h-4 rounded-full bg-indigo-500 animate-pulse" />
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>
    </main>
  );
}
