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
    if (!('speechSynthesis' in window)) {
      console.warn('Speech synthesis not supported in this browser');
      return;
    }

    window.speechSynthesis.cancel();

    if (this.stateChangeCallback) {
      this.stateChangeCallback('speaking-start');
    }

    const utterance = new SpeechSynthesisUtterance(text);

    // Full BCP-47 locale codes for each language
    const localeMap: Record<string, string> = {
      en: 'en-IN',
      hi: 'hi-IN',
      ta: 'ta-IN',
      te: 'te-IN',
      mr: 'mr-IN',
      bn: 'bn-IN',
      gu: 'gu-IN',
      pa: 'pa-IN',
      kn: 'kn-IN',
      ml: 'ml-IN',
      ur: 'ur-PK',
    };

    const targetLocale = localeMap[language] || language;
    utterance.lang = targetLocale;

    // Smart voice selection: find the best available voice
    const findBestVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length === 0) return null;

      const langCode = language.toLowerCase();
      const locale = targetLocale.toLowerCase();

      // Priority 1: exact locale match (e.g. hi-IN)
      let voice = voices.find(v => v.lang.toLowerCase() === locale);
      if (voice) return voice;

      // Priority 2: language prefix match (e.g. hi-*)
      voice = voices.find(v => v.lang.toLowerCase().startsWith(langCode + '-'));
      if (voice) return voice;

      // Priority 3: language code contains match
      voice = voices.find(v => v.lang.toLowerCase().includes(langCode));
      if (voice) return voice;

      // Priority 4: fallback to en-IN or en-US if language not available
      voice = voices.find(v => v.lang.toLowerCase().startsWith('en-in'))
        || voices.find(v => v.lang.toLowerCase().startsWith('en'));

      return voice || null;
    };

    const speakWithVoice = () => {
      const voice = findBestVoice();
      if (voice) {
        utterance.voice = voice;
        // If we had to fall back to English for unsupported language, keep the lang code
        // so at least the text display is correct
        if (voice.lang.toLowerCase().startsWith('en') && !language.startsWith('en')) {
          console.info(`[Voice] No ${language} voice found. Using ${voice.name} (${voice.lang})`);
        }
      }

      utterance.rate = 0.9;   // Slightly slower for clarity
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      utterance.onend = () => {
        this.isSpeakingFlag = false;
        if (this.stateChangeCallback) this.stateChangeCallback('speaking-end');
      };
      utterance.onerror = () => {
        this.isSpeakingFlag = false;
        if (this.stateChangeCallback) this.stateChangeCallback('speaking-end');
      };

      window.speechSynthesis.speak(utterance);
      this.isSpeakingFlag = true;
    };

    // Voices may not be loaded yet — wait for them
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      speakWithVoice();
    } else {
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.onvoiceschanged = null;
        speakWithVoice();
      };
      // Safety timeout: if voices never load, try anyway
      setTimeout(() => {
        if (!this.isSpeakingFlag) speakWithVoice();
      }, 500);
    }

    this.synthesis = utterance;
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

// Export a singleton instance
export const voiceService = new VoiceServiceImpl();