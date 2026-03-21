import axios from 'axios';
import { useAuthStore } from '../store/authStore';

// Update this to your local machine IP when testing on a physical device
// e.g. 'http://192.168.1.100:4000/api'
export const API_BASE = 'http://localhost:4000/api';
export const UPLOADS_BASE = 'http://localhost:4000';

const api = axios.create({ baseURL: API_BASE });

api.interceptors.request.use(config => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      useAuthStore.getState().logout();
    }
    return Promise.reject(err);
  }
);

export default api;
