import { create } from 'zustand';
import type { SupportedLanguage } from '../services/languageService';

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

// Initial welcome message based on role
const getWelcomeMessage = (role: Role, _language: SupportedLanguage): string => {
  const messages: Record<Role, string> = {
    student: "Hello! I'm your Academic Assistant. I can help you check attendance, apply for leave, view notices, and answer school questions. What would you like to know?",
    parent: "Hello! I'm your Parent Support Assistant. I can help you check your child's attendance, apply for leave, schedule meetings with teachers, and more. How can I help?",
    teacher: "Hello! I'm your Teaching Assistant. I can help you mark attendance, view class reports, send notices to parents, and manage student concerns. What would you like to do?",
    principal: "Hello! I'm your Management Assistant. I can help you with school analytics, send announcements, review attendance trends, and monitor the system. What do you need?"
  };
  return messages[role] || messages.student;
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