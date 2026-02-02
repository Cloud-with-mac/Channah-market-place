import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface SampleItem {
  id: string
  productId: string
  name: string
  slug: string
  price: number // Sample price (usually higher than unit price)
  basePrice: number // Regular unit price
  image: string
  quantity: number // Usually limited to 1-3 samples per product
  maxSamples: number // Maximum samples allowed
  vendorName: string
  vendorSlug: string
  estimatedDelivery?: string
  specifications?: Record<string, any>
}

interface SampleCartState {
  items: SampleItem[]
  isOpen: boolean

  // Computed values
  subtotal: number
  total: number
  itemCount: number

  // Actions
  addItem: (item: Omit<SampleItem, 'id'>) => void
  updateQuantity: (itemId: string, quantity: number) => void
  removeItem: (itemId: string) => void
  clearCart: () => void
  toggleCart: () => void
  openCart: () => void
  closeCart: () => void
  isInCart: (productId: string) => boolean
}

const calculateTotals = (items: SampleItem[]) => {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const total = subtotal
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)
  return { subtotal, total, itemCount }
}

export const useSampleCartStore = create<SampleCartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      subtotal: 0,
      total: 0,
      itemCount: 0,

      addItem: (item) => {
        set((state) => {
          const existingIndex = state.items.findIndex((i) => i.productId === item.productId)

          let newItems: SampleItem[]

          if (existingIndex > -1) {
            // Update existing item
            const existing = state.items[existingIndex]
            const newQuantity = Math.min(
              existing.quantity + item.quantity,
              item.maxSamples
            )

            newItems = state.items.map((i, idx) =>
              idx === existingIndex ? { ...i, quantity: newQuantity } : i
            )
          } else {
            // Add new item
            const newItem: SampleItem = {
              id: `sample-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              ...item,
              quantity: Math.min(item.quantity, item.maxSamples),
            }
            newItems = [...state.items, newItem]
          }

          const totals = calculateTotals(newItems)
          return { items: newItems, ...totals, isOpen: true }
        })
      },

      updateQuantity: (itemId, quantity) => {
        set((state) => {
          const newItems = state.items.map((item) => {
            if (item.id === itemId) {
              return {
                ...item,
                quantity: Math.min(Math.max(1, quantity), item.maxSamples),
              }
            }
            return item
          })

          const totals = calculateTotals(newItems)
          return { items: newItems, ...totals }
        })
      },

      removeItem: (itemId) => {
        set((state) => {
          const newItems = state.items.filter((item) => item.id !== itemId)
          const totals = calculateTotals(newItems)
          return { items: newItems, ...totals }
        })
      },

      clearCart: () => {
        set({
          items: [],
          subtotal: 0,
          total: 0,
          itemCount: 0,
        })
      },

      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),

      isInCart: (productId) => {
        return get().items.some((item) => item.productId === productId)
      },
    }),
    {
      name: 'channah-sample-cart',
      partialize: (state) => ({
        items: state.items,
        subtotal: state.subtotal,
        total: state.total,
        itemCount: state.itemCount,
      }),
    }
  )
)
