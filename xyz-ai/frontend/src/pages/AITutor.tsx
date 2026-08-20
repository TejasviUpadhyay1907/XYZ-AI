import { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen, Send, Mic, MicOff, Sparkles, RotateCcw, ChevronRight } from 'lucide-react';
import { voiceService } from '../services/voiceService';
import type { SupportedLanguage } from '../services/languageService';
import { useChatStore } from '../store/chatStore';

type TutorMode = 'simple' | 'normal' | 'exam_prep' | 'detailed';

const MODES: Record<TutorMode, { label: string; desc: string; color: string }> = {
  simple:     { label: 'Simple',       desc: 'Easy language, everyday examples', color: 'bg-green-50 text-green-700 border-green-200' },
  normal:     { label: 'Normal',       desc: 'Standard textbook explanation',    color: 'bg-blue-50 text-blue-700 border-blue-200' },
  exam_prep:  { label: 'Exam Prep',    desc: 'Focus on marks, key points',       color: 'bg-orange-50 text-orange-700 border-orange-200' },
  detailed:   { label: 'Detailed',     desc: 'Deep dive with full theory',       color: 'bg-purple-50 text-purple-700 border-purple-200' },
};

const QUICK_TOPICS = [
  'Newton\'s Laws of Motion', 'Photosynthesis', 'Quadratic Equations',
  'The French Revolution', 'Chemical Bonding', 'Probability', 'Cell Division',
];

interface TutorMessage {
  role: 'user' | 'tutor';
  content: string;
  has_question?: boolean;
}

export function AITutor() {
  const { token, user } = useAuthStore();
  const { language } = useChatStore();
  const navigate = useNavigate();
  const [mode, setMode] = useState<TutorMode>('normal');
  const [topic, setTopic] = useState('');
  const [messages, setMessages] = useState<TutorMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(false);
  const tutorSessionId = useRef(`tutor-${Date.now()}`);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const startSession = async (topicToLearn: string) => {
    if (!topicToLearn.trim()) return;
    setTopic(topicToLearn);
    setSessionStarted(true);
    setMessages([]);
    // Generate a stable session ID for this tutor topic (not per-message)
    tutorSessionId.current = `tutor-${user?.id || 'anon'}-${Date.now()}`;

    const modeInstructions: Record<TutorMode, string> = {
      simple: 'Explain this in very simple language with everyday examples like you\'re teaching a 12-year-old. Use analogies. Keep it short and fun.',
      normal: 'Give a clear standard explanation with definitions, one example, and a simple diagram description if helpful.',
      exam_prep: 'Focus on exam-important points only. Give key definitions, formula if any, 2-3 likely exam questions and their answers.',
      detailed: 'Give a comprehensive explanation covering theory, mechanism, examples, applications, and common misconceptions.',
    };

    await sendToTutor(
      `I want to learn about: ${topicToLearn}. Mode: ${MODES[mode].label}. ${modeInstructions[mode]}. After your explanation, ask me ONE question to check my understanding.`,
      true
    );
  };

  const sendToTutor = async (message: string, isSystem = false) => {
    if (!token) return;
    setLoading(true);

    if (!isSystem) {
      setMessages(prev => [...prev, { role: 'user', content: message }]);
    }

    try {
      // History is maintained via stable session ID (tutorSessionId.current)

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          sessionId: tutorSessionId.current,
          language,
          message: isSystem
            ? message
            : `[Tutor Context: Topic="${topic}", Mode=${mode}] Student says: ${message}`,
        })
      });

      const data = await response.json();
      if (data.reply) {
        const hasQuestion = data.reply.includes('?');
        setMessages(prev => [...prev, { role: 'tutor', content: data.reply, has_question: hasQuestion }]);
        voiceService.speakText(data.reply, language as SupportedLanguage);
      }
    } catch (e) {
      console.error(e);
      setMessages(prev => [...prev, { role: 'tutor', content: 'Sorry, I had a problem. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || loading) return;
    const msg = input.trim();
    setInput('');
    sendToTutor(msg);
  };

  const handleVoice = async () => {
    if (isListening) { voiceService.stopListening(); setIsListening(false); return; }
    try {
      setIsListening(true);
      const transcript = await voiceService.startListening(language as SupportedLanguage);
      setIsListening(false);
      if (transcript.trim()) {
        setInput(transcript);
        setTimeout(() => {
          const msg = transcript.trim();
          setInput('');
          sendToTutor(msg);
        }, 300);
      }
    } catch { setIsListening(false); }
  };

  const resetSession = () => {
    setMessages([]);
    setTopic('');
    setSessionStarted(false);
    setInput('');
    tutorSessionId.current = `tutor-${user?.id || 'anon'}-${Date.now()}`;
    voiceService.stopSpeaking?.();
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/myday')} className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-r from-indigo-500 to-purple-500 p-1.5 rounded-lg">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-800">AI Study Tutor</h2>
              {topic && <p className="text-xs text-gray-400 truncate max-w-[180px]">{topic}</p>}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {sessionStarted && (
            <button onClick={resetSession} className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg" title="New topic">
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Session not started — topic picker */}
      {!sessionStarted ? (
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl mb-4 shadow-lg">
                <BookOpen className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-800">What would you like to learn?</h1>
              <p className="text-sm text-gray-500 mt-2">I'll explain the topic, give examples, and test your understanding</p>
            </div>

            {/* Mode selector */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Learning Mode</p>
              <div className="grid grid-cols-2 gap-2">
                {(Object.entries(MODES) as [TutorMode, typeof MODES[TutorMode]][]).map(([key, m]) => (
                  <button
                    key={key}
                    onClick={() => setMode(key)}
                    className={`text-left px-3 py-2.5 rounded-xl border text-xs font-medium transition-all ${
                      mode === key
                        ? m.color + ' border-current shadow-sm'
                        : 'border-gray-200 text-gray-500 bg-white hover:border-gray-300'
                    }`}
                  >
                    <p className="font-semibold">{m.label}</p>
                    <p className="opacity-75 mt-0.5">{m.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Topic input */}
            <form onSubmit={e => { e.preventDefault(); startSession(topic); }} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Enter Topic</p>
              <div className="flex gap-2">
                <input
                  value={topic}
                  onChange={e => setTopic(e.target.value)}
                  placeholder="e.g. Newton's Laws, Photosynthesis, Quadratic Equations..."
                  className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="submit"
                  disabled={!topic.trim() || loading}
                  className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2 text-sm font-medium"
                >
                  Start <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </form>

            {/* Quick topic chips */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Quick Topics</p>
              <div className="flex flex-wrap gap-2">
                {QUICK_TOPICS.map(t => (
                  <button
                    key={t}
                    onClick={() => { setTopic(t); startSession(t); }}
                    disabled={loading}
                    className="px-3 py-1.5 bg-indigo-50 text-indigo-700 text-xs rounded-full border border-indigo-200 hover:bg-indigo-100 transition-colors disabled:opacity-50"
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Active tutor session */
        <>
          <div className="flex-1 overflow-y-auto px-4 py-4">
            <div className="max-w-2xl mx-auto space-y-4">
              {/* Mode badge */}
              <div className="flex justify-center">
                <span className={`text-xs px-3 py-1 rounded-full font-medium border ${MODES[mode].color}`}>
                  {MODES[mode].label} Mode · {topic}
                </span>
              </div>

              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                    msg.role === 'user'
                      ? 'bg-indigo-600 text-white rounded-tr-sm'
                      : 'bg-white border border-gray-100 shadow-sm text-gray-800 rounded-tl-sm'
                  }`}>
                    {msg.role === 'tutor' && (
                      <div className="flex items-center gap-1.5 mb-2">
                        <Sparkles className="w-3 h-3 text-indigo-500" />
                        <span className="text-xs font-medium text-indigo-600">Eduvia Tutor</span>
                      </div>
                    )}
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                    {msg.role === 'tutor' && msg.has_question && (
                      <div className="mt-2 pt-2 border-t border-gray-100">
                        <p className="text-xs text-indigo-500 font-medium">💭 Think about this and share your answer below</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex justify-start">
                  <div className="bg-white border border-gray-100 shadow-sm rounded-2xl rounded-tl-sm px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3 text-indigo-500 animate-pulse" />
                      <span className="text-xs font-medium text-indigo-600">Tutor is thinking...</span>
                    </div>
                    <div className="flex gap-1 mt-2">
                      {[0, 150, 300].map(delay => (
                        <div key={delay} className="w-2 h-2 bg-indigo-300 rounded-full animate-bounce" style={{ animationDelay: `${delay}ms` }} />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input */}
          <div className="bg-white border-t px-4 py-3 flex-shrink-0">
            <div className="max-w-2xl mx-auto">
              <form onSubmit={handleSubmit} className="flex gap-2">
                <input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder={isListening ? 'Listening...' : 'Type your answer or ask a question...'}
                  disabled={loading || isListening}
                  className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || loading}
                  className="p-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-30 transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleVoice}
                  disabled={loading}
                  className={`p-2.5 rounded-xl transition-all ${
                    isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200'
                  } disabled:opacity-50`}
                >
                  {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>
              </form>
              <div className="flex gap-2 mt-2">
                <button onClick={() => sendToTutor('Can you give me another example?')} disabled={loading}
                  className="text-xs text-indigo-600 hover:underline disabled:opacity-50">Another example</button>
                <span className="text-gray-300">·</span>
                <button onClick={() => sendToTutor('Ask me a harder question to test my understanding.')} disabled={loading}
                  className="text-xs text-indigo-600 hover:underline disabled:opacity-50">Quiz me harder</button>
                <span className="text-gray-300">·</span>
                <button onClick={() => sendToTutor('Explain this more simply.')} disabled={loading}
                  className="text-xs text-indigo-600 hover:underline disabled:opacity-50">Simplify</button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
