import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * Escrow Transaction Interface
 */
export interface Milestone {
  id: string
  name: string
  description: string
  amount: number
  percentage: number
  dueDate: string
  status: 'pending' | 'released' | 'disputed' | 'completed'
  releasedDate?: string
  notes?: string
}

export interface Dispute {
  id: string
  escrowId: string
  initiatedBy: 'buyer' | 'seller'
  reason: string
  description: string
  status: 'open' | 'under_review' | 'resolved' | 'closed'
  evidenceUrls: string[]
  createdAt: string
  resolution?: string
  resolvedAt?: string
  resolvedBy?: string
}

export interface EscrowTransaction {
  id: string
  orderId: string
  buyerId: string
  sellerId: string
  vendorId?: string
  buyerName: string
  sellerName: string
  totalAmount: number
  currency: string
  status: 'pending' | 'active' | 'completed' | 'cancelled' | 'disputed'
  type: 'full' | 'milestone'
  milestones: Milestone[]
  currentMilestoneIndex: number
  releaseConditions: string
  deliveryDeadline: string
  qualityCheckRequired: boolean
  qualityCheckPassed?: boolean
  autoReleaseDate?: string
  holdingPeriod: number // in days
  createdAt: string
  updatedAt: string
  startedAt?: string
  completedAt?: string
  disputes: Dispute[]
  transactionHistory: TransactionRecord[]
}

export interface TransactionRecord {
  id: string
  type: 'created' | 'milestone_created' | 'milestone_released' | 'payment_held' | 'payment_released' | 'dispute_filed' | 'dispute_resolved' | 'completed' | 'cancelled'
  amount?: number
  description: string
  timestamp: string
  performedBy?: string
  milestoneId?: string
  relatedDocuments?: string[]
}

export interface EscrowAccount {
  id: string
  userId: string
  totalHeld: number
  totalReleased: number
  totalInDispute: number
  currency: string
  createdAt: string
  transactions: EscrowTransaction[]
}

/**
 * Escrow Store State
 */
export interface EscrowStoreState {
  // Accounts
  accounts: EscrowAccount[]
  currentAccount: EscrowAccount | null

  // Transactions
  transactions: EscrowTransaction[]
  selectedTransaction: EscrowTransaction | null
  filteredTransactions: EscrowTransaction[]

  // UI State
  isLoading: boolean
  error: string | null
  successMessage: string | null

  // Filters
  statusFilter: 'all' | 'pending' | 'active' | 'completed' | 'cancelled' | 'disputed'
  typeFilter: 'all' | 'full' | 'milestone'
  dateRangeFilter: { from: string; to: string } | null
  searchQuery: string

  // Pagination
  currentPage: number
  pageSize: number
  totalItems: number

  // Modals
  isCreateDialogOpen: boolean
  isDetailDialogOpen: boolean
  isMilestoneDialogOpen: boolean
  isDisputeDialogOpen: boolean

  // Actions

  // Account Actions
  setCurrentAccount: (account: EscrowAccount | null) => void
  updateAccountBalance: (accountId: string, held: number, released: number, disputed: number) => void

  // Transaction Actions
  addTransaction: (transaction: EscrowTransaction) => void
  updateTransaction: (id: string, updates: Partial<EscrowTransaction>) => void
  setSelectedTransaction: (transaction: EscrowTransaction | null) => void
  deleteTransaction: (id: string) => void

  // Milestone Actions
  addMilestone: (transactionId: string, milestone: Milestone) => void
  updateMilestone: (transactionId: string, milestoneId: string, updates: Partial<Milestone>) => void
  releaseMilestonePayment: (transactionId: string, milestoneId: string, releaseReason: string) => Promise<void>

  // Dispute Actions
  addDispute: (transactionId: string, dispute: Dispute) => void
  updateDispute: (transactionId: string, disputeId: string, updates: Partial<Dispute>) => void
  resolveDispute: (transactionId: string, disputeId: string, resolution: string, award: 'buyer' | 'seller' | 'split') => Promise<void>

  // Transaction History
  addHistoryRecord: (transactionId: string, record: TransactionRecord) => void

  // Payment Release
  releaseFullPayment: (transactionId: string, releaseReason: string) => Promise<void>
  holdPayment: (transactionId: string) => Promise<void>
  cancelTransaction: (transactionId: string, reason: string) => Promise<void>

  // Filter and Search
  setStatusFilter: (status: 'all' | 'pending' | 'active' | 'completed' | 'cancelled' | 'disputed') => void
  setTypeFilter: (type: 'all' | 'full' | 'milestone') => void
  setDateRangeFilter: (range: { from: string; to: string } | null) => void
  setSearchQuery: (query: string) => void
  applyFilters: () => void

  // Pagination
  setCurrentPage: (page: number) => void
  setPageSize: (size: number) => void

  // Modal Actions
  openCreateDialog: () => void
  closeCreateDialog: () => void
  openDetailDialog: (transaction: EscrowTransaction) => void
  closeDetailDialog: () => void
  openMilestoneDialog: (transaction: EscrowTransaction) => void
  closeMilestoneDialog: () => void
  openDisputeDialog: (transaction: EscrowTransaction) => void
  closeDisputeDialog: () => void

  // UI State Actions
  setError: (error: string | null) => void
  setSuccessMessage: (message: string | null) => void
  setIsLoading: (loading: boolean) => void
  clearError: () => void
  clearSuccessMessage: () => void

  // Bulk Actions
  getTransactionStats: () => {
    total: number
    active: number
    completed: number
    disputed: number
    totalAmount: number
    averageAmount: number
  }
  getUpcomingMilestones: () => Milestone[]
  getOpenDisputes: () => Dispute[]
  calculateEscrowBreakdown: () => {
    pending: number
    active: number
    released: number
    disputed: number
  }

  // Reset
  reset: () => void
}

/**
 * Zustand Escrow Store
 */
export const useEscrowStore = create<EscrowStoreState>()(
  persist(
    (set, get) => ({
      // Initial State
      accounts: [],
      currentAccount: null,
      transactions: [],
      selectedTransaction: null,
      filteredTransactions: [],
      isLoading: false,
      error: null,
      successMessage: null,
      statusFilter: 'all',
      typeFilter: 'all',
      dateRangeFilter: null,
      searchQuery: '',
      currentPage: 1,
      pageSize: 10,
      totalItems: 0,
      isCreateDialogOpen: false,
      isDetailDialogOpen: false,
      isMilestoneDialogOpen: false,
      isDisputeDialogOpen: false,

      // Account Actions
      setCurrentAccount: (account) => set({ currentAccount: account }),

      updateAccountBalance: (accountId, held, released, disputed) => {
        set((state) => ({
          accounts: state.accounts.map((acc) =>
            acc.id === accountId
              ? {
                  ...acc,
                  totalHeld: held,
                  totalReleased: released,
                  totalInDispute: disputed,
                }
              : acc
          ),
          currentAccount: state.currentAccount?.id === accountId
            ? {
                ...state.currentAccount,
                totalHeld: held,
                totalReleased: released,
                totalInDispute: disputed,
              }
            : state.currentAccount,
        }))
      },

      // Transaction Actions
      addTransaction: (transaction) => {
        set((state) => ({
          transactions: [transaction, ...state.transactions],
          totalItems: state.totalItems + 1,
        }))
        get().applyFilters()
      },

      updateTransaction: (id, updates) => {
        set((state) => ({
          transactions: state.transactions.map((t) =>
            t.id === id ? { ...t, ...updates } : t
          ),
          selectedTransaction:
            state.selectedTransaction?.id === id
              ? { ...state.selectedTransaction, ...updates }
              : state.selectedTransaction,
        }))
        get().applyFilters()
      },

      setSelectedTransaction: (transaction) => set({ selectedTransaction: transaction }),

      deleteTransaction: (id) => {
        set((state) => ({
          transactions: state.transactions.filter((t) => t.id !== id),
          selectedTransaction: state.selectedTransaction?.id === id ? null : state.selectedTransaction,
          totalItems: state.totalItems - 1,
        }))
        get().applyFilters()
      },

      // Milestone Actions
      addMilestone: (transactionId, milestone) => {
        set((state) => ({
          transactions: state.transactions.map((t) =>
            t.id === transactionId
              ? {
                  ...t,
                  milestones: [...t.milestones, milestone],
                }
              : t
          ),
          selectedTransaction:
            state.selectedTransaction?.id === transactionId
              ? {
                  ...state.selectedTransaction,
                  milestones: [...state.selectedTransaction.milestones, milestone],
                }
              : state.selectedTransaction,
        }))
      },

      updateMilestone: (transactionId, milestoneId, updates) => {
        set((state) => ({
          transactions: state.transactions.map((t) =>
            t.id === transactionId
              ? {
                  ...t,
                  milestones: t.milestones.map((m) =>
                    m.id === milestoneId ? { ...m, ...updates } : m
                  ),
                }
              : t
          ),
          selectedTransaction:
            state.selectedTransaction?.id === transactionId
              ? {
                  ...state.selectedTransaction,
                  milestones: state.selectedTransaction.milestones.map((m) =>
                    m.id === milestoneId ? { ...m, ...updates } : m
                  ),
                }
              : state.selectedTransaction,
        }))
      },

      releaseMilestonePayment: async (transactionId, milestoneId, releaseReason) => {
        try {
          set({ isLoading: true, error: null })

          const transaction = get().transactions.find((t) => t.id === transactionId)
          if (!transaction) throw new Error('Transaction not found')

          const milestoneIndex = transaction.milestones.findIndex((m) => m.id === milestoneId)
          if (milestoneIndex === -1) throw new Error('Milestone not found')

          const updatedMilestones = [...transaction.milestones]
          updatedMilestones[milestoneIndex] = {
            ...updatedMilestones[milestoneIndex],
            status: 'released',
            releasedDate: new Date().toISOString(),
          }

          const historyRecord: TransactionRecord = {
            id: `record_${Date.now()}`,
            type: 'milestone_released',
            amount: updatedMilestones[milestoneIndex].amount,
            description: `Milestone "${updatedMilestones[milestoneIndex].name}" released. Reason: ${releaseReason}`,
            timestamp: new Date().toISOString(),
            milestoneId: milestoneId,
          }

          get().updateTransaction(transactionId, {
            milestones: updatedMilestones,
            transactionHistory: [...transaction.transactionHistory, historyRecord],
          })

          set({
            successMessage: `Milestone payment of ${transaction.currency} ${updatedMilestones[milestoneIndex].amount} released successfully`,
            isLoading: false,
          })
        } catch (error: any) {
          set({ error: error.message, isLoading: false })
          throw error
        }
      },

      // Dispute Actions
      addDispute: (transactionId, dispute) => {
        set((state) => ({
          transactions: state.transactions.map((t) =>
            t.id === transactionId
              ? {
                  ...t,
                  disputes: [...t.disputes, dispute],
                  status: 'disputed',
                }
              : t
          ),
          selectedTransaction:
            state.selectedTransaction?.id === transactionId
              ? {
                  ...state.selectedTransaction,
                  disputes: [...state.selectedTransaction.disputes, dispute],
                  status: 'disputed',
                }
              : state.selectedTransaction,
        }))

        const transaction = get().transactions.find((t) => t.id === transactionId)
        if (transaction) {
          const historyRecord: TransactionRecord = {
            id: `record_${Date.now()}`,
            type: 'dispute_filed',
            description: `Dispute filed by ${dispute.initiatedBy}. Reason: ${dispute.reason}`,
            timestamp: dispute.createdAt,
          }
          get().addHistoryRecord(transactionId, historyRecord)
        }
      },

      updateDispute: (transactionId, disputeId, updates) => {
        set((state) => ({
          transactions: state.transactions.map((t) =>
            t.id === transactionId
              ? {
                  ...t,
                  disputes: t.disputes.map((d) =>
                    d.id === disputeId ? { ...d, ...updates } : d
                  ),
                }
              : t
          ),
          selectedTransaction:
            state.selectedTransaction?.id === transactionId
              ? {
                  ...state.selectedTransaction,
                  disputes: state.selectedTransaction.disputes.map((d) =>
                    d.id === disputeId ? { ...d, ...updates } : d
                  ),
                }
              : state.selectedTransaction,
        }))
      },

      resolveDispute: async (transactionId, disputeId, resolution, award) => {
        try {
          set({ isLoading: true, error: null })

          const transaction = get().transactions.find((t) => t.id === transactionId)
          if (!transaction) throw new Error('Transaction not found')

          const dispute = transaction.disputes.find((d) => d.id === disputeId)
          if (!dispute) throw new Error('Dispute not found')

          const resolvedAt = new Date().toISOString()

          get().updateDispute(transactionId, disputeId, {
            status: 'resolved',
            resolution,
            resolvedAt,
            resolvedBy: 'admin', // This would come from current user in real app
          })

          const historyRecord: TransactionRecord = {
            id: `record_${Date.now()}`,
            type: 'dispute_resolved',
            description: `Dispute resolved in favor of ${award}. Resolution: ${resolution}`,
            timestamp: resolvedAt,
          }
          get().addHistoryRecord(transactionId, historyRecord)

          // Determine transaction status based on award
          let newStatus: EscrowTransaction['status'] = 'active'
          if (award === 'buyer' || award === 'seller') {
            newStatus = 'completed'
          }

          get().updateTransaction(transactionId, { status: newStatus })

          set({
            successMessage: `Dispute resolved successfully. Award: ${award}`,
            isLoading: false,
          })
        } catch (error: any) {
          set({ error: error.message, isLoading: false })
          throw error
        }
      },

      // Transaction History
      addHistoryRecord: (transactionId, record) => {
        const transaction = get().transactions.find((t) => t.id === transactionId)
        if (transaction) {
          get().updateTransaction(transactionId, {
            transactionHistory: [...transaction.transactionHistory, record],
          })
        }
      },

      // Payment Release
      releaseFullPayment: async (transactionId, releaseReason) => {
        try {
          set({ isLoading: true, error: null })

          const transaction = get().transactions.find((t) => t.id === transactionId)
          if (!transaction) throw new Error('Transaction not found')

          const historyRecord: TransactionRecord = {
            id: `record_${Date.now()}`,
            type: 'payment_released',
            amount: transaction.totalAmount,
            description: `Full payment of ${transaction.currency} ${transaction.totalAmount} released. Reason: ${releaseReason}`,
            timestamp: new Date().toISOString(),
          }

          get().updateTransaction(transactionId, {
            status: 'completed',
            completedAt: new Date().toISOString(),
            transactionHistory: [...transaction.transactionHistory, historyRecord],
          })

          set({
            successMessage: `Payment of ${transaction.currency} ${transaction.totalAmount} released successfully`,
            isLoading: false,
          })
        } catch (error: any) {
          set({ error: error.message, isLoading: false })
          throw error
        }
      },

      holdPayment: async (transactionId) => {
        try {
          set({ isLoading: true, error: null })

          const transaction = get().transactions.find((t) => t.id === transactionId)
          if (!transaction) throw new Error('Transaction not found')

          const historyRecord: TransactionRecord = {
            id: `record_${Date.now()}`,
            type: 'payment_held',
            amount: transaction.totalAmount,
            description: `Payment of ${transaction.currency} ${transaction.totalAmount} held pending review`,
            timestamp: new Date().toISOString(),
          }

          get().updateTransaction(transactionId, {
            status: 'pending',
            transactionHistory: [...transaction.transactionHistory, historyRecord],
          })

          set({
            successMessage: 'Payment held successfully',
            isLoading: false,
          })
        } catch (error: any) {
          set({ error: error.message, isLoading: false })
          throw error
        }
      },

      cancelTransaction: async (transactionId, reason) => {
        try {
          set({ isLoading: true, error: null })

          const transaction = get().transactions.find((t) => t.id === transactionId)
          if (!transaction) throw new Error('Transaction not found')

          const historyRecord: TransactionRecord = {
            id: `record_${Date.now()}`,
            type: 'cancelled',
            description: `Transaction cancelled. Reason: ${reason}`,
            timestamp: new Date().toISOString(),
          }

          get().updateTransaction(transactionId, {
            status: 'cancelled',
            transactionHistory: [...transaction.transactionHistory, historyRecord],
          })

          set({
            successMessage: 'Transaction cancelled successfully',
            isLoading: false,
          })
        } catch (error: any) {
          set({ error: error.message, isLoading: false })
          throw error
        }
      },

      // Filter and Search
      setStatusFilter: (status) => set({ statusFilter: status, currentPage: 1 }),

      setTypeFilter: (type) => set({ typeFilter: type, currentPage: 1 }),

      setDateRangeFilter: (range) => set({ dateRangeFilter: range, currentPage: 1 }),

      setSearchQuery: (query) => set({ searchQuery: query, currentPage: 1 }),

      applyFilters: () => {
        const { transactions, statusFilter, typeFilter, searchQuery, dateRangeFilter, currentPage, pageSize } = get()

        let filtered = [...transactions]

        // Status filter
        if (statusFilter !== 'all') {
          filtered = filtered.filter((t) => t.status === statusFilter)
        }

        // Type filter
        if (typeFilter !== 'all') {
          filtered = filtered.filter((t) => t.type === typeFilter)
        }

        // Search query
        if (searchQuery) {
          const query = searchQuery.toLowerCase()
          filtered = filtered.filter(
            (t) =>
              t.id.toLowerCase().includes(query) ||
              t.buyerName.toLowerCase().includes(query) ||
              t.sellerName.toLowerCase().includes(query) ||
              t.orderId.toLowerCase().includes(query)
          )
        }

        // Date range filter
        if (dateRangeFilter) {
          const fromDate = new Date(dateRangeFilter.from).getTime()
          const toDate = new Date(dateRangeFilter.to).getTime()
          filtered = filtered.filter((t) => {
            const txDate = new Date(t.createdAt).getTime()
            return txDate >= fromDate && txDate <= toDate
          })
        }

        const totalItems = filtered.length
        const start = (currentPage - 1) * pageSize
        const end = start + pageSize
        const paginatedFiltered = filtered.slice(start, end)

        set({
          filteredTransactions: paginatedFiltered,
          totalItems,
        })
      },

      // Pagination
      setCurrentPage: (page) => {
        set({ currentPage: page })
        get().applyFilters()
      },

      setPageSize: (size) => {
        set({ pageSize: size, currentPage: 1 })
        get().applyFilters()
      },

      // Modal Actions
      openCreateDialog: () => set({ isCreateDialogOpen: true }),
      closeCreateDialog: () => set({ isCreateDialogOpen: false }),
      openDetailDialog: (transaction) => {
        set({ selectedTransaction: transaction, isDetailDialogOpen: true })
      },
      closeDetailDialog: () => set({ isDetailDialogOpen: false }),
      openMilestoneDialog: (transaction) => {
        set({ selectedTransaction: transaction, isMilestoneDialogOpen: true })
      },
      closeMilestoneDialog: () => set({ isMilestoneDialogOpen: false }),
      openDisputeDialog: (transaction) => {
        set({ selectedTransaction: transaction, isDisputeDialogOpen: true })
      },
      closeDisputeDialog: () => set({ isDisputeDialogOpen: false }),

      // UI State Actions
      setError: (error) => set({ error }),
      setSuccessMessage: (message) => set({ successMessage: message }),
      setIsLoading: (loading) => set({ isLoading: loading }),
      clearError: () => set({ error: null }),
      clearSuccessMessage: () => set({ successMessage: null }),

      // Bulk Actions
      getTransactionStats: () => {
        const transactions = get().transactions
        const completed = transactions.filter((t) => t.status === 'completed')
        const active = transactions.filter((t) => t.status === 'active')
        const disputed = transactions.filter((t) => t.status === 'disputed')

        const totalAmount = transactions.reduce((sum, t) => sum + t.totalAmount, 0)

        return {
          total: transactions.length,
          active: active.length,
          completed: completed.length,
          disputed: disputed.length,
          totalAmount,
          averageAmount: transactions.length > 0 ? totalAmount / transactions.length : 0,
        }
      },

      getUpcomingMilestones: () => {
        const transactions = get().transactions
        const now = new Date()
        const upcoming: Milestone[] = []

        transactions.forEach((t) => {
          t.milestones.forEach((m) => {
            if (m.status === 'pending') {
              const dueDate = new Date(m.dueDate)
              if (dueDate > now) {
                upcoming.push(m)
              }
            }
          })
        })

        return upcoming.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
      },

      getOpenDisputes: () => {
        const transactions = get().transactions
        const disputes: Dispute[] = []

        transactions.forEach((t) => {
          t.disputes.forEach((d) => {
            if (d.status === 'open' || d.status === 'under_review') {
              disputes.push(d)
            }
          })
        })

        return disputes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      },

      calculateEscrowBreakdown: () => {
        const transactions = get().transactions

        return {
          pending: transactions.filter((t) => t.status === 'pending').reduce((sum, t) => sum + t.totalAmount, 0),
          active: transactions.filter((t) => t.status === 'active').reduce((sum, t) => sum + t.totalAmount, 0),
          released: transactions.filter((t) => t.status === 'completed').reduce((sum, t) => sum + t.totalAmount, 0),
          disputed: transactions.filter((t) => t.status === 'disputed').reduce((sum, t) => sum + t.totalAmount, 0),
        }
      },

      // Reset
      reset: () => {
        set({
          accounts: [],
          currentAccount: null,
          transactions: [],
          selectedTransaction: null,
          filteredTransactions: [],
          isLoading: false,
          error: null,
          successMessage: null,
          statusFilter: 'all',
          typeFilter: 'all',
          dateRangeFilter: null,
          searchQuery: '',
          currentPage: 1,
          pageSize: 10,
          totalItems: 0,
          isCreateDialogOpen: false,
          isDetailDialogOpen: false,
          isMilestoneDialogOpen: false,
          isDisputeDialogOpen: false,
        })
      },
    }),
    {
      name: 'escrow-store',
      version: 1,
    }
  )
)

export default useEscrowStore
