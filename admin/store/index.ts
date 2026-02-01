import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import Cookies from 'js-cookie'

// Types
export interface AdminUser {
  id: string
  email: string
  first_name: string
  last_name: string
  role: 'admin' | 'super_admin'
  avatar?: string
  is_active: boolean
  created_at: string
  last_login?: string
}

interface AuthState {
  user: AdminUser | null
  token: string | null
  isAuthenticated: boolean
  _hasHydrated: boolean
  login: (token: string, user: AdminUser) => void
  logout: () => void
  updateUser: (user: Partial<AdminUser>) => void
  setHasHydrated: (state: boolean) => void
}

interface SidebarState {
  isCollapsed: boolean
  isMobileOpen: boolean
  toggleCollapsed: () => void
  setMobileOpen: (open: boolean) => void
}

interface NotificationState {
  unreadCount: number
  notifications: Notification[]
  setUnreadCount: (count: number) => void
  addNotification: (notification: Notification) => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  clearAll: () => void
}

interface Notification {
  id: string
  type: 'order' | 'vendor' | 'user' | 'system' | 'alert'
  title: string
  message: string
  read: boolean
  timestamp: string
  link?: string
}

// Auth Store
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      _hasHydrated: false,

      login: (token, user) => {
        Cookies.set('admin_token', token, { expires: 7 })
        set({ token, user, isAuthenticated: true })
      },

      logout: () => {
        Cookies.remove('admin_token')
        set({ token: null, user: null, isAuthenticated: false })
      },

      updateUser: (updatedUser) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updatedUser } : null,
        })),

      setHasHydrated: (state) => set({ _hasHydrated: state }),
    }),
    {
      name: 'admin-auth-storage',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        // Use the state's method if available, otherwise defer
        if (state) {
          state.setHasHydrated(true)
        } else {
          // Defer to next tick if state is not ready
          setTimeout(() => {
            useAuthStore.getState().setHasHydrated(true)
          }, 0)
        }
      },
    }
  )
)

// Sidebar Store
export const useSidebarStore = create<SidebarState>()((set) => ({
  isCollapsed: false,
  isMobileOpen: false,
  toggleCollapsed: () => set((state) => ({ isCollapsed: !state.isCollapsed })),
  setMobileOpen: (open) => set({ isMobileOpen: open }),
}))

// Notification Store
export const useNotificationStore = create<NotificationState>()((set) => ({
  unreadCount: 0,
  notifications: [],

  setUnreadCount: (count) => set({ unreadCount: count }),

  addNotification: (notification) =>
    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount: notification.read ? state.unreadCount : state.unreadCount + 1,
    })),

  markAsRead: (id) =>
    set((state) => {
      const notification = state.notifications.find((n) => n.id === id)
      const wasUnread = notification && !notification.read

      return {
        notifications: state.notifications.map((n) =>
          n.id === id ? { ...n, read: true } : n
        ),
        unreadCount: wasUnread ? Math.max(0, state.unreadCount - 1) : state.unreadCount,
      }
    }),

  markAllAsRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    })),

  clearAll: () => set({ notifications: [], unreadCount: 0 }),
}))

// Messages Store
interface MessagesState {
  unreadMessagesCount: number
  setUnreadMessagesCount: (count: number) => void
  incrementUnreadMessages: () => void
  decrementUnreadMessages: () => void
  resetUnreadMessages: () => void
}

export const useMessagesStore = create<MessagesState>()((set) => ({
  unreadMessagesCount: 0,

  setUnreadMessagesCount: (count) => set({ unreadMessagesCount: count }),

  incrementUnreadMessages: () =>
    set((state) => ({ unreadMessagesCount: state.unreadMessagesCount + 1 })),

  decrementUnreadMessages: () =>
    set((state) => ({ unreadMessagesCount: Math.max(0, state.unreadMessagesCount - 1) })),

  resetUnreadMessages: () => set({ unreadMessagesCount: 0 }),
}))

// Stats Store
interface DashboardStats {
  totalRevenue: number
  activeUsers: number
  ordersToday: number
  avgOrderValue: number
}

interface StatsState {
  stats: DashboardStats
  isLoading: boolean
  updateStats: (stats: Partial<DashboardStats>) => void
  setLoading: (loading: boolean) => void
  fetchStats: () => Promise<void>
}

export const useStatsStore = create<StatsState>()((set) => ({
  stats: {
    totalRevenue: 0,
    activeUsers: 0,
    ordersToday: 0,
    avgOrderValue: 0,
  },
  isLoading: false,

  updateStats: (newStats) =>
    set((state) => ({
      stats: { ...state.stats, ...newStats },
    })),

  setLoading: (loading) => set({ isLoading: loading }),

  fetchStats: async () => {
    try {
      set({ isLoading: true })
      // Stats will be populated from API when connected
      set({ isLoading: false })
    } catch (error) {
      console.error('Failed to fetch stats:', error)
      set({ isLoading: false })
    }
  },
}))

// Theme Store
interface ThemeState {
  theme: 'dark' | 'light' | 'system'
  setTheme: (theme: 'dark' | 'light' | 'system') => void
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'dark',
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'admin-theme-storage',
    }
  )
)
