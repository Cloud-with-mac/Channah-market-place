import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { verificationAPI } from '@/lib/api'

// Verification Status Types
export type VerificationStatus = 'pending' | 'verified' | 'rejected' | 'expired'
export type BadgeLevel = 'gold' | 'silver' | 'bronze'
export type DocumentType = 'business_license' | 'tax_certificate' | 'incorporation' | 'id_proof' | 'address_proof' | 'bank_statement'
export type CertificationType = 'ISO_9001' | 'ISO_14001' | 'ISO_45001' | 'CE' | 'FDA' | 'UL' | 'RoHS' | 'REACH' | 'B_CORP' | 'FAIR_TRADE'

// Supplier Verification Badge
export interface VerificationBadge {
  id: string
  level: BadgeLevel
  name: string
  color: string
  icon: string
  verifiedAt: string
  expiresAt?: string
  description: string
  requirements: {
    minVerifications: number
    minComplianceScore: number
    minAuditsPassed: number
    minDocumentsVerified: number
  }
}

// Factory Audit Result
export interface FactoryAudit {
  id: string
  supplierId: string
  auditDate: string
  auditType: 'initial' | 'follow_up' | 'unannounced' | 'recertification'
  status: 'scheduled' | 'in_progress' | 'completed' | 'failed'
  auditor: {
    name: string
    company: string
    certification: string
  }
  categories: {
    name: string
    score: number // 0-100
    issues: string[]
    recommendations: string[]
  }[]
  overallScore: number // 0-100
  findings: string[]
  nonConformities: {
    severity: 'critical' | 'major' | 'minor'
    description: string
    correctionDeadline?: string
  }[]
  correctionsPending: boolean
  nextAuditDate?: string
  reportUrl?: string
  expiresAt: string
}

// Compliance Certification
export interface ComplianceCertification {
  id: string
  supplierId: string
  type: CertificationType
  name: string
  description: string
  issuer: string
  issuedDate: string
  expiryDate: string
  certificateUrl: string
  status: 'valid' | 'expiring_soon' | 'expired'
  verifiedBy: string
  verificationDate: string
  scope: string[]
  standards: string[]
}

// Document Verification
export interface Document {
  id: string
  supplierId: string
  type: DocumentType
  fileName: string
  fileUrl: string
  uploadedAt: string
  verificationStatus: 'pending' | 'verified' | 'rejected'
  verifiedBy?: string
  verificationDate?: string
  rejectionReason?: string
  expiryDate?: string
  metadata: {
    fileSize: number
    mimeType: string
    pages?: number
  }
}

// Supplier Verification Profile
export interface SupplierVerification {
  id: string
  supplierId: string
  companyName: string
  email: string
  phone: string
  address: string
  country: string
  businessType: string
  yearsInOperation: number

  // Verification Status
  overallStatus: VerificationStatus
  verificationScore: number // 0-100
  lastVerificationDate?: string

  // Badges
  badges: VerificationBadge[]
  currentBadge?: BadgeLevel

  // Documents
  documents: Document[]
  documentsVerified: number

  // Audits
  factoryAudits: FactoryAudit[]
  lastAuditDate?: string
  nextAuditScheduled?: string

  // Certifications
  certifications: ComplianceCertification[]

  // Metrics
  metrics: {
    totalVerifications: number
    successfulVerifications: number
    documentCompleteness: number // 0-100
    auditPassRate: number // 0-100
    complianceScore: number // 0-100
    responseTime: number // days
  }

  // Additional Info
  description: string
  website?: string
  logoUrl?: string
  createdAt: string
  updatedAt: string
}

// Audit Request
export interface AuditRequest {
  id: string
  supplierId: string
  type: 'initial' | 'follow_up' | 'unannounced'
  requestedDate: string
  preferredDate?: string
  reason: string
  status: 'pending' | 'confirmed' | 'cancelled'
  notes?: string
}

// Store State
interface VerificationState {
  // Supplier Verifications
  suppliers: SupplierVerification[]
  currentSupplier: SupplierVerification | null

  // Documents
  documents: Document[]

  // Audits
  auditRequests: AuditRequest[]
  factoryAudits: FactoryAudit[]

  // Certifications
  certifications: ComplianceCertification[]

  // Badges
  badgeTemplates: VerificationBadge[]

  // Actions - Supplier
  addSupplier: (supplier: Omit<SupplierVerification, 'id' | 'createdAt' | 'updatedAt'>) => string
  updateSupplier: (supplierId: string, updates: Partial<SupplierVerification>) => void
  getSupplier: (supplierId: string) => SupplierVerification | undefined
  setCurrentSupplier: (supplierId: string) => void

  // Actions - Documents
  addDocument: (document: Omit<Document, 'id'>) => string
  updateDocument: (documentId: string, updates: Partial<Document>) => void
  removeDocument: (documentId: string) => void
  verifyDocument: (documentId: string, verifiedBy: string) => void
  rejectDocument: (documentId: string, reason: string) => void
  getDocumentsBySupplier: (supplierId: string) => Document[]

  // Actions - Audits
  requestAudit: (request: Omit<AuditRequest, 'id' | 'requestedDate'>) => string
  addFactoryAudit: (audit: Omit<FactoryAudit, 'id'>) => string
  updateFactoryAudit: (auditId: string, updates: Partial<FactoryAudit>) => void
  getAuditsBySupplier: (supplierId: string) => FactoryAudit[]

  // Actions - Certifications
  addCertification: (cert: Omit<ComplianceCertification, 'id'>) => string
  updateCertification: (certId: string, updates: Partial<ComplianceCertification>) => void
  removeCertification: (certId: string) => void
  getCertificationsBySupplier: (supplierId: string) => ComplianceCertification[]
  getExpiringCertifications: (days: number) => ComplianceCertification[]

  // Actions - Badges
  addBadgeTemplate: (badge: Omit<VerificationBadge, 'id'>) => string
  assignBadge: (supplierId: string, badgeLevel: BadgeLevel) => void
  revokeBadge: (supplierId: string, badgeLevel: BadgeLevel) => void

  // Actions - Metrics
  calculateVerificationScore: (supplierId: string) => number
  getVerificationStats: () => {
    totalSuppliers: number
    verifiedSuppliers: number
    pendingVerifications: number
    rejectedSuppliers: number
    goldBadges: number
    silverBadges: number
    bronzeBadges: number
  }

  // Bulk actions
  bulkVerifyDocuments: (documentIds: string[], verifiedBy: string) => void
  exportVerificationReport: (supplierId: string) => string

  // API-backed actions
  applyForVerification: (data: any) => Promise<void>
  fetchVerificationStatus: () => Promise<void>
  uploadDocument: (data: any) => Promise<string>
  fetchVendorBadge: (vendorId: string) => Promise<void>
}

// Initial badge templates
const defaultBadgeTemplates: VerificationBadge[] = [
  {
    id: 'badge-gold',
    level: 'gold',
    name: 'Gold Verified',
    color: 'text-yellow-500',
    icon: '★★★',
    description: 'Premium supplier with highest verification standards',
    verifiedAt: new Date().toISOString(),
    requirements: {
      minVerifications: 100,
      minComplianceScore: 95,
      minAuditsPassed: 5,
      minDocumentsVerified: 10,
    },
  },
  {
    id: 'badge-silver',
    level: 'silver',
    name: 'Silver Verified',
    color: 'text-gray-400',
    icon: '★★',
    description: 'Trusted supplier meeting verification standards',
    verifiedAt: new Date().toISOString(),
    requirements: {
      minVerifications: 50,
      minComplianceScore: 85,
      minAuditsPassed: 3,
      minDocumentsVerified: 7,
    },
  },
  {
    id: 'badge-bronze',
    level: 'bronze',
    name: 'Bronze Verified',
    color: 'text-orange-600',
    icon: '★',
    description: 'Verified supplier meeting basic standards',
    verifiedAt: new Date().toISOString(),
    requirements: {
      minVerifications: 10,
      minComplianceScore: 70,
      minAuditsPassed: 1,
      minDocumentsVerified: 5,
    },
  },
]

export const useVerificationStore = create<VerificationState>()(
  persist(
    (set, get) => ({
      suppliers: [],
      currentSupplier: null,
      documents: [],
      auditRequests: [],
      factoryAudits: [],
      certifications: [],
      badgeTemplates: defaultBadgeTemplates,

      // Supplier Actions
      addSupplier: (supplier) => {
        const id = `supplier-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        const newSupplier: SupplierVerification = {
          ...supplier,
          id,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        set((state) => ({
          suppliers: [...state.suppliers, newSupplier],
          currentSupplier: newSupplier,
        }))
        return id
      },

      updateSupplier: (supplierId, updates) => {
        set((state) => ({
          suppliers: state.suppliers.map((s) =>
            s.id === supplierId
              ? {
                  ...s,
                  ...updates,
                  updatedAt: new Date().toISOString(),
                }
              : s
          ),
          currentSupplier:
            state.currentSupplier?.id === supplierId
              ? {
                  ...state.currentSupplier,
                  ...updates,
                  updatedAt: new Date().toISOString(),
                }
              : state.currentSupplier,
        }))
      },

      getSupplier: (supplierId) => {
        return get().suppliers.find((s) => s.id === supplierId)
      },

      setCurrentSupplier: (supplierId) => {
        const supplier = get().getSupplier(supplierId)
        set({ currentSupplier: supplier || null })
      },

      // Document Actions
      addDocument: (document) => {
        const id = `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        const newDocument: Document = { ...document, id }
        set((state) => ({
          documents: [...state.documents, newDocument],
        }))
        return id
      },

      updateDocument: (documentId, updates) => {
        set((state) => ({
          documents: state.documents.map((d) =>
            d.id === documentId ? { ...d, ...updates } : d
          ),
        }))
      },

      removeDocument: (documentId) => {
        set((state) => ({
          documents: state.documents.filter((d) => d.id !== documentId),
        }))
      },

      verifyDocument: (documentId, verifiedBy) => {
        set((state) => ({
          documents: state.documents.map((d) =>
            d.id === documentId
              ? {
                  ...d,
                  verificationStatus: 'verified' as const,
                  verifiedBy,
                  verificationDate: new Date().toISOString(),
                }
              : d
          ),
        }))
      },

      rejectDocument: (documentId, reason) => {
        set((state) => ({
          documents: state.documents.map((d) =>
            d.id === documentId
              ? {
                  ...d,
                  verificationStatus: 'rejected' as const,
                  rejectionReason: reason,
                  verificationDate: new Date().toISOString(),
                }
              : d
          ),
        }))
      },

      getDocumentsBySupplier: (supplierId) => {
        return get().documents.filter((d) => d.supplierId === supplierId)
      },

      // Audit Actions
      requestAudit: (request) => {
        const id = `audit-req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        const newRequest: AuditRequest = {
          ...request,
          id,
          requestedDate: new Date().toISOString(),
        }
        set((state) => ({
          auditRequests: [...state.auditRequests, newRequest],
        }))
        return id
      },

      addFactoryAudit: (audit) => {
        const id = `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        const newAudit: FactoryAudit = { ...audit, id }
        set((state) => ({
          factoryAudits: [...state.factoryAudits, newAudit],
        }))

        // Update supplier metrics
        const supplier = get().getSupplier(audit.supplierId)
        if (supplier) {
          const audits = get().getAuditsBySupplier(audit.supplierId)
          const passedAudits = audits.filter((a) => a.status === 'completed' && a.overallScore >= 70)
          const auditPassRate = audits.length > 0 ? (passedAudits.length / audits.length) * 100 : 0

          get().updateSupplier(audit.supplierId, {
            metrics: {
              ...supplier.metrics,
              auditPassRate,
            },
            lastAuditDate: new Date().toISOString(),
          })
        }

        return id
      },

      updateFactoryAudit: (auditId, updates) => {
        set((state) => ({
          factoryAudits: state.factoryAudits.map((a) =>
            a.id === auditId ? { ...a, ...updates } : a
          ),
        }))
      },

      getAuditsBySupplier: (supplierId) => {
        return get().factoryAudits.filter((a) => a.supplierId === supplierId)
      },

      // Certification Actions
      addCertification: (cert) => {
        const id = `cert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        const newCert: ComplianceCertification = { ...cert, id }
        set((state) => ({
          certifications: [...state.certifications, newCert],
        }))
        return id
      },

      updateCertification: (certId, updates) => {
        set((state) => ({
          certifications: state.certifications.map((c) =>
            c.id === certId ? { ...c, ...updates } : c
          ),
        }))
      },

      removeCertification: (certId) => {
        set((state) => ({
          certifications: state.certifications.filter((c) => c.id !== certId),
        }))
      },

      getCertificationsBySupplier: (supplierId) => {
        return get().certifications.filter((c) => c.supplierId === supplierId)
      },

      getExpiringCertifications: (days) => {
        const futureDate = new Date()
        futureDate.setDate(futureDate.getDate() + days)
        return get().certifications.filter((c) => {
          const expiry = new Date(c.expiryDate)
          return expiry <= futureDate && expiry > new Date()
        })
      },

      // Badge Actions
      addBadgeTemplate: (badge) => {
        const id = `badge-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        const newBadge: VerificationBadge = { ...badge, id }
        set((state) => ({
          badgeTemplates: [...state.badgeTemplates, newBadge],
        }))
        return id
      },

      assignBadge: (supplierId, badgeLevel) => {
        const supplier = get().getSupplier(supplierId)
        if (supplier) {
          const badge = get().badgeTemplates.find((b) => b.level === badgeLevel)
          if (badge) {
            get().updateSupplier(supplierId, {
              currentBadge: badgeLevel,
              badges: [
                ...supplier.badges.filter((b) => b.level !== badgeLevel),
                { ...badge, verifiedAt: new Date().toISOString() },
              ],
            })
          }
        }
      },

      revokeBadge: (supplierId, badgeLevel) => {
        const supplier = get().getSupplier(supplierId)
        if (supplier) {
          get().updateSupplier(supplierId, {
            badges: supplier.badges.filter((b) => b.level !== badgeLevel),
            currentBadge: supplier.currentBadge === badgeLevel ? undefined : supplier.currentBadge,
          })
        }
      },

      // Metrics
      calculateVerificationScore: (supplierId) => {
        const supplier = get().getSupplier(supplierId)
        if (!supplier) return 0

        const documents = get().getDocumentsBySupplier(supplierId)
        const verifiedDocs = documents.filter((d) => d.verificationStatus === 'verified')
        const docScore = documents.length > 0 ? (verifiedDocs.length / documents.length) * 100 : 0

        const audits = get().getAuditsBySupplier(supplierId)
        const passedAudits = audits.filter((a) => a.status === 'completed' && a.overallScore >= 70)
        const auditScore = audits.length > 0 ? (passedAudits.length / audits.length) * 100 : 0

        const certs = get().getCertificationsBySupplier(supplierId)
        const validCerts = certs.filter((c) => c.status === 'valid')
        const certScore = certs.length > 0 ? (validCerts.length / certs.length) * 100 : 0

        const weights = { documents: 0.3, audits: 0.5, certifications: 0.2 }
        const totalScore = docScore * weights.documents + auditScore * weights.audits + certScore * weights.certifications

        return Math.round(totalScore)
      },

      getVerificationStats: () => {
        const suppliers = get().suppliers
        const verifiedSuppliers = suppliers.filter((s) => s.overallStatus === 'verified').length
        const pendingVerifications = suppliers.filter((s) => s.overallStatus === 'pending').length
        const rejectedSuppliers = suppliers.filter((s) => s.overallStatus === 'rejected').length

        return {
          totalSuppliers: suppliers.length,
          verifiedSuppliers,
          pendingVerifications,
          rejectedSuppliers,
          goldBadges: suppliers.filter((s) => s.currentBadge === 'gold').length,
          silverBadges: suppliers.filter((s) => s.currentBadge === 'silver').length,
          bronzeBadges: suppliers.filter((s) => s.currentBadge === 'bronze').length,
        }
      },

      // Bulk Actions
      bulkVerifyDocuments: (documentIds, verifiedBy) => {
        documentIds.forEach((id) => {
          get().verifyDocument(id, verifiedBy)
        })
      },

      // API-backed actions
      applyForVerification: async (data) => {
        try {
          const result = await verificationAPI.apply(data)
          // Update local state with the response if applicable
          if (result && result.id) {
            const supplier = get().getSupplier(result.supplier_id || data.supplierId)
            if (supplier) {
              get().updateSupplier(supplier.id, {
                overallStatus: result.status || 'pending',
              })
            }
          }
        } catch (error) {
          console.error('Failed to apply for verification via API:', error)
        }
      },

      fetchVerificationStatus: async () => {
        try {
          const result = await verificationAPI.getStatus()
          if (result) {
            // Update the current supplier status from the API response
            const currentSupplier = get().currentSupplier
            if (currentSupplier) {
              get().updateSupplier(currentSupplier.id, {
                overallStatus: result.status || currentSupplier.overallStatus,
                verificationScore: result.verification_score ?? currentSupplier.verificationScore,
                lastVerificationDate: result.last_verification_date || currentSupplier.lastVerificationDate,
              })
            }
          }
        } catch (error) {
          console.error('Failed to fetch verification status via API:', error)
        }
      },

      uploadDocument: async (data) => {
        try {
          const result = await verificationAPI.uploadDocument(data)
          // Add the document to local state
          const id = result.id || `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
          const newDocument: Document = {
            id,
            supplierId: data.supplierId || data.supplier_id || '',
            type: data.type || 'business_license',
            fileName: data.fileName || data.file_name || '',
            fileUrl: result.file_url || result.url || '',
            uploadedAt: result.uploaded_at || new Date().toISOString(),
            verificationStatus: 'pending',
            metadata: {
              fileSize: data.fileSize || data.file_size || 0,
              mimeType: data.mimeType || data.mime_type || '',
            },
          }
          set((state) => ({
            documents: [...state.documents, newDocument],
          }))
          return id
        } catch (error) {
          console.error('Failed to upload document via API, falling back to local:', error)
          // Fallback to local-only
          return get().addDocument({
            supplierId: data.supplierId || data.supplier_id || '',
            type: data.type || 'business_license',
            fileName: data.fileName || data.file_name || '',
            fileUrl: '',
            uploadedAt: new Date().toISOString(),
            verificationStatus: 'pending',
            metadata: {
              fileSize: data.fileSize || data.file_size || 0,
              mimeType: data.mimeType || data.mime_type || '',
            },
          })
        }
      },

      fetchVendorBadge: async (vendorId) => {
        try {
          const result = await verificationAPI.getVendorBadge(vendorId)
          if (result && result.badge_level) {
            const supplier = get().getSupplier(vendorId)
            if (supplier) {
              get().updateSupplier(vendorId, {
                currentBadge: result.badge_level,
              })
            }
          }
        } catch (error) {
          console.error('Failed to fetch vendor badge via API:', error)
        }
      },

      exportVerificationReport: (supplierId) => {
        const supplier = get().getSupplier(supplierId)
        if (!supplier) return ''

        const documents = get().getDocumentsBySupplier(supplierId)
        const audits = get().getAuditsBySupplier(supplierId)
        const certifications = get().getCertificationsBySupplier(supplierId)

        const report = {
          supplier: supplier,
          documents: documents,
          audits: audits,
          certifications: certifications,
          exportedAt: new Date().toISOString(),
        }

        return JSON.stringify(report, null, 2)
      },
    }),
    {
      name: 'verification-storage',
      partialize: (state) => ({
        suppliers: state.suppliers,
        documents: state.documents,
        auditRequests: state.auditRequests,
        factoryAudits: state.factoryAudits,
        certifications: state.certifications,
      }),
    }
  )
)
