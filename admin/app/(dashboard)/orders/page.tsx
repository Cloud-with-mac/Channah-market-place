'use client'

import * as React from 'react'
import Link from 'next/link'
import {
  ShoppingCart,
  Search,
  MoreHorizontal,
  Eye,
  Package,
  Truck,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Calendar,
  DollarSign,
  Download,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useToast } from '@/hooks/use-toast'
import { formatPrice, formatDate, getInitials } from '@/lib/utils'
import { ordersAPI } from '@/lib/api'
import { exportToCSV } from '@/lib/export'

interface Order {
  id: string
  order_number: string
  customer_name: string
  customer_email: string
  vendor_name: string
  status: string
  total: number
  items_count: number
  created_at: string
  updated_at: string
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'pending':
      return <Badge variant="warning">Pending</Badge>
    case 'processing':
      return <Badge variant="info">Processing</Badge>
    case 'shipped':
      return <Badge variant="info">Shipped to Vendora</Badge>
    case 'delivered':
      return <Badge variant="success">Delivered</Badge>
    case 'cancelled':
      return <Badge variant="destructive">Cancelled</Badge>
    case 'refunded':
      return <Badge variant="destructive">Refunded</Badge>
    default:
      return <Badge variant="secondary">{status}</Badge>
  }
}

export default function OrdersPage() {
  const { toast } = useToast()
  const [orders, setOrders] = React.useState<Order[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [search, setSearch] = React.useState('')
  const [statusFilter, setStatusFilter] = React.useState<string>('all')
  const [page, setPage] = React.useState(1)
  const [total, setTotal] = React.useState(0)
  const [selectedOrder, setSelectedOrder] = React.useState<Order | null>(null)
  const [actionType, setActionType] = React.useState<string>('')
  const [isUpdating, setIsUpdating] = React.useState(false)
  const limit = 20

  const fetchOrders = React.useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await ordersAPI.list({
        page,
        limit,
        search: search || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
      })
      setOrders(response.orders || [])
      setTotal(response.total || 0)
    } catch (error) {
      console.error('Failed to fetch orders:', error)
      setOrders([])
    } finally {
      setIsLoading(false)
    }
  }, [page, search, statusFilter])

  React.useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  const handleStatusChange = async () => {
    if (!selectedOrder || !actionType) return
    try {
      setIsUpdating(true)
      await ordersAPI.updateStatus(selectedOrder.id, actionType)
      setOrders((prev) =>
        prev.map((o) => (o.id === selectedOrder.id ? { ...o, status: actionType } : o))
      )
      toast({
        title: 'Order Updated',
        description: `Order ${selectedOrder.order_number} status changed to ${actionType}.`,
      })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to update order status.',
        variant: 'destructive',
      })
    } finally {
      setIsUpdating(false)
      setSelectedOrder(null)
      setActionType('')
    }
  }

  const openStatusDialog = (order: Order, status: string) => {
    setSelectedOrder(order)
    setActionType(status)
  }

  const totalPages = Math.ceil(total / limit)

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="flex gap-4">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Card>
          <CardContent className="p-0">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-20 m-4" />
            ))}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display">Order Management</h1>
          <p className="text-muted-foreground">
            Track and manage all marketplace orders.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => exportToCSV(orders, 'orders')}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm" onClick={fetchOrders}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search orders by number or customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="processing">Processing</SelectItem>
            <SelectItem value="shipped">Shipped to Vendora</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
            <SelectItem value="refunded">Refunded</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Orders Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="p-4 text-left text-sm font-medium">Order</th>
                  <th className="p-4 text-left text-sm font-medium">Customer</th>
                  <th className="p-4 text-left text-sm font-medium">Vendor</th>
                  <th className="p-4 text-left text-sm font-medium">Items</th>
                  <th className="p-4 text-left text-sm font-medium">Total</th>
                  <th className="p-4 text-left text-sm font-medium">Status</th>
                  <th className="p-4 text-left text-sm font-medium">Date</th>
                  <th className="p-4 text-right text-sm font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-b hover:bg-muted/50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <ShoppingCart className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{order.order_number}</p>
                          <p className="text-xs text-muted-foreground">#{order.id.slice(0, 8)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">
                            {getInitials(order.customer_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{order.customer_name}</p>
                          <p className="text-xs text-muted-foreground">{order.customer_email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-sm">{order.vendor_name}</td>
                    <td className="p-4 text-sm">{order.items_count} items</td>
                    <td className="p-4">
                      <p className="font-medium">{formatPrice(order.total, 'USD')}</p>
                    </td>
                    <td className="p-4">{getStatusBadge(order.status)}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {formatDate(order.created_at)}
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem asChild>
                            <Link href={`/orders/${order.id}`}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </Link>
                          </DropdownMenuItem>
                          {order.status === 'pending' && (
                            <DropdownMenuItem onClick={() => openStatusDialog(order, 'processing')}>
                              <Package className="h-4 w-4 mr-2 text-info" />
                              Mark Processing
                            </DropdownMenuItem>
                          )}
                          {order.status === 'processing' && (
                            <DropdownMenuItem onClick={() => openStatusDialog(order, 'shipped')}>
                              <Truck className="h-4 w-4 mr-2 text-info" />
                              Mark Shipped to Vendora
                            </DropdownMenuItem>
                          )}
                          {order.status === 'shipped' && (
                            <DropdownMenuItem onClick={() => openStatusDialog(order, 'delivered')}>
                              <CheckCircle className="h-4 w-4 mr-2 text-success" />
                              Mark Delivered
                            </DropdownMenuItem>
                          )}
                          {!['cancelled', 'refunded', 'delivered'].includes(order.status) && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => openStatusDialog(order, 'cancelled')}
                              >
                                <XCircle className="h-4 w-4 mr-2" />
                                Cancel Order
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
                {orders.length === 0 && (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-muted-foreground">
                      <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No orders found</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between p-4 border-t">
            <p className="text-sm text-muted-foreground">
              Showing {orders.length} of {total} orders
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm">
                Page {page} of {totalPages || 1}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status Change Confirmation Dialog */}
      <Dialog open={!!selectedOrder && !!actionType} onOpenChange={() => { setSelectedOrder(null); setActionType(''); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Order Status</DialogTitle>
            <DialogDescription>
              Are you sure you want to change order <strong>{selectedOrder?.order_number}</strong> status to <strong>{actionType}</strong>?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setSelectedOrder(null); setActionType(''); }}>
              Cancel
            </Button>
            <Button onClick={handleStatusChange} disabled={isUpdating}>
              {isUpdating ? 'Updating...' : 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
