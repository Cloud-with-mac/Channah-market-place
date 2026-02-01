import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Types
export type LCStatus = 'draft' | 'submitted' | 'issued' | 'accepted' | 'completed'
export type AmendmentStatus = 'pending' | 'approved' | 'rejected'
export type DocumentType = 'commercial_invoice' | 'packing_list' | 'bill_of_lading' | 'certificate_of_origin' | 'insurance' | 'inspection_report' | 'other'

export interface BankInfo {
  bankName: string
  accountHolder: string
  accountNumber: string
  swiftCode: string
  bankAddress: string
  countryCode: string
}

export interface LCDocument {
  id: string
  name: string
  type: DocumentType
  fileUrl: string
  fileName: string
  uploadedAt: string
  size: number
}

export interface Amendment {
  id: string
  lcId: string
  amendmentNumber: number
  status: AmendmentStatus
  requestedAt: string
  approvedAt?: string
  rejectedAt?: string
  reason: string
  changes: string
  remarks?: string
}

export interface LetterOfCredit {
  id: string
  referenceNumber: string
  status: LCStatus
  supplier: {
    name: string
    country: string
    contactEmail: string
    contactPhone?: string
  }
  buyer: {
    name: string
    country: string
    contactEmail: string
    contactPhone?: string
  }
  issueBank: BankInfo
  adviserBank?: BankInfo
  value: number
  currency: string
  expiryDate: string
  shipmentDate: string
  lastShipmentDate: string
  ports: {
    loading: string
    discharge: string
  }
  goodsDescription: string
  documents: LCDocument[]
  amendments: Amendment[]
  createdAt: string
  updatedAt: string
  submittedAt?: string
  issuedAt?: string
  acceptedAt?: string
  completedAt?: string
  notes?: string
  conditions?: string[]
}

interface LCFilters {
  status?: LCStatus
  currency?: string
  dateRange?: {
    from: string
    to: string
  }
}

interface LCStats {
  total: number
  draft: number
  submitted: number
  issued: number
  accepted: number
  completed: number
  totalValue: number
  pendingAmendments: number
}

interface LCStoreState {
  lcs: LetterOfCredit[]
  selectedLC: LetterOfCredit | null
  filters: LCFilters
  stats: LCStats
  isLoading: boolean
  error: string | null

  // L/C Management
  createLC: (lc: Omit<LetterOfCredit, 'id' | 'createdAt' | 'updatedAt' | 'documents' | 'amendments'>) => void
  updateLC: (id: string, updates: Partial<LetterOfCredit>) => void
  deleteLC: (id: string) => void
  selectLC: (id: string | null) => void
  submitLC: (id: string) => void
  acceptLC: (id: string) => void
  completeLC: (id: string) => void

  // Document Management
  addDocument: (lcId: string, document: Omit<LCDocument, 'id' | 'uploadedAt'>) => void
  removeDocument: (lcId: string, documentId: string) => void
  getDocuments: (lcId: string) => LCDocument[]

  // Amendment Management
  requestAmendment: (lcId: string, changes: string, reason: string) => void
  approveAmendment: (lcId: string, amendmentId: string, remarks?: string) => void
  rejectAmendment: (lcId: string, amendmentId: string, remarks?: string) => void
  getAmendments: (lcId: string) => Amendment[]
  getPendingAmendments: () => Amendment[]

  // Filtering & Search
  setFilters: (filters: LCFilters) => void
  clearFilters: () => void
  searchLCs: (query: string) => LetterOfCredit[]
  getLCsByStatus: (status: LCStatus) => LetterOfCredit[]

  // Statistics
  updateStats: () => void
  getStats: () => LCStats

  // Utilities
  setError: (error: string | null) => void
  setLoading: (loading: boolean) => void
}

// Helper functions
const generateReferenceNumber = (): string => {
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substr(2, 5).toUpperCase()
  return `LC-${timestamp}-${random}`
}

const calculateStats = (lcs: LetterOfCredit[]): LCStats => {
  return {
    total: lcs.length,
    draft: lcs.filter(lc => lc.status === 'draft').length,
    submitted: lcs.filter(lc => lc.status === 'submitted').length,
    issued: lcs.filter(lc => lc.status === 'issued').length,
    accepted: lcs.filter(lc => lc.status === 'accepted').length,
    completed: lcs.filter(lc => lc.status === 'completed').length,
    totalValue: lcs.reduce((sum, lc) => sum + lc.value, 0),
    pendingAmendments: lcs.reduce((sum, lc) => sum + lc.amendments.filter(a => a.status === 'pending').length, 0),
  }
}

export const useLCStore = create<LCStoreState>()(
  persist(
    (set, get) => ({
      lcs: [],
      selectedLC: null,
      filters: {},
      stats: {
        total: 0,
        draft: 0,
        submitted: 0,
        issued: 0,
        accepted: 0,
        completed: 0,
        totalValue: 0,
        pendingAmendments: 0,
      },
      isLoading: false,
      error: null,

      // L/C Management
      createLC: (lcData) => {
        const newLC: LetterOfCredit = {
          ...lcData,
          id: `lc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          referenceNumber: generateReferenceNumber(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          documents: [],
          amendments: [],
        }

        set((state) => {
          const newLCs = [...state.lcs, newLC]
          return {
            lcs: newLCs,
            stats: calculateStats(newLCs),
          }
        })
      },

      updateLC: (id, updates) => {
        set((state) => {
          const newLCs = state.lcs.map((lc) =>
            lc.id === id
              ? {
                  ...lc,
                  ...updates,
                  updatedAt: new Date().toISOString(),
                }
              : lc
          )

          return {
            lcs: newLCs,
            selectedLC: state.selectedLC?.id === id
              ? {
                  ...state.selectedLC,
                  ...updates,
                  updatedAt: new Date().toISOString(),
                }
              : state.selectedLC,
            stats: calculateStats(newLCs),
          }
        })
      },

      deleteLC: (id) => {
        set((state) => {
          const newLCs = state.lcs.filter((lc) => lc.id !== id)
          return {
            lcs: newLCs,
            selectedLC: state.selectedLC?.id === id ? null : state.selectedLC,
            stats: calculateStats(newLCs),
          }
        })
      },

      selectLC: (id) => {
        set((state) => ({
          selectedLC: id ? state.lcs.find((lc) => lc.id === id) || null : null,
        }))
      },

      submitLC: (id) => {
        set((state) => {
          const newLCs = state.lcs.map((lc) =>
            lc.id === id
              ? {
                  ...lc,
                  status: 'submitted' as LCStatus,
                  submittedAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                }
              : lc
          )

          return {
            lcs: newLCs,
            selectedLC: state.selectedLC?.id === id
              ? {
                  ...state.selectedLC,
                  status: 'submitted',
                  submittedAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                }
              : state.selectedLC,
            stats: calculateStats(newLCs),
          }
        })
      },

      acceptLC: (id) => {
        set((state) => {
          const newLCs = state.lcs.map((lc) =>
            lc.id === id
              ? {
                  ...lc,
                  status: 'accepted' as LCStatus,
                  acceptedAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                }
              : lc
          )

          return {
            lcs: newLCs,
            selectedLC: state.selectedLC?.id === id
              ? {
                  ...state.selectedLC,
                  status: 'accepted',
                  acceptedAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                }
              : state.selectedLC,
            stats: calculateStats(newLCs),
          }
        })
      },

      completeLC: (id) => {
        set((state) => {
          const newLCs = state.lcs.map((lc) =>
            lc.id === id
              ? {
                  ...lc,
                  status: 'completed' as LCStatus,
                  completedAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                }
              : lc
          )

          return {
            lcs: newLCs,
            selectedLC: state.selectedLC?.id === id
              ? {
                  ...state.selectedLC,
                  status: 'completed',
                  completedAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                }
              : state.selectedLC,
            stats: calculateStats(newLCs),
          }
        })
      },

      // Document Management
      addDocument: (lcId, documentData) => {
        const document: LCDocument = {
          ...documentData,
          id: `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          uploadedAt: new Date().toISOString(),
        }

        set((state) => {
          const newLCs = state.lcs.map((lc) =>
            lc.id === lcId
              ? {
                  ...lc,
                  documents: [...lc.documents, document],
                  updatedAt: new Date().toISOString(),
                }
              : lc
          )

          return {
            lcs: newLCs,
            selectedLC: state.selectedLC?.id === lcId
              ? {
                  ...state.selectedLC,
                  documents: [...state.selectedLC.documents, document],
                  updatedAt: new Date().toISOString(),
                }
              : state.selectedLC,
          }
        })
      },

      removeDocument: (lcId, documentId) => {
        set((state) => {
          const newLCs = state.lcs.map((lc) =>
            lc.id === lcId
              ? {
                  ...lc,
                  documents: lc.documents.filter((doc) => doc.id !== documentId),
                  updatedAt: new Date().toISOString(),
                }
              : lc
          )

          return {
            lcs: newLCs,
            selectedLC: state.selectedLC?.id === lcId
              ? {
                  ...state.selectedLC,
                  documents: state.selectedLC.documents.filter((doc) => doc.id !== documentId),
                  updatedAt: new Date().toISOString(),
                }
              : state.selectedLC,
          }
        })
      },

      getDocuments: (lcId) => {
        const lc = get().lcs.find((l) => l.id === lcId)
        return lc?.documents || []
      },

      // Amendment Management
      requestAmendment: (lcId, changes, reason) => {
        set((state) => {
          const lc = state.lcs.find((l) => l.id === lcId)
          if (!lc) return state

          const amendmentNumber = lc.amendments.length + 1
          const amendment: Amendment = {
            id: `amd-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            lcId,
            amendmentNumber,
            status: 'pending',
            requestedAt: new Date().toISOString(),
            reason,
            changes,
          }

          const newLCs = state.lcs.map((l) =>
            l.id === lcId
              ? {
                  ...l,
                  amendments: [...l.amendments, amendment],
                  updatedAt: new Date().toISOString(),
                }
              : l
          )

          return {
            lcs: newLCs,
            selectedLC: state.selectedLC?.id === lcId
              ? {
                  ...state.selectedLC,
                  amendments: [...state.selectedLC.amendments, amendment],
                  updatedAt: new Date().toISOString(),
                }
              : state.selectedLC,
            stats: calculateStats(newLCs),
          }
        })
      },

      approveAmendment: (lcId, amendmentId, remarks) => {
        set((state) => {
          const newLCs = state.lcs.map((lc) =>
            lc.id === lcId
              ? {
                  ...lc,
                  amendments: lc.amendments.map((amd) =>
                    amd.id === amendmentId
                      ? {
                          ...amd,
                          status: 'approved' as AmendmentStatus,
                          approvedAt: new Date().toISOString(),
                          remarks,
                        }
                      : amd
                  ),
                  updatedAt: new Date().toISOString(),
                }
              : lc
          )

          return {
            lcs: newLCs,
            selectedLC: state.selectedLC?.id === lcId
              ? {
                  ...state.selectedLC,
                  amendments: state.selectedLC.amendments.map((amd) =>
                    amd.id === amendmentId
                      ? {
                          ...amd,
                          status: 'approved',
                          approvedAt: new Date().toISOString(),
                          remarks,
                        }
                      : amd
                  ),
                  updatedAt: new Date().toISOString(),
                }
              : state.selectedLC,
            stats: calculateStats(newLCs),
          }
        })
      },

      rejectAmendment: (lcId, amendmentId, remarks) => {
        set((state) => {
          const newLCs = state.lcs.map((lc) =>
            lc.id === lcId
              ? {
                  ...lc,
                  amendments: lc.amendments.map((amd) =>
                    amd.id === amendmentId
                      ? {
                          ...amd,
                          status: 'rejected' as AmendmentStatus,
                          rejectedAt: new Date().toISOString(),
                          remarks,
                        }
                      : amd
                  ),
                  updatedAt: new Date().toISOString(),
                }
              : lc
          )

          return {
            lcs: newLCs,
            selectedLC: state.selectedLC?.id === lcId
              ? {
                  ...state.selectedLC,
                  amendments: state.selectedLC.amendments.map((amd) =>
                    amd.id === amendmentId
                      ? {
                          ...amd,
                          status: 'rejected',
                          rejectedAt: new Date().toISOString(),
                          remarks,
                        }
                      : amd
                  ),
                  updatedAt: new Date().toISOString(),
                }
              : state.selectedLC,
            stats: calculateStats(newLCs),
          }
        })
      },

      getAmendments: (lcId) => {
        const lc = get().lcs.find((l) => l.id === lcId)
        return lc?.amendments || []
      },

      getPendingAmendments: () => {
        const amendments: Amendment[] = []
        get().lcs.forEach((lc) => {
          lc.amendments.forEach((amd) => {
            if (amd.status === 'pending') {
              amendments.push(amd)
            }
          })
        })
        return amendments
      },

      // Filtering & Search
      setFilters: (filters) => {
        set({ filters })
      },

      clearFilters: () => {
        set({ filters: {} })
      },

      searchLCs: (query) => {
        const lowerQuery = query.toLowerCase()
        return get().lcs.filter(
          (lc) =>
            lc.referenceNumber.toLowerCase().includes(lowerQuery) ||
            lc.supplier.name.toLowerCase().includes(lowerQuery) ||
            lc.buyer.name.toLowerCase().includes(lowerQuery) ||
            lc.goodsDescription.toLowerCase().includes(lowerQuery)
        )
      },

      getLCsByStatus: (status) => {
        return get().lcs.filter((lc) => lc.status === status)
      },

      // Statistics
      updateStats: () => {
        const stats = calculateStats(get().lcs)
        set({ stats })
      },

      getStats: () => {
        return calculateStats(get().lcs)
      },

      // Utilities
      setError: (error) => {
        set({ error })
      },

      setLoading: (loading) => {
        set({ isLoading: loading })
      },
    }),
    {
      name: 'lc-storage',
      partialize: (state) => ({
        lcs: state.lcs,
        filters: state.filters,
      }),
    }
  )
)
