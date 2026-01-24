'use client'

import * as React from 'react'
import Link from 'next/link'
import { Package, Heart, Star, MapPin, ArrowRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface StatCardProps {
  title: string
  value: string | number
  description?: string
  icon: React.ElementType
  href: string
  iconClassName?: string
}

function StatCard({ title, value, description, icon: Icon, href, iconClassName }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className={cn('p-2 rounded-full', iconClassName || 'bg-primary/10')}>
          <Icon className="h-4 w-4 text-primary" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
        <Button variant="link" asChild className="px-0 mt-2 h-auto">
          <Link href={href} className="text-sm">
            View all <ArrowRight className="ml-1 h-3 w-3" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}

interface DashboardStatsProps {
  stats: {
    totalOrders: number
    pendingOrders: number
    wishlistItems: number
    reviewsWritten: number
    savedAddresses: number
  }
}

export function DashboardStats({ stats }: DashboardStatsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Total Orders"
        value={stats.totalOrders}
        description={stats.pendingOrders > 0 ? `${stats.pendingOrders} pending` : 'All delivered'}
        icon={Package}
        href="/account/orders"
        iconClassName="bg-blue-100 dark:bg-blue-900/30"
      />
      <StatCard
        title="Wishlist Items"
        value={stats.wishlistItems}
        description="Products saved"
        icon={Heart}
        href="/account/wishlist"
        iconClassName="bg-pink-100 dark:bg-pink-900/30"
      />
      <StatCard
        title="Reviews Written"
        value={stats.reviewsWritten}
        description="Your feedback"
        icon={Star}
        href="/account/reviews"
        iconClassName="bg-yellow-100 dark:bg-yellow-900/30"
      />
      <StatCard
        title="Saved Addresses"
        value={stats.savedAddresses}
        description="Delivery locations"
        icon={MapPin}
        href="/account/addresses"
        iconClassName="bg-green-100 dark:bg-green-900/30"
      />
    </div>
  )
}
