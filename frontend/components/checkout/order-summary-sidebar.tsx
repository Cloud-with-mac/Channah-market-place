'use client'

import Image from 'next/image'
import { Separator } from '@/components/ui/separator'
import { useCurrencyStore } from '@/store'

interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
  image: string
  variantId?: string
}

interface OrderSummarySidebarProps {
  items: CartItem[]
  subtotal: number
  discount?: number
  shipping?: number
  tax?: number
  total: number
  couponCode?: string
}

export function OrderSummarySidebar({
  items,
  subtotal,
  discount = 0,
  shipping = 0,
  tax = 0,
  total,
  couponCode,
}: OrderSummarySidebarProps) {
  const { convertAndFormat } = useCurrencyStore()
  return (
    <div className="bg-muted/30 rounded-lg p-6 sticky top-4">
      <h3 className="font-semibold text-lg mb-4">Order Summary</h3>

      {/* Items */}
      <div className="space-y-3 max-h-64 overflow-y-auto mb-4">
        {items.map((item, index) => (
          <div key={`${item.id}-${item.variantId || index}`} className="flex gap-3">
            <div className="relative w-16 h-16 rounded-md overflow-hidden bg-muted flex-shrink-0">
              <Image
                src={item.image || '/placeholder.png'}
                alt={item.name}
                fill
                className="object-cover"
                sizes="64px"
              />
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-xs font-medium rounded-full flex items-center justify-center">
                {item.quantity}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium line-clamp-2">{item.name}</p>
              <p className="text-sm text-muted-foreground">
                {convertAndFormat(item.price)} x {item.quantity}
              </p>
            </div>
            <p className="text-sm font-medium">
              {convertAndFormat(item.price * item.quantity)}
            </p>
          </div>
        ))}
      </div>

      <Separator className="my-4" />

      {/* Totals */}
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Subtotal</span>
          <span>{convertAndFormat(subtotal)}</span>
        </div>

        {discount > 0 && (
          <div className="flex justify-between text-green-600">
            <span>
              Discount
              {couponCode && <span className="text-xs ml-1">({couponCode})</span>}
            </span>
            <span>-{convertAndFormat(discount)}</span>
          </div>
        )}

        <div className="flex justify-between">
          <span className="text-muted-foreground">Shipping</span>
          <span>
            {shipping === 0 ? (
              <span className="text-green-600">Free</span>
            ) : (
              convertAndFormat(shipping)
            )}
          </span>
        </div>

        {tax > 0 && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Tax</span>
            <span>{convertAndFormat(tax)}</span>
          </div>
        )}

        <Separator className="my-2" />

        <div className="flex justify-between text-lg font-semibold">
          <span>Total</span>
          <span>{convertAndFormat(total)}</span>
        </div>
      </div>
    </div>
  )
}
