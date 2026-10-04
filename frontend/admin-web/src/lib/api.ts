import axios from 'axios';

const ENV_BASE = (import.meta as any).env?.VITE_API_URL || (import.meta as any).env?.VITE_PUBLIC_API_URL || '';
const API_BASE = (ENV_BASE && ENV_BASE.trim() && ENV_BASE.trim().toLowerCase() !== 'auto')
  ? ENV_BASE.replace(/\/$/, '')
  : (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1')
      ? (window.location.protocol + '//' + window.location.host)
      : 'http://localhost:3000';

if (typeof window !== 'undefined') {
  (window as any).__ADMIN_API_BASE__ = API_BASE;
}

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('admin_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
