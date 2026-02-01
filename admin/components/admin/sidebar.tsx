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
  FolderTree,
  DollarSign,
  FileImage,
  MessageSquare,
  Settings,
  Activity,
  Shield,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Bell,
  AlertTriangle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useSidebarStore, useNotificationStore, useMessagesStore } from '@/store'

interface NavItem {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: number | string
  badgeVariant?: 'default' | 'destructive' | 'warning' | 'success'
}

interface NavSection {
  title: string
  items: NavItem[]
}

const navigation: NavSection[] = [
  {
    title: 'Overview',
    items: [
      { title: 'Dashboard', href: '/', icon: LayoutDashboard },
      { title: 'Analytics', href: '/analytics', icon: Activity },
    ],
  },
  {
    title: 'Management',
    items: [
      { title: 'Users', href: '/users', icon: Users },
      { title: 'Vendors', href: '/vendors', icon: Store },
      { title: 'Products', href: '/products', icon: Package },
      { title: 'Orders', href: '/orders', icon: ShoppingCart },
      { title: 'Reviews', href: '/reviews', icon: Star },
      { title: 'Categories', href: '/categories', icon: FolderTree },
    ],
  },
  {
    title: 'Finance',
    items: [
      { title: 'Revenue', href: '/finance', icon: DollarSign },
    ],
  },
  {
    title: 'Content',
    items: [
      { title: 'Banners & Promos', href: '/content', icon: FileImage },
    ],
  },
  {
    title: 'Support',
    items: [
      { title: 'Customer Support', href: '/support', icon: MessageSquare },
      { title: 'Notifications', href: '/notifications', icon: Bell },
    ],
  },
  {
    title: 'System',
    items: [
      { title: 'Settings', href: '/settings', icon: Settings },
      { title: 'Audit Logs', href: '/system/logs', icon: Shield },
      { title: 'System Health', href: '/system/health', icon: Activity },
    ],
  },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const { isCollapsed, toggleCollapsed } = useSidebarStore()
  const { unreadCount } = useNotificationStore()
  const { unreadMessagesCount } = useMessagesStore()

  // Create navigation with dynamic badges for notifications and support
  const navigationWithBadges = navigation.map((section) => ({
    ...section,
    items: section.items.map((item) => {
      if (item.href === '/notifications' && unreadCount > 0) {
        return { ...item, badge: unreadCount, badgeVariant: 'destructive' as const }
      }
      if (item.href === '/support' && unreadMessagesCount > 0) {
        return { ...item, badge: unreadMessagesCount, badgeVariant: 'destructive' as const }
      }
      return item
    }),
  }))

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          'fixed left-0 top-0 z-40 h-screen border-r bg-sidebar transition-all duration-300',
          isCollapsed ? 'w-[70px]' : 'w-[260px]'
        )}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
            {!isCollapsed && (
              <Link href="/" className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-sm">C</span>
                </div>
                <span className="font-display font-bold text-lg">Admin</span>
              </Link>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleCollapsed}
              className={cn('h-8 w-8', isCollapsed && 'mx-auto')}
            >
              {isCollapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* AI Assistant Quick Access */}
          {!isCollapsed && (
            <div className="p-4">
              <Link href="/ai-assistant">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-gradient-premium-light border border-primary/20 hover:border-primary/40 transition-colors cursor-pointer">
                  <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
                    <Sparkles className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">AI Assistant</p>
                    <p className="text-xs text-muted-foreground">Ask anything</p>
                  </div>
                </div>
              </Link>
            </div>
          )}

          {isCollapsed && (
            <div className="p-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link href="/ai-assistant">
                    <Button variant="ghost" size="icon" className="w-full h-10">
                      <Sparkles className="h-5 w-5 text-primary" />
                    </Button>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right">AI Assistant</TooltipContent>
              </Tooltip>
            </div>
          )}

          {/* Navigation */}
          <ScrollArea className="flex-1 px-2">
            <nav className="space-y-6 py-4">
              {navigationWithBadges.map((section) => (
                <div key={section.title}>
                  {!isCollapsed && (
                    <h4 className="px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      {section.title}
                    </h4>
                  )}
                  <div className="space-y-1">
                    {section.items.map((item) => {
                      const isActive =
                        pathname === item.href ||
                        (item.href !== '/' && pathname.startsWith(item.href))

                      if (isCollapsed) {
                        return (
                          <Tooltip key={item.href}>
                            <TooltipTrigger asChild>
                              <Link href={item.href}>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className={cn(
                                    'w-full h-10 relative',
                                    isActive &&
                                      'bg-sidebar-accent text-sidebar-primary'
                                  )}
                                >
                                  <item.icon className="h-5 w-5" />
                                  {item.badge && (
                                    <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-destructive" />
                                  )}
                                </Button>
                              </Link>
                            </TooltipTrigger>
                            <TooltipContent side="right">
                              {item.title}
                              {item.badge && ` (${item.badge})`}
                            </TooltipContent>
                          </Tooltip>
                        )
                      }

                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={cn(
                            'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                            isActive
                              ? 'bg-sidebar-accent text-sidebar-primary font-medium'
                              : 'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50'
                          )}
                        >
                          <item.icon className="h-5 w-5 shrink-0" />
                          <span className="flex-1">{item.title}</span>
                          {item.badge && (
                            <Badge
                              variant={item.badgeVariant || 'default'}
                              className="h-5 text-xs"
                            >
                              {item.badge}
                            </Badge>
                          )}
                        </Link>
                      )
                    })}
                  </div>
                </div>
              ))}
            </nav>
          </ScrollArea>

          {/* Alerts Section - populated dynamically */}

          {/* Footer */}
          <div className="border-t border-sidebar-border p-4">
            {!isCollapsed ? (
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <div className="h-2 w-2 rounded-full bg-success pulse-dot" />
                <span>System Online</span>
              </div>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex justify-center">
                    <div className="h-2 w-2 rounded-full bg-success pulse-dot" />
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right">System Online</TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>
      </aside>
    </TooltipProvider>
  )
}
