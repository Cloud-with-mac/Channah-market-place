'use client'

import * as React from 'react'
import { Heart, ShoppingCart, Share2, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { QuantitySelector } from './quantity-selector'
import { useCartStore, useWishlistStore } from '@/store'
import { cn } from '@/lib/utils'

interface VariantInfo {
  name: string
  options: Array<{ id: string; value: string; available: boolean }>
}

interface AddToCartSectionProps {
  productId: string
  productName: string
  productSlug: string
  price: number
  compareAtPrice?: number
  image: string
  inStock: boolean
  maxQuantity?: number
  selectedVariantId?: string
  variants?: VariantInfo[]
  selectedVariants?: Record<string, string>
}

export function AddToCartSection({
  productId,
  productName,
  productSlug,
  price,
  compareAtPrice,
  image,
  inStock,
  maxQuantity = 99,
  selectedVariantId,
  variants = [],
  selectedVariants = {},
}: AddToCartSectionProps) {
  const [quantity, setQuantity] = React.useState(1)
  const [isAddingToCart, setIsAddingToCart] = React.useState(false)
  const [addedToCart, setAddedToCart] = React.useState(false)
  const [showVariantError, setShowVariantError] = React.useState(false)

  const { addItem: addToCart } = useCartStore()
  const { addItem: addToWishlist, removeItem: removeFromWishlist, isInWishlist } = useWishlistStore()

  const isWishlisted = isInWishlist(productId)

  // Check if all required variants are selected
  const missingVariants = React.useMemo(() => {
    if (variants.length === 0) return []
    return variants
      .filter(v => v.options.length > 0) // Only check variants that have options
      .filter(v => !selectedVariants[v.name]) // Find those without selection
      .map(v => v.name)
  }, [variants, selectedVariants])

  const allVariantsSelected = missingVariants.length === 0

  const handleAddToCart = async () => {
    if (!inStock) return

    // Check if variants need to be selected
    if (variants.length > 0 && !allVariantsSelected) {
      setShowVariantError(true)
      // Clear error after 3 seconds
      setTimeout(() => setShowVariantError(false), 3000)
      return
    }

    setIsAddingToCart(true)
    try {
      // Add to cart store
      addToCart({
        id: productId,
        name: productName,
        price,
        image,
        quantity,
        variantId: selectedVariantId,
      })

      setAddedToCart(true)
      setTimeout(() => setAddedToCart(false), 2000)
    } catch (error) {
      console.error('Failed to add to cart:', error)
    } finally {
      setIsAddingToCart(false)
    }
  }

  const handleToggleWishlist = () => {
    if (isWishlisted) {
      removeFromWishlist(productId)
    } else {
      addToWishlist({
        id: `wishlist-${productId}`,
        productId,
        name: productName,
        slug: productSlug,
        price,
        compareAtPrice,
        image,
      })
    }
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: productName,
          url: window.location.href,
        })
      } catch (error) {
        // User cancelled or share failed
      }
    } else {
      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(window.location.href)
      alert('Link copied to clipboard!')
    }
  }

  return (
    <div className="space-y-4">
      {/* Variant Selection Error */}
      {showVariantError && missingVariants.length > 0 && (
        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
          Please select {missingVariants.join(' and ')} before adding to cart
        </div>
      )}

      {/* Quantity Selector */}
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium">Quantity:</span>
        <QuantitySelector
          value={quantity}
          onChange={setQuantity}
          min={1}
          max={maxQuantity}
          disabled={!inStock}
        />
      </div>

      {/* Add to Cart Button */}
      <div className="flex gap-3">
        <Button
          size="lg"
          className={cn(
            'flex-1 gap-2',
            addedToCart && 'bg-green-600 hover:bg-green-600',
            showVariantError && 'animate-shake'
          )}
          onClick={handleAddToCart}
          disabled={!inStock || isAddingToCart}
        >
          {addedToCart ? (
            <>
              <Check className="h-5 w-5" />
              Added to Cart
            </>
          ) : (
            <>
              <ShoppingCart className="h-5 w-5" />
              {!inStock ? 'Out of Stock' : variants.length > 0 && !allVariantsSelected ? `Select ${missingVariants[0]}` : 'Add to Cart'}
            </>
          )}
        </Button>

        <Button
          size="lg"
          variant="outline"
          className={cn(
            'px-4',
            isWishlisted && 'text-red-500 border-red-200 hover:text-red-600 hover:border-red-300'
          )}
          onClick={handleToggleWishlist}
        >
          <Heart className={cn('h-5 w-5', isWishlisted && 'fill-current')} />
        </Button>

        <Button
          size="lg"
          variant="outline"
          className="px-4"
          onClick={handleShare}
        >
          <Share2 className="h-5 w-5" />
        </Button>
      </div>

      {/* Buy Now Button */}
      {inStock && (
        <Button
          size="lg"
          variant="secondary"
          className="w-full"
          onClick={() => {
            handleAddToCart()
            // Navigate to checkout
            window.location.href = '/checkout'
          }}
        >
          Buy Now
        </Button>
      )}
    </div>
  )
}
