import { api } from './api.js';

const unwrap = (res) => res.data.data;

export const userService = {
  /** Admin/HR/Manager only — returns 403 for Employees (see server/src/routes/user.routes.js). */
  listAssignable: () => api.get('/users').then(unwrap),

  getMyProfile: () => api.get('/users/me').then(unwrap),
  updateMyProfile: (payload) => api.patch('/users/me', payload).then(unwrap),
  uploadMyAvatar: (file, onProgress) => {
    const formData = new FormData();
    formData.append('file', file);
    return api
      .post('/users/me/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => onProgress?.(Math.round((e.loaded * 100) / e.total)),
      })
      .then(unwrap);
  },
  updateMyPreferences: (payload) => api.patch('/users/me/preferences', payload).then(unwrap),
  changeMyPassword: (payload) => api.patch('/users/me/password', payload).then(unwrap),
};
