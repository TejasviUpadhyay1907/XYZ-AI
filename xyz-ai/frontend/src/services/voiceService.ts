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
        this.recognition!.lang = language;
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

    // Notify state change: speaking started
    if (this.stateChangeCallback) {
      this.stateChangeCallback('speaking-start');
    }

    this.synthesis = new SpeechSynthesisUtterance(text);
    this.synthesis.lang = language;
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

    window.speechSynthesis.speak(this.synthesis);
    this.isSpeakingFlag = true;
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