import axios from 'axios';
import { getLoginUrl } from './routes';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // A 401 from an auth endpoint (e.g. a wrong password on /auth/login) must
    // not trigger a full page reload to the login page — that would swallow
    // the error toast. Only hard-redirect for 401s from other endpoints.
    if (error.response?.status === 401 && !error.config?.url?.startsWith('/auth/')) {
      localStorage.removeItem('token');
      window.location.href = getLoginUrl();
    }
    return Promise.reject(error);
  }
);
