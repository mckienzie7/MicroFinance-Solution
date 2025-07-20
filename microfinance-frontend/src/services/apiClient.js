import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL, // Adjust this to your backend URL
  headers: {
    'Content-Type': 'application/json',
  },
});

// You can add interceptors for handling tokens or errors globally
apiClient.interceptors.request.use((config) => {
  const sessionId = localStorage.getItem('session_id'); // Use session_id for consistency
  if (sessionId) {
    config.headers.Authorization = `Bearer ${sessionId}`;
  }
  return config;
});

export default apiClient;

