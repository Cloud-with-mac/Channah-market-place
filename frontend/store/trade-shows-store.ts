import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface ExhibitorBooth {
  id: string
  vendorId: string
  vendorName: string
  vendorLogo?: string
  boothNumber: string
  boothSize: 'small' | 'medium' | 'large' | 'premium'
  description: string
  products: string[] // Product IDs
  contactName: string
  contactEmail: string
  contactPhone: string
  website?: string
  videoUrl?: string
  images: string[]
  specialOffers?: string
  visitorCount: number
  rating: number
  reviews: BoothReview[]
  schedule?: {
    presentationTime?: string
    meetingSlots?: string[]
    demoSchedule?: string
  }
  isLive: boolean
  registeredAt: string
}

export interface BoothReview {
  id: string
  visitorId: string
  visitorName: string
  rating: number
  comment: string
  createdAt: string
}

export interface EventSession {
  id: string
  title: string
  description: string
  startTime: string
  endTime: string
  type: 'keynote' | 'workshop' | 'panel' | 'demo' | 'networking'
  speakers?: string[]
  maxAttendees?: number
  currentAttendees: number
  room?: string
  isLive: boolean
}

export interface TradeShowEvent {
  id: string
  title: string
  description: string
  startDate: string
  endDate: string
  location: string
  city: string
  country: string
  timezone: string
  status: 'upcoming' | 'live' | 'ended'
  type: 'virtual' | 'hybrid' | 'physical'
  category: string[]
  image: string
  banner?: string
  exhibitorCount: number
  expectedAttendees: number
  currentAttendees: number
  registeredUsers: string[] // User IDs
  booths: ExhibitorBooth[]
  schedule: EventSession[]
  features: {
    networking: boolean
    liveChat: boolean
    videoConferencing: boolean
    documentSharing: boolean
    polls: boolean
    qna: boolean
  }
  organizer: {
    name: string
    email: string
    website?: string
    phone?: string
  }
  createdAt: string
  updatedAt: string
}

export interface EventRegistration {
  id: string
  userId: string
  userName: string
  userEmail: string
  company?: string
  designation?: string
  eventId: string
  boothIdsVisited: string[]
  sessionsAttended: string[]
  notesAndActions: string[]
  registeredAt: string
  lastActiveAt: string
}

// ============================================================================
// Store State
// ============================================================================

interface TradeShowsState {
  // Events
  events: TradeShowEvent[]
  registrations: EventRegistration[]

  // UI State
  selectedEventId: string | null
  selectedBoothId: string | null
  filterCategory: string | null
  filterStatus: 'upcoming' | 'live' | 'ended' | 'all'
  searchQuery: string
  calendarView: 'month' | 'week' | 'day'

  // Event Management
  createEvent: (eventData: Omit<TradeShowEvent, 'id' | 'createdAt' | 'updatedAt'>) => string
  updateEvent: (eventId: string, updates: Partial<TradeShowEvent>) => void
  deleteEvent: (eventId: string) => void
  getEvent: (eventId: string) => TradeShowEvent | undefined

  // Event Registration
  registerForEvent: (
    userId: string,
    userName: string,
    userEmail: string,
    eventId: string,
    userData?: { company?: string; designation?: string }
  ) => string
  unregisterFromEvent: (userId: string, eventId: string) => void
  isUserRegisteredForEvent: (userId: string, eventId: string) => boolean
  getUserRegistration: (userId: string, eventId: string) => EventRegistration | undefined

  // Booth Management
  addBooth: (eventId: string, booth: Omit<ExhibitorBooth, 'id' | 'registeredAt'>) => string
  updateBooth: (eventId: string, boothId: string, updates: Partial<ExhibitorBooth>) => void
  removeBooth: (eventId: string, boothId: string) => void
  getBooth: (eventId: string, boothId: string) => ExhibitorBooth | undefined
  getEventBooths: (eventId: string) => ExhibitorBooth[]

  // Booth Visits
  visitBooth: (userId: string, eventId: string, boothId: string) => void
  addBoothReview: (
    eventId: string,
    boothId: string,
    review: Omit<BoothReview, 'id' | 'createdAt'>
  ) => void

  // Event Sessions
  addSession: (eventId: string, session: Omit<EventSession, 'id'>) => string
  updateSession: (eventId: string, sessionId: string, updates: Partial<EventSession>) => void
  removeSession: (eventId: string, sessionId: string) => void
  getEventSessions: (eventId: string) => EventSession[]
  attendSession: (userId: string, eventId: string, sessionId: string) => void

  // Event Registration Notes
  addRegistrationNote: (userId: string, eventId: string, note: string) => void
  getRegistrationNotes: (userId: string, eventId: string) => string[]

  // Filtering & Search
  setSelectedEvent: (eventId: string | null) => void
  setSelectedBooth: (boothId: string | null) => void
  setFilterCategory: (category: string | null) => void
  setFilterStatus: (status: 'upcoming' | 'live' | 'ended' | 'all') => void
  setSearchQuery: (query: string) => void
  setCalendarView: (view: 'month' | 'week' | 'day') => void

  // Query Methods
  getUpcomingEvents: () => TradeShowEvent[]
  getLiveEvents: () => TradeShowEvent[]
  getEndedEvents: () => TradeShowEvent[]
  getEventsByCategory: (category: string) => TradeShowEvent[]
  getFilteredEvents: () => TradeShowEvent[]
  getUserRegistrations: (userId: string) => TradeShowEvent[]
  getEventsByDateRange: (startDate: string, endDate: string) => TradeShowEvent[]
}

// ============================================================================
// Zustand Store
// ============================================================================

export const useTradeShowsStore = create<TradeShowsState>()(
  persist(
    (set, get) => ({
      // Initial State
      events: [
        {
          id: 'event-001',
          title: 'Global Manufacturing Expo 2024',
          description:
            'The largest B2B manufacturing event featuring 500+ exhibitors and 10,000+ attendees',
          startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          endDate: new Date(Date.now() + 32 * 24 * 60 * 60 * 1000).toISOString(),
          location: 'Convention Center',
          city: 'New York',
          country: 'USA',
          timezone: 'EST',
          status: 'upcoming',
          type: 'hybrid',
          category: ['Manufacturing', 'Industrial'],
          image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=300&fit=crop',
          banner: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=1200&h=400&fit=crop',
          exhibitorCount: 150,
          expectedAttendees: 5000,
          currentAttendees: 0,
          registeredUsers: [],
          booths: [],
          schedule: [],
          features: {
            networking: true,
            liveChat: true,
            videoConferencing: true,
            documentSharing: true,
            polls: true,
            qna: true,
          },
          organizer: {
            name: 'Trade Show Events Inc.',
            email: 'info@tradeshowevents.com',
            website: 'www.tradeshowevents.com',
            phone: '+1-800-TRADE-SHOW',
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'event-002',
          title: 'Digital Commerce Summit 2024',
          description: 'Premium B2B digital commerce conference with live networking',
          startDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
          endDate: new Date(Date.now() + 61 * 24 * 60 * 60 * 1000).toISOString(),
          location: 'Virtual',
          city: 'San Francisco',
          country: 'USA',
          timezone: 'PST',
          status: 'upcoming',
          type: 'virtual',
          category: ['E-commerce', 'Technology'],
          image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=300&fit=crop',
          exhibitorCount: 80,
          expectedAttendees: 3000,
          currentAttendees: 0,
          registeredUsers: [],
          booths: [],
          schedule: [],
          features: {
            networking: true,
            liveChat: true,
            videoConferencing: true,
            documentSharing: true,
            polls: true,
            qna: true,
          },
          organizer: {
            name: 'Digital Commerce Association',
            email: 'contact@dca.org',
            website: 'www.dca.org',
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
      registrations: [],
      selectedEventId: null,
      selectedBoothId: null,
      filterCategory: null,
      filterStatus: 'all',
      searchQuery: '',
      calendarView: 'month',

      // Event Management
      createEvent: (eventData) => {
        const newEvent: TradeShowEvent = {
          ...eventData,
          id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }

        set((state) => ({
          events: [...state.events, newEvent],
        }))

        return newEvent.id
      },

      updateEvent: (eventId, updates) => {
        set((state) => ({
          events: state.events.map((event) =>
            event.id === eventId
              ? {
                  ...event,
                  ...updates,
                  updatedAt: new Date().toISOString(),
                }
              : event
          ),
        }))
      },

      deleteEvent: (eventId) => {
        set((state) => ({
          events: state.events.filter((event) => event.id !== eventId),
          registrations: state.registrations.filter((reg) => reg.eventId !== eventId),
          selectedEventId:
            state.selectedEventId === eventId ? null : state.selectedEventId,
        }))
      },

      getEvent: (eventId) => {
        return get().events.find((event) => event.id === eventId)
      },

      // Event Registration
      registerForEvent: (userId, userName, userEmail, eventId, userData) => {
        const registrationId = `reg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        const registration: EventRegistration = {
          id: registrationId,
          userId,
          userName,
          userEmail,
          company: userData?.company,
          designation: userData?.designation,
          eventId,
          boothIdsVisited: [],
          sessionsAttended: [],
          notesAndActions: [],
          registeredAt: new Date().toISOString(),
          lastActiveAt: new Date().toISOString(),
        }

        set((state) => ({
          registrations: [...state.registrations, registration],
          events: state.events.map((event) =>
            event.id === eventId
              ? {
                  ...event,
                  registeredUsers: [...new Set([...event.registeredUsers, userId])],
                  currentAttendees: event.currentAttendees + 1,
                }
              : event
          ),
        }))

        return registrationId
      },

      unregisterFromEvent: (userId, eventId) => {
        set((state) => ({
          registrations: state.registrations.filter(
            (reg) => !(reg.userId === userId && reg.eventId === eventId)
          ),
          events: state.events.map((event) =>
            event.id === eventId
              ? {
                  ...event,
                  registeredUsers: event.registeredUsers.filter((id) => id !== userId),
                  currentAttendees: Math.max(0, event.currentAttendees - 1),
                }
              : event
          ),
        }))
      },

      isUserRegisteredForEvent: (userId, eventId) => {
        return get().registrations.some(
          (reg) => reg.userId === userId && reg.eventId === eventId
        )
      },

      getUserRegistration: (userId, eventId) => {
        return get().registrations.find(
          (reg) => reg.userId === userId && reg.eventId === eventId
        )
      },

      // Booth Management
      addBooth: (eventId, booth) => {
        const boothId = `booth-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        const newBooth: ExhibitorBooth = {
          ...booth,
          id: boothId,
          visitorCount: 0,
          reviews: [],
          registeredAt: new Date().toISOString(),
        }

        set((state) => ({
          events: state.events.map((event) =>
            event.id === eventId
              ? {
                  ...event,
                  booths: [...event.booths, newBooth],
                  exhibitorCount: event.exhibitorCount + 1,
                }
              : event
          ),
        }))

        return boothId
      },

      updateBooth: (eventId, boothId, updates) => {
        set((state) => ({
          events: state.events.map((event) =>
            event.id === eventId
              ? {
                  ...event,
                  booths: event.booths.map((booth) =>
                    booth.id === boothId ? { ...booth, ...updates } : booth
                  ),
                }
              : event
          ),
        }))
      },

      removeBooth: (eventId, boothId) => {
        set((state) => ({
          events: state.events.map((event) =>
            event.id === eventId
              ? {
                  ...event,
                  booths: event.booths.filter((booth) => booth.id !== boothId),
                  exhibitorCount: Math.max(0, event.exhibitorCount - 1),
                }
              : event
          ),
        }))
      },

      getBooth: (eventId, boothId) => {
        const event = get().events.find((e) => e.id === eventId)
        return event?.booths.find((booth) => booth.id === boothId)
      },

      getEventBooths: (eventId) => {
        const event = get().events.find((e) => e.id === eventId)
        return event?.booths || []
      },

      // Booth Visits
      visitBooth: (userId, eventId, boothId) => {
        set((state) => ({
          events: state.events.map((event) =>
            event.id === eventId
              ? {
                  ...event,
                  booths: event.booths.map((booth) =>
                    booth.id === boothId
                      ? { ...booth, visitorCount: booth.visitorCount + 1 }
                      : booth
                  ),
                }
              : event
          ),
          registrations: state.registrations.map((reg) =>
            reg.userId === userId && reg.eventId === eventId
              ? {
                  ...reg,
                  boothIdsVisited: [...new Set([...reg.boothIdsVisited, boothId])],
                  lastActiveAt: new Date().toISOString(),
                }
              : reg
          ),
        }))
      },

      addBoothReview: (eventId, boothId, review) => {
        const newReview: BoothReview = {
          ...review,
          id: `review-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          createdAt: new Date().toISOString(),
        }

        set((state) => ({
          events: state.events.map((event) =>
            event.id === eventId
              ? {
                  ...event,
                  booths: event.booths.map((booth) =>
                    booth.id === boothId
                      ? {
                          ...booth,
                          reviews: [...booth.reviews, newReview],
                          rating:
                            (booth.reviews.reduce((sum, r) => sum + r.rating, 0) +
                              review.rating) /
                            (booth.reviews.length + 1),
                        }
                      : booth
                  ),
                }
              : event
          ),
        }))
      },

      // Event Sessions
      addSession: (eventId, session) => {
        const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        const newSession: EventSession = {
          ...session,
          id: sessionId,
        }

        set((state) => ({
          events: state.events.map((event) =>
            event.id === eventId
              ? {
                  ...event,
                  schedule: [...event.schedule, newSession],
                }
              : event
          ),
        }))

        return sessionId
      },

      updateSession: (eventId, sessionId, updates) => {
        set((state) => ({
          events: state.events.map((event) =>
            event.id === eventId
              ? {
                  ...event,
                  schedule: event.schedule.map((session) =>
                    session.id === sessionId ? { ...session, ...updates } : session
                  ),
                }
              : event
          ),
        }))
      },

      removeSession: (eventId, sessionId) => {
        set((state) => ({
          events: state.events.map((event) =>
            event.id === eventId
              ? {
                  ...event,
                  schedule: event.schedule.filter((session) => session.id !== sessionId),
                }
              : event
          ),
        }))
      },

      getEventSessions: (eventId) => {
        const event = get().events.find((e) => e.id === eventId)
        return event?.schedule || []
      },

      attendSession: (userId, eventId, sessionId) => {
        set((state) => ({
          events: state.events.map((event) =>
            event.id === eventId
              ? {
                  ...event,
                  schedule: event.schedule.map((session) =>
                    session.id === sessionId
                      ? {
                          ...session,
                          currentAttendees: session.currentAttendees + 1,
                        }
                      : session
                  ),
                }
              : event
          ),
          registrations: state.registrations.map((reg) =>
            reg.userId === userId && reg.eventId === eventId
              ? {
                  ...reg,
                  sessionsAttended: [...new Set([...reg.sessionsAttended, sessionId])],
                  lastActiveAt: new Date().toISOString(),
                }
              : reg
          ),
        }))
      },

      // Event Registration Notes
      addRegistrationNote: (userId, eventId, note) => {
        set((state) => ({
          registrations: state.registrations.map((reg) =>
            reg.userId === userId && reg.eventId === eventId
              ? {
                  ...reg,
                  notesAndActions: [...reg.notesAndActions, note],
                  lastActiveAt: new Date().toISOString(),
                }
              : reg
          ),
        }))
      },

      getRegistrationNotes: (userId, eventId) => {
        const registration = get().registrations.find(
          (reg) => reg.userId === userId && reg.eventId === eventId
        )
        return registration?.notesAndActions || []
      },

      // UI State Management
      setSelectedEvent: (eventId) => {
        set({ selectedEventId: eventId })
      },

      setSelectedBooth: (boothId) => {
        set({ selectedBoothId: boothId })
      },

      setFilterCategory: (category) => {
        set({ filterCategory: category })
      },

      setFilterStatus: (status) => {
        set({ filterStatus: status })
      },

      setSearchQuery: (query) => {
        set({ searchQuery: query })
      },

      setCalendarView: (view) => {
        set({ calendarView: view })
      },

      // Query Methods
      getUpcomingEvents: () => {
        return get().events.filter((event) => event.status === 'upcoming')
      },

      getLiveEvents: () => {
        return get().events.filter((event) => event.status === 'live')
      },

      getEndedEvents: () => {
        return get().events.filter((event) => event.status === 'ended')
      },

      getEventsByCategory: (category) => {
        return get().events.filter((event) => event.category.includes(category))
      },

      getFilteredEvents: () => {
        let filtered = get().events

        // Filter by status
        const { filterStatus } = get()
        if (filterStatus !== 'all') {
          filtered = filtered.filter((event) => event.status === filterStatus)
        }

        // Filter by category
        const { filterCategory } = get()
        if (filterCategory) {
          filtered = filtered.filter((event) => event.category.includes(filterCategory))
        }

        // Filter by search query
        const { searchQuery } = get()
        if (searchQuery) {
          const query = searchQuery.toLowerCase()
          filtered = filtered.filter(
            (event) =>
              event.title.toLowerCase().includes(query) ||
              event.description.toLowerCase().includes(query) ||
              event.city.toLowerCase().includes(query) ||
              event.category.some((cat) => cat.toLowerCase().includes(query))
          )
        }

        return filtered.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
      },

      getUserRegistrations: (userId) => {
        const userRegistrations = get().registrations.filter((reg) => reg.userId === userId)
        return get().events.filter((event) =>
          userRegistrations.some((reg) => reg.eventId === event.id)
        )
      },

      getEventsByDateRange: (startDate, endDate) => {
        const start = new Date(startDate).getTime()
        const end = new Date(endDate).getTime()
        return get().events.filter((event) => {
          const eventStart = new Date(event.startDate).getTime()
          const eventEnd = new Date(event.endDate).getTime()
          return eventStart >= start && eventEnd <= end
        })
      },
    }),
    {
      name: 'channah-trade-shows',
    }
  )
)
