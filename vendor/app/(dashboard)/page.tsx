'use client'

import * as React from 'react'
import Link from 'next/link'
import { Plus, RefreshCw, Store, AlertCircle, Timer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { DashboardStats } from '@/components/vendor/dashboard-stats'
import { RevenueChart } from '@/components/vendor/revenue-chart'
import { AIInsights } from '@/components/vendor/ai-insights'
import { RecentOrders } from '@/components/vendor/recent-orders'
import { TopProducts } from '@/components/vendor/top-products'
import { QuickActions } from '@/components/vendor/quick-actions'
import { vendorDashboardAPI, vendorOrdersAPI, vendorProductsAPI } from '@/lib/api'
import { useCurrencyStore } from '@/store'

interface DashboardStats {
  total_products: number
  active_products: number
  total_orders: number
  pending_orders: number
  total_revenue: number
  this_month_revenue: number
  last_month_revenue: number
  pending_balance: number
  average_rating: number
  total_reviews: number
  total_customers: number
  low_stock_count: number
}

interface RevenueDataPoint {
  date: string
  revenue: number
  orders: number
}

// Generate fallback revenue data for chart when API fails or returns empty
function generateFallbackRevenueData(days: number): RevenueDataPoint[] {
  const data: RevenueDataPoint[] = []
  const today = new Date()

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    data.push({
      date: date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
      revenue: 0,
      orders: 0,
    })
  }

  return data
}

export default function VendorDashboardPage() {
  const { convertAndFormat } = useCurrencyStore()
  const [stats, setStats] = React.useState<DashboardStats | null>(null)
  const [recentOrders, setRecentOrders] = React.useState<any[]>([])
  const [topProducts, setTopProducts] = React.useState<any[]>([])
  const [revenueData, setRevenueData] = React.useState<RevenueDataPoint[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [isRefreshing, setIsRefreshing] = React.useState(false)
  const [greeting, setGreeting] = React.useState('')
  const [connectionError, setConnectionError] = React.useState<string | null>(null)
  const [autoRefresh, setAutoRefresh] = React.useState(false)
  const [lastUpdated, setLastUpdated] = React.useState<Date | null>(null)

  React.useEffect(() => {
    // Set greeting based on time of day
    const hour = new Date().getHours()
    if (hour < 12) setGreeting('Good morning')
    else if (hour < 17) setGreeting('Good afternoon')
    else setGreeting('Good evening')
  }, [])

  const fetchDashboardData = React.useCallback(async () => {
    setConnectionError(null)
    try {
      const [statsResponse, ordersResponse, productsResponse, revenueResponse] = await Promise.allSettled([
        vendorDashboardAPI.getStats(),
        vendorOrdersAPI.list({ limit: 5 }),
        vendorProductsAPI.list({ limit: 5, ordering: '-sales_count' }),
        vendorDashboardAPI.getRevenueChart(90),
      ])

      // Check if all requests failed (likely server not running)
      const allFailed = [statsResponse, ordersResponse, productsResponse, revenueResponse].every(
        r => r.status === 'rejected'
      )
      if (allFailed) {
        const error = statsResponse.status === 'rejected' ? statsResponse.reason : null
        if (error?.code === 'ECONNABORTED' || error?.message?.includes('timeout')) {
          setConnectionError('Connection timed out. Please make sure the backend server is running on port 8000.')
        } else if (error?.code === 'ERR_NETWORK' || error?.message?.includes('Network Error')) {
          setConnectionError('Cannot connect to the server. Please start the backend: cd backend && uvicorn app.main:app --reload')
        } else {
          setConnectionError('Failed to load dashboard data. Please check that the backend server is running and you are logged in as a vendor.')
        }
      }

      // Stats
      if (statsResponse.status === 'fulfilled') {
        const apiStats = statsResponse.value?.data || statsResponse.value || {}
        setStats({
          total_products: apiStats.total_products || 0,
          active_products: apiStats.active_products || 0,
          total_orders: apiStats.total_orders || 0,
          pending_orders: apiStats.pending_orders || 0,
          total_revenue: apiStats.total_revenue || 0,
          this_month_revenue: apiStats.this_month_revenue || 0,
          last_month_revenue: apiStats.last_month_revenue || 0,
          pending_balance: apiStats.pending_balance || 0,
          average_rating: apiStats.average_rating || 0,
          total_reviews: apiStats.total_reviews || 0,
          total_customers: apiStats.total_customers || 0,
          low_stock_count: apiStats.low_stock_count || 0,
        })
      } else {
        setStats({
          total_products: 0,
          active_products: 0,
          total_orders: 0,
          pending_orders: 0,
          total_revenue: 0,
          this_month_revenue: 0,
          last_month_revenue: 0,
          pending_balance: 0,
          average_rating: 0,
          total_reviews: 0,
          total_customers: 0,
          low_stock_count: 0,
        })
      }

      // Recent orders
      if (ordersResponse.status === 'fulfilled' && ordersResponse.value) {
        const responseData = ordersResponse.value
        const ordersData = responseData?.items || responseData?.results || (Array.isArray(responseData) ? responseData : [])
        setRecentOrders(Array.isArray(ordersData) ? ordersData : [])
      } else {
        setRecentOrders([])
      }

      // Top products
      if (productsResponse.status === 'fulfilled' && productsResponse.value) {
        const responseData = productsResponse.value
        const productsData = responseData?.items || responseData?.results || (Array.isArray(responseData) ? responseData : [])
        setTopProducts(Array.isArray(productsData) ? productsData : [])
      } else {
        setTopProducts([])
      }

      // Revenue chart data
      const revData = revenueResponse.status === 'fulfilled' ? (revenueResponse.value?.data || revenueResponse.value) : null
      if (revData && Array.isArray(revData) && revData.length > 0) {
        setRevenueData(revData)
      } else {
        setRevenueData(generateFallbackRevenueData(90))
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
      // Set default stats if API fails
      setStats({
        total_products: 0,
        active_products: 0,
        total_orders: 0,
        pending_orders: 0,
        total_revenue: 0,
        this_month_revenue: 0,
        last_month_revenue: 0,
        pending_balance: 0,
        average_rating: 0,
        total_reviews: 0,
        total_customers: 0,
        low_stock_count: 0,
      })
      setRevenueData(generateFallbackRevenueData(90))
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
      setLastUpdated(new Date())
    }
  }, [])

  React.useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  React.useEffect(() => {
    if (!autoRefresh) return
    const interval = setInterval(fetchDashboardData, 30000)
    return () => clearInterval(interval)
  }, [autoRefresh, fetchDashboardData])

  const handleRefresh = () => {
    setIsRefreshing(true)
    fetchDashboardData()
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>

        {/* Stats Skeleton */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>

        {/* Chart Skeleton */}
        <Skeleton className="h-[450px] rounded-xl" />

        {/* Content Skeleton */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-80 rounded-xl" />
          <Skeleton className="h-80 rounded-xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Store className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold font-display">{greeting}!</h1>
          </div>
          <p className="text-muted-foreground mt-1">
            Here&apos;s what&apos;s happening with your store today.
          </p>
          {lastUpdated && (
            <p className="text-xs text-muted-foreground mt-1">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={autoRefresh ? "default" : "outline"}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <Timer className="h-4 w-4 mr-2" />
            {autoRefresh ? 'Auto-refresh On' : 'Auto-refresh Off'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button asChild>
            <Link href="/products/new">
              <Plus className="mr-2 h-4 w-4" />
              Add Product
            </Link>
          </Button>
        </div>
      </div>

      {/* Connection Error Alert */}
      {connectionError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Connection Error</AlertTitle>
          <AlertDescription className="mt-2">
            <p>{connectionError}</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={handleRefresh}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      {stats && (
        <DashboardStats stats={stats} formatPrice={convertAndFormat} />
      )}

      {/* Revenue Chart */}
      <RevenueChart data={revenueData} formatPrice={convertAndFormat} />

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - 2/3 width */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recent Orders */}
          <RecentOrders orders={recentOrders} formatPrice={convertAndFormat} />

          {/* Top Products */}
          <TopProducts products={topProducts} formatPrice={convertAndFormat} />
        </div>

        {/* Right Column - 1/3 width */}
        <div className="space-y-6">
          {/* AI Insights */}
          {stats && (
            <AIInsights stats={stats} recentOrders={recentOrders} />
          )}

          {/* Quick Actions */}
          <QuickActions
            pendingOrders={stats?.pending_orders}
            lowStockCount={stats?.low_stock_count}
          />
        </div>
      </div>
    </div>
  )
}
