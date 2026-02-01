import { create } from 'zustand';
import { authAPI } from '../../../shared/api/customer-api';

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  role: string;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  initialize: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User) => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  error: null,

  initialize: async () => {
    try {
      const user = await authAPI.getCurrentUser();
      set({ user, isLoading: false });
    } catch (error) {
      set({ user: null, isLoading: false });
    }
  },

  login: async (email: string, password: string) => {
    try {
      set({ isLoading: true, error: null });
      await authAPI.login(email, password);
      const user = await authAPI.getCurrentUser();
      set({ user, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  register: async (data: any) => {
    try {
      set({ isLoading: true, error: null });
      await authAPI.register(data);
      const user = await authAPI.getCurrentUser();
      set({ user, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    try {
      await authAPI.logout();
      set({ user: null });
    } catch (error) {
      console.error('Logout error:', error);
      set({ user: null });
    }
  },

  setUser: (user: User) => set({ user }),

  clearError: () => set({ error: null }),
}));
