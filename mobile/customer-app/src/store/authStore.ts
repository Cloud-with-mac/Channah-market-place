import { create } from 'zustand';
import { authAPI } from '../../../shared/api/customer-api';
import { setOnAuthExpired } from '../../../shared/api/client';

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
  initError: boolean;
  initialize: () => Promise<void>;
  retry: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User) => void;
  refreshUser: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => {
  // Register global auth-expiry handler so the store is notified when tokens expire
  setOnAuthExpired(() => {
    set({ user: null, isLoading: false, error: null });
  });

  return {
    user: null,
    isLoading: false,
    error: null,
    initError: false,

    initialize: async () => {
      try {
        set({ isLoading: true, initError: false });
        const user = await authAPI.getCurrentUser();
        set({ user, isLoading: false });
      } catch (error: any) {
        // 401/403 means no valid session (guest) — not a real error
        const status = error?.statusCode || error?.response?.status;
        if (status === 401 || status === 403) {
          set({ user: null, isLoading: false, initError: false });
        } else {
          set({ user: null, isLoading: false, initError: true });
        }
      }
    },

    retry: async () => {
      const { initialize } = useAuthStore.getState();
      await initialize();
    },

    login: async (email: string, password: string) => {
      try {
        set({ isLoading: true, error: null });
        await authAPI.login(email, password);
        const user = await authAPI.getCurrentUser();
        set({ user, isLoading: false });
      } catch (error: any) {
        set({ error: error.message || 'Login failed', isLoading: false });
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
        set({ error: error.message || 'Registration failed', isLoading: false });
        throw error;
      }
    },

    logout: async () => {
      try {
        await authAPI.logout();
      } catch (error) {
        // Continue with local cleanup even if backend call fails
      }
      set({ user: null, error: null });
    },

    setUser: (user: User) => set({ user }),

    refreshUser: async () => {
      try {
        const user = await authAPI.getCurrentUser();
        set({ user });
      } catch {
        // Silently fail — user will be cleared on auth expiry
      }
    },

    clearError: () => set({ error: null }),
  };
});
