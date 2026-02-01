import { create } from 'zustand';
import { authAPI, userAPI } from '../services/api';

const useAuthStore = create((set, get) => ({
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  token: localStorage.getItem('token'),
  isLoading: false,
  error: null,

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authAPI.login({ email, password });
      const { token, user } = response.data.data;

      // Check if user role is allowed on web portal
      const webAllowedRoles = ['GRA_OFFICER', 'GRA_SUPERVISOR', 'INSPECTOR', 'ADMIN', 'SYSTEM_ADMIN'];
      if (!webAllowedRoles.includes(user.role)) {
        set({ isLoading: false });
        return {
          success: false,
          error: 'Landlords and tenants must use the mobile app. Please download the Ghana Rental Tax app from the App Store or Google Play.'
        };
      }

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      set({ user, token, isLoading: false });
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.error?.message || 'Login failed';
      set({ error: message, isLoading: false });
      return { success: false, error: message };
    }
  },

  register: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authAPI.register(data);
      set({ isLoading: false });
      return { success: true, data: response.data.data };
    } catch (error) {
      const message = error.response?.data?.error?.message || 'Registration failed';
      set({ error: message, isLoading: false });
      return { success: false, error: message };
    }
  },

  verifyOTP: async (phone, code) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authAPI.verifyOTP({ phone, code });
      const { token, user } = response.data.data;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      set({ user, token, isLoading: false });
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.error?.message || 'Verification failed';
      set({ error: message, isLoading: false });
      return { success: false, error: message };
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ user: null, token: null });
  },

  refreshUser: async () => {
    try {
      const response = await userAPI.getProfile();
      const user = response.data.data;
      localStorage.setItem('user', JSON.stringify(user));
      set({ user });
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  },

  isAuthenticated: () => {
    return !!get().token && !!get().user;
  },

  hasRole: (roles) => {
    const user = get().user;
    if (!user) return false;
    if (Array.isArray(roles)) {
      return roles.includes(user.role);
    }
    return user.role === roles;
  },

  isLandlord: () => {
    return get().hasRole(['LANDLORD_INDIVIDUAL', 'LANDLORD_CORPORATE']);
  },

  isTenant: () => {
    return get().hasRole(['TENANT_INDIVIDUAL', 'TENANT_CORPORATE']);
  },

  isAdmin: () => {
    return get().hasRole('SYSTEM_ADMIN');
  },

  isGRA: () => {
    return get().hasRole('GRA_OFFICER');
  },

  isInspector: () => {
    return get().hasRole('INSPECTOR');
  }
}));

export default useAuthStore;
