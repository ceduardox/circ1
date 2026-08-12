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
    paymentCurrency?: string;
    plans?: { id: string; name: string; price: number }[];
  };
}

export interface PaymentInfo {
  id: string;
  status: string;
  invoiceUrl?: string | null;
  npStatus?: string | null;
  amount?: number;
  type?: string;
}

interface MembershipState {
  status: MembershipStatus | null;
  loadingStatus: boolean;
  requestingPayment: boolean;
  checkingPayment: boolean;
  fetchStatus: () => Promise<void>;
  requestPayment: (planId?: string) => Promise<PaymentInfo | null>;
  requestMonthlyPayment: () => Promise<PaymentInfo | null>;
  checkPayment: (paymentId: string) => Promise<PaymentInfo>;
  fetchPendingPayment: () => Promise<PaymentInfo | null>;
  reset: () => void;
}

export const useMembershipStore = create<MembershipState>((set, get) => ({
  status: null,
  loadingStatus: false,
  requestingPayment: false,
  checkingPayment: false,

  fetchStatus: async () => {
    set({ loadingStatus: true });
    try {
      const { data } = await membershipApi.status();
      set({ status: data, loadingStatus: false });
    } catch {
      set({ loadingStatus: false });
    }
  },

  requestPayment: async (planId?: string) => {
    set({ requestingPayment: true });
    try {
      const { data } = await membershipApi.requestPayment({ method: 'nowpayments', planId });
      await get().fetchStatus();
      return {
        id: data.payment.id,
        status: data.payment.status,
        invoiceUrl: data.invoiceUrl ?? data.payment.npInvoiceUrl,
        npStatus: data.payment.npStatus,
        amount: data.payment.amount,
        type: data.payment.type,
      };
    } finally {
      set({ requestingPayment: false });
    }
  },

  requestMonthlyPayment: async () => {
    set({ requestingPayment: true });
    try {
      const { data } = await membershipApi.requestMonthlyPayment({ method: 'nowpayments' });
      await get().fetchStatus();
      return {
        id: data.payment.id,
        status: data.payment.status,
        invoiceUrl: data.invoiceUrl ?? data.payment.npInvoiceUrl,
        npStatus: data.payment.npStatus,
        amount: data.payment.amount,
        type: data.payment.type,
      };
    } finally {
      set({ requestingPayment: false });
    }
  },

  checkPayment: async (paymentId: string) => {
    set({ checkingPayment: true });
    try {
      const { data } = await membershipApi.paymentStatus(paymentId);
      return data.payment as PaymentInfo;
    } finally {
      set({ checkingPayment: false });
    }
  },

  fetchPendingPayment: async () => {
    try {
      const { data } = await membershipApi.pendingPayment();
      return (data.payment as PaymentInfo | null) ?? null;
    } catch {
      return null;
    }
  },

  reset: () => set({ status: null }),
}));