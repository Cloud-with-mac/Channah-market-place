import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import Cookies from 'js-cookie'

// Types
export interface VendorUser {
  id: string
  email: string
  first_name: string
  last_name: string
  role: 'vendor'
  avatar?: string
  is_active: boolean
  created_at: string
  last_login?: string
  vendor_profile?: {
    id: string
    business_name: string
    description?: string
    logo?: string
    status: 'pending' | 'approved' | 'rejected' | 'suspended'
    rating: number
    total_sales: number
  }
}

interface AuthState {
  user: VendorUser | null
  token: string | null
  isAuthenticated: boolean
  _hasHydrated: boolean
  login: (token: string, user: VendorUser) => void
  logout: () => void
  updateUser: (user: Partial<VendorUser>) => void
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
  clearAll: () => void
}

interface Notification {
  id: string
  type: 'order' | 'product' | 'payout' | 'review' | 'system'
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
        Cookies.set('vendor_token', token, { expires: 7 })
        set({ token, user, isAuthenticated: true })
      },

      logout: () => {
        Cookies.remove('vendor_token')
        set({ token: null, user: null, isAuthenticated: false })
      },

      updateUser: (updatedUser) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updatedUser } : null,
        })),

      setHasHydrated: (state) => set({ _hasHydrated: state }),
    }),
    {
      name: 'vendor-auth-storage',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true)
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
      unreadCount: state.unreadCount + 1,
    })),

  markAsRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
      unreadCount: Math.max(0, state.unreadCount - 1),
    })),

  clearAll: () => set({ notifications: [], unreadCount: 0 }),
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
      name: 'vendor-theme-storage',
    }
  )
)

// Currency Store
export interface VendorCurrency {
  code: string
  symbol: string
  name: string
  flag: string
}

export const vendorCurrencies: VendorCurrency[] = [
  // Major World Currencies
  { code: 'USD', symbol: '$', name: 'US Dollar', flag: '🇺🇸' },
  { code: 'EUR', symbol: '€', name: 'Euro', flag: '🇪🇺' },
  { code: 'GBP', symbol: '£', name: 'British Pound', flag: '🇬🇧' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen', flag: '🇯🇵' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan', flag: '🇨🇳' },
  { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc', flag: '🇨🇭' },

  // North America
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', flag: '🇨🇦' },
  { code: 'MXN', symbol: 'MX$', name: 'Mexican Peso', flag: '🇲🇽' },

  // South America
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real', flag: '🇧🇷' },
  { code: 'ARS', symbol: 'AR$', name: 'Argentine Peso', flag: '🇦🇷' },
  { code: 'CLP', symbol: 'CLP$', name: 'Chilean Peso', flag: '🇨🇱' },
  { code: 'COP', symbol: 'COL$', name: 'Colombian Peso', flag: '🇨🇴' },
  { code: 'PEN', symbol: 'S/', name: 'Peruvian Sol', flag: '🇵🇪' },

  // Europe
  { code: 'SEK', symbol: 'kr', name: 'Swedish Krona', flag: '🇸🇪' },
  { code: 'NOK', symbol: 'kr', name: 'Norwegian Krone', flag: '🇳🇴' },
  { code: 'DKK', symbol: 'kr', name: 'Danish Krone', flag: '🇩🇰' },
  { code: 'PLN', symbol: 'zł', name: 'Polish Zloty', flag: '🇵🇱' },
  { code: 'CZK', symbol: 'Kč', name: 'Czech Koruna', flag: '🇨🇿' },
  { code: 'HUF', symbol: 'Ft', name: 'Hungarian Forint', flag: '🇭🇺' },
  { code: 'RON', symbol: 'lei', name: 'Romanian Leu', flag: '🇷🇴' },
  { code: 'BGN', symbol: 'лв', name: 'Bulgarian Lev', flag: '🇧🇬' },
  { code: 'HRK', symbol: 'kn', name: 'Croatian Kuna', flag: '🇭🇷' },
  { code: 'RUB', symbol: '₽', name: 'Russian Ruble', flag: '🇷🇺' },
  { code: 'UAH', symbol: '₴', name: 'Ukrainian Hryvnia', flag: '🇺🇦' },
  { code: 'TRY', symbol: '₺', name: 'Turkish Lira', flag: '🇹🇷' },

  // Asia Pacific
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', flag: '🇦🇺' },
  { code: 'NZD', symbol: 'NZ$', name: 'New Zealand Dollar', flag: '🇳🇿' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee', flag: '🇮🇳' },
  { code: 'KRW', symbol: '₩', name: 'South Korean Won', flag: '🇰🇷' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', flag: '🇸🇬' },
  { code: 'HKD', symbol: 'HK$', name: 'Hong Kong Dollar', flag: '🇭🇰' },
  { code: 'TWD', symbol: 'NT$', name: 'Taiwan Dollar', flag: '🇹🇼' },
  { code: 'THB', symbol: '฿', name: 'Thai Baht', flag: '🇹🇭' },
  { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit', flag: '🇲🇾' },
  { code: 'IDR', symbol: 'Rp', name: 'Indonesian Rupiah', flag: '🇮🇩' },
  { code: 'PHP', symbol: '₱', name: 'Philippine Peso', flag: '🇵🇭' },
  { code: 'VND', symbol: '₫', name: 'Vietnamese Dong', flag: '🇻🇳' },
  { code: 'PKR', symbol: '₨', name: 'Pakistani Rupee', flag: '🇵🇰' },
  { code: 'BDT', symbol: '৳', name: 'Bangladeshi Taka', flag: '🇧🇩' },
  { code: 'LKR', symbol: 'Rs', name: 'Sri Lankan Rupee', flag: '🇱🇰' },
  { code: 'NPR', symbol: 'रू', name: 'Nepalese Rupee', flag: '🇳🇵' },

  // Middle East
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham', flag: '🇦🇪' },
  { code: 'SAR', symbol: '﷼', name: 'Saudi Riyal', flag: '🇸🇦' },
  { code: 'QAR', symbol: 'ر.ق', name: 'Qatari Riyal', flag: '🇶🇦' },
  { code: 'KWD', symbol: 'د.ك', name: 'Kuwaiti Dinar', flag: '🇰🇼' },
  { code: 'BHD', symbol: 'ب.د', name: 'Bahraini Dinar', flag: '🇧🇭' },
  { code: 'OMR', symbol: 'ر.ع', name: 'Omani Rial', flag: '🇴🇲' },
  { code: 'JOD', symbol: 'د.ا', name: 'Jordanian Dinar', flag: '🇯🇴' },
  { code: 'ILS', symbol: '₪', name: 'Israeli Shekel', flag: '🇮🇱' },
  { code: 'IRR', symbol: '﷼', name: 'Iranian Rial', flag: '🇮🇷' },
  { code: 'IQD', symbol: 'ع.د', name: 'Iraqi Dinar', flag: '🇮🇶' },
  { code: 'LBP', symbol: 'ل.ل', name: 'Lebanese Pound', flag: '🇱🇧' },

  // Africa
  { code: 'ZAR', symbol: 'R', name: 'South African Rand', flag: '🇿🇦' },
  { code: 'NGN', symbol: '₦', name: 'Nigerian Naira', flag: '🇳🇬' },
  { code: 'EGP', symbol: 'E£', name: 'Egyptian Pound', flag: '🇪🇬' },
  { code: 'KES', symbol: 'KSh', name: 'Kenyan Shilling', flag: '🇰🇪' },
  { code: 'GHS', symbol: '₵', name: 'Ghanaian Cedi', flag: '🇬🇭' },
  { code: 'TZS', symbol: 'TSh', name: 'Tanzanian Shilling', flag: '🇹🇿' },
  { code: 'UGX', symbol: 'USh', name: 'Ugandan Shilling', flag: '🇺🇬' },
  { code: 'RWF', symbol: 'FRw', name: 'Rwandan Franc', flag: '🇷🇼' },
  { code: 'ETB', symbol: 'Br', name: 'Ethiopian Birr', flag: '🇪🇹' },
  { code: 'MAD', symbol: 'د.م', name: 'Moroccan Dirham', flag: '🇲🇦' },
  { code: 'TND', symbol: 'د.ت', name: 'Tunisian Dinar', flag: '🇹🇳' },
  { code: 'DZD', symbol: 'د.ج', name: 'Algerian Dinar', flag: '🇩🇿' },
  { code: 'XOF', symbol: 'CFA', name: 'West African CFA', flag: '🌍' },
  { code: 'XAF', symbol: 'FCFA', name: 'Central African CFA', flag: '🌍' },
  { code: 'ZMW', symbol: 'ZK', name: 'Zambian Kwacha', flag: '🇿🇲' },
  { code: 'BWP', symbol: 'P', name: 'Botswana Pula', flag: '🇧🇼' },
  { code: 'MUR', symbol: '₨', name: 'Mauritian Rupee', flag: '🇲🇺' },

  // Caribbean
  { code: 'JMD', symbol: 'J$', name: 'Jamaican Dollar', flag: '🇯🇲' },
  { code: 'TTD', symbol: 'TT$', name: 'Trinidad Dollar', flag: '🇹🇹' },
  { code: 'BBD', symbol: 'Bds$', name: 'Barbadian Dollar', flag: '🇧🇧' },
  { code: 'BSD', symbol: 'B$', name: 'Bahamian Dollar', flag: '🇧🇸' },
  { code: 'DOP', symbol: 'RD$', name: 'Dominican Peso', flag: '🇩🇴' },
  { code: 'CUP', symbol: '₱', name: 'Cuban Peso', flag: '🇨🇺' },
  { code: 'HTG', symbol: 'G', name: 'Haitian Gourde', flag: '🇭🇹' },
]

interface CurrencyState {
  currency: string
  setCurrency: (currency: string) => void
  convertAndFormat: (amount: number | undefined | null) => string
}

const currencyLocales: Record<string, string> = {
  // Major
  USD: 'en-US', EUR: 'de-DE', GBP: 'en-GB', JPY: 'ja-JP', CNY: 'zh-CN', CHF: 'de-CH',
  // North America
  CAD: 'en-CA', MXN: 'es-MX',
  // South America
  BRL: 'pt-BR', ARS: 'es-AR', CLP: 'es-CL', COP: 'es-CO', PEN: 'es-PE',
  // Europe
  SEK: 'sv-SE', NOK: 'nb-NO', DKK: 'da-DK', PLN: 'pl-PL', CZK: 'cs-CZ',
  HUF: 'hu-HU', RON: 'ro-RO', BGN: 'bg-BG', HRK: 'hr-HR', RUB: 'ru-RU',
  UAH: 'uk-UA', TRY: 'tr-TR',
  // Asia Pacific
  AUD: 'en-AU', NZD: 'en-NZ', INR: 'en-IN', KRW: 'ko-KR', SGD: 'en-SG',
  HKD: 'zh-HK', TWD: 'zh-TW', THB: 'th-TH', MYR: 'ms-MY', IDR: 'id-ID',
  PHP: 'en-PH', VND: 'vi-VN', PKR: 'en-PK', BDT: 'bn-BD', LKR: 'si-LK', NPR: 'ne-NP',
  // Middle East
  AED: 'ar-AE', SAR: 'ar-SA', QAR: 'ar-QA', KWD: 'ar-KW', BHD: 'ar-BH',
  OMR: 'ar-OM', JOD: 'ar-JO', ILS: 'he-IL', IRR: 'fa-IR', IQD: 'ar-IQ', LBP: 'ar-LB',
  // Africa
  ZAR: 'en-ZA', NGN: 'en-NG', EGP: 'ar-EG', KES: 'en-KE', GHS: 'en-GH',
  TZS: 'sw-TZ', UGX: 'en-UG', RWF: 'rw-RW', ETB: 'am-ET', MAD: 'ar-MA',
  TND: 'ar-TN', DZD: 'ar-DZ', XOF: 'fr-SN', XAF: 'fr-CM', ZMW: 'en-ZM',
  BWP: 'en-BW', MUR: 'en-MU',
  // Caribbean
  JMD: 'en-JM', TTD: 'en-TT', BBD: 'en-BB', BSD: 'en-BS', DOP: 'es-DO',
  CUP: 'es-CU', HTG: 'fr-HT',
}

export const useCurrencyStore = create<CurrencyState>()(
  persist(
    (set, get) => ({
      currency: 'GBP',
      setCurrency: (currency) => set({ currency }),
      convertAndFormat: (amount) => {
        const value = typeof amount === 'number' && !isNaN(amount) ? amount : 0
        const { currency } = get()
        const locale = currencyLocales[currency] || 'en-GB'
        return new Intl.NumberFormat(locale, {
          style: 'currency',
          currency,
          minimumFractionDigits: currency === 'JPY' ? 0 : 2,
          maximumFractionDigits: currency === 'JPY' ? 0 : 2,
        }).format(value)
      },
    }),
    {
      name: 'vendor-currency-storage',
    }
  )
)
