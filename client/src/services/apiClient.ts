import axios from 'axios';
import { Platform } from 'react-native';

const getApiUrl = () => {
  if (Platform.OS === 'android') {
    // 10.0.2.2 is the special alias for localhost on Android Emulators
    // return 'http://10.0.2.2:3000/api'; 
  }
  // This uses your Wifi IP so it works with physical devices and Expo Go
  return 'http://10.167.57.119:3000/api';
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