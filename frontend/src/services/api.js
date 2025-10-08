import axios from 'axios';

// Create an instance of axios
const api = axios.create({
  baseURL: 'http://127.0.0.1:8000/api/', // Your Django backend URL
});

// Add a request interceptor to include the auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers['Authorization'] = `Token ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;