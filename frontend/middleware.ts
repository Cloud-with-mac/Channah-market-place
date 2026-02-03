import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Frontend middleware for route protection
 * SECURITY: Server-side authentication check for protected routes
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Protected routes that require authentication
  const protectedRoutes = [
    '/account',
    '/orders',
    '/wishlist',
    '/checkout',
    '/chat',
    '/messages',
  ]

  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))

  if (!isProtectedRoute) {
    return NextResponse.next()
  }

  // Check for access_token cookie (HTTP-only cookie set by backend)
  const accessToken = request.cookies.get('access_token')

  // If no token, redirect to login
  if (!accessToken) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Token exists, allow access
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/account/:path*',
    '/orders/:path*',
    '/wishlist/:path*',
    '/checkout/:path*',
    '/chat/:path*',
    '/messages/:path*',
  ],
}
