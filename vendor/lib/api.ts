import axios, { AxiosInstance } from 'axios'

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
    const token = localStorage.getItem('vendor_access_token')
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

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        const refreshToken = localStorage.getItem('vendor_refresh_token')
        if (!refreshToken) throw new Error('No refresh token')

        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refresh_token: refreshToken,
        })

        const { access_token } = response.data
        localStorage.setItem('vendor_access_token', access_token)

        originalRequest.headers.Authorization = `Bearer ${access_token}`
        return apiClient(originalRequest)
      } catch (refreshError) {
        localStorage.removeItem('vendor_access_token')
        localStorage.removeItem('vendor_refresh_token')
        localStorage.removeItem('vendor-auth-storage')
        if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
          window.location.href = '/login'
        }
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

// ==================== AUTH API ====================
export const authAPI = {
  register: async (data: any) => {
    const response = await apiClient.post('/vendors/register', data)
    return response.data
  },

  registerVendor: async (data: any) => {
    const response = await apiClient.post('/vendors/register', data)
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
      localStorage.setItem('vendor_access_token', response.data.access_token)
      localStorage.setItem('vendor_refresh_token', response.data.refresh_token)
    }

    return response.data
  },

  logout: async () => {
    localStorage.removeItem('vendor_access_token')
    localStorage.removeItem('vendor_refresh_token')
  },

  getCurrentUser: async () => {
    const response = await apiClient.get('/users/me')
    return response.data
  },

  forgotPassword: async (email: string) => {
    const response = await apiClient.post('/auth/password-reset', { email })
    return response.data
  },

  resetPassword: async (token: string, password: string) => {
    const response = await apiClient.post('/auth/password-reset/confirm', { token, password })
    return response.data
  },
}

// ==================== VENDOR PROFILE API ====================
export const vendorProfileAPI = {
  get: async () => {
    const response = await apiClient.get('/vendors/me')
    return response.data
  },

  update: async (data: any) => {
    const response = await apiClient.put('/vendors/me', data)
    return response.data
  },

  updateBankDetails: async (data: any) => {
    const response = await apiClient.put('/vendors/me/bank-details', data)
    return response.data
  },

  uploadLogo: async (file: File) => {
    const formData = new FormData()
    formData.append('file', file)

    const response = await apiClient.post('/vendors/me/logo', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },
}

// ==================== PRODUCTS API ====================
export const vendorProductsAPI = {
  getAll: async (params?: any) => {
    const response = await apiClient.get('/vendors/me/products', { params })
    return response.data
  },

  list: async (params?: any) => {
    const response = await apiClient.get('/vendors/me/products', { params })
    return response.data
  },

  getById: async (id: string) => {
    const response = await apiClient.get(`/vendors/me/products/${id}`)
    return response.data
  },

  get: async (id: string) => {
    const response = await apiClient.get(`/vendors/me/products/${id}`)
    return response.data
  },

  create: async (data: any) => {
    const response = await apiClient.post('/vendors/me/products', data)
    return response.data
  },

  update: async (id: string, data: any) => {
    const response = await apiClient.put(`/vendors/me/products/${id}`, data)
    return response.data
  },

  delete: async (id: string) => {
    const response = await apiClient.delete(`/vendors/me/products/${id}`)
    return response.data
  },

  updateStatus: async (id: string, status: string) => {
    const response = await apiClient.put(`/vendors/me/products/${id}/status`, { status })
    return response.data
  },

  bulkUpload: async (file: File) => {
    const formData = new FormData()
    formData.append('file', file)

    const response = await apiClient.post('/vendors/me/products/bulk-upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },
}

// ==================== INVENTORY API ====================
export const vendorInventoryAPI = {
  getAll: async (params?: any) => {
    const response = await apiClient.get('/vendors/me/products', { params })
    return response.data
  },

  updateStock: async (productId: string, quantity: number) => {
    const response = await apiClient.put(`/vendors/me/products/${productId}`, {
      quantity,
    })
    return response.data
  },

  getLowStock: async (threshold: number = 10) => {
    const response = await apiClient.get('/vendors/me/products', {
      params: { threshold, low_stock: true },
    })
    return response.data
  },
}

// ==================== ORDERS API ====================
export const vendorOrdersAPI = {
  getAll: async (params?: any) => {
    const response = await apiClient.get('/vendors/me/orders', { params })
    return response.data
  },

  list: async (params?: any) => {
    const response = await apiClient.get('/vendors/me/orders', { params })
    return response.data
  },

  getById: async (id: string) => {
    const response = await apiClient.get(`/vendors/me/orders/${id}`)
    return response.data
  },

  get: async (id: string) => {
    const response = await apiClient.get(`/vendors/me/orders/${id}`)
    return response.data
  },

  updateStatus: async (id: string, status: string, trackingNumber?: string) => {
    const response = await apiClient.put(`/vendors/me/orders/${id}/status`, {
      status,
      tracking_number: trackingNumber || undefined,
    })
    return response.data
  },

  addTracking: async (id: string, trackingNumber: string, carrier: string) => {
    const response = await apiClient.post(`/vendors/me/orders/${id}/tracking`, {
      tracking_number: trackingNumber,
      carrier,
    })
    return response.data
  },

  getStats: async () => {
    const response = await apiClient.get('/vendors/me/orders/stats')
    return response.data
  },
}

// ==================== DASHBOARD API ====================
export const vendorDashboardAPI = {
  getStats: async () => {
    const response = await apiClient.get('/vendors/me/dashboard')
    return response.data
  },

  getRevenueChart: async (days: number = 30) => {
    const response = await apiClient.get('/vendors/me/revenue-chart', {
      params: { days },
    })
    return response.data
  },

  getTopProducts: async (limit: number = 5) => {
    const response = await apiClient.get('/vendors/me/top-products', {
      params: { limit },
    })
    return response.data
  },

  getRecentOrders: async (limit: number = 5) => {
    const response = await apiClient.get('/vendors/me/orders', {
      params: { limit },
    })
    return response.data
  },
}

// ==================== ANALYTICS API ====================
export const vendorAnalyticsAPI = {
  getDashboard: async () => {
    const response = await apiClient.get('/vendors/me/analytics/dashboard')
    return response.data
  },

  getSales: async (period: string = '30d') => {
    const response = await apiClient.get('/vendors/me/analytics/sales', {
      params: { period },
    })
    return response.data
  },

  getRevenue: async (period: string = '30d') => {
    const response = await apiClient.get('/vendors/me/analytics/revenue', {
      params: { period },
    })
    return response.data
  },

  getTopProducts: async (limit: number = 10) => {
    const response = await apiClient.get('/vendors/me/analytics/top-products', {
      params: { limit },
    })
    return response.data
  },

  getCustomerInsights: async () => {
    const response = await apiClient.get('/vendors/me/analytics/customers')
    return response.data
  },
}

// ==================== PAYOUTS API ====================
export const vendorPayoutsAPI = {
  getAll: async (params?: any) => {
    const response = await apiClient.get('/vendors/me/payouts', { params })
    return response.data
  },

  list: async (params?: any) => {
    const response = await apiClient.get('/vendors/me/payouts', { params })
    return response.data
  },

  getById: async (id: string) => {
    const response = await apiClient.get(`/vendors/me/payouts/${id}`)
    return response.data
  },

  requestPayout: async (amount: number, payment_method: string) => {
    const response = await apiClient.post('/vendors/me/payouts', { amount, payment_method })
    return response.data
  },

  getBalance: async () => {
    const response = await apiClient.get('/vendors/me/balance')
    return response.data
  },
}

// ==================== REVIEWS API ====================
export const vendorReviewsAPI = {
  getAll: async (params?: any) => {
    const response = await apiClient.get('/vendors/me/reviews', { params })
    return response.data
  },

  list: async (params?: any) => {
    const response = await apiClient.get('/vendors/me/reviews', { params })
    return response.data
  },

  respond: async (id: string, response: string) => {
    const response_data = await apiClient.post(`/reviews/${id}/respond`, {
      response,
    })
    return response_data.data
  },
}

// ==================== CATEGORIES API ====================
export const categoriesAPI = {
  getAll: async () => {
    const response = await apiClient.get('/categories')
    return response.data
  },

  getTree: async () => {
    const response = await apiClient.get('/categories/tree')
    return response.data
  },

  list: async () => {
    const response = await apiClient.get('/categories')
    return response.data
  },

  getById: async (id: string) => {
    const response = await apiClient.get(`/categories/${id}`)
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

  deleteImage: async (url: string) => {
    const response = await apiClient.delete('/upload/image', {
      data: { url },
    })
    return response.data
  },
}

// ==================== VENDOR SETTINGS API ====================
export const vendorSettingsAPI = {
  getProfile: async () => {
    const response = await apiClient.get('/vendors/me')
    return response.data
  },

  updateProfile: async (data: any) => {
    const response = await apiClient.put('/vendors/me', data)
    return response.data
  },

  getPaymentSettings: async () => {
    const response = await apiClient.get('/vendors/me/payment-settings')
    return response.data
  },

  updatePaymentSettings: async (data: any) => {
    const response = await apiClient.put('/vendors/me/payment-settings', data)
    return response.data
  },

  getNotificationSettings: async () => {
    const response = await apiClient.get('/vendors/me/notification-settings')
    return response.data
  },

  updateNotificationSettings: async (data: any) => {
    const response = await apiClient.put('/vendors/me/notification-settings', data)
    return response.data
  },
}

// ==================== AI API ====================
export const aiAPI = {
  generateDescription: async (data: any) => {
    const response = await apiClient.post('/ai/generate-description', data)
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

  getSalesForecast: async (timeframe: string = '30d') => {
    const response = await apiClient.post('/ai/sales-forecast', { timeframe })
    return response.data
  },

  getPricingRecommendations: async (productId: string) => {
    const response = await apiClient.post('/ai/pricing-recommendations', { product_id: productId })
    return response.data
  },

  getInventoryOptimization: async () => {
    const response = await apiClient.get('/ai/inventory-optimization')
    return response.data
  },

  getDemandPrediction: async (productId: string, days: number = 30) => {
    const response = await apiClient.post('/ai/demand-prediction', {
      product_id: productId,
      days,
    })
    return response.data
  },

  getCompetitorAnalysis: async (categoryId: string) => {
    const response = await apiClient.post('/ai/competitor-analysis', { category_id: categoryId })
    return response.data
  },
}

export default apiClient
