import axios from 'axios';
import { emitSessionExpired } from '@/features/auth/sessionEvents';

const apiBaseUrl = (
  import.meta.env.VITE_API_BASE_URL || '/api/v1'
).replace(/\/+$/, '');

export const apiClient = axios.create({
  baseURL: apiBaseUrl,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      emitSessionExpired();
    }

    if (!error.response) {
      return Promise.reject(new Error('Unable to connect. Please check your internet connection and try again.'));
    }

    if (error.response.status === 400) {
      return Promise.reject(new Error('Please check the highlighted fields.'));
    }

    if (error.response.status === 429) {
      return Promise.reject(new Error('Too many submissions. Please try again later.'));
    }

    if (error.response.status >= 500) {
      return Promise.reject(new Error('Something went wrong on our side. Please try again.'));
    }

    return Promise.reject(new Error(error.response.data?.message ?? 'Please check the highlighted fields.'));
  },
);
