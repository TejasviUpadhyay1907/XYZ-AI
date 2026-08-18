import React, { useRef, useEffect } from 'react';
import { useChatStore } from '../store/chatStore';
import { ChatMessage } from './ChatMessage';
import { voiceService } from '../services/voiceService';
import type { SupportedLanguage } from '../services/languageService';

export function ChatArea() {
  const { messages, isLoading, language, setAvatarState } = useChatStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastSpokenContentRef = useRef('');

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Auto-TTS for assistant messages + avatar state sync
  useEffect(() => {
    if (messages.length === 0) return;
    const lastMessage = messages[messages.length - 1];
    if (
      lastMessage.role === 'assistant' &&
      !lastMessage.isError &&
      lastMessage.content !== lastSpokenContentRef.current
    ) {
      setAvatarState('speaking');
      voiceService.speakText(lastMessage.content, language as SupportedLanguage);
      lastSpokenContentRef.current = lastMessage.content;

      // Reset avatar to idle after estimated speaking time
      const wordCount = lastMessage.content.split(' ').length;
      const speakDuration = Math.max(2000, wordCount * 300); // ~300ms per word
      setTimeout(() => setAvatarState('idle'), speakDuration);
    }
  }, [messages, language, setAvatarState]);

  // Set avatar to thinking when loading
  useEffect(() => {
    if (isLoading) {
      setAvatarState('thinking');
    }
  }, [isLoading, setAvatarState]);

  return (
    <main className="flex-1 overflow-y-auto px-4 py-6">
      <div className="max-w-3xl mx-auto space-y-4">
        {messages.map((msg, index) => (
          <React.Fragment key={index}>
            <ChatMessage
              role={msg.role}
              content={msg.content}
              isError={msg.isError}
            />
            {msg.role === 'assistant' &&
              msg.suggestedFollowUps &&
              msg.suggestedFollowUps.length > 0 && (
                <div className="flex flex-wrap gap-2 ml-12 mt-1">
                  {msg.suggestedFollowUps.map((followUp, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        const chatStore = useChatStore.getState();
                        chatStore.addMessage({ role: 'user', content: followUp });
                      }}
                      className="px-3 py-1.5 bg-indigo-50 text-indigo-700 text-sm rounded-full hover:bg-indigo-100 border border-indigo-200 transition-colors cursor-pointer"
                    >
                      {followUp}
                    </button>
                  ))}
                </div>
              )}
          </React.Fragment>
        ))}

        {isLoading && (
          <div className="flex items-start gap-3 ml-0">
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
