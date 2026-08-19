import { useState, useEffect } from 'react';
import { Send, Mic, MicOff } from 'lucide-react';
import { useChatStore } from '../store/chatStore';
import type { SupportedLanguage } from '../services/languageService';
import { voiceService } from '../services/voiceService';
import { useAuthStore } from '../store/authStore';

export function ChatInput() {
  const [input, setInput] = useState('');
  const { currentRole, userId, isLoading, language, addMessage, setLoading, setAvatarState } = useChatStore();
  const { user, token } = useAuthStore();
  const [isListening, setIsListening] = useState(false);

  useEffect(() => {
    // Set up callback from voiceService to update avatar state based on speech events
    const handleStateChange = (event: string) => {
      switch (event) {
        case 'listening-start':
          setAvatarState('listening');
          break;
        case 'listening-end':
          setAvatarState('idle');
          break;
        case 'speaking-start':
          setAvatarState('speaking');
          break;
        case 'speaking-end':
          setAvatarState('idle');
          break;
        default:
          break;
      }
    };
    voiceService.setStateChangeCallback(handleStateChange);
    // Cleanup
    return () => {
      voiceService.setStateChangeCallback(() => {});
    };
  }, [setAvatarState]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isLoading || !token) return;

    const userMessage = input.trim();
    addMessage({ role: 'user', content: userMessage });
    setInput('');
    setLoading(true);
    // Set avatar to thinking while waiting for AI response
    setAvatarState('thinking');

    try {
      // Call backend API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          sessionId: 'demo-session',
          userId: user?.id || userId, // fallback to chatStore userId if available
          role: user?.role || currentRole, // fallback to chatStore role if available
          language,
          message: userMessage
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to get response');

      addMessage({ role: 'assistant', content: data.reply });
      // Speak the response
      voiceService.speakText(data.reply, language as SupportedLanguage);
    } catch (error) {
      addMessage({
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        isError: true
      });
      // In case of error, reset avatar to idle
      setAvatarState('idle');
    } finally {
      setLoading(false);
      // Note: avatar state will be set to idle by voiceService when speech ends
      // If no speech (e.g., error), we already set to idle above
    }
  };

  const handleVoiceInput = async (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent form submission
    if (!voiceService.isListening) {
      try {
        // Avatar state will be set to listening by voiceService callback
        const transcript = await voiceService.startListening(language as SupportedLanguage);
        setInput(transcript);
        // Automatically submit after getting transcript
        if (transcript.trim()) {
          setTimeout(() => handleSubmit(), 100);
        }
      } catch (error) {
        console.error('Voice input error:', error);
        // Reset avatar to idle on error
        setAvatarState('idle');
      } finally {
        setIsListening(false);
      }
    } else {
      voiceService.stopListening();
      setIsListening(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative flex items-center">
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Type your message here..."
        disabled={isLoading || !token}
        className="w-full pl-5 pr-12 py-4 bg-gray-50 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all disabled:opacity-50"
      />
      <button
        type="submit"
        disabled={!input.trim() || isLoading || !token}
        className="absolute right-10 p-2.5 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <Send className="w-5 h-5" />
      </button>
      <button
        type="button"
        onClick={handleVoiceInput}
        disabled={isLoading || !token}
        className={`absolute right-2 p-2.5 bg-red-500 text-white rounded-full hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${isListening ? 'animate-pulse' : ''}`}
        title={isListening ? 'Listening...' : 'Voice Input'}
        aria-label={isListening ? 'Listening...' : 'Voice Input'}
      >
        {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
      </button>
    </form>
  );
}