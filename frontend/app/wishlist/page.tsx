'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Heart, ShoppingCart, Trash2, ArrowRight, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useWishlistStore, useCartStore, useAuthStore } from '@/store'

export default function WishlistPage() {
  const router = useRouter()
  const { isAuthenticated } = useAuthStore()
  const { items, removeItem, clearWishlist } = useWishlistStore()
  const { addItem: addToCart } = useCartStore()

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login?redirect=/wishlist')
    }
  }, [isAuthenticated, router])

  const handleAddToCart = (item: any) => {
    addToCart({
      id: item.id,
      name: item.name,
      price: item.price,
      image: item.image,
      quantity: 1,
      slug: item.slug,
    })
  }

  if (!isAuthenticated) {
    return null
  }

  if (items.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <div className="text-center">
          <div className="p-6 rounded-full bg-cyan/10 w-fit mx-auto mb-6">
            <Heart className="h-16 w-16 text-cyan" />
          </div>
          <h1 className="text-2xl font-bold font-display mb-2">Your Wishlist is Empty</h1>
          <p className="text-muted-foreground mb-8 max-w-md">
            Start adding items you love to your wishlist. They'll be saved here for you to purchase later.
          </p>
          <Link href="/products">
            <Button className="bg-gradient-to-r from-cyan to-cyan-light text-navy hover:opacity-90">
              Browse Products
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold font-display">My Wishlist</h1>
          <p className="text-muted-foreground">{items.length} item{items.length !== 1 ? 's' : ''} saved</p>
        </div>
        <Button
          variant="outline"
          onClick={clearWishlist}
          className="text-destructive hover:text-destructive border-destructive/30 hover:border-destructive"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Clear All
        </Button>
      </div>

      {/* Wishlist Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {items.map((item) => (
          <div
            key={item.id}
            className="bg-card border border-border rounded-xl overflow-hidden group hover:border-cyan/30 transition-colors"
          >
            {/* Product Image */}
            <Link href={`/product/${item.slug}`} className="block relative aspect-square bg-navy-light">
              {item.image ? (
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Package className="h-16 w-16 text-muted-foreground/30" />
                </div>
              )}
              {item.compareAtPrice && item.compareAtPrice > item.price && (
                <Badge className="absolute top-2 left-2 bg-red-500 text-white border-0">
                  {Math.round((1 - item.price / item.compareAtPrice) * 100)}% OFF
                </Badge>
              )}
            </Link>

            {/* Product Info */}
            <div className="p-4">
              <Link href={`/product/${item.slug}`}>
                <h3 className="font-medium line-clamp-2 hover:text-cyan transition-colors mb-2">
                  {item.name}
                </h3>
              </Link>

              <div className="flex items-center gap-2 mb-4">
                <span className="text-lg font-bold text-cyan">
                  £{item.price.toFixed(2)}
                </span>
                {item.compareAtPrice && item.compareAtPrice > item.price && (
                  <span className="text-sm text-muted-foreground line-through">
                    £{item.compareAtPrice.toFixed(2)}
                  </span>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  className="flex-1 bg-gradient-to-r from-cyan to-cyan-light text-navy hover:opacity-90"
                  onClick={() => handleAddToCart(item)}
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Add to Cart
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => removeItem(item.id)}
                  className="text-destructive hover:text-destructive border-destructive/30 hover:border-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
