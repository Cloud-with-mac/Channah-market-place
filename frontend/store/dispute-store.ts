import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type DisputeType = 'quality' | 'shipping' | 'payment' | 'description_mismatch'
export type DisputeStatus = 'open' | 'under_review' | 'escalated' | 'resolved' | 'closed'
export type DisputePriority = 'low' | 'medium' | 'high' | 'critical'
export type EvidenceType = 'photo' | 'document' | 'video' | 'other'
export type ResolutionType = 'refund' | 'replacement' | 'partial_refund' | 'store_credit' | 'no_action'

export interface DisputeEvidence {
  id: string
  type: EvidenceType
  url: string
  filename: string
  description?: string
  uploadedAt: string
  uploadedBy: 'customer' | 'vendor' | 'admin'
}

export interface DisputeMessage {
  id: string
  disputeId: string
  senderId: string
  senderName: string
  senderRole: 'customer' | 'vendor' | 'admin' | 'mediator'
  content: string
  isInternal?: boolean
  attachments?: DisputeEvidence[]
  createdAt: string
}

export interface DisputeTimeline {
  id: string
  disputeId: string
  event: string
  description: string
  actor?: string
  actorRole?: 'customer' | 'vendor' | 'admin' | 'system'
  metadata?: Record<string, any>
  createdAt: string
}

export interface ResolutionProposal {
  id: string
  disputeId: string
  proposedBy: 'customer' | 'vendor' | 'admin'
  proposerName: string
  type: ResolutionType
  amount?: number
  description: string
  terms?: string
  status: 'pending' | 'accepted' | 'rejected' | 'counter'
  respondedAt?: string
  createdAt: string
}

export interface Dispute {
  id: string
  disputeNumber: string
  orderId: string
  orderNumber: string
  customerId: string
  customerName: string
  customerEmail: string
  vendorId: string
  vendorName: string
  vendorEmail: string

  type: DisputeType
  status: DisputeStatus
  priority: DisputePriority

  subject: string
  description: string
  orderAmount: number
  disputedAmount: number

  evidence: DisputeEvidence[]
  messages: DisputeMessage[]
  timeline: DisputeTimeline[]
  proposals: ResolutionProposal[]

  assignedTo?: string
  assignedToName?: string
  mediatorNotes?: string

  resolution?: {
    type: ResolutionType
    amount?: number
    description: string
    resolvedBy: string
    resolvedByRole: 'customer' | 'vendor' | 'admin'
    resolvedAt: string
  }

  createdAt: string
  updatedAt: string
  dueDate?: string
  closedAt?: string
}

export interface DisputeFilters {
  status?: DisputeStatus[]
  type?: DisputeType[]
  priority?: DisputePriority[]
  dateRange?: {
    from: string
    to: string
  }
  search?: string
  sortBy?: 'createdAt' | 'updatedAt' | 'priority' | 'dueDate'
  sortOrder?: 'asc' | 'desc'
}

export interface DisputeStats {
  total: number
  open: number
  underReview: number
  escalated: number
  resolved: number
  avgResolutionTime: number // in hours
  customerWinRate: number // percentage
  vendorWinRate: number
}

interface DisputeState {
  disputes: Dispute[]
  currentDispute: Dispute | null
  filters: DisputeFilters
  stats: DisputeStats
  isLoading: boolean
  isMediationChatOpen: boolean

  // Dispute Management
  createDispute: (data: Partial<Dispute>) => Promise<string>
  updateDispute: (id: string, data: Partial<Dispute>) => Promise<void>
  getDispute: (id: string) => Dispute | undefined
  setCurrentDispute: (dispute: Dispute | null) => void
  deleteDispute: (id: string) => Promise<void>

  // Evidence Management
  addEvidence: (disputeId: string, evidence: Omit<DisputeEvidence, 'id' | 'uploadedAt'>) => Promise<void>
  removeEvidence: (disputeId: string, evidenceId: string) => Promise<void>

  // Messaging
  sendMessage: (disputeId: string, message: Omit<DisputeMessage, 'id' | 'createdAt'>) => Promise<void>
  getMessages: (disputeId: string) => DisputeMessage[]

  // Timeline
  addTimelineEvent: (disputeId: string, event: Omit<DisputeTimeline, 'id' | 'createdAt'>) => void
  getTimeline: (disputeId: string) => DisputeTimeline[]

  // Resolution Proposals
  createProposal: (disputeId: string, proposal: Omit<ResolutionProposal, 'id' | 'createdAt' | 'status'>) => Promise<void>
  respondToProposal: (disputeId: string, proposalId: string, action: 'accept' | 'reject' | 'counter', counterProposal?: Partial<ResolutionProposal>) => Promise<void>

  // Status Management
  updateStatus: (disputeId: string, status: DisputeStatus, reason?: string) => Promise<void>
  escalateDispute: (disputeId: string, reason: string) => Promise<void>
  resolveDispute: (disputeId: string, resolution: Dispute['resolution']) => Promise<void>

  // Filters & Search
  setFilters: (filters: Partial<DisputeFilters>) => void
  clearFilters: () => void
  getFilteredDisputes: () => Dispute[]

  // Stats
  updateStats: () => void

  // UI State
  toggleMediationChat: () => void
  setLoading: (loading: boolean) => void
}

// Helper function to generate dispute number
const generateDisputeNumber = () => {
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substr(2, 4).toUpperCase()
  return `DISP-${timestamp}-${random}`
}

// Helper function to calculate stats
const calculateStats = (disputes: Dispute[]): DisputeStats => {
  const total = disputes.length
  const open = disputes.filter(d => d.status === 'open').length
  const underReview = disputes.filter(d => d.status === 'under_review').length
  const escalated = disputes.filter(d => d.status === 'escalated').length
  const resolved = disputes.filter(d => d.status === 'resolved' || d.status === 'closed').length

  // Calculate average resolution time
  const resolvedDisputes = disputes.filter(d => d.resolution?.resolvedAt)
  const totalResolutionTime = resolvedDisputes.reduce((sum, d) => {
    const created = new Date(d.createdAt).getTime()
    const resolved = new Date(d.resolution!.resolvedAt).getTime()
    return sum + (resolved - created)
  }, 0)
  const avgResolutionTime = resolvedDisputes.length > 0
    ? totalResolutionTime / resolvedDisputes.length / (1000 * 60 * 60) // Convert to hours
    : 0

  // Calculate win rates (simplified - based on resolution type)
  const customerFavorable = resolvedDisputes.filter(d =>
    d.resolution?.type === 'refund' || d.resolution?.type === 'replacement'
  ).length
  const vendorFavorable = resolvedDisputes.filter(d =>
    d.resolution?.type === 'no_action'
  ).length

  const customerWinRate = resolvedDisputes.length > 0
    ? (customerFavorable / resolvedDisputes.length) * 100
    : 0
  const vendorWinRate = resolvedDisputes.length > 0
    ? (vendorFavorable / resolvedDisputes.length) * 100
    : 0

  return {
    total,
    open,
    underReview,
    escalated,
    resolved,
    avgResolutionTime,
    customerWinRate,
    vendorWinRate,
  }
}

export const useDisputeStore = create<DisputeState>()(
  persist(
    (set, get) => ({
      disputes: [],
      currentDispute: null,
      filters: {
        sortBy: 'createdAt',
        sortOrder: 'desc',
      },
      stats: {
        total: 0,
        open: 0,
        underReview: 0,
        escalated: 0,
        resolved: 0,
        avgResolutionTime: 0,
        customerWinRate: 0,
        vendorWinRate: 0,
      },
      isLoading: false,
      isMediationChatOpen: false,

      // Dispute Management
      createDispute: async (data) => {
        const newDispute: Dispute = {
          id: `dispute-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          disputeNumber: generateDisputeNumber(),
          orderId: data.orderId || '',
          orderNumber: data.orderNumber || '',
          customerId: data.customerId || '',
          customerName: data.customerName || '',
          customerEmail: data.customerEmail || '',
          vendorId: data.vendorId || '',
          vendorName: data.vendorName || '',
          vendorEmail: data.vendorEmail || '',
          type: data.type || 'quality',
          status: 'open',
          priority: data.priority || 'medium',
          subject: data.subject || '',
          description: data.description || '',
          orderAmount: data.orderAmount || 0,
          disputedAmount: data.disputedAmount || 0,
          evidence: data.evidence || [],
          messages: [],
          timeline: [],
          proposals: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          ...data,
        }

        // Add initial timeline event
        newDispute.timeline.push({
          id: `timeline-${Date.now()}`,
          disputeId: newDispute.id,
          event: 'Dispute Created',
          description: `Dispute ${newDispute.disputeNumber} has been filed`,
          actor: newDispute.customerName,
          actorRole: 'customer',
          createdAt: new Date().toISOString(),
        })

        set((state) => ({
          disputes: [newDispute, ...state.disputes],
        }))

        get().updateStats()

        return newDispute.id
      },

      updateDispute: async (id, data) => {
        set((state) => ({
          disputes: state.disputes.map((dispute) =>
            dispute.id === id
              ? { ...dispute, ...data, updatedAt: new Date().toISOString() }
              : dispute
          ),
        }))

        get().updateStats()
      },

      getDispute: (id) => {
        return get().disputes.find((dispute) => dispute.id === id)
      },

      setCurrentDispute: (dispute) => {
        set({ currentDispute: dispute })
      },

      deleteDispute: async (id) => {
        set((state) => ({
          disputes: state.disputes.filter((dispute) => dispute.id !== id),
        }))

        get().updateStats()
      },

      // Evidence Management
      addEvidence: async (disputeId, evidence) => {
        const newEvidence: DisputeEvidence = {
          ...evidence,
          id: `evidence-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          uploadedAt: new Date().toISOString(),
        }

        set((state) => ({
          disputes: state.disputes.map((dispute) =>
            dispute.id === disputeId
              ? {
                  ...dispute,
                  evidence: [...dispute.evidence, newEvidence],
                  updatedAt: new Date().toISOString(),
                }
              : dispute
          ),
        }))

        // Add timeline event
        get().addTimelineEvent(disputeId, {
          disputeId,
          event: 'Evidence Added',
          description: `New ${evidence.type} evidence uploaded`,
          actor: evidence.uploadedBy,
          actorRole: evidence.uploadedBy,
        })
      },

      removeEvidence: async (disputeId, evidenceId) => {
        set((state) => ({
          disputes: state.disputes.map((dispute) =>
            dispute.id === disputeId
              ? {
                  ...dispute,
                  evidence: dispute.evidence.filter((e) => e.id !== evidenceId),
                  updatedAt: new Date().toISOString(),
                }
              : dispute
          ),
        }))
      },

      // Messaging
      sendMessage: async (disputeId, message) => {
        const newMessage: DisputeMessage = {
          ...message,
          id: `message-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          createdAt: new Date().toISOString(),
        }

        set((state) => ({
          disputes: state.disputes.map((dispute) =>
            dispute.id === disputeId
              ? {
                  ...dispute,
                  messages: [...dispute.messages, newMessage],
                  updatedAt: new Date().toISOString(),
                }
              : dispute
          ),
        }))
      },

      getMessages: (disputeId) => {
        const dispute = get().disputes.find((d) => d.id === disputeId)
        return dispute?.messages || []
      },

      // Timeline
      addTimelineEvent: (disputeId, event) => {
        const newEvent: DisputeTimeline = {
          ...event,
          id: `timeline-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          createdAt: new Date().toISOString(),
        }

        set((state) => ({
          disputes: state.disputes.map((dispute) =>
            dispute.id === disputeId
              ? {
                  ...dispute,
                  timeline: [...dispute.timeline, newEvent],
                  updatedAt: new Date().toISOString(),
                }
              : dispute
          ),
        }))
      },

      getTimeline: (disputeId) => {
        const dispute = get().disputes.find((d) => d.id === disputeId)
        return dispute?.timeline || []
      },

      // Resolution Proposals
      createProposal: async (disputeId, proposal) => {
        const newProposal: ResolutionProposal = {
          ...proposal,
          id: `proposal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          status: 'pending',
          createdAt: new Date().toISOString(),
        }

        set((state) => ({
          disputes: state.disputes.map((dispute) =>
            dispute.id === disputeId
              ? {
                  ...dispute,
                  proposals: [...dispute.proposals, newProposal],
                  updatedAt: new Date().toISOString(),
                }
              : dispute
          ),
        }))

        // Add timeline event
        get().addTimelineEvent(disputeId, {
          disputeId,
          event: 'Resolution Proposal',
          description: `New ${proposal.type} proposal submitted by ${proposal.proposerName}`,
          actor: proposal.proposerName,
          actorRole: proposal.proposedBy,
        })
      },

      respondToProposal: async (disputeId, proposalId, action, counterProposal) => {
        set((state) => ({
          disputes: state.disputes.map((dispute) =>
            dispute.id === disputeId
              ? {
                  ...dispute,
                  proposals: dispute.proposals.map((p) =>
                    p.id === proposalId
                      ? {
                          ...p,
                          status: action === 'counter' ? 'counter' : action === 'accept' ? 'accepted' : 'rejected',
                          respondedAt: new Date().toISOString(),
                        }
                      : p
                  ),
                  updatedAt: new Date().toISOString(),
                }
              : dispute
          ),
        }))

        // Add timeline event
        get().addTimelineEvent(disputeId, {
          disputeId,
          event: 'Proposal Response',
          description: `Proposal ${action === 'accept' ? 'accepted' : action === 'reject' ? 'rejected' : 'countered'}`,
          actorRole: 'system',
        })

        // If accepted, create counter proposal
        if (action === 'counter' && counterProposal) {
          await get().createProposal(disputeId, counterProposal as any)
        }
      },

      // Status Management
      updateStatus: async (disputeId, status, reason) => {
        await get().updateDispute(disputeId, { status })

        get().addTimelineEvent(disputeId, {
          disputeId,
          event: 'Status Changed',
          description: `Status changed to ${status}${reason ? `: ${reason}` : ''}`,
          actorRole: 'system',
        })
      },

      escalateDispute: async (disputeId, reason) => {
        await get().updateDispute(disputeId, {
          status: 'escalated',
          priority: 'high',
        })

        get().addTimelineEvent(disputeId, {
          disputeId,
          event: 'Dispute Escalated',
          description: reason,
          actorRole: 'system',
        })
      },

      resolveDispute: async (disputeId, resolution) => {
        await get().updateDispute(disputeId, {
          status: 'resolved',
          resolution: {
            ...resolution,
            resolvedAt: new Date().toISOString(),
          } as any,
          closedAt: new Date().toISOString(),
        })

        get().addTimelineEvent(disputeId, {
          disputeId,
          event: 'Dispute Resolved',
          description: `Resolved with ${resolution?.type}: ${resolution?.description}`,
          actor: resolution?.resolvedBy,
          actorRole: resolution?.resolvedByRole,
        })
      },

      // Filters & Search
      setFilters: (filters) => {
        set((state) => ({
          filters: { ...state.filters, ...filters },
        }))
      },

      clearFilters: () => {
        set({
          filters: {
            sortBy: 'createdAt',
            sortOrder: 'desc',
          },
        })
      },

      getFilteredDisputes: () => {
        const { disputes, filters } = get()
        let filtered = [...disputes]

        // Apply status filter
        if (filters.status && filters.status.length > 0) {
          filtered = filtered.filter((d) => filters.status!.includes(d.status))
        }

        // Apply type filter
        if (filters.type && filters.type.length > 0) {
          filtered = filtered.filter((d) => filters.type!.includes(d.type))
        }

        // Apply priority filter
        if (filters.priority && filters.priority.length > 0) {
          filtered = filtered.filter((d) => filters.priority!.includes(d.priority))
        }

        // Apply search
        if (filters.search) {
          const searchLower = filters.search.toLowerCase()
          filtered = filtered.filter(
            (d) =>
              d.disputeNumber.toLowerCase().includes(searchLower) ||
              d.subject.toLowerCase().includes(searchLower) ||
              d.customerName.toLowerCase().includes(searchLower) ||
              d.vendorName.toLowerCase().includes(searchLower)
          )
        }

        // Apply date range
        if (filters.dateRange) {
          const from = new Date(filters.dateRange.from).getTime()
          const to = new Date(filters.dateRange.to).getTime()
          filtered = filtered.filter((d) => {
            const created = new Date(d.createdAt).getTime()
            return created >= from && created <= to
          })
        }

        // Apply sorting
        if (filters.sortBy) {
          filtered.sort((a, b) => {
            const aVal = a[filters.sortBy!] || ''
            const bVal = b[filters.sortBy!] || ''

            if (filters.sortOrder === 'asc') {
              return aVal > bVal ? 1 : -1
            } else {
              return aVal < bVal ? 1 : -1
            }
          })
        }

        return filtered
      },

      // Stats
      updateStats: () => {
        const stats = calculateStats(get().disputes)
        set({ stats })
      },

      // UI State
      toggleMediationChat: () => {
        set((state) => ({
          isMediationChatOpen: !state.isMediationChatOpen,
        }))
      },

      setLoading: (loading) => {
        set({ isLoading: loading })
      },
    }),
    {
      name: 'dispute-storage',
      partialize: (state) => ({
        disputes: state.disputes,
        filters: state.filters,
      }),
    }
  )
)
