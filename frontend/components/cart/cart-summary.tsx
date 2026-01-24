'use client'

import Link from 'next/link'
import { ArrowRight, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useCurrencyStore } from '@/store'

interface CartSummaryProps {
  subtotal: number
  discount?: number
  shipping?: number
  tax?: number
  total: number
  couponCode?: string
  showCheckoutButton?: boolean
  onCheckout?: () => void
  className?: string
}

export function CartSummary({
  subtotal,
  discount = 0,
  shipping,
  tax,
  total,
  couponCode,
  showCheckoutButton = true,
  onCheckout,
  className,
}: CartSummaryProps) {
  const { convertAndFormat } = useCurrencyStore()
  const freeShipping = shipping === 0 || subtotal >= 50
  const shippingAmount = freeShipping ? 0 : (shipping || 5.99)
  const finalTotal = total + (tax || 0) + shippingAmount

  return (
    <div className={className}>
      <h3 className="font-semibold text-lg mb-4">Order Summary</h3>

      <div className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Subtotal</span>
          <span>{convertAndFormat(subtotal)}</span>
        </div>

        {discount > 0 && (
          <div className="flex justify-between text-sm text-green-600">
            <span>
              Discount
              {couponCode && (
                <span className="ml-1 text-xs">({couponCode})</span>
              )}
            </span>
            <span>-{convertAndFormat(discount)}</span>
          </div>
        )}

        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Shipping</span>
          <span>
            {freeShipping ? (
              <span className="text-green-600">Free</span>
            ) : (
              convertAndFormat(shippingAmount)
            )}
          </span>
        </div>

        {tax !== undefined && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Tax</span>
            <span>{convertAndFormat(tax)}</span>
          </div>
        )}

        <Separator className="my-3" />

        <div className="flex justify-between font-semibold text-lg">
          <span>Total</span>
          <span>{convertAndFormat(finalTotal)}</span>
        </div>

        {!freeShipping && subtotal < 50 && (
          <p className="text-xs text-muted-foreground">
            Add {convertAndFormat(50 - subtotal)} more for free shipping!
          </p>
        )}
      </div>

      {showCheckoutButton && (
        <div className="mt-6 space-y-3">
          <Button className="w-full" size="lg" onClick={onCheckout} asChild>
            <Link href="/checkout">
              Proceed to Checkout
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>

          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="h-4 w-4" />
            <span>Secure checkout with SSL encryption</span>
          </div>
        </div>
      )}
    </div>
  )
}
