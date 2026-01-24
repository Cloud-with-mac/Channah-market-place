'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  User,
  Package,
  MapPin,
  Heart,
  Bell,
  LogOut,
  LayoutDashboard,
  Settings,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:8000'

const accountLinks = [
  {
    title: 'Dashboard',
    href: '/account',
    icon: LayoutDashboard,
  },
  {
    title: 'My Orders',
    href: '/account/orders',
    icon: Package,
  },
  {
    title: 'My Profile',
    href: '/account/profile',
    icon: User,
  },
  {
    title: 'Addresses',
    href: '/account/addresses',
    icon: MapPin,
  },
  {
    title: 'Wishlist',
    href: '/account/wishlist',
    icon: Heart,
  },
  {
    title: 'Notifications',
    href: '/account/notifications',
    icon: Bell,
  },
]

export function AccountSidebar() {
  const pathname = usePathname()
  const { user, logout } = useAuthStore()

  const getInitials = (firstName?: string, lastName?: string) => {
    const first = firstName?.charAt(0) || ''
    const last = lastName?.charAt(0) || ''
    return (first + last).toUpperCase() || 'U'
  }

  // Get full avatar URL (handle relative paths from backend)
  const getAvatarUrl = () => {
    const avatarUrl = user?.avatar_url || user?.avatar
    if (!avatarUrl) return undefined
    // If it's a relative path starting with /uploads, prepend API base URL
    if (avatarUrl.startsWith('/uploads')) {
      return `${API_BASE_URL}${avatarUrl}`
    }
    return avatarUrl
  }

  const handleLogout = () => {
    logout()
    window.location.href = '/'
  }

  return (
    <div className="bg-background rounded-lg border p-6">
      {/* User Info */}
      <div className="flex items-center gap-4 mb-6">
        <Avatar className="h-16 w-16">
          <AvatarImage src={getAvatarUrl()} alt={user?.first_name} />
          <AvatarFallback className="text-lg bg-primary/10 text-primary">
            {getInitials(user?.first_name, user?.last_name)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold truncate">
            {user?.first_name} {user?.last_name}
          </h3>
          <p className="text-sm text-muted-foreground truncate">
            {user?.email}
          </p>
        </div>
      </div>

      <Separator className="mb-6" />

      {/* Navigation Links */}
      <nav className="space-y-1">
        {accountLinks.map((link) => {
          const isActive = pathname === link.href ||
            (link.href !== '/account' && pathname.startsWith(link.href))
          const Icon = link.icon

          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              )}
            >
              <Icon className="h-4 w-4" />
              {link.title}
            </Link>
          )
        })}
      </nav>

      <Separator className="my-6" />

      {/* Logout Button */}
      <Button
        variant="ghost"
        className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10"
        onClick={handleLogout}
      >
        <LogOut className="mr-3 h-4 w-4" />
        Sign Out
      </Button>
    </div>
  )
}
