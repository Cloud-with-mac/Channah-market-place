import axios, { AxiosInstance, AxiosRequestConfig } from 'axios'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
})

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // If token expired, try to refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        const refreshToken = localStorage.getItem('refresh_token')
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refresh_token: refreshToken,
          })

          const { access_token } = response.data
          localStorage.setItem('access_token', access_token)

          originalRequest.headers.Authorization = `Bearer ${access_token}`
          return apiClient(originalRequest)
        }
      } catch (refreshError) {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        window.location.href = '/login'
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

// ==================== AUTH API ====================
export const authAPI = {
  register: async (data: any) => {
    const response = await apiClient.post('/auth/register', data)
    return response.data
  },

  login: async (email: string, password: string) => {
    const formData = new URLSearchParams()
    formData.append('username', email)
    formData.append('password', password)

    const response = await apiClient.post('/auth/login', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    })

    if (response.data.access_token) {
      localStorage.setItem('access_token', response.data.access_token)
      localStorage.setItem('refresh_token', response.data.refresh_token)
    }

    return response.data
  },

  logout: async () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
  },

  getCurrentUser: async () => {
    const response = await apiClient.get('/users/me')
    return response.data
  },

  updateProfile: async (data: any) => {
    const response = await apiClient.put('/users/me', data)
    return response.data
  },

  changePassword: async (data: any) => {
    const response = await apiClient.post('/auth/change-password', data)
    return response.data
  },

  forgotPassword: async (email: string) => {
    const response = await apiClient.post('/auth/forgot-password', { email })
    return response.data
  },

  resetPassword: async (token: string, password: string) => {
    const response = await apiClient.post('/auth/reset-password', { token, password })
    return response.data
  },
}

// ==================== PRODUCTS API ====================
export const productsAPI = {
  getAll: async (params?: any) => {
    const response = await apiClient.get('/products', { params })
    return response.data
  },

  getById: async (id: string) => {
    const response = await apiClient.get(`/products/${id}`)
    return response.data
  },

  getBySlug: async (slug: string) => {
    const response = await apiClient.get(`/products/slug/${slug}`)
    return response.data
  },

  search: async (query: string, params?: any) => {
    const response = await apiClient.get('/search', { params: { q: query, ...params } })
    return response.data
  },

  getRecommendations: async (productId?: string, categoryId?: string) => {
    const response = await apiClient.post('/ai/recommendations', {
      product_id: productId,
      category_id: categoryId,
    })
    return response.data
  },

  getFilters: async (categorySlug: string) => {
    const response = await apiClient.get(`/products/filters/${categorySlug}`)
    return response.data
  },
}

// ==================== CATEGORIES API ====================
export const categoriesAPI = {
  getAll: async () => {
    const response = await apiClient.get('/categories')
    return response.data
  },

  getById: async (id: string) => {
    const response = await apiClient.get(`/categories/${id}`)
    return response.data
  },

  getBySlug: async (slug: string) => {
    const response = await apiClient.get(`/categories/${slug}`)
    return response.data
  },

  getFeatured: async (limit: number = 8) => {
    const response = await apiClient.get('/categories/featured', {
      params: { limit }
    })
    return response.data
  },
}

// ==================== CART API ====================
export const cartAPI = {
  get: async () => {
    const response = await apiClient.get('/cart')
    return response.data
  },

  addItem: async (productId: string, quantity: number = 1, variantId?: string) => {
    const response = await apiClient.post('/cart/items', {
      product_id: productId,
      quantity,
      variant_id: variantId,
    })
    return response.data
  },

  updateItem: async (itemId: string, quantity: number) => {
    const response = await apiClient.put(`/cart/items/${itemId}`, { quantity })
    return response.data
  },

  removeItem: async (itemId: string) => {
    const response = await apiClient.delete(`/cart/items/${itemId}`)
    return response.data
  },

  clear: async () => {
    const response = await apiClient.delete('/cart')
    return response.data
  },
}

// ==================== WISHLIST API ====================
export const wishlistAPI = {
  get: async () => {
    const response = await apiClient.get('/users/me/wishlist')
    return response.data
  },

  add: async (productId: string) => {
    const response = await apiClient.post('/users/me/wishlist', { product_id: productId })
    return response.data
  },

  remove: async (productId: string) => {
    const response = await apiClient.delete(`/users/me/wishlist/${productId}`)
    return response.data
  },
}

// ==================== ORDERS API ====================
export const ordersAPI = {
  getAll: async (params?: any) => {
    const response = await apiClient.get('/orders', { params })
    return response.data
  },

  getById: async (id: string) => {
    const response = await apiClient.get(`/orders/${id}`)
    return response.data
  },

  getByOrderNumber: async (orderNumber: string) => {
    const response = await apiClient.get(`/orders/number/${orderNumber}`)
    return response.data
  },

  create: async (data: any) => {
    const response = await apiClient.post('/orders', data)
    return response.data
  },

  cancel: async (id: string) => {
    const response = await apiClient.post(`/orders/${id}/cancel`)
    return response.data
  },

  trackOrder: async (orderNumber: string) => {
    const response = await apiClient.get(`/orders/${orderNumber}/track`)
    return response.data
  },
}

// ==================== ADDRESSES API ====================
export const addressesAPI = {
  getAll: async () => {
    const response = await apiClient.get('/addresses')
    return response.data
  },

  getById: async (id: string) => {
    const response = await apiClient.get(`/addresses/${id}`)
    return response.data
  },

  create: async (data: any) => {
    const response = await apiClient.post('/addresses', data)
    return response.data
  },

  update: async (id: string, data: any) => {
    const response = await apiClient.put(`/addresses/${id}`, data)
    return response.data
  },

  delete: async (id: string) => {
    const response = await apiClient.delete(`/addresses/${id}`)
    return response.data
  },

  setDefault: async (id: string) => {
    const response = await apiClient.post(`/addresses/${id}/set-default`)
    return response.data
  },
}

// ==================== REVIEWS API ====================
export const reviewsAPI = {
  getByProduct: async (productId: string, params?: any) => {
    const response = await apiClient.get(`/products/${productId}/reviews`, { params })
    return response.data
  },

  create: async (data: any) => {
    const response = await apiClient.post('/reviews', data)
    return response.data
  },

  update: async (id: string, data: any) => {
    const response = await apiClient.put(`/reviews/${id}`, data)
    return response.data
  },

  delete: async (id: string) => {
    const response = await apiClient.delete(`/reviews/${id}`)
    return response.data
  },

  helpful: async (id: string) => {
    const response = await apiClient.post(`/reviews/${id}/helpful`)
    return response.data
  },
}

// ==================== PAYMENTS API ====================
export const paymentsAPI = {
  createPaymentIntent: async (orderId: string, paymentMethod: string) => {
    const response = await apiClient.post('/payments/create-intent', {
      order_id: orderId,
      payment_method: paymentMethod,
    })
    return response.data
  },

  confirmPayment: async (paymentIntentId: string) => {
    const response = await apiClient.post('/payments/confirm', {
      payment_intent_id: paymentIntentId,
    })
    return response.data
  },

  getPaymentMethods: async () => {
    const response = await apiClient.get('/payments/methods')
    return response.data
  },
}

// ==================== NOTIFICATIONS API ====================
export const notificationsAPI = {
  getAll: async (params?: any) => {
    const response = await apiClient.get('/notifications', { params })
    return response.data
  },

  markAsRead: async (id: string) => {
    const response = await apiClient.put(`/notifications/${id}/read`)
    return response.data
  },

  markAllAsRead: async () => {
    const response = await apiClient.put('/notifications/read-all')
    return response.data
  },

  delete: async (id: string) => {
    const response = await apiClient.delete(`/notifications/${id}`)
    return response.data
  },
}

// ==================== AI API ====================
export const aiAPI = {
  chat: async (message: string, conversationId?: string) => {
    const response = await apiClient.post('/ai/chat', {
      content: message,
      conversation_id: conversationId,
    })
    return response.data
  },

  getRecommendations: async (productId?: string, categoryId?: string) => {
    const response = await apiClient.post('/ai/recommendations', {
      product_id: productId,
      category_id: categoryId,
    })
    return response.data
  },

  searchSuggestions: async (query: string) => {
    const response = await apiClient.post('/ai/search-suggestions', { query })
    return response.data
  },

  analyzeImage: async (file: File) => {
    const formData = new FormData()
    formData.append('image', file)

    const response = await apiClient.post('/ai/analyze-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  visualSearch: async (query: string) => {
    const response = await apiClient.post('/ai/visual-search', { query })
    return response.data
  },

  getPricePrediction: async (productId: string) => {
    const response = await apiClient.post('/ai/price-prediction', { product_id: productId })
    return response.data
  },

  getPersonalizedFeed: async () => {
    const response = await apiClient.get('/ai/personalized-feed')
    return response.data
  },
}

// ==================== VENDORS API ====================
export const vendorsAPI = {
  getAll: async (params?: any) => {
    const response = await apiClient.get('/vendors', { params })
    return response.data
  },

  getById: async (id: string) => {
    const response = await apiClient.get(`/vendors/${id}`)
    return response.data
  },

  getBySlug: async (slug: string) => {
    const response = await apiClient.get(`/vendors/slug/${slug}`)
    return response.data
  },

  getProducts: async (vendorId: string, params?: any) => {
    const response = await apiClient.get(`/vendors/${vendorId}/products`, { params })
    return response.data
  },
}

// ==================== UPLOAD API ====================
export const uploadAPI = {
  uploadImage: async (file: File, folder: string = 'products') => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('folder', folder)

    const response = await apiClient.post('/upload/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  uploadMultiple: async (files: File[], folder: string = 'products') => {
    const formData = new FormData()
    files.forEach((file) => {
      formData.append('files', file)
    })
    formData.append('folder', folder)

    const response = await apiClient.post('/upload/multiple', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },
}

// ==================== NEWSLETTER API ====================
export const newsletterAPI = {
  subscribe: async (email: string) => {
    const response = await apiClient.post('/newsletter/subscribe', { email })
    return response.data
  },

  unsubscribe: async (email: string) => {
    const response = await apiClient.post('/newsletter/unsubscribe', { email })
    return response.data
  },
}

export default apiClient
