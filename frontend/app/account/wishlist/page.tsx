'use client'

import * as React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Heart, ShoppingCart, Trash2, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useWishlistStore, useCartStore } from '@/store'
import { formatPrice } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

export default function WishlistPage() {
  const { items, removeItem, clearWishlist } = useWishlistStore()
  const { addItem: addToCart } = useCartStore()
  const { toast } = useToast()

  const handleAddToCart = (item: typeof items[0]) => {
    addToCart({
      productId: item.productId,
      name: item.name,
      slug: item.slug,
      price: item.price,
      image: item.image || '',
      quantity: 1,
    })
    toast({
      title: 'Added to cart',
      description: `${item.name} has been added to your cart.`,
    })
  }

  const handleRemove = (productId: string, name: string) => {
    removeItem(productId)
    toast({
      title: 'Removed from wishlist',
      description: `${name} has been removed from your wishlist.`,
    })
  }

  const handleClearAll = () => {
    clearWishlist()
    toast({
      title: 'Wishlist cleared',
      description: 'All items have been removed from your wishlist.',
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display">My Wishlist</h1>
          <p className="text-muted-foreground mt-1">
            {items.length} item{items.length !== 1 ? 's' : ''} saved
          </p>
        </div>
        {items.length > 0 && (
          <Button variant="outline" onClick={handleClearAll}>
            <Trash2 className="mr-2 h-4 w-4" />
            Clear All
          </Button>
        )}
      </div>

      {items.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Heart className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-semibold">Your wishlist is empty</h3>
            <p className="mt-2 text-muted-foreground">
              Save items you love to your wishlist and shop them later.
            </p>
            <Button asChild className="mt-4">
              <Link href="/products">Browse Products</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <Card key={item.productId} className="overflow-hidden group">
              <div className="relative aspect-square bg-muted">
                {item.image ? (
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    className="object-cover transition-transform group-hover:scale-105"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center">
                    <Package className="h-12 w-12 text-muted-foreground/50" />
                  </div>
                )}

                {/* Remove button */}
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => handleRemove(item.productId, item.name)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>

                {/* Discount badge */}
                {item.compareAtPrice && item.compareAtPrice > item.price && (
                  <Badge className="absolute top-2 left-2 bg-destructive">
                    -{Math.round((1 - item.price / item.compareAtPrice) * 100)}%
                  </Badge>
                )}
              </div>

              <CardContent className="p-4">
                <Link
                  href={`/product/${item.slug}`}
                  className="font-medium hover:text-primary transition-colors line-clamp-2"
                >
                  {item.name}
                </Link>

                <div className="flex items-center gap-2 mt-2">
                  <span className="font-semibold text-lg">
                    {formatPrice(item.price)}
                  </span>
                  {item.compareAtPrice && item.compareAtPrice > item.price && (
                    <span className="text-sm text-muted-foreground line-through">
                      {formatPrice(item.compareAtPrice)}
                    </span>
                  )}
                </div>

                <Button
                  className="w-full mt-4"
                  onClick={() => handleAddToCart(item)}
                >
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Add to Cart
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
