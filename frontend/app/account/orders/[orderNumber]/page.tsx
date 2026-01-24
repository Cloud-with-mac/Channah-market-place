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
  Download,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { OrderTimeline } from '@/components/account/order-timeline'
import { ordersAPI } from '@/lib/api'
import { formatPrice, formatDate } from '@/lib/utils'
import { generateInvoice } from '@/lib/invoice-generator'

interface OrderItem {
  id: string
  product_id: string
  product_name: string
  product_slug?: string
  product_image?: string
  variant_name?: string
  quantity: number
  unit_price: number
  price?: number // fallback for legacy
  total: number
}

interface Order {
  id: string
  order_number: string
  status: string
  subtotal: number
  shipping_amount: number
  shipping_fee?: number // fallback for legacy
  tax_amount: number
  tax?: number // fallback for legacy
  discount_amount: number
  discount?: number // fallback for legacy
  total: number
  total_amount?: number // fallback for legacy
  currency: string
  created_at: string
  updated_at: string
  delivered_at?: string
  items: OrderItem[]
  // Flat shipping fields (backend format)
  shipping_first_name?: string
  shipping_last_name?: string
  shipping_address_line1?: string
  shipping_address_line2?: string
  shipping_city?: string
  shipping_state?: string
  shipping_postal_code?: string
  shipping_country?: string
  shipping_phone?: string
  shipping_email?: string
  payment_method: string
  tracking_number?: string
  tracking_url?: string
}

const statusConfig: Record<string, { label: string; className: string }> = {
  pending: { label: 'Pending', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
  processing: { label: 'Processing', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
  shipped: { label: 'Shipped', className: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' },
  delivered: { label: 'Delivered', className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  cancelled: { label: 'Cancelled', className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
}

export default function OrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [order, setOrder] = React.useState<Order | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    const fetchOrder = async () => {
      try {
        const response = await ordersAPI.get(params.orderNumber as string)
        setOrder(response.data)
      } catch (err: any) {
        console.error('Failed to fetch order:', err)
        setError(err?.response?.data?.message || 'Order not found')
      } finally {
        setIsLoading(false)
      }
    }

    fetchOrder()
  }, [params.orderNumber])

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
          <Link href="/account/orders">Back to Orders</Link>
        </Button>
      </div>
    )
  }

  const status = statusConfig[order.status] || statusConfig.pending

  const handleDownloadInvoice = () => {
    generateInvoice({
      orderNumber: order.order_number,
      orderDate: formatDate(order.created_at),
      customerName: `${order.shipping_first_name || ''} ${order.shipping_last_name || ''}`.trim() || 'Customer',
      customerEmail: order.shipping_email,
      customerPhone: order.shipping_phone,
      shippingAddress: {
        line1: order.shipping_address_line1 || '',
        line2: order.shipping_address_line2,
        city: order.shipping_city || '',
        state: order.shipping_state,
        postalCode: order.shipping_postal_code || '',
        country: order.shipping_country || '',
      },
      items: order.items.map((item) => ({
        name: item.product_name,
        quantity: item.quantity,
        price: item.unit_price ?? item.price ?? 0,
        total: item.total ?? 0,
        variant: item.variant_name,
      })),
      subtotal: order.subtotal ?? 0,
      shipping: order.shipping_amount ?? order.shipping_fee ?? 0,
      tax: order.tax_amount ?? order.tax ?? 0,
      discount: order.discount_amount ?? order.discount ?? 0,
      total: order.total ?? order.total_amount ?? 0,
      currency: order.currency,
      paymentMethod: (order.payment_method || 'card').replace('_', ' '),
      status: status.label,
    })
  }

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
        <Badge variant="secondary" className={status.className}>
          {status.label}
        </Badge>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Order Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <OrderTimeline
                status={order.status}
                createdAt={order.created_at}
                updatedAt={order.updated_at}
                deliveredAt={order.delivered_at}
              />

              {order.tracking_number && (
                <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Tracking Number</p>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="font-mono text-sm">{order.tracking_number}</code>
                    {order.tracking_url && (
                      <Button variant="link" size="sm" asChild className="h-auto p-0">
                        <a href={order.tracking_url} target="_blank" rel="noopener noreferrer">
                          Track Package
                        </a>
                      </Button>
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
                        <Link
                          href={`/product/${item.product_slug}`}
                          className="font-medium hover:text-primary transition-colors line-clamp-2"
                        >
                          {item.product_name}
                        </Link>
                        {item.variant_name && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {item.variant_name}
                          </p>
                        )}
                        <p className="text-sm text-muted-foreground mt-1">
                          Qty: {item.quantity} × {formatPrice(item.unit_price ?? item.price ?? 0, order.currency)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatPrice(item.total, order.currency)}</p>
                      </div>
                    </div>
                  </React.Fragment>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatPrice(order.subtotal ?? 0, order.currency)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Shipping</span>
                <span>{(order.shipping_amount ?? order.shipping_fee ?? 0) === 0 ? 'Free' : formatPrice(order.shipping_amount ?? order.shipping_fee ?? 0, order.currency)}</span>
              </div>
              {(order.discount_amount ?? order.discount ?? 0) > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Discount</span>
                  <span>-{formatPrice(order.discount_amount ?? order.discount ?? 0, order.currency)}</span>
                </div>
              )}
              {(order.tax_amount ?? order.tax ?? 0) > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tax</span>
                  <span>{formatPrice(order.tax_amount ?? order.tax ?? 0, order.currency)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span>{formatPrice(order.total ?? order.total_amount ?? 0, order.currency)}</span>
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
                <p className="font-medium">
                  {order.shipping_first_name} {order.shipping_last_name}
                </p>
                <p className="text-muted-foreground">{order.shipping_address_line1}</p>
                {order.shipping_address_line2 && (
                  <p className="text-muted-foreground">{order.shipping_address_line2}</p>
                )}
                <p className="text-muted-foreground">
                  {order.shipping_city}{order.shipping_state ? `, ${order.shipping_state}` : ''} {order.shipping_postal_code}
                </p>
                <p className="text-muted-foreground">{order.shipping_country}</p>
                {order.shipping_phone && (
                  <p className="text-muted-foreground mt-2">{order.shipping_phone}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Payment Method */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Payment Method
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm capitalize">{order.payment_method.replace('_', ' ')}</p>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="space-y-2">
            <Button variant="outline" className="w-full" onClick={handleDownloadInvoice}>
              <Download className="mr-2 h-4 w-4" />
              Download Invoice
            </Button>
            <Button variant="ghost" className="w-full" asChild>
              <Link href="/help">Need Help?</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
