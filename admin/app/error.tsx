'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle, Home, RefreshCw } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log error to error reporting service
    if (process.env.NODE_ENV === 'production') {
      // TODO: Integrate with Sentry or similar service
      console.error('Admin application error:', {
        message: error.message,
        digest: error.digest,
        stack: error.stack,
        timestamp: new Date().toISOString(),
      })
    } else {
      console.error('Admin error:', error)
    }
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background">
      <div className="max-w-2xl w-full">
        <div className="bg-card rounded-lg border p-8 shadow-lg">
          <div className="mb-6 flex justify-center">
            <div className="rounded-full bg-destructive/10 p-6">
              <AlertTriangle className="h-16 w-16 text-destructive" />
            </div>
          </div>

          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold mb-3">Admin Error</h1>
            <p className="text-muted-foreground text-lg">
              An unexpected error occurred in the admin dashboard.
            </p>
          </div>

          {process.env.NODE_ENV === 'development' && error.message && (
            <div className="mb-6 p-4 bg-destructive/5 rounded-lg border border-destructive/20">
              <p className="text-sm font-semibold mb-2">Error Details (Dev Only):</p>
              <p className="text-sm font-mono text-destructive break-all">
                {error.message}
              </p>
              {error.digest && (
                <p className="text-xs text-muted-foreground mt-2">
                  Digest: {error.digest}
                </p>
              )}
            </div>
          )}

          <div className="flex gap-3 justify-center">
            <Button onClick={() => reset()} variant="default" size="lg">
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
            <Button
              onClick={() => window.location.href = '/dashboard'}
              variant="outline"
              size="lg"
            >
              <Home className="mr-2 h-4 w-4" />
              Dashboard
            </Button>
          </div>

          <p className="text-center text-sm text-muted-foreground mt-6">
            If this problem persists, please contact technical support.
          </p>
        </div>
      </div>
    </div>
  )
}
