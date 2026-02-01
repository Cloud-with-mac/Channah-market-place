'use client'

import * as React from 'react'
import { Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { CheckCircle, Package, Truck, ArrowRight, Home, ShoppingBag, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

function CheckoutSuccessContent() {
  const searchParams = useSearchParams()
  const orderNumber = searchParams.get('order') || 'CM-' + Math.random().toString(36).substring(2, 8).toUpperCase()
  const deliveryParam = searchParams.get('delivery')
  const estimatedDelivery = deliveryParam ? new Date(deliveryParam) : null
  const daysUntilDelivery = estimatedDelivery ? Math.ceil((estimatedDelivery.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-2xl mx-auto text-center">
        {/* Success Icon */}
        <div className="mb-6">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400">
            <CheckCircle className="h-10 w-10" />
          </div>
        </div>

        {/* Success Message */}
        <h1 className="text-3xl font-bold font-display mb-2">
          Thank You for Your Order!
        </h1>
        <p className="text-muted-foreground mb-8">
          Your order has been placed successfully. We&apos;ve sent a confirmation email with your order details.
        </p>

        {/* Order Number */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground mb-1">Order Number</p>
            <p className="text-2xl font-bold font-mono">{orderNumber}</p>
          </CardContent>
        </Card>

        {/* Order Timeline */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">What&apos;s Next?</h2>
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-primary" />
              </div>
              <div className="text-left">
                <p className="font-medium text-sm">Order Confirmed</p>
                <p className="text-xs text-muted-foreground">Just now</p>
              </div>
            </div>

            <div className="hidden md:block w-12 h-0.5 bg-muted" />

            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                <Package className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="text-left">
                <p className="font-medium text-sm text-muted-foreground">Processing</p>
                <p className="text-xs text-muted-foreground">Vendor is preparing your order</p>
              </div>
            </div>

            <div className="hidden md:block w-12 h-0.5 bg-muted" />

            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                <Truck className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="text-left">
                <p className="font-medium text-sm text-muted-foreground">Estimated Delivery</p>
                <p className="text-xs text-muted-foreground">
                  {daysUntilDelivery ? `~${daysUntilDelivery} business days` : 'Vendor will update tracking'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <Separator className="mb-8" />

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button asChild>
            <Link href={`/account/orders/${orderNumber}`}>
              Track Your Order
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/products">
              <ShoppingBag className="mr-2 h-4 w-4" />
              Continue Shopping
            </Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              Go Home
            </Link>
          </Button>
        </div>

        {/* Support Info */}
        <div className="mt-12 p-4 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground">
            Need help?{' '}
            <Link href="/help" className="text-primary hover:underline">
              Contact our support team
            </Link>{' '}
            or call us at{' '}
            <a href="tel:+2341234567890" className="text-primary hover:underline">
              +234 123 456 7890
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-16">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    }>
      <CheckoutSuccessContent />
    </Suspense>
  )
}
