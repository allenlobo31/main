import axios from 'axios';

const getApiUrl = () => {
  // Use environment variable if set, otherwise default to the deployed Render URL
  if (process.env.API_URL) {
    return `${process.env.API_URL}/api`;
  }
  // Default: deployed backend on Render
  return 'https://herniacare.onrender.com/api';
};

const API_URL = getApiUrl();

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const setAuthToken = (token: string | null | undefined) => {
  if (token) {
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete apiClient.defaults.headers.common['Authorization'];
  }
};

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // If the server returns 401 Unauthorized, automatically log the user out
    if (error.response && error.response.status === 401) {
      // Lazy require to avoid circular dependency
      const { useAuthStore } = require('../store/authStore');
      useAuthStore.getState().logout().catch(() => {});
    }
    return Promise.reject(error);
  }
);

export default apiClient;