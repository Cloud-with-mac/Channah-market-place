import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface PriceAlert {
  id: string
  productId: string
  productName: string
  productImage: string
  currentPrice: number
  targetPrice: number
  isActive: boolean
  createdAt: string
  triggeredAt?: string
}

export interface RestockAlert {
  id: string
  productId: string
  productName: string
  productImage: string
  isActive: boolean
  createdAt: string
  notifiedAt?: string
}

interface AlertsState {
  priceAlerts: PriceAlert[]
  restockAlerts: RestockAlert[]

  // Price Alerts
  createPriceAlert: (
    productId: string,
    productName: string,
    productImage: string,
    currentPrice: number,
    targetPrice: number
  ) => void
  removePriceAlert: (alertId: string) => void
  updatePriceAlert: (alertId: string, targetPrice: number) => void
  togglePriceAlert: (alertId: string) => void
  checkPriceAlerts: (productId: string, newPrice: number) => PriceAlert[]
  hasPriceAlert: (productId: string) => boolean

  // Restock Alerts
  createRestockAlert: (
    productId: string,
    productName: string,
    productImage: string
  ) => void
  removeRestockAlert: (alertId: string) => void
  toggleRestockAlert: (alertId: string) => void
  triggerRestockAlert: (productId: string) => void
  hasRestockAlert: (productId: string) => boolean

  // Utilities
  getActiveAlertsCount: () => number
  clearTriggeredAlerts: () => void
}

export const useAlertsStore = create<AlertsState>()(
  persist(
    (set, get) => ({
      priceAlerts: [],
      restockAlerts: [],

      // Price Alerts
      createPriceAlert: (productId, productName, productImage, currentPrice, targetPrice) => {
        const newAlert: PriceAlert = {
          id: `price-alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          productId,
          productName,
          productImage,
          currentPrice,
          targetPrice,
          isActive: true,
          createdAt: new Date().toISOString(),
        }

        set((state) => ({
          priceAlerts: [...state.priceAlerts, newAlert],
        }))
      },

      removePriceAlert: (alertId) => {
        set((state) => ({
          priceAlerts: state.priceAlerts.filter((alert) => alert.id !== alertId),
        }))
      },

      updatePriceAlert: (alertId, targetPrice) => {
        set((state) => ({
          priceAlerts: state.priceAlerts.map((alert) =>
            alert.id === alertId ? { ...alert, targetPrice } : alert
          ),
        }))
      },

      togglePriceAlert: (alertId) => {
        set((state) => ({
          priceAlerts: state.priceAlerts.map((alert) =>
            alert.id === alertId ? { ...alert, isActive: !alert.isActive } : alert
          ),
        }))
      },

      checkPriceAlerts: (productId, newPrice) => {
        const triggeredAlerts: PriceAlert[] = []

        set((state) => ({
          priceAlerts: state.priceAlerts.map((alert) => {
            if (
              alert.productId === productId &&
              alert.isActive &&
              newPrice <= alert.targetPrice &&
              !alert.triggeredAt
            ) {
              triggeredAlerts.push(alert)
              return {
                ...alert,
                currentPrice: newPrice,
                triggeredAt: new Date().toISOString(),
              }
            }
            return alert
          }),
        }))

        return triggeredAlerts
      },

      hasPriceAlert: (productId) => {
        return get().priceAlerts.some(
          (alert) => alert.productId === productId && alert.isActive
        )
      },

      // Restock Alerts
      createRestockAlert: (productId, productName, productImage) => {
        // Don't create duplicate alerts
        if (get().hasRestockAlert(productId)) return

        const newAlert: RestockAlert = {
          id: `restock-alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          productId,
          productName,
          productImage,
          isActive: true,
          createdAt: new Date().toISOString(),
        }

        set((state) => ({
          restockAlerts: [...state.restockAlerts, newAlert],
        }))
      },

      removeRestockAlert: (alertId) => {
        set((state) => ({
          restockAlerts: state.restockAlerts.filter((alert) => alert.id !== alertId),
        }))
      },

      toggleRestockAlert: (alertId) => {
        set((state) => ({
          restockAlerts: state.restockAlerts.map((alert) =>
            alert.id === alertId ? { ...alert, isActive: !alert.isActive } : alert
          ),
        }))
      },

      triggerRestockAlert: (productId) => {
        set((state) => ({
          restockAlerts: state.restockAlerts.map((alert) =>
            alert.productId === productId && alert.isActive
              ? { ...alert, notifiedAt: new Date().toISOString() }
              : alert
          ),
        }))
      },

      hasRestockAlert: (productId) => {
        return get().restockAlerts.some(
          (alert) => alert.productId === productId && alert.isActive
        )
      },

      // Utilities
      getActiveAlertsCount: () => {
        const { priceAlerts, restockAlerts } = get()
        return (
          priceAlerts.filter((a) => a.isActive).length +
          restockAlerts.filter((a) => a.isActive).length
        )
      },

      clearTriggeredAlerts: () => {
        set((state) => ({
          priceAlerts: state.priceAlerts.filter((alert) => !alert.triggeredAt),
          restockAlerts: state.restockAlerts.filter((alert) => !alert.notifiedAt),
        }))
      },
    }),
    {
      name: 'channah-alerts',
    }
  )
)
