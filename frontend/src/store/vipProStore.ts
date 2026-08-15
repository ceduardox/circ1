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
      if (!Array.isArray(data?.modules)) {
        throw new Error('La API respondió sin una lista válida de módulos');
      }
      set({ modules: data.modules, loading: false });
    } catch (e: any) {
      const status = e?.response?.status;
      const detail = e?.response?.data?.error || e?.message || 'No se pudieron cargar los módulos';
      const message = status ? `Error ${status}: ${detail}` : detail;
      console.error('[VIP Pro] Error al cargar módulos', {
        status: status ?? 'sin respuesta',
        message: detail,
        endpoint: '/api/vip-pro/modules',
      });
      set({ modules: [], error: message, loading: false });
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
