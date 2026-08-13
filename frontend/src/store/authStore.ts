import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authApi, configureAuthTokenHandlers } from '../services/api';
import { syncPushUser } from '../lib/onesignal';

interface User {
  id: string;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  age?: number;
  country?: string;
  avatarUrl?: string | null;
  role: 'USER' | 'ADMIN';
  pushEnabled?: boolean;
  pushChat?: boolean;
  pushChatAll?: boolean;
  pushCommissions?: boolean;
  pushPayments?: boolean;
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
  updateAvatar: (file: File) => Promise<void>;
  updatePushPreferences: (data: Partial<Pick<User, 'pushEnabled' | 'pushChat' | 'pushChatAll' | 'pushCommissions' | 'pushPayments'>>) => Promise<void>;
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
          syncPushUser(data.user.id);
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
          syncPushUser(res.user.id);
        } catch (e) {
          set({ isLoading: false });
          throw e;
        }
      },

      logout: async () => {
        try { await authApi.logout(); } catch {}
        syncPushUser(null);
        set({ user: null, accessToken: null, isAuthenticated: false });
      },

      fetchMe: async () => {
        const token = get().accessToken;
        if (!token) return;
        try {
          const { data } = await authApi.me();
          set({ user: data.user, isAuthenticated: true });
          syncPushUser(data.user.id);
        } catch {
          set({ user: null, accessToken: null, isAuthenticated: false });
        }
      },

      updateProfile: async (data) => {
        const { data: res } = await authApi.updateProfile(data);
        set({ user: res.user });
      },

      updateAvatar: async (file) => {
        const { data: res } = await authApi.uploadAvatar(file);
        set({ user: { ...get().user, avatarUrl: res.user.avatarUrl } as any });
      },

      updatePushPreferences: async (data) => {
        await authApi.updatePushPreferences(data);
        set({ user: { ...get().user, ...data } as any });
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
