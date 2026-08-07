import { api } from './api.js';

const unwrap = (res) => res.data.data;

export const settingsService = {
  getCompany: () => api.get('/settings/company').then(unwrap),
  updateCompany: (payload) => api.patch('/settings/company', payload).then(unwrap),
};
