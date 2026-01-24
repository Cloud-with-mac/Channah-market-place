'use client'

import { useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Loader2, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function VendorRedirectPage() {
  const params = useParams()
  const slug = params.slug as string[] | undefined

  // Map the path - the vendor app uses route groups so /dashboard is at root
  let path = ''
  if (slug) {
    const joinedPath = slug.join('/')
    // 'dashboard' maps to root since (dashboard) is a route group
    if (joinedPath === 'dashboard') {
      path = ''
    } else if (joinedPath.startsWith('dashboard/')) {
      // Remove 'dashboard/' prefix for nested routes
      path = '/' + joinedPath.replace('dashboard/', '')
    } else {
      path = '/' + joinedPath
    }
  }

  // Vendor dashboard URL - in production this would be configured
  const vendorDashboardUrl = process.env.NEXT_PUBLIC_VENDOR_URL || 'http://localhost:5000'
  const fullUrl = `${vendorDashboardUrl}${path}`

  useEffect(() => {
    // Auto-redirect after a short delay
    const timer = setTimeout(() => {
      window.location.href = fullUrl
    }, 2000)

    return () => clearTimeout(timer)
  }, [fullUrl])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-6 p-8 max-w-md">
        <div className="flex justify-center">
          <div className="p-4 rounded-full bg-primary/10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Redirecting to Vendor Portal</h1>
          <p className="text-muted-foreground">
            The Vendor Dashboard is a separate application. You will be redirected automatically.
          </p>
        </div>

        <div className="space-y-3">
          <Button asChild className="w-full">
            <a href={fullUrl}>
              <ExternalLink className="mr-2 h-4 w-4" />
              Go to Vendor Dashboard Now
            </a>
          </Button>

          <Button variant="outline" asChild className="w-full">
            <Link href="/">
              Return to Store
            </Link>
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          Vendor Portal: {vendorDashboardUrl}
        </p>
      </div>
    </div>
  )
}
