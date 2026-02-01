import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface InspectionEvidence {
  id: string
  type: 'photo' | 'document' | 'video'
  name: string
  url: string
  uploadedAt: string
  uploadedBy: string
  description?: string
  size: number
}

export interface InspectionDefect {
  id: string
  category: string
  severity: 'critical' | 'major' | 'minor'
  description: string
  quantity: number
  location?: string
  images: string[]
}

export interface InspectionReport {
  id: string
  inspectionId: string
  generatedAt: string
  inspectorName: string
  inspectorCertification: string

  // Inspection Results
  overallResult: 'passed' | 'failed' | 'conditional'
  aqlResult: {
    sampleSize: number
    defectsFound: number
    criticalDefects: number
    majorDefects: number
    minorDefects: number
    acceptanceLevel: string
  }

  // Product Assessment
  productDetails: {
    productName: string
    sku?: string
    quantity: number
    samplesInspected: number
  }

  // Quality Metrics
  qualityMetrics: {
    workmanship: number // 1-10
    materials: number
    packaging: number
    labeling: number
    functionality: number
  }

  defects: InspectionDefect[]
  recommendations: string[]
  summary: string
  evidence: InspectionEvidence[]

  pdfUrl?: string
  certificateUrl?: string
}

export interface Inspector {
  id: string
  name: string
  company: string
  avatar?: string
  rating: number
  reviewCount: number
  certification: string[]
  specialization: string[]
  languages: string[]
  experience: string
  hourlyRate: number
  availability: 'available' | 'busy' | 'unavailable'
  location: string
  completedInspections: number
}

export interface InspectionBooking {
  id: string
  productName: string
  productId?: string
  vendorName: string
  vendorId?: string

  // Inspection Details
  inspectionType: 'pre-shipment' | 'during-production' | 'final' | 'container-loading' | 'pre-production'
  inspectionStandard: string // AQL 2.5, AQL 1.5, ISO 2859-1, etc.
  aqlLevel: 'AQL 0.65' | 'AQL 1.0' | 'AQL 1.5' | 'AQL 2.5' | 'AQL 4.0' | 'custom'
  customAQL?: {
    critical: number
    major: number
    minor: number
  }

  // Product Information
  productCategory: string
  quantity: number
  sku?: string
  specifications?: string

  // Inspector
  inspectorId?: string
  inspector?: Inspector

  // Scheduling
  preferredDate: string
  preferredTime?: string
  alternativeDate?: string
  estimatedDuration: number // hours

  // Location
  inspectionLocation: {
    address: string
    city: string
    country: string
    postalCode?: string
    contactPerson: string
    contactPhone: string
  }

  // Requirements
  specialRequirements?: string[]
  testingRequired?: {
    type: string
    standard: string
    description: string
  }[]
  documentsRequired?: string[]

  // Status & Pricing
  status: 'draft' | 'pending' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled' | 'report-ready'
  pricing: {
    inspectionFee: number
    travelCost: number
    testingFee?: number
    rushFee?: number
    total: number
    currency: string
  }

  // Timeline
  createdAt: string
  updatedAt: string
  confirmedAt?: string
  scheduledDate?: string
  completedAt?: string

  // Report
  reportId?: string
  report?: InspectionReport

  // Communication
  notes?: string
  internalNotes?: string
}

interface InspectionState {
  bookings: InspectionBooking[]
  inspectors: Inspector[]
  reports: InspectionReport[]

  // Booking Management
  createBooking: (booking: Omit<InspectionBooking, 'id' | 'createdAt' | 'updatedAt' | 'status'>) => string
  updateBooking: (id: string, updates: Partial<InspectionBooking>) => void
  deleteBooking: (id: string) => void
  getBooking: (id: string) => InspectionBooking | undefined

  // Status Management
  confirmBooking: (id: string) => void
  startInspection: (id: string) => void
  completeInspection: (id: string) => void
  cancelBooking: (id: string, reason?: string) => void

  // Inspector Management
  setInspectors: (inspectors: Inspector[]) => void
  assignInspector: (bookingId: string, inspectorId: string) => void
  getInspector: (id: string) => Inspector | undefined
  getAvailableInspectors: (date: string, location: string) => Inspector[]

  // Report Management
  addReport: (report: InspectionReport) => void
  getReport: (id: string) => InspectionReport | undefined
  getBookingReport: (bookingId: string) => InspectionReport | undefined
  addEvidence: (reportId: string, evidence: Omit<InspectionEvidence, 'id' | 'uploadedAt'>) => void

  // Filtering & Search
  getBookingsByStatus: (status: InspectionBooking['status']) => InspectionBooking[]
  getUpcomingInspections: () => InspectionBooking[]
  getCompletedInspections: () => InspectionBooking[]
  searchBookings: (query: string) => InspectionBooking[]

  // Statistics
  getStats: () => {
    total: number
    pending: number
    completed: number
    inProgress: number
    passRate: number
  }
}

// Mock inspectors data
const mockInspectors: Inspector[] = [
  {
    id: 'insp-1',
    name: 'Dr. Sarah Chen',
    company: 'GlobalQC Inspection Services',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sarah',
    rating: 4.9,
    reviewCount: 234,
    certification: ['ISO 9001 Lead Auditor', 'AQSIQ Certified', 'ASQC CQE'],
    specialization: ['Electronics', 'Consumer Goods', 'Textiles'],
    languages: ['English', 'Mandarin', 'Cantonese'],
    experience: '12 years',
    hourlyRate: 150,
    availability: 'available',
    location: 'Shenzhen, China',
    completedInspections: 1247
  },
  {
    id: 'insp-2',
    name: 'James Anderson',
    company: 'Premier Quality Assurance',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=james',
    rating: 4.8,
    reviewCount: 189,
    certification: ['ISO 17020 Inspector', 'ASQC CQI', 'Six Sigma Black Belt'],
    specialization: ['Machinery', 'Automotive Parts', 'Industrial Equipment'],
    languages: ['English', 'Spanish', 'Portuguese'],
    experience: '15 years',
    hourlyRate: 175,
    availability: 'available',
    location: 'Guangzhou, China',
    completedInspections: 982
  },
  {
    id: 'insp-3',
    name: 'Maria Rodriguez',
    company: 'QC Excellence Ltd',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=maria',
    rating: 5.0,
    reviewCount: 156,
    certification: ['ISO 2859-1 Expert', 'ASQC CQA', 'TUV Certified'],
    specialization: ['Textiles', 'Fashion', 'Home Goods', 'Toys'],
    languages: ['English', 'Spanish', 'Mandarin'],
    experience: '10 years',
    hourlyRate: 140,
    availability: 'busy',
    location: 'Hangzhou, China',
    completedInspections: 876
  },
  {
    id: 'insp-4',
    name: 'David Kim',
    company: 'Asia Pacific Inspection Co.',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=david',
    rating: 4.7,
    reviewCount: 201,
    certification: ['ASQC CQE', 'ISO 9001 Auditor', 'AQSIQ Licensed'],
    specialization: ['Electronics', 'Medical Devices', 'Lab Equipment'],
    languages: ['English', 'Korean', 'Mandarin', 'Japanese'],
    experience: '14 years',
    hourlyRate: 160,
    availability: 'available',
    location: 'Shanghai, China',
    completedInspections: 1103
  },
  {
    id: 'insp-5',
    name: 'Emma Thompson',
    company: 'International QC Standards',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=emma',
    rating: 4.9,
    reviewCount: 178,
    certification: ['ISO 17025 Assessor', 'ASQC CQT', 'IRCA Lead Auditor'],
    specialization: ['Food Products', 'Cosmetics', 'Pharmaceuticals'],
    languages: ['English', 'French', 'Mandarin'],
    experience: '11 years',
    hourlyRate: 165,
    availability: 'available',
    location: 'Ningbo, China',
    completedInspections: 934
  },
  {
    id: 'insp-6',
    name: 'Robert Zhang',
    company: 'Precision Inspection Group',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=robert',
    rating: 4.8,
    reviewCount: 167,
    certification: ['ISO 9001 Lead Auditor', 'Six Sigma Master Black Belt', 'ASQ CQI'],
    specialization: ['Furniture', 'Building Materials', 'Packaging'],
    languages: ['English', 'Mandarin', 'German'],
    experience: '13 years',
    hourlyRate: 145,
    availability: 'available',
    location: 'Foshan, China',
    completedInspections: 1056
  }
]

export const useInspectionStore = create<InspectionState>()(
  persist(
    (set, get) => ({
      bookings: [],
      inspectors: mockInspectors,
      reports: [],

      createBooking: (bookingData) => {
        const newBooking: InspectionBooking = {
          ...bookingData,
          id: `inspection-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          status: 'draft',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }

        set((state) => ({
          bookings: [...state.bookings, newBooking],
        }))

        return newBooking.id
      },

      updateBooking: (id, updates) => {
        set((state) => ({
          bookings: state.bookings.map((booking) =>
            booking.id === id
              ? { ...booking, ...updates, updatedAt: new Date().toISOString() }
              : booking
          ),
        }))
      },

      deleteBooking: (id) => {
        set((state) => ({
          bookings: state.bookings.filter((booking) => booking.id !== id),
        }))
      },

      getBooking: (id) => {
        return get().bookings.find((booking) => booking.id === id)
      },

      confirmBooking: (id) => {
        set((state) => ({
          bookings: state.bookings.map((booking) =>
            booking.id === id
              ? {
                  ...booking,
                  status: 'confirmed',
                  confirmedAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                }
              : booking
          ),
        }))
      },

      startInspection: (id) => {
        set((state) => ({
          bookings: state.bookings.map((booking) =>
            booking.id === id
              ? {
                  ...booking,
                  status: 'in-progress',
                  updatedAt: new Date().toISOString(),
                }
              : booking
          ),
        }))
      },

      completeInspection: (id) => {
        set((state) => ({
          bookings: state.bookings.map((booking) =>
            booking.id === id
              ? {
                  ...booking,
                  status: 'completed',
                  completedAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                }
              : booking
          ),
        }))
      },

      cancelBooking: (id, reason) => {
        set((state) => ({
          bookings: state.bookings.map((booking) =>
            booking.id === id
              ? {
                  ...booking,
                  status: 'cancelled',
                  internalNotes: reason,
                  updatedAt: new Date().toISOString(),
                }
              : booking
          ),
        }))
      },

      setInspectors: (inspectors) => {
        set({ inspectors })
      },

      assignInspector: (bookingId, inspectorId) => {
        const inspector = get().inspectors.find((i) => i.id === inspectorId)
        if (inspector) {
          set((state) => ({
            bookings: state.bookings.map((booking) =>
              booking.id === bookingId
                ? {
                    ...booking,
                    inspectorId,
                    inspector,
                    updatedAt: new Date().toISOString(),
                  }
                : booking
            ),
          }))
        }
      },

      getInspector: (id) => {
        return get().inspectors.find((inspector) => inspector.id === id)
      },

      getAvailableInspectors: (date, location) => {
        // Simple filter - in production, would check actual availability
        return get().inspectors.filter((inspector) =>
          inspector.availability === 'available'
        )
      },

      addReport: (report) => {
        set((state) => ({
          reports: [...state.reports, report],
          bookings: state.bookings.map((booking) =>
            booking.id === report.inspectionId
              ? {
                  ...booking,
                  reportId: report.id,
                  report,
                  status: 'report-ready',
                  updatedAt: new Date().toISOString(),
                }
              : booking
          ),
        }))
      },

      getReport: (id) => {
        return get().reports.find((report) => report.id === id)
      },

      getBookingReport: (bookingId) => {
        return get().reports.find((report) => report.inspectionId === bookingId)
      },

      addEvidence: (reportId, evidenceData) => {
        const newEvidence: InspectionEvidence = {
          ...evidenceData,
          id: `evidence-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          uploadedAt: new Date().toISOString(),
        }

        set((state) => ({
          reports: state.reports.map((report) =>
            report.id === reportId
              ? {
                  ...report,
                  evidence: [...report.evidence, newEvidence],
                }
              : report
          ),
        }))
      },

      getBookingsByStatus: (status) => {
        return get().bookings.filter((booking) => booking.status === status)
      },

      getUpcomingInspections: () => {
        const now = new Date()
        return get().bookings
          .filter((booking) =>
            ['confirmed', 'pending'].includes(booking.status) &&
            booking.preferredDate &&
            new Date(booking.preferredDate) > now
          )
          .sort((a, b) =>
            new Date(a.preferredDate).getTime() - new Date(b.preferredDate).getTime()
          )
      },

      getCompletedInspections: () => {
        return get().bookings
          .filter((booking) => ['completed', 'report-ready'].includes(booking.status))
          .sort((a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          )
      },

      searchBookings: (query) => {
        const lowerQuery = query.toLowerCase()
        return get().bookings.filter((booking) =>
          booking.productName.toLowerCase().includes(lowerQuery) ||
          booking.vendorName.toLowerCase().includes(lowerQuery) ||
          booking.id.toLowerCase().includes(lowerQuery)
        )
      },

      getStats: () => {
        const bookings = get().bookings
        const reports = get().reports

        const total = bookings.length
        const pending = bookings.filter((b) => b.status === 'pending').length
        const completed = bookings.filter((b) => b.status === 'completed' || b.status === 'report-ready').length
        const inProgress = bookings.filter((b) => b.status === 'in-progress').length

        const passedReports = reports.filter((r) => r.overallResult === 'passed').length
        const passRate = reports.length > 0 ? (passedReports / reports.length) * 100 : 0

        return {
          total,
          pending,
          completed,
          inProgress,
          passRate,
        }
      },
    }),
    {
      name: 'vendora-inspections',
    }
  )
)
