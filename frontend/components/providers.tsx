'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from 'next-themes'
import { useState, useEffect } from 'react'
import Cookies from 'js-cookie'
import { useAuthStore } from '@/store'
import { authAPI } from '@/lib/api'

// Auth initializer component that validates tokens on startup (non-blocking)
function AuthInitializer({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, logout, login, setLoading } = useAuthStore()

  useEffect(() => {
    const initAuth = async () => {
      const accessToken = Cookies.get('access_token')
      const refreshToken = Cookies.get('refresh_token')

      // If localStorage says authenticated but no tokens exist, clear the stale state
      if (isAuthenticated && !accessToken && !refreshToken) {
        console.log('Auth state mismatch: clearing stale auth data')
        logout()
        return
      }

      // If we have a token, validate it in the background
      if (accessToken) {
        try {
          const response = await authAPI.getCurrentUser()
          // Update user data with fresh info from server
          login(response, accessToken, refreshToken || undefined)
        } catch (error: any) {
          // Only logout if it's a clear auth failure (401), not a network error
          if (error?.response?.status === 401) {
            console.log('Token invalid, logging out')
            logout()
          } else {
            // Network error - keep existing auth state, user can retry
            console.log('Auth validation failed (network):', error.message)
            setLoading(false)
          }
        }
      } else {
        // No token, ensure we're logged out
        if (isAuthenticated) {
          logout()
        }
        setLoading(false)
      }
    }

    initAuth()
  }, []) // Only run once on mount

  // Render children immediately - auth updates in background
  return <>{children}</>
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <AuthInitializer>{children}</AuthInitializer>
      </ThemeProvider>
    </QueryClientProvider>
  )
}
