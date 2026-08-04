import { api } from './api.js';

const unwrap = (res) => res.data.data;
const unwrapWithMeta = (res) => ({ items: res.data.data, meta: res.data.meta });

export const taskService = {
  list: (params) => api.get('/tasks', { params }).then(unwrapWithMeta),

  getById: (id) => api.get(`/tasks/${id}`).then(unwrap),

  create: (payload) => api.post('/tasks', payload).then(unwrap),

  update: (id, payload) => api.patch(`/tasks/${id}`, payload).then(unwrap),

  remove: (id) => api.delete(`/tasks/${id}`).then(unwrap),

  addComment: (id, text) => api.post(`/tasks/${id}/comments`, { text }).then(unwrap),

  getTimeline: (id, limit = 20) => api.get(`/tasks/${id}/timeline`, { params: { limit } }).then(unwrap),

  uploadAttachment: (id, file, onProgress) => {
    const formData = new FormData();
    formData.append('file', file);
    return api
      .post(`/tasks/${id}/attachments`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: onProgress
          ? (e) => onProgress(Math.round((e.loaded * 100) / (e.total || e.loaded)))
          : undefined,
      })
      .then(unwrap);
  },

  removeAttachment: (id, attachmentId) => api.delete(`/tasks/${id}/attachments/${attachmentId}`).then(unwrap),
};
