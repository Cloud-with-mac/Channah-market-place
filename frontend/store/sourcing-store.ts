import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface SourcingRequest {
  id: string
  title: string
  category: string
  description: string
  quantity: number
  targetPrice?: number
  budget?: number
  deadline?: string
  destination: string
  specifications: { name: string; value: string }[]
  attachments: string[]
  status: 'open' | 'bidding' | 'awarded' | 'closed'
  bids: SourcingBid[]
  createdBy: string
  createdAt: string
  closedAt?: string
  awardedTo?: string
}

export interface SourcingBid {
  id: string
  vendorId: string
  vendorName: string
  vendorLogo?: string
  unitPrice: number
  moq: number
  leadTime: string
  paymentTerms: string
  notes?: string
  certifications?: string[]
  submittedAt: string
  status: 'pending' | 'accepted' | 'rejected'
}

interface SourcingState {
  requests: SourcingRequest[]

  // CRUD
  createRequest: (request: Omit<SourcingRequest, 'id' | 'createdAt' | 'status' | 'bids'>) => string
  updateRequest: (id: string, updates: Partial<SourcingRequest>) => void
  deleteRequest: (id: string) => void
  getRequest: (id: string) => SourcingRequest | undefined

  // Bids
  addBid: (requestId: string, bid: Omit<SourcingBid, 'id' | 'submittedAt' | 'status'>) => void
  acceptBid: (requestId: string, bidId: string) => void
  rejectBid: (requestId: string, bidId: string) => void

  // Status
  closeRequest: (id: string) => void
  awardRequest: (id: string, vendorId: string) => void

  // Filters
  getOpenRequests: () => SourcingRequest[]
  getMyRequests: (userId: string) => SourcingRequest[]
}

export const useSourcingStore = create<SourcingState>()(
  persist(
    (set, get) => ({
      requests: [],

      createRequest: (requestData) => {
        const newRequest: SourcingRequest = {
          ...requestData,
          id: `sourcing-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          status: 'open',
          bids: [],
          createdAt: new Date().toISOString(),
        }

        set((state) => ({
          requests: [...state.requests, newRequest],
        }))

        return newRequest.id
      },

      updateRequest: (id, updates) => {
        set((state) => ({
          requests: state.requests.map((req) =>
            req.id === id ? { ...req, ...updates } : req
          ),
        }))
      },

      deleteRequest: (id) => {
        set((state) => ({
          requests: state.requests.filter((req) => req.id !== id),
        }))
      },

      getRequest: (id) => {
        return get().requests.find((req) => req.id === id)
      },

      addBid: (requestId, bidData) => {
        const newBid: SourcingBid = {
          ...bidData,
          id: `bid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          status: 'pending',
          submittedAt: new Date().toISOString(),
        }

        set((state) => ({
          requests: state.requests.map((req) => {
            if (req.id === requestId) {
              return {
                ...req,
                bids: [...req.bids, newBid],
                status: req.status === 'open' ? 'bidding' : req.status,
              }
            }
            return req
          }),
        }))
      },

      acceptBid: (requestId, bidId) => {
        set((state) => ({
          requests: state.requests.map((req) => {
            if (req.id === requestId) {
              return {
                ...req,
                bids: req.bids.map((bid) =>
                  bid.id === bidId ? { ...bid, status: 'accepted' as const } : bid
                ),
              }
            }
            return req
          }),
        }))
      },

      rejectBid: (requestId, bidId) => {
        set((state) => ({
          requests: state.requests.map((req) => {
            if (req.id === requestId) {
              return {
                ...req,
                bids: req.bids.map((bid) =>
                  bid.id === bidId ? { ...bid, status: 'rejected' as const } : bid
                ),
              }
            }
            return req
          }),
        }))
      },

      closeRequest: (id) => {
        set((state) => ({
          requests: state.requests.map((req) =>
            req.id === id
              ? { ...req, status: 'closed', closedAt: new Date().toISOString() }
              : req
          ),
        }))
      },

      awardRequest: (id, vendorId) => {
        set((state) => ({
          requests: state.requests.map((req) =>
            req.id === id
              ? {
                  ...req,
                  status: 'awarded',
                  awardedTo: vendorId,
                  closedAt: new Date().toISOString(),
                }
              : req
          ),
        }))
      },

      getOpenRequests: () => {
        return get().requests.filter((req) => req.status === 'open' || req.status === 'bidding')
      },

      getMyRequests: (userId) => {
        return get().requests.filter((req) => req.createdBy === userId)
      },
    }),
    {
      name: 'vendora-sourcing',
    }
  )
)
