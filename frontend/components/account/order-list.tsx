'use client'

import * as React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  Package,
  Clock,
  CheckCircle,
  Truck,
  AlertCircle,
  ChevronRight,
  Eye,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { formatPrice, formatDate } from '@/lib/utils'

interface OrderItem {
  id: string
  product_name: string
  product_image?: string
  quantity: number
  price: number
}

interface Order {
  id: string
  order_number: string
  status: string
  total_amount: number
  total?: number
  currency?: string
  created_at: string
  item_count?: number
  items: OrderItem[]
}

interface OrderListProps {
  orders: Order[]
}

const statusConfig: Record<string, { label: string; icon: React.ElementType; className: string }> = {
  pending: { label: 'Pending', icon: Clock, className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
  processing: { label: 'Processing', icon: Package, className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
  shipped: { label: 'Shipped', icon: Truck, className: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' },
  delivered: { label: 'Delivered', icon: CheckCircle, className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  cancelled: { label: 'Cancelled', icon: AlertCircle, className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
}

export function OrderList({ orders }: OrderListProps) {
  if (orders.length === 0) {
    return (
      <Card>
        <CardContent className="py-16 text-center">
          <Package className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-semibold">No orders yet</h3>
          <p className="mt-2 text-muted-foreground">
            When you place orders, they will appear here.
          </p>
          <Button asChild className="mt-4">
            <Link href="/products">Start Shopping</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {orders.map((order) => {
        const status = statusConfig[order.status] || statusConfig.pending
        const StatusIcon = status.icon
        const items = order.items || []
        const displayItems = items.slice(0, 3)
        const remainingCount = items.length - 3

        return (
          <Card key={order.id} className="overflow-hidden">
            <CardContent className="p-0">
              {/* Order Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-muted/50">
                <div className="flex flex-wrap items-center gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Order </span>
                    <span className="font-medium">#{order.order_number}</span>
                  </div>
                  <Separator orientation="vertical" className="h-4 hidden sm:block" />
                  <div className="text-muted-foreground">
                    {formatDate(order.created_at)}
                  </div>
                </div>
                <Badge variant="secondary" className={status.className}>
                  <StatusIcon className="mr-1 h-3 w-3" />
                  {status.label}
                </Badge>
              </div>

              {/* Order Items */}
              <div className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  {/* Product Images */}
                  <div className="flex -space-x-2">
                    {displayItems.map((item, index) => (
                      <div
                        key={item.id}
                        className="relative h-16 w-16 rounded-md border-2 border-background bg-muted overflow-hidden"
                        style={{ zIndex: displayItems.length - index }}
                      >
                        {item.product_image ? (
                          <Image
                            src={item.product_image}
                            alt={item.product_name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center">
                            <Package className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                    ))}
                    {remainingCount > 0 && (
                      <div className="relative h-16 w-16 rounded-md border-2 border-background bg-muted flex items-center justify-center">
                        <span className="text-sm font-medium text-muted-foreground">
                          +{remainingCount}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Order Summary */}
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">
                      {(order.item_count || items.length)} item{(order.item_count || items.length) !== 1 ? 's' : ''}
                    </p>
                    <p className="font-semibold mt-1">
                      {formatPrice(order.total ?? order.total_amount, order.currency)}
                    </p>
                  </div>

                  {/* View Order Button */}
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/account/orders/${order.order_number}`}>
                      <Eye className="mr-2 h-4 w-4" />
                      View Order
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
