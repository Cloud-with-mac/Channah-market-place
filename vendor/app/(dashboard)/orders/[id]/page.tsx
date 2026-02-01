'use client'

import * as React from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  ArrowLeft,
  Package,
  MapPin,
  Truck,
  User,
  Mail,
  Phone,
  Calendar,
  DollarSign,
  Loader2,
  Check,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { toast } from 'sonner'

interface OrderItem {
  id: string
  order_id: string
  order_number: string
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
  commission_rate: number
  commission_amount: number
  vendor_amount: number
  created_at: string
  currency: string
  customer_name: string
  customer_email: string
  customer_phone: string
  shipping_address: {
    line1: string
    line2: string | null
    city: string
    state: string | null
    postal_code: string
    country: string
  }
  order_status: string
  payment_status: string
  order_created_at: string
}

const statusConfig: Record<string, { label: string; className: string }> = {
  pending: { label: 'Pending', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
  confirmed: { label: 'Confirmed', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
  processing: { label: 'Processing', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
  shipped: { label: 'Shipped to Vendora', className: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' },
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

export default function VendorOrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { convertAndFormat } = useCurrencyStore()
  const [order, setOrder] = React.useState<OrderItem | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [isUpdating, setIsUpdating] = React.useState(false)

  // Form state
  const [newStatus, setNewStatus] = React.useState('')
  const [trackingNumber, setTrackingNumber] = React.useState('')

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(price)
  }

  React.useEffect(() => {
    const fetchOrder = async () => {
      try {
        const data = await vendorOrdersAPI.get(params.id as string)
        setOrder(data)
        setNewStatus(data.status)
        setTrackingNumber(data.tracking_number || '')
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
      // Update status with tracking number
      await vendorOrdersAPI.updateStatus(order.id, newStatus, trackingNumber || undefined)

      setOrder(prev => prev ? {
        ...prev,
        status: newStatus,
        tracking_number: trackingNumber || prev.tracking_number,
      } : null)

      toast.success('Order status updated successfully')
    } catch (err: any) {
      console.error('Failed to update order:', err)
      toast.error(err?.response?.data?.detail || 'Failed to update order status')
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
              Placed on {formatDateTime(order.order_created_at)}
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
          {/* Product Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Product Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <div className="relative h-24 w-24 rounded-md bg-muted overflow-hidden flex-shrink-0">
                  {order.product_image ? (
                    <Image
                      src={order.product_image}
                      alt={order.product_name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center">
                      <Package className="h-10 w-10 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-lg">{order.product_name}</h3>
                  {order.variant_name && (
                    <p className="text-sm text-muted-foreground">
                      Variant: {order.variant_name}
                    </p>
                  )}
                  {order.product_sku && (
                    <p className="text-sm text-muted-foreground">
                      SKU: {order.product_sku}
                    </p>
                  )}
                  <div className="mt-2 flex items-center gap-4 text-sm">
                    <span>Qty: <strong>{order.quantity}</strong></span>
                    <span>Unit Price: <strong>{formatPrice(order.unit_price, order.currency)}</strong></span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">{formatPrice(order.total, order.currency)}</p>
                  <p className="text-sm text-muted-foreground">Total</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Update Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Update Order Status
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
                      <SelectItem value="shipped">Shipped to Vendora</SelectItem>
                      <SelectItem value="out_for_delivery">Out for Delivery</SelectItem>
                      <SelectItem value="delivered">Delivered</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
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
              </div>
              <Button
                onClick={handleUpdateStatus}
                disabled={isUpdating || newStatus === order.status && trackingNumber === (order.tracking_number || '')}
              >
                {isUpdating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Update Status
                  </>
                )}
              </Button>

              {order.tracking_number && (
                <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Current Tracking Number</p>
                  <code className="font-mono text-sm font-medium">{order.tracking_number}</code>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Customer Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Customer Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{order.customer_name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <a href={`mailto:${order.customer_email}`} className="text-primary hover:underline">
                    {order.customer_email}
                  </a>
                </div>
                {order.customer_phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <a href={`tel:${order.customer_phone}`} className="text-primary hover:underline">
                      {order.customer_phone}
                    </a>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Earnings Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Earnings Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Item Total</span>
                <span>{formatPrice(order.total, order.currency)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Commission ({order.commission_rate}%)</span>
                <span className="text-red-600">-{formatPrice(order.commission_amount, order.currency)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-semibold">
                <span>Your Earnings</span>
                <span className="text-green-600">{formatPrice(order.vendor_amount, order.currency)}</span>
              </div>
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
                <p className="font-medium">{order.customer_name}</p>
                <p className="text-muted-foreground">{order.shipping_address.line1}</p>
                {order.shipping_address.line2 && (
                  <p className="text-muted-foreground">{order.shipping_address.line2}</p>
                )}
                <p className="text-muted-foreground">
                  {order.shipping_address.city}{order.shipping_address.state ? `, ${order.shipping_address.state}` : ''} {order.shipping_address.postal_code}
                </p>
                <p className="text-muted-foreground">{order.shipping_address.country}</p>
              </div>
            </CardContent>
          </Card>

          {/* Order Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Order Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Order Number</span>
                <span className="font-mono">{order.order_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Order Date</span>
                <span>{formatDateTime(order.order_created_at)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Item Date</span>
                <span>{formatDateTime(order.created_at)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
