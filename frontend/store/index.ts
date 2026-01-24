import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import Cookies from 'js-cookie'

// User Store
interface User {
  id: string
  email: string
  first_name: string
  last_name: string
  phone?: string
  avatar_url?: string
  avatar?: string
  role: string
  is_verified: boolean
  is_vendor?: boolean
  vendor_id?: string
  vendor_slug?: string
}

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (user: User, accessToken: string, refreshToken?: string) => void
  logout: () => void
  setUser: (user: User) => void
  setLoading: (loading: boolean) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: true,
      login: (user, accessToken, refreshToken) => {
        Cookies.set('access_token', accessToken, { expires: 1 })
        if (refreshToken) {
          Cookies.set('refresh_token', refreshToken, { expires: 7 })
        }
        set({ user, isAuthenticated: true, isLoading: false })
      },
      logout: () => {
        // Clear all auth-related cookies
        Cookies.remove('access_token')
        Cookies.remove('refresh_token')
        // Clear the persisted auth state from localStorage
        if (typeof window !== 'undefined') {
          localStorage.removeItem('auth-storage')
        }
        set({ user: null, isAuthenticated: false, isLoading: false })
      },
      setUser: (user) => set({ user, isAuthenticated: true }),
      setLoading: (loading) => set({ isLoading: loading }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
      onRehydrateStorage: () => (state) => {
        // Validate tokens on rehydration
        if (state) {
          const hasToken = Cookies.get('access_token')
          if (!hasToken && state.isAuthenticated) {
            // Token is gone but state says authenticated - reset
            state.logout()
          } else {
            state.setLoading(false)
          }
        }
      },
    }
  )
)

// Cart Store
interface CartItem {
  id: string
  productId: string
  variantId?: string
  name: string
  slug?: string
  price: number
  image: string
  quantity: number
  maxQuantity?: number
  vendorName?: string
}

interface CartState {
  items: CartItem[]
  couponCode?: string
  discountAmount: number
  isOpen: boolean
  // Computed values
  subtotal: number
  total: number
  itemCount: number
  // Actions
  setCart: (data: any) => void
  addItem: (item: Omit<CartItem, 'id'> | { id: string; name: string; price: number; image: string; quantity: number; variantId?: string }) => void
  updateQuantity: (itemId: string, quantity: number) => void
  removeItem: (itemId: string) => void
  clearCart: () => void
  applyCoupon: (code: string, discountAmount: number) => void
  removeCoupon: () => void
  toggleCart: () => void
  openCart: () => void
  closeCart: () => void
}

const calculateTotals = (items: CartItem[], discountAmount: number) => {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const total = Math.max(0, subtotal - discountAmount)
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)
  return { subtotal, total, itemCount }
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      couponCode: undefined,
      discountAmount: 0,
      isOpen: false,
      subtotal: 0,
      total: 0,
      itemCount: 0,
      setCart: (data) => {
        const items = (data.items || []).map((item: any) => ({
          id: item.id,
          productId: item.product_id || item.productId || item.id,
          variantId: item.variant_id || item.variantId,
          name: item.product?.name || item.name,
          slug: item.product?.slug || item.slug,
          price: parseFloat(item.price || item.product?.price || 0),
          image: item.product?.primary_image || item.product?.image || item.image || '',
          quantity: item.quantity,
          maxQuantity: item.product?.quantity || item.maxQuantity,
          vendorName: item.product?.vendor_name || item.vendorName,
        }))
        const discountAmount = data.discount_amount || data.discountAmount || 0
        const totals = calculateTotals(items, discountAmount)
        set({
          items,
          couponCode: data.coupon_code || data.couponCode,
          discountAmount,
          ...totals,
        })
      },
      addItem: (item) =>
        set((state) => {
          const newItem: CartItem = {
            id: 'id' in item ? item.id : `cart-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            productId: 'productId' in item ? item.productId : item.id,
            variantId: item.variantId,
            name: item.name,
            slug: 'slug' in item ? item.slug : undefined,
            price: item.price,
            image: item.image,
            quantity: item.quantity,
            maxQuantity: 'maxQuantity' in item ? item.maxQuantity : undefined,
            vendorName: 'vendorName' in item ? item.vendorName : undefined,
          }

          // Check if item already exists
          const existingIndex = state.items.findIndex(
            (i) => i.productId === newItem.productId && i.variantId === newItem.variantId
          )

          let newItems: CartItem[]
          if (existingIndex > -1) {
            // Update quantity of existing item
            newItems = state.items.map((i, idx) =>
              idx === existingIndex
                ? { ...i, quantity: i.quantity + newItem.quantity }
                : i
            )
          } else {
            newItems = [...state.items, newItem]
          }

          const totals = calculateTotals(newItems, state.discountAmount)
          return { items: newItems, ...totals, isOpen: true }
        }),
      updateQuantity: (itemId, quantity) =>
        set((state) => {
          const newItems = state.items.map((item) =>
            item.id === itemId ? { ...item, quantity: Math.max(1, quantity) } : item
          )
          const totals = calculateTotals(newItems, state.discountAmount)
          return { items: newItems, ...totals }
        }),
      removeItem: (itemId) =>
        set((state) => {
          const newItems = state.items.filter((item) => item.id !== itemId)
          const totals = calculateTotals(newItems, state.discountAmount)
          return { items: newItems, ...totals }
        }),
      clearCart: () =>
        set({
          items: [],
          subtotal: 0,
          total: 0,
          itemCount: 0,
          couponCode: undefined,
          discountAmount: 0,
        }),
      applyCoupon: (code, discountAmount) =>
        set((state) => {
          const totals = calculateTotals(state.items, discountAmount)
          return { couponCode: code, discountAmount, ...totals }
        }),
      removeCoupon: () =>
        set((state) => {
          const totals = calculateTotals(state.items, 0)
          return { couponCode: undefined, discountAmount: 0, ...totals }
        }),
      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
    }),
    {
      name: 'cart-storage',
      partialize: (state) => ({
        items: state.items,
        couponCode: state.couponCode,
        discountAmount: state.discountAmount,
        subtotal: state.subtotal,
        total: state.total,
        itemCount: state.itemCount,
      }),
      merge: (persistedState: any, currentState) => {
        // Recalculate totals if not present or if items exist but totals are 0
        const items = persistedState?.items || []
        const discountAmount = persistedState?.discountAmount || 0
        const needsRecalc = items.length > 0 && (!persistedState?.subtotal || persistedState.subtotal === 0)

        if (needsRecalc) {
          const totals = calculateTotals(items, discountAmount)
          return {
            ...currentState,
            ...persistedState,
            ...totals,
          }
        }

        return {
          ...currentState,
          ...persistedState,
        }
      },
    }
  )
)

// Wishlist Store
export interface WishlistItem {
  id: string
  productId: string
  name: string
  slug: string
  price: number
  compareAtPrice?: number
  image?: string
}

interface WishlistState {
  items: WishlistItem[]
  addItem: (item: WishlistItem) => void
  removeItem: (productId: string) => void
  isInWishlist: (productId: string) => boolean
  clearWishlist: () => void
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) =>
        set((state) => ({
          items: state.items.some((i) => i.productId === item.productId)
            ? state.items
            : [...state.items, item],
        })),
      removeItem: (productId) =>
        set((state) => ({
          items: state.items.filter((item) => item.productId !== productId),
        })),
      isInWishlist: (productId) => get().items.some((item) => item.productId === productId),
      clearWishlist: () => set({ items: [] }),
    }),
    {
      name: 'wishlist-storage',
    }
  )
)

// Search Store
interface SearchState {
  query: string
  isOpen: boolean
  recentSearches: string[]
  setQuery: (query: string) => void
  openSearch: () => void
  closeSearch: () => void
  addRecentSearch: (query: string) => void
  clearRecentSearches: () => void
}

export const useSearchStore = create<SearchState>()(
  persist(
    (set) => ({
      query: '',
      isOpen: false,
      recentSearches: [],
      setQuery: (query) => set({ query }),
      openSearch: () => set({ isOpen: true }),
      closeSearch: () => set({ isOpen: false }),
      addRecentSearch: (query) =>
        set((state) => ({
          recentSearches: [
            query,
            ...state.recentSearches.filter((s) => s !== query),
          ].slice(0, 10),
        })),
      clearRecentSearches: () => set({ recentSearches: [] }),
    }),
    {
      name: 'search-storage',
      partialize: (state) => ({ recentSearches: state.recentSearches }),
    }
  )
)

// Currency Store
export interface Currency {
  code: string
  symbol: string
  name: string
  flag: string
}

export const currencies: Currency[] = [
  { code: 'GBP', symbol: '£', name: 'British Pound', flag: '🇬🇧' },
  { code: 'USD', symbol: '$', name: 'US Dollar', flag: '🇺🇸' },
  { code: 'EUR', symbol: '€', name: 'Euro', flag: '🇪🇺' },
  { code: 'NGN', symbol: '₦', name: 'Nigerian Naira', flag: '🇳🇬' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', flag: '🇨🇦' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', flag: '🇦🇺' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee', flag: '🇮🇳' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen', flag: '🇯🇵' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan', flag: '🇨🇳' },
  { code: 'KRW', symbol: '₩', name: 'South Korean Won', flag: '🇰🇷' },
  { code: 'ZAR', symbol: 'R', name: 'South African Rand', flag: '🇿🇦' },
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real', flag: '🇧🇷' },
  { code: 'MXN', symbol: 'MX$', name: 'Mexican Peso', flag: '🇲🇽' },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham', flag: '🇦🇪' },
  { code: 'SAR', symbol: '﷼', name: 'Saudi Riyal', flag: '🇸🇦' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', flag: '🇸🇬' },
  { code: 'HKD', symbol: 'HK$', name: 'Hong Kong Dollar', flag: '🇭🇰' },
  { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc', flag: '🇨🇭' },
  { code: 'SEK', symbol: 'kr', name: 'Swedish Krona', flag: '🇸🇪' },
  { code: 'NZD', symbol: 'NZ$', name: 'New Zealand Dollar', flag: '🇳🇿' },
  { code: 'GHS', symbol: '₵', name: 'Ghanaian Cedi', flag: '🇬🇭' },
  { code: 'KES', symbol: 'KSh', name: 'Kenyan Shilling', flag: '🇰🇪' },
  { code: 'EGP', symbol: 'E£', name: 'Egyptian Pound', flag: '🇪🇬' },
  { code: 'PKR', symbol: '₨', name: 'Pakistani Rupee', flag: '🇵🇰' },
]

// Country to currency mapping
const countryToCurrency: Record<string, string> = {
  GB: 'GBP', UK: 'GBP', US: 'USD', NG: 'NGN', CA: 'CAD', AU: 'AUD',
  IN: 'INR', JP: 'JPY', CN: 'CNY', KR: 'KRW', ZA: 'ZAR', BR: 'BRL',
  MX: 'MXN', AE: 'AED', SA: 'SAR', SG: 'SGD', HK: 'HKD', CH: 'CHF',
  SE: 'SEK', NZ: 'NZD', GH: 'GHS', KE: 'KES', EG: 'EGP', PK: 'PKR',
  DE: 'EUR', FR: 'EUR', IT: 'EUR', ES: 'EUR', NL: 'EUR', BE: 'EUR',
  AT: 'EUR', IE: 'EUR', PT: 'EUR', GR: 'EUR', FI: 'EUR',
}

// Exchange rates (base: GBP) - approximate rates for demo purposes
// In production, these would be fetched from an API like exchangerate-api.com
export const exchangeRates: Record<string, number> = {
  GBP: 1,
  USD: 1.27,
  EUR: 1.17,
  NGN: 1980,
  CAD: 1.72,
  AUD: 1.93,
  INR: 105.5,
  JPY: 189.5,
  CNY: 9.18,
  KRW: 1680,
  ZAR: 23.8,
  BRL: 6.18,
  MXN: 21.7,
  AED: 4.66,
  SAR: 4.76,
  SGD: 1.71,
  HKD: 9.92,
  CHF: 1.12,
  SEK: 13.2,
  NZD: 2.09,
  GHS: 15.8,
  KES: 163,
  EGP: 39.2,
  PKR: 354,
}

// Convert price from GBP to target currency
export const convertPrice = (priceInGBP: number, targetCurrency: string): number => {
  const rate = exchangeRates[targetCurrency] || 1
  return priceInGBP * rate
}

interface CurrencyState {
  currency: Currency
  country: string | null
  isLoading: boolean
  isHydrated: boolean
  setCurrency: (currencyCode: string) => void
  setCountry: (country: string) => void
  detectCountry: () => Promise<void>
  convertAndFormat: (priceInGBP: number) => string
  formatBasePrice: (priceInGBP: number) => string
  setHydrated: () => void
}

export const useCurrencyStore = create<CurrencyState>()(
  persist(
    (set, get) => ({
      currency: currencies[0], // Default to GBP
      country: null,
      isLoading: false,
      isHydrated: false,
      setHydrated: () => set({ isHydrated: true }),
      setCurrency: (currencyCode) => {
        const currency = currencies.find(c => c.code === currencyCode)
        if (currency) {
          set({ currency })
        }
      },
      setCountry: (country) => {
        set({ country })
        // Set currency based on country
        const currencyCode = countryToCurrency[country] || 'GBP'
        const currency = currencies.find(c => c.code === currencyCode)
        if (currency) {
          set({ currency })
        }
      },
      detectCountry: async () => {
        // Only detect if country is not already set
        if (get().country) return

        set({ isLoading: true })
        try {
          // Use ipapi.co for country detection (free tier)
          const response = await fetch('https://ipapi.co/json/')
          const data = await response.json()
          if (data.country_code) {
            get().setCountry(data.country_code)
          }
        } catch (error) {
          console.error('Failed to detect country:', error)
        } finally {
          set({ isLoading: false })
        }
      },
      // Format price in base currency (GBP) - safe for SSR
      formatBasePrice: (priceInGBP: number) => {
        return new Intl.NumberFormat('en-GB', {
          style: 'currency',
          currency: 'GBP',
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(priceInGBP)
      },
      convertAndFormat: (priceInGBP: number) => {
        const { currency } = get()

        const rate = exchangeRates[currency.code] || 1
        const convertedPrice = priceInGBP * rate

        // Format the price with the appropriate locale
        const locales: Record<string, string> = {
          GBP: 'en-GB', USD: 'en-US', EUR: 'de-DE', NGN: 'en-NG',
          CAD: 'en-CA', AUD: 'en-AU', INR: 'en-IN', JPY: 'ja-JP',
          CNY: 'zh-CN', KRW: 'ko-KR', ZAR: 'en-ZA', BRL: 'pt-BR',
          MXN: 'es-MX', AED: 'ar-AE', SAR: 'ar-SA', SGD: 'en-SG',
          HKD: 'zh-HK', CHF: 'de-CH', SEK: 'sv-SE', NZD: 'en-NZ',
          GHS: 'en-GH', KES: 'en-KE', EGP: 'ar-EG', PKR: 'en-PK',
        }

        const locale = locales[currency.code] || 'en-GB'
        return new Intl.NumberFormat(locale, {
          style: 'currency',
          currency: currency.code,
          minimumFractionDigits: currency.code === 'JPY' || currency.code === 'KRW' ? 0 : 2,
          maximumFractionDigits: currency.code === 'JPY' || currency.code === 'KRW' ? 0 : 2,
        }).format(convertedPrice)
      },
    }),
    {
      name: 'currency-storage',
      partialize: (state) => ({
        currency: state.currency,
        country: state.country,
      }),
      onRehydrateStorage: () => (state) => {
        // Mark as hydrated after rehydration completes
        if (state) {
          state.setHydrated()
        }
      },
    }
  )
)
