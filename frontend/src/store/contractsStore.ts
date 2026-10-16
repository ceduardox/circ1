import { create } from 'zustand';
import { contractsApi } from '@/services/api';

interface ContractsState {
  hasAny: boolean;
  hasPending: boolean;
  loaded: boolean;
  fetch: (force?: boolean) => Promise<void>;
}

export const useContractsStore = create<ContractsState>((set, get) => ({
  hasAny: false,
  hasPending: false,
  loaded: false,
  fetch: async (force = false) => {
    if (get().loaded && !force) return;
    try {
      const { data } = await contractsApi.my();
      const list = data.contracts || [];
      set({
        hasAny: list.length > 0,
        hasPending: list.some((c: any) => c.status === 'PENDIENTE'),
        loaded: true,
      });
    } catch {
      set({ loaded: true });
    }
  },
}));
