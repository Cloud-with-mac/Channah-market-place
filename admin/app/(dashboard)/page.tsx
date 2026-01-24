'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Users,
  Store,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Package,
  Star,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Sparkles,
  ExternalLink,
  Loader2,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { formatPrice, formatNumber, formatRelativeTime, getInitials } from '@/lib/utils'
import { RevenueChart } from '@/components/dashboard/revenue-chart'
import { AIInsightsPanel } from '@/components/dashboard/ai-insights-panel'
import { FraudAlerts } from '@/components/dashboard/fraud-alerts'
import { RecentActivity } from '@/components/dashboard/recent-activity'
import { dashboardAPI } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'

interface DashboardStats {
  total_users: number
  new_users_today: number
  total_vendors: number
  pending_vendors: number
  total_products: number
  active_products: number
  total_orders: number
  pending_orders: number
  total_revenue: number
  today_revenue: number
  total_reviews: number
}

interface KPICard {
  title: string
  value: string | number
  change: number
  changeLabel: string
  icon: React.ComponentType<{ className?: string }>
  trend: 'up' | 'down' | 'neutral'
  href?: string
}

interface Order {
  id: string
  order_number: string
  customer: string
  customer_avatar?: string
  total: number
  status: string
  created_at: string
}

interface Vendor {
  id: string
  name: string
  logo?: string
  rating: number
  orders: number
  sales: number
}

// Mock data for fallback
const mockOrders: Order[] = [
  { id: '1', order_number: 'ORD-2024-001', customer: 'John Smith', total: 245.00, status: 'pending', created_at: new Date().toISOString() },
  { id: '2', order_number: 'ORD-2024-002', customer: 'Sarah Johnson', total: 189.50, status: 'processing', created_at: new Date(Date.now() - 3600000).toISOString() },
  { id: '3', order_number: 'ORD-2024-003', customer: 'Mike Williams', total: 520.00, status: 'shipped', created_at: new Date(Date.now() - 7200000).toISOString() },
  { id: '4', order_number: 'ORD-2024-004', customer: 'Emily Brown', total: 89.99, status: 'delivered', created_at: new Date(Date.now() - 86400000).toISOString() },
  { id: '5', order_number: 'ORD-2024-005', customer: 'David Lee', total: 340.00, status: 'pending', created_at: new Date(Date.now() - 172800000).toISOString() },
]

const mockVendors: Vendor[] = [
  { id: '1', name: 'TechGadgets Pro', rating: 4.9, orders: 234, sales: 45600 },
  { id: '2', name: 'Fashion Hub', rating: 4.7, orders: 189, sales: 32400 },
  { id: '3', name: 'Home & Living', rating: 4.8, orders: 156, sales: 28900 },
  { id: '4', name: 'Sports Unlimited', rating: 4.6, orders: 134, sales: 24500 },
  { id: '5', name: 'Beauty Corner', rating: 4.5, orders: 98, sales: 18700 },
]

function getStatusColor(status: string) {
  switch (status) {
    case 'pending':
      return 'warning'
    case 'processing':
      return 'info'
    case 'shipped':
      return 'info'
    case 'delivered':
      return 'success'
    case 'cancelled':
      return 'destructive'
    default:
      return 'secondary'
  }
}

export default function DashboardPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = React.useState(true)
  const [isRefreshing, setIsRefreshing] = React.useState(false)
  const [stats, setStats] = React.useState<DashboardStats | null>(null)
  const [recentOrders, setRecentOrders] = React.useState<Order[]>([])
  const [topVendors, setTopVendors] = React.useState<Vendor[]>([])
  const [lastUpdated, setLastUpdated] = React.useState<Date | null>(null)

  const fetchDashboardData = React.useCallback(async () => {
    try {
      const [statsRes, ordersRes, vendorsRes] = await Promise.allSettled([
        dashboardAPI.getKPIs(),
        dashboardAPI.getRecentOrders(),
        dashboardAPI.getTopVendors(),
      ])

      if (statsRes.status === 'fulfilled') {
        setStats(statsRes.value.data)
      }
      if (ordersRes.status === 'fulfilled' && ordersRes.value.data?.length > 0) {
        setRecentOrders(ordersRes.value.data)
      } else {
        setRecentOrders(mockOrders) // Fallback to mock data
      }
      if (vendorsRes.status === 'fulfilled' && vendorsRes.value.data?.length > 0) {
        setTopVendors(vendorsRes.value.data)
      } else {
        setTopVendors(mockVendors) // Fallback to mock data
      }
      setLastUpdated(new Date())
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
      // Use mock data on error
      setRecentOrders(mockOrders)
      setTopVendors(mockVendors)
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [])

  React.useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await fetchDashboardData()
    toast({
      title: 'Dashboard Refreshed',
      description: 'All data has been updated.',
    })
  }

  const handleAIInsights = () => {
    router.push('/ai-assistant')
  }

  // Build KPI data from stats
  const kpiData: KPICard[] = stats ? [
    {
      title: 'Total Revenue',
      value: formatPrice(stats.total_revenue, 'USD'),
      change: 0,
      changeLabel: 'all time',
      icon: DollarSign,
      trend: 'up' as const,
      href: '/finance',
    },
    {
      title: 'Total Orders',
      value: formatNumber(stats.total_orders),
      change: stats.pending_orders,
      changeLabel: 'pending',
      icon: ShoppingCart,
      trend: 'up' as const,
      href: '/orders',
    },
    {
      title: 'Active Users',
      value: formatNumber(stats.total_users),
      change: stats.new_users_today,
      changeLabel: 'new today',
      icon: Users,
      trend: 'up' as const,
      href: '/users',
    },
    {
      title: 'Active Vendors',
      value: formatNumber(stats.total_vendors),
      change: stats.pending_vendors,
      changeLabel: 'pending',
      icon: Store,
      trend: stats.pending_vendors > 0 ? 'up' as const : 'neutral' as const,
      href: '/vendors',
    },
  ] : []

  // Build pending items from stats
  const pendingItems = stats ? [
    { title: 'Vendor Applications', count: stats.pending_vendors, href: '/vendors?status=pending', icon: Store },
    { title: 'Pending Products', count: stats.total_products - stats.active_products, href: '/products?status=pending', icon: Package },
    { title: 'Pending Orders', count: stats.pending_orders, href: '/orders?status=pending', icon: ShoppingCart },
    { title: 'Pending Reviews', count: stats.total_reviews, href: '/reviews', icon: Star },
  ] : []

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <div className="flex gap-2">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-28" />
          </div>
        </div>
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-[400px] lg:col-span-2 rounded-xl" />
          <Skeleton className="h-[400px] rounded-xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here&apos;s what&apos;s happening with your marketplace.
          </p>
          {lastUpdated && (
            <p className="text-xs text-muted-foreground mt-1">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Refresh
          </Button>
          <Button size="sm" onClick={handleAIInsights}>
            <Sparkles className="mr-2 h-4 w-4" />
            AI Insights
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {kpiData.map((kpi) => (
          <Link key={kpi.title} href={kpi.href || '#'}>
            <Card className="card-hover cursor-pointer h-full">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
                  {kpi.title}
                </CardTitle>
                <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <kpi.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-lg sm:text-2xl font-bold truncate">{kpi.value}</div>
                <div className="flex items-center gap-1 mt-1">
                  {kpi.trend === 'up' ? (
                    <ArrowUpRight className="h-3 w-3 sm:h-4 sm:w-4 text-success" />
                  ) : kpi.trend === 'down' ? (
                    <ArrowDownRight className="h-3 w-3 sm:h-4 sm:w-4 text-destructive" />
                  ) : null}
                  <span
                    className={`text-xs sm:text-sm font-medium ${
                      kpi.trend === 'up' ? 'text-success' : kpi.trend === 'down' ? 'text-destructive' : 'text-muted-foreground'
                    }`}
                  >
                    {kpi.change > 0 ? '+' : ''}
                    {kpi.change}%
                  </span>
                  <span className="text-xs text-muted-foreground hidden sm:inline">
                    {kpi.changeLabel}
                  </span>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Pending Items */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {pendingItems.map((item) => (
          <Link key={item.title} href={item.href}>
            <Card className="cursor-pointer hover:border-primary/50 transition-colors h-full">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">{item.title}</p>
                    <p className="text-xl sm:text-2xl font-bold mt-1">{item.count}</p>
                  </div>
                  <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-warning/10 flex items-center justify-center shrink-0">
                    <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-warning" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Revenue Chart - 2/3 width */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle>Revenue Overview</CardTitle>
                <CardDescription>Monthly revenue and orders trend</CardDescription>
              </div>
              <Tabs defaultValue="30d" className="w-full sm:w-auto">
                <TabsList className="h-8 w-full sm:w-auto grid grid-cols-4 sm:flex">
                  <TabsTrigger value="7d" className="text-xs">7D</TabsTrigger>
                  <TabsTrigger value="30d" className="text-xs">30D</TabsTrigger>
                  <TabsTrigger value="90d" className="text-xs">90D</TabsTrigger>
                  <TabsTrigger value="1y" className="text-xs">1Y</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent className="pl-2">
            <RevenueChart />
          </CardContent>
        </Card>

        {/* AI Insights Panel - 1/3 width */}
        <AIInsightsPanel />
      </div>

      {/* Second Row - Recent Orders and Top Vendors */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Orders */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base sm:text-lg">Recent Orders</CardTitle>
                <CardDescription className="text-xs sm:text-sm">Latest orders from customers</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/orders" className="flex items-center gap-1">
                  View all
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px] sm:h-[350px]">
              <div className="space-y-3">
                {recentOrders.length > 0 ? recentOrders.map((order) => (
                  <Link
                    key={order.id || order.order_number}
                    href={`/orders?search=${order.order_number}`}
                  >
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer">
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar className="h-8 w-8 sm:h-9 sm:w-9 shrink-0">
                          <AvatarImage src={order.customer_avatar} />
                          <AvatarFallback className="text-xs">{getInitials(order.customer || 'Guest')}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{order.customer || 'Guest'}</p>
                          <p className="text-xs text-muted-foreground">{order.order_number || order.id}</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0 ml-2">
                        <p className="text-sm font-medium">
                          {formatPrice(order.total, 'USD')}
                        </p>
                        <Badge variant={getStatusColor(order.status) as any} className="mt-1 text-xs">
                          {order.status}
                        </Badge>
                      </div>
                    </div>
                  </Link>
                )) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <ShoppingCart className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No orders yet</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Top Vendors */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base sm:text-lg">Top Vendors</CardTitle>
                <CardDescription className="text-xs sm:text-sm">Best performing vendors this month</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/vendors" className="flex items-center gap-1">
                  View all
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px] sm:h-[350px]">
              <div className="space-y-3">
                {topVendors.length > 0 ? topVendors.map((vendor, index) => (
                  <Link
                    key={vendor.id || vendor.name}
                    href={`/vendors?search=${encodeURIComponent(vendor.name)}`}
                  >
                    <div className="flex items-center gap-3 sm:gap-4 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer">
                      <div className="flex items-center justify-center h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-primary/10 text-primary font-bold text-xs sm:text-sm shrink-0">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{vendor.name}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                          {vendor.rating || 'N/A'}
                          <span className="text-muted-foreground/50 hidden sm:inline">|</span>
                          <span className="hidden sm:inline">{vendor.orders || 0} orders</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold">
                          {formatPrice(vendor.sales, 'USD')}
                        </p>
                        <p className="text-xs text-muted-foreground hidden sm:block">Total sales</p>
                      </div>
                    </div>
                  </Link>
                )) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Store className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No vendors yet</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Fraud Alerts */}
      <FraudAlerts />

      {/* Recent Activity */}
      <RecentActivity />
    </div>
  )
}
