import { vendorApiClient } from './client';

// Auth API
export const authAPI = {
  login: async (email: string, password: string) => {
    const formData = new URLSearchParams();
    formData.append('username', email);
    formData.append('password', password);

    const response = await vendorApiClient.post('/auth/login', formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    if (response.data.access_token) {
      await vendorApiClient.setTokens(response.data.access_token, response.data.refresh_token);
    }

    return response.data;
  },

  logout: async () => {
    await vendorApiClient.clearTokens();
  },

  getCurrentUser: async () => {
    const response = await vendorApiClient.get('/auth/me');
    return response.data;
  },
};

// Dashboard API
export const dashboardAPI = {
  getStats: async () => {
    const response = await vendorApiClient.get('/vendors/me/dashboard');
    return response.data;
  },

  getRevenueChart: async (days: number = 30) => {
    const response = await vendorApiClient.get('/vendors/me/revenue-chart', {
      params: { days },
    });
    return response.data;
  },

  getTopProducts: async (limit: number = 5) => {
    const response = await vendorApiClient.get('/vendors/me/top-products', {
      params: { limit },
    });
    return response.data;
  },
};

// Products API
export const productsAPI = {
  list: async (params?: any) => {
    const response = await vendorApiClient.get('/vendors/me/products', { params });
    return response.data;
  },

  get: async (id: string) => {
    const response = await vendorApiClient.get(`/vendors/me/products/${id}`);
    return response.data;
  },

  create: async (data: any) => {
    const response = await vendorApiClient.post('/vendors/me/products', data);
    return response.data;
  },

  update: async (id: string, data: any) => {
    const response = await vendorApiClient.put(`/vendors/me/products/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await vendorApiClient.delete(`/vendors/me/products/${id}`);
    return response.data;
  },

  updateStatus: async (id: string, status: string) => {
    const response = await vendorApiClient.put(`/vendors/me/products/${id}/status`, { status });
    return response.data;
  },
};

// Orders API
export const ordersAPI = {
  list: async (params?: any) => {
    const response = await vendorApiClient.get('/vendors/me/orders', { params });
    return response.data;
  },

  get: async (id: string) => {
    const response = await vendorApiClient.get(`/vendors/me/orders/${id}`);
    return response.data;
  },

  updateStatus: async (id: string, status: string) => {
    const response = await vendorApiClient.put(`/vendors/me/orders/${id}/status`, { status });
    return response.data;
  },

  addTracking: async (id: string, trackingNumber: string, carrier: string) => {
    const response = await vendorApiClient.post(`/vendors/me/orders/${id}/tracking`, {
      tracking_number: trackingNumber,
      carrier,
    });
    return response.data;
  },
};

// Analytics API
export const analyticsAPI = {
  getSales: async (period: string = '30d') => {
    const response = await vendorApiClient.get('/vendors/me/analytics/sales', {
      params: { period },
    });
    return response.data;
  },

  getCustomerInsights: async () => {
    const response = await vendorApiClient.get('/vendors/me/analytics/customers');
    return response.data;
  },
};

// Payouts API
export const payoutsAPI = {
  list: async (params?: any) => {
    const response = await vendorApiClient.get('/vendors/me/payouts', { params });
    return response.data;
  },

  getBalance: async () => {
    const response = await vendorApiClient.get('/vendors/me/balance');
    return response.data;
  },

  requestPayout: async () => {
    const response = await vendorApiClient.post('/vendors/me/payouts');
    return response.data;
  },
};

// Reviews API
export const reviewsAPI = {
  list: async (params?: any) => {
    const response = await vendorApiClient.get('/vendors/me/reviews', { params });
    return response.data;
  },

  respond: async (id: string, responseText: string) => {
    const response = await vendorApiClient.post(`/reviews/${id}/respond`, {
      response: responseText,
    });
    return response.data;
  },
};

// Settings API
export const settingsAPI = {
  getProfile: async () => {
    const response = await vendorApiClient.get('/vendors/me');
    return response.data;
  },

  updateProfile: async (data: any) => {
    const response = await vendorApiClient.put('/vendors/me', data);
    return response.data;
  },

  getPaymentSettings: async () => {
    const response = await vendorApiClient.get('/vendors/me/payment-settings');
    return response.data;
  },

  updatePaymentSettings: async (data: any) => {
    const response = await vendorApiClient.put('/vendors/me/payment-settings', data);
    return response.data;
  },

  getNotificationSettings: async () => {
    const response = await vendorApiClient.get('/vendors/me/notification-settings');
    return response.data;
  },

  updateNotificationSettings: async (data: any) => {
    const response = await vendorApiClient.put('/vendors/me/notification-settings', data);
    return response.data;
  },
};

// Notifications API
export const notificationsAPI = {
  getAll: async () => {
    const response = await vendorApiClient.get('/notifications');
    return response.data;
  },

  markAsRead: async (id: string) => {
    const response = await vendorApiClient.put(`/notifications/${id}/read`);
    return response.data;
  },
};
