import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api',
  timeout: 10000,
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
      requestUrl.startsWith('/auth/signup') ||
      requestUrl.startsWith('/auth/google') ||
      requestUrl.startsWith('/auth/google/signup') ||
      requestUrl.startsWith('/auth/verify-email');

    if (error.response?.status === 401 && !isAuthRequest) {
      localStorage.removeItem('accessToken');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login?expired=1';
      }
    }
    return Promise.reject(error);
  },
);

export default api;
