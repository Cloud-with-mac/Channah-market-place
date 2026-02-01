'use client'

import { X, ShoppingBag, Trash2, ArrowRight, Info } from 'lucide-react'
import { useSampleCartStore } from '@/store/sample-cart-store'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { PriceDisplay } from '@/components/ui/price-display'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from '@/hooks/use-toast'

export function SampleCartDrawer() {
  const router = useRouter()
  const { items, isOpen, closeCart, removeItem, updateQuantity, total, itemCount } =
    useSampleCartStore()

  if (!isOpen) return null

  const handleCheckout = () => {
    if (items.length === 0) return

    closeCart()
    router.push('/samples/checkout')
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50 animate-fade-in"
        onClick={closeCart}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-background shadow-2xl z-50 flex flex-col animate-slide-in-right">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <ShoppingBag className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Sample Cart</h2>
              <p className="text-xs text-white/80">
                {itemCount} {itemCount === 1 ? 'sample' : 'samples'}
              </p>
            </div>
          </div>
          <button
            onClick={closeCart}
            className="p-2 hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Info Banner */}
        <div className="px-6 py-3 bg-blue-50 dark:bg-blue-950/20 border-b border-blue-200 dark:border-blue-800">
          <div className="flex items-start gap-2 text-sm">
            <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-blue-700 dark:text-blue-300">
              Samples help you evaluate products before bulk orders. Sample prices include
              shipping and handling.
            </p>
          </div>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-6">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="p-4 bg-muted rounded-full mb-4">
                <ShoppingBag className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground mb-2">Your sample cart is empty</p>
              <p className="text-xs text-muted-foreground mb-6">
                Add samples from product pages to test before ordering
              </p>
              <Button onClick={closeCart} variant="outline">
                Browse Products
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-4 p-4 border border-border rounded-xl hover:border-primary/50 transition-colors"
                >
                  {/* Image */}
                  <Link
                    href={`/product/${item.slug}`}
                    className="w-20 h-20 rounded-lg overflow-hidden bg-muted flex-shrink-0"
                    onClick={closeCart}
                  >
                    {item.image && (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </Link>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/product/${item.slug}`}
                      className="font-semibold text-sm hover:text-primary transition-colors line-clamp-2 mb-1"
                      onClick={closeCart}
                    >
                      {item.name}
                    </Link>

                    <Link
                      href={`/vendor/${item.vendorSlug}`}
                      className="text-xs text-muted-foreground hover:text-primary transition-colors block mb-2"
                      onClick={closeCart}
                    >
                      {item.vendorName}
                    </Link>

                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <PriceDisplay price={item.price} size="sm" />
                        <p className="text-xs text-muted-foreground">
                          Sample price (regular: ${item.basePrice.toFixed(2)})
                        </p>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center gap-2">
                        <div className="flex items-center border border-border rounded-lg">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                            className="px-2 py-1 hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            -
                          </button>
                          <span className="px-3 py-1 text-sm font-medium min-w-[2rem] text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            disabled={item.quantity >= item.maxSamples}
                            className="px-2 py-1 hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            +
                          </button>
                        </div>

                        <button
                          onClick={() => {
                            removeItem(item.id)
                            toast({ title: 'Sample removed from cart' })
                          }}
                          className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {item.quantity >= item.maxSamples && (
                      <p className="text-xs text-amber-600 mt-2">
                        Maximum {item.maxSamples} samples per product
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <>
            <Separator />
            <div className="p-6 space-y-4">
              {/* Total */}
              <div className="flex items-center justify-between">
                <span className="font-semibold">Total</span>
                <div className="text-right">
                  <PriceDisplay price={total} size="lg" className="font-bold" />
                  <p className="text-xs text-muted-foreground">
                    {itemCount} {itemCount === 1 ? 'sample' : 'samples'}
                  </p>
                </div>
              </div>

              {/* Checkout Button */}
              <Button
                onClick={handleCheckout}
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-90"
                size="lg"
              >
                Proceed to Checkout
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>

              {/* Continue Shopping */}
              <Button onClick={closeCart} variant="outline" className="w-full">
                Continue Shopping
              </Button>

              {/* Info */}
              <p className="text-xs text-center text-muted-foreground">
                Samples ship separately from bulk orders
              </p>
            </div>
          </>
        )}
      </div>
    </>
  )
}
