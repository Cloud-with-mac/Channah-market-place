import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface SupplierProfile {
  id: string
  businessName: string
  slug: string
  description: string
  logo?: string
  banner?: string
  rating: number
  reviewCount: number

  // Location Information
  country: string
  state?: string
  city?: string
  address?: string

  // Business Information
  industry: string
  subIndustries: string[]
  yearEstablished: number
  employeeCount: string
  companySize: 'small' | 'medium' | 'large' | 'enterprise'

  // B2B Specific
  moq: number // Minimum Order Quantity
  productCategories: string[]
  leadTime: string
  paymentTerms: string[]
  priceRange: {
    min: number
    max: number
  }

  // Certifications & Compliance
  certifications: string[]
  verified: boolean
  verifiedAt?: string
  complianceRatings: {
    quality: number
    delivery: number
    communication: number
    pricingAccuracy: number
  }

  // Trading Metrics
  totalProducts: number
  totalOrders: number
  responseTime: string
  cancellationRate: number
  returnRate: number

  // Contact Information
  contactEmail: string
  contactPhone?: string
  website?: string
  socialLinks?: {
    linkedin?: string
    twitter?: string
    facebook?: string
  }

  // Images
  galleryImages: string[]

  // Additional Info
  languages: string[]
  acceptedCurrencies: string[]
  shipmentsPerMonth: number
  minimumOrderValue: number

  createdAt: string
  updatedAt: string
}

export interface SupplierReview {
  id: string
  supplierId: string
  buyerId: string
  buyerName: string
  buyerLogo?: string
  rating: number
  title: string
  comment: string
  categories: string[]
  helpful: number
  verified: boolean
  createdAt: string
}

export interface FavoriteSupplier {
  id: string
  supplierId: string
  addedAt: string
  notes?: string
}

export interface SearchHistory {
  id: string
  query: string
  filters: SupplierFilters
  timestamp: string
}

export interface SupplierFilters {
  industries?: string[]
  countries?: string[]
  minRating?: number
  minMOQ?: number
  maxMOQ?: number
  certifications?: string[]
  minLeadDays?: number
  maxLeadDays?: number
  companySize?: ('small' | 'medium' | 'large' | 'enterprise')[]
  priceRange?: {
    min: number
    max: number
  }
  verified?: boolean
  hasGallery?: boolean
}

interface SupplierDirectoryState {
  // Data
  suppliers: SupplierProfile[]
  reviews: Map<string, SupplierReview[]>
  favorites: FavoriteSupplier[]
  searchHistory: SearchHistory[]

  // UI State
  isLoading: boolean
  selectedSupplierId?: string
  viewMode: 'grid' | 'list'

  // CRUD - Suppliers
  addSupplier: (supplier: Omit<SupplierProfile, 'id' | 'createdAt' | 'updatedAt'>) => string
  updateSupplier: (id: string, updates: Partial<SupplierProfile>) => void
  deleteSupplier: (id: string) => void
  getSupplier: (id: string) => SupplierProfile | undefined
  getAllSuppliers: () => SupplierProfile[]

  // Search & Filter
  searchSuppliers: (query: string, filters: SupplierFilters) => SupplierProfile[]
  filterSuppliers: (filters: SupplierFilters) => SupplierProfile[]

  // Reviews
  addReview: (supplierId: string, review: Omit<SupplierReview, 'id' | 'createdAt'>) => string
  getSupplierReviews: (supplierId: string) => SupplierReview[]
  updateReviewHelpful: (reviewId: string) => void

  // Favorites
  addToFavorites: (supplierId: string, notes?: string) => void
  removeFromFavorites: (supplierId: string) => void
  isFavorite: (supplierId: string) => boolean
  getFavoriteSuppliers: () => SupplierProfile[]

  // Search History
  addSearchHistory: (query: string, filters: SupplierFilters) => void
  getSearchHistory: () => SearchHistory[]
  clearSearchHistory: () => void

  // Analytics
  getSupplierStats: (supplierId: string) => {
    rating: number
    reviewCount: number
    responseTime: string
    cancellationRate: number
    complianceScore: number
  } | undefined

  // UI Actions
  setViewMode: (mode: 'grid' | 'list') => void
  setSelectedSupplier: (id?: string) => void
  setLoading: (loading: boolean) => void
}

export const useSupplierDirectoryStore = create<SupplierDirectoryState>()(
  persist(
    (set, get) => ({
      suppliers: [],
      reviews: new Map(),
      favorites: [],
      searchHistory: [],
      isLoading: false,
      viewMode: 'grid',

      // Suppliers CRUD
      addSupplier: (supplierData) => {
        const newSupplier: SupplierProfile = {
          ...supplierData,
          id: `supplier-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }

        set((state) => ({
          suppliers: [...state.suppliers, newSupplier],
        }))

        return newSupplier.id
      },

      updateSupplier: (id, updates) => {
        set((state) => ({
          suppliers: state.suppliers.map((supplier) =>
            supplier.id === id
              ? {
                  ...supplier,
                  ...updates,
                  updatedAt: new Date().toISOString(),
                }
              : supplier
          ),
        }))
      },

      deleteSupplier: (id) => {
        set((state) => ({
          suppliers: state.suppliers.filter((supplier) => supplier.id !== id),
        }))
      },

      getSupplier: (id) => {
        return get().suppliers.find((supplier) => supplier.id === id)
      },

      getAllSuppliers: () => {
        return get().suppliers
      },

      // Search & Filter
      searchSuppliers: (query, filters) => {
        const suppliers = get().suppliers

        return suppliers.filter((supplier) => {
          // Text search
          const matchesQuery = query === '' ||
            supplier.businessName.toLowerCase().includes(query.toLowerCase()) ||
            supplier.description.toLowerCase().includes(query.toLowerCase()) ||
            supplier.industry.toLowerCase().includes(query.toLowerCase()) ||
            supplier.subIndustries.some(sub => sub.toLowerCase().includes(query.toLowerCase())) ||
            supplier.productCategories.some(cat => cat.toLowerCase().includes(query.toLowerCase()))

          if (!matchesQuery) return false

          // Apply filters
          return get().filterSuppliers(filters).some(f => f.id === supplier.id)
        })
      },

      filterSuppliers: (filters) => {
        let result = get().suppliers

        // Industry filter
        if (filters.industries && filters.industries.length > 0) {
          result = result.filter(
            (supplier) =>
              supplier.industry === filters.industries![0] ||
              supplier.subIndustries.some((sub) =>
                filters.industries!.includes(sub)
              )
          )
        }

        // Country filter
        if (filters.countries && filters.countries.length > 0) {
          result = result.filter((supplier) =>
            filters.countries!.includes(supplier.country)
          )
        }

        // Rating filter
        if (filters.minRating !== undefined) {
          result = result.filter((supplier) => supplier.rating >= filters.minRating!)
        }

        // MOQ filter
        if (filters.minMOQ !== undefined) {
          result = result.filter((supplier) => supplier.moq <= filters.minMOQ!)
        }
        if (filters.maxMOQ !== undefined) {
          result = result.filter((supplier) => supplier.moq <= filters.maxMOQ!)
        }

        // Certifications filter
        if (filters.certifications && filters.certifications.length > 0) {
          result = result.filter((supplier) =>
            filters.certifications!.some((cert) =>
              supplier.certifications.includes(cert)
            )
          )
        }

        // Lead time filter
        if (filters.minLeadDays !== undefined || filters.maxLeadDays !== undefined) {
          result = result.filter((supplier) => {
            const leadDays = parseInt(supplier.leadTime.match(/\d+/)?.[0] || '0')
            if (filters.minLeadDays !== undefined && leadDays < filters.minLeadDays) return false
            if (filters.maxLeadDays !== undefined && leadDays > filters.maxLeadDays) return false
            return true
          })
        }

        // Company size filter
        if (filters.companySize && filters.companySize.length > 0) {
          result = result.filter((supplier) =>
            filters.companySize!.includes(supplier.companySize)
          )
        }

        // Price range filter
        if (filters.priceRange) {
          result = result.filter(
            (supplier) =>
              supplier.priceRange.max >= filters.priceRange!.min &&
              supplier.priceRange.min <= filters.priceRange!.max
          )
        }

        // Verified filter
        if (filters.verified) {
          result = result.filter((supplier) => supplier.verified)
        }

        // Gallery filter
        if (filters.hasGallery) {
          result = result.filter((supplier) => supplier.galleryImages.length > 0)
        }

        return result
      },

      // Reviews
      addReview: (supplierId, reviewData) => {
        const newReview: SupplierReview = {
          ...reviewData,
          id: `review-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          createdAt: new Date().toISOString(),
        }

        set((state) => {
          const reviews = new Map(state.reviews)
          const supplierReviews = reviews.get(supplierId) || []
          reviews.set(supplierId, [...supplierReviews, newReview])

          // Update supplier rating
          const supplier = state.suppliers.find((s) => s.id === supplierId)
          if (supplier) {
            const allReviews = reviews.get(supplierId) || []
            const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length
            const updatedSupplier = {
              ...supplier,
              rating: parseFloat(avgRating.toFixed(1)),
              reviewCount: allReviews.length,
            }
            return {
              reviews,
              suppliers: state.suppliers.map((s) =>
                s.id === supplierId ? updatedSupplier : s
              ),
            }
          }

          return { reviews }
        })

        return newReview.id
      },

      getSupplierReviews: (supplierId) => {
        return get().reviews.get(supplierId) || []
      },

      updateReviewHelpful: (reviewId) => {
        set((state) => {
          const reviews = new Map(state.reviews)
          reviews.forEach((supplierReviews) => {
            const review = supplierReviews.find((r) => r.id === reviewId)
            if (review) {
              review.helpful += 1
            }
          })
          return { reviews }
        })
      },

      // Favorites
      addToFavorites: (supplierId, notes) => {
        set((state) => {
          const existing = state.favorites.find((f) => f.supplierId === supplierId)
          if (existing) return state

          return {
            favorites: [
              ...state.favorites,
              {
                id: `favorite-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                supplierId,
                addedAt: new Date().toISOString(),
                notes,
              },
            ],
          }
        })
      },

      removeFromFavorites: (supplierId) => {
        set((state) => ({
          favorites: state.favorites.filter((f) => f.supplierId !== supplierId),
        }))
      },

      isFavorite: (supplierId) => {
        return get().favorites.some((f) => f.supplierId === supplierId)
      },

      getFavoriteSuppliers: () => {
        const state = get()
        const favoriteIds = new Set(state.favorites.map((f) => f.supplierId))
        return state.suppliers.filter((s) => favoriteIds.has(s.id))
      },

      // Search History
      addSearchHistory: (query, filters) => {
        set((state) => ({
          searchHistory: [
            {
              id: `search-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              query,
              filters,
              timestamp: new Date().toISOString(),
            },
            ...state.searchHistory,
          ].slice(0, 20), // Keep only last 20 searches
        }))
      },

      getSearchHistory: () => {
        return get().searchHistory
      },

      clearSearchHistory: () => {
        set({ searchHistory: [] })
      },

      // Analytics
      getSupplierStats: (supplierId) => {
        const supplier = get().getSupplier(supplierId)
        if (!supplier) return undefined

        const reviews = get().getSupplierReviews(supplierId)
        const complianceScore =
          (supplier.complianceRatings.quality +
            supplier.complianceRatings.delivery +
            supplier.complianceRatings.communication +
            supplier.complianceRatings.pricingAccuracy) /
          4

        return {
          rating: supplier.rating,
          reviewCount: supplier.reviewCount,
          responseTime: supplier.responseTime,
          cancellationRate: supplier.cancellationRate,
          complianceScore: parseFloat(complianceScore.toFixed(1)),
        }
      },

      // UI Actions
      setViewMode: (mode) => set({ viewMode: mode }),
      setSelectedSupplier: (id) => set({ selectedSupplierId: id }),
      setLoading: (loading) => set({ isLoading: loading }),
    }),
    {
      name: 'supplier-directory-storage',
      // Custom merge to handle Map serialization
      merge: (persistedState: any, currentState) => {
        const reviews = new Map<string, SupplierReview[]>()
        if (persistedState?.reviews && typeof persistedState.reviews === 'object') {
          Object.entries(persistedState.reviews).forEach(([key, value]) => {
            reviews.set(key, value as SupplierReview[])
          })
        }
        return {
          ...currentState,
          ...persistedState,
          reviews,
        }
      },
      // Custom serialization for Map
      partialize: (state) => ({
        suppliers: state.suppliers,
        favorites: state.favorites,
        searchHistory: state.searchHistory,
        reviews: Object.fromEntries(state.reviews),
      }),
    }
  )
)
