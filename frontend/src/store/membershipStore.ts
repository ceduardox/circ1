import { create } from 'zustand';
import { membershipApi } from '../services/api';

interface MembershipStatus {
  status: string;
  paidAt?: string | null;
  expiresAt?: string | null;
  graceEndsAt?: string | null;
  balance: number;
  referralCode?: string | null;
  referralLink?: string | null;
  referrerId?: string | null;
  settings: {
    membershipPrice: number;
    monthlyFee: number;
    level1Percent: number;
    level2Percent: number;
  };
}

interface MembershipState {
  status: MembershipStatus | null;
  loadingStatus: boolean;
  requestingPayment: boolean;
  fetchStatus: () => Promise<void>;
  requestPayment: () => Promise<void>;
  requestMonthlyPayment: () => Promise<void>;
  reset: () => void;
}

export const useMembershipStore = create<MembershipState>((set, get) => ({
  status: null,
  loadingStatus: false,
  requestingPayment: false,

  fetchStatus: async () => {
    set({ loadingStatus: true });
    try {
      const { data } = await membershipApi.status();
      set({ status: data, loadingStatus: false });
    } catch {
      set({ loadingStatus: false });
    }
  },

  requestPayment: async () => {
    set({ requestingPayment: true });
    try {
      await membershipApi.requestPayment({ method: 'manual' });
      await get().fetchStatus();
    } finally {
      set({ requestingPayment: false });
    }
  },

  requestMonthlyPayment: async () => {
    set({ requestingPayment: true });
    try {
      await membershipApi.requestMonthlyPayment({ method: 'manual' });
      await get().fetchStatus();
    } finally {
      set({ requestingPayment: false });
    }
  },

  reset: () => set({ status: null }),
}));