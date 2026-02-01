'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  BarChart3,
  Settings,
  Wallet,
  Star,
  Store,
  ChevronLeft,
  ChevronRight,
  LogOut,
  ExternalLink,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { useAuthStore, useSidebarStore } from '@/store'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Products', href: '/products', icon: Package },
  { name: 'Orders', href: '/orders', icon: ShoppingCart },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Payouts', href: '/payouts', icon: Wallet },
  { name: 'Reviews', href: '/reviews', icon: Star },
  { name: 'Store Profile', href: '/store-profile', icon: Store },
  { name: 'Settings', href: '/settings', icon: Settings },
]

export function VendorSidebar() {
  const pathname = usePathname()
  const { user, logout } = useAuthStore()
  const { isCollapsed, toggleCollapsed } = useSidebarStore()

  const handleLogout = () => {
    logout()
    window.location.href = '/login'
  }

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          'fixed left-0 top-0 z-40 h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300',
          isCollapsed ? 'w-[70px]' : 'w-[260px]'
        )}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center justify-between px-4 border-b border-sidebar-border">
            {!isCollapsed && (
              <Link href="/" className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-cyan flex items-center justify-center">
                  <Store className="h-5 w-5 text-primary-foreground" />
                </div>
                <div>
                  <span className="font-display font-bold text-lg">Channah</span>
                  <span className="text-xs text-muted-foreground block -mt-1">Vendor Portal</span>
                </div>
              </Link>
            )}
            {isCollapsed && (
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-cyan flex items-center justify-center mx-auto">
                <Store className="h-5 w-5 text-primary-foreground" />
              </div>
            )}
          </div>

          {/* Navigation */}
          <ScrollArea className="flex-1 py-4">
            <nav className="space-y-1 px-3">
              {navigation.map((item) => {
                const isActive = pathname === item.href ||
                  (item.href !== '/' && pathname.startsWith(item.href))

                const NavLink = (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      'sidebar-item',
                      isActive && 'active',
                      isCollapsed && 'justify-center px-2'
                    )}
                  >
                    <item.icon className={cn('h-5 w-5 shrink-0', isCollapsed && 'mx-auto')} />
                    {!isCollapsed && <span>{item.name}</span>}
                  </Link>
                )

                if (isCollapsed) {
                  return (
                    <Tooltip key={item.name}>
                      <TooltipTrigger asChild>{NavLink}</TooltipTrigger>
                      <TooltipContent side="right" className="font-medium">
                        {item.name}
                      </TooltipContent>
                    </Tooltip>
                  )
                }

                return NavLink
              })}
            </nav>

            <Separator className="my-4 mx-3" />

            {/* External Links */}
            <div className="px-3 space-y-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <a
                    href={process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      'sidebar-item text-muted-foreground hover:text-foreground',
                      isCollapsed && 'justify-center px-2'
                    )}
                  >
                    <ExternalLink className={cn('h-5 w-5 shrink-0', isCollapsed && 'mx-auto')} />
                    {!isCollapsed && <span>View Store</span>}
                  </a>
                </TooltipTrigger>
                {isCollapsed && (
                  <TooltipContent side="right" className="font-medium">
                    View Store
                  </TooltipContent>
                )}
              </Tooltip>
            </div>
          </ScrollArea>

          {/* Footer */}
          <div className="border-t border-sidebar-border p-3">
            {/* User info */}
            {!isCollapsed && user && (
              <div className="mb-3 px-2">
                <p className="font-medium text-sm truncate">
                  {user.vendor_profile?.business_name || `${user.first_name} ${user.last_name}`}
                </p>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              </div>
            )}

            <div className="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      'text-muted-foreground hover:text-foreground',
                      isCollapsed ? 'w-full justify-center' : 'flex-1'
                    )}
                    onClick={handleLogout}
                  >
                    <LogOut className="h-4 w-4" />
                    {!isCollapsed && <span className="ml-2">Logout</span>}
                  </Button>
                </TooltipTrigger>
                {isCollapsed && (
                  <TooltipContent side="right">Logout</TooltipContent>
                )}
              </Tooltip>

              {!isCollapsed && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground"
                  onClick={toggleCollapsed}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              )}
            </div>

            {isCollapsed && (
              <Button
                variant="ghost"
                size="icon"
                className="w-full mt-2 text-muted-foreground"
                onClick={toggleCollapsed}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </aside>
    </TooltipProvider>
  )
}
