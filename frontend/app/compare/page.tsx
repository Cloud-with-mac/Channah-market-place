'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { X, Check, AlertCircle, ArrowLeft, Download, Share2, ShoppingCart } from 'lucide-react'
import { useComparisonStore } from '@/store/comparison-store'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { PriceDisplay } from '@/components/ui/price-display'
import { StarRating } from '@/components/ui/star-rating'
import { useCartStore } from '@/store'

export default function ComparePage() {
  const router = useRouter()
  const { products, removeProduct, clearComparison } = useComparisonStore()
  const { addItem } = useCartStore()

  // Redirect if less than 2 products
  if (products.length < 2) {
    return (
      <div className="container py-16">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Not Enough Products</h1>
          <p className="text-muted-foreground mb-6">
            Add at least 2 products to compare
          </p>
          <Button onClick={() => router.push('/products')}>
            Browse Products
          </Button>
        </div>
      </div>
    )
  }

  // Collect all unique specification keys
  const allSpecKeys = new Set<string>()
  products.forEach((product) => {
    if (product.specifications) {
      Object.keys(product.specifications).forEach((key) => allSpecKeys.add(key))
    }
  })

  const specificationKeys = Array.from(allSpecKeys)

  const handleAddToCart = (product: any) => {
    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      quantity: product.moq || 1,
      slug: product.slug,
    })
  }

  return (
    <div className="container py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold font-display">Product Comparison</h1>
            <p className="text-muted-foreground">
              Comparing {products.length} products
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
          <Button variant="outline" size="sm" onClick={clearComparison}>
            Clear All
          </Button>
        </div>
      </div>

      {/* Comparison Table */}
      <Card className="overflow-hidden border-2">
        <div className="overflow-x-auto">
          <table className="w-full">
            <tbody>
              {/* Product Images & Names */}
              <tr className="border-b bg-muted/30">
                <td className="p-4 font-semibold w-48 sticky left-0 bg-muted/30 z-10">
                  Product
                </td>
                {products.map((product) => (
                  <td key={product.id} className="p-4 min-w-[250px]">
                    <div className="relative">
                      <button
                        onClick={() => removeProduct(product.id)}
                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center shadow-md hover:bg-destructive/90 transition-colors z-10"
                        aria-label="Remove from comparison"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>

                      <Link href={`/product/${product.slug}`}>
                        <div className="aspect-square rounded-lg overflow-hidden bg-muted mb-3 group">
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        </div>
                      </Link>

                      <Link href={`/product/${product.slug}`}>
                        <h3 className="font-semibold text-sm hover:text-primary transition-colors line-clamp-2">
                          {product.name}
                        </h3>
                      </Link>

                      {product.category && (
                        <Badge variant="secondary" className="mt-2 text-xs">
                          {product.category.name}
                        </Badge>
                      )}
                    </div>
                  </td>
                ))}
              </tr>

              {/* Price */}
              <tr className="border-b hover:bg-muted/50 transition-colors">
                <td className="p-4 font-semibold sticky left-0 bg-background">
                  Price
                </td>
                {products.map((product) => (
                  <td key={product.id} className="p-4">
                    <PriceDisplay
                      price={product.price}
                      compareAtPrice={product.compareAtPrice}
                      size="lg"
                      showDiscount
                    />
                  </td>
                ))}
              </tr>

              {/* Rating */}
              <tr className="border-b hover:bg-muted/50 transition-colors">
                <td className="p-4 font-semibold sticky left-0 bg-background">
                  Rating
                </td>
                {products.map((product) => (
                  <td key={product.id} className="p-4">
                    <div className="space-y-1">
                      <StarRating rating={product.rating} />
                      <p className="text-xs text-muted-foreground">
                        {product.reviewCount} reviews
                      </p>
                    </div>
                  </td>
                ))}
              </tr>

              {/* Supplier */}
              <tr className="border-b hover:bg-muted/50 transition-colors">
                <td className="p-4 font-semibold sticky left-0 bg-background">
                  Supplier
                </td>
                {products.map((product) => (
                  <td key={product.id} className="p-4">
                    <Link
                      href={`/vendor/${product.vendor.slug}`}
                      className="font-medium hover:text-primary transition-colors"
                    >
                      {product.vendor.name}
                    </Link>
                    {product.vendor.verified && (
                      <Badge variant="secondary" className="mt-2 text-xs">
                        <Check className="h-3 w-3 mr-1" />
                        Verified
                      </Badge>
                    )}
                  </td>
                ))}
              </tr>

              {/* MOQ */}
              <tr className="border-b hover:bg-muted/50 transition-colors">
                <td className="p-4 font-semibold sticky left-0 bg-background">
                  Min. Order Qty
                </td>
                {products.map((product) => (
                  <td key={product.id} className="p-4">
                    <span className="font-semibold">{product.moq || 1} units</span>
                  </td>
                ))}
              </tr>

              {/* Availability */}
              <tr className="border-b hover:bg-muted/50 transition-colors">
                <td className="p-4 font-semibold sticky left-0 bg-background">
                  Availability
                </td>
                {products.map((product) => (
                  <td key={product.id} className="p-4">
                    {product.inStock ? (
                      <Badge variant="secondary" className="bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300">
                        <Check className="h-3 w-3 mr-1" />
                        In Stock
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300">
                        Out of Stock
                      </Badge>
                    )}
                  </td>
                ))}
              </tr>

              {/* Specifications */}
              {specificationKeys.length > 0 && (
                <>
                  <tr className="bg-muted/50">
                    <td colSpan={products.length + 1} className="p-4">
                      <h3 className="font-bold text-sm uppercase tracking-wider">
                        Specifications
                      </h3>
                    </td>
                  </tr>

                  {specificationKeys.map((key) => (
                    <tr key={key} className="border-b hover:bg-muted/50 transition-colors">
                      <td className="p-4 font-semibold sticky left-0 bg-background capitalize">
                        {key.replace(/_/g, ' ')}
                      </td>
                      {products.map((product) => (
                        <td key={product.id} className="p-4">
                          {product.specifications?.[key] ? (
                            <span>{String(product.specifications[key])}</span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </>
              )}

              {/* Actions */}
              <tr className="bg-muted/30">
                <td className="p-4 font-semibold sticky left-0 bg-muted/30">
                  Actions
                </td>
                {products.map((product) => (
                  <td key={product.id} className="p-4">
                    <div className="space-y-2">
                      <Button
                        className="w-full"
                        onClick={() => handleAddToCart(product)}
                        disabled={!product.inStock}
                      >
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        Add to Cart
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full"
                        asChild
                      >
                        <Link href={`/product/${product.slug}`}>
                          View Details
                        </Link>
                      </Button>
                    </div>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      {/* Additional Info */}
      <div className="mt-8 p-6 rounded-lg bg-primary/5 border border-primary/20">
        <h3 className="font-bold mb-2">Need Help Deciding?</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Contact our B2B specialists for personalized recommendations and bulk pricing options.
        </p>
        <Button variant="outline" size="sm">
          Contact Support
        </Button>
      </div>
    </div>
  )
}
