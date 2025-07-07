import axios from 'axios';

// Create an axios instance with default config
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://35.174.114.146',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  withCredentials: true // Enable to allow cookies to be sent with requests
});

// Add a request interceptor to handle authentication
api.interceptors.request.use(
  (config) => {
    // Get the session ID from storage
    const sessionId = localStorage.getItem('session_id');

    // If we have a session ID, add it to the Authorization header
    if (sessionId) {
      config.headers['Authorization'] = `Bearer ${sessionId}`;
    }

    // Log requests in development
    if (import.meta.env.DEV) {
      console.log(`API Request: ${config.method.toUpperCase()} ${config.url}`);
      console.log('Session ID being sent:', sessionId ? sessionId.substring(0, 8) + '...' : 'None');
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    // Log successful responses in development
    if (import.meta.env.DEV) {
      console.log('API Response:', response.status, response.config.url);
    }
    return response;
  },
  (error) => {
    // Log errors in development
    if (import.meta.env.DEV) {
      console.error('API Error:', error.response?.status, error.response?.data);
    }
    return Promise.reject(error);
  }
);

export default api;
