import axios from 'axios';

// Docker expõe o backend na 3011; local sem Docker costuma usar 3001
const baseURL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3011/api/v1';

export const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    // Não redirecionar para /login se o 401 veio da própria rota de login (senão a mensagem de erro some)
    const isAuthRequest = err.config?.url?.includes('/auth/login') || err.config?.url?.includes('/auth/register');
    if (err.response?.status === 401 && typeof window !== 'undefined' && !isAuthRequest) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
