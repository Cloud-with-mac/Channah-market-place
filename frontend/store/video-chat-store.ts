import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Type Definitions

export type CallType = 'video' | 'audio' | 'screen_share'
export type CallState = 'idle' | 'ringing' | 'connected' | 'ended'
export type ContactStatus = 'online' | 'offline' | 'busy' | 'away'

export interface Contact {
  id: string
  name: string
  email: string
  company?: string
  role?: string
  avatar?: string
  status: ContactStatus
  lastSeen?: string
  isFavorite: boolean
  phone?: string
  timezone?: string
}

export interface ChatRoom {
  id: string
  name: string
  participantIds: string[]
  createdAt: string
  lastActivity: string
  isGroup: boolean
  messages: ChatMessage[]
}

export interface ChatMessage {
  id: string
  senderId: string
  senderName: string
  content: string
  timestamp: string
  type: 'text' | 'file' | 'system'
  fileName?: string
  fileUrl?: string
}

export interface ScheduledCall {
  id: string
  title: string
  description?: string
  participantId: string
  participantName: string
  participantEmail: string
  scheduledTime: string
  duration: number
  meetingLink: string
  status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled'
  callType: CallType
  notes?: string
  timezone?: string
  reminderSent: boolean
  agenda?: string[]
  recurring?: 'none' | 'daily' | 'weekly' | 'monthly'
}

export interface CallHistory {
  id: string
  participantId: string
  participantName: string
  participantEmail: string
  startTime: string
  endTime: string
  duration: number
  callType: CallType
  status: 'completed' | 'missed' | 'declined'
  quality?: 'excellent' | 'good' | 'fair' | 'poor'
  notes?: string
  recordingLink?: string
}

// State Interface

interface VideoChatState {
  callState: CallState
  setCallState: (state: CallState) => void

  contacts: Contact[]
  addContact: (contact: Omit<Contact, 'id'>) => string
  removeContact: (id: string) => void
  updateContact: (id: string, updates: Partial<Contact>) => void
  toggleFavorite: (id: string) => void
  getContacts: (filter?: 'all' | 'favorites' | 'online') => Contact[]
  searchContacts: (query: string) => Contact[]
  getContactById: (id: string) => Contact | undefined

  chatRooms: ChatRoom[]
  createChatRoom: (name: string, participantIds: string[], isGroup?: boolean) => string
  joinChatRoom: (roomId: string, userId: string) => void
  leaveChatRoom: (roomId: string, userId: string) => void
  sendMessage: (roomId: string, senderId: string, senderName: string, content: string) => void
  getChatRoom: (roomId: string) => ChatRoom | undefined
  getRecentRooms: (limit?: number) => ChatRoom[]

  scheduledCalls: ScheduledCall[]
  scheduleCall: (
    title: string,
    participantId: string,
    scheduledTime: string,
    duration: number,
    callType?: CallType,
    description?: string,
    notes?: string,
    timezone?: string,
    recurring?: 'none' | 'daily' | 'weekly' | 'monthly'
  ) => string
  updateScheduledCall: (id: string, updates: Partial<ScheduledCall>) => void
  cancelCall: (id: string, reason?: string) => void
  startCall: (id: string) => void
  completeCall: (id: string) => void
  getUpcomingCalls: (limit?: number) => ScheduledCall[]
  getScheduledCallById: (id: string) => ScheduledCall | undefined
  sendReminder: (id: string) => void

  callHistory: CallHistory[]
  addCallHistory: (
    participantId: string,
    participantName: string,
    participantEmail: string,
    startTime: string,
    endTime: string,
    callType: CallType,
    status: 'completed' | 'missed' | 'declined',
    quality?: 'excellent' | 'good' | 'fair' | 'poor',
    notes?: string,
    recordingLink?: string
  ) => string
  getCallHistory: (limit?: number) => CallHistory[]
  getCallHistoryByParticipant: (participantId: string) => CallHistory[]
  getCallHistoryByType: (callType: CallType) => CallHistory[]
  updateCallNote: (id: string, note: string) => void
  getCallStats: () => {
    totalCalls: number
    totalDuration: number
    completedCalls: number
    missedCalls: number
    averageDuration: number
    callsByType: Record<CallType, number>
  }

  currentCall: ScheduledCall | null
  setCurrentCall: (call: ScheduledCall | null) => void
  generateMeetingLink: (callId: string) => string
  copyMeetingLink: (callId: string) => void

  isMuted: boolean
  isCameraOn: boolean
  isScreenSharing: boolean
  toggleMute: () => void
  toggleCamera: () => void
  toggleScreenShare: () => void

  initiateQuickCall: (contactId: string, callType?: CallType) => string
  endQuickCall: () => void
}

// Mock contact data
const mockContacts: Contact[] = [
  {
    id: 'contact-1',
    name: 'Sarah Chen',
    email: 'sarah.chen@example.com',
    company: 'TechCorp',
    role: 'Vendor Manager',
    status: 'online',
    isFavorite: true,
    phone: '+1-555-0101',
    timezone: 'America/New_York',
  },
  {
    id: 'contact-2',
    name: 'James Wilson',
    email: 'james.wilson@example.com',
    company: 'Global Supplies',
    role: 'Sales Director',
    status: 'away',
    isFavorite: false,
    phone: '+1-555-0102',
    timezone: 'America/Chicago',
  },
  {
    id: 'contact-3',
    name: 'Amara Okafor',
    email: 'amara.okafor@example.com',
    company: 'AfriGoods',
    role: 'Supplier',
    status: 'online',
    isFavorite: true,
    phone: '+234-555-0103',
    timezone: 'Africa/Lagos',
  },
]

const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

export const useVideoChatStore = create<VideoChatState>()(
  persist(
    (set, get) => ({
      callState: 'idle',
      setCallState: (state) => set({ callState: state }),

      contacts: mockContacts,
      addContact: (contact) => {
        const id = generateId()
        set((s) => ({ contacts: [...s.contacts, { ...contact, id }] }))
        return id
      },
      removeContact: (id) => set((s) => ({ contacts: s.contacts.filter((c) => c.id !== id) })),
      updateContact: (id, updates) =>
        set((s) => ({
          contacts: s.contacts.map((c) => (c.id === id ? { ...c, ...updates } : c)),
        })),
      toggleFavorite: (id) =>
        set((s) => ({
          contacts: s.contacts.map((c) => (c.id === id ? { ...c, isFavorite: !c.isFavorite } : c)),
        })),
      getContacts: (filter) => {
        const { contacts } = get()
        if (filter === 'favorites') return contacts.filter((c) => c.isFavorite)
        if (filter === 'online') return contacts.filter((c) => c.status === 'online')
        return contacts
      },
      searchContacts: (query) => {
        const q = query.toLowerCase()
        return get().contacts.filter(
          (c) =>
            c.name.toLowerCase().includes(q) ||
            c.email.toLowerCase().includes(q) ||
            c.company?.toLowerCase().includes(q)
        )
      },
      getContactById: (id) => get().contacts.find((c) => c.id === id),

      chatRooms: [],
      createChatRoom: (name, participantIds, isGroup = false) => {
        const id = generateId()
        const now = new Date().toISOString()
        set((s) => ({
          chatRooms: [
            ...s.chatRooms,
            { id, name, participantIds, createdAt: now, lastActivity: now, isGroup, messages: [] },
          ],
        }))
        return id
      },
      joinChatRoom: (roomId, userId) =>
        set((s) => ({
          chatRooms: s.chatRooms.map((r) =>
            r.id === roomId && !r.participantIds.includes(userId)
              ? { ...r, participantIds: [...r.participantIds, userId] }
              : r
          ),
        })),
      leaveChatRoom: (roomId, userId) =>
        set((s) => ({
          chatRooms: s.chatRooms.map((r) =>
            r.id === roomId ? { ...r, participantIds: r.participantIds.filter((p) => p !== userId) } : r
          ),
        })),
      sendMessage: (roomId, senderId, senderName, content) => {
        const msg: ChatMessage = {
          id: generateId(),
          senderId,
          senderName,
          content,
          timestamp: new Date().toISOString(),
          type: 'text',
        }
        set((s) => ({
          chatRooms: s.chatRooms.map((r) =>
            r.id === roomId
              ? { ...r, messages: [...r.messages, msg], lastActivity: msg.timestamp }
              : r
          ),
        }))
      },
      getChatRoom: (roomId) => get().chatRooms.find((r) => r.id === roomId),
      getRecentRooms: (limit = 10) =>
        [...get().chatRooms].sort((a, b) => b.lastActivity.localeCompare(a.lastActivity)).slice(0, limit),

      scheduledCalls: [],
      scheduleCall: (title, participantId, scheduledTime, duration, callType = 'video', description, notes, timezone, recurring = 'none') => {
        const id = generateId()
        const contact = get().getContactById(participantId)
        set((s) => ({
          scheduledCalls: [
            ...s.scheduledCalls,
            {
              id,
              title,
              description,
              participantId,
              participantName: contact?.name || 'Unknown',
              participantEmail: contact?.email || '',
              scheduledTime,
              duration,
              meetingLink: `https://meet.channah.com/${id}`,
              status: 'scheduled',
              callType,
              notes,
              timezone,
              reminderSent: false,
              recurring,
            },
          ],
        }))
        return id
      },
      updateScheduledCall: (id, updates) =>
        set((s) => ({
          scheduledCalls: s.scheduledCalls.map((c) => (c.id === id ? { ...c, ...updates } : c)),
        })),
      cancelCall: (id) =>
        set((s) => ({
          scheduledCalls: s.scheduledCalls.map((c) =>
            c.id === id ? { ...c, status: 'cancelled' as const } : c
          ),
        })),
      startCall: (id) =>
        set((s) => ({
          scheduledCalls: s.scheduledCalls.map((c) =>
            c.id === id ? { ...c, status: 'ongoing' as const } : c
          ),
          callState: 'connected',
          currentCall: s.scheduledCalls.find((c) => c.id === id) || null,
        })),
      completeCall: (id) =>
        set((s) => ({
          scheduledCalls: s.scheduledCalls.map((c) =>
            c.id === id ? { ...c, status: 'completed' as const } : c
          ),
          callState: 'ended',
          currentCall: null,
        })),
      getUpcomingCalls: (limit = 10) =>
        get()
          .scheduledCalls.filter((c) => c.status === 'scheduled')
          .sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime))
          .slice(0, limit),
      getScheduledCallById: (id) => get().scheduledCalls.find((c) => c.id === id),
      sendReminder: (id) =>
        set((s) => ({
          scheduledCalls: s.scheduledCalls.map((c) =>
            c.id === id ? { ...c, reminderSent: true } : c
          ),
        })),

      callHistory: [],
      addCallHistory: (participantId, participantName, participantEmail, startTime, endTime, callType, status, quality, notes, recordingLink) => {
        const id = generateId()
        const start = new Date(startTime).getTime()
        const end = new Date(endTime).getTime()
        set((s) => ({
          callHistory: [
            ...s.callHistory,
            {
              id,
              participantId,
              participantName,
              participantEmail,
              startTime,
              endTime,
              duration: Math.round((end - start) / 1000),
              callType,
              status,
              quality,
              notes,
              recordingLink,
            },
          ],
        }))
        return id
      },
      getCallHistory: (limit = 50) =>
        [...get().callHistory].sort((a, b) => b.startTime.localeCompare(a.startTime)).slice(0, limit),
      getCallHistoryByParticipant: (participantId) =>
        get().callHistory.filter((c) => c.participantId === participantId),
      getCallHistoryByType: (callType) =>
        get().callHistory.filter((c) => c.callType === callType),
      updateCallNote: (id, note) =>
        set((s) => ({
          callHistory: s.callHistory.map((c) => (c.id === id ? { ...c, notes: note } : c)),
        })),
      getCallStats: () => {
        const history = get().callHistory
        const completed = history.filter((c) => c.status === 'completed')
        const missed = history.filter((c) => c.status === 'missed')
        const totalDuration = completed.reduce((sum, c) => sum + c.duration, 0)
        const callsByType: Record<CallType, number> = { video: 0, audio: 0, screen_share: 0 }
        history.forEach((c) => { callsByType[c.callType]++ })
        return {
          totalCalls: history.length,
          totalDuration,
          completedCalls: completed.length,
          missedCalls: missed.length,
          averageDuration: completed.length > 0 ? Math.round(totalDuration / completed.length) : 0,
          callsByType,
        }
      },

      currentCall: null,
      setCurrentCall: (call) => set({ currentCall: call }),
      generateMeetingLink: (callId) => `https://meet.channah.com/${callId}`,
      copyMeetingLink: (callId) => {
        const link = `https://meet.channah.com/${callId}`
        if (typeof navigator !== 'undefined') {
          navigator.clipboard.writeText(link).catch(() => {})
        }
      },

      isMuted: false,
      isCameraOn: true,
      isScreenSharing: false,
      toggleMute: () => set((s) => ({ isMuted: !s.isMuted })),
      toggleCamera: () => set((s) => ({ isCameraOn: !s.isCameraOn })),
      toggleScreenShare: () => set((s) => ({ isScreenSharing: !s.isScreenSharing })),

      initiateQuickCall: (contactId, callType = 'video') => {
        const contact = get().getContactById(contactId)
        const id = generateId()
        const now = new Date().toISOString()
        const call: ScheduledCall = {
          id,
          title: `Quick call with ${contact?.name || 'Unknown'}`,
          participantId: contactId,
          participantName: contact?.name || 'Unknown',
          participantEmail: contact?.email || '',
          scheduledTime: now,
          duration: 0,
          meetingLink: `https://meet.channah.com/${id}`,
          status: 'ongoing',
          callType,
          reminderSent: false,
        }
        set({ currentCall: call, callState: 'ringing', isMuted: false, isCameraOn: true, isScreenSharing: false })
        return id
      },
      endQuickCall: () => {
        const { currentCall } = get()
        if (currentCall) {
          const now = new Date().toISOString()
          get().addCallHistory(
            currentCall.participantId,
            currentCall.participantName,
            currentCall.participantEmail,
            currentCall.scheduledTime,
            now,
            currentCall.callType,
            'completed',
            'good'
          )
        }
        set({ currentCall: null, callState: 'idle', isMuted: false, isCameraOn: true, isScreenSharing: false })
      },
    }),
    {
      name: 'video-chat-storage',
      partialize: (state) => ({
        contacts: state.contacts,
        callHistory: state.callHistory,
        scheduledCalls: state.scheduledCalls,
      }),
    }
  )
)