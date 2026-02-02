import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Contract } from '../types';
import api from '../services/api';

interface ContractState {
  contracts: Contract[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchContracts: () => Promise<void>;
  getContractById: (id: string) => Contract | undefined;
  clearContracts: () => void;
  clearError: () => void;
}

export const useContractStore = create<ContractState>()(
  persist(
    (set, get) => ({
      contracts: [],
      isLoading: false,
      error: null,

      fetchContracts: async () => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.contracts.getAll();
          const data = (response as any).data || response;
          set({
            contracts: Array.isArray(data) ? data : data.contracts || [],
            isLoading: false,
          });
        } catch (error: any) {
          set({
            error: error.response?.data?.error?.message || error.message || 'Failed to fetch contracts',
            isLoading: false,
          });
        }
      },

      getContractById: (id: string) => {
        const { contracts } = get();
        return contracts.find((contract) => contract.id === id);
      },

      clearContracts: () => {
        set({ contracts: [], error: null });
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'contract-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ contracts: state.contracts }),
    }
  )
);

export default useContractStore;
