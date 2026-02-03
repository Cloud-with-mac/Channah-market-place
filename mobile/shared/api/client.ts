import axios, { AxiosInstance, AxiosError } from 'axios';
import * as SecureStore from 'expo-secure-store';
import NetInfo from '@react-native-community/netinfo';

// Set EXPO_PUBLIC_API_URL in your .env file to point to your backend
// For Android emulator use 10.0.2.2, for physical devices use your machine's IP
// WARNING: The default URL uses HTTP which is insecure. In production, always use HTTPS.
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:8000/api/v1';

export interface ApiError {
  message: string;
  statusCode?: number;
  errors?: Record<string, string[]>;
}

// Network connectivity check
async function checkNetworkConnection(): Promise<boolean> {
  try {
    const state = await NetInfo.fetch();
    return state.isConnected && state.isInternetReachable !== false;
  } catch (error) {
    return false; // Assume offline if check fails
  }
}

// Global auth expiry callback — set by the auth store to handle logout on token expiry
let onAuthExpired: (() => void) | null = null;
export const setOnAuthExpired = (callback: (() => void) | null) => {
  onAuthExpired = callback;
};

class ApiClient {
  private client: AxiosInstance;
  private tokenPrefix: string;
  private isRefreshing = false;
  private refreshSubscribers: ((token: string) => void)[] = [];

  private onTokenRefreshed(token: string) {
    this.refreshSubscribers.forEach(cb => cb(token));
    this.refreshSubscribers = [];
  }

  private addRefreshSubscriber(callback: (token: string) => void) {
    this.refreshSubscribers.push(callback);
  }

  constructor(tokenPrefix: 'customer' | 'vendor' = 'customer') {
    this.tokenPrefix = tokenPrefix;

    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to check network and add auth token
    this.client.interceptors.request.use(
      async (config) => {
        // NETWORK CHECK: Verify connectivity before making request
        const isOnline = await checkNetworkConnection();
        if (!isOnline) {
          return Promise.reject({
            message: 'No internet connection. Please check your network settings.',
            statusCode: 0, // Custom code for network error
            isNetworkError: true,
          });
        }

        // Add auth token if available
        try {
          const token = await SecureStore.getItemAsync(`${this.tokenPrefix}_access_token`);
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        } catch {
          // SecureStore may fail on some platforms — continue without token
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling and token refresh
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest: any = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          // If already refreshing, queue this request to retry after refresh completes
          if (this.isRefreshing) {
            return new Promise((resolve) => {
              this.addRefreshSubscriber((newToken: string) => {
                originalRequest.headers.Authorization = `Bearer ${newToken}`;
                resolve(this.client(originalRequest));
              });
            });
          }

          this.isRefreshing = true;

          try {
            const refreshToken = await SecureStore.getItemAsync(`${this.tokenPrefix}_refresh_token`);

            if (refreshToken) {
              const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
                refresh_token: refreshToken,
              });

              const { access_token, refresh_token: newRefreshToken } = response.data;
              if (access_token) {
                await SecureStore.setItemAsync(`${this.tokenPrefix}_access_token`, access_token);
              }
              if (newRefreshToken) {
                await SecureStore.setItemAsync(`${this.tokenPrefix}_refresh_token`, newRefreshToken);
              }

              this.isRefreshing = false;
              this.onTokenRefreshed(access_token);

              originalRequest.headers.Authorization = `Bearer ${access_token}`;
              return this.client(originalRequest);
            }
          } catch (refreshError) {
            this.isRefreshing = false;
            this.refreshSubscribers = [];
            await this.clearTokens();
            if (onAuthExpired) onAuthExpired();
            return Promise.reject(refreshError);
          }

          // No refresh token — session expired
          this.isRefreshing = false;
          this.refreshSubscribers = [];
          await this.clearTokens();
          if (onAuthExpired) onAuthExpired();
        }

        return Promise.reject(this.handleError(error));
      }
    );
  }

  private handleError(error: AxiosError): ApiError {
    if (error.response) {
      const data: any = error.response.data;
      let message = data.detail || data.message || 'An error occurred';
      if (Array.isArray(message)) {
        message = message.map((m: any) => (typeof m === 'string' ? m : m.msg || JSON.stringify(m))).join(', ');
      } else if (typeof message !== 'string') {
        message = JSON.stringify(message);
      }
      return {
        message,
        statusCode: error.response.status,
        errors: data.errors,
      };
    } else if (error.request) {
      return {
        message: 'No response from server. Please check your connection.',
      };
    } else {
      return {
        message: error.message || 'An unexpected error occurred',
      };
    }
  }

  async setTokens(accessToken: string, refreshToken: string) {
    await SecureStore.setItemAsync(`${this.tokenPrefix}_access_token`, accessToken);
    await SecureStore.setItemAsync(`${this.tokenPrefix}_refresh_token`, refreshToken);
  }

  async clearTokens() {
    await SecureStore.deleteItemAsync(`${this.tokenPrefix}_access_token`);
    await SecureStore.deleteItemAsync(`${this.tokenPrefix}_refresh_token`);
  }

  async getAccessToken() {
    return await SecureStore.getItemAsync(`${this.tokenPrefix}_access_token`);
  }

  get<T = any>(url: string, config?: any) {
    return this.client.get<T>(url, config);
  }

  post<T = any>(url: string, data?: any, config?: any) {
    return this.client.post<T>(url, data, config);
  }

  put<T = any>(url: string, data?: any, config?: any) {
    return this.client.put<T>(url, data, config);
  }

  delete<T = any>(url: string, config?: any) {
    return this.client.delete<T>(url, config);
  }

  patch<T = any>(url: string, data?: any, config?: any) {
    return this.client.patch<T>(url, data, config);
  }
}

export const customerApiClient = new ApiClient('customer');
export const vendorApiClient = new ApiClient('vendor');
export default ApiClient;
