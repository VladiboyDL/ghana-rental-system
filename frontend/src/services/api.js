import axios from 'axios';

// In production, use the full API URL; in development, use proxy
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  verifyOTP: (data) => api.post('/auth/verify-otp', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  forgotPassword: (data) => api.post('/auth/forgot-password', data),
  resetPassword: (data) => api.post('/auth/reset-password', data),
  verifyIdentity: (data) => api.post('/auth/verify-identity', data),
  resendOTP: (data) => api.post('/auth/resend-otp', data)
};

// User API
export const userAPI = {
  getProfile: () => api.get('/users/me'),
  updateProfile: (data) => api.put('/users/me', data),
  getUsers: (params) => api.get('/users', { params }),
  getLandlords: (params) => api.get('/users/landlords', { params }),
  getTenants: (params) => api.get('/users/tenants', { params })
};

// Property API
export const propertyAPI = {
  create: (data) => api.post('/properties', data),
  getAll: (params) => api.get('/properties', { params }),
  getById: (id) => api.get(`/properties/${id}`),
  update: (id, data) => api.put(`/properties/${id}`, data),
  search: (params) => api.get('/properties/search', { params }),
  uploadPhotos: (id, data) => api.post(`/properties/${id}/photos`, data),
  requestVerification: (id) => api.post(`/properties/${id}/verify`)
};

// Contract API
export const contractAPI = {
  create: (data) => api.post('/contracts', data),
  getAll: (params) => api.get('/contracts', { params }),
  getById: (id) => api.get(`/contracts/${id}`),
  getPending: () => api.get('/contracts/pending'),
  confirm: (id, data) => api.post(`/contracts/${id}/confirm`, data),
  object: (id, data) => api.post(`/contracts/${id}/object`, data),
  terminate: (id, data) => api.post(`/contracts/${id}/terminate`, data),
  renew: (id, data) => api.post(`/contracts/${id}/renew`, data)
};

// Payment API
export const paymentAPI = {
  calculate: (data) => api.post('/payments/calculate', data),
  create: (data) => api.post('/payments', data),
  getAll: (params) => api.get('/payments', { params }),
  getById: (id) => api.get(`/payments/${id}`),
  getSummary: (params) => api.get('/payments/summary', { params })
};

// Tax API
export const taxAPI = {
  getCertificates: (params) => api.get('/tax/certificates', { params }),
  getCertificateById: (id) => api.get(`/tax/certificates/${id}`),
  downloadCertificate: (id) => api.get(`/tax/certificates/${id}/download`),
  generateCertificate: (data) => api.post('/tax/certificates/generate', data),
  verifyCertificate: (code) => api.get(`/tax/verify/${code}`),
  getSummary: (params) => api.get('/tax/summary', { params })
};

// Market API
export const marketAPI = {
  getRentCheck: (params) => api.get('/market/rent-check', { params }),
  getTrends: (params) => api.get('/market/trends', { params }),
  compareToMarket: (data) => api.post('/market/compare', data),
  getLocations: () => api.get('/market/locations')
};

// Case API
export const caseAPI = {
  getAll: (params) => api.get('/cases', { params }),
  getById: (id) => api.get(`/cases/${id}`),
  create: (data) => api.post('/cases', data),
  assign: (id, data) => api.post(`/cases/${id}/assign`, data),
  schedule: (id, data) => api.post(`/cases/${id}/schedule`, data),
  uploadEvidence: (id, data) => api.post(`/cases/${id}/evidence`, data),
  submitReport: (id, data) => api.post(`/cases/${id}/report`, data),
  close: (id, data) => api.post(`/cases/${id}/close`, data),
  submitAnonymousTip: (data) => api.post('/cases/anonymous', data)
};

// Admin API
export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  getReports: (params) => api.get('/admin/reports', { params }),
  getAuditLogs: (params) => api.get('/admin/audit-logs', { params }),
  getSMSLog: () => api.get('/admin/sms-log')
};

// USSD API
export const ussdAPI = {
  getMenu: (code) => api.get(`/ussd/menu/${code}`),
  startSession: (data) => api.post('/ussd/session', data),
  sendInput: (data) => api.post('/ussd/input', data)
};

export default api;
