'use client'

import * as React from 'react'
import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  Search,
  Package,
  Truck,
  CheckCircle,
  Clock,
  MapPin,
  Loader2,
  AlertCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ordersAPI } from '@/lib/api'
import { formatPrice, formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface OrderTracking {
  order_number: string
  status: string
  payment_status: string
  created_at: string
  updated_at: string
  shipping_first_name: string
  shipping_last_name: string
  shipping_city: string
  shipping_state: string
  shipping_country: string
  subtotal: number
  shipping_cost: number
  tax: number
  total: number
  currency: string
  items: {
    id: string
    product_name: string
    quantity: number
    price: number
    status: string
    tracking_number?: string
  }[]
  status_history: {
    id: string
    status: string
    notes?: string
    created_at: string
  }[]
}

const statusConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  pending: { label: 'Order Placed', icon: Clock, color: 'text-yellow-500' },
  processing: { label: 'Processing', icon: Package, color: 'text-blue-500' },
  shipped: { label: 'Shipped', icon: Truck, color: 'text-purple-500' },
  delivered: { label: 'Delivered', icon: CheckCircle, color: 'text-green-500' },
  cancelled: { label: 'Cancelled', icon: AlertCircle, color: 'text-red-500' },
}

const statusOrder = ['pending', 'processing', 'shipped', 'delivered']

function TrackOrderContent() {
  const searchParams = useSearchParams()
  const initialOrderNumber = searchParams.get('order') || ''

  const [orderNumber, setOrderNumber] = React.useState(initialOrderNumber)
  const [email, setEmail] = React.useState('')
  const [order, setOrder] = React.useState<OrderTracking | null>(null)
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [hasSearched, setHasSearched] = React.useState(false)

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!orderNumber.trim()) return

    setIsLoading(true)
    setError(null)
    setHasSearched(true)

    try {
      const data = await ordersAPI.trackOrder(orderNumber.trim(), email.trim() || undefined)
      setOrder(data)
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } }
      setError(error?.response?.data?.detail || 'Order not found. Please check your order number.')
      setOrder(null)
    } finally {
      setIsLoading(false)
    }
  }

  React.useEffect(() => {
    if (initialOrderNumber) {
      handleTrack({ preventDefault: () => {} } as React.FormEvent)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const currentStatusIndex = order ? statusOrder.indexOf(order.status) : -1

  return (
    <div className="container py-8 max-w-4xl">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold font-display mb-2">Track Your Order</h1>
        <p className="text-muted-foreground">
          Enter your order number to see the latest status and tracking information.
        </p>
      </div>

      {/* Search Form */}
      <Card className="mb-8">
        <CardContent className="pt-6">
          <form onSubmit={handleTrack} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="order_number">Order Number *</Label>
                <Input
                  id="order_number"
                  placeholder="e.g., ORD-2024-XXXXX"
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email (optional)</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Email used for order"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
            <Button type="submit" className="w-full md:w-auto" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Search className="mr-2 h-4 w-4" />
              )}
              Track Order
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Error Message */}
      {error && (
        <Card className="mb-8 border-destructive">
          <CardContent className="py-8 text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-destructive mb-4" />
            <h3 className="text-lg font-semibold mb-2">Order Not Found</h3>
            <p className="text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Order Details */}
      {order && (
        <div className="space-y-6">
          {/* Status Overview */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Order #{order.order_number}</CardTitle>
                  <CardDescription>
                    Placed on {formatDate(order.created_at)}
                  </CardDescription>
                </div>
                <Badge
                  variant="secondary"
                  className={cn(
                    'text-sm',
                    order.status === 'delivered' && 'bg-green-100 text-green-800',
                    order.status === 'shipped' && 'bg-purple-100 text-purple-800',
                    order.status === 'processing' && 'bg-blue-100 text-blue-800',
                    order.status === 'pending' && 'bg-yellow-100 text-yellow-800',
                    order.status === 'cancelled' && 'bg-red-100 text-red-800'
                  )}
                >
                  {statusConfig[order.status]?.label || order.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {/* Progress Steps */}
              {order.status !== 'cancelled' && (
                <div className="relative mb-8">
                  <div className="flex justify-between">
                    {statusOrder.map((status, index) => {
                      const config = statusConfig[status]
                      const Icon = config.icon
                      const isCompleted = index <= currentStatusIndex
                      const isCurrent = index === currentStatusIndex

                      return (
                        <div
                          key={status}
                          className={cn(
                            'flex flex-col items-center relative z-10',
                            index < statusOrder.length - 1 && 'flex-1'
                          )}
                        >
                          <div
                            className={cn(
                              'w-10 h-10 rounded-full flex items-center justify-center border-2',
                              isCompleted
                                ? 'bg-primary border-primary text-primary-foreground'
                                : 'bg-background border-muted-foreground/30 text-muted-foreground'
                            )}
                          >
                            <Icon className="h-5 w-5" />
                          </div>
                          <span
                            className={cn(
                              'text-xs mt-2 text-center',
                              isCurrent ? 'font-semibold' : 'text-muted-foreground'
                            )}
                          >
                            {config.label}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                  {/* Progress Line */}
                  <div className="absolute top-5 left-0 right-0 h-0.5 bg-muted-foreground/30 -z-0">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{
                        width: `${(currentStatusIndex / (statusOrder.length - 1)) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Shipping Address */}
              <div className="flex items-start gap-3 p-4 bg-muted rounded-lg">
                <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">Shipping Address</p>
                  <p className="text-sm text-muted-foreground">
                    {order.shipping_first_name} {order.shipping_last_name}
                    <br />
                    {order.shipping_city}, {order.shipping_state}
                    <br />
                    {order.shipping_country}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle>Order Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.items?.map((item, index) => (
                  <React.Fragment key={item.id || index}>
                    {index > 0 && <Separator />}
                    <div className="flex items-center justify-between py-2">
                      <div className="space-y-1">
                        <p className="font-medium">{item.product_name}</p>
                        <p className="text-sm text-muted-foreground">
                          Qty: {item.quantity} × {formatPrice(item.price, order.currency)}
                        </p>
                        {item.tracking_number && (
                          <p className="text-xs text-muted-foreground">
                            Tracking: {item.tracking_number}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-medium">
                          {formatPrice(item.price * item.quantity, order.currency)}
                        </p>
                        <Badge variant="outline" className="text-xs">
                          {statusConfig[item.status]?.label || item.status}
                        </Badge>
                      </div>
                    </div>
                  </React.Fragment>
                ))}
              </div>

              <Separator className="my-4" />

              {/* Order Summary */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatPrice(order.subtotal, order.currency)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  <span>{formatPrice(order.shipping_cost, order.currency)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax</span>
                  <span>{formatPrice(order.tax, order.currency)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-semibold text-base">
                  <span>Total</span>
                  <span>{formatPrice(order.total, order.currency)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Need Help */}
          <Card>
            <CardContent className="py-6">
              <div className="text-center">
                <h3 className="font-semibold mb-2">Need Help?</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  If you have questions about your order, please contact our support team.
                </p>
                <Button variant="outline" asChild>
                  <a href="/contact">Contact Support</a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Empty State */}
      {!order && !error && !hasSearched && (
        <Card>
          <CardContent className="py-16 text-center">
            <Package className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Track Your Package</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Enter your order number above to see real-time tracking information,
              delivery status, and estimated arrival time.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default function TrackOrderPage() {
  return (
    <Suspense fallback={
      <div className="container py-8 max-w-4xl">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    }>
      <TrackOrderContent />
    </Suspense>
  )
}
