import axios from 'axios';

const ENV_BASE = (import.meta as any).env?.VITE_API_URL || (import.meta as any).env?.VITE_PUBLIC_API_URL || '';
export const API_BASE = (ENV_BASE && ENV_BASE.trim() && ENV_BASE.trim().toLowerCase() !== 'auto')
  ? ENV_BASE.replace(/\/$/, '')
  : (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1')
      ? (window.location.protocol + '//' + window.location.host)
      : 'http://localhost:3000';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

if (typeof window !== 'undefined') {
  (window as any).__EMP_API_BASE__ = API_BASE;
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('emp_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      localStorage.removeItem('emp_token');
      localStorage.removeItem('emp_user');
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);

export default api;
