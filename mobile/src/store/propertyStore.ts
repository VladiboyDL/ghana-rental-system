import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Property } from '../types';
import api from '../services/api';

interface PropertyState {
  properties: Property[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchProperties: () => Promise<void>;
  getPropertyById: (id: string) => Property | undefined;
  clearProperties: () => void;
  clearError: () => void;
}

export const usePropertyStore = create<PropertyState>()(
  persist(
    (set, get) => ({
      properties: [],
      isLoading: false,
      error: null,

      fetchProperties: async () => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.properties.getAll();
          const data = (response as any).data || response;
          set({
            properties: Array.isArray(data) ? data : data.properties || [],
            isLoading: false,
          });
        } catch (error: any) {
          set({
            error: error.response?.data?.error?.message || error.message || 'Failed to fetch properties',
            isLoading: false,
          });
        }
      },

      getPropertyById: (id: string) => {
        const { properties } = get();
        return properties.find((property) => property.id === id);
      },

      clearProperties: () => {
        set({ properties: [], error: null });
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'property-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ properties: state.properties }),
    }
  )
);

export default usePropertyStore;
