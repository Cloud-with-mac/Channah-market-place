import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Admin middleware for route protection
 * SECURITY: Server-side authentication check before rendering
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Public routes that don't require authentication
  const publicRoutes = ['/login', '/forgot-password', '/reset-password']
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))

  if (isPublicRoute) {
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
  // Note: Token validation happens on API calls via backend
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all admin dashboard routes except:
     * - api routes
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*|login|forgot-password|reset-password).*)',
  ],
}
