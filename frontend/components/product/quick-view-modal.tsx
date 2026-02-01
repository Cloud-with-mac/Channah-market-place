'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Star, ShoppingCart, Heart, Loader2, Package, Truck } from 'lucide-react'
import { productsAPI } from '@/lib/api'
import { useCartStore, useAuthStore } from '@/store'
import { useToast } from '@/hooks/use-toast'

interface QuickViewModalProps {
  productSlug: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function QuickViewModal({ productSlug, open, onOpenChange }: QuickViewModalProps) {
  const [product, setProduct] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [quantity, setQuantity] = useState(1)
  const { addItem } = useCartStore()
  const { isAuthenticated } = useAuthStore()
  const { toast } = useToast()

  useEffect(() => {
    if (open && productSlug) {
      setIsLoading(true)
      setQuantity(1)
      productsAPI.getBySlug(productSlug)
        .then((data: any) => setProduct(data))
        .catch(() => setProduct(null))
        .finally(() => setIsLoading(false))
    }
  }, [open, productSlug])

  const handleAddToCart = () => {
    if (!isAuthenticated) {
      toast({ title: 'Please log in', description: 'You need to be logged in to add items to cart.', variant: 'destructive' })
      return
    }
    if (product) {
      addItem({ productId: product.id, name: product.name, price: Number(product.price), image: product.primary_image || product.images?.[0]?.url || '/placeholder.svg', quantity })
      toast({ title: 'Added to cart', description: `${product.name} added to your cart.` })
      onOpenChange(false)
    }
  }

  const discount = product?.compare_at_price && product.compare_at_price > product.price
    ? Math.round((1 - product.price / product.compare_at_price) * 100)
    : 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl p-0 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-80">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : product ? (
          <div className="grid md:grid-cols-2 gap-0">
            {/* Image */}
            <div className="relative aspect-square bg-muted">
              <Image
                src={product.primary_image || product.images?.[0]?.url || '/placeholder.svg'}
                alt={product.name}
                fill
                className="object-cover"
              />
              {discount > 0 && (
                <Badge className="absolute top-3 left-3 bg-red-500 text-white">-{discount}%</Badge>
              )}
            </div>
            {/* Details */}
            <div className="p-6 flex flex-col">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold leading-tight">{product.name}</DialogTitle>
              </DialogHeader>
              {/* Rating */}
              {product.rating && (
                <div className="flex items-center gap-1 mt-2">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`h-4 w-4 ${i < Math.round(product.rating) ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/30'}`} />
                  ))}
                  <span className="text-sm text-muted-foreground ml-1">({product.review_count || 0})</span>
                </div>
              )}
              {/* Price */}
              <div className="flex items-baseline gap-2 mt-4">
                <span className="text-2xl font-bold">${Number(product.price).toFixed(2)}</span>
                {discount > 0 && (
                  <span className="text-lg text-muted-foreground line-through">${Number(product.compare_at_price).toFixed(2)}</span>
                )}
              </div>
              {/* Description */}
              {product.short_description && (
                <p className="text-sm text-muted-foreground mt-3 line-clamp-3">{product.short_description}</p>
              )}
              {/* Stock */}
              <div className="flex items-center gap-2 mt-4 text-sm">
                <Package className="h-4 w-4 text-green-500" />
                <span>{product.quantity > 0 ? `${product.quantity} in stock` : 'Out of stock'}</span>
              </div>
              <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                <Truck className="h-4 w-4" />
                <span>Free shipping on orders over $50</span>
              </div>
              {/* Quantity + Add to cart */}
              <div className="mt-auto pt-6 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex items-center border rounded-lg">
                    <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setQuantity(Math.max(1, quantity - 1))}>-</Button>
                    <span className="w-10 text-center text-sm font-medium">{quantity}</span>
                    <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setQuantity(quantity + 1)}>+</Button>
                  </div>
                  <Button className="flex-1" onClick={handleAddToCart} disabled={product.quantity <= 0}>
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Add to Cart
                  </Button>
                </div>
                <Button variant="outline" className="w-full" asChild>
                  <Link href={`/product/${product.slug}`} onClick={() => onOpenChange(false)}>
                    View Full Details
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-80 text-muted-foreground">
            Product not found
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
