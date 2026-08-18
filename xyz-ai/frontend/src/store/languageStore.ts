import { create } from 'zustand';
import { detectLanguage } from '../services/languageService';
import type { SupportedLanguage } from '../services/languageService';

interface LanguageState {
  language: SupportedLanguage;
  setLanguage: (language: SupportedLanguage) => void;
}

export const useLanguageStore = create<LanguageState>((set) => ({
  language: detectLanguage(),
  setLanguage: (language) => set({ language }),
}));