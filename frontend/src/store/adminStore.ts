import { create } from 'zustand';
import { adminApi } from '@/services/api';

interface Day {
  id: string;
  dayNumber: number;
  title: string;
  description?: string;
  isActive: boolean;
  contents: any[];
}

interface User {
  id: string;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  country?: string;
  role: string;
  createdAt: string;
  completedCount: number;
}

interface AdminStats {
  totalUsers: number;
  totalDays: number;
  totalContents: number;
  completedToday: number;
  totalCompletions: number;
  activeUsersWeek: number;
  reflectionsCount: number;
  quizzesPassed: number;
  uniqueDaysCompleted: number;
  avgProgress: number;
  recentDays?: Day[];
  recentUsers?: User[];
}

interface AdminState {
  days: Day[];
  users: { users: User[]; total: number; page: number; totalPages: number };
  stats: AdminStats | null;
  loading: boolean;
  fetchDays: () => Promise<void>;
  fetchUsers: (params?: any) => Promise<void>;
  fetchStats: () => Promise<void>;
  createDay: (data: any) => Promise<void>;
  updateDay: (id: string, data: any) => Promise<void>;
  deleteDay: (id: string) => Promise<void>;
  createContent: (data: any) => Promise<void>;
  updateContent: (id: string, data: any) => Promise<void>;
  deleteContent: (id: string) => Promise<void>;
  reorderContents: (dayId: string, contentIds: string[]) => Promise<void>;
  createUser: (data: any) => Promise<void>;
  updateUser: (id: string, data: any) => Promise<void>;
}

export const useAdminStore = create<AdminState>((set, get) => ({
  days: [],
  users: { users: [], total: 0, page: 1, totalPages: 1 },
  stats: null,
  loading: false,

  fetchDays: async () => {
    set({ loading: true });
    try {
      const { data } = await adminApi.getDays();
      set({ days: data, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  fetchUsers: async (params) => {
    set({ loading: true });
    try {
      const { data } = await adminApi.users(params);
      set({ users: data, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  fetchStats: async () => {
    try {
      const { data } = await adminApi.stats();
      const daysRes = await adminApi.getDays();
      const usersRes = await adminApi.users({ limit: 5 });
      set({ 
        stats: { 
          ...data, 
          recentDays: daysRes.data.slice(0, 5),
          recentUsers: usersRes.data.users.slice(0, 5),
        } 
      });
    } catch {}
  },

  createDay: async (data) => {
    const { data: day } = await adminApi.createDay(data);
    set(state => ({ days: [...state.days, day].sort((a, b) => a.dayNumber - b.dayNumber) }));
  },

  updateDay: async (id, data) => {
    const { data: day } = await adminApi.updateDay(id, data);
    set(state => ({ days: state.days.map(d => d.id === id ? day : d) }));
  },

  deleteDay: async (id) => {
    await adminApi.deleteDay(id);
    set(state => ({ days: state.days.filter(d => d.id !== id) }));
  },

  createContent: async (data) => {
    const { data: content } = await adminApi.createContent(data);
    set(state => ({
      days: state.days.map(d => 
        d.id === data.dayId ? { ...d, contents: [...d.contents, content].sort((a, b) => a.orderIndex - b.orderIndex) } : d
      ),
    }));
  },

  updateContent: async (id, data) => {
    const { data: content } = await adminApi.updateContent(id, data);
    set(state => ({
      days: state.days.map(d => ({
        ...d,
        contents: d.contents.map(c => c.id === id ? content : c),
      })),
    }));
  },

  deleteContent: async (id) => {
    await adminApi.deleteContent(id);
    set(state => ({
      days: state.days.map(d => ({
        ...d,
        contents: d.contents.filter(c => c.id !== id),
      })),
    }));
  },

  reorderContents: async (dayId, contentIds) => {
    await adminApi.reorderContents(dayId, contentIds);
    set(state => ({
      days: state.days.map(d => {
        if (d.id !== dayId) return d;
        const sorted = contentIds.map((cid, i) => {
          const c = d.contents.find(x => x.id === cid);
          return c ? { ...c, orderIndex: i } : null;
        }).filter(Boolean);
        return { ...d, contents: sorted };
      }),
    }));
  },

  createUser: async (data) => {
    const { data: user } = await adminApi.createUser(data);
    set(state => ({
      users: {
        ...state.users,
        users: [user, ...state.users.users],
        total: state.users.total + 1,
      },
    }));
  },

  updateUser: async (id, data) => {
    const { data: user } = await adminApi.updateUser(id, data);
    set(state => ({
      users: {
        ...state.users,
        users: state.users.users.map(u => u.id === id ? { ...u, ...user } : u),
      },
    }));
  },
}));