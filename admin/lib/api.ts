import axios, { AxiosInstance } from 'axios'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

// Helper function to get CSRF token from cookie
function getCsrfToken(): string | null {
  if (typeof document === 'undefined') return null
  const cookies = document.cookie.split(';')
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=')
    if (name === 'csrf_token') {
      return decodeURIComponent(value)
    }
  }
  return null
}

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
})

// Request interceptor to add CSRF token for state-changing operations
apiClient.interceptors.request.use(
  (config) => {
    // SECURITY FIX: Tokens are now in HTTP-only cookies
    // No need to add Authorization header - cookies are sent automatically
    // The backend reads from cookies via get_current_user()

    // CSRF PROTECTION: Add CSRF token for state-changing operations
    const method = config.method?.toUpperCase()
    if (method && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      const csrfToken = getCsrfToken()
      if (csrfToken) {
        config.headers['X-CSRF-Token'] = csrfToken
      }
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

    // SECURITY FIX: Token refresh now uses HTTP-only cookies
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        // Refresh endpoint reads refresh_token from HTTP-only cookie
        // No need to send token in body - it's automatically sent via cookie
        const response = await axios.post(
          `${API_BASE_URL}/auth/refresh`,
          {},
          { withCredentials: true }  // Send cookies
        )

        // Token is set in HTTP-only cookie by backend
        // No localStorage manipulation needed
        // Retry the original request (cookie will be sent automatically)
        return apiClient(originalRequest)
      } catch (refreshError) {
        // Token refresh failed - redirect to login
        if (typeof window !== 'undefined') {
          localStorage.removeItem('auth-storage')  // Clear Zustand persisted state
        }
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
  login: async (email: string, password: string) => {
    const formData = new URLSearchParams()
    formData.append('username', email)
    formData.append('password', password)

    const response = await apiClient.post('/auth/login', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    })

    // SECURITY FIX: Tokens are now in HTTP-only cookies set by backend
    // No need to store in localStorage - cookies are sent automatically

    return response.data
  },

  logout: async () => {
    // SECURITY FIX: Backend clears HTTP-only cookies on logout
    await apiClient.post('/auth/logout')
  },

  getCurrentUser: async () => {
    const response = await apiClient.get('/users/me')
    return response.data
  },
}

// ==================== DASHBOARD API ====================
export const dashboardAPI = {
  getStats: async () => {
    const response = await apiClient.get('/admin/dashboard')
    return response.data
  },

  getKPIs: async () => {
    const response = await apiClient.get('/admin/dashboard')
    return response.data
  },

  getRecentOrders: async (limit: number = 10) => {
    const response = await apiClient.get('/admin/recent-orders', {
      params: { limit },
    })
    return response.data
  },

  getRecentActivity: async (limit: number = 20) => {
    const response = await apiClient.get('/admin/recent-activity', {
      params: { limit },
    })
    return response.data
  },

  getFraudAlerts: async () => {
    const response = await apiClient.get('/admin/fraud-alerts')
    return response.data
  },

  getSalesData: async (period: string = '30d') => {
    const response = await apiClient.get('/admin/dashboard/sales', {
      params: { period },
    })
    return response.data
  },

  getTopProducts: async (limit: number = 10) => {
    const response = await apiClient.get('/admin/top-products', {
      params: { limit },
    })
    return response.data
  },

  getTopVendors: async (limit: number = 10) => {
    const response = await apiClient.get('/admin/top-vendors', {
      params: { limit },
    })
    return response.data
  },

  getRevenueChart: async (days: number = 30) => {
    const response = await apiClient.get('/admin/revenue-chart', {
      params: { days },
    })
    return response.data
  },

  updateFraudAlertStatus: async (alertId: string, status: string) => {
    const response = await apiClient.put(`/admin/fraud-alerts/${alertId}/status`, { status })
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

  // Products management
  getProducts: async (params?: any) => {
    const response = await apiClient.get('/admin/products', { params })
    return response.data
  },

  getProductById: async (id: string) => {
    const response = await apiClient.get(`/admin/products/${id}`)
    return response.data
  },

  // Categories management
  getCategories: async () => {
    const response = await apiClient.get('/admin/categories')
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

  get: async (id: string) => {
    const response = await apiClient.get(`/admin/products/${id}`)
    return response.data
  },

  update: async (id: string, data: any) => {
    const response = await apiClient.put(`/admin/products/${id}`, data)
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

  list: async (params?: any) => {
    const response = await apiClient.get('/admin/reviews', { params })
    return response.data
  },

  approve: async (id: string) => {
    const response = await apiClient.post(`/admin/reviews/${id}/approve`)
    return response.data
  },

  reject: async (id: string, reason?: string) => {
    const response = await apiClient.post(`/admin/reviews/${id}/reject`, { reason })
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

  updateStatus: async (id: string, data: string | { status: string; tracking_number?: string; carrier?: string; notes?: string }) => {
    const payload = typeof data === 'string' ? { status: data } : data
    const response = await apiClient.put(`/admin/orders/${id}/status`, payload)
    return response.data
  },

  bulkUpdateStatus: async (orderIds: string[], status: string) => {
    const response = await apiClient.put('/admin/orders/bulk-status', { order_ids: orderIds, status })
    return response.data
  },
}

// ==================== ANALYTICS API ====================
export const analyticsAPI = {
  getOverview: async () => {
    const response = await apiClient.get('/admin/analytics/overview')
    return response.data
  },

  getSalesChart: async (days: number = 7) => {
    const response = await apiClient.get('/admin/analytics/sales-chart', { params: { days } })
    return response.data
  },

  getRevenueByCategory: async () => {
    const response = await apiClient.get('/admin/analytics/revenue-by-category')
    return response.data
  },

  exportCSV: async (days: number = 30) => {
    const response = await apiClient.get('/admin/analytics/export-csv', {
      params: { days },
      responseType: 'blob',
    })
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `sales-export-${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
  },
}

// ==================== CONTENT API ====================
export const contentAPI = {
  getAll: async (params?: any) => {
    const response = await apiClient.get('/admin/content', { params })
    return response.data
  },

  getBanners: async (params?: any) => {
    const response = await apiClient.get('/banners', { params })
    return response.data
  },

  getPromotions: async (params?: any) => {
    const response = await apiClient.get('/admin/content/promotions', { params })
    return response.data
  },

  getAnnouncements: async (params?: any) => {
    const response = await apiClient.get('/admin/content/announcements', { params })
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

  // Banner CRUD (uses /banners endpoints)
  createBanner: async (data: any) => {
    const response = await apiClient.post('/banners', data)
    return response.data
  },
  updateBanner: async (id: string, data: any) => {
    const response = await apiClient.put(`/banners/${id}`, data)
    return response.data
  },
  toggleBanner: async (id: string, is_active: boolean) => {
    const response = await apiClient.put(`/banners/${id}`, { is_active })
    return response.data
  },
  deleteBanner: async (id: string) => {
    const response = await apiClient.delete(`/banners/${id}`)
    return response.data
  },

  // Promotion CRUD
  createPromotion: async (data: any) => {
    const response = await apiClient.post('/admin/content/promotions', data)
    return response.data
  },
  updatePromotion: async (id: string, data: any) => {
    const response = await apiClient.put(`/admin/content/promotions/${id}`, data)
    return response.data
  },
  togglePromotion: async (id: string) => {
    const response = await apiClient.patch(`/admin/content/promotions/${id}/toggle`)
    return response.data
  },
  deletePromotion: async (id: string) => {
    const response = await apiClient.delete(`/admin/content/promotions/${id}`)
    return response.data
  },

  // Announcement CRUD
  createAnnouncement: async (data: any) => {
    const response = await apiClient.post('/admin/content/announcements', data)
    return response.data
  },
  updateAnnouncement: async (id: string, data: any) => {
    const response = await apiClient.put(`/admin/content/announcements/${id}`, data)
    return response.data
  },
  toggleAnnouncement: async (id: string) => {
    const response = await apiClient.patch(`/admin/content/announcements/${id}/toggle`)
    return response.data
  },
  deleteAnnouncement: async (id: string) => {
    const response = await apiClient.delete(`/admin/content/announcements/${id}`)
    return response.data
  },
}

// ==================== UPLOAD API ====================
export const uploadAPI = {
  uploadFile: async (file: File, folder: string = 'admin') => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('folder', folder)

    const response = await apiClient.post('/upload/file', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

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

  reactivate: async (id: string) => {
    const response = await apiClient.post(`/admin/vendors/${id}/approve`)
    return response.data
  },

  resetPassword: async (id: string, data: any) => {
    const response = await apiClient.post(`/admin/vendors/${id}/reset-password`, data)
    return response.data
  },

  updateCommission: async (id: string, commission_rate: number) => {
    const response = await apiClient.put(`/admin/vendors/${id}/commission`, { commission_rate })
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

// ==================== SYSTEM API ====================
export const systemAPI = {
  getSettings: async () => {
    const response = await apiClient.get('/admin/settings')
    return response.data
  },

  updateSettings: async (data: any) => {
    const response = await apiClient.put('/admin/settings', data)
    return response.data
  },

  getSystemHealth: async () => {
    const response = await apiClient.get('/admin/system/health')
    return response.data
  },

  getLogs: async (params?: any) => {
    const response = await apiClient.get('/admin/system/logs', { params })
    return response.data
  },
}

// ==================== SUPPORT API ====================
export const supportAPI = {
  getTickets: async (params?: { status?: string }) => {
    const response = await apiClient.get('/support-chat', { params })
    return response.data
  },

  getMessages: async (chatId: string) => {
    const response = await apiClient.get(`/support-chat/${chatId}/messages`)
    return response.data
  },

  sendMessage: async (chatId: string, content: string) => {
    const response = await apiClient.post(`/support-chat/${chatId}/messages`, { content })
    return response.data
  },

  closeChat: async (chatId: string) => {
    const response = await apiClient.put(`/support-chat/${chatId}/close`)
    return response.data
  },

  getAISuggestion: async (ticketId: string, context: string) => {
    const response = await apiClient.post('/ai/chat', { message: `Suggest a support response for: ${context}` })
    return response.data
  },

  getWebSocketUrl: (chatId: string) => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'
    const wsBase = apiUrl.replace(/^http/, 'ws').replace(/\/api\/v1$/, '')
    return `${wsBase}/api/v1/support-chat/ws/${chatId}`
  },
}

// ==================== FINANCE API ====================
export const financeAPI = {
  getPayouts: async (params?: { status?: string; limit?: number; offset?: number; vendor_id?: string }) => {
    const response = await apiClient.get('/payouts/admin/payouts', { params })
    return response.data
  },

  getPayoutById: async (id: string) => {
    const response = await apiClient.get(`/payouts/admin/payouts/${id}`)
    return response.data
  },

  processPayout: async (id: string) => {
    const response = await apiClient.put(`/payouts/admin/payouts/${id}/approve`, {})
    return response.data
  },

  rejectPayout: async (id: string, reason: string) => {
    const response = await apiClient.put(`/payouts/admin/payouts/${id}/reject`, { reason })
    return response.data
  },

  getTransactions: async (params?: { type?: string; limit?: number; offset?: number }) => {
    const response = await apiClient.get('/admin/finance/transactions', { params })
    return response.data
  },

  getCommissionSettings: async () => {
    const response = await apiClient.get('/admin/finance/commissions')
    return response.data
  },

  updateCommissionSettings: async (data: any) => {
    const response = await apiClient.put('/admin/finance/commissions', data)
    return response.data
  },

  getSellerPlans: async () => {
    const response = await apiClient.get('/admin/seller-plans')
    return response.data
  },

  updateSellerPlans: async (plans: any[]) => {
    const response = await apiClient.put('/admin/seller-plans', plans)
    return response.data
  },
}

// ==================== PROFILE API ====================
export const profileAPI = {
  update: async (data: { first_name?: string; last_name?: string; email?: string; phone?: string }) => {
    const response = await apiClient.put('/users/me', data)
    return response.data
  },

  changePassword: async (data: { current_password: string; new_password: string }) => {
    const response = await apiClient.post('/users/me/change-password', data)
    return response.data
  },

  updateNotificationPreferences: async (data: any) => {
    const response = await apiClient.put('/users/me/notification-preferences', data)
    return response.data
  },

  getSessions: async () => {
    const response = await apiClient.get('/users/me/sessions')
    return response.data
  },

  revokeSessions: async (sessionId?: string) => {
    const endpoint = sessionId ? `/users/me/sessions/${sessionId}` : '/users/me/sessions'
    const response = await apiClient.delete(endpoint)
    return response.data
  },
}

// ==================== CONTACT/MESSAGES API ====================
export const contactAPI = {
  submit: async (data: { name: string; email: string; subject: string; message: string; order_number?: string }) => {
    const response = await apiClient.post('/contact', data)
    return response.data
  },
}

// ==================== SUPPORT CHAT API ====================
export const supportChatAPI = {
  getChats: async (status?: string) => {
    const response = await apiClient.get('/support-chat', { params: status ? { status } : undefined })
    return response.data
  },

  getMessages: async (chatId: string) => {
    const response = await apiClient.get(`/support-chat/${chatId}/messages`)
    return response.data
  },

  sendMessage: async (chatId: string, content: string) => {
    const response = await apiClient.post(`/support-chat/${chatId}/messages`, { content })
    return response.data
  },

  closeChat: async (chatId: string) => {
    const response = await apiClient.put(`/support-chat/${chatId}/close`)
    return response.data
  },
}

// ==================== BANNERS API ====================
export const bannersAPI = {
  getAll: async () => {
    const response = await apiClient.get('/banners', { params: { active_only: false } })
    return response.data
  },

  getFeatured: async () => {
    const response = await apiClient.get('/banners/featured')
    return response.data
  },

  create: async (data: any) => {
    const response = await apiClient.post('/banners', data)
    return response.data
  },

  update: async (id: string, data: any) => {
    const response = await apiClient.put(`/banners/${id}`, data)
    return response.data
  },

  delete: async (id: string) => {
    const response = await apiClient.delete(`/banners/${id}`)
    return response.data
  },
}

// ==================== UPLOAD API ====================
export const uploadAPI = {
  uploadImage: async (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    const response = await apiClient.post('/upload/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data
  },
}

export default apiClient
