import { api } from './api.js';

const unwrap = (res) => res.data.data;
const unwrapWithMeta = (res) => ({ items: res.data.data, meta: res.data.meta });

export const leadService = {
  list: (params) => api.get('/leads', { params }).then(unwrapWithMeta),

  getById: (id) => api.get(`/leads/${id}`).then(unwrap),

  create: (payload) => api.post('/leads', payload).then(unwrap),

  update: (id, payload) => api.patch(`/leads/${id}`, payload).then(unwrap),

  remove: (id) => api.delete(`/leads/${id}`).then(unwrap),

  convert: (id) => api.post(`/leads/${id}/convert`).then(unwrap),

  addNote: (id, text) => api.post(`/leads/${id}/notes`, { text }).then(unwrap),

  getTimeline: (id, limit = 20) => api.get(`/leads/${id}/timeline`, { params: { limit } }).then(unwrap),

  uploadAttachment: (id, file, onProgress) => {
    const formData = new FormData();
    formData.append('file', file);
    return api
      .post(`/leads/${id}/attachments`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: onProgress
          ? (e) => onProgress(Math.round((e.loaded * 100) / (e.total || e.loaded)))
          : undefined,
      })
      .then(unwrap);
  },

  removeAttachment: (id, attachmentId) =>
    api.delete(`/leads/${id}/attachments/${attachmentId}`).then(unwrap),
};
