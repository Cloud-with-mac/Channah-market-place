'use client'

import Link from 'next/link'
import {
  Plus,
  Package,
  ShoppingCart,
  DollarSign,
  BarChart3,
  Settings,
  Sparkles,
  FileText,
  Users,
  Bell,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface QuickAction {
  title: string
  description: string
  icon: React.ElementType
  href: string
  color: string
  badge?: number
  highlight?: boolean
}

interface QuickActionsProps {
  pendingOrders?: number
  lowStockCount?: number
}

export function QuickActions({ pendingOrders = 0, lowStockCount = 0 }: QuickActionsProps) {
  const actions: QuickAction[] = [
    {
      title: 'Add Product',
      description: 'List a new item',
      icon: Plus,
      href: '/vendor/products/new',
      color: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400',
      highlight: true,
    },
    {
      title: 'Pending Orders',
      description: 'Process orders',
      icon: ShoppingCart,
      href: '/vendor/orders?status=pending',
      color: 'bg-amber-100 text-amber-600 dark:bg-amber-900/50 dark:text-amber-400',
      badge: pendingOrders,
    },
    {
      title: 'Products',
      description: 'Manage inventory',
      icon: Package,
      href: '/vendor/products',
      color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400',
      badge: lowStockCount > 0 ? lowStockCount : undefined,
    },
    {
      title: 'AI Writer',
      description: 'Generate descriptions',
      icon: Sparkles,
      href: '/vendor/products/new?ai=true',
      color: 'bg-purple-100 text-purple-600 dark:bg-purple-900/50 dark:text-purple-400',
    },
    {
      title: 'Request Payout',
      description: 'Withdraw earnings',
      icon: DollarSign,
      href: '/vendor/payouts',
      color: 'bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-400',
    },
    {
      title: 'Analytics',
      description: 'View reports',
      icon: BarChart3,
      href: '/vendor/analytics',
      color: 'bg-cyan-100 text-cyan-600 dark:bg-cyan-900/50 dark:text-cyan-400',
    },
  ]

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {actions.map((action) => {
            const Icon = action.icon

            return (
              <Link
                key={action.title}
                href={action.href}
                className={cn(
                  "relative flex flex-col items-center p-4 rounded-xl border transition-all",
                  "hover:shadow-md hover:border-primary/30 hover:-translate-y-0.5",
                  action.highlight && "bg-primary/5 border-primary/20"
                )}
              >
                {action.badge !== undefined && action.badge > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-1.5 -right-1.5 h-5 min-w-5 px-1.5 text-[10px]"
                  >
                    {action.badge}
                  </Badge>
                )}
                <div className={cn("p-3 rounded-xl mb-2", action.color)}>
                  <Icon className="h-5 w-5" />
                </div>
                <span className="font-medium text-sm text-center">{action.title}</span>
                <span className="text-[10px] text-muted-foreground text-center mt-0.5">
                  {action.description}
                </span>
              </Link>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
