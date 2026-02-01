import axios, { AxiosInstance, AxiosError } from 'axios';
import * as SecureStore from 'expo-secure-store';

// Change this to your backend URL
// For local development: use your computer's local IP address (not localhost)
// localhost won't work on physical devices - use your machine's IP instead
// Example: 'http://192.168.1.100:8000/api/v1'
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.39.14.63:8000/api/v1';

export interface ApiError {
  message: string;
  statusCode?: number;
  errors?: Record<string, string[]>;
}

class ApiClient {
  private client: AxiosInstance;
  private tokenPrefix: string;

  constructor(tokenPrefix: 'customer' | 'vendor' = 'customer') {
    this.tokenPrefix = tokenPrefix;

    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      async (config) => {
        const token = await SecureStore.getItemAsync(`${this.tokenPrefix}_access_token`);
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
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

          try {
            const refreshToken = await SecureStore.getItemAsync(`${this.tokenPrefix}_refresh_token`);

            if (refreshToken) {
              const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
                refresh_token: refreshToken,
              });

              const { access_token } = response.data;
              await SecureStore.setItemAsync(`${this.tokenPrefix}_access_token`, access_token);

              originalRequest.headers.Authorization = `Bearer ${access_token}`;
              return this.client(originalRequest);
            }
          } catch (refreshError) {
            await this.clearTokens();
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(this.handleError(error));
      }
    );
  }

  private handleError(error: AxiosError): ApiError {
    if (error.response) {
      const data: any = error.response.data;
      return {
        message: data.detail || data.message || 'An error occurred',
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
