import axios from 'axios';
import { getToken, destroyToken } from '../utils/tokenStorage';

const client = axios.create({
  baseURL: 'https://api.realworld.show/api',
});

// Interceptor 1 — inject JWT token into every request
client.interceptors.request.use(config => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Token ${token}`;
  }
  return config;
});

// Interceptor 2 — global 401 handler
// Fires a custom event so AuthProvider can update its state cleanly,
// rather than doing a hard window.location redirect here.
client.interceptors.response.use(
  response => response,
  (error: unknown) => {
    if (axios.isAxiosError(error)) {
      // 401 on any endpoint except /user (which is used to validate the token on startup)
      const url = error.config?.url ?? '';
      if (error.response?.status === 401 && !url.endsWith('/user')) {
        destroyToken();
        window.dispatchEvent(new CustomEvent('conduit:logout'));
      }
    }
    return Promise.reject(error);
  },
);

export default client;
