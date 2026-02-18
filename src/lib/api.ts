import axios, { AxiosInstance, AxiosError } from 'axios';
import { ApiError } from '@/types/api';

// Use proxy in development, direct URL in production
const API_BASE_URL = import.meta.env.DEV 
  ? '/api' 
  : (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000');

// Debug: Log the API base URL to verify it's correct
console.log('🔧 API Configuration:', {
  mode: import.meta.env.MODE,
  isDev: import.meta.env.DEV,
  VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
  API_BASE_URL,
});

// Create axios instance with default config
export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Add API key in Bearer token format
    const apiKey = import.meta.env.VITE_API_KEY;
    if (apiKey) {
      config.headers.Authorization = `Bearer ${apiKey}`;
    }
    console.log('📤 Request:', config.method?.toUpperCase(), config.url, {
      fullUrl: `${API_BASE_URL}${config.url}`,
      hasAuth: !!config.headers.Authorization
    });
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    console.log('✅ Response:', response.status, response.config.url);
    return response;
  },
  (error: AxiosError<ApiError>) => {
    console.error('❌ API Error:', {
      status: error.response?.status,
      url: error.config?.url,
      message: error.response?.data?.message || error.message,
      data: error.response?.data,
      headers: error.config?.headers
    });
    
    if (error.response) {
      // Server responded with error status
      const apiError: ApiError = {
        statusCode: error.response.status,
        message: error.response.data?.message || error.message,
        error: error.response.data?.error,
      };
      return Promise.reject(apiError);
    } else if (error.request) {
      // Request made but no response received
      console.error('Network Error:', error.message);
      return Promise.reject({
        statusCode: 0,
        message: 'Network error - please check your connection',
        error: 'NETWORK_ERROR',
      });
    } else {
      // Something else happened
      console.error('Request Error:', error.message);
      return Promise.reject({
        statusCode: 0,
        message: error.message,
        error: 'REQUEST_ERROR',
      });
    }
  }
);

export default apiClient;
