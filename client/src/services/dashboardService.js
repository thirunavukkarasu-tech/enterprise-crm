import { api } from './api.js';

const unwrap = (res) => res.data.data;

export const dashboardService = {
  getKpis: () => api.get('/dashboard/kpis').then(unwrap),
  getPipeline: () => api.get('/dashboard/pipeline').then(unwrap),
  getRevenueAnalytics: (months = 6) =>
    api.get('/dashboard/revenue-analytics', { params: { months } }).then(unwrap),
  getLeadConversion: () => api.get('/dashboard/lead-conversion').then(unwrap),
  getRecentActivities: (limit = 10) =>
    api.get('/dashboard/activities', { params: { limit } }).then(unwrap),
  getUpcomingTasks: (limit = 5) =>
    api.get('/dashboard/tasks/upcoming', { params: { limit } }).then(unwrap),
  getNotifications: (limit = 10) =>
    api.get('/dashboard/notifications', { params: { limit } }).then(unwrap),
  getTopPerformers: (limit = 5) =>
    api.get('/dashboard/top-performers', { params: { limit } }).then(unwrap),
  getCustomerGrowth: (months = 6) =>
    api.get('/dashboard/customer-growth', { params: { months } }).then(unwrap),
};
