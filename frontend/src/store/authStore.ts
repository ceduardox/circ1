import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authApi, configureAuthTokenHandlers } from '../services/api';

interface User {
  id: string;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  age?: number;
  country?: string;
  role: 'USER' | 'ADMIN';
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (emailOrUsername: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  fetchMe: () => Promise<void>;
  updateProfile: (data: any) => Promise<void>;
  setAccessToken: (token: string) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,

      setAccessToken: (token) => {
        set({ accessToken: token });
      },

      login: async (identifier, password) => {
        set({ isLoading: true });
        try {
          const { data } = await authApi.login({ identifier, password });
          set({ user: data.user, accessToken: data.accessToken, isAuthenticated: true, isLoading: false });
        } catch (e) {
          set({ isLoading: false });
          throw e;
        }
      },

      register: async (data) => {
        set({ isLoading: true });
        try {
          const { data: res } = await authApi.register(data);
          set({ user: res.user, accessToken: res.accessToken, isAuthenticated: true, isLoading: false });
        } catch (e) {
          set({ isLoading: false });
          throw e;
        }
      },

      logout: async () => {
        try { await authApi.logout(); } catch {}
        set({ user: null, accessToken: null, isAuthenticated: false });
      },

      fetchMe: async () => {
        const token = get().accessToken;
        if (!token) return;
        try {
          const { data } = await authApi.me();
          set({ user: data.user, isAuthenticated: true });
        } catch {
          set({ user: null, accessToken: null, isAuthenticated: false });
        }
      },

      updateProfile: async (data) => {
        const { data: res } = await authApi.updateProfile(data);
        set({ user: res.user });
      },
    }),
    { name: 'auth-storage', partialize: (s) => ({ user: s.user, accessToken: s.accessToken, isAuthenticated: s.isAuthenticated }) }
  )
);

configureAuthTokenHandlers(
  () => useAuthStore.getState().accessToken,
  (accessToken) => useAuthStore.setState({
    accessToken,
    ...(accessToken ? {} : { user: null, isAuthenticated: false }),
  }),
);
