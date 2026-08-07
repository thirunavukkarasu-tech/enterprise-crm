import { api } from './api.js';

const unwrap = (res) => res.data.data;

export const notificationService = {
  list: (params) =>
    api.get('/notifications', { params }).then((res) => ({ ...res.data.data, meta: res.data.meta })),
  markAsRead: (id) => api.patch(`/notifications/${id}/read`).then(unwrap),
  markAllAsRead: () => api.patch('/notifications/read-all').then(unwrap),
  remove: (id) => api.delete(`/notifications/${id}`).then(unwrap),
};
