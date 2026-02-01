import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Freight Forwarder Types
export interface FreightForwarderServiceArea {
  country: string
  region?: string
  ports?: string[]
}

export interface FreightForwarderCertification {
  name: string
  type: 'IATA' | 'NVOCC' | 'OFR' | 'ISO' | 'OTHER'
  expiryDate?: string
  verified: boolean
}

export interface FreightForwarder {
  id: string
  name: string
  logo?: string
  email: string
  phone: string
  website?: string
  description: string
  yearsInBusiness: number
  rating: number
  reviewCount: number
  serviceAreas: FreightForwarderServiceArea[]
  certifications: FreightForwarderCertification[]
  specializations: string[]
  responseTime: 'within-1-hour' | 'within-4-hours' | 'within-24-hours'
  totalShipments: number
  successRate: number
  createdAt: string
}

// Shipping Quote Types
export type ShippingMode = 'air' | 'sea' | 'land' | 'multimodal'
export type QuoteStatus = 'pending' | 'quoted' | 'accepted' | 'rejected' | 'expired'
export type IncoTerm = 'EXW' | 'FCA' | 'FAS' | 'FOB' | 'CFR' | 'CIF' | 'CPT' | 'CIP' | 'DAP' | 'DPU' | 'DDP'

export interface ShippingQuoteLineItem {
  description: string
  quantity: number
  weight: number // kg
  volume: number // CBM
  unitPrice: number
}

export interface ShippingQuote {
  id: string
  forwarderId: string
  forwarderName: string
  forwarderLogo?: string
  quoteNumber: string
  origin: string
  destination: string
  mode: ShippingMode
  lineItems: ShippingQuoteLineItem[]
  totalWeight: number
  totalVolume: number
  baseCost: number
  handlingFee: number
  insurance: number
  documentation: number
  customs: number
  totalCost: number
  currency: string
  incoTerm: IncoTerm
  transitTime: string
  validUntil: string
  includesInsurance: boolean
  notes?: string
  status: QuoteStatus
  submittedAt: string
  expiresAt: string
  acceptedAt?: string
}

// Booking Types
export type BookingStatus = 'draft' | 'confirmed' | 'in-transit' | 'delivered' | 'cancelled'

export interface Booking {
  id: string
  bookingNumber: string
  quoteId: string
  forwarderId: string
  forwarderName: string
  origin: string
  destination: string
  mode: ShippingMode
  status: BookingStatus
  totalCost: number
  currency: string
  lineItems: ShippingQuoteLineItem[]
  pickupDate: string
  estimatedDeliveryDate: string
  actualDeliveryDate?: string
  reference: string
  notes?: string
  createdAt: string
  updatedAt: string
  trackingNumber?: string
}

// Shipment Tracking
export type TrackingStatus = 'pickup-scheduled' | 'in-warehouse' | 'departed-origin' | 'in-transit' | 'customs-clearance' | 'arrived-destination' | 'out-for-delivery' | 'delivered' | 'exception'

export interface TrackingEvent {
  id: string
  status: TrackingStatus
  location: string
  timestamp: string
  description: string
  document?: string
}

export interface Shipment {
  id: string
  bookingId: string
  trackingNumber: string
  forwarderId: string
  origin: string
  destination: string
  status: TrackingStatus
  currentLocation: string
  events: TrackingEvent[]
  pickupDate: string
  estimatedDeliveryDate: string
  actualDeliveryDate?: string
  reference: string
  totalWeight: number
  totalVolume: number
  createdAt: string
  updatedAt: string
}

// Partner Ratings
export type RatingCategory = 'quality' | 'speed' | 'reliability' | 'communication' | 'pricing'

export interface PartnerRating {
  id: string
  forwarderId: string
  userId: string
  overallRating: number
  categoryRatings: Record<RatingCategory, number>
  comment: string
  bookingReference: string
  status: 'pending' | 'published'
  createdAt: string
  helpfulCount: number
}

// Request for Quote (RFQ)
export interface FreightRFQ {
  id: string
  title: string
  origin: string
  destination: string
  preferredModes: ShippingMode[]
  weight: number
  volume: number
  itemDescription: string
  quantity: number
  specialRequirements?: string
  pickupDate: string
  deadlineDate: string
  budget?: number
  requiredCertifications: FreightForwarderCertification['type'][]
  status: 'draft' | 'open' | 'quoted' | 'closed'
  quotes: ShippingQuote[]
  createdAt: string
  updatedAt: string
  closedAt?: string
}

// Store State
interface FreightState {
  // Freight Forwarders
  forwarders: FreightForwarder[]
  selectedForwarder: FreightForwarder | null

  // Quotes
  quotes: ShippingQuote[]

  // Bookings
  bookings: Booking[]

  // Shipments
  shipments: Shipment[]

  // Ratings
  ratings: PartnerRating[]

  // RFQs
  rfqs: FreightRFQ[]

  // Forwarder Actions
  getForwarders: () => FreightForwarder[]
  getForwarder: (id: string) => FreightForwarder | undefined
  selectForwarder: (id: string) => void
  searchForwarders: (origin: string, destination: string, mode?: ShippingMode) => FreightForwarder[]
  filterForwardersByRating: (minRating: number) => FreightForwarder[]
  filterForwardersByServiceArea: (origin: string, destination: string) => FreightForwarder[]

  // Quote Management
  addQuote: (quote: Omit<ShippingQuote, 'id'> & Partial<Pick<ShippingQuote, 'submittedAt' | 'expiresAt'>>) => string
  updateQuote: (id: string, updates: Partial<ShippingQuote>) => void
  getQuote: (id: string) => ShippingQuote | undefined
  getQuotesByForwarder: (forwarderId: string) => ShippingQuote[]
  acceptQuote: (quoteId: string) => Booking | null
  rejectQuote: (quoteId: string) => void
  expireQuote: (quoteId: string) => void
  calculateQuoteCost: (baseShipping: number, insurance: boolean, weight: number) => { subtotal: number; insurance: number; fees: number; total: number }

  // Booking Management
  createBooking: (quoteId: string) => string
  updateBooking: (id: string, updates: Partial<Booking>) => void
  getBooking: (id: string) => Booking | undefined
  getActiveBookings: () => Booking[]
  getCompletedBookings: () => Booking[]
  cancelBooking: (id: string) => void

  // Shipment Tracking
  getShipment: (trackingNumber: string) => Shipment | undefined
  getShipmentByBooking: (bookingId: string) => Shipment | undefined
  updateShipmentStatus: (shipmentId: string, status: TrackingStatus, location: string, description: string) => void
  addTrackingEvent: (shipmentId: string, event: Omit<TrackingEvent, 'id'>) => void
  getShipmentHistory: (shipmentId: string) => TrackingEvent[]

  // Rating Management
  addRating: (rating: Omit<PartnerRating, 'id' | 'createdAt' | 'helpfulCount'>) => string
  getRatingsForForwarder: (forwarderId: string) => PartnerRating[]
  getAverageRating: (forwarderId: string) => number
  markRatingHelpful: (ratingId: string) => void

  // RFQ Management
  createRFQ: (rfq: Omit<FreightRFQ, 'id' | 'createdAt' | 'updatedAt' | 'quotes' | 'status'>) => string
  updateRFQ: (id: string, updates: Partial<FreightRFQ>) => void
  getRFQ: (id: string) => FreightRFQ | undefined
  getOpenRFQs: () => FreightRFQ[]
  addQuoteToRFQ: (rfqId: string, quote: ShippingQuote) => void
  closeRFQ: (rfqId: string) => void
}

// Sample forwarders data
const sampleForwarders: FreightForwarder[] = [
  {
    id: 'ff-001',
    name: 'Global Logistics Plus',
    logo: 'https://placehold.co/100x100?text=GLP',
    email: 'info@globallogisticsplus.com',
    phone: '+44 20 7946 0958',
    website: 'www.globallogisticsplus.com',
    description: 'Leading international freight forwarder with expertise in air and sea freight to over 200 countries.',
    yearsInBusiness: 25,
    rating: 4.8,
    reviewCount: 342,
    serviceAreas: [
      { country: 'United Kingdom', region: 'England, Scotland, Wales' },
      { country: 'United States', region: 'New York, Los Angeles, Houston' },
      { country: 'China', region: 'Shanghai, Shenzhen, Hong Kong' },
      { country: 'Germany', region: 'Hamburg, Frankfurt' }
    ],
    certifications: [
      { name: 'IATA', type: 'IATA', verified: true },
      { name: 'NVOCC', type: 'NVOCC', verified: true },
      { name: 'ISO 9001', type: 'ISO', verified: true }
    ],
    specializations: ['Electronics', 'Heavy Machinery', 'Hazardous Materials', 'Perishables'],
    responseTime: 'within-1-hour',
    totalShipments: 15420,
    successRate: 98.7,
    createdAt: new Date(Date.now() - 25 * 365 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'ff-002',
    name: 'Express Cargo Worldwide',
    logo: 'https://placehold.co/100x100?text=ECW',
    email: 'support@expresscargo.com',
    phone: '+44 20 3873 4700',
    website: 'www.expresscargo.com',
    description: 'Specializing in expedited and time-sensitive shipments with dedicated customer support.',
    yearsInBusiness: 18,
    rating: 4.7,
    reviewCount: 287,
    serviceAreas: [
      { country: 'United Kingdom' },
      { country: 'Europe' },
      { country: 'Asia Pacific' },
      { country: 'North America' }
    ],
    certifications: [
      { name: 'IATA', type: 'IATA', verified: true },
      { name: 'NVOCC', type: 'NVOCC', verified: true }
    ],
    specializations: ['Expedited Shipments', 'Electronics', 'Automotive Parts'],
    responseTime: 'within-1-hour',
    totalShipments: 8932,
    successRate: 97.9,
    createdAt: new Date(Date.now() - 18 * 365 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'ff-003',
    name: 'Maritime & Air Solutions',
    logo: 'https://placehold.co/100x100?text=MAS',
    email: 'quotes@maritimeair.co.uk',
    phone: '+44 121 644 4646',
    website: 'www.maritimeair.co.uk',
    description: 'Comprehensive freight forwarding with focus on project cargo and specialized handling.',
    yearsInBusiness: 32,
    rating: 4.9,
    reviewCount: 418,
    serviceAreas: [
      { country: 'United Kingdom', ports: ['Southampton', 'Felixstowe', 'Liverpool'] },
      { country: 'Middle East' },
      { country: 'Africa' },
      { country: 'South Asia' }
    ],
    certifications: [
      { name: 'IATA', type: 'IATA', verified: true },
      { name: 'OFR', type: 'OFR', verified: true },
      { name: 'ISO 9001', type: 'ISO', verified: true },
      { name: 'ISO 27001', type: 'ISO', verified: true }
    ],
    specializations: ['Project Cargo', 'Heavy Lift', 'Breakbulk', 'Ro-Ro'],
    responseTime: 'within-4-hours',
    totalShipments: 12887,
    successRate: 99.2,
    createdAt: new Date(Date.now() - 32 * 365 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'ff-004',
    name: 'Regional Trade Logistics',
    logo: 'https://placehold.co/100x100?text=RTL',
    email: 'business@regionaltrade.com',
    phone: '+44 20 3355 6688',
    website: 'www.regionaltrade.com',
    description: 'Cost-effective solutions for regional and domestic freight forwarding.',
    yearsInBusiness: 12,
    rating: 4.5,
    reviewCount: 156,
    serviceAreas: [
      { country: 'United Kingdom' },
      { country: 'Europe' }
    ],
    certifications: [
      { name: 'NVOCC', type: 'NVOCC', verified: true }
    ],
    specializations: ['Regional Trade', 'Domestic Freight', 'SME Support'],
    responseTime: 'within-24-hours',
    totalShipments: 4521,
    successRate: 96.8,
    createdAt: new Date(Date.now() - 12 * 365 * 24 * 60 * 60 * 1000).toISOString()
  }
]

export const useFreightStore = create<FreightState>()(
  persist(
    (set, get) => ({
      forwarders: sampleForwarders,
      selectedForwarder: null,
      quotes: [],
      bookings: [],
      shipments: [],
      ratings: [],
      rfqs: [],

      // Forwarder Actions
      getForwarders: () => get().forwarders,

      getForwarder: (id) => get().forwarders.find(f => f.id === id),

      selectForwarder: (id) => {
        const forwarder = get().getForwarder(id)
        set({ selectedForwarder: forwarder || null })
      },

      searchForwarders: (origin, destination, mode) => {
        return get().forwarders.filter(f => {
          const hasServiceArea = f.serviceAreas.some(sa =>
            (sa.country.toLowerCase().includes(origin.toLowerCase()) ||
             sa.country.toLowerCase().includes(destination.toLowerCase()))
          )
          return hasServiceArea
        })
      },

      filterForwardersByRating: (minRating) => {
        return get().forwarders.filter(f => f.rating >= minRating)
      },

      filterForwardersByServiceArea: (origin, destination) => {
        return get().forwarders.filter(f =>
          f.serviceAreas.some(sa =>
            sa.country.toLowerCase().includes(origin.toLowerCase()) ||
            sa.country.toLowerCase().includes(destination.toLowerCase())
          )
        )
      },

      // Quote Management
      addQuote: (quoteData) => {
        const newQuote: ShippingQuote = {
          ...quoteData,
          id: `quote-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          submittedAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        }

        set((state) => ({
          quotes: [...state.quotes, newQuote],
        }))

        return newQuote.id
      },

      updateQuote: (id, updates) => {
        set((state) => ({
          quotes: state.quotes.map((quote) =>
            quote.id === id ? { ...quote, ...updates } : quote
          ),
        }))
      },

      getQuote: (id) => get().quotes.find(q => q.id === id),

      getQuotesByForwarder: (forwarderId) => {
        return get().quotes.filter(q => q.forwarderId === forwarderId)
      },

      acceptQuote: (quoteId) => {
        const quote = get().getQuote(quoteId)
        if (!quote) return null

        const booking: Booking = {
          id: `booking-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          bookingNumber: `BK-${Date.now().toString().slice(-6)}`,
          quoteId,
          forwarderId: quote.forwarderId,
          forwarderName: quote.forwarderName,
          origin: quote.origin,
          destination: quote.destination,
          mode: quote.mode,
          status: 'confirmed',
          totalCost: quote.totalCost,
          currency: quote.currency,
          lineItems: quote.lineItems,
          pickupDate: new Date().toISOString().split('T')[0],
          estimatedDeliveryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          reference: `REF-${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }

        set((state) => ({
          quotes: state.quotes.map(q =>
            q.id === quoteId ? { ...q, status: 'accepted' as const, acceptedAt: new Date().toISOString() } : q
          ),
          bookings: [...state.bookings, booking],
        }))

        return booking
      },

      rejectQuote: (quoteId) => {
        set((state) => ({
          quotes: state.quotes.map(q =>
            q.id === quoteId ? { ...q, status: 'rejected' as const } : q
          ),
        }))
      },

      expireQuote: (quoteId) => {
        set((state) => ({
          quotes: state.quotes.map(q =>
            q.id === quoteId ? { ...q, status: 'expired' as const } : q
          ),
        }))
      },

      calculateQuoteCost: (baseShipping, insurance, weight) => {
        const subtotal = baseShipping
        const insuranceCost = insurance ? baseShipping * 0.02 : 0
        const fees = weight > 1000 ? baseShipping * 0.05 : weight > 500 ? baseShipping * 0.03 : 0
        const total = subtotal + insuranceCost + fees

        return {
          subtotal,
          insurance: insuranceCost,
          fees,
          total,
        }
      },

      // Booking Management
      createBooking: (quoteId) => {
        const booking = get().acceptQuote(quoteId)
        return booking?.id || ''
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

      getBooking: (id) => get().bookings.find(b => b.id === id),

      getActiveBookings: () => {
        return get().bookings.filter(b => ['draft', 'confirmed', 'in-transit'].includes(b.status))
      },

      getCompletedBookings: () => {
        return get().bookings.filter(b => ['delivered', 'cancelled'].includes(b.status))
      },

      cancelBooking: (id) => {
        set((state) => ({
          bookings: state.bookings.map((booking) =>
            booking.id === id
              ? { ...booking, status: 'cancelled' as const, updatedAt: new Date().toISOString() }
              : booking
          ),
        }))
      },

      // Shipment Tracking
      getShipment: (trackingNumber) => {
        return get().shipments.find(s => s.trackingNumber === trackingNumber)
      },

      getShipmentByBooking: (bookingId) => {
        return get().shipments.find(s => s.bookingId === bookingId)
      },

      updateShipmentStatus: (shipmentId, status, location, description) => {
        set((state) => ({
          shipments: state.shipments.map((shipment) => {
            if (shipment.id === shipmentId) {
              const newEvent: TrackingEvent = {
                id: `event-${Date.now()}`,
                status,
                location,
                timestamp: new Date().toISOString(),
                description,
              }

              return {
                ...shipment,
                status,
                currentLocation: location,
                events: [...shipment.events, newEvent],
                updatedAt: new Date().toISOString(),
              }
            }
            return shipment
          }),
        }))
      },

      addTrackingEvent: (shipmentId, event) => {
        set((state) => ({
          shipments: state.shipments.map((shipment) =>
            shipment.id === shipmentId
              ? {
                  ...shipment,
                  events: [...shipment.events, { ...event, id: `event-${Date.now()}` }],
                  updatedAt: new Date().toISOString(),
                }
              : shipment
          ),
        }))
      },

      getShipmentHistory: (shipmentId) => {
        const shipment = get().shipments.find(s => s.id === shipmentId)
        return shipment?.events || []
      },

      // Rating Management
      addRating: (ratingData) => {
        const newRating: PartnerRating = {
          ...ratingData,
          id: `rating-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          createdAt: new Date().toISOString(),
          helpfulCount: 0,
        }

        set((state) => ({
          ratings: [...state.ratings, newRating],
        }))

        return newRating.id
      },

      getRatingsForForwarder: (forwarderId) => {
        return get().ratings.filter(r => r.forwarderId === forwarderId)
      },

      getAverageRating: (forwarderId) => {
        const ratings = get().getRatingsForForwarder(forwarderId)
        if (ratings.length === 0) return 0
        return ratings.reduce((sum, r) => sum + r.overallRating, 0) / ratings.length
      },

      markRatingHelpful: (ratingId) => {
        set((state) => ({
          ratings: state.ratings.map((rating) =>
            rating.id === ratingId
              ? { ...rating, helpfulCount: rating.helpfulCount + 1 }
              : rating
          ),
        }))
      },

      // RFQ Management
      createRFQ: (rfqData) => {
        const newRFQ: FreightRFQ = {
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

      getRFQ: (id) => get().rfqs.find(r => r.id === id),

      getOpenRFQs: () => {
        return get().rfqs.filter(r => ['open', 'quoted'].includes(r.status))
      },

      addQuoteToRFQ: (rfqId, quote) => {
        set((state) => ({
          rfqs: state.rfqs.map((rfq) => {
            if (rfq.id === rfqId) {
              return {
                ...rfq,
                quotes: [...rfq.quotes, quote],
                status: 'quoted' as const,
                updatedAt: new Date().toISOString(),
              }
            }
            return rfq
          }),
        }))
      },

      closeRFQ: (rfqId) => {
        set((state) => ({
          rfqs: state.rfqs.map((rfq) =>
            rfq.id === rfqId
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
    }),
    {
      name: 'freight-storage',
    }
  )
)
