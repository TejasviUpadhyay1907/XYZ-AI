import { useState } from 'react';
import { Send, Mic, MicOff } from 'lucide-react';
import { useChatStore } from '../store/chatStore';
import type { SupportedLanguage } from '../services/languageService';
import { voiceService } from '../services/voiceService';
import { useAuthStore } from '../store/authStore';

export function ChatInput() {
  const [input, setInput] = useState('');
  const { isLoading, language, addMessage, setLoading, setAvatarState } = useChatStore();
  const { user, token } = useAuthStore();
  const [isListening, setIsListening] = useState(false);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isLoading || !token) return;

    const userMessage = input.trim();
    addMessage({ role: 'user', content: userMessage });
    setInput('');
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
          message: userMessage
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to get response');

      // Speak the response using TTS
      voiceService.speakText(data.reply, language as SupportedLanguage);
      setAvatarState('speaking');

      addMessage({
        role: 'assistant',
        content: data.reply,
        suggestedFollowUps: data.suggestedFollowUps,
        needsClarification: data.needsClarification
      });
    } catch (error) {
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

  const handleVoiceInput = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!voiceService.isListening) {
      try {
        setIsListening(true);
        setAvatarState('listening');
        const transcript = await voiceService.startListening(language as SupportedLanguage);
        setInput(transcript);
        setAvatarState('idle');
        // Auto-submit after getting transcript
        if (transcript.trim()) {
          // Small delay to show the text before sending
          setTimeout(() => {
            setInput('');
            addMessage({ role: 'user', content: transcript.trim() });
            setLoading(true);
            setAvatarState('thinking');

            fetch('/api/chat', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({
                sessionId: `session-${user?.id || 'default'}`,
                language,
                message: transcript.trim()
              })
            })
              .then(res => res.json())
              .then(data => {
                // Speak the response using TTS
                voiceService.speakText(data.reply, language as SupportedLanguage);
                setAvatarState('speaking');

                addMessage({
                  role: 'assistant',
                  content: data.reply,
                  suggestedFollowUps: data.suggestedFollowUps,
                  needsClarification: data.needsClarification
                });
              })
              .catch(() => {
                addMessage({
                  role: 'assistant',
                  content: 'Sorry, I encountered an error. Please try again.',
                  isError: true
                });
                setAvatarState('idle');
              })
              .finally(() => setLoading(false));
          }, 300);
        }
      } catch (error) {
        console.error('Voice input error:', error);
        setAvatarState('idle');
      } finally {
        setIsListening(false);
      }
    } else {
      voiceService.stopListening();
      setIsListening(false);
      setAvatarState('idle');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative flex items-center gap-2">
      <div className="relative flex-1">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={isListening ? 'Listening...' : 'Type your message...'}
          disabled={isLoading || !token || isListening}
          className="w-full pl-4 pr-12 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:bg-white transition-all disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!input.trim() || isLoading || !token}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>

      <button
        type="button"
        onClick={handleVoiceInput}
        disabled={isLoading || !token}
        className={`p-3.5 rounded-xl transition-all ${
          isListening
            ? 'bg-red-500 text-white animate-pulse shadow-lg shadow-red-200'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
        title={isListening ? 'Stop listening' : 'Voice input'}
        aria-label={isListening ? 'Stop listening' : 'Voice input'}
      >
        {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
      </button>
    </form>
  );
}
