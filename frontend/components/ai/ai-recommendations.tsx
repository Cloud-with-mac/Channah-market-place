'use client'

import * as React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Sparkles, Package, ChevronLeft, ChevronRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { aiAPI } from '@/lib/api'
import { formatPrice } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface Product {
  id: string
  name: string
  slug: string
  price: number
  compare_at_price?: number
  image?: string
  rating: number
  review_count: number
  vendor_name?: string
}

interface AIRecommendationsProps {
  productId?: string
  categoryId?: string
  title?: string
  limit?: number
  className?: string
}

export function AIRecommendations({
  productId,
  categoryId,
  title = 'Recommended for You',
  limit = 8,
  className,
}: AIRecommendationsProps) {
  const [products, setProducts] = React.useState<Product[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const scrollRef = React.useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = React.useState(false)
  const [canScrollRight, setCanScrollRight] = React.useState(true)

  React.useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        const response = await aiAPI.getRecommendations(productId, categoryId, limit)
        setProducts(response.data || [])
      } catch (error) {
        console.error('Failed to fetch recommendations:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchRecommendations()
  }, [productId, categoryId, limit])

  const updateScrollButtons = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current
      setCanScrollLeft(scrollLeft > 0)
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10)
    }
  }

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 300
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      })
    }
  }

  React.useEffect(() => {
    updateScrollButtons()
    const ref = scrollRef.current
    if (ref) {
      ref.addEventListener('scroll', updateScrollButtons)
      return () => ref.removeEventListener('scroll', updateScrollButtons)
    }
  }, [products])

  if (isLoading) {
    return (
      <div className={cn('space-y-4', className)}>
        <div className="flex items-center gap-2">
          <Skeleton className="h-6 w-48" />
        </div>
        <div className="flex gap-4 overflow-hidden">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="w-[200px] flex-shrink-0">
              <CardContent className="p-0">
                <Skeleton className="h-[200px] w-full" />
                <div className="p-4 space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (products.length === 0) {
    return null
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-bold font-display">{title}</h2>
          <Badge variant="secondary" className="bg-primary/10 text-primary">
            AI Powered
          </Badge>
        </div>

        {/* Scroll Buttons */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => scroll('left')}
            disabled={!canScrollLeft}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => scroll('right')}
            disabled={!canScrollRight}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Products Carousel */}
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto scrollbar-hide pb-2"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {products.map((product) => {
          const discount = product.compare_at_price
            ? Math.round((1 - product.price / product.compare_at_price) * 100)
            : 0

          return (
            <Link
              key={product.id}
              href={`/product/${product.slug}`}
              className="flex-shrink-0 w-[200px]"
            >
              <Card className="h-full overflow-hidden group hover:shadow-lg transition-shadow">
                <CardContent className="p-0">
                  {/* Image */}
                  <div className="relative aspect-square bg-muted overflow-hidden">
                    {product.image ? (
                      <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        className="object-cover transition-transform group-hover:scale-105"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center">
                        <Package className="h-12 w-12 text-muted-foreground/50" />
                      </div>
                    )}

                    {/* Discount Badge */}
                    {discount > 0 && (
                      <Badge className="absolute top-2 left-2 bg-destructive">
                        -{discount}%
                      </Badge>
                    )}
                  </div>

                  {/* Details */}
                  <div className="p-3">
                    <h3 className="font-medium text-sm line-clamp-2 mb-1 group-hover:text-primary transition-colors">
                      {product.name}
                    </h3>

                    {product.vendor_name && (
                      <p className="text-xs text-muted-foreground mb-2">
                        by {product.vendor_name}
                      </p>
                    )}

                    {/* Rating */}
                    {product.review_count > 0 && (
                      <div className="flex items-center gap-1 mb-2">
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <svg
                              key={i}
                              className={cn(
                                'h-3 w-3',
                                i < Math.round(product.rating)
                                  ? 'text-yellow-400 fill-yellow-400'
                                  : 'text-muted-foreground'
                              )}
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                            </svg>
                          ))}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          ({product.review_count})
                        </span>
                      </div>
                    )}

                    {/* Price */}
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-primary">
                        {formatPrice(product.price)}
                      </span>
                      {product.compare_at_price && product.compare_at_price > product.price && (
                        <span className="text-xs text-muted-foreground line-through">
                          {formatPrice(product.compare_at_price)}
                        </span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
