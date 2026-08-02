import axios from 'axios';
import toast from 'react-hot-toast';

const baseURL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

/**
 * The access token is kept in memory only — never in localStorage or a
 * cookie readable by JS — to minimize the blast radius of an XSS bug (a
 * script that can run in the page could read localStorage, but a page
 * reload/new tab always starts with an empty in-memory store and must go
 * through the httpOnly-cookie-backed refresh flow instead).
 *
 * This is a tiny module-level store rather than React state so the axios
 * interceptors below (which live outside the component tree) can read/write
 * it directly. AuthContext is the only consumer that should call setAccessToken.
 */
let accessToken = null;
export const setAccessToken = (token) => {
  accessToken = token;
};
export const getAccessToken = () => accessToken;

export const api = axios.create({
  baseURL,
  withCredentials: true, // sends/receives the httpOnly refresh-token cookie
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

const isAuthEndpoint = (url = '') =>
  url.includes('/auth/login') || url.includes('/auth/refresh-token') || url.includes('/auth/logout');

let refreshPromise = null;

/**
 * Response interceptor with three responsibilities:
 * 1. Silent token refresh — on a 401 from a non-auth endpoint, attempt one
 *    refresh (deduplicated across concurrent requests via `refreshPromise`)
 *    and retry the original request before giving up.
 * 2. Consistent error toasts — most error responses are surfaced
 *    automatically so pages don't repeat `catch { toast.error(...) }`.
 * 3. Skips both behaviors for the auth endpoints themselves, so a failed
 *    login shows its own inline form error instead of triggering a
 *    "session expired" redirect loop.
 */
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config, response } = error;
    const status = response?.status;

    if (status === 401 && config && !config._retry && !isAuthEndpoint(config.url)) {
      config._retry = true;
      try {
        refreshPromise =
          refreshPromise ||
          axios.post(`${baseURL}/auth/refresh-token`, {}, { withCredentials: true }).finally(() => {
            refreshPromise = null;
          });

        const { data } = await refreshPromise;
        setAccessToken(data.data.accessToken);
        config.headers.Authorization = `Bearer ${data.data.accessToken}`;
        return api(config);
      } catch (refreshError) {
        setAccessToken(null);
        if (window.location.pathname !== '/login') {
          toast.error('Your session has expired. Please log in again.');
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }

    const message =
      response?.data instanceof Blob
        ? 'Something went wrong. Please try again.'
        : response?.data?.message || 'Something went wrong. Please try again.';
    if (!isAuthEndpoint(config?.url) && status !== 422 && status !== 400) {
      // Field-level validation (400/422) is rendered inline on forms instead
      // of double-surfaced as a toast; auth endpoints handle their own errors.
      if (status >= 500) {
        toast.error('Server error — our team has been notified.');
      } else if (status !== 401) {
        toast.error(message);
      }
    }

    return Promise.reject(error);
  }
);
