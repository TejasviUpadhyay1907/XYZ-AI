import { create } from 'zustand';
import type { SupportedLanguage } from '../services/languageService';
import { translate } from '../services/languageService';

export type Role = 'student' | 'parent' | 'teacher' | 'principal';
export type AvatarState = 'idle' | 'listening' | 'thinking' | 'speaking';

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  isError?: boolean;
  suggestedFollowUps?: string[];
  needsClarification?: boolean;
}

interface ChatState {
  messages: Message[];
  currentRole: Role;
  userId: string;
  isLoading: boolean;
  language: SupportedLanguage;
  avatarState: AvatarState;
  addMessage: (message: Message) => void;
  setRole: (role: Role) => void;
  setUserId: (id: string) => void;
  setLanguage: (language: SupportedLanguage) => void;
  setLoading: (loading: boolean) => void;
  clearMessages: () => void;
  setAvatarState: (state: AvatarState) => void;
}

// Initial welcome message based on role and language
const getWelcomeMessage = (role: Role, language: SupportedLanguage): string => {
  const welcomeKeys: Record<Role, string> = {
    student: 'welcome_student',
    parent: 'welcome_parent',
    teacher: 'welcome_teacher',
    principal: 'welcome_principal'
  };

  const key = welcomeKeys[role] || 'welcome_generic';
  return translate(key, language) || `Hello! I'm your ${role} assistant. How can I help you today?`;
};

export const useChatStore = create<ChatState>((set) => ({
  messages: [{ role: 'assistant', content: getWelcomeMessage('student', 'en') }],
  currentRole: 'student',
  userId: 'student123', // Default mock user ID, will be updated via auth
  language: 'en',
  isLoading: false,
  avatarState: 'idle',
  addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),
  setRole: (role) => set((state) => ({
    currentRole: role,
    messages: [{ role: 'assistant', content: getWelcomeMessage(role, state.language) }]
  })),
  setUserId: (userId) => set({ userId }),
  setLanguage: (language) => set((state) => ({
    language,
    messages: [{ role: 'assistant', content: getWelcomeMessage(state.currentRole, language) }]
  })),
  setLoading: (isLoading) => set({ isLoading }),
  clearMessages: () => set((state) => ({
    messages: [{ role: 'assistant', content: getWelcomeMessage(state.currentRole, state.language) }]
  })),
  setAvatarState: (state) => set({ avatarState: state })
}));