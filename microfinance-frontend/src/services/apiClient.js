import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL, // Adjust this to your backend URL
  headers: {
    'Content-Type': 'application/json',
  },
});

// You can add interceptors for handling tokens or errors globally
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token'); // Or however you store the token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default apiClient;

