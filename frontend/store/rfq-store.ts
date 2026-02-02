import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { rfqAPI } from '@/lib/api'

export interface RFQAttachment {
  id: string
  name: string
  url: string
  type: string
  size: number
}

export interface RFQSpecification {
  name: string
  value: string
  required: boolean
}

export interface RFQQuote {
  id: string
  vendorId: string
  vendorName: string
  vendorLogo?: string
  unitPrice: number
  moq: number
  leadTime: string
  paymentTerms: string
  shippingCost?: number
  notes?: string
  status: 'pending' | 'accepted' | 'rejected'
  submittedAt: string
  validUntil: string
}

export interface RFQ {
  id: string
  productName: string
  category: string
  quantity: number
  targetPrice?: number
  specifications: RFQSpecification[]
  description: string
  attachments: RFQAttachment[]
  deliveryDeadline?: string
  destination: string
  paymentTerms?: string
  status: 'draft' | 'open' | 'quoted' | 'negotiating' | 'closed' | 'awarded'
  quotes: RFQQuote[]
  createdAt: string
  updatedAt: string
  closedAt?: string
  awardedTo?: string
}

interface RFQState {
  rfqs: RFQ[]
  loading: boolean
  error: string | null

  // CRUD Operations
  createRFQ: (rfq: Omit<RFQ, 'id' | 'createdAt' | 'updatedAt' | 'quotes' | 'status'>) => Promise<string>
  updateRFQ: (id: string, updates: Partial<RFQ>) => void
  deleteRFQ: (id: string) => void
  getRFQ: (id: string) => RFQ | undefined
  fetchRFQs: () => Promise<void>

  // Quote Management
  addQuote: (rfqId: string, quote: Omit<RFQQuote, 'id' | 'submittedAt'>) => void
  acceptQuote: (rfqId: string, quoteId: string) => Promise<void>
  rejectQuote: (rfqId: string, quoteId: string) => Promise<void>

  // Status Management
  updateStatus: (id: string, status: RFQ['status']) => void
  closeRFQ: (id: string) => void
  awardRFQ: (id: string, vendorId: string) => void

  // Filtering
  getOpenRFQs: () => RFQ[]
  getClosedRFQs: () => RFQ[]
  getRFQsByStatus: (status: RFQ['status']) => RFQ[]
}

export const useRFQStore = create<RFQState>()(
  persist(
    (set, get) => ({
      rfqs: [],
      loading: false,
      error: null,

      fetchRFQs: async () => {
        set({ loading: true, error: null })
        try {
          const data = await rfqAPI.getAll()
          const rfqs: RFQ[] = Array.isArray(data) ? data : (data.results || data.rfqs || [])
          set({ rfqs, loading: false })
        } catch (error) {
          console.error('Failed to fetch RFQs from API, using local state:', error)
          set({ loading: false, error: 'Failed to fetch RFQs' })
        }
      },

      createRFQ: async (rfqData) => {
        try {
          const result = await rfqAPI.create({
            product_name: rfqData.productName,
            category: rfqData.category,
            quantity: rfqData.quantity,
            target_price: rfqData.targetPrice,
            specifications: rfqData.specifications,
            description: rfqData.description,
            attachments: rfqData.attachments,
            delivery_deadline: rfqData.deliveryDeadline,
            destination: rfqData.destination,
            payment_terms: rfqData.paymentTerms,
          })

          const newRFQ: RFQ = {
            id: result.id || `rfq-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            ...rfqData,
            status: result.status || 'draft',
            quotes: [],
            createdAt: result.created_at || new Date().toISOString(),
            updatedAt: result.updated_at || new Date().toISOString(),
          }

          set((state) => ({
            rfqs: [...state.rfqs, newRFQ],
          }))

          return newRFQ.id
        } catch (error) {
          console.error('Failed to create RFQ via API, falling back to local:', error)
          // Fallback to local creation
          const newRFQ: RFQ = {
            ...rfqData,
            id: `rfq-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            status: 'draft',
            quotes: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }

          set((state) => ({
            rfqs: [...state.rfqs, newRFQ],
          }))

          return newRFQ.id
        }
      },

      updateRFQ: (id, updates) => {
        set((state) => ({
          rfqs: state.rfqs.map((rfq) =>
            rfq.id === id
              ? { ...rfq, ...updates, updatedAt: new Date().toISOString() }
              : rfq
          ),
        }))

        // Fire and forget API update
        rfqAPI.update(id, updates).catch((error) => {
          console.error('Failed to update RFQ via API:', error)
        })
      },

      deleteRFQ: (id) => {
        set((state) => ({
          rfqs: state.rfqs.filter((rfq) => rfq.id !== id),
        }))

        rfqAPI.cancel(id).catch((error) => {
          console.error('Failed to delete RFQ via API:', error)
        })
      },

      getRFQ: (id) => {
        return get().rfqs.find((rfq) => rfq.id === id)
      },

      addQuote: (rfqId, quoteData) => {
        const newQuote: RFQQuote = {
          ...quoteData,
          id: `quote-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          status: 'pending',
          submittedAt: new Date().toISOString(),
        }

        set((state) => ({
          rfqs: state.rfqs.map((rfq) => {
            if (rfq.id === rfqId) {
              return {
                ...rfq,
                quotes: [...rfq.quotes, newQuote],
                status: rfq.status === 'open' ? 'quoted' : rfq.status,
                updatedAt: new Date().toISOString(),
              }
            }
            return rfq
          }),
        }))

        // Fire and forget API call
        rfqAPI.submitQuote(rfqId, quoteData).catch((error) => {
          console.error('Failed to submit quote via API:', error)
        })
      },

      acceptQuote: async (rfqId, quoteId) => {
        // Optimistic update
        set((state) => ({
          rfqs: state.rfqs.map((rfq) => {
            if (rfq.id === rfqId) {
              return {
                ...rfq,
                quotes: rfq.quotes.map((quote) =>
                  quote.id === quoteId
                    ? { ...quote, status: 'accepted' as const }
                    : quote
                ),
                status: 'negotiating',
                updatedAt: new Date().toISOString(),
              }
            }
            return rfq
          }),
        }))

        try {
          await rfqAPI.acceptQuote(rfqId, quoteId)
        } catch (error) {
          console.error('Failed to accept quote via API:', error)
        }
      },

      rejectQuote: async (rfqId, quoteId) => {
        // Optimistic update
        set((state) => ({
          rfqs: state.rfqs.map((rfq) => {
            if (rfq.id === rfqId) {
              return {
                ...rfq,
                quotes: rfq.quotes.map((quote) =>
                  quote.id === quoteId
                    ? { ...quote, status: 'rejected' as const }
                    : quote
                ),
                updatedAt: new Date().toISOString(),
              }
            }
            return rfq
          }),
        }))

        try {
          await rfqAPI.rejectQuote(rfqId, quoteId)
        } catch (error) {
          console.error('Failed to reject quote via API:', error)
        }
      },

      updateStatus: (id, status) => {
        set((state) => ({
          rfqs: state.rfqs.map((rfq) =>
            rfq.id === id
              ? { ...rfq, status, updatedAt: new Date().toISOString() }
              : rfq
          ),
        }))

        rfqAPI.update(id, { status }).catch((error) => {
          console.error('Failed to update RFQ status via API:', error)
        })
      },

      closeRFQ: (id) => {
        set((state) => ({
          rfqs: state.rfqs.map((rfq) =>
            rfq.id === id
              ? {
                  ...rfq,
                  status: 'closed',
                  closedAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                }
              : rfq
          ),
        }))

        rfqAPI.update(id, { status: 'closed' }).catch((error) => {
          console.error('Failed to close RFQ via API:', error)
        })
      },

      awardRFQ: (id, vendorId) => {
        set((state) => ({
          rfqs: state.rfqs.map((rfq) =>
            rfq.id === id
              ? {
                  ...rfq,
                  status: 'awarded',
                  awardedTo: vendorId,
                  closedAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                }
              : rfq
          ),
        }))

        rfqAPI.update(id, { status: 'awarded', awarded_to: vendorId }).catch((error) => {
          console.error('Failed to award RFQ via API:', error)
        })
      },

      getOpenRFQs: () => {
        return get().rfqs.filter((rfq) =>
          ['open', 'quoted', 'negotiating'].includes(rfq.status)
        )
      },

      getClosedRFQs: () => {
        return get().rfqs.filter((rfq) =>
          ['closed', 'awarded'].includes(rfq.status)
        )
      },

      getRFQsByStatus: (status) => {
        return get().rfqs.filter((rfq) => rfq.status === status)
      },
    }),
    {
      name: 'channah-rfqs',
    }
  )
)
