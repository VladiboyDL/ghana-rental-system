import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Payment } from '../types';
import api from '../services/api';

interface PaymentState {
  payments: Payment[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchPayments: () => Promise<void>;
  getPaymentById: (id: string) => Payment | undefined;
  clearPayments: () => void;
  clearError: () => void;
}

export const usePaymentStore = create<PaymentState>()(
  persist(
    (set, get) => ({
      payments: [],
      isLoading: false,
      error: null,

      fetchPayments: async () => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.payments.getAll();
          const data = (response as any).data || response;
          set({
            payments: Array.isArray(data) ? data : data.payments || [],
            isLoading: false,
          });
        } catch (error: any) {
          set({
            error: error.response?.data?.error?.message || error.message || 'Failed to fetch payments',
            isLoading: false,
          });
        }
      },

      getPaymentById: (id: string) => {
        const { payments } = get();
        return payments.find((payment) => payment.id === id);
      },

      clearPayments: () => {
        set({ payments: [], error: null });
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'payment-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ payments: state.payments }),
    }
  )
);

export default usePaymentStore;
