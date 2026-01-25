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
    const token = localStorage.getItem('admin_access_token')
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
        const refreshToken = localStorage.getItem('admin_refresh_token')
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refresh_token: refreshToken,
          })

          const { access_token } = response.data
          localStorage.setItem('admin_access_token', access_token)

          originalRequest.headers.Authorization = `Bearer ${access_token}`
          return apiClient(originalRequest)
        }
      } catch (refreshError) {
        localStorage.removeItem('admin_access_token')
        localStorage.removeItem('admin_refresh_token')
        window.location.href = '/login'
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

// ==================== AUTH API ====================
export const authAPI = {
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
      localStorage.setItem('admin_access_token', response.data.access_token)
      localStorage.setItem('admin_refresh_token', response.data.refresh_token)
    }

    return response.data
  },

  logout: async () => {
    localStorage.removeItem('admin_access_token')
    localStorage.removeItem('admin_refresh_token')
  },

  getCurrentUser: async () => {
    const response = await apiClient.get('/users/me')
    return response.data
  },
}

// ==================== DASHBOARD API ====================
export const dashboardAPI = {
  getStats: async () => {
    const response = await apiClient.get('/admin/dashboard/stats')
    return response.data
  },

  getKPIs: async () => {
    const response = await apiClient.get('/admin/dashboard/kpis')
    return response.data
  },

  getRecentOrders: async (limit: number = 10) => {
    const response = await apiClient.get('/admin/dashboard/recent-orders', {
      params: { limit },
    })
    return response.data
  },

  getRecentActivity: async (limit: number = 20) => {
    const response = await apiClient.get('/admin/dashboard/recent-activity', {
      params: { limit },
    })
    return response.data
  },

  getFraudAlerts: async () => {
    const response = await apiClient.get('/admin/dashboard/fraud-alerts')
    return response.data
  },

  getSalesData: async (period: string = '30d') => {
    const response = await apiClient.get('/admin/dashboard/sales', {
      params: { period },
    })
    return response.data
  },

  getTopProducts: async (limit: number = 10) => {
    const response = await apiClient.get('/admin/dashboard/top-products', {
      params: { limit },
    })
    return response.data
  },

  getTopVendors: async (limit: number = 10) => {
    const response = await apiClient.get('/admin/dashboard/top-vendors', {
      params: { limit },
    })
    return response.data
  },
}

// ==================== ADMIN API ====================
export const adminAPI = {
  // Users management
  getUsers: async (params?: any) => {
    const response = await apiClient.get('/admin/users', { params })
    return response.data
  },

  getUserById: async (id: string) => {
    const response = await apiClient.get(`/admin/users/${id}`)
    return response.data
  },

  updateUser: async (id: string, data: any) => {
    const response = await apiClient.put(`/admin/users/${id}`, data)
    return response.data
  },

  deleteUser: async (id: string) => {
    const response = await apiClient.delete(`/admin/users/${id}`)
    return response.data
  },

  suspendUser: async (id: string, reason: string) => {
    const response = await apiClient.post(`/admin/users/${id}/suspend`, { reason })
    return response.data
  },

  // Vendors management
  getVendors: async (params?: any) => {
    const response = await apiClient.get('/admin/vendors', { params })
    return response.data
  },

  getVendorById: async (id: string) => {
    const response = await apiClient.get(`/admin/vendors/${id}`)
    return response.data
  },

  approveVendor: async (id: string) => {
    const response = await apiClient.post(`/admin/vendors/${id}/approve`)
    return response.data
  },

  rejectVendor: async (id: string, reason: string) => {
    const response = await apiClient.post(`/admin/vendors/${id}/reject`, { reason })
    return response.data
  },

  suspendVendor: async (id: string, reason: string) => {
    const response = await apiClient.post(`/admin/vendors/${id}/suspend`, { reason })
    return response.data
  },

  updateVendor: async (id: string, data: any) => {
    const response = await apiClient.put(`/admin/vendors/${id}`, data)
    return response.data
  },

  // Orders management
  getOrders: async (params?: any) => {
    const response = await apiClient.get('/admin/orders', { params })
    return response.data
  },

  getOrderById: async (id: string) => {
    const response = await apiClient.get(`/admin/orders/${id}`)
    return response.data
  },

  updateOrderStatus: async (id: string, status: string) => {
    const response = await apiClient.put(`/admin/orders/${id}/status`, { status })
    return response.data
  },

  // Platform settings
  getSettings: async () => {
    const response = await apiClient.get('/admin/settings')
    return response.data
  },

  updateSettings: async (data: any) => {
    const response = await apiClient.put('/admin/settings', data)
    return response.data
  },
}

// ==================== CATEGORIES API ====================
export const adminCategoriesAPI = {
  list: async () => {
    const response = await apiClient.get('/categories')
    return response.data
  },

  getAll: async () => {
    const response = await apiClient.get('/categories')
    return response.data
  },

  getTree: async () => {
    const response = await apiClient.get('/categories/tree')
    return response.data
  },

  getById: async (id: string) => {
    const response = await apiClient.get(`/categories/${id}`)
    return response.data
  },

  create: async (data: any) => {
    const response = await apiClient.post('/categories', data)
    return response.data
  },

  update: async (id: string, data: any) => {
    const response = await apiClient.put(`/categories/${id}`, data)
    return response.data
  },

  delete: async (id: string) => {
    const response = await apiClient.delete(`/categories/${id}`)
    return response.data
  },
}

// Alias for categoriesAPI (used in products pages)
export const categoriesAPI = {
  list: async () => {
    const response = await apiClient.get('/categories')
    return response.data
  },

  getAll: async () => {
    const response = await apiClient.get('/categories')
    return response.data
  },

  getTree: async () => {
    const response = await apiClient.get('/categories/tree')
    return response.data
  },

  getById: async (id: string) => {
    const response = await apiClient.get(`/categories/${id}`)
    return response.data
  },

  create: async (data: any) => {
    const response = await apiClient.post('/categories', data)
    return response.data
  },

  update: async (id: string, data: any) => {
    const response = await apiClient.put(`/categories/${id}`, data)
    return response.data
  },

  delete: async (id: string) => {
    const response = await apiClient.delete(`/categories/${id}`)
    return response.data
  },
}

// ==================== PRODUCTS API ====================
export const productsAPI = {
  list: async (params?: any) => {
    const response = await apiClient.get('/admin/products', { params })
    return response.data
  },

  getAll: async (params?: any) => {
    const response = await apiClient.get('/admin/products', { params })
    return response.data
  },

  getById: async (id: string) => {
    const response = await apiClient.get(`/admin/products/${id}`)
    return response.data
  },

  approve: async (id: string) => {
    const response = await apiClient.post(`/admin/products/${id}/approve`)
    return response.data
  },

  reject: async (id: string, reason: string) => {
    const response = await apiClient.post(`/admin/products/${id}/reject`, { reason })
    return response.data
  },

  delete: async (id: string) => {
    const response = await apiClient.delete(`/admin/products/${id}`)
    return response.data
  },
}

// ==================== REVIEWS API ====================
export const reviewsAPI = {
  getAll: async (params?: any) => {
    const response = await apiClient.get('/admin/reviews', { params })
    return response.data
  },

  approve: async (id: string) => {
    const response = await apiClient.post(`/admin/reviews/${id}/approve`)
    return response.data
  },

  reject: async (id: string) => {
    const response = await apiClient.post(`/admin/reviews/${id}/reject`)
    return response.data
  },

  delete: async (id: string) => {
    const response = await apiClient.delete(`/admin/reviews/${id}`)
    return response.data
  },
}

// ==================== ORDERS API ====================
export const ordersAPI = {
  list: async (params?: any) => {
    const response = await apiClient.get('/admin/orders', { params })
    return response.data
  },

  getAll: async (params?: any) => {
    const response = await apiClient.get('/admin/orders', { params })
    return response.data
  },

  get: async (id: string) => {
    const response = await apiClient.get(`/admin/orders/${id}`)
    return response.data
  },

  getById: async (id: string) => {
    const response = await apiClient.get(`/admin/orders/${id}`)
    return response.data
  },

  updateStatus: async (id: string, status: string) => {
    const response = await apiClient.put(`/admin/orders/${id}/status`, { status })
    return response.data
  },
}

// ==================== CONTENT API ====================
export const contentAPI = {
  getAll: async (params?: any) => {
    const response = await apiClient.get('/admin/content', { params })
    return response.data
  },

  create: async (data: any) => {
    const response = await apiClient.post('/admin/content', data)
    return response.data
  },

  update: async (id: string, data: any) => {
    const response = await apiClient.put(`/admin/content/${id}`, data)
    return response.data
  },

  delete: async (id: string) => {
    const response = await apiClient.delete(`/admin/content/${id}`)
    return response.data
  },
}

// ==================== UPLOAD API ====================
export const uploadAPI = {
  uploadImage: async (file: File, folder: string = 'admin') => {
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

  uploadMultiple: async (files: File[], folder: string = 'admin') => {
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

// ==================== VENDORS API ====================
// Wrapper for vendor-specific operations
export const vendorsAPI = {
  list: async (params?: any) => {
    const response = await apiClient.get('/admin/vendors', { params })
    return response.data
  },

  getById: async (id: string) => {
    const response = await apiClient.get(`/admin/vendors/${id}`)
    return response.data
  },

  approve: async (id: string) => {
    const response = await apiClient.post(`/admin/vendors/${id}/approve`)
    return response.data
  },

  reject: async (id: string, reason?: string) => {
    const response = await apiClient.post(`/admin/vendors/${id}/reject`, { reason })
    return response.data
  },

  suspend: async (id: string, reason?: string) => {
    const response = await apiClient.post(`/admin/vendors/${id}/suspend`, { reason })
    return response.data
  },

  update: async (id: string, data: any) => {
    const response = await apiClient.put(`/admin/vendors/${id}`, data)
    return response.data
  },

  resetPassword: async (id: string, data: any) => {
    const response = await apiClient.post(`/admin/vendors/${id}/reset-password`, data)
    return response.data
  },
}

// ==================== USERS API ====================
export const usersAPI = {
  list: async (params?: any) => {
    const response = await apiClient.get('/admin/users', { params })
    return response.data
  },

  getById: async (id: string) => {
    const response = await apiClient.get(`/admin/users/${id}`)
    return response.data
  },

  create: async (data: any) => {
    const response = await apiClient.post('/admin/users', data)
    return response.data
  },

  update: async (id: string, data: any) => {
    const response = await apiClient.put(`/admin/users/${id}`, data)
    return response.data
  },

  delete: async (id: string) => {
    const response = await apiClient.delete(`/admin/users/${id}`)
    return response.data
  },

  suspend: async (id: string, reason?: string) => {
    const response = await apiClient.post(`/admin/users/${id}/suspend`, { reason })
    return response.data
  },

  activate: async (id: string) => {
    const response = await apiClient.post(`/admin/users/${id}/activate`)
    return response.data
  },
}

// ==================== NOTIFICATIONS API ====================
export const notificationsAPI = {
  // Get all notifications
  list: async (params?: { limit?: number; offset?: number; unread_only?: boolean }) => {
    const response = await apiClient.get('/admin/notifications', { params })
    return response.data
  },

  // Get unread count
  getUnreadCount: async () => {
    const response = await apiClient.get('/admin/notifications/unread-count')
    return response.data
  },

  // Mark notification as read
  markAsRead: async (id: string) => {
    const response = await apiClient.put(`/admin/notifications/${id}/read`)
    return response.data
  },

  // Mark all as read
  markAllAsRead: async () => {
    const response = await apiClient.put('/admin/notifications/read-all')
    return response.data
  },

  // Delete notification
  delete: async (id: string) => {
    const response = await apiClient.delete(`/admin/notifications/${id}`)
    return response.data
  },

  // Clear all notifications
  clearAll: async () => {
    const response = await apiClient.delete('/admin/notifications')
    return response.data
  },
}

export default apiClient
