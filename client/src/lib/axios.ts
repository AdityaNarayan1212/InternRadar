import axios from 'axios';

const configuredApiUrl = import.meta.env.VITE_API_URL?.trim();

const api = axios.create({
  baseURL: configuredApiUrl || (import.meta.env.DEV ? 'http://localhost:5000/api' : undefined),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token to every request automatically
api.interceptors.request.use((config) => {
  if (import.meta.env.PROD && !configuredApiUrl) {
    throw new Error('VITE_API_URL must be configured to use the API in production.');
  }
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 (unauthorized) globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isLoginRequest = /(?:^|\/)auth\/(?:login|register)(?:[?#]|$)/.test(
      error.config?.url ?? ''
    );
    if (error.response?.status === 401 && !isLoginRequest) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;