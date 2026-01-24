'use client'

import { DollarSign, ShoppingCart, Package, TrendingUp, Star, Users, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface StatCardProps {
  title: string
  value: string | number
  change?: number
  changeLabel?: string
  icon: React.ElementType
  iconColor: string
  iconBg: string
}

function StatCard({ title, value, change, changeLabel, icon: Icon, iconColor, iconBg }: StatCardProps) {
  const isPositive = change && change > 0
  const isNegative = change && change < 0

  return (
    <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-br from-card to-card/80">
      <div className="absolute top-0 right-0 w-32 h-32 transform translate-x-8 -translate-y-8">
        <div className={cn("w-full h-full rounded-full opacity-10", iconBg)} />
      </div>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold tracking-tight">{value}</p>
            {change !== undefined && (
              <div className="flex items-center gap-1">
                {isPositive && <ArrowUpRight className="h-4 w-4 text-green-500" />}
                {isNegative && <ArrowDownRight className="h-4 w-4 text-red-500" />}
                <span className={cn(
                  "text-sm font-medium",
                  isPositive && "text-green-500",
                  isNegative && "text-red-500",
                  !isPositive && !isNegative && "text-muted-foreground"
                )}>
                  {isPositive && '+'}{change}%
                </span>
                {changeLabel && (
                  <span className="text-xs text-muted-foreground ml-1">{changeLabel}</span>
                )}
              </div>
            )}
          </div>
          <div className={cn("p-3 rounded-xl", iconBg)}>
            <Icon className={cn("h-6 w-6", iconColor)} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

interface DashboardStatsProps {
  stats: {
    total_revenue: number
    this_month_revenue: number
    last_month_revenue: number
    total_orders: number
    pending_orders: number
    total_products: number
    active_products: number
    average_rating: number
    total_reviews: number
    total_customers: number
  }
  formatPrice: (price: number) => string
}

export function DashboardStats({ stats, formatPrice }: DashboardStatsProps) {
  const revenueChange = stats.last_month_revenue > 0
    ? Math.round(((stats.this_month_revenue - stats.last_month_revenue) / stats.last_month_revenue) * 100)
    : 0

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Total Revenue"
        value={formatPrice(stats.total_revenue)}
        change={revenueChange}
        changeLabel="vs last month"
        icon={DollarSign}
        iconColor="text-emerald-600 dark:text-emerald-400"
        iconBg="bg-emerald-100 dark:bg-emerald-900/50"
      />
      <StatCard
        title="Total Orders"
        value={stats.total_orders}
        icon={ShoppingCart}
        iconColor="text-blue-600 dark:text-blue-400"
        iconBg="bg-blue-100 dark:bg-blue-900/50"
      />
      <StatCard
        title="Active Products"
        value={stats.active_products}
        icon={Package}
        iconColor="text-purple-600 dark:text-purple-400"
        iconBg="bg-purple-100 dark:bg-purple-900/50"
      />
      <StatCard
        title="Store Rating"
        value={stats.average_rating.toFixed(1)}
        icon={Star}
        iconColor="text-amber-600 dark:text-amber-400"
        iconBg="bg-amber-100 dark:bg-amber-900/50"
      />
    </div>
  )
}
