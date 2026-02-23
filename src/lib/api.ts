import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { ApiError } from '@/types/api';
import { useAuthStore } from '@/store/authStore';

// Use proxy in development, direct URL in production
const API_BASE_URL = import.meta.env.DEV
  ? '/api'
  : (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000');

if (import.meta.env.DEV) {
  console.log('🔧 API Configuration:', {
    mode: import.meta.env.MODE,
    API_BASE_URL,
  });
}

// Create axios instance with default config
export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Refresh lock: only one refresh in flight; others wait on this promise
let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const state = useAuthStore.getState();
  const { refreshToken, setTokens, clearTokens } = state;
  if (!refreshToken) return null;
  try {
    const { data } = await axios.post<{
      accessToken: string;
      refreshToken?: string;
      expiresIn?: number;
    }>(
      `${API_BASE_URL}/auth/refresh`,
      { refreshToken },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000,
      }
    );
    const expiresIn = data.expiresIn ?? 900;
    setTokens(data.accessToken, data.refreshToken ?? refreshToken, expiresIn);
    return data.accessToken;
  } catch {
    clearTokens();
    return null;
  }
}

async function ensureValidAccessToken(): Promise<string | null> {
  const state = useAuthStore.getState();
  if (!state.accessToken) return null;
  if (!state.shouldRefreshAccessToken()) return state.accessToken;
  if (refreshPromise) return refreshPromise;
  refreshPromise = refreshAccessToken().finally(() => {
    refreshPromise = null;
  });
  return refreshPromise;
}

// Request interceptor: use access token from auth store; refresh proactively if needed
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // Skip auth for login and refresh
    if (config.url === 'auth/login' || config.url === 'auth/refresh') {
      if (import.meta.env.DEV) {
        console.log('📤 Request:', config.method?.toUpperCase(), config.url);
      }
      return config;
    }
    const token = await ensureValidAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (import.meta.env.DEV) {
      console.log('📤 Request:', config.method?.toUpperCase(), config.url, {
        hasAuth: !!config.headers.Authorization,
      });
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: on 401 try refresh and retry; else reject with ApiError
apiClient.interceptors.response.use(
  (response) => {
    if (import.meta.env.DEV) {
      console.log('✅ Response:', response.status, response.config.url);
    }
    return response;
  },
  async (error: AxiosError<ApiError>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;
      const newToken = await refreshAccessToken();
      if (newToken) {
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(originalRequest);
      }
      useAuthStore.getState().clearTokens();
      window.location.hash = '#/auth/login';
      return Promise.reject({
        statusCode: 401,
        message: 'Sessão expirada. Faça login novamente.',
        error: 'UNAUTHORIZED',
      });
    }

    if (import.meta.env.DEV) {
      console.error('❌ API Error:', {
        status: error.response?.status,
        url: error.config?.url,
        message: error.response?.data?.message || error.message,
      });
    }

    if (error.response) {
      const apiError: ApiError = {
        statusCode: error.response.status,
        message: error.response.data?.message || error.message,
        error: error.response.data?.error,
      };
      return Promise.reject(apiError);
    }
    if (error.request) {
      return Promise.reject({
        statusCode: 0,
        message: 'Network error - please check your connection',
        error: 'NETWORK_ERROR',
      });
    }
    return Promise.reject({
      statusCode: 0,
      message: error.message,
      error: 'REQUEST_ERROR',
    });
  }
);

export default apiClient;
