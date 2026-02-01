import axios from 'axios'
import { useAuthStore } from '../store/authStore'

const API_BASE_URL = '/api/v1'

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout()
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Auth API
export const authAPI = {
  login: (username, password) => 
    api.post('/auth/login', { username, password }),
  logout: () => 
    api.post('/auth/logout'),
  me: () => 
    api.get('/auth/me'),
}

// Organizations API
export const organizationsAPI = {
  list: (params) => 
    api.get('/organizations/', { params }),
  get: (id) => 
    api.get(`/organizations/${id}`),
  create: (data) => 
    api.post('/organizations/', data),
  update: (id, data) => 
    api.patch(`/organizations/${id}`, data),
  delete: (id) => 
    api.delete(`/organizations/${id}`),
}

// Licenses API
export const licensesAPI = {
  list: (params) => 
    api.get('/license/', { params }),
  get: (id) => 
    api.get(`/license/${id}`),
  create: (data) => 
    api.post('/license/generate', data),
  update: (id, data) => 
    api.patch(`/license/${id}`, data),
  revoke: (id) => 
    api.post(`/license/${id}/revoke`),
  renew: (id, days) => 
    api.post(`/license/${id}/renew`, { days }),
}

// Announcements API
export const announcementsAPI = {
  list: (params) => 
    api.get('/announcements/', { params }),
  getPublic: (limit = 50) => 
    api.get('/announcements/public', { params: { limit } }),
  get: (id) => 
    api.get(`/announcements/${id}`),
  create: (data) => 
    api.post('/announcements/', data),
  update: (id, data) => 
    api.patch(`/announcements/${id}`, data),
  delete: (id) => 
    api.delete(`/announcements/${id}`),
}

// Downloads/Releases API
export const releasesAPI = {
  list: (params) => 
    api.get('/downloads/', { params }),
  getLatest: (includeBeta = false) => 
    api.get('/downloads/latest', { params: { include_beta: includeBeta } }),
  get: (id) => 
    api.get(`/downloads/${id}`),
  create: (formData) => 
    api.post('/downloads/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  update: (id, data) => 
    api.patch(`/downloads/${id}`, data),
  delete: (id) => 
    api.delete(`/downloads/${id}`),
}

// Payments API
export const paymentsAPI = {
  list: (params) => 
    api.get('/payments/', { params }),
  get: (id) => 
    api.get(`/payments/${id}`),
  create: (data) => 
    api.post('/payments/', data),
  update: (id, data) => 
    api.patch(`/payments/${id}`, data),
}

// Admin Users API
export const usersAPI = {
  list: (params) => 
    api.get('/admin-users/', { params }),
  get: (id) => 
    api.get(`/admin-users/${id}`),
  create: (data) => 
    api.post('/admin-users/', data),
  update: (id, data) => 
    api.patch(`/admin-users/${id}`, data),
  delete: (id) => 
    api.delete(`/admin-users/${id}`),
}

// Tiers API
export const tiersAPI = {
  list: () => 
    api.get('/tiers/'),
  get: (id) => 
    api.get(`/tiers/${id}`),
  create: (data) => 
    api.post('/tiers/', data),
  update: (id, data) => 
    api.patch(`/tiers/${id}`, data),
  delete: (id) => 
    api.delete(`/tiers/${id}`),
}

// Dashboard API
export const dashboardAPI = {
  getStats: () => 
    api.get('/dashboard/stats'),
  getRecentActivations: (limit = 10) => 
    api.get('/dashboard/recent-activations', { params: { limit } }),
  getExpiringLicenses: (days = 30) => 
    api.get('/dashboard/expiring-licenses', { params: { days } }),
}

// AI API (public, no auth)
export const aiAPI = {
  chat: (data) => 
    axios.post(`${API_BASE_URL}/ai/chat`, data),
}

// Public API (no auth required)
export const publicAPI = {
  register: (data) =>
    axios.post(`${API_BASE_URL}/public/register`, data),
  getTiers: () =>
    axios.get(`${API_BASE_URL}/public/tiers`),
}

// Portal API (customer auth)
const portalApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add portal auth interceptor
portalApi.interceptors.request.use(
  (config) => {
    // Get token from portal store (lazy import to avoid circular deps)
    const portalStorage = localStorage.getItem('libro-portal-auth')
    if (portalStorage) {
      try {
        const { state } = JSON.parse(portalStorage)
        if (state?.token) {
          config.headers.Authorization = `Bearer ${state.token}`
        }
      } catch (e) {
        console.error('Failed to parse portal token', e)
      }
    }
    return config
  },
  (error) => Promise.reject(error)
)

export const portalAPI = {
  login: (email, password) =>
    axios.post(`${API_BASE_URL}/portal/login`, { email, password }),
  getMe: () =>
    portalApi.get('/portal/me'),
  recordPayment: (data) =>
    portalApi.post('/portal/payments', data),
  getPaymentHistory: () =>
    portalApi.get('/portal/payments'),
}

export default api
