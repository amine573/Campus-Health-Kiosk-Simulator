import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT from localStorage on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('chk_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Global error handler — redirect to login on 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('chk_token');
      localStorage.removeItem('chk_user');
      const path = window.location.pathname;
      if (path.startsWith('/admin') || path.startsWith('/kiosk')) {
        window.location.href = '/admin/login';
      } else {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

export default api;
