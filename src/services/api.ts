import axios from 'axios';
import { API_TIMEOUT_MS, AUTH_EXEMPT_PATH_PREFIXES } from '../constants/api';
import { loginExpiredPath, ROUTES } from '../constants/routes';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/',
  timeout: API_TIMEOUT_MS,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const requestUrl = error.config?.url ?? '';
    const isAuthRequest =
      requestUrl.startsWith('/auth/login') ||
      requestUrl.startsWith('/auth/signup');

    if (error.response?.status === 401 && !isAuthRequest) {
      localStorage.removeItem('accessToken');
      if (window.location.pathname !== ROUTES.LOGIN) {
        window.location.href = loginExpiredPath();
      }
    }
    return Promise.reject(error);
  },
);

export default api;
