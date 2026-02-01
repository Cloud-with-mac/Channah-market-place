import { customerApiClient } from './client';

// Auth API
export const authAPI = {
  login: async (email: string, password: string) => {
    const formData = new URLSearchParams();
    formData.append('username', email);
    formData.append('password', password);

    const response = await customerApiClient.post('/auth/login', formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    if (response.data.access_token) {
      await customerApiClient.setTokens(response.data.access_token, response.data.refresh_token);
    }

    return response.data;
  },

  register: async (data: any) => {
    const response = await customerApiClient.post('/auth/register', data);
    if (response.data.access_token) {
      await customerApiClient.setTokens(response.data.access_token, response.data.refresh_token);
    }
    return response.data;
  },

  logout: async () => {
    await customerApiClient.clearTokens();
  },

  getCurrentUser: async () => {
    const response = await customerApiClient.get('/auth/me');
    return response.data;
  },

  forgotPassword: async (email: string) => {
    const response = await customerApiClient.post('/auth/password-reset', { email });
    return response.data;
  },
};

// Products API
export const productsAPI = {
  getAll: async (params?: any) => {
    const response = await customerApiClient.get('/products', { params });
    return response.data;
  },

  getBySlug: async (slug: string) => {
    const response = await customerApiClient.get(`/products/${slug}`);
    return response.data;
  },

  getFeatured: async () => {
    const response = await customerApiClient.get('/products/featured');
    return response.data;
  },

  getNewArrivals: async () => {
    const response = await customerApiClient.get('/products/new-arrivals');
    return response.data;
  },

  getBestSellers: async () => {
    const response = await customerApiClient.get('/products/best-sellers');
    return response.data;
  },

  search: async (query: string, params?: any) => {
    const response = await customerApiClient.get('/search', {
      params: { q: query, ...params },
    });
    return response.data;
  },
};

// Categories API
export const categoriesAPI = {
  getAll: async () => {
    const response = await customerApiClient.get('/categories');
    return response.data;
  },

  getById: async (id: string) => {
    const response = await customerApiClient.get(`/categories/${id}`);
    return response.data;
  },
};

// Cart API
export const cartAPI = {
  get: async () => {
    const response = await customerApiClient.get('/cart');
    return response.data;
  },

  addItem: async (productId: string, quantity: number, variantId?: string) => {
    const response = await customerApiClient.post('/cart/items', {
      product_id: productId,
      quantity,
      variant_id: variantId,
    });
    return response.data;
  },

  updateItem: async (itemId: string, quantity: number) => {
    const response = await customerApiClient.put(`/cart/items/${itemId}`, { quantity });
    return response.data;
  },

  removeItem: async (itemId: string) => {
    const response = await customerApiClient.delete(`/cart/items/${itemId}`);
    return response.data;
  },

  clear: async () => {
    const response = await customerApiClient.delete('/cart');
    return response.data;
  },

  applyCoupon: async (code: string) => {
    const response = await customerApiClient.post('/cart/coupon', { code });
    return response.data;
  },

  removeCoupon: async () => {
    const response = await customerApiClient.delete('/cart/coupon');
    return response.data;
  },
};

// Wishlist API
export const wishlistAPI = {
  get: async () => {
    const response = await customerApiClient.get('/users/me/wishlist');
    return response.data;
  },

  add: async (productId: string) => {
    const response = await customerApiClient.post('/users/me/wishlist', { product_id: productId });
    return response.data;
  },

  remove: async (productId: string) => {
    const response = await customerApiClient.delete(`/users/me/wishlist/${productId}`);
    return response.data;
  },
};

// Orders API
export const ordersAPI = {
  list: async (params?: any) => {
    const response = await customerApiClient.get('/orders', { params });
    return response.data;
  },

  getByNumber: async (orderNumber: string) => {
    const response = await customerApiClient.get(`/orders/${orderNumber}`);
    return response.data;
  },

  create: async (data: any) => {
    const response = await customerApiClient.post('/orders', data);
    return response.data;
  },

  cancel: async (orderNumber: string) => {
    const response = await customerApiClient.post(`/orders/${orderNumber}/cancel`);
    return response.data;
  },

  trackOrder: async (orderNumber: string) => {
    const response = await customerApiClient.get(`/orders/${orderNumber}/tracking`);
    return response.data;
  },
};

// Addresses API
export const addressesAPI = {
  getAll: async () => {
    const response = await customerApiClient.get('/addresses');
    return response.data;
  },

  create: async (data: any) => {
    const response = await customerApiClient.post('/addresses', data);
    return response.data;
  },

  update: async (id: string, data: any) => {
    const response = await customerApiClient.put(`/addresses/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await customerApiClient.delete(`/addresses/${id}`);
    return response.data;
  },

  setDefaultShipping: async (id: string) => {
    const response = await customerApiClient.put(`/addresses/${id}/default-shipping`);
    return response.data;
  },
};

// Reviews API
export const reviewsAPI = {
  getProductReviews: async (productId: string) => {
    const response = await customerApiClient.get(`/reviews/product/${productId}`);
    return response.data;
  },

  create: async (data: any) => {
    const response = await customerApiClient.post('/reviews', data);
    return response.data;
  },

  update: async (id: string, data: any) => {
    const response = await customerApiClient.put(`/reviews/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await customerApiClient.delete(`/reviews/${id}`);
    return response.data;
  },
};

// Notifications API
export const notificationsAPI = {
  getAll: async () => {
    const response = await customerApiClient.get('/notifications');
    return response.data;
  },

  markAsRead: async (id: string) => {
    const response = await customerApiClient.put(`/notifications/${id}/read`);
    return response.data;
  },

  markAllAsRead: async () => {
    const response = await customerApiClient.put('/notifications/read-all');
    return response.data;
  },
};

// Messaging API
export const messagingAPI = {
  getConversations: async () => {
    const response = await customerApiClient.get('/chats');
    return response.data;
  },

  getMessages: async (conversationId: string) => {
    const response = await customerApiClient.get(`/chats/${conversationId}/messages`);
    return response.data;
  },

  sendMessage: async (conversationId: string, content: string) => {
    const response = await customerApiClient.post(`/chats/${conversationId}/messages`, { content });
    return response.data;
  },

  startConversation: async (vendorId: string, message: string) => {
    const response = await customerApiClient.post('/chats', {
      vendor_id: vendorId,
      initial_message: message,
    });
    return response.data;
  },
};

// Vendors API
export const vendorsAPI = {
  getAll: async (params?: any) => {
    const response = await customerApiClient.get('/vendors', { params });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await customerApiClient.get(`/vendors/${id}`);
    return response.data;
  },

  getProducts: async (id: string) => {
    const response = await customerApiClient.get(`/vendors/${id}/products`);
    return response.data;
  },
};

// Payments API
export const paymentsAPI = {
  getPaymentMethods: async () => {
    const response = await customerApiClient.get('/payments/methods');
    return response.data;
  },

  createPaymentIntent: async (orderId: string, paymentMethod: string) => {
    const response = await customerApiClient.post('/payments/create-intent', {
      order_id: orderId,
      payment_method: paymentMethod,
    });
    return response.data;
  },

  confirmPayment: async (paymentIntentId: string) => {
    const response = await customerApiClient.post('/payments/confirm', {
      payment_intent_id: paymentIntentId,
    });
    return response.data;
  },
};

// Profile API (extended auth operations)
export const profileAPI = {
  changePassword: async (data: { current_password: string; new_password: string }) => {
    const response = await customerApiClient.post('/auth/change-password', data);
    return response.data;
  },

  updateProfile: async (data: any) => {
    const response = await customerApiClient.put('/users/me', data);
    return response.data;
  },

  deleteAccount: async () => {
    const response = await customerApiClient.delete('/users/me');
    return response.data;
  },
};

// Contact API
export const contactAPI = {
  submit: async (data: { name: string; email: string; subject: string; message: string }) => {
    const response = await customerApiClient.post('/contact', data);
    return response.data;
  },
};

// AI API
export const aiAPI = {
  chat: async (message: string, conversationId?: string) => {
    const response = await customerApiClient.post('/ai/chat', {
      content: message,
      conversation_id: conversationId,
    });
    return response.data;
  },

  getRecommendations: async (productId?: string, categoryId?: string, limit?: number) => {
    const response = await customerApiClient.post('/ai/recommendations', {
      product_id: productId,
      category_id: categoryId,
      limit,
    });
    return response.data;
  },

  searchSuggestions: async (query: string) => {
    const response = await customerApiClient.post('/ai/search-suggestions', { query });
    return response.data;
  },
};
