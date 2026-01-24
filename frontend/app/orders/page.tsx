'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { useAuthStore } from '@/store'

export default function OrdersRedirectPage() {
  const router = useRouter()
  const { isAuthenticated, isLoading } = useAuthStore()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    // Wait for mount and auth state to be ready before redirecting
    if (mounted && !isLoading) {
      if (isAuthenticated) {
        router.replace('/account/orders')
      } else {
        router.replace('/login?redirect=/account/orders')
      }
    }
  }, [mounted, isAuthenticated, isLoading, router])

  // Show loading spinner while determining redirect
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  )
}
