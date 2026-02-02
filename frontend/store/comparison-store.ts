import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface ComparisonProduct {
  id: string
  name: string
  slug: string
  price: number
  compareAtPrice?: number
  image: string
  rating: number
  reviewCount: number
  vendor: {
    name: string
    slug: string
    verified?: boolean
  }
  moq?: number
  category?: {
    name: string
    slug: string
  }
  specifications?: Record<string, any>
  inStock?: boolean
}

interface ComparisonState {
  products: ComparisonProduct[]
  addProduct: (product: ComparisonProduct) => void
  removeProduct: (productId: string) => void
  clearComparison: () => void
  isInComparison: (productId: string) => boolean
}

export const useComparisonStore = create<ComparisonState>()(
  persist(
    (set, get) => ({
      products: [],

      addProduct: (product) => {
        const products = get().products

        // Maximum 4 products for comparison
        if (products.length >= 4) {
          return
        }

        // Don't add if already in comparison
        if (products.some((p) => p.id === product.id)) {
          return
        }

        set({ products: [...products, product] })
      },

      removeProduct: (productId) => {
        set({
          products: get().products.filter((p) => p.id !== productId),
        })
      },

      clearComparison: () => {
        set({ products: [] })
      },

      isInComparison: (productId) => {
        return get().products.some((p) => p.id === productId)
      },
    }),
    {
      name: 'channah-comparison',
    }
  )
)
