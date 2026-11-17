import axios from 'axios';

const api = axios.create({
  // The API is served from the same origin: by Vercel in production and
  // through the Vite proxy in development. VITE_API_URL can override it.
  baseURL: import.meta.env.VITE_API_URL || '/api/',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Token ${token}`;
  }
  return config;
});

// An expired or revoked token sends the user back to the sign-in page.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && localStorage.getItem('authToken')) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      window.location.assign('/login');
    }
    return Promise.reject(error);
  },
);

// Turn an axios error into something that can be shown to the user.
export function errorMessage(error, fallback = 'Something went wrong. Please try again.') {
  if (error?.response?.data?.error) return error.response.data.error;
  if (error?.response?.status === 413) return 'That file is too large. Images must be 4 MB or smaller.';
  // Vercel answers 504 itself when a function runs past its time limit.
  if (error?.response?.status === 504 || error?.code === 'ECONNABORTED') {
    return 'RGPT took too long to reply. Please try again in a minute.';
  }
  if (error?.isAxiosError && !error.response) return 'Could not reach the server. Check your connection and try again.';
  return fallback;
}

export default api;
