import { api } from './api.js';

const unwrap = (res) => res.data.data;
const unwrapWithMeta = (res) => ({ items: res.data.data, meta: res.data.meta });

export const followUpService = {
  list: (params) => api.get('/followups', { params }).then(unwrapWithMeta),

  getById: (id) => api.get(`/followups/${id}`).then(unwrap),

  getCustomerHistory: (customerId, limit = 20) =>
    api.get(`/followups/customer/${customerId}`, { params: { limit } }).then(unwrap),

  create: (payload) => api.post('/followups', payload).then(unwrap),

  update: (id, payload) => api.patch(`/followups/${id}`, payload).then(unwrap),

  remove: (id) => api.delete(`/followups/${id}`).then(unwrap),
};
