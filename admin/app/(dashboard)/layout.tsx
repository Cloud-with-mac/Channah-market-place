'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { AdminSidebar } from '@/components/admin/sidebar'
import { AdminHeader } from '@/components/admin/header'
import { useAuthStore, useSidebarStore, useNotificationStore, useMessagesStore } from '@/store'
import { supportAPI } from '@/lib/api'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const { isAuthenticated, _hasHydrated } = useAuthStore()
  const { isCollapsed } = useSidebarStore()

  // SECURITY FIX: Proper auth check with loading state
  React.useEffect(() => {
    // Wait for hydration to complete before checking auth
    if (!_hasHydrated) return

    // Redirect to login if not authenticated
    if (!isAuthenticated) {
      router.replace('/login')
    }
  }, [isAuthenticated, _hasHydrated, router])

  // Show loading during hydration or during redirect
  if (!_hasHydrated || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // Poll for new support chats and generate notifications
  const { addNotification } = useNotificationStore()
  const { setUnreadMessagesCount } = useMessagesStore()
  const { toast } = useToast()
  const knownChatIdsRef = React.useRef<Set<string>>(new Set())
  const initialLoadRef = React.useRef(true)

  React.useEffect(() => {
    if (!isAuthenticated || !_hasHydrated) return

    const checkNewChats = async () => {
      try {
        const chats = await supportAPI.getTickets()
        const chatList = Array.isArray(chats) ? chats : chats?.results || chats?.items || []

        // Count chats with actual unread messages
        const unreadChats = chatList.filter((c: { status: string; unread_count?: number }) =>
          (c.status === 'open' || c.status === 'active') && (c.unread_count ?? 0) > 0
        )
        setUnreadMessagesCount(unreadChats.length)

        // On first load, just record existing chat IDs
        if (initialLoadRef.current) {
          chatList.forEach((c: { id: string }) => knownChatIdsRef.current.add(c.id))
          initialLoadRef.current = false
          return
        }

        // Check for new chats we haven't seen
        chatList.forEach((c: { id: string; customer_name?: string; subject?: string; status: string }) => {
          if (!knownChatIdsRef.current.has(c.id)) {
            knownChatIdsRef.current.add(c.id)
            const customerName = c.customer_name || 'A customer'
            const subject = c.subject || 'New message'

            // Add to notification store
            addNotification({
              id: `chat-${c.id}`,
              type: 'system',
              title: 'New Support Chat',
              message: `${customerName}: ${subject}`,
              read: false,
              timestamp: new Date().toISOString(),
              link: '/support',
            })

            // Show toast
            toast({
              title: 'New Support Chat',
              description: `${customerName} needs help: ${subject}`,
            })
          }
        })
      } catch {
        // Silently fail - don't interrupt the admin
      }
    }

    checkNewChats()
    const interval = setInterval(checkNewChats, 10000) // Poll every 10 seconds
    return () => clearInterval(interval)
  }, [isAuthenticated, _hasHydrated])

  // Show loading while hydrating
  if (!_hasHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // Don't render if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Redirecting...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <AdminSidebar />

      {/* Header */}
      <AdminHeader />

      {/* Main Content */}
      <main
        className={cn(
          'pt-16 min-h-screen transition-all duration-300',
          isCollapsed ? 'pl-[70px]' : 'pl-[260px]'
        )}
      >
        <div className="p-6">{children}</div>
      </main>
    </div>
  )
}
