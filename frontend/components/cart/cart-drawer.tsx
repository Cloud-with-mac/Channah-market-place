'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { ArrowRight, ShoppingBag } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { CartItem } from './cart-item'
import { CartEmpty } from './cart-empty'
import { useCartStore, useCurrencyStore } from '@/store'

export function CartDrawer() {
  const {
    items,
    subtotal,
    total,
    itemCount,
    discountAmount,
    couponCode,
    isOpen,
    closeCart,
    fetchCart,
    updateQuantity,
    removeItem,
  } = useCartStore()
  const { convertAndFormat } = useCurrencyStore()

  // Sync with backend when drawer opens
  useEffect(() => {
    if (isOpen) fetchCart()
  }, [isOpen, fetchCart])

  const freeShipping = subtotal >= 50

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && closeCart()}>
      <SheetContent className="flex flex-col w-full sm:max-w-md">
        <SheetHeader className="space-y-0 pb-4">
          <SheetTitle className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" />
            Shopping Cart
            {itemCount > 0 && (
              <span className="text-sm font-normal text-muted-foreground">
                ({itemCount} {itemCount === 1 ? 'item' : 'items'})
              </span>
            )}
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <CartEmpty showButton={false} />
        ) : (
          <>
            {/* Free Shipping Progress */}
            {!freeShipping && (
              <div className="mb-4">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">
                    Add {convertAndFormat(50 - subtotal)} more for free shipping
                  </span>
                  <span className="font-medium">{convertAndFormat(subtotal)} / {convertAndFormat(50)}</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, (subtotal / 50) * 100)}%` }}
                  />
                </div>
              </div>
            )}

            {/* Cart Items */}
            <ScrollArea className="flex-1 -mx-6 px-6">
              <div className="divide-y">
                {items.map((item, index) => (
                  <CartItem
                    key={`${item.id}-${item.variantId || index}`}
                    item={item}
                    onUpdateQuantity={updateQuantity}
                    onRemove={removeItem}
                    compact
                  />
                ))}
              </div>
            </ScrollArea>

            {/* Summary */}
            <div className="pt-4 border-t mt-auto">
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{convertAndFormat(subtotal)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount {couponCode && `(${couponCode})`}</span>
                    <span>-{convertAndFormat(discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Shipping</span>
                  <span>
                    {freeShipping ? (
                      <span className="text-green-600">Free</span>
                    ) : (
                      'Calculated at checkout'
                    )}
                  </span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between font-semibold">
                  <span>Estimated Total</span>
                  <span>{convertAndFormat(total)}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Button className="w-full" size="lg" asChild onClick={closeCart}>
                  <Link href="/checkout">
                    Checkout
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  asChild
                  onClick={closeCart}
                >
                  <Link href="/cart">View Cart</Link>
                </Button>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
