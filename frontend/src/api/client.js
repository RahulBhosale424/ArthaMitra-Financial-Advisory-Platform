import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({ baseURL: `${API_URL}/api` });

// Attach the JWT to every outgoing request automatically, read fresh from
// localStorage each time rather than captured once at module load — so a
// login/logout during the session is reflected on the very next request.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Centralize the "session expired" case: if the backend ever returns 401,
// the stored token is no longer valid (expired or user deactivated) — clear
// it so the app doesn't keep sending a dead token on every subsequent call.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    return Promise.reject(error);
  }
);

export { API_URL };
export default api;
