'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Wallet,
  Settings,
  BarChart3,
  Store,
  LogOut,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'

interface VendorInfo {
  business_name: string
  slug?: string
  status: string
  logo?: string
}

interface VendorSidebarProps {
  vendor?: VendorInfo | null
  pendingOrders?: number
}

const vendorLinks = [
  {
    title: 'Dashboard',
    href: '/vendor/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Products',
    href: '/vendor/products',
    icon: Package,
  },
  {
    title: 'Orders',
    href: '/vendor/orders',
    icon: ShoppingCart,
    badge: true,
  },
  {
    title: 'Payouts',
    href: '/vendor/payouts',
    icon: Wallet,
  },
  {
    title: 'Analytics',
    href: '/vendor/analytics',
    icon: BarChart3,
  },
  {
    title: 'Store Settings',
    href: '/vendor/settings',
    icon: Settings,
  },
]

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  approved: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  suspended: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
}

export function VendorSidebar({ vendor, pendingOrders = 0 }: VendorSidebarProps) {
  const pathname = usePathname()
  const { logout } = useAuthStore()

  const handleLogout = () => {
    logout()
    window.location.href = '/'
  }

  return (
    <div className="bg-background rounded-lg border p-4 h-fit">
      {/* Store Info */}
      <div className="mb-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Store className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold truncate text-sm">
              {vendor?.business_name || 'Your Store'}
            </h3>
            {vendor?.status && (
              <Badge
                variant="secondary"
                className={cn('text-xs capitalize', statusColors[vendor.status])}
              >
                {vendor.status}
              </Badge>
            )}
          </div>
        </div>
      </div>

      <Separator className="mb-4" />

      {/* Navigation Links */}
      <nav className="space-y-1">
        {vendorLinks.map((link) => {
          const isActive = pathname === link.href ||
            (link.href !== '/vendor/dashboard' && pathname.startsWith(link.href))
          const Icon = link.icon

          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              )}
            >
              <div className="flex items-center gap-3">
                <Icon className="h-4 w-4" />
                {link.title}
              </div>
              {link.badge && pendingOrders > 0 && (
                <Badge variant="destructive" className="h-5 px-1.5 text-xs">
                  {pendingOrders}
                </Badge>
              )}
            </Link>
          )
        })}
      </nav>

      <Separator className="my-4" />

      {/* View Store */}
      <Button variant="outline" size="sm" className="w-full mb-2" asChild>
        <Link href={`/vendor/${vendor?.slug || vendor?.business_name?.toLowerCase().replace(/\s+/g, '-') || 'store'}`} target="_blank">
          <Store className="mr-2 h-4 w-4" />
          View Store
        </Link>
      </Button>

      {/* Logout */}
      <Button
        variant="ghost"
        size="sm"
        className="w-full text-muted-foreground hover:text-destructive hover:bg-destructive/10"
        onClick={handleLogout}
      >
        <LogOut className="mr-2 h-4 w-4" />
        Sign Out
      </Button>
    </div>
  )
}
