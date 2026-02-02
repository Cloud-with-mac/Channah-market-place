import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface TeamMember {
  id: string
  email: string
  name: string
  role: 'owner' | 'admin' | 'buyer' | 'viewer'
  permissions: string[]
  invitedBy: string
  invitedAt: string
  status: 'pending' | 'active' | 'suspended'
  lastActive?: string
}

export interface TeamActivity {
  id: string
  userId: string
  userName: string
  action: string
  details: string
  timestamp: string
}

interface TeamState {
  teamMembers: TeamMember[]
  activities: TeamActivity[]
  sharedResources: {
    wishlists: string[]
    rfqs: string[]
    documents: string[]
  }

  // Team Management
  inviteMember: (email: string, name: string, role: TeamMember['role']) => string
  removeMember: (id: string) => void
  updateRole: (id: string, role: TeamMember['role']) => void
  updatePermissions: (id: string, permissions: string[]) => void
  suspendMember: (id: string) => void
  activateMember: (id: string) => void

  // Activity
  logActivity: (userId: string, userName: string, action: string, details: string) => void
  getRecentActivity: (limit?: number) => TeamActivity[]

  // Shared Resources
  shareWishlist: (wishlistId: string) => void
  shareRFQ: (rfqId: string) => void
  shareDocument: (documentId: string) => void
}

export const useTeamStore = create<TeamState>()(
  persist(
    (set, get) => ({
      teamMembers: [],
      activities: [],
      sharedResources: {
        wishlists: [],
        rfqs: [],
        documents: [],
      },

      inviteMember: (email, name, role) => {
        const newMember: TeamMember = {
          id: `member-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          email,
          name,
          role,
          permissions: getRolePermissions(role),
          invitedBy: 'current-user', // Would be from auth context
          invitedAt: new Date().toISOString(),
          status: 'pending',
        }

        set((state) => ({
          teamMembers: [...state.teamMembers, newMember],
        }))

        get().logActivity('system', 'System', 'invite_sent', `Invited ${name} as ${role}`)

        return newMember.id
      },

      removeMember: (id) => {
        const member = get().teamMembers.find((m) => m.id === id)
        if (member) {
          get().logActivity('system', 'System', 'member_removed', `Removed ${member.name}`)
        }

        set((state) => ({
          teamMembers: state.teamMembers.filter((m) => m.id !== id),
        }))
      },

      updateRole: (id, role) => {
        set((state) => ({
          teamMembers: state.teamMembers.map((m) =>
            m.id === id
              ? { ...m, role, permissions: getRolePermissions(role) }
              : m
          ),
        }))

        const member = get().teamMembers.find((m) => m.id === id)
        if (member) {
          get().logActivity('system', 'System', 'role_updated', `Changed ${member.name} role to ${role}`)
        }
      },

      updatePermissions: (id, permissions) => {
        set((state) => ({
          teamMembers: state.teamMembers.map((m) =>
            m.id === id ? { ...m, permissions } : m
          ),
        }))
      },

      suspendMember: (id) => {
        set((state) => ({
          teamMembers: state.teamMembers.map((m) =>
            m.id === id ? { ...m, status: 'suspended' } : m
          ),
        }))

        const member = get().teamMembers.find((m) => m.id === id)
        if (member) {
          get().logActivity('system', 'System', 'member_suspended', `Suspended ${member.name}`)
        }
      },

      activateMember: (id) => {
        set((state) => ({
          teamMembers: state.teamMembers.map((m) =>
            m.id === id ? { ...m, status: 'active' } : m
          ),
        }))

        const member = get().teamMembers.find((m) => m.id === id)
        if (member) {
          get().logActivity('system', 'System', 'member_activated', `Activated ${member.name}`)
        }
      },

      logActivity: (userId, userName, action, details) => {
        const newActivity: TeamActivity = {
          id: `activity-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          userId,
          userName,
          action,
          details,
          timestamp: new Date().toISOString(),
        }

        set((state) => ({
          activities: [newActivity, ...state.activities].slice(0, 100), // Keep last 100
        }))
      },

      getRecentActivity: (limit = 20) => {
        return get().activities.slice(0, limit)
      },

      shareWishlist: (wishlistId) => {
        set((state) => ({
          sharedResources: {
            ...state.sharedResources,
            wishlists: [...state.sharedResources.wishlists, wishlistId],
          },
        }))
        get().logActivity('system', 'System', 'wishlist_shared', `Shared wishlist ${wishlistId}`)
      },

      shareRFQ: (rfqId) => {
        set((state) => ({
          sharedResources: {
            ...state.sharedResources,
            rfqs: [...state.sharedResources.rfqs, rfqId],
          },
        }))
        get().logActivity('system', 'System', 'rfq_shared', `Shared RFQ ${rfqId}`)
      },

      shareDocument: (documentId) => {
        set((state) => ({
          sharedResources: {
            ...state.sharedResources,
            documents: [...state.sharedResources.documents, documentId],
          },
        }))
        get().logActivity('system', 'System', 'document_shared', `Shared document ${documentId}`)
      },
    }),
    {
      name: 'channah-team',
    }
  )
)

function getRolePermissions(role: TeamMember['role']): string[] {
  const permissions = {
    owner: [
      'manage_team',
      'manage_billing',
      'create_rfq',
      'place_orders',
      'view_documents',
      'upload_documents',
      'manage_wishlists',
    ],
    admin: [
      'manage_team',
      'create_rfq',
      'place_orders',
      'view_documents',
      'upload_documents',
      'manage_wishlists',
    ],
    buyer: [
      'create_rfq',
      'place_orders',
      'view_documents',
      'manage_wishlists',
    ],
    viewer: [
      'view_documents',
    ],
  }

  return permissions[role] || []
}
