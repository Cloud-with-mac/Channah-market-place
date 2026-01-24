'use client'

import Link from 'next/link'
import { Star, Store, Check, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { PriceDisplay } from '@/components/ui/price-display'
import { StarRating } from '@/components/ui/star-rating'

interface ProductInfoProps {
  name: string
  price: number
  compareAtPrice?: number | null
  rating: number
  reviewCount: number
  vendor: {
    name: string
    slug: string
  }
  sku?: string
  inStock: boolean
  stockQuantity?: number
  category?: {
    name: string
    slug: string
  }
}

export function ProductInfo({
  name,
  price,
  compareAtPrice,
  rating,
  reviewCount,
  vendor,
  sku,
  inStock,
  stockQuantity,
  category,
}: ProductInfoProps) {
  return (
    <div className="space-y-4">
      {/* Category */}
      {category && (
        <Link
          href={`/category/${category.slug}`}
          className="text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          {category.name}
        </Link>
      )}

      {/* Product Name */}
      <h1 className="text-2xl md:text-3xl font-bold font-display">{name}</h1>

      {/* Rating & Reviews */}
      <div className="flex items-center gap-3">
        <StarRating rating={rating} showValue />
        <span className="text-sm text-muted-foreground">
          ({reviewCount} {reviewCount === 1 ? 'review' : 'reviews'})
        </span>
      </div>

      {/* Price */}
      <PriceDisplay
        price={price}
        compareAtPrice={compareAtPrice}
        size="xl"
        showDiscount
      />

      {/* Stock Status */}
      <div className="flex items-center gap-2">
        {inStock ? (
          <>
            <div className="flex items-center gap-1.5 text-green-600">
              <Check className="h-4 w-4" />
              <span className="text-sm font-medium">In Stock</span>
            </div>
            {stockQuantity && stockQuantity <= 10 && (
              <Badge variant="warning" className="text-xs">
                Only {stockQuantity} left
              </Badge>
            )}
          </>
        ) : (
          <div className="flex items-center gap-1.5 text-destructive">
            <X className="h-4 w-4" />
            <span className="text-sm font-medium">Out of Stock</span>
          </div>
        )}
      </div>

      {/* Vendor */}
      <Link
        href={`/vendor/${vendor.slug}`}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group"
      >
        <div className="p-1.5 rounded-full bg-muted group-hover:bg-primary/10 transition-colors">
          <Store className="h-3.5 w-3.5" />
        </div>
        <span>
          Sold by <span className="font-medium text-foreground">{vendor.name}</span>
        </span>
      </Link>

      {/* SKU */}
      {sku && (
        <p className="text-xs text-muted-foreground">
          SKU: <span className="font-mono">{sku}</span>
        </p>
      )}
    </div>
  )
}
