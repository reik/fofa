import axios from 'axios';
import { useAuthStore } from '../contexts/authStore';

const base = (import.meta.env.VITE_API_URL || 'http://localhost:4000').replace(/\/$/, '');
const api = axios.create({
  baseURL: `${base}/api`,
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    const isAuthEndpoint = err.config?.url?.includes('/auth/');
    if (err.response?.status === 401 && !isAuthEndpoint) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
