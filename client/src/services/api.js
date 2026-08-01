import axios from 'axios';
import toast from 'react-hot-toast';

const baseURL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

export const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach the access token to every request, if present.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('crm_access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * Centralized response handling:
 * - Surfaces server-provided error messages as toasts automatically, so
 *   individual pages don't need to repeat `catch (err) { toast.error(...) }`
 *   for every single request.
 * - On 401, clears the session and redirects to /login (full auth/refresh
 *   flow is implemented in Phase 2 — this is the wiring point for it).
 */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const message = error.response?.data?.message || 'Something went wrong. Please try again.';

    if (status === 401) {
      localStorage.removeItem('crm_access_token');
      if (window.location.pathname !== '/login') {
        toast.error('Your session has expired. Please log in again.');
        window.location.href = '/login';
      }
    } else if (status >= 500) {
      toast.error('Server error — our team has been notified.');
    } else if (status !== 422) {
      // 422 (field-level validation) is typically rendered inline on the
      // form itself, so we avoid double-surfacing it as a toast.
      toast.error(message);
    }

    return Promise.reject(error);
  }
);
