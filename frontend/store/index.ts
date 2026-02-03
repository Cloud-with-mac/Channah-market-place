import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import Cookies from 'js-cookie'
import { cartAPI, wishlistAPI } from '@/lib/api'

// Re-export comparison store
export { useComparisonStore, type ComparisonProduct } from './comparison-store'

// Re-export collections store
export { useCollectionsStore, type Collection } from './collections-store'

// Re-export alerts store
export { useAlertsStore, type PriceAlert, type RestockAlert } from './alerts-store'

// Re-export sample cart store
export { useSampleCartStore, type SampleItem } from './sample-cart-store'

// Re-export RFQ store
export { useRFQStore, type RFQ, type RFQQuote, type RFQSpecification } from './rfq-store'

// Re-export customs store
export {
  useCustomsStore,
  type HSCodeItem,
  type CountryRequirement,
  type DocumentType,
  type CustomsBroker,
  type ChecklistItem,
  type CustomsClearanceRecord
} from './customs-store'

// Re-export bulk order store
export { useBulkOrderStore, type BulkOrderItem, type BulkOrderTemplate } from './bulk-order-store'

// Re-export OEM store
export {
  useOEMStore,
  type OEMRequest,
  type OEMQuote,
  type BrandingSpecification,
  type DesignMockup,
  type ProductionMilestone,
} from './oem-store'

// Re-export recommendations store
export { useRecommendationsStore, type Product as RecommendationProduct } from './recommendations-store'

// Re-export sustainability store
export {
  useSustainabilityStore,
  certificationDetails,
  type EcoProduct,
  type GreenSupplier,
  type CarbonCalculation,
  type OffsetProgram,
  type OffsetPurchase,
  type EnvironmentalReport,
  type Certification,
  type CertificationType as SustainabilityCertificationType,
  type SustainabilityMetrics
} from './sustainability-store'

// Re-export warehouse store
export {
  useWarehouseStore,
  type WarehouseLocation,
  type InventoryItem,
  type StockMovement,
  type BinLocation,
  type StorageRequest,
  type FulfillmentService,
  type WarehouseFee,
  type CapacityMetrics,
  type WarehouseAnalytics,
} from './warehouse-store'

// Re-export dispute store
export {
  useDisputeStore,
  type Dispute,
  type DisputeType,
  type DisputeStatus,
  type DisputePriority,
  type EvidenceType,
  type ResolutionType,
  type DisputeEvidence,
  type DisputeMessage,
  type DisputeTimeline,
  type ResolutionProposal,
  type DisputeFilters,
  type DisputeStats,
} from './dispute-store'

// Re-export contract store
export {
  useContractStore,
  type Contract,
  type ContractTemplate,
  type ContractVariable,
  type ContractSignature,
  type ContractTemplateType,
  type AuditEvent,
} from './contract-store'

// Re-export finance store
export {
  useFinanceStore,
  type FinanceTermType,
  type ApplicationStatus,
  type PaymentPlanType,
  type FinancePartner,
  type TradeCreditApplication,
  type CreditLine,
  type PaymentPlan,
  type InvoiceFactoring,
  type PaymentSchedule
} from './finance-store'

// Re-export verification store
export {
  useVerificationStore,
  type VerificationStatus,
  type BadgeLevel,
  type DocumentType as VerificationDocumentType,
  type CertificationType,
  type VerificationBadge,
  type FactoryAudit,
  type ComplianceCertification,
  type Document,
  type SupplierVerification,
  type AuditRequest,
} from './verification-store'

// Re-export supplier directory store
export {
  useSupplierDirectoryStore,
  type SupplierProfile,
  type SupplierReview,
  type FavoriteSupplier,
  type SearchHistory,
  type SupplierFilters,
} from './supplier-directory-store'

// Re-export freight store
export {
  useFreightStore,
  type FreightForwarder,
  type FreightForwarderServiceArea,
  type FreightForwarderCertification,
  type ShippingQuote,
  type ShippingQuoteLineItem,
  type Booking,
  type Shipment,
  type TrackingEvent,
  type TrackingStatus,
  type PartnerRating,
  type FreightRFQ,
  type ShippingMode,
  type QuoteStatus,
  type BookingStatus,
  type IncoTerm,
  type RatingCategory
} from './freight-store'

// User Store
interface User {
  id: string
  email: string
  first_name: string
  last_name: string
  phone?: string | null
  avatar_url?: string | null
  avatar?: string
  role: string
  is_verified: boolean
  is_vendor?: boolean
  vendor_id?: string | null
  vendor_slug?: string | null
  [key: string]: any
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
        // SECURITY FIX: Tokens are now in HTTP-only cookies set by backend
        // No need to set tokens in js-cookie or localStorage
        // Just update the auth state
        set({ user, isAuthenticated: true, isLoading: false })
      },
      logout: () => {
        // SECURITY FIX: Backend clears HTTP-only cookies on logout
        // Just clear the persisted Zustand state
        if (typeof window !== 'undefined') {
          localStorage.removeItem('auth-storage')
          localStorage.removeItem('cart-storage')
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
        // SECURITY FIX: Tokens are in HTTP-only cookies (can't check with JS)
        // Just set loading to false - API calls will fail if token is invalid
        // and trigger the 401 interceptor which will redirect to login
        if (state) {
          state.setLoading(false)
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
  shippingCost?: number
}

interface CartState {
  items: CartItem[]
  couponCode?: string
  discountAmount: number
  isOpen: boolean
  isLoading: boolean
  // Computed values
  subtotal: number
  total: number
  itemCount: number
  // Actions
  setCart: (data: any) => void
  fetchCart: () => Promise<void>
  addItem: (item: Omit<CartItem, 'id'> | { id: string; name: string; price: number; image: string; quantity: number; variantId?: string; productId?: string }) => Promise<void>
  updateQuantity: (itemId: string, quantity: number) => Promise<void>
  removeItem: (itemId: string) => Promise<void>
  clearCart: () => Promise<void>
  applyCoupon: (code: string) => Promise<void>
  removeCoupon: () => Promise<void>
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
      isLoading: false,
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
          shippingCost: parseFloat(item.product?.shipping_cost || item.shippingCost || 0),
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
      fetchCart: async () => {
        try {
          set({ isLoading: true })
          const response = await cartAPI.get()
          get().setCart(response)
        } catch (error) {
          console.error('Failed to fetch cart:', error)
        } finally {
          set({ isLoading: false })
        }
      },
      addItem: async (item) => {
        try {
          set({ isLoading: true })
          const productId = ('productId' in item ? item.productId : item.id) || ''

          // Call backend API
          await cartAPI.addItem(productId, item.quantity, item.variantId)

          // Fetch updated cart from backend
          await get().fetchCart()

          // Open cart drawer
          set({ isOpen: true })
        } catch (error) {
          console.error('Failed to add item to cart:', error)
          set({ isLoading: false })
          throw error
        }
      },
      updateQuantity: async (itemId, quantity) => {
        try {
          set({ isLoading: true })
          await cartAPI.updateItem(itemId, quantity)
          await get().fetchCart()
        } catch (error: any) {
          console.error('Failed to update quantity:', error)
          // If 404, item doesn't exist in backend — remove stale item locally
          if (error?.response?.status === 404) {
            set((state) => {
              const newItems = state.items.filter((item) => item.id !== itemId)
              const totals = calculateTotals(newItems, state.discountAmount)
              return { items: newItems, ...totals, isLoading: false }
            })
          } else {
            set({ isLoading: false })
          }
        }
      },
      removeItem: async (itemId) => {
        try {
          set({ isLoading: true })
          await cartAPI.removeItem(itemId)
          await get().fetchCart()
        } catch (error: any) {
          console.error('Failed to remove item:', error)
          // If 404, item doesn't exist in backend — remove locally
          if (error?.response?.status === 404) {
            set((state) => {
              const newItems = state.items.filter((item) => item.id !== itemId)
              const totals = calculateTotals(newItems, state.discountAmount)
              return { items: newItems, ...totals, isLoading: false }
            })
          } else {
            set({ isLoading: false })
          }
        }
      },
      clearCart: async () => {
        try {
          set({ isLoading: true })
          await cartAPI.clear()
          set({
            items: [],
            subtotal: 0,
            total: 0,
            itemCount: 0,
            couponCode: undefined,
            discountAmount: 0,
            isLoading: false,
          })
        } catch (error) {
          console.error('Failed to clear cart:', error)
          // Clear local cart anyway
          set({
            items: [],
            subtotal: 0,
            total: 0,
            itemCount: 0,
            couponCode: undefined,
            discountAmount: 0,
            isLoading: false,
          })
        }
      },
      applyCoupon: async (code) => {
        try {
          set({ isLoading: true })
          const response = await cartAPI.applyCoupon(code)
          get().setCart(response)
        } catch (error) {
          console.error('Failed to apply coupon:', error)
          set({ isLoading: false })
          throw error
        }
      },
      removeCoupon: async () => {
        try {
          set({ isLoading: true })
          await cartAPI.removeCoupon()
          await get().fetchCart()
        } catch (error) {
          console.error('Failed to remove coupon:', error)

          // Fallback to local removal
          set((state) => {
            const totals = calculateTotals(state.items, 0)
            return { couponCode: undefined, discountAmount: 0, ...totals, isLoading: false }
          })
        }
      },
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
  isLoading: boolean
  fetchWishlist: () => Promise<void>
  addItem: (item: WishlistItem) => Promise<void>
  removeItem: (productId: string) => Promise<void>
  isInWishlist: (productId: string) => boolean
  clearWishlist: () => Promise<void>
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],
      isLoading: false,
      fetchWishlist: async () => {
        try {
          set({ isLoading: true })
          const response = await wishlistAPI.get()
          const items = (response.items || response || []).map((item: any) => ({
            id: item.id,
            productId: item.product_id || item.productId,
            name: item.product?.name || item.name,
            slug: item.product?.slug || item.slug,
            price: parseFloat(item.product?.price || item.price || 0),
            compareAtPrice: item.product?.compare_at_price || item.compareAtPrice,
            image: item.product?.primary_image || item.product?.image || item.image,
          }))
          set({ items, isLoading: false })
        } catch (error) {
          console.error('Failed to fetch wishlist:', error)
          set({ isLoading: false })
          // Keep local state on error
        }
      },
      addItem: async (item) => {
        try {
          set({ isLoading: true })
          await wishlistAPI.add(item.productId)

          // Add to local state optimistically
          set((state) => ({
            items: state.items.some((i) => i.productId === item.productId)
              ? state.items
              : [...state.items, item],
            isLoading: false,
          }))
        } catch (error) {
          console.error('Failed to add to wishlist:', error)

          // Fallback to local-only mode
          set((state) => ({
            items: state.items.some((i) => i.productId === item.productId)
              ? state.items
              : [...state.items, item],
            isLoading: false,
          }))
        }
      },
      removeItem: async (productId) => {
        try {
          set({ isLoading: true })
          await wishlistAPI.remove(productId)

          // Remove from local state optimistically
          set((state) => ({
            items: state.items.filter((item) => item.productId !== productId),
            isLoading: false,
          }))
        } catch (error) {
          console.error('Failed to remove from wishlist:', error)

          // Fallback to local removal
          set((state) => ({
            items: state.items.filter((item) => item.productId !== productId),
            isLoading: false,
          }))
        }
      },
      isInWishlist: (productId) => get().items.some((item) => item.productId === productId),
      clearWishlist: async () => {
        try {
          set({ isLoading: true })
          // Clear from backend by removing each item
          const items = get().items
          await Promise.all(items.map(item => wishlistAPI.remove(item.productId)))
          set({ items: [], isLoading: false })
        } catch (error) {
          console.error('Failed to clear wishlist:', error)
          // Clear local anyway
          set({ items: [], isLoading: false })
        }
      },
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

// Fallback exchange rates (base: GBP) - used when live API is unreachable
const FALLBACK_RATES: Record<string, number> = {
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

// Legacy export for backward compatibility - reads live rates from store when available
export const exchangeRates: Record<string, number> = { ...FALLBACK_RATES }

// Convert price from GBP to target currency
export const convertPrice = (priceInGBP: number, targetCurrency: string): number => {
  const rate = exchangeRates[targetCurrency] || 1
  return priceInGBP * rate
}

interface CurrencyState {
  currency: Currency
  country: string | null
  exchangeRates: Record<string, number>
  isLoading: boolean
  isHydrated: boolean
  setCurrency: (currencyCode: string) => void
  setCountry: (country: string) => void
  detectCountry: () => Promise<void>
  fetchExchangeRates: () => Promise<void>
  convertAndFormat: (priceInGBP: number) => string
  formatBasePrice: (priceInGBP: number) => string
  setHydrated: () => void
}

export const useCurrencyStore = create<CurrencyState>()(
  persist(
    (set, get) => ({
      currency: currencies[0], // Default to GBP
      country: null,
      exchangeRates: { ...FALLBACK_RATES },
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
      fetchExchangeRates: async () => {
        try {
          const res = await fetch('https://api.exchangerate-api.com/v4/latest/GBP', {
            signal: AbortSignal.timeout(5000),
          })
          const data = await res.json()
          if (data?.rates) {
            const updated: Record<string, number> = { GBP: 1 }
            for (const code of Object.keys(FALLBACK_RATES)) {
              if (data.rates[code]) updated[code] = data.rates[code]
            }
            set({ exchangeRates: updated })
            // Also update the legacy exported object for backward compatibility
            Object.assign(exchangeRates, updated)
          }
        } catch {
          // Keep fallback rates
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
        const { currency, exchangeRates: rates } = get()

        const rate = rates[currency.code] || 1
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
