import axios, { AxiosInstance, AxiosRequestConfig } from 'axios'
import { toastEmitter } from './toast-emitter'
import type {
  RegisterRequest,
  LoginResponse,
  UserProfile,
  UpdateProfileRequest,
  ChangePasswordRequest,
  Product,
  ProductSearchParams,
  CategoryFiltersResponse,
  Cart,
  OrderCreateRequest,
  Order,
  OrderListItem,
} from './api-types'

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
    // If token expired, try to refresh using cookie
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
        // Clear any auth state in Zustand store
        if (typeof window !== 'undefined') {
          localStorage.removeItem('auth-storage')  // Clear Zustand persisted state
        }
        if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
          window.location.href = '/login'
        }
        return Promise.reject(refreshError)
      }
    }

    // Emit toast for non-401 errors
    if (error.response?.status !== 401) {
      const detail = error.response?.data?.detail
      const message = typeof detail === 'string'
        ? detail
        : Array.isArray(detail)
          ? detail.map((e: any) => e.msg || String(e)).join(', ')
          : error.response?.data?.message || 'Something went wrong'
      toastEmitter.emit(message)
    }

    return Promise.reject(error)
  }
)

// ==================== AUTH API ====================
export const authAPI = {
  register: async (data: RegisterRequest): Promise<LoginResponse> => {
    const response = await apiClient.post('/auth/register', data)
    return response.data
  },

  login: async (email: string, password: string): Promise<LoginResponse> => {
    const formData = new URLSearchParams()
    formData.append('username', email)
    formData.append('password', password)

    const response = await apiClient.post('/auth/login', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    })

    // SECURITY FIX: Tokens are now in HTTP-only cookies set by backend
    // No localStorage manipulation needed
    return response.data
  },

  logout: async () => {
    // SECURITY FIX: Call backend logout endpoint to clear HTTP-only cookies
    await apiClient.post('/auth/logout')
    // Tokens are cleared by backend, no localStorage cleanup needed
  },

  getCurrentUser: async (): Promise<UserProfile> => {
    const response = await apiClient.get('/users/me')
    return response.data
  },

  updateProfile: async (data: UpdateProfileRequest): Promise<UserProfile> => {
    const response = await apiClient.put('/users/me', data)
    return response.data
  },

  changePassword: async (data: ChangePasswordRequest) => {
    const response = await apiClient.post('/auth/change-password', data)
    return response.data
  },

  forgotPassword: async (email: string) => {
    const response = await apiClient.post('/auth/password-reset', { email })
    return response.data
  },

  resetPassword: async (data: { token: string; password: string; password_confirm?: string }) => {
    const response = await apiClient.post('/auth/password-reset/confirm', data)
    return response.data
  },

  updateAvatar: async (formData: FormData) => {
    const response = await apiClient.post('/auth/me/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data
  },

  deleteAccount: async () => {
    const response = await apiClient.delete('/users/me')
    return response.data
  },
}

// ==================== PRODUCTS API ====================
export const productsAPI = {
  getAll: async (params?: ProductSearchParams) => {
    const response = await apiClient.get('/products', { params })
    return response.data
  },

  getById: async (id: string): Promise<Product> => {
    const response = await apiClient.get(`/products/${id}`)
    return response.data
  },

  getBySlug: async (slug: string): Promise<Product> => {
    const response = await apiClient.get(`/products/${slug}`)
    return response.data
  },

  getNewArrivals: async (limit: number = 12) => {
    const response = await apiClient.get('/products', {
      params: {
        limit,
        sort_by: 'created_at',
        sort_order: 'desc',
      },
    })
    return response.data
  },

  getBestSellers: async (limit: number = 12) => {
    const response = await apiClient.get('/products', {
      params: {
        limit,
        sort_by: 'sales_count',
        sort_order: 'desc',
      },
    })
    return response.data
  },

  search: async (query: string, params?: ProductSearchParams) => {
    const response = await apiClient.get('/search', { params: { q: query, ...params } })
    return response.data
  },

  autocomplete: async (query: string) => {
    const response = await apiClient.get('/search/autocomplete', { params: { q: query } })
    return response.data
  },

  getRecommendations: async (productId?: string, categoryId?: string) => {
    const response = await apiClient.post('/ai/recommendations', {
      product_id: productId,
      category_id: categoryId,
    })
    return response.data
  },

  getFilters: async (categorySlug: string): Promise<CategoryFiltersResponse> => {
    const response = await apiClient.get(`/products/filters/${categorySlug}`)
    return response.data
  },

  getFeatured: async (limit: number = 8) => {
    const response = await apiClient.get('/products', {
      params: { limit, featured: true, sort_by: 'sales_count', sort_order: 'desc' },
    })
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

  getTree: async () => {
    const response = await apiClient.get('/categories/tree')
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
  get: async (): Promise<Cart> => {
    const response = await apiClient.get('/cart')
    return response.data
  },

  addItem: async (productId: string, quantity: number = 1, variantId?: string): Promise<Cart> => {
    const body: any = { product_id: productId, quantity }
    // Only send variant_id if it's a valid UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (variantId && uuidRegex.test(variantId)) body.variant_id = variantId
    const response = await apiClient.post('/cart/items', body)
    return response.data
  },

  updateItem: async (itemId: string, quantity: number): Promise<Cart> => {
    const response = await apiClient.put(`/cart/items/${itemId}`, { quantity })
    return response.data
  },

  removeItem: async (itemId: string): Promise<Cart> => {
    const response = await apiClient.delete(`/cart/items/${itemId}`)
    return response.data
  },

  clear: async () => {
    const response = await apiClient.delete('/cart')
    return response.data
  },

  // Bulk sync cart items - fixes N+1 query issue
  syncItems: async (items: Array<{ productId: string; quantity: number; variantId?: string }>, couponCode?: string) => {
    const formattedItems = items.map(item => ({
      product_id: item.productId,
      quantity: item.quantity,
      ...(item.variantId && { variant_id: item.variantId })
    }))
    const response = await apiClient.post('/cart/sync', {
      items: formattedItems,
      coupon_code: couponCode,
      clear_existing: true
    })
    return response.data
  },

  applyCoupon: async (code: string) => {
    const response = await apiClient.post('/cart/coupon', { coupon_code: code })
    return response.data
  },

  removeCoupon: async () => {
    const response = await apiClient.delete('/cart/coupon')
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
    const response = await apiClient.post(`/users/me/wishlist?product_id=${productId}`, {})
    return response.data
  },

  remove: async (productId: string) => {
    const response = await apiClient.delete(`/users/me/wishlist/${productId}`)
    return response.data
  },
}

// ==================== ORDERS API ====================
export const ordersAPI = {
  getAll: async (params?: { page?: number; page_size?: number; status?: string }): Promise<OrderListItem[]> => {
    const response = await apiClient.get('/orders', { params })
    return response.data
  },

  list: async (params?: { page?: number; page_size?: number; status?: string }): Promise<OrderListItem[]> => {
    const response = await apiClient.get('/orders', { params })
    return response.data
  },

  getById: async (id: string): Promise<Order> => {
    const response = await apiClient.get(`/orders/${id}`)
    return response.data
  },

  getByOrderNumber: async (orderNumber: string): Promise<Order> => {
    const response = await apiClient.get(`/orders/${orderNumber}`)
    return response.data
  },

  create: async (data: OrderCreateRequest): Promise<Order> => {
    const response = await apiClient.post('/orders', data)
    return response.data
  },

  cancel: async (id: string) => {
    const response = await apiClient.post(`/orders/${id}/cancel`)
    return response.data
  },

  trackOrder: async (orderNumber: string, email?: string) => {
    const params = email ? { email } : {}
    const response = await apiClient.get(`/orders/${orderNumber}/tracking`, { params })
    return response.data
  },
}

// ==================== ADDRESSES API ====================
export const addressesAPI = {
  getAll: async () => {
    const response = await apiClient.get('/addresses')
    return response.data
  },

  list: async () => {
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
    const response = await apiClient.put(`/addresses/${id}/default-shipping`)
    return response.data
  },
}

// ==================== REVIEWS API ====================
export const reviewsAPI = {
  getByProduct: async (productId: string, params?: any) => {
    const response = await apiClient.get(`/reviews/product/${productId}`, { params })
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
    const gateway = paymentMethod === 'paypal' ? 'paypal/create-order'
      : paymentMethod === 'flutterwave' || paymentMethod === 'bank' ? 'flutterwave/initialize'
      : paymentMethod === 'razorpay' ? 'razorpay/create-order'
      : 'stripe/create-intent'
    const response = await apiClient.post(`/payments/${gateway}`, {
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

  list: async () => {
    const response = await apiClient.get('/notifications')
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

  getRecommendations: async (productId?: string, categoryId?: string, limit?: number) => {
    const response = await apiClient.post('/ai/recommendations', {
      product_id: productId,
      category_id: categoryId,
      limit,
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

  generateDescription: async (data: { name: string; category?: string; features?: string[]; tone?: string; target_audience?: string }) => {
    const response = await apiClient.post('/ai/generate-description', data)
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
    const response = await apiClient.get(`/vendors/${slug}`)
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

// ==================== CONTACT API ====================
export const contactAPI = {
  submit: async (data: { name: string; email: string; subject: string; message: string; order_number?: string }) => {
    const response = await apiClient.post('/contact', data)
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

// ==================== CUSTOMER-VENDOR CHAT API ====================
export const chatAPI = {
  createChat: async (data: any) => {
    const response = await apiClient.post('/chats', data)
    return response.data
  },

  getChats: async () => {
    const response = await apiClient.get('/chats')
    return response.data
  },

  getChat: async (chatId: string) => {
    const response = await apiClient.get(`/chats/${chatId}`)
    return response.data
  },

  sendMessage: async (chatId: string, data: any) => {
    const response = await apiClient.post(`/chats/${chatId}/messages`, data)
    return response.data
  },

  getMessages: async (chatId: string, params?: any) => {
    const response = await apiClient.get(`/chats/${chatId}/messages`, { params })
    return response.data
  },

  getContactedVendors: async () => {
    const response = await apiClient.get('/chats/vendors-contacted')
    return response.data
  },
}

// ==================== ADMIN API ====================
export const adminAPI = {
  getStats: async () => {
    const response = await apiClient.get('/admin/stats')
    return response.data
  },

  getUsers: async (params?: any) => {
    const response = await apiClient.get('/admin/users', { params })
    return response.data
  },

  getOrders: async (params?: any) => {
    const response = await apiClient.get('/admin/orders', { params })
    return response.data
  },

  getVendors: async (params?: any) => {
    const response = await apiClient.get('/admin/vendors', { params })
    return response.data
  },

  getSettings: async () => {
    const response = await apiClient.get('/admin/settings')
    return response.data
  },

  updateSettings: async (data: any) => {
    const response = await apiClient.put('/admin/settings', data)
    return response.data
  },

  getDashboard: async () => {
    const response = await apiClient.get('/admin/dashboard')
    return response.data
  },

  getRecentOrders: async (limit?: number) => {
    const response = await apiClient.get('/admin/orders', { params: { limit, sort: '-created_at' } })
    return response.data
  },

  getTopProducts: async (limit?: number) => {
    const response = await apiClient.get('/admin/products', { params: { limit, sort: '-sales' } })
    return response.data
  },

  getTopVendors: async (limit?: number) => {
    const response = await apiClient.get('/admin/vendors', { params: { limit, sort: '-revenue' } })
    return response.data
  },

  updateProductStatus: async (productId: string, status: string) => {
    const response = await apiClient.put(`/admin/products/${productId}/status`, { status })
    return response.data
  },

  listPendingVendors: async () => {
    const response = await apiClient.get('/admin/vendors', { params: { status: 'pending' } })
    return response.data
  },

  approveVendor: async (vendorId: string) => {
    const response = await apiClient.put(`/admin/vendors/${vendorId}/approve`)
    return response.data
  },

  rejectVendor: async (vendorId: string) => {
    const response = await apiClient.put(`/admin/vendors/${vendorId}/reject`)
    return response.data
  },

  suspendVendor: async (vendorId: string) => {
    const response = await apiClient.put(`/admin/vendors/${vendorId}/suspend`)
    return response.data
  },

  listUsers: async (params?: any) => {
    const response = await apiClient.get('/admin/users', { params })
    return response.data
  },

  updateUserStatus: async (userId: string, status: string | boolean) => {
    const response = await apiClient.put(`/admin/users/${userId}/status`, { status })
    return response.data
  },

  updateUserRole: async (userId: string, role: string) => {
    const response = await apiClient.put(`/admin/users/${userId}/role`, { role })
    return response.data
  },

  getPendingReviews: async (limit?: number) => {
    const response = await apiClient.get('/admin/reviews', { params: { status: 'pending', limit } })
    return response.data
  },

  approveReview: async (reviewId: string) => {
    const response = await apiClient.put(`/admin/reviews/${reviewId}/approve`)
    return response.data
  },

  deleteReview: async (reviewId: string) => {
    const response = await apiClient.delete(`/admin/reviews/${reviewId}`)
    return response.data
  },
}

// ==================== SUPPORT CHAT API ====================
export const supportChatAPI = {
  createChat: async (data: { subject: string; message: string }) => {
    const response = await apiClient.post('/support-chat', data)
    return response.data
  },

  getChats: async () => {
    const response = await apiClient.get('/support-chat')
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

export const bannersAPI = {
  getAll: async () => {
    const response = await apiClient.get('/banners')
    return response.data
  },

  getFeatured: async () => {
    const response = await apiClient.get('/banners/featured')
    return response.data
  },
}

// ==================== RFQ API ====================
export const rfqAPI = {
  create: async (data: any) => {
    const response = await apiClient.post('/rfq', data)
    return response.data
  },
  getAll: async (params?: any) => {
    const response = await apiClient.get('/rfq', { params })
    return response.data
  },
  getById: async (id: string) => {
    const response = await apiClient.get(`/rfq/${id}`)
    return response.data
  },
  update: async (id: string, data: any) => {
    const response = await apiClient.put(`/rfq/${id}`, data)
    return response.data
  },
  cancel: async (id: string) => {
    const response = await apiClient.delete(`/rfq/${id}`)
    return response.data
  },
  getQuotes: async (rfqId: string) => {
    const response = await apiClient.get(`/rfq/${rfqId}/quotes`)
    return response.data
  },
  submitQuote: async (rfqId: string, data: any) => {
    const response = await apiClient.post(`/rfq/${rfqId}/quotes`, data)
    return response.data
  },
  acceptQuote: async (rfqId: string, quoteId: string) => {
    const response = await apiClient.put(`/rfq/${rfqId}/quotes/${quoteId}/accept`)
    return response.data
  },
  rejectQuote: async (rfqId: string, quoteId: string) => {
    const response = await apiClient.put(`/rfq/${rfqId}/quotes/${quoteId}/reject`)
    return response.data
  },
}

// ==================== VERIFICATION API ====================
export const verificationAPI = {
  apply: async (data: any) => {
    const response = await apiClient.post('/verification/apply', data)
    return response.data
  },
  getStatus: async () => {
    const response = await apiClient.get('/verification/status')
    return response.data
  },
  uploadDocument: async (data: any) => {
    const response = await apiClient.post('/verification/documents', data)
    return response.data
  },
  getVendorBadge: async (vendorId: string) => {
    const response = await apiClient.get(`/vendors/${vendorId}/badge`)
    return response.data
  },
}

export default apiClient
