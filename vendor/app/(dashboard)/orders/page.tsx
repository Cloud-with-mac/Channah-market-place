'use client'

import * as React from 'react'
import Link from 'next/link'
import { ShoppingCart, Search, Eye, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { vendorOrdersAPI } from '@/lib/api'
import { useCurrencyStore } from '@/store'
import { formatDateTime } from '@/lib/utils'

interface Order {
  id: string
  order_id: string
  order_number: string
  product_name: string
  product_image: string
  quantity: number
  unit_price: number
  total: number
  status: string
  customer_name: string
  customer_email: string
  shipping_address: string
  created_at: string
}

export default function VendorOrdersPage() {
  const { convertAndFormat } = useCurrencyStore()
  const [orders, setOrders] = React.useState<Order[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [statusFilter, setStatusFilter] = React.useState('all')

  React.useEffect(() => {
    const fetchOrders = async () => {
      try {
        const params: any = { limit: 50 }
        if (statusFilter !== 'all') params.status = statusFilter
        const response = await vendorOrdersAPI.list(params)
        // Handle both array response and paginated response
        const data = response.data
        setOrders(Array.isArray(data) ? data : (data?.items || data?.results || []))
      } catch (error) {
        console.error('Failed to fetch orders:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchOrders()
  }, [statusFilter])

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      pending: 'outline',
      processing: 'secondary',
      shipped: 'default',
      delivered: 'default',
      cancelled: 'destructive',
    }
    const colors: Record<string, string> = {
      pending: 'text-yellow-500 border-yellow-500/50',
      processing: 'text-blue-500 border-blue-500/50',
      shipped: 'text-purple-500 border-purple-500/50',
      delivered: 'text-green-500 border-green-500/50',
      cancelled: 'text-red-500 border-red-500/50',
    }
    return (
      <Badge variant="outline" className={colors[status]}>
        {status}
      </Badge>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-display">Orders</h1>
        <p className="text-muted-foreground">Manage and fulfill customer orders</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Orders</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="shipped">Shipped</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">No orders yet</h3>
              <p className="text-muted-foreground text-sm">
                Orders will appear here when customers purchase your products
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">
                      #{order.order_number}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {order.product_name}
                    </TableCell>
                    <TableCell>{order.customer_name}</TableCell>
                    <TableCell>{order.quantity}</TableCell>
                    <TableCell>{convertAndFormat(order.total)}</TableCell>
                    <TableCell>{getStatusBadge(order.status)}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDateTime(order.created_at)}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/orders/${order.id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
