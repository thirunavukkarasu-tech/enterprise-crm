import { api } from './api.js';

export const authService = {
  login: (credentials) => api.post('/auth/login', credentials).then((res) => res.data.data),

  logout: () => api.post('/auth/logout').then((res) => res.data.data),

  refresh: () => api.post('/auth/refresh-token').then((res) => res.data.data),

  getMe: () => api.get('/auth/me').then((res) => res.data.data),

  forgotPassword: (email) => api.post('/auth/forgot-password', { email }).then((res) => res.data),

  resetPassword: (token, payload) =>
    api.post(`/auth/reset-password/${token}`, payload).then((res) => res.data),
};
