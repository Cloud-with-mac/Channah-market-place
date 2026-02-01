import { create } from 'zustand'
import { persist } from 'zustand/middleware'

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

  // CRUD Operations
  createRFQ: (rfq: Omit<RFQ, 'id' | 'createdAt' | 'updatedAt' | 'quotes' | 'status'>) => string
  updateRFQ: (id: string, updates: Partial<RFQ>) => void
  deleteRFQ: (id: string) => void
  getRFQ: (id: string) => RFQ | undefined

  // Quote Management
  addQuote: (rfqId: string, quote: Omit<RFQQuote, 'id' | 'submittedAt'>) => void
  acceptQuote: (rfqId: string, quoteId: string) => void
  rejectQuote: (rfqId: string, quoteId: string) => void

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

      createRFQ: (rfqData) => {
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
      },

      updateRFQ: (id, updates) => {
        set((state) => ({
          rfqs: state.rfqs.map((rfq) =>
            rfq.id === id
              ? { ...rfq, ...updates, updatedAt: new Date().toISOString() }
              : rfq
          ),
        }))
      },

      deleteRFQ: (id) => {
        set((state) => ({
          rfqs: state.rfqs.filter((rfq) => rfq.id !== id),
        }))
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
      },

      acceptQuote: (rfqId, quoteId) => {
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
      },

      rejectQuote: (rfqId, quoteId) => {
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
      },

      updateStatus: (id, status) => {
        set((state) => ({
          rfqs: state.rfqs.map((rfq) =>
            rfq.id === id
              ? { ...rfq, status, updatedAt: new Date().toISOString() }
              : rfq
          ),
        }))
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
      name: 'vendora-rfqs',
    }
  )
)
