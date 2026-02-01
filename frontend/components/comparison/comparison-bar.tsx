'use client'

import { useRouter } from 'next/navigation'
import { X, ArrowRight, Scale } from 'lucide-react'
import { useComparisonStore } from '@/store/comparison-store'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export function ComparisonBar() {
  const router = useRouter()
  const { products, removeProduct, clearComparison } = useComparisonStore()

  if (products.length === 0) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t-2 border-primary bg-background shadow-2xl animate-slide-in-bottom">
      <div className="container">
        <div className="flex items-center gap-4 py-4">
          {/* Title */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary/10">
              <Scale className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-bold text-sm">Compare Products</h3>
              <p className="text-xs text-muted-foreground">
                {products.length} of 4 products
              </p>
            </div>
          </div>

          {/* Product Thumbnails */}
          <div className="flex items-center gap-2 flex-1 min-w-0 overflow-x-auto">
            {products.map((product) => (
              <div
                key={product.id}
                className="relative group flex-shrink-0"
              >
                <div className="h-16 w-16 rounded-lg border-2 border-border overflow-hidden bg-muted">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="h-full w-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                  />
                </div>
                <button
                  onClick={() => removeProduct(product.id)}
                  className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                  aria-label="Remove from comparison"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}

            {/* Empty slots */}
            {Array.from({ length: 4 - products.length }).map((_, i) => (
              <div
                key={`empty-${i}`}
                className="h-16 w-16 rounded-lg border-2 border-dashed border-border bg-muted/50 flex items-center justify-center flex-shrink-0"
              >
                <span className="text-xs text-muted-foreground">+</span>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={clearComparison}
            >
              Clear All
            </Button>
            <Button
              size="sm"
              onClick={() => router.push('/compare')}
              disabled={products.length < 2}
            >
              Compare
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
