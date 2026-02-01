import axios from 'axios';

// Extract base URL without /api/v1
const getBaseUrl = () => {
  // Import dynamically to avoid circular dependencies
  const API_BASE_URL = 'http://192.168.1.100:8000/api/v1';
  return API_BASE_URL.replace('/api/v1', '');
};

export interface ConnectionTestResult {
  success: boolean;
  message: string;
  details?: {
    backendReachable: boolean;
    responseTime?: number;
    error?: string;
  };
}

/**
 * Test if the backend server is reachable
 */
export const testBackendConnection = async (): Promise<ConnectionTestResult> => {
  const baseUrl = getBaseUrl();
  const startTime = Date.now();

  try {
    // Try to reach the backend docs endpoint (doesn't require auth)
    const response = await axios.get(`${baseUrl}/docs`, {
      timeout: 5000,
      validateStatus: () => true, // Accept any status code
    });

    const responseTime = Date.now() - startTime;

    if (response.status === 200) {
      return {
        success: true,
        message: 'Backend is reachable',
        details: {
          backendReachable: true,
          responseTime,
        },
      };
    } else {
      return {
        success: false,
        message: `Backend returned status ${response.status}`,
        details: {
          backendReachable: true,
          responseTime,
        },
      };
    }
  } catch (error: any) {
    const responseTime = Date.now() - startTime;

    if (error.code === 'ECONNABORTED') {
      return {
        success: false,
        message: 'Connection timeout - backend not responding',
        details: {
          backendReachable: false,
          responseTime,
          error: 'Timeout after 5 seconds',
        },
      };
    } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      return {
        success: false,
        message: 'Cannot reach backend server',
        details: {
          backendReachable: false,
          responseTime,
          error: 'Connection refused - check IP address and ensure backend is running with --host 0.0.0.0',
        },
      };
    } else {
      return {
        success: false,
        message: 'Network error',
        details: {
          backendReachable: false,
          responseTime,
          error: error.message || 'Unknown error',
        },
      };
    }
  }
};

/**
 * Test API endpoint connectivity (requires auth)
 */
export const testApiEndpoint = async (endpoint: string): Promise<ConnectionTestResult> => {
  const baseUrl = getBaseUrl();
  const startTime = Date.now();

  try {
    const response = await axios.get(`${baseUrl}/api/v1${endpoint}`, {
      timeout: 5000,
    });

    const responseTime = Date.now() - startTime;

    return {
      success: true,
      message: 'API endpoint is working',
      details: {
        backendReachable: true,
        responseTime,
      },
    };
  } catch (error: any) {
    const responseTime = Date.now() - startTime;

    return {
      success: false,
      message: error.response?.data?.detail || error.message || 'API endpoint failed',
      details: {
        backendReachable: !!error.response,
        responseTime,
        error: error.message,
      },
    };
  }
};

/**
 * Get current API base URL for display
 */
export const getApiBaseUrl = (): string => {
  return 'http://192.168.1.100:8000/api/v1';
};

/**
 * Get setup instructions
 */
export const getSetupInstructions = (): string => {
  return `
To connect to your backend:

1. Find your computer's IP address:
   Windows: Run 'ipconfig' in terminal
   Mac/Linux: Run 'ifconfig' in terminal

2. Start backend with:
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

3. Update mobile/shared/api/client.ts:
   Change API_BASE_URL to http://YOUR_IP:8000/api/v1

4. Ensure both devices are on the same Wi-Fi network

See SETUP-BACKEND-CONNECTION.md for detailed instructions.
  `.trim();
};
