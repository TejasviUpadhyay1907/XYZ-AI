import React, { useRef, useEffect } from 'react';
import { useChatStore } from '../store/chatStore';
import { ChatMessage } from './ChatMessage';
import { voiceService } from '../services/voiceService';
import type { SupportedLanguage } from '../services/languageService';

export function ChatArea() {
  const { messages, isLoading, language } = useChatStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastSpokenContentRef = useRef('');

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  useEffect(() => {
    if (messages.length === 0) return;
    const lastMessage = messages[messages.length - 1];
    if (
      lastMessage.role === 'assistant' &&
      !lastMessage.isError &&
      lastMessage.content !== lastSpokenContentRef.current
    ) {
      voiceService.speakText(lastMessage.content, language as SupportedLanguage);
      lastSpokenContentRef.current = lastMessage.content;
    }
  }, [messages, language]);

  return (
    <main className="flex-1 overflow-y-auto p-6 space-y-6">
      <div ref={messagesEndRef} />
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
              <div className="flex flex-wrap gap-2 mt-2">
                {msg.suggestedFollowUps.map((followUp, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      const chatStore = useChatStore.getState();
                      chatStore.addMessage({ role: 'user', content: followUp });
                    }}
                    className="px-3 py-1 bg-indigo-100 text-indigo-800 text-sm rounded-full hover:bg-indigo-200 transition-colors cursor-pointer"
                  >
                    {followUp}
                  </button>
                ))}
              </div>
            )}
        </React.Fragment>
      ))}
      {isLoading && (
        <div className="flex items-center space-x-2 text-sm text-gray-500 mt-2">
          <div className="h-3 w-3 bg-indigo-500 rounded-full animate-pulse" />
          <span>Assistant is typing...</span>
        </div>
      )}
    </main>
  );
}