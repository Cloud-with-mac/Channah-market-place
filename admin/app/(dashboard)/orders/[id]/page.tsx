'use client'

import * as React from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  ArrowLeft,
  Package,
  MapPin,
  CreditCard,
  Truck,
  User,
  Mail,
  Phone,
  Calendar,
  DollarSign,
  Loader2,
  Check,
  Clock,
  RefreshCw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ordersAPI } from '@/lib/api'
import { formatPrice, formatDate } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

interface OrderItem {
  id: string
  product_id: string
  product_name: string
  product_sku: string
  product_image: string
  variant_name: string
  quantity: number
  unit_price: number
  total: number
  status: string
  tracking_number: string | null
}

interface StatusHistory {
  id: string
  status: string
  notes: string | null
  created_at: string
}

interface Order {
  id: string
  order_number: string
  user_id: string
  status: string
  payment_status: string
  subtotal: number
  tax_amount: number
  shipping_amount: number
  discount_amount: number
  total: number
  currency: string
  coupon_code: string | null
  shipping_first_name: string
  shipping_last_name: string
  shipping_email: string
  shipping_phone: string | null
  shipping_address_line1: string
  shipping_address_line2: string | null
  shipping_city: string
  shipping_state: string | null
  shipping_postal_code: string
  shipping_country: string
  shipping_method: string | null
  tracking_number: string | null
  carrier: string | null
  estimated_delivery: string | null
  payment_method: string | null
  customer_notes: string | null
  created_at: string
  paid_at: string | null
  shipped_at: string | null
  delivered_at: string | null
  items: OrderItem[]
  status_history: StatusHistory[]
}

const statusConfig: Record<string, { label: string; className: string }> = {
  pending: { label: 'Pending', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
  confirmed: { label: 'Confirmed', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
  processing: { label: 'Processing', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
  shipped: { label: 'Shipped to Channah', className: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' },
  out_for_delivery: { label: 'Out for Delivery', className: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400' },
  delivered: { label: 'Delivered', className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  cancelled: { label: 'Cancelled', className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
  refunded: { label: 'Refunded', className: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400' },
}

const paymentStatusConfig: Record<string, { label: string; className: string }> = {
  pending: { label: 'Pending', className: 'bg-yellow-100 text-yellow-800' },
  paid: { label: 'Paid', className: 'bg-green-100 text-green-800' },
  failed: { label: 'Failed', className: 'bg-red-100 text-red-800' },
  refunded: { label: 'Refunded', className: 'bg-gray-100 text-gray-800' },
}

export default function AdminOrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [order, setOrder] = React.useState<Order | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [isUpdating, setIsUpdating] = React.useState(false)

  // Form state
  const [newStatus, setNewStatus] = React.useState('')
  const [trackingNumber, setTrackingNumber] = React.useState('')
  const [carrier, setCarrier] = React.useState('')
  const [notes, setNotes] = React.useState('')

  React.useEffect(() => {
    const fetchOrder = async () => {
      try {
        const data = await ordersAPI.get(params.id as string)
        setOrder(data)
        setNewStatus(data.status)
        setTrackingNumber(data.tracking_number || '')
        setCarrier(data.carrier || '')
      } catch (err: any) {
        console.error('Failed to fetch order:', err)
        setError(err?.response?.data?.detail || 'Order not found')
      } finally {
        setIsLoading(false)
      }
    }

    fetchOrder()
  }, [params.id])

  const handleUpdateStatus = async () => {
    if (!order || !newStatus) return

    setIsUpdating(true)
    try {
      const updateData: { status: string; tracking_number?: string; carrier?: string; notes?: string } = {
        status: newStatus,
      }
      if (trackingNumber) updateData.tracking_number = trackingNumber
      if (carrier) updateData.carrier = carrier
      if (notes) updateData.notes = notes

      const response = await ordersAPI.updateStatus(order.id, updateData)

      setOrder(response.data)
      setNotes('')

      toast({
        title: 'Order Updated',
        description: 'Order status has been updated successfully.',
      })
    } catch (err: any) {
      console.error('Failed to update order:', err)
      toast({
        title: 'Error',
        description: err?.response?.data?.detail || 'Failed to update order status',
        variant: 'destructive',
      })
    } finally {
      setIsUpdating(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardContent className="p-6">
                <Skeleton className="h-32 w-full" />
              </CardContent>
            </Card>
          </div>
          <div className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <Skeleton className="h-48 w-full" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="text-center py-16">
        <Package className="mx-auto h-12 w-12 text-muted-foreground/50" />
        <h2 className="mt-4 text-lg font-semibold">Order Not Found</h2>
        <p className="mt-2 text-muted-foreground">{error || 'The order you are looking for does not exist.'}</p>
        <Button asChild className="mt-4">
          <Link href="/orders">Back to Orders</Link>
        </Button>
      </div>
    )
  }

  const status = statusConfig[order.status] || statusConfig.pending
  const paymentStatus = paymentStatusConfig[order.payment_status] || paymentStatusConfig.pending

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold font-display">
              Order #{order.order_number}
            </h1>
            <p className="text-muted-foreground">
              Placed on {formatDate(order.created_at)}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Badge variant="secondary" className={status.className}>
            {status.label}
          </Badge>
          <Badge variant="secondary" className={paymentStatus.className}>
            {paymentStatus.label}
          </Badge>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Update Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Update Order Status & Tracking
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="status">Order Status</Label>
                  <Select value={newStatus} onValueChange={setNewStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="processing">Processing</SelectItem>
                      <SelectItem value="shipped">Shipped to Channah</SelectItem>
                      <SelectItem value="out_for_delivery">Out for Delivery</SelectItem>
                      <SelectItem value="delivered">Delivered</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                      <SelectItem value="refunded">Refunded</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="carrier">Carrier</Label>
                  <Select value={carrier} onValueChange={setCarrier}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select carrier" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fedex">FedEx</SelectItem>
                      <SelectItem value="ups">UPS</SelectItem>
                      <SelectItem value="usps">USPS</SelectItem>
                      <SelectItem value="dhl">DHL</SelectItem>
                      <SelectItem value="royal_mail">Royal Mail</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="tracking">Tracking Number</Label>
                <Input
                  id="tracking"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="Enter tracking number"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Status Notes (optional)</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add notes about this status change..."
                  rows={2}
                />
              </div>
              <Button onClick={handleUpdateStatus} disabled={isUpdating}>
                {isUpdating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Update Order
                  </>
                )}
              </Button>

              {order.tracking_number && (
                <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Truck className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Current Tracking Info</span>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Tracking Number: </span>
                      <code className="font-mono">{order.tracking_number}</code>
                    </div>
                    {order.carrier && (
                      <div>
                        <span className="text-muted-foreground">Carrier: </span>
                        <span className="capitalize">{order.carrier.replace('_', ' ')}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Order Items ({order.items.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.items.map((item, index) => (
                  <React.Fragment key={item.id}>
                    {index > 0 && <Separator />}
                    <div className="flex gap-4">
                      <div className="relative h-20 w-20 rounded-md bg-muted overflow-hidden flex-shrink-0">
                        {item.product_image ? (
                          <Image
                            src={item.product_image}
                            alt={item.product_name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center">
                            <Package className="h-8 w-8 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium">{item.product_name}</h4>
                        {item.variant_name && (
                          <p className="text-sm text-muted-foreground">
                            {item.variant_name}
                          </p>
                        )}
                        {item.product_sku && (
                          <p className="text-sm text-muted-foreground">
                            SKU: {item.product_sku}
                          </p>
                        )}
                        <p className="text-sm text-muted-foreground mt-1">
                          Qty: {item.quantity} × {formatPrice(item.unit_price, order.currency)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatPrice(item.total, order.currency)}</p>
                        <Badge variant="outline" className="mt-1 text-xs">
                          {item.status}
                        </Badge>
                      </div>
                    </div>
                  </React.Fragment>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Status History */}
          {order.status_history && order.status_history.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Status History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {order.status_history.map((history, index) => (
                    <div key={history.id} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <RefreshCw className="h-4 w-4 text-primary" />
                        </div>
                        {index < order.status_history.length - 1 && (
                          <div className="w-px h-full bg-border mt-2" />
                        )}
                      </div>
                      <div className="flex-1 pb-4">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="capitalize">
                            {history.status.replace('_', ' ')}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {formatDate(history.created_at)}
                          </span>
                        </div>
                        {history.notes && (
                          <p className="mt-1 text-sm text-muted-foreground">
                            {history.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Order Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatPrice(order.subtotal, order.currency)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Shipping</span>
                <span>{order.shipping_amount === 0 ? 'Free' : formatPrice(order.shipping_amount, order.currency)}</span>
              </div>
              {order.discount_amount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Discount</span>
                  <span>-{formatPrice(order.discount_amount, order.currency)}</span>
                </div>
              )}
              {order.tax_amount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tax</span>
                  <span>{formatPrice(order.tax_amount, order.currency)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span>{formatPrice(order.total, order.currency)}</span>
              </div>
              {order.coupon_code && (
                <div className="mt-2 p-2 bg-muted/50 rounded text-sm">
                  <span className="text-muted-foreground">Coupon: </span>
                  <code>{order.coupon_code}</code>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Customer Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Customer
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{order.shipping_first_name} {order.shipping_last_name}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <a href={`mailto:${order.shipping_email}`} className="text-primary hover:underline text-sm">
                  {order.shipping_email}
                </a>
              </div>
              {order.shipping_phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <a href={`tel:${order.shipping_phone}`} className="text-primary hover:underline text-sm">
                    {order.shipping_phone}
                  </a>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Shipping Address */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Shipping Address
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm space-y-1">
                <p className="font-medium">{order.shipping_first_name} {order.shipping_last_name}</p>
                <p className="text-muted-foreground">{order.shipping_address_line1}</p>
                {order.shipping_address_line2 && (
                  <p className="text-muted-foreground">{order.shipping_address_line2}</p>
                )}
                <p className="text-muted-foreground">
                  {order.shipping_city}{order.shipping_state ? `, ${order.shipping_state}` : ''} {order.shipping_postal_code}
                </p>
                <p className="text-muted-foreground">{order.shipping_country}</p>
              </div>
            </CardContent>
          </Card>

          {/* Payment Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Payment Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Method</span>
                <span className="capitalize">{(order.payment_method || 'card').replace('_', ' ')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <Badge variant="outline" className={paymentStatus.className}>
                  {paymentStatus.label}
                </Badge>
              </div>
              {order.paid_at && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Paid At</span>
                  <span>{formatDate(order.paid_at)}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Order Dates */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Important Dates
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created</span>
                <span>{formatDate(order.created_at)}</span>
              </div>
              {order.shipped_at && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipped to Channah</span>
                  <span>{formatDate(order.shipped_at)}</span>
                </div>
              )}
              {order.delivered_at && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Delivered</span>
                  <span>{formatDate(order.delivered_at)}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Customer Notes */}
          {order.customer_notes && (
            <Card>
              <CardHeader>
                <CardTitle>Customer Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{order.customer_notes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
