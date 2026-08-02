import { api } from './api.js';

const unwrap = (res) => res.data.data;
const unwrapWithMeta = (res) => ({ items: res.data.data, meta: res.data.meta });

export const customerService = {
  list: (params) => api.get('/customers', { params }).then(unwrapWithMeta),

  getById: (id) => api.get(`/customers/${id}`).then(unwrap),

  create: (payload) => api.post('/customers', payload).then(unwrap),

  update: (id, payload) => api.patch(`/customers/${id}`, payload).then(unwrap),

  remove: (id) => api.delete(`/customers/${id}`).then(unwrap),

  addNote: (id, text) => api.post(`/customers/${id}/notes`, { text }).then(unwrap),

  getTimeline: (id, limit = 20) =>
    api.get(`/customers/${id}/timeline`, { params: { limit } }).then(unwrap),

  /** Triggers a browser download of the CSV rather than returning data to render. */
  exportCsv: async (params) => {
    const res = await api.get('/customers/export', { params, responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    link.download = `customers-${Date.now()}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  importCsv: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api
      .post('/customers/import', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      .then(unwrap);
  },
};
