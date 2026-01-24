'use client'

import * as React from 'react'
import Link from 'next/link'
import {
  Users,
  Store,
  Package,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  Star,
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { adminAPI } from '@/lib/api'
import { formatPrice, formatDate } from '@/lib/utils'

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

interface RecentOrder {
  id: string
  order_number: string
  customer: string
  total: number
  status: string
  payment_status: string
  created_at: string
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

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  processing: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  shipped: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  delivered: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
}

export default function AdminDashboardPage() {
  const [stats, setStats] = React.useState<DashboardStats | null>(null)
  const [recentOrders, setRecentOrders] = React.useState<RecentOrder[]>([])
  const [topProducts, setTopProducts] = React.useState<TopProduct[]>([])
  const [topVendors, setTopVendors] = React.useState<TopVendor[]>([])
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [statsRes, ordersRes, productsRes, vendorsRes] = await Promise.all([
          adminAPI.getDashboard(),
          adminAPI.getRecentOrders(5),
          adminAPI.getTopProducts(5),
          adminAPI.getTopVendors(5),
        ])
        setStats(statsRes.data)
        setRecentOrders(ordersRes.data || [])
        setTopProducts(productsRes.data || [])
        setTopVendors(vendorsRes.data || [])
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold font-display">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your marketplace performance.
        </p>
      </div>

      {/* Stats Cards - Row 1 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">
                  {formatPrice(stats?.total_revenue || 0)}
                </p>
              </div>
              <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/30">
                <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-2 text-xs">
              <ArrowUpRight className="h-3 w-3 text-green-600" />
              <span className="text-green-600">{formatPrice(stats?.today_revenue || 0)}</span>
              <span className="text-muted-foreground">today</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Orders</p>
                <p className="text-2xl font-bold">{stats?.total_orders || 0}</p>
              </div>
              <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/30">
                <ShoppingCart className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            {(stats?.pending_orders || 0) > 0 && (
              <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-2">
                {stats?.pending_orders} pending orders
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold">{stats?.total_users || 0}</p>
              </div>
              <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900/30">
                <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              +{stats?.new_users_today || 0} new today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Vendors</p>
                <p className="text-2xl font-bold">{stats?.total_vendors || 0}</p>
              </div>
              <div className="p-3 rounded-full bg-orange-100 dark:bg-orange-900/30">
                <Store className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
            {(stats?.pending_vendors || 0) > 0 && (
              <Button variant="link" size="sm" className="px-0 mt-1 h-auto text-xs" asChild>
                <Link href="/admin/vendors">
                  {stats?.pending_vendors} pending approval
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Stats Cards - Row 2 */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Products</p>
                <p className="text-2xl font-bold">{stats?.total_products || 0}</p>
              </div>
              <div className="p-3 rounded-full bg-teal-100 dark:bg-teal-900/30">
                <Package className="h-5 w-5 text-teal-600 dark:text-teal-400" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {stats?.active_products || 0} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Reviews</p>
                <p className="text-2xl font-bold">{stats?.total_reviews || 0}</p>
              </div>
              <div className="p-3 rounded-full bg-yellow-100 dark:bg-yellow-900/30">
                <Star className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
            <Button variant="link" size="sm" className="px-0 mt-1 h-auto text-xs" asChild>
              <Link href="/admin/reviews">
                Moderate reviews
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Growth</p>
                <p className="text-2xl font-bold flex items-center gap-1">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  12.5%
                </p>
              </div>
              <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/30">
                <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              vs last month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders & Top Products */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Orders */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Orders</CardTitle>
              <CardDescription>Latest orders across all vendors</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin/orders">
                View All <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentOrders.length === 0 ? (
              <div className="text-center py-8">
                <ShoppingCart className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <p className="mt-4 text-muted-foreground">No orders yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentOrders.map((order, index) => (
                  <React.Fragment key={order.id}>
                    {index > 0 && <Separator />}
                    <div className="flex items-center justify-between py-2">
                      <div className="space-y-1">
                        <p className="font-medium text-sm">#{order.order_number}</p>
                        <p className="text-xs text-muted-foreground">
                          {order.customer} • {formatDate(order.created_at)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-sm">{formatPrice(order.total)}</p>
                        <Badge
                          variant="secondary"
                          className={statusColors[order.status] || statusColors.pending}
                        >
                          {order.status}
                        </Badge>
                      </div>
                    </div>
                  </React.Fragment>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Top Products</CardTitle>
              <CardDescription>Best selling products</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin/products">
                View All <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {topProducts.length === 0 ? (
              <div className="text-center py-8">
                <Package className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <p className="mt-4 text-muted-foreground">No products yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {topProducts.map((product, index) => (
                  <React.Fragment key={product.id}>
                    {index > 0 && <Separator />}
                    <div className="flex items-center justify-between py-2">
                      <div className="space-y-1">
                        <p className="font-medium text-sm line-clamp-1">{product.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {product.sales} sales
                        </p>
                      </div>
                      <p className="font-medium text-sm">{formatPrice(product.revenue)}</p>
                    </div>
                  </React.Fragment>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Vendors */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Top Vendors</CardTitle>
            <CardDescription>Best performing vendors</CardDescription>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/vendors">
              View All <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {topVendors.length === 0 ? (
            <div className="text-center py-8">
              <Store className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <p className="mt-4 text-muted-foreground">No vendors yet</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
              {topVendors.map((vendor) => (
                <div key={vendor.id} className="p-4 border rounded-lg">
                  <p className="font-medium text-sm line-clamp-1">{vendor.name}</p>
                  <p className="text-lg font-bold mt-1">{formatPrice(vendor.sales)}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                    <span className="text-xs text-muted-foreground">
                      {vendor.rating?.toFixed(1) || 'N/A'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
