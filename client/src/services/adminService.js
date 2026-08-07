import { api } from './api.js';

const unwrap = (res) => res.data.data;
const withMeta = (res) => ({ items: res.data.data, meta: res.data.meta });

export const adminService = {
  listUsers: (params) => api.get('/admin/users', { params }).then(withMeta),
  getUser: (id) => api.get(`/admin/users/${id}`).then(unwrap),
  createUser: (payload) => api.post('/admin/users', payload).then(unwrap),
  updateUser: (id, payload) => api.patch(`/admin/users/${id}`, payload).then(unwrap),

  listAuditLogs: (params) => api.get('/admin/audit-logs', { params }).then(withMeta),
  listLoginHistory: (params) => api.get('/admin/login-history', { params }).then(withMeta),
};
