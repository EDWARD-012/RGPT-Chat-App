import axios from 'axios';

// Create an instance of axios
const api = axios.create({
  // Use the new, live backend URL
  baseURL: 'https://rgpt-backend-b6qe.onrender.com/api/', 
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
