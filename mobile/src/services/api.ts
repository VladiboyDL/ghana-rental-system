import axios, { AxiosInstance, AxiosError } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { ApiResponse, User, Property, Contract, Payment, ScannedDocument, ExtractedIdData } from '../types';

// API Base URL - change this for production
const API_BASE_URL = __DEV__
  ? 'http://localhost:5000/api'
  : 'https://ghana-rental-api.onrender.com/api';

class ApiService {
  private client: AxiosInstance;
  private token: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });

    // Request interceptor
    this.client.interceptors.request.use(
      async (config) => {
        if (!this.token) {
          this.token = await SecureStore.getItemAsync('authToken');
        }
        if (this.token) {
          config.headers.Authorization = `Bearer ${this.token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response.data,
      async (error: AxiosError) => {
        if (error.response?.status === 401) {
          await this.clearAuth();
        }
        return Promise.reject(error);
      }
    );
  }

  setToken(token: string) {
    this.token = token;
    SecureStore.setItemAsync('authToken', token);
  }

  setAuthToken(token: string | null) {
    this.token = token;
  }

  async clearAuth() {
    this.token = null;
    await SecureStore.deleteItemAsync('authToken');
    await SecureStore.deleteItemAsync('user');
  }

  // Auth API
  auth = {
    register: async (data: {
      email: string;
      phone: string;
      password: string;
      role: 'LANDLORD' | 'TENANT';
      firstName: string;
      lastName: string;
      ghanaCardNumber?: string;
      digitalAddress?: string;
      region?: string;
    }) => {
      return this.client.post('/auth/register', data);
    },

    login: async (emailOrPhone: string, password: string) => {
      const response = await this.client.post('/auth/login', { emailOrPhone, password });
      if (response.data?.token) {
        this.setToken(response.data.token);
        await SecureStore.setItemAsync('user', JSON.stringify(response.data.user));
      }
      return response;
    },

    verifyOTP: async (phone: string, code: string) => {
      const response = await this.client.post('/auth/verify-otp', { phone, code });
      if (response.data?.token) {
        this.setToken(response.data.token);
        await SecureStore.setItemAsync('user', JSON.stringify(response.data.user));
      }
      return response;
    },

    resendOTP: async (phone: string) => {
      return this.client.post('/auth/resend-otp', { phone });
    },

    logout: async () => {
      await this.clearAuth();
    },
  };

  // Properties API
  properties = {
    getAll: async (params?: { status?: string; isAvailable?: boolean }) => {
      return this.client.get('/properties', { params });
    },

    getById: async (id: string) => {
      return this.client.get(`/properties/${id}`);
    },

    create: async (data: Partial<Property>) => {
      return this.client.post('/properties', data);
    },

    update: async (id: string, data: Partial<Property>) => {
      return this.client.put(`/properties/${id}`, data);
    },

    uploadPhotos: async (id: string, photos: FormData) => {
      return this.client.post(`/properties/${id}/photos`, photos, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },
  };

  // Contracts API
  contracts = {
    getAll: async (params?: { status?: string }) => {
      return this.client.get('/contracts', { params });
    },

    getById: async (id: string) => {
      return this.client.get(`/contracts/${id}`);
    },

    create: async (data: {
      propertyId: string;
      tenantPhone?: string;
      tenantEmail?: string;
      tenantExtractedData?: string;
      startDate: string;
      endDate: string;
      monthlyRent: number;
      securityDeposit?: number;
      serviceCharge?: number;
      advanceMonths: number;
      paymentFrequency: string;
    }) => {
      return this.client.post('/contracts', data);
    },

    confirm: async (id: string, data: {
      confirmationCode: string;
      extractedIdData?: string;
    }) => {
      return this.client.post(`/contracts/${id}/confirm`, data);
    },

    sign: async (id: string, data: { signature: string }) => {
      return this.client.post(`/contracts/${id}/sign`, data);
    },
  };

  // Payments API
  payments = {
    getAll: async (params?: { status?: string; contractId?: string }) => {
      return this.client.get('/payments', { params });
    },

    getById: async (id: string) => {
      return this.client.get(`/payments/${id}`);
    },

    initiate: async (id: string, data: {
      paymentMethod: string;
      paymentProvider: string;
      phoneNumber?: string;
    }) => {
      return this.client.post(`/payments/${id}/initiate`, data);
    },

    getSummary: async () => {
      return this.client.get('/payments/summary');
    },
  };

  // Documents API
  documents = {
    upload: async (formData: FormData) => {
      return this.client.post('/documents/scan', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },

    getAll: async () => {
      return this.client.get('/documents');
    },
  };

  // Users API (alias as 'user' for compatibility)
  users = {
    getProfile: async () => {
      return this.client.get('/users/me');
    },

    updateProfile: async (data: Partial<User>) => {
      return this.client.put('/users/me', data);
    },

    searchTenants: async (query: string) => {
      return this.client.get('/users/tenants', { params: { search: query } });
    },
  };

  // Alias for user API
  user = this.users;

  // Notifications API
  notifications = {
    getAll: async () => {
      return this.client.get('/notifications');
    },

    markRead: async (id: string) => {
      return this.client.put(`/notifications/${id}/read`);
    },

    markAllRead: async () => {
      return this.client.put('/notifications/read-all');
    },
  };

  // Market Data API
  market = {
    getRentCheck: async (params: {
      region: string;
      district: string;
      neighborhood?: string;
      propertyType: string;
      bedrooms?: number;
    }) => {
      return this.client.get('/market/rent-check', { params });
    },
  };
}

export const api = new ApiService();
export default api;
