'use client'

import * as React from 'react'
import Link from 'next/link'
import { useAuthStore, useWishlistStore } from '@/store'
import { DashboardStats } from '@/components/account'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Package,
  ArrowRight,
  Clock,
  CheckCircle,
  Truck,
  AlertCircle,
} from 'lucide-react'
import { ordersAPI } from '@/lib/api'
import { formatPrice, formatDate } from '@/lib/utils'

interface Order {
  id: string
  order_number: string
  status: string
  total_amount: number
  created_at: string
  items_count: number
}

const statusConfig: Record<string, { label: string; icon: React.ElementType; className: string }> = {
  pending: { label: 'Pending', icon: Clock, className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
  processing: { label: 'Processing', icon: Package, className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
  shipped: { label: 'Shipped', icon: Truck, className: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' },
  delivered: { label: 'Delivered', icon: CheckCircle, className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  cancelled: { label: 'Cancelled', icon: AlertCircle, className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
}

export default function AccountDashboardPage() {
  const { user } = useAuthStore()
  const { items: wishlistItems } = useWishlistStore()
  const [recentOrders, setRecentOrders] = React.useState<Order[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [stats, setStats] = React.useState({
    totalOrders: 0,
    pendingOrders: 0,
    wishlistItems: 0,
    reviewsWritten: 0,
    savedAddresses: 0,
  })

  React.useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await ordersAPI.list({ page_size: 5 })
        const orders = response.data.results || []
        setRecentOrders(orders)

        // Calculate stats
        const totalOrders = response.data.count || 0
        const pendingOrders = orders.filter((o: Order) =>
          ['pending', 'processing'].includes(o.status)
        ).length

        setStats({
          totalOrders,
          pendingOrders,
          wishlistItems: wishlistItems.length,
          reviewsWritten: 0, // Would need a separate API call
          savedAddresses: 2, // Would need a separate API call
        })
      } catch (error: unknown) {
        // Handle 401 errors gracefully - user might not be fully authenticated yet
        const err = error as { response?: { status?: number } }
        if (err?.response?.status !== 401) {
          console.error('Failed to fetch dashboard data:', error)
        }
        // Set empty state on error
        setRecentOrders([])
        setStats({
          totalOrders: 0,
          pendingOrders: 0,
          wishlistItems: wishlistItems.length,
          reviewsWritten: 0,
          savedAddresses: 0,
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchDashboardData()
  }, [wishlistItems.length])

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div>
        <h1 className="text-2xl font-bold font-display">
          Welcome back, {user?.first_name || 'there'}!
        </h1>
        <p className="text-muted-foreground mt-1">
          Here&apos;s what&apos;s happening with your account.
        </p>
      </div>

      {/* Stats Cards */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <DashboardStats stats={stats} />
      )}

      {/* Recent Orders */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Orders</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/account/orders">
              View all <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-6 w-20" />
                </div>
              ))}
            </div>
          ) : recentOrders.length === 0 ? (
            <div className="text-center py-8">
              <Package className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <p className="mt-4 text-muted-foreground">No orders yet</p>
              <Button asChild className="mt-4">
                <Link href="/products">Start Shopping</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {recentOrders.map((order, index) => {
                const status = statusConfig[order.status] || statusConfig.pending
                const StatusIcon = status.icon

                return (
                  <React.Fragment key={order.id}>
                    {index > 0 && <Separator />}
                    <div className="flex items-center justify-between py-2">
                      <div className="space-y-1">
                        <Link
                          href={`/account/orders/${order.order_number}`}
                          className="font-medium hover:text-primary transition-colors"
                        >
                          Order #{order.order_number}
                        </Link>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(order.created_at)} • {order.items_count} item{order.items_count !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-medium">
                          {formatPrice(order.total_amount)}
                        </span>
                        <Badge variant="secondary" className={status.className}>
                          <StatusIcon className="mr-1 h-3 w-3" />
                          {status.label}
                        </Badge>
                      </div>
                    </div>
                  </React.Fragment>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="hover:border-primary/50 transition-colors">
          <Link href="/account/profile">
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-1">Edit Profile</h3>
              <p className="text-sm text-muted-foreground">
                Update your personal information and preferences
              </p>
            </CardContent>
          </Link>
        </Card>
        <Card className="hover:border-primary/50 transition-colors">
          <Link href="/account/addresses">
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-1">Manage Addresses</h3>
              <p className="text-sm text-muted-foreground">
                Add or edit your delivery addresses
              </p>
            </CardContent>
          </Link>
        </Card>
        <Card className="hover:border-primary/50 transition-colors">
          <Link href="/help">
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-1">Need Help?</h3>
              <p className="text-sm text-muted-foreground">
                Contact our support team for assistance
              </p>
            </CardContent>
          </Link>
        </Card>
      </div>
    </div>
  )
}
