import { api } from './api.js';

const unwrap = (res) => res.data.data;

export const userService = {
  /** Admin/HR/Manager only — returns 403 for Employees (see server/src/routes/user.routes.js). */
  listAssignable: () => api.get('/users').then(unwrap),
};
