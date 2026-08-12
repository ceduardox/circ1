import { create } from 'zustand';
import { vipProApi } from '../services/api';

export interface VipProLink {
  label: string;
  url: string;
}

export interface VipProModule {
  id: string;
  slug: string;
  title: string;
  subtitle?: string | null;
  icon: string;
  image?: string | null;
  description?: string | null;
  steps: string[];
  links: VipProLink[];
  checkItems?: string[];
  checks?: string[];
  statNumber?: string | null;
  statLabel?: string | null;
  orderIndex: number;
  completed: boolean;
  completedAt?: string | null;
}

interface VipProState {
  modules: VipProModule[];
  loading: boolean;
  error: string | null;
  fetchModules: () => Promise<void>;
  toggleModule: (id: string, item?: string) => Promise<void>;
}

export const useVipProStore = create<VipProState>((set, get) => ({
  modules: [],
  loading: false,
  error: null,

  fetchModules: async () => {
    set({ loading: true, error: null });
    try {
      const { data } = await vipProApi.modules();
      set({ modules: data.modules, loading: false });
    } catch (e: any) {
      set({ error: e?.response?.data?.error || 'No se pudieron cargar los módulos', loading: false });
    }
  },

  toggleModule: async (id: string, item?: string) => {
    try {
      const { data } = await vipProApi.toggleModule(id, item);
      set({
        modules: get().modules.map(m =>
          m.id === id
            ? { ...m, completed: data.completed, completedAt: data.completedAt, checks: data.checks }
            : m
        ),
      });
    } catch (e: any) {
      throw new Error(e?.response?.data?.error || 'No se pudo actualizar el módulo');
    }
  },
}));
