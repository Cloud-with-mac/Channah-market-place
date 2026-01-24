'use client'

import Link from 'next/link'
import { ShoppingCart, ArrowRight, Eye, Package, Clock, CheckCircle, Truck, XCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

interface Order {
  id: string
  order_number: string
  customer_name: string
  customer_avatar?: string
  product_name: string
  quantity: number
  total: number
  status: string
  created_at: string
}

interface RecentOrdersProps {
  orders: Order[]
  formatPrice: (price: number) => string
}

const statusConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  pending: {
    label: 'Pending',
    icon: Clock,
    color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300',
  },
  processing: {
    label: 'Processing',
    icon: Package,
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
  },
  shipped: {
    label: 'Shipped',
    icon: Truck,
    color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300',
  },
  delivered: {
    label: 'Delivered',
    icon: CheckCircle,
    color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300',
  },
  cancelled: {
    label: 'Cancelled',
    icon: XCircle,
    color: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300',
  },
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffHours < 1) return 'Just now'
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`

  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

export function RecentOrders({ orders, formatPrice }: RecentOrdersProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/50">
            <ShoppingCart className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </div>
          <CardTitle className="text-lg">Recent Orders</CardTitle>
        </div>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/vendor/orders" className="text-xs">
            View All <ArrowRight className="ml-1 h-3 w-3" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {orders.length === 0 ? (
          <div className="text-center py-8">
            <ShoppingCart className="mx-auto h-12 w-12 text-muted-foreground/30" />
            <p className="mt-4 text-muted-foreground text-sm">No orders yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Orders will appear here once customers start buying
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.slice(0, 5).map((order, index) => {
              const status = statusConfig[order.status] || statusConfig.pending
              const StatusIcon = status.icon

              return (
                <div
                  key={order.id}
                  className={cn(
                    "flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors",
                    index < orders.length - 1 && "border-b"
                  )}
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={order.customer_avatar} />
                    <AvatarFallback className="bg-primary/10 text-primary text-sm">
                      {order.customer_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm truncate">#{order.order_number}</p>
                      <Badge variant="secondary" className={cn("text-[10px]", status.color)}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {status.label}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {order.product_name} × {order.quantity}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="font-semibold text-sm">{formatPrice(order.total)}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(order.created_at)}</p>
                  </div>

                  <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                    <Link href={`/vendor/orders/${order.id}`}>
                      <Eye className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
