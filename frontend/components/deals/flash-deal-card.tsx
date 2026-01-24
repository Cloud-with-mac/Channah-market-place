'use client'

import * as React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ShoppingCart, Heart, Zap } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { CountdownTimer } from './countdown-timer'
import { cn } from '@/lib/utils'
import { useCartStore, useWishlistStore } from '@/store'
import { usePrices } from '@/hooks/use-price'

interface FlashDealCardProps {
  product: {
    id: string
    name: string
    slug: string
    price: number
    compare_at_price?: number
    primary_image?: string
    quantity: number
    sold?: number
  }
  deal: {
    end_date: string
    discount_percent: number
    total_quantity: number
    sold_quantity: number
  }
  className?: string
}

export function FlashDealCard({ product, deal, className }: FlashDealCardProps) {
  const { addItem } = useCartStore()
  const { addItem: addToWishlist, removeItem: removeFromWishlist, isInWishlist } = useWishlistStore()
  const isWishlisted = isInWishlist(product.id)

  const discountedPrice = product.compare_at_price
    ? product.price
    : product.price * (1 - deal.discount_percent / 100)

  const originalPrice = product.compare_at_price || product.price
  const { formattedPrice, formattedComparePrice } = usePrices(discountedPrice, originalPrice)
  const soldPercentage = (deal.sold_quantity / deal.total_quantity) * 100
  const remaining = deal.total_quantity - deal.sold_quantity

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    addItem({
      id: product.id,
      name: product.name,
      price: discountedPrice,
      image: product.primary_image || '',
      quantity: 1,
    })
  }

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault()
    if (isWishlisted) {
      removeFromWishlist(product.id)
    } else {
      addToWishlist({
        id: `wishlist-${product.id}`,
        productId: product.id,
        name: product.name,
        slug: product.slug,
        price: discountedPrice,
        compareAtPrice: originalPrice,
        image: product.primary_image,
      })
    }
  }

  return (
    <Card className={cn('group overflow-hidden', className)}>
      <Link href={`/product/${product.slug}`}>
        <div className="relative">
          {/* Image */}
          <div className="relative aspect-square bg-muted">
            {product.primary_image ? (
              <Image
                src={product.primary_image}
                alt={product.name}
                fill
                className="object-cover transition-transform group-hover:scale-105"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <Zap className="h-12 w-12 text-muted-foreground/50" />
              </div>
            )}
          </div>

          {/* Discount Badge */}
          <Badge className="absolute top-2 left-2 bg-destructive text-destructive-foreground">
            <Zap className="h-3 w-3 mr-1" />
            {deal.discount_percent}% OFF
          </Badge>

          {/* Wishlist Button */}
          <Button
            variant="secondary"
            size="icon"
            className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={handleWishlist}
          >
            <Heart
              className={cn('h-4 w-4', isWishlisted && 'fill-red-500 text-red-500')}
            />
          </Button>
        </div>

        <CardContent className="p-4 space-y-3">
          {/* Countdown */}
          <div className="flex items-center justify-center">
            <CountdownTimer endDate={deal.end_date} size="sm" />
          </div>

          {/* Name */}
          <h3 className="font-medium line-clamp-2 min-h-[2.5rem]">
            {product.name}
          </h3>

          {/* Price */}
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-primary">
              {formattedPrice}
            </span>
            <span className="text-sm text-muted-foreground line-through">
              {formattedComparePrice}
            </span>
          </div>

          {/* Progress */}
          <div className="space-y-1">
            <Progress value={soldPercentage} className="h-2" />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{deal.sold_quantity} sold</span>
              <span>{remaining} left</span>
            </div>
          </div>

          {/* Add to Cart */}
          <Button
            className="w-full"
            size="sm"
            onClick={handleAddToCart}
            disabled={remaining <= 0}
          >
            <ShoppingCart className="mr-2 h-4 w-4" />
            {remaining <= 0 ? 'Sold Out' : 'Add to Cart'}
          </Button>
        </CardContent>
      </Link>
    </Card>
  )
}
