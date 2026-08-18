import { create } from 'zustand';
import { jwtDecode } from 'jwt-decode';

export type User = {
  id: string;
  email: string;
  role: 'student' | 'parent' | 'teacher' | 'principal';
  name: string;
};

export type AuthState = {
  token: string | null;
  user: User | null;
  isLoading: boolean;
  setToken: (token: string | null) => void;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  login: (token: string) => void;
  logout: () => void;
};

// Helper to decode token and get user info
const decodeToken = (token: string): User | null => {
  try {
    const decoded: any = jwtDecode(token);
    return {
      id: decoded.userId || decoded.id,
      email: decoded.email,
      role: decoded.role,
      name: decoded.name,
    };
  } catch (err) {
    return null;
  }
};

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  isLoading: false,
  setToken: (token) => set({ token }),
  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ isLoading: loading }),
  login: (token) => {
    const user = decodeToken(token);
    set({ token, user, isLoading: false });
    // Store token in localStorage for persistence
    localStorage.setItem('xyz-ai-token', token);
  },
  logout: () => {
    set({ token: null, user: null });
    localStorage.removeItem('xyz-ai-token');
  },
}));

// On app start, check for token in localStorage
if (typeof window !== 'undefined') {
  const storedToken = localStorage.getItem('xyz-ai-token');
  if (storedToken) {
    useAuthStore.getState().login(storedToken);
  }
}