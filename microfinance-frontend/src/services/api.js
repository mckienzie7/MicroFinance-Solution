import axios from 'axios';

// Create an axios instance with default config
const api = axios.create({
  // Use the Vite proxy which will handle CORS issues
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json'
    
  },
  withCredentials: true // Enable sending cookies for cross-domain requests
  
});

// Add a request interceptor to handle authentication
api.interceptors.request.use(
  (config) => {
    // Log requests in development
    if (import.meta.env.DEV) {
      console.log(`API Request: ${config.method.toUpperCase()} ${config.url}`);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle common errors
api.interceptors.response.use(
  (response) => {
    // Log successful responses in development
    if (import.meta.env.DEV) {
      console.log(`API Response: ${response.status} ${response.config.url}`);
    }
    return response;
  },
  (error) => {
    const { response } = error;
    
    // Log errors in development
    if (import.meta.env.DEV) {
      console.error('API Error:', error.message, response?.status, response?.data);
    }
    
    // Handle authentication errors
    if (response && response.status === 401) {
      // Clear user and session from sessionStorage
      // Clear user and session from sessionStorage
      sessionStorage.removeItem('user');
      sessionStorage.removeItem('session_id');
      sessionStorage.removeItem('session_id');
      
      // Only redirect if we're not already on the login page
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login?session=expired';
      }
    }
    
    // Handle server errors
    if (response && response.status >= 500) {
      console.error('Server error:', response.status, response.data);
    }
    
    return Promise.reject(error);
  }
);

export default api;
