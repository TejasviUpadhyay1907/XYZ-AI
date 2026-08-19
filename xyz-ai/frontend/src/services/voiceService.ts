import type { SupportedLanguage } from './languageService';

// Types for our voice service
export interface VoiceService {
  startListening: (language: SupportedLanguage) => Promise<string>;
  stopListening: () => void;
  speakText: (text: string, language: SupportedLanguage) => void;
  isListening: boolean;
  isSpeaking: boolean;
  setStateChangeCallback: (callback: (event: string) => void) => void;
}

// Create a voice service instance
class VoiceServiceImpl implements VoiceService {
  private recognition: any = null; // Using any for SpeechRecognition to avoid type issues
  private synthesis: SpeechSynthesisUtterance | null = null;
  private isListeningFlag = false;
  private isSpeakingFlag = false;
  private onResultCallback: ((error: string | null, transcript: string | null) => void) | null = null;
  private stateChangeCallback: ((event: string) => void) | null = null;

  constructor() {
    // Initialize SpeechRecognition if available
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = false;

      this.recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        this.isListeningFlag = false;
        if (this.onResultCallback) {
          this.onResultCallback(null, transcript);
        }
        // Notify state change: listening ended
        if (this.stateChangeCallback) {
          this.stateChangeCallback('listening-end');
        }
      };

      this.recognition.onerror = (event: any) => {
        this.isListeningFlag = false;
        if (this.onResultCallback) {
          this.onResultCallback(event.error, null);
        }
        // Notify state change: listening ended due to error
        if (this.stateChangeCallback) {
          this.stateChangeCallback('listening-end');
        }
      };

      this.recognition.onend = () => {
        this.isListeningFlag = false;
        // Notify state change: listening ended
        if (this.stateChangeCallback) {
          this.stateChangeCallback('listening-end');
        }
      };
    }

    // Initialize SpeechSynthesis
    this.synthesis = new SpeechSynthesisUtterance();
    this.synthesis.onend = () => {
      this.isSpeakingFlag = false;
      // Notify state change: speaking ended
      if (this.stateChangeCallback) {
        this.stateChangeCallback('speaking-end');
      }
    };
    this.synthesis.onerror = (event) => {
      console.error('Speech synthesis error', event);
      this.isSpeakingFlag = false;
      // Notify state change: speaking ended due to error
      if (this.stateChangeCallback) {
        this.stateChangeCallback('speaking-end');
      }
    };
  }

  async startListening(language: SupportedLanguage): Promise<string> {
    if (!this.recognition) {
      throw new Error('Speech recognition not supported in this browser');
    }

    // Notify state change: listening started
    if (this.stateChangeCallback) {
      this.stateChangeCallback('listening-start');
    }

    return new Promise((resolve, reject) => {
      this.onResultCallback = (error: string | null, transcript: string | null) => {
        this.onResultCallback = null; // Clear callback
        if (error) {
          reject(new Error(error));
        } else {
          resolve(transcript || '');
        }
      };

      try {
        // Use full locale for speech recognition too
        const sttLocaleMap: Record<string, string> = {
          en: 'en-IN', hi: 'hi-IN', ta: 'ta-IN', te: 'te-IN',
          mr: 'mr-IN', bn: 'bn-IN', gu: 'gu-IN', pa: 'pa-IN',
          kn: 'kn-IN', ml: 'ml-IN', ur: 'ur-PK',
        };
        this.recognition!.lang = sttLocaleMap[language] || language;
        this.recognition!.start();
        this.isListeningFlag = true;
      } catch (err) {
        this.onResultCallback = null;
        // Notify state change: listening ended due to error
        if (this.stateChangeCallback) {
          this.stateChangeCallback('listening-end');
        }
        reject(err);
      }
    });
  }

  stopListening() {
    if (this.recognition) {
      this.recognition.stop();
      this.isListeningFlag = false;
      // Notify state change: listening ended
      if (this.stateChangeCallback) {
        this.stateChangeCallback('listening-end');
      }
    }
  }

  speakText(text: string, language: SupportedLanguage) {
    if (typeof window === 'undefined') return;

    window.speechSynthesis?.cancel();
    this.isSpeakingFlag = false;

    if (this.stateChangeCallback) {
      this.stateChangeCallback('speaking-start');
    }

    // Full BCP-47 locale codes for each language
    const localeMap: Record<string, string> = {
      en: 'en', hi: 'hi', ta: 'ta', te: 'te',
      mr: 'mr', bn: 'bn', gu: 'gu', pa: 'pa',
      kn: 'kn', ml: 'ml', ur: 'ur',
    };

    const langCode = localeMap[language] || 'en';

    // --- Strategy 1: Google Translate TTS (supports all Indian languages, no key) ---
    const tryGoogleTTS = () => {
      // Split long text into chunks (Google TTS max ~200 chars)
      const chunks = splitTextIntoChunks(text, 180);
      let chunkIndex = 0;

      const playNextChunk = () => {
        if (chunkIndex >= chunks.length) {
          this.isSpeakingFlag = false;
          if (this.stateChangeCallback) this.stateChangeCallback('speaking-end');
          return;
        }

        const chunk = chunks[chunkIndex++];
        const encoded = encodeURIComponent(chunk);
        const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encoded}&tl=${langCode}&client=tw-ob`;

        const audio = new Audio(url);
        audio.volume = 1.0;

        audio.onended = () => playNextChunk();
        audio.onerror = () => {
          // Google TTS failed (CORS/rate limit) — fall back to Web Speech API
          console.warn('[Voice] Google TTS unavailable, falling back to Web Speech API');
          tryWebSpeechAPI();
        };

        audio.play().catch(() => {
          tryWebSpeechAPI();
        });
      };

      playNextChunk();
    };

    // --- Strategy 2: Web Speech API fallback ---
    const tryWebSpeechAPI = () => {
      if (!('speechSynthesis' in window)) {
        this.isSpeakingFlag = false;
        if (this.stateChangeCallback) this.stateChangeCallback('speaking-end');
        return;
      }

      const sttLocaleMap: Record<string, string> = {
        en: 'en-IN', hi: 'hi-IN', ta: 'ta-IN', te: 'te-IN',
        mr: 'mr-IN', bn: 'bn-IN', gu: 'gu-IN', pa: 'pa-IN',
        kn: 'kn-IN', ml: 'ml-IN', ur: 'ur-PK',
      };

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = sttLocaleMap[language] || 'en-IN';
      utterance.rate = 0.9;

      // Find best available voice
      const voices = window.speechSynthesis.getVoices();
      const targetLang = language.toLowerCase();
      const targetLocale = (sttLocaleMap[language] || '').toLowerCase();

      const voice =
        voices.find(v => v.lang.toLowerCase() === targetLocale) ||
        voices.find(v => v.lang.toLowerCase().startsWith(targetLang + '-')) ||
        voices.find(v => v.lang.toLowerCase().includes(targetLang)) ||
        voices.find(v => v.lang.toLowerCase().startsWith('en-in')) ||
        voices.find(v => v.lang.toLowerCase().startsWith('en'));

      if (voice) utterance.voice = voice;

      utterance.onend = () => {
        this.isSpeakingFlag = false;
        if (this.stateChangeCallback) this.stateChangeCallback('speaking-end');
      };
      utterance.onerror = () => {
        this.isSpeakingFlag = false;
        if (this.stateChangeCallback) this.stateChangeCallback('speaking-end');
      };

      window.speechSynthesis.speak(utterance);
      this.synthesis = utterance;
    };

    this.isSpeakingFlag = true;

    // Try Google TTS first (better quality, all languages)
    tryGoogleTTS();
  }

  stopSpeaking() {
    window.speechSynthesis?.cancel();
    this.isSpeakingFlag = false;
  }

  get isListening(): boolean {
    return this.isListeningFlag;
  }

  get isSpeaking(): boolean {
    return this.isSpeakingFlag;
  }

  setStateChangeCallback(callback: ((event: string) => void) | null) {
    this.stateChangeCallback = callback;
  }
}

// Helper: split long text into chunks for Google TTS (max ~200 chars per request)
function splitTextIntoChunks(text: string, maxLen: number): string[] {
  const chunks: string[] = [];
  // Split on sentence boundaries first, then by length
  const sentences = text.match(/[^.!?\n]+[.!?\n]*/g) || [text];

  let current = '';
  for (const sentence of sentences) {
    if ((current + sentence).length <= maxLen) {
      current += sentence;
    } else {
      if (current.trim()) chunks.push(current.trim());
      // If single sentence is too long, split by words
      if (sentence.length > maxLen) {
        const words = sentence.split(' ');
        current = '';
        for (const word of words) {
          if ((current + ' ' + word).length <= maxLen) {
            current += (current ? ' ' : '') + word;
          } else {
            if (current.trim()) chunks.push(current.trim());
            current = word;
          }
        }
      } else {
        current = sentence;
      }
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks.filter(c => c.length > 0);
}

// Export a singleton instance
export const voiceService = new VoiceServiceImpl();