'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  Store,
  Package,
  ShoppingCart,
  Star,
  Settings,
  BarChart3,
  Shield,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'

const sidebarLinks = [
  {
    title: 'Dashboard',
    href: '/admin',
    icon: LayoutDashboard,
  },
  {
    title: 'Users',
    href: '/admin/users',
    icon: Users,
  },
  {
    title: 'Vendors',
    href: '/admin/vendors',
    icon: Store,
  },
  {
    title: 'Products',
    href: '/admin/products',
    icon: Package,
  },
  {
    title: 'Orders',
    href: '/admin/orders',
    icon: ShoppingCart,
  },
  {
    title: 'Reviews',
    href: '/admin/reviews',
    icon: Star,
  },
  {
    title: 'Analytics',
    href: '/admin/analytics',
    icon: BarChart3,
  },
  {
    title: 'Settings',
    href: '/admin/settings',
    icon: Settings,
  },
]

export function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-card border-r">
      {/* Header */}
      <div className="flex items-center gap-2 h-16 px-6 border-b">
        <Shield className="h-6 w-6 text-primary" />
        <span className="font-bold text-lg font-display">Admin Panel</span>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 py-4">
        <nav className="px-3 space-y-1">
          {sidebarLinks.map((link) => {
            const isActive = pathname === link.href ||
              (link.href !== '/admin' && pathname?.startsWith(link.href))
            const Icon = link.icon

            return (
              <Button
                key={link.href}
                variant={isActive ? 'secondary' : 'ghost'}
                className={cn(
                  'w-full justify-start',
                  isActive && 'bg-primary/10 text-primary hover:bg-primary/20'
                )}
                asChild
              >
                <Link href={link.href}>
                  <Icon className="mr-3 h-4 w-4" />
                  {link.title}
                </Link>
              </Button>
            )
          })}
        </nav>
      </ScrollArea>

      {/* Footer */}
      <div className="p-4 border-t">
        <Button variant="outline" className="w-full" asChild>
          <Link href="/">
            Back to Store
          </Link>
        </Button>
      </div>
    </aside>
  )
}
