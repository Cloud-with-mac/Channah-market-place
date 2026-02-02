'use client'

import * as React from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  DollarSign,
  ShoppingCart,
  Users,
  Store,
  TrendingUp,
  TrendingDown,
  Package,
  RefreshCw,
  Loader2,
  BarChart3,
  Calendar,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { analyticsAPI, dashboardAPI } from '@/lib/api'
import { formatPrice } from '@/lib/utils'

interface AnalyticsOverview {
  today_revenue: number
  week_revenue: number
  month_revenue: number
  total_revenue: number
  today_orders: number
  week_orders: number
  month_orders: number
  total_orders: number
  new_users_today: number
  new_users_week: number
  new_users_month: number
  total_users: number
  pending_vendors: number
  active_vendors: number
}

interface SalesDataPoint {
  date: string
  revenue: number
  orders: number
}

interface TopProduct {
  id: string
  name: string
  sales: number
  revenue: number
}

interface TopVendor {
  id: string
  name: string
  sales: number
  rating: number
}

export default function AnalyticsPage() {
  const [overview, setOverview] = React.useState<AnalyticsOverview | null>(null)
  const [salesData, setSalesData] = React.useState<SalesDataPoint[]>([])
  const [topProducts, setTopProducts] = React.useState<TopProduct[]>([])
  const [topVendors, setTopVendors] = React.useState<TopVendor[]>([])
  const [chartDays, setChartDays] = React.useState('7')
  const [isLoading, setIsLoading] = React.useState(true)
  const [isChartLoading, setIsChartLoading] = React.useState(false)

  const fetchAll = React.useCallback(async () => {
    setIsLoading(true)
    try {
      const [overviewData, chartData, productsData, vendorsData] = await Promise.allSettled([
        analyticsAPI.getOverview(),
        analyticsAPI.getSalesChart(parseInt(chartDays)),
        dashboardAPI.getTopProducts(10),
        dashboardAPI.getTopVendors(10),
      ])

      if (overviewData.status === 'fulfilled') setOverview(overviewData.value)
      if (chartData.status === 'fulfilled') setSalesData(chartData.value)
      if (productsData.status === 'fulfilled') setTopProducts(productsData.value)
      if (vendorsData.status === 'fulfilled') setTopVendors(vendorsData.value)
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
    } finally {
      setIsLoading(false)
    }
  }, [chartDays])

  React.useEffect(() => {
    fetchAll()
  }, [fetchAll])

  const handleChartDaysChange = async (days: string) => {
    setChartDays(days)
    setIsChartLoading(true)
    try {
      const data = await analyticsAPI.getSalesChart(parseInt(days))
      setSalesData(data)
    } catch (error) {
      console.error('Failed to fetch chart data:', error)
    } finally {
      setIsChartLoading(false)
    }
  }

  // Find max revenue for chart scaling
  const maxRevenue = Math.max(...salesData.map((d) => d.revenue), 1)
  const maxOrders = Math.max(...salesData.map((d) => d.orders), 1)

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-80" />
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Button variant="ghost" size="sm" asChild className="mb-2">
            <Link href="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>
          <h1 className="text-3xl font-bold font-display">Analytics Overview</h1>
          <p className="text-muted-foreground mt-1">
            Comprehensive revenue, orders, and marketplace performance metrics
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchAll}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Revenue Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Today&apos;s Revenue</p>
                <p className="text-2xl font-bold mt-1">
                  {formatPrice(overview?.today_revenue || 0, 'USD')}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {overview?.today_orders || 0} orders
                </p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">This Week</p>
                <p className="text-2xl font-bold mt-1">
                  {formatPrice(overview?.week_revenue || 0, 'USD')}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {overview?.week_orders || 0} orders
                </p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">This Month</p>
                <p className="text-2xl font-bold mt-1">
                  {formatPrice(overview?.month_revenue || 0, 'USD')}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {overview?.month_orders || 0} orders
                </p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold mt-1">
                  {formatPrice(overview?.total_revenue || 0, 'USD')}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {overview?.total_orders || 0} total orders
                </p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <ShoppingCart className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{overview?.new_users_today || 0}</p>
                <p className="text-sm text-muted-foreground">New Users Today</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{overview?.new_users_month || 0}</p>
                <p className="text-sm text-muted-foreground">New Users This Month</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <Store className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{overview?.active_vendors || 0}</p>
                <p className="text-sm text-muted-foreground">Active Vendors</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                <Store className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{overview?.pending_vendors || 0}</p>
                <p className="text-sm text-muted-foreground">Pending Vendors</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sales Chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Sales Chart
              </CardTitle>
              <CardDescription>Daily revenue and order count</CardDescription>
            </div>
            <Select value={chartDays} onValueChange={handleChartDaysChange}>
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="14">Last 14 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="60">Last 60 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isChartLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : salesData.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
              <BarChart3 className="h-12 w-12 mb-4 opacity-50" />
              <p>No sales data available</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Revenue Bar Chart */}
              <div className="flex items-end gap-1 h-48">
                {salesData.map((point, idx) => {
                  const heightPercent = maxRevenue > 0 ? (point.revenue / maxRevenue) * 100 : 0
                  return (
                    <div
                      key={point.date}
                      className="flex-1 flex flex-col items-center group relative"
                    >
                      {/* Tooltip */}
                      <div className="absolute bottom-full mb-2 hidden group-hover:block z-10 bg-popover border rounded-md shadow-md p-2 text-xs whitespace-nowrap">
                        <p className="font-medium">{new Date(point.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</p>
                        <p className="text-muted-foreground">Revenue: {formatPrice(point.revenue, 'USD')}</p>
                        <p className="text-muted-foreground">Orders: {point.orders}</p>
                      </div>
                      {/* Bar */}
                      <div
                        className="w-full rounded-t-sm bg-primary/80 hover:bg-primary transition-colors cursor-pointer min-h-[2px]"
                        style={{ height: `${Math.max(heightPercent, 1)}%` }}
                      />
                    </div>
                  )
                })}
              </div>
              {/* X-axis labels */}
              <div className="flex gap-1">
                {salesData.map((point, idx) => {
                  // Only show some labels to avoid crowding
                  const showLabel = salesData.length <= 14 || idx % Math.ceil(salesData.length / 10) === 0
                  return (
                    <div key={point.date} className="flex-1 text-center">
                      {showLabel && (
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
              {/* Summary row */}
              <div className="flex items-center justify-between pt-4 border-t text-sm">
                <div className="flex items-center gap-6">
                  <div>
                    <span className="text-muted-foreground">Total Revenue: </span>
                    <span className="font-semibold">
                      {formatPrice(salesData.reduce((sum, d) => sum + d.revenue, 0), 'USD')}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Total Orders: </span>
                    <span className="font-semibold">
                      {salesData.reduce((sum, d) => sum + d.orders, 0)}
                    </span>
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">Avg Daily Revenue: </span>
                  <span className="font-semibold">
                    {formatPrice(
                      salesData.reduce((sum, d) => sum + d.revenue, 0) / (salesData.length || 1),
                      'USD'
                    )}
                  </span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top Products & Top Vendors */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Selling Products */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Top Selling Products
            </CardTitle>
            <CardDescription>Products with the most sales</CardDescription>
          </CardHeader>
          <CardContent>
            {topProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <Package className="h-10 w-10 mb-3 opacity-50" />
                <p className="text-sm">No product data yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {topProducts.slice(0, 10).map((product, index) => (
                  <div key={product.id} className="flex items-center gap-4">
                    <div className="flex items-center justify-center h-8 w-8 rounded-full bg-muted text-sm font-bold">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{product.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {product.sales} sales
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-sm">
                        {formatPrice(product.revenue, 'USD')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Vendors */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="h-5 w-5" />
              Top Vendors
            </CardTitle>
            <CardDescription>Vendors with the highest sales</CardDescription>
          </CardHeader>
          <CardContent>
            {topVendors.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <Store className="h-10 w-10 mb-3 opacity-50" />
                <p className="text-sm">No vendor data yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {topVendors.slice(0, 10).map((vendor, index) => (
                  <div key={vendor.id} className="flex items-center gap-4">
                    <div className="flex items-center justify-center h-8 w-8 rounded-full bg-muted text-sm font-bold">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{vendor.name}</p>
                      {vendor.rating > 0 && (
                        <p className="text-xs text-muted-foreground">
                          Rating: {vendor.rating.toFixed(1)} / 5
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-sm">
                        {formatPrice(vendor.sales, 'USD')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Order Count Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Order Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-4">
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <p className="text-3xl font-bold">{overview?.today_orders || 0}</p>
              <p className="text-sm text-muted-foreground mt-1">Today</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <p className="text-3xl font-bold">{overview?.week_orders || 0}</p>
              <p className="text-sm text-muted-foreground mt-1">This Week</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <p className="text-3xl font-bold">{overview?.month_orders || 0}</p>
              <p className="text-sm text-muted-foreground mt-1">This Month</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <p className="text-3xl font-bold">{overview?.total_orders || 0}</p>
              <p className="text-sm text-muted-foreground mt-1">All Time</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Growth */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            User Growth
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-4">
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <p className="text-3xl font-bold">{overview?.new_users_today || 0}</p>
              <p className="text-sm text-muted-foreground mt-1">New Today</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <p className="text-3xl font-bold">{overview?.new_users_week || 0}</p>
              <p className="text-sm text-muted-foreground mt-1">New This Week</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <p className="text-3xl font-bold">{overview?.new_users_month || 0}</p>
              <p className="text-sm text-muted-foreground mt-1">New This Month</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <p className="text-3xl font-bold">{overview?.total_users || 0}</p>
              <p className="text-sm text-muted-foreground mt-1">Total Users</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
