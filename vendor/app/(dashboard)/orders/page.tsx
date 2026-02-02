'use client'

import * as React from 'react'
import Link from 'next/link'
import { ShoppingCart, Search, Eye, Package, Truck, CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react'
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { vendorOrdersAPI } from '@/lib/api'
import { useCurrencyStore } from '@/store'
import { formatDateTime } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

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

const STATUS_FLOW: Record<string, string[]> = {
  pending: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: [],
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  processing: 'Processing',
  shipped: 'Shipped',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
}

export default function VendorOrdersPage() {
  const { convertAndFormat } = useCurrencyStore()
  const { toast } = useToast()
  const [orders, setOrders] = React.useState<Order[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [statusFilter, setStatusFilter] = React.useState('all')
  const [searchQuery, setSearchQuery] = React.useState('')

  // Status update dialog
  const [updatingOrder, setUpdatingOrder] = React.useState<Order | null>(null)
  const [newStatus, setNewStatus] = React.useState('')
  const [trackingNumber, setTrackingNumber] = React.useState('')
  const [trackingCarrier, setTrackingCarrier] = React.useState('')
  const [isSavingStatus, setIsSavingStatus] = React.useState(false)

  React.useEffect(() => {
    const fetchOrders = async () => {
      setIsLoading(true)
      try {
        const params: any = { limit: 50 }
        if (statusFilter !== 'all') params.status = statusFilter
        const response = await vendorOrdersAPI.list(params)
        setOrders(Array.isArray(response) ? response : (response?.items || response?.results || []))
      } catch (error) {
        console.error('Failed to fetch orders:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchOrders()
  }, [statusFilter])

  const filteredOrders = orders.filter(order =>
    searchQuery === '' ||
    order.order_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.product_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.customer_name?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'text-yellow-500 border-yellow-500/50',
      processing: 'text-blue-500 border-blue-500/50',
      shipped: 'text-purple-500 border-purple-500/50',
      delivered: 'text-green-500 border-green-500/50',
      cancelled: 'text-red-500 border-red-500/50',
    }
    return (
      <Badge variant="outline" className={colors[status]}>
        {STATUS_LABELS[status] || status}
      </Badge>
    )
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4 text-yellow-500" />
      case 'processing': return <Package className="h-4 w-4 text-blue-500" />
      case 'shipped': return <Truck className="h-4 w-4 text-purple-500" />
      case 'delivered': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'cancelled': return <XCircle className="h-4 w-4 text-red-500" />
      default: return null
    }
  }

  const handleOpenStatusUpdate = (order: Order) => {
    setUpdatingOrder(order)
    const nextStatuses = STATUS_FLOW[order.status] || []
    setNewStatus(nextStatuses[0] || '')
    setTrackingNumber('')
    setTrackingCarrier('')
  }

  const handleUpdateStatus = async () => {
    if (!updatingOrder || !newStatus) return
    setIsSavingStatus(true)
    try {
      // If shipping, add tracking info
      if (newStatus === 'shipped' && trackingNumber) {
        await vendorOrdersAPI.addTracking(updatingOrder.id, trackingNumber, trackingCarrier || 'Other')
      } else {
        await vendorOrdersAPI.updateStatus(updatingOrder.id, newStatus)
      }

      // Update local state
      setOrders(orders.map(o =>
        o.id === updatingOrder.id ? { ...o, status: newStatus } : o
      ))

      toast({
        title: 'Status updated',
        description: `Order #${updatingOrder.order_number} marked as ${STATUS_LABELS[newStatus] || newStatus}.`,
      })
      setUpdatingOrder(null)
    } catch (error) {
      console.error('Failed to update status:', error)
      toast({
        title: 'Update failed',
        description: 'Could not update order status. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsSavingStatus(false)
    }
  }

  // Stats summary
  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    processing: orders.filter(o => o.status === 'processing').length,
    shipped: orders.filter(o => o.status === 'shipped').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-display">Orders</h1>
        <p className="text-muted-foreground">Manage and fulfill customer orders</p>
      </div>

      {/* Quick Stats */}
      {!isLoading && orders.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: 'Total', value: stats.total, color: 'text-foreground' },
            { label: 'Pending', value: stats.pending, color: 'text-yellow-500' },
            { label: 'Processing', value: stats.processing, color: 'text-blue-500' },
            { label: 'Shipped', value: stats.shipped, color: 'text-purple-500' },
            { label: 'Delivered', value: stats.delivered, color: 'text-green-500' },
          ].map((stat) => (
            <Card key={stat.label}>
              <CardContent className="py-3 px-4">
                <p className="text-xs text-muted-foreground">{stat.label}</p>
                <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search orders..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
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
          ) : filteredOrders.length === 0 ? (
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
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => {
                  const canUpdate = (STATUS_FLOW[order.status] || []).length > 0
                  return (
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
                      <TableCell className="text-muted-foreground text-sm">
                        {formatDateTime(order.created_at)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {canUpdate && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs"
                              onClick={() => handleOpenStatusUpdate(order)}
                            >
                              Update
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                            <Link href={`/orders/${order.id}`}>
                              <Eye className="h-3.5 w-3.5" />
                            </Link>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Status Update Dialog */}
      <Dialog open={!!updatingOrder} onOpenChange={(open) => !open && setUpdatingOrder(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Order Status</DialogTitle>
            <DialogDescription>
              Order #{updatingOrder?.order_number} - {updatingOrder?.product_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Current status:</span>
              {updatingOrder && getStatusBadge(updatingOrder.status)}
            </div>

            <div className="space-y-2">
              <Label>New Status</Label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select new status" />
                </SelectTrigger>
                <SelectContent>
                  {updatingOrder && (STATUS_FLOW[updatingOrder.status] || []).map((s) => (
                    <SelectItem key={s} value={s}>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(s)}
                        {STATUS_LABELS[s] || s}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {newStatus === 'shipped' && (
              <>
                <div className="space-y-2">
                  <Label>Tracking Number (optional)</Label>
                  <Input
                    placeholder="e.g. 1Z999AA10123456784"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Carrier (optional)</Label>
                  <Select value={trackingCarrier} onValueChange={setTrackingCarrier}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select carrier" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UPS">UPS</SelectItem>
                      <SelectItem value="FedEx">FedEx</SelectItem>
                      <SelectItem value="USPS">USPS</SelectItem>
                      <SelectItem value="DHL">DHL</SelectItem>
                      <SelectItem value="Royal Mail">Royal Mail</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUpdatingOrder(null)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateStatus} disabled={!newStatus || isSavingStatus}>
              {isSavingStatus ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Status'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
