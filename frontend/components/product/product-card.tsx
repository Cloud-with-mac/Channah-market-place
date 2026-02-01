'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Heart, ShoppingCart, Star, Eye, Zap, TrendingUp, Package, LogIn, Scale } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { calculateDiscount, cn } from '@/lib/utils'
import { useCartStore, useWishlistStore, useAuthStore } from '@/store'
import { useComparisonStore } from '@/store/comparison-store'
import { toast } from '@/hooks/use-toast'
import { usePrices } from '@/hooks/use-price'
import { QuickViewModal } from './quick-view-modal'

interface Product {
  id: string
  name: string
  slug: string
  price: number
  compareAtPrice?: number
  image: string
  rating: number
  reviewCount: number
  vendorName?: string
  salesCount?: number
  isNew?: boolean
  isTrending?: boolean
}

interface ProductCardProps {
  product: Product
  variant?: 'default' | 'compact' | 'horizontal'
  showQuickView?: boolean
}

export function ProductCard({ product, variant = 'default', showQuickView = true }: ProductCardProps) {
  const [quickViewOpen, setQuickViewOpen] = useState(false)
  const router = useRouter()
  const { addItem: addToCart, openCart } = useCartStore()
  const { addItem, removeItem, isInWishlist } = useWishlistStore()
  const { isAuthenticated } = useAuthStore()
  const { addProduct: addToComparison, removeProduct: removeFromComparison, isInComparison, products: comparisonProducts } = useComparisonStore()
  const { formattedPrice, formattedComparePrice } = usePrices(product.price, product.compareAtPrice)
  const isWishlisted = isInWishlist(product.id)
  const isComparing = isInComparison(product.id)
  const discountInfo = product.compareAtPrice
    ? calculateDiscount(product.price, product.compareAtPrice)
    : { amount: 0, percentage: 0 }
  const discount = discountInfo.percentage

  // Use slug if available, otherwise fall back to product ID
  const productSlug = product.slug || product.id

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!isAuthenticated) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to add items to your cart',
        variant: 'destructive',
      })
      router.push(`/login?redirect=${encodeURIComponent(`/product/${productSlug}`)}`)
      return
    }

    try {
      await addToCart({
        id: product.id,
        productId: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        quantity: 1,
      })
      openCart()
      toast({
        title: 'Added to cart',
        description: `${product.name} has been added to your cart`,
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to add item to cart. Please try again.',
        variant: 'destructive',
      })
    }
  }

  const handleToggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!isAuthenticated) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to save items to your wishlist',
        variant: 'destructive',
      })
      router.push(`/login?redirect=${encodeURIComponent(`/product/${productSlug}`)}`)
      return
    }

    try {
      if (isWishlisted) {
        await removeItem(product.id)
        toast({ title: 'Removed from wishlist' })
      } else {
        await addItem({
          id: `wishlist-${product.id}`,
          productId: product.id,
          name: product.name,
          slug: productSlug,
          price: product.price,
          compareAtPrice: product.compareAtPrice,
          image: product.image,
        })
        toast({ title: 'Added to wishlist' })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update wishlist. Please try again.',
        variant: 'destructive',
      })
    }
  }

  const handleToggleComparison = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (isComparing) {
      removeFromComparison(product.id)
      toast({ title: 'Removed from comparison' })
    } else {
      if (comparisonProducts.length >= 4) {
        toast({
          title: 'Comparison limit reached',
          description: 'You can compare up to 4 products at a time',
          variant: 'destructive',
        })
        return
      }

      addToComparison({
        id: product.id,
        name: product.name,
        slug: productSlug,
        price: product.price,
        compareAtPrice: product.compareAtPrice,
        image: product.image,
        rating: product.rating,
        reviewCount: product.reviewCount,
        vendor: {
          name: product.vendorName || 'Unknown Vendor',
          slug: 'vendor',
        },
      })
      toast({
        title: 'Added to comparison',
        description: `${comparisonProducts.length + 1} of 4 products`,
      })
    }
  }

  // Check if image is valid
  const hasValidImage = product.image && !product.image.includes('undefined') && product.image.startsWith('http')

  if (variant === 'horizontal') {
    return (
      <Link
        href={`/product/${productSlug}`}
        className="group flex gap-4 rounded-xl border bg-card p-4 hover:shadow-lg transition-all duration-300"
      >
        <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
          {hasValidImage ? (
            <Image
              src={product.image}
              alt={product.name}
              fill
              className="object-cover"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <Package className="h-8 w-8 text-muted-foreground" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm line-clamp-1">{product.name}</h3>
          <p className="text-xs text-muted-foreground mb-1">{product.vendorName}</p>
          <div className="flex items-center gap-1 mb-1">
            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
            <span className="text-xs">{product.rating}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-primary">{formattedPrice}</span>
            {formattedComparePrice && (
              <span className="text-xs text-muted-foreground line-through">
                {formattedComparePrice}
              </span>
            )}
          </div>
        </div>
      </Link>
    )
  }

  return (
    <Link
      href={`/product/${productSlug}`}
      className="group product-card block rounded-2xl border border-border/50 bg-card overflow-hidden hover:shadow-2xl hover:shadow-primary/10 hover:border-primary/30 transition-all duration-500"
    >
      {/* Image Container */}
      <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-muted/50 to-muted/30">
        {hasValidImage ? (
          <Image
            src={product.image}
            alt={product.name}
            fill
            className="object-cover transition-all duration-700 group-hover:scale-110"
            sizes="(max-width: 768px) 50vw, 25vw"
          />
        ) : (
          <div className="flex items-center justify-center h-full bg-gradient-to-br from-primary/5 to-accent/5">
            <Package className="h-16 w-16 text-muted-foreground/30" />
          </div>
        )}

        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {discount > 0 && (
            <Badge className="bg-gradient-to-r from-accent to-coral-dark text-white border-0 shadow-lg font-semibold">
              <Zap className="h-3 w-3 mr-1" />
              -{discount}%
            </Badge>
          )}
          {product.isNew && (
            <Badge className="bg-gradient-to-r from-primary to-indigo-dark text-white border-0 font-semibold">
              NEW
            </Badge>
          )}
          {product.isTrending && (
            <Badge className="bg-gradient-to-r from-accent to-primary text-white border-0 font-semibold">
              <TrendingUp className="h-3 w-3 mr-1" />
              HOT
            </Badge>
          )}
        </div>

        {/* Quick actions */}
        <div className="absolute top-3 right-3 flex flex-col gap-2">
          <button
            onClick={handleToggleWishlist}
            aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
            className={cn(
              'p-2.5 rounded-xl shadow-lg transition-all duration-300 transform',
              isWishlisted
                ? 'bg-gradient-to-r from-red-500 to-red-600 text-white scale-100'
                : 'bg-white/95 backdrop-blur-md text-gray-500 hover:bg-red-50 hover:text-red-500 scale-90 group-hover:scale-100'
            )}
          >
            <Heart className={cn('h-4 w-4', isWishlisted && 'fill-current')} />
          </button>
          <button
            onClick={handleToggleComparison}
            aria-label={isComparing ? 'Remove from comparison' : 'Add to comparison'}
            className={cn(
              'p-2.5 rounded-xl shadow-lg transition-all duration-300 transform',
              isComparing
                ? 'bg-gradient-to-r from-primary to-accent text-white scale-100'
                : 'bg-white/95 backdrop-blur-md text-gray-500 hover:bg-primary/10 hover:text-primary scale-90 group-hover:scale-100'
            )}
          >
            <Scale className="h-4 w-4" />
          </button>
          {showQuickView && (
            <button
              aria-label="Quick view"
              className="p-2.5 rounded-xl bg-white/95 backdrop-blur-md text-gray-500 shadow-lg hover:bg-primary hover:text-white transition-all duration-300 transform scale-90 group-hover:scale-100"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setQuickViewOpen(true)
              }}
            >
              <Eye className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Add to cart overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4 transform translate-y-full group-hover:translate-y-0 transition-transform duration-500">
          <Button
            onClick={handleAddToCart}
            className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-95 shadow-xl text-white font-semibold"
            size="sm"
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            Add to Cart
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Name */}
        <h3 className="font-semibold text-sm mb-2 line-clamp-2 min-h-[2.5rem] group-hover:text-primary transition-colors">
          {product.name}
        </h3>

        {/* Price */}
        <div className="flex items-center gap-2 mb-3">
          <span className="font-bold text-lg text-primary">
            {formattedPrice}
          </span>
          {formattedComparePrice && (
            <span className="text-sm text-muted-foreground line-through">
              {formattedComparePrice}
            </span>
          )}
        </div>

        {/* Rating */}
        <div className="flex items-center gap-1.5 mb-3">
          <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={cn(
                  'h-3.5 w-3.5',
                  star <= Math.round(product.rating)
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'fill-gray-200 text-gray-200'
                )}
              />
            ))}
          </div>
          <span className="text-xs font-medium text-muted-foreground">
            {product.rating}
          </span>
          {product.reviewCount > 0 && (
            <span className="text-xs text-muted-foreground">
              ({product.reviewCount})
            </span>
          )}
        </div>

        {/* Supplier Info - Alibaba Style */}
        <div className="pt-3 border-t border-border/50">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-6 w-6 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold text-primary">
                {product.vendorName?.charAt(0) || 'V'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-foreground truncate">
                {product.vendorName || 'Verified Supplier'}
              </p>
            </div>
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 border-primary/30 text-primary">
              Verified
            </Badge>
          </div>

          {product.salesCount && product.salesCount > 0 && (
            <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
              <span>{product.salesCount}+ sold</span>
              <span className="flex items-center gap-1">
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                <span className="font-medium text-foreground">{product.rating}</span>
              </span>
            </div>
          )}
        </div>
      </div>
      <QuickViewModal productSlug={product.slug} open={quickViewOpen} onOpenChange={setQuickViewOpen} />
    </Link>
  )
}
