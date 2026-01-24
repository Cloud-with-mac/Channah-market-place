'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { VendorSidebar } from '@/components/vendor/sidebar'
import { VendorHeader } from '@/components/vendor/header'
import { useAuthStore, useSidebarStore } from '@/store'
import { cn } from '@/lib/utils'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const { isAuthenticated, _hasHydrated } = useAuthStore()
  const { isCollapsed } = useSidebarStore()

  React.useEffect(() => {
    // Wait for hydration to complete before checking auth
    if (!_hasHydrated) return

    // Redirect to login if not authenticated
    if (!isAuthenticated) {
      router.replace('/login')
    }
  }, [isAuthenticated, _hasHydrated, router])

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
      <VendorSidebar />

      {/* Header */}
      <VendorHeader />

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
