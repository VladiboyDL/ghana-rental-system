import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { User } from '../types';
import api from '../services/api';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  loadStoredAuth: () => Promise<void>;
  setAuth: (token: string, user: User) => Promise<void>;
  login: (emailOrPhone: string, password: string) => Promise<boolean>;
  register: (data: {
    email: string;
    phone: string;
    password: string;
    role: 'LANDLORD' | 'TENANT';
    firstName: string;
    lastName: string;
    ghanaCardNumber?: string;
  }) => Promise<boolean>;
  verifyOTP: (phone: string, code: string) => Promise<boolean>;
  logout: () => Promise<void>;
  updateUser: (data: Partial<User>) => void;
  setUser: (user: User | Partial<User>) => void;
  clearError: () => void;

  // Role checks
  isLandlord: () => boolean;
  isTenant: () => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  loadStoredAuth: async () => {
    try {
      const token = await SecureStore.getItemAsync('authToken');
      const userStr = await SecureStore.getItemAsync('user');

      if (token && userStr) {
        const user = JSON.parse(userStr);
        api.setAuthToken(token);

        // Verify token is still valid by getting profile
        try {
          const response = await api.user.getProfile();
          set({
            token,
            user: response.data,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch {
          // Token expired, clear auth
          await SecureStore.deleteItemAsync('authToken');
          await SecureStore.deleteItemAsync('user');
          api.setAuthToken(null);
          set({ user: null, token: null, isAuthenticated: false, isLoading: false });
        }
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      set({ isLoading: false });
    }
  },

  setAuth: async (token: string, user: User) => {
    await SecureStore.setItemAsync('authToken', token);
    await SecureStore.setItemAsync('user', JSON.stringify(user));
    api.setAuthToken(token);
    set({
      token,
      user,
      isAuthenticated: true,
      isLoading: false,
    });
  },

  login: async (emailOrPhone: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      console.log('Attempting login with:', emailOrPhone);
      const response = await api.auth.login(emailOrPhone, password);
      console.log('Login response:', JSON.stringify(response));
      const data = (response as any).data || response;
      console.log('Extracted data:', JSON.stringify(data));
      const { token, user } = data;
      console.log('Token:', token ? 'exists' : 'missing', 'User:', user ? 'exists' : 'missing');

      if (!token || !user) {
        throw new Error('Invalid response: missing token or user');
      }

      await SecureStore.setItemAsync('authToken', token);
      await SecureStore.setItemAsync('user', JSON.stringify(user));
      api.setAuthToken(token);

      set({
        token,
        user,
        isAuthenticated: true,
        isLoading: false,
      });
      return true;
    } catch (error: any) {
      console.log('Login error:', error.message, error.response?.data);
      set({
        error: error.response?.data?.error?.message || error.message || 'Login failed',
        isLoading: false,
      });
      return false;
    }
  },

  register: async (data) => {
    set({ isLoading: true, error: null });
    try {
      await api.auth.register(data);
      set({ isLoading: false });
      return true;
    } catch (error: any) {
      set({
        error: error.response?.data?.error?.message || 'Registration failed',
        isLoading: false,
      });
      return false;
    }
  },

  verifyOTP: async (phone: string, code: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.auth.verifyOTP(phone, code);
      const data = (response as any).data || response;
      const { token, user } = data;

      await SecureStore.setItemAsync('authToken', token);
      await SecureStore.setItemAsync('user', JSON.stringify(user));
      api.setAuthToken(token);

      set({
        token,
        user,
        isAuthenticated: true,
        isLoading: false,
      });
      return true;
    } catch (error: any) {
      set({
        error: error.response?.data?.error?.message || 'Verification failed',
        isLoading: false,
      });
      return false;
    }
  },

  logout: async () => {
    try {
      await api.auth.logout();
    } catch (e) {
      // Ignore errors during logout
    }
    await SecureStore.deleteItemAsync('authToken');
    await SecureStore.deleteItemAsync('user');
    api.setAuthToken(null);
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      error: null,
    });
  },

  updateUser: (data: Partial<User>) => {
    const { user } = get();
    if (user) {
      const updatedUser = { ...user, ...data };
      set({ user: updatedUser });
      SecureStore.setItemAsync('user', JSON.stringify(updatedUser));
    }
  },

  setUser: (userData: User | Partial<User>) => {
    const { user } = get();
    const updatedUser = user ? { ...user, ...userData } : userData as User;
    set({ user: updatedUser });
    SecureStore.setItemAsync('user', JSON.stringify(updatedUser));
  },

  clearError: () => set({ error: null }),

  isLandlord: () => {
    const role = get().user?.role;
    return role === 'LANDLORD' || role === 'LANDLORD_INDIVIDUAL' || role === 'LANDLORD_CORPORATE';
  },
  isTenant: () => {
    const role = get().user?.role;
    return role === 'TENANT' || role === 'TENANT_INDIVIDUAL' || role === 'TENANT_CORPORATE';
  },
}));

export default useAuthStore;
