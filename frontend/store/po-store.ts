import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface POLineItem {
  id: string
  productId: string
  productName: string
  sku: string
  quantity: number
  unitPrice: number
  total: number
  deliveryDate?: string
}

export interface PurchaseOrder {
  id: string
  poNumber: string
  vendorId: string
  vendorName: string
  status: 'draft' | 'pending_approval' | 'approved' | 'sent' | 'partially_received' | 'received' | 'cancelled'
  lineItems: POLineItem[]
  subtotal: number
  tax: number
  shipping: number
  total: number
  paymentTerms: string
  deliveryAddress: string
  notes?: string
  createdBy: string
  createdAt: string
  approvedBy?: string
  approvedAt?: string
  sentAt?: string
  receivedAt?: string
  attachments?: string[]
}

interface POState {
  purchaseOrders: PurchaseOrder[]

  // CRUD
  createPO: (po: Omit<PurchaseOrder, 'id' | 'poNumber' | 'createdAt' | 'status'>) => string
  updatePO: (id: string, updates: Partial<PurchaseOrder>) => void
  deletePO: (id: string) => void
  getPO: (id: string) => PurchaseOrder | undefined

  // Workflow
  submitForApproval: (id: string) => void
  approvePO: (id: string, approverName: string) => void
  sendPO: (id: string) => void
  markReceived: (id: string) => void
  cancelPO: (id: string) => void

  // Filtering
  getPOsByStatus: (status: PurchaseOrder['status']) => PurchaseOrder[]
  getPOsByVendor: (vendorId: string) => PurchaseOrder[]
}

export const usePOStore = create<POState>()(
  persist(
    (set, get) => ({
      purchaseOrders: [],

      createPO: (poData) => {
        const poCount = get().purchaseOrders.length + 1
        const newPO: PurchaseOrder = {
          ...poData,
          id: `po-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          poNumber: `PO-${new Date().getFullYear()}-${String(poCount).padStart(5, '0')}`,
          status: 'draft',
          createdAt: new Date().toISOString(),
        }

        set((state) => ({
          purchaseOrders: [...state.purchaseOrders, newPO],
        }))

        return newPO.id
      },

      updatePO: (id, updates) => {
        set((state) => ({
          purchaseOrders: state.purchaseOrders.map((po) =>
            po.id === id ? { ...po, ...updates } : po
          ),
        }))
      },

      deletePO: (id) => {
        set((state) => ({
          purchaseOrders: state.purchaseOrders.filter((po) => po.id !== id),
        }))
      },

      getPO: (id) => {
        return get().purchaseOrders.find((po) => po.id === id)
      },

      submitForApproval: (id) => {
        set((state) => ({
          purchaseOrders: state.purchaseOrders.map((po) =>
            po.id === id ? { ...po, status: 'pending_approval' } : po
          ),
        }))
      },

      approvePO: (id, approverName) => {
        set((state) => ({
          purchaseOrders: state.purchaseOrders.map((po) =>
            po.id === id
              ? {
                  ...po,
                  status: 'approved',
                  approvedBy: approverName,
                  approvedAt: new Date().toISOString(),
                }
              : po
          ),
        }))
      },

      sendPO: (id) => {
        set((state) => ({
          purchaseOrders: state.purchaseOrders.map((po) =>
            po.id === id
              ? {
                  ...po,
                  status: 'sent',
                  sentAt: new Date().toISOString(),
                }
              : po
          ),
        }))
      },

      markReceived: (id) => {
        set((state) => ({
          purchaseOrders: state.purchaseOrders.map((po) =>
            po.id === id
              ? {
                  ...po,
                  status: 'received',
                  receivedAt: new Date().toISOString(),
                }
              : po
          ),
        }))
      },

      cancelPO: (id) => {
        set((state) => ({
          purchaseOrders: state.purchaseOrders.map((po) =>
            po.id === id ? { ...po, status: 'cancelled' } : po
          ),
        }))
      },

      getPOsByStatus: (status) => {
        return get().purchaseOrders.filter((po) => po.status === status)
      },

      getPOsByVendor: (vendorId) => {
        return get().purchaseOrders.filter((po) => po.vendorId === vendorId)
      },
    }),
    {
      name: 'channah-purchase-orders',
    }
  )
)
