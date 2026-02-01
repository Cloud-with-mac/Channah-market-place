import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface BrandingSpecification {
  id: string
  companyName: string
  logo?: string
  primaryColor: string
  secondaryColor: string
  accentColor: string
  fontFamily: string
  tagline?: string
  description?: string
}

export interface DesignMockup {
  id: string
  name: string
  type: 'packaging' | 'label' | 'product' | 'marketing' | 'other'
  fileUrl: string
  fileName: string
  fileSize: number
  uploadedAt: string
  notes?: string
}

export interface OEMQuote {
  id: string
  vendorId: string
  vendorName: string
  vendorLogo?: string
  basePrice: number
  quantityRange: {
    min: number
    max: number
  }
  moq: number
  leadTime: number // in days
  productionCapacity: number
  customizationCost?: number
  setupCost?: number
  shippingCost?: number
  paymentTerms: string
  guaranteeMonths: number
  notes?: string
  status: 'pending' | 'accepted' | 'rejected'
  submittedAt: string
  validUntil: string
  includesQA: boolean
  certifications?: string[]
}

export interface ProductionMilestone {
  id: string
  name: string
  dueDate: string
  completionDate?: string
  status: 'pending' | 'in-progress' | 'completed' | 'delayed'
  percentage: number
  notes?: string
}

export interface OEMRequest {
  id: string
  companyName: string
  contactEmail: string
  contactPhone?: string
  productDescription: string
  targetMarket?: string
  estimatedQuantity: number
  budget?: number
  timeline?: string
  branding: BrandingSpecification
  designMockups: DesignMockup[]
  quotes: OEMQuote[]
  milestones: ProductionMilestone[]
  status: 'draft' | 'submitted' | 'quoted' | 'negotiating' | 'production' | 'completed'
  createdAt: string
  updatedAt: string
  submittedAt?: string
  completedAt?: string
  notes?: string
  attachments?: string[]
}

interface OEMRequestFilter {
  status?: OEMRequest['status']
  vendorId?: string
  dateRange?: {
    from: string
    to: string
  }
}

interface OEMState {
  requests: OEMRequest[]
  currentEditingRequest?: OEMRequest

  // Request Management
  createRequest: (request: Omit<OEMRequest, 'id' | 'createdAt' | 'updatedAt'>) => string
  updateRequest: (id: string, updates: Partial<OEMRequest>) => void
  deleteRequest: (id: string) => void
  getRequest: (id: string) => OEMRequest | undefined
  setCurrentEditingRequest: (request: OEMRequest | undefined) => void
  duplicateRequest: (id: string) => string

  // Branding Management
  updateBranding: (requestId: string, branding: BrandingSpecification) => void
  getBranding: (requestId: string) => BrandingSpecification | undefined

  // Design Mockups
  addDesignMockup: (requestId: string, mockup: Omit<DesignMockup, 'id' | 'uploadedAt'>) => void
  updateDesignMockup: (requestId: string, mockupId: string, updates: Partial<DesignMockup>) => void
  deleteDesignMockup: (requestId: string, mockupId: string) => void
  getDesignMockups: (requestId: string) => DesignMockup[]

  // Quote Management
  addQuote: (requestId: string, quote: Omit<OEMQuote, 'id' | 'submittedAt'>) => void
  updateQuote: (requestId: string, quoteId: string, updates: Partial<OEMQuote>) => void
  deleteQuote: (requestId: string, quoteId: string) => void
  acceptQuote: (requestId: string, quoteId: string) => void
  rejectQuote: (requestId: string, quoteId: string) => void
  getQuotes: (requestId: string) => OEMQuote[]
  getQuotesByVendor: (requestId: string, vendorId: string) => OEMQuote[]

  // Production Tracking
  addMilestone: (requestId: string, milestone: Omit<ProductionMilestone, 'id'>) => void
  updateMilestone: (requestId: string, milestoneId: string, updates: Partial<ProductionMilestone>) => void
  deleteMilestone: (requestId: string, milestoneId: string) => void
  updateMilestoneStatus: (requestId: string, milestoneId: string, status: ProductionMilestone['status']) => void
  getMilestones: (requestId: string) => ProductionMilestone[]
  getProductionProgress: (requestId: string) => number

  // Status Management
  updateStatus: (id: string, status: OEMRequest['status']) => void
  submitRequest: (id: string) => void
  completeProduction: (id: string) => void

  // Filtering & Analytics
  getRequests: (filter?: OEMRequestFilter) => OEMRequest[]
  getRequestsByStatus: (status: OEMRequest['status']) => OEMRequest[]
  getActiveRequests: () => OEMRequest[]
  getCompletedRequests: () => OEMRequest[]
  getRequestStats: () => {
    total: number
    draft: number
    submitted: number
    quoted: number
    negotiating: number
    production: number
    completed: number
  }
  searchRequests: (query: string) => OEMRequest[]
}

export const useOEMStore = create<OEMState>()(
  persist(
    (set, get) => ({
      requests: [],
      currentEditingRequest: undefined,

      createRequest: (requestData) => {
        const newRequest: OEMRequest = {
          ...requestData,
          id: `oem-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }

        set((state) => ({
          requests: [...state.requests, newRequest],
        }))

        return newRequest.id
      },

      updateRequest: (id, updates) => {
        set((state) => ({
          requests: state.requests.map((req) =>
            req.id === id
              ? { ...req, ...updates, updatedAt: new Date().toISOString() }
              : req
          ),
          currentEditingRequest:
            state.currentEditingRequest?.id === id
              ? {
                  ...state.currentEditingRequest,
                  ...updates,
                  updatedAt: new Date().toISOString(),
                }
              : state.currentEditingRequest,
        }))
      },

      deleteRequest: (id) => {
        set((state) => ({
          requests: state.requests.filter((req) => req.id !== id),
          currentEditingRequest:
            state.currentEditingRequest?.id === id
              ? undefined
              : state.currentEditingRequest,
        }))
      },

      getRequest: (id) => {
        return get().requests.find((req) => req.id === id)
      },

      setCurrentEditingRequest: (request) => {
        set({ currentEditingRequest: request })
      },

      duplicateRequest: (id) => {
        const original = get().getRequest(id)
        if (!original) return ''

        const duplicated: OEMRequest = {
          ...original,
          id: `oem-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          status: 'draft',
          quotes: [],
          milestones: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          submittedAt: undefined,
          completedAt: undefined,
        }

        set((state) => ({
          requests: [...state.requests, duplicated],
        }))

        return duplicated.id
      },

      updateBranding: (requestId, branding) => {
        set((state) => ({
          requests: state.requests.map((req) =>
            req.id === requestId
              ? { ...req, branding, updatedAt: new Date().toISOString() }
              : req
          ),
          currentEditingRequest:
            state.currentEditingRequest?.id === requestId
              ? {
                  ...state.currentEditingRequest,
                  branding,
                  updatedAt: new Date().toISOString(),
                }
              : state.currentEditingRequest,
        }))
      },

      getBranding: (requestId) => {
        return get().getRequest(requestId)?.branding
      },

      addDesignMockup: (requestId, mockupData) => {
        const newMockup: DesignMockup = {
          ...mockupData,
          id: `mockup-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          uploadedAt: new Date().toISOString(),
        }

        set((state) => ({
          requests: state.requests.map((req) =>
            req.id === requestId
              ? {
                  ...req,
                  designMockups: [...req.designMockups, newMockup],
                  updatedAt: new Date().toISOString(),
                }
              : req
          ),
          currentEditingRequest:
            state.currentEditingRequest?.id === requestId
              ? {
                  ...state.currentEditingRequest,
                  designMockups: [...state.currentEditingRequest.designMockups, newMockup],
                  updatedAt: new Date().toISOString(),
                }
              : state.currentEditingRequest,
        }))
      },

      updateDesignMockup: (requestId, mockupId, updates) => {
        set((state) => ({
          requests: state.requests.map((req) =>
            req.id === requestId
              ? {
                  ...req,
                  designMockups: req.designMockups.map((mockup) =>
                    mockup.id === mockupId ? { ...mockup, ...updates } : mockup
                  ),
                  updatedAt: new Date().toISOString(),
                }
              : req
          ),
          currentEditingRequest:
            state.currentEditingRequest?.id === requestId
              ? {
                  ...state.currentEditingRequest,
                  designMockups: state.currentEditingRequest.designMockups.map((mockup) =>
                    mockup.id === mockupId ? { ...mockup, ...updates } : mockup
                  ),
                  updatedAt: new Date().toISOString(),
                }
              : state.currentEditingRequest,
        }))
      },

      deleteDesignMockup: (requestId, mockupId) => {
        set((state) => ({
          requests: state.requests.map((req) =>
            req.id === requestId
              ? {
                  ...req,
                  designMockups: req.designMockups.filter((mockup) => mockup.id !== mockupId),
                  updatedAt: new Date().toISOString(),
                }
              : req
          ),
          currentEditingRequest:
            state.currentEditingRequest?.id === requestId
              ? {
                  ...state.currentEditingRequest,
                  designMockups: state.currentEditingRequest.designMockups.filter(
                    (mockup) => mockup.id !== mockupId
                  ),
                  updatedAt: new Date().toISOString(),
                }
              : state.currentEditingRequest,
        }))
      },

      getDesignMockups: (requestId) => {
        return get().getRequest(requestId)?.designMockups || []
      },

      addQuote: (requestId, quoteData) => {
        const newQuote: OEMQuote = {
          ...quoteData,
          id: `quote-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          submittedAt: new Date().toISOString(),
        }

        set((state) => ({
          requests: state.requests.map((req) =>
            req.id === requestId
              ? {
                  ...req,
                  quotes: [...req.quotes, newQuote],
                  status: req.status === 'submitted' ? 'quoted' : req.status,
                  updatedAt: new Date().toISOString(),
                }
              : req
          ),
          currentEditingRequest:
            state.currentEditingRequest?.id === requestId
              ? {
                  ...state.currentEditingRequest,
                  quotes: [...state.currentEditingRequest.quotes, newQuote],
                  status:
                    state.currentEditingRequest.status === 'submitted'
                      ? 'quoted'
                      : state.currentEditingRequest.status,
                  updatedAt: new Date().toISOString(),
                }
              : state.currentEditingRequest,
        }))
      },

      updateQuote: (requestId, quoteId, updates) => {
        set((state) => ({
          requests: state.requests.map((req) =>
            req.id === requestId
              ? {
                  ...req,
                  quotes: req.quotes.map((quote) =>
                    quote.id === quoteId ? { ...quote, ...updates } : quote
                  ),
                  updatedAt: new Date().toISOString(),
                }
              : req
          ),
          currentEditingRequest:
            state.currentEditingRequest?.id === requestId
              ? {
                  ...state.currentEditingRequest,
                  quotes: state.currentEditingRequest.quotes.map((quote) =>
                    quote.id === quoteId ? { ...quote, ...updates } : quote
                  ),
                  updatedAt: new Date().toISOString(),
                }
              : state.currentEditingRequest,
        }))
      },

      deleteQuote: (requestId, quoteId) => {
        set((state) => ({
          requests: state.requests.map((req) =>
            req.id === requestId
              ? {
                  ...req,
                  quotes: req.quotes.filter((quote) => quote.id !== quoteId),
                  updatedAt: new Date().toISOString(),
                }
              : req
          ),
          currentEditingRequest:
            state.currentEditingRequest?.id === requestId
              ? {
                  ...state.currentEditingRequest,
                  quotes: state.currentEditingRequest.quotes.filter(
                    (quote) => quote.id !== quoteId
                  ),
                  updatedAt: new Date().toISOString(),
                }
              : state.currentEditingRequest,
        }))
      },

      acceptQuote: (requestId, quoteId) => {
        set((state) => ({
          requests: state.requests.map((req) =>
            req.id === requestId
              ? {
                  ...req,
                  quotes: req.quotes.map((quote) =>
                    quote.id === quoteId ? { ...quote, status: 'accepted' } : quote
                  ),
                  status: 'negotiating',
                  updatedAt: new Date().toISOString(),
                }
              : req
          ),
          currentEditingRequest:
            state.currentEditingRequest?.id === requestId
              ? {
                  ...state.currentEditingRequest,
                  quotes: state.currentEditingRequest.quotes.map((quote) =>
                    quote.id === quoteId ? { ...quote, status: 'accepted' } : quote
                  ),
                  status: 'negotiating',
                  updatedAt: new Date().toISOString(),
                }
              : state.currentEditingRequest,
        }))
      },

      rejectQuote: (requestId, quoteId) => {
        set((state) => ({
          requests: state.requests.map((req) =>
            req.id === requestId
              ? {
                  ...req,
                  quotes: req.quotes.map((quote) =>
                    quote.id === quoteId ? { ...quote, status: 'rejected' } : quote
                  ),
                  updatedAt: new Date().toISOString(),
                }
              : req
          ),
          currentEditingRequest:
            state.currentEditingRequest?.id === requestId
              ? {
                  ...state.currentEditingRequest,
                  quotes: state.currentEditingRequest.quotes.map((quote) =>
                    quote.id === quoteId ? { ...quote, status: 'rejected' } : quote
                  ),
                  updatedAt: new Date().toISOString(),
                }
              : state.currentEditingRequest,
        }))
      },

      getQuotes: (requestId) => {
        return get().getRequest(requestId)?.quotes || []
      },

      getQuotesByVendor: (requestId, vendorId) => {
        return (get().getRequest(requestId)?.quotes || []).filter(
          (quote) => quote.vendorId === vendorId
        )
      },

      addMilestone: (requestId, milestoneData) => {
        const newMilestone: ProductionMilestone = {
          ...milestoneData,
          id: `milestone-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        }

        set((state) => ({
          requests: state.requests.map((req) =>
            req.id === requestId
              ? {
                  ...req,
                  milestones: [...req.milestones, newMilestone],
                  status: req.status === 'quoted' || req.status === 'negotiating' ? 'production' : req.status,
                  updatedAt: new Date().toISOString(),
                }
              : req
          ),
          currentEditingRequest:
            state.currentEditingRequest?.id === requestId
              ? {
                  ...state.currentEditingRequest,
                  milestones: [...state.currentEditingRequest.milestones, newMilestone],
                  status:
                    state.currentEditingRequest.status === 'quoted' ||
                    state.currentEditingRequest.status === 'negotiating'
                      ? 'production'
                      : state.currentEditingRequest.status,
                  updatedAt: new Date().toISOString(),
                }
              : state.currentEditingRequest,
        }))
      },

      updateMilestone: (requestId, milestoneId, updates) => {
        set((state) => ({
          requests: state.requests.map((req) =>
            req.id === requestId
              ? {
                  ...req,
                  milestones: req.milestones.map((milestone) =>
                    milestone.id === milestoneId ? { ...milestone, ...updates } : milestone
                  ),
                  updatedAt: new Date().toISOString(),
                }
              : req
          ),
          currentEditingRequest:
            state.currentEditingRequest?.id === requestId
              ? {
                  ...state.currentEditingRequest,
                  milestones: state.currentEditingRequest.milestones.map((milestone) =>
                    milestone.id === milestoneId ? { ...milestone, ...updates } : milestone
                  ),
                  updatedAt: new Date().toISOString(),
                }
              : state.currentEditingRequest,
        }))
      },

      deleteMilestone: (requestId, milestoneId) => {
        set((state) => ({
          requests: state.requests.map((req) =>
            req.id === requestId
              ? {
                  ...req,
                  milestones: req.milestones.filter((milestone) => milestone.id !== milestoneId),
                  updatedAt: new Date().toISOString(),
                }
              : req
          ),
          currentEditingRequest:
            state.currentEditingRequest?.id === requestId
              ? {
                  ...state.currentEditingRequest,
                  milestones: state.currentEditingRequest.milestones.filter(
                    (milestone) => milestone.id !== milestoneId
                  ),
                  updatedAt: new Date().toISOString(),
                }
              : state.currentEditingRequest,
        }))
      },

      updateMilestoneStatus: (requestId, milestoneId, status) => {
        set((state) => ({
          requests: state.requests.map((req) =>
            req.id === requestId
              ? {
                  ...req,
                  milestones: req.milestones.map((milestone) =>
                    milestone.id === milestoneId
                      ? {
                          ...milestone,
                          status,
                          completionDate:
                            status === 'completed'
                              ? new Date().toISOString()
                              : milestone.completionDate,
                        }
                      : milestone
                  ),
                  updatedAt: new Date().toISOString(),
                }
              : req
          ),
          currentEditingRequest:
            state.currentEditingRequest?.id === requestId
              ? {
                  ...state.currentEditingRequest,
                  milestones: state.currentEditingRequest.milestones.map((milestone) =>
                    milestone.id === milestoneId
                      ? {
                          ...milestone,
                          status,
                          completionDate:
                            status === 'completed'
                              ? new Date().toISOString()
                              : milestone.completionDate,
                        }
                      : milestone
                  ),
                  updatedAt: new Date().toISOString(),
                }
              : state.currentEditingRequest,
        }))
      },

      getMilestones: (requestId) => {
        return get().getRequest(requestId)?.milestones || []
      },

      getProductionProgress: (requestId) => {
        const milestones = get().getMilestones(requestId)
        if (milestones.length === 0) return 0
        const totalPercentage = milestones.reduce((sum, m) => sum + m.percentage, 0)
        return Math.round(totalPercentage / milestones.length)
      },

      updateStatus: (id, status) => {
        set((state) => ({
          requests: state.requests.map((req) =>
            req.id === id
              ? { ...req, status, updatedAt: new Date().toISOString() }
              : req
          ),
          currentEditingRequest:
            state.currentEditingRequest?.id === id
              ? {
                  ...state.currentEditingRequest,
                  status,
                  updatedAt: new Date().toISOString(),
                }
              : state.currentEditingRequest,
        }))
      },

      submitRequest: (id) => {
        set((state) => ({
          requests: state.requests.map((req) =>
            req.id === id
              ? {
                  ...req,
                  status: 'submitted',
                  submittedAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                }
              : req
          ),
          currentEditingRequest:
            state.currentEditingRequest?.id === id
              ? {
                  ...state.currentEditingRequest,
                  status: 'submitted',
                  submittedAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                }
              : state.currentEditingRequest,
        }))
      },

      completeProduction: (id) => {
        set((state) => ({
          requests: state.requests.map((req) =>
            req.id === id
              ? {
                  ...req,
                  status: 'completed',
                  completedAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                }
              : req
          ),
          currentEditingRequest:
            state.currentEditingRequest?.id === id
              ? {
                  ...state.currentEditingRequest,
                  status: 'completed',
                  completedAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                }
              : state.currentEditingRequest,
        }))
      },

      getRequests: (filter) => {
        let filtered = get().requests

        if (filter?.status) {
          filtered = filtered.filter((req) => req.status === filter.status)
        }

        if (filter?.vendorId) {
          filtered = filtered.filter((req) =>
            req.quotes.some((quote) => quote.vendorId === filter.vendorId)
          )
        }

        if (filter?.dateRange) {
          const fromDate = new Date(filter.dateRange.from)
          const toDate = new Date(filter.dateRange.to)
          filtered = filtered.filter((req) => {
            const date = new Date(req.createdAt)
            return date >= fromDate && date <= toDate
          })
        }

        return filtered
      },

      getRequestsByStatus: (status) => {
        return get().requests.filter((req) => req.status === status)
      },

      getActiveRequests: () => {
        return get().requests.filter((req) =>
          ['submitted', 'quoted', 'negotiating', 'production'].includes(req.status)
        )
      },

      getCompletedRequests: () => {
        return get().requests.filter((req) => req.status === 'completed')
      },

      getRequestStats: () => {
        const requests = get().requests
        return {
          total: requests.length,
          draft: requests.filter((r) => r.status === 'draft').length,
          submitted: requests.filter((r) => r.status === 'submitted').length,
          quoted: requests.filter((r) => r.status === 'quoted').length,
          negotiating: requests.filter((r) => r.status === 'negotiating').length,
          production: requests.filter((r) => r.status === 'production').length,
          completed: requests.filter((r) => r.status === 'completed').length,
        }
      },

      searchRequests: (query) => {
        const lowerQuery = query.toLowerCase()
        return get().requests.filter(
          (req) =>
            req.companyName.toLowerCase().includes(lowerQuery) ||
            req.productDescription.toLowerCase().includes(lowerQuery) ||
            req.contactEmail.toLowerCase().includes(lowerQuery) ||
            req.id.toLowerCase().includes(lowerQuery)
        )
      },
    }),
    {
      name: 'vendora-oem-services',
    }
  )
)
