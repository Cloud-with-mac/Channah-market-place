'use client'

import * as React from 'react'
import { Sparkles } from 'lucide-react'
import { ProductCard } from './product-card'
import { Skeleton } from '@/components/ui/skeleton'
import { aiAPI, productsAPI } from '@/lib/api'

interface Product {
  id: string
  name: string
  slug: string
  price: number
  compareAtPrice?: number
  image: string
  rating: number
  reviewCount: number
  vendorName: string
}

interface RelatedProductsProps {
  productId: string
  categoryId?: string
  title?: string
  useAI?: boolean
}

export function RelatedProducts({
  productId,
  categoryId,
  title = 'Related Products',
  useAI = true,
}: RelatedProductsProps) {
  const [products, setProducts] = React.useState<Product[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [isAIPowered, setIsAIPowered] = React.useState(false)

  React.useEffect(() => {
    const fetchRelatedProducts = async () => {
      setIsLoading(true)
      try {
        let response

        if (useAI) {
          // Try AI recommendations first
          try {
            response = await aiAPI.getRecommendations(productId, categoryId, 4)
            if (response.data?.products?.length > 0) {
              setIsAIPowered(true)
            }
          } catch {
            // Fall back to regular related products
          }
        }

        if (!response?.data?.products?.length) {
          // Fallback to category-based related products
          response = await productsAPI.getAll({
            category: categoryId,
            exclude: productId,
            limit: 4,
          })
        }

        const data = response?.data?.products || response?.data?.results || response?.data || []

        const transformedProducts = data.map((p: any) => ({
          id: p.id,
          name: p.name,
          slug: p.slug,
          price: parseFloat(p.price),
          compareAtPrice: p.compare_at_price ? parseFloat(p.compare_at_price) : undefined,
          image:
            p.primary_image ||
            p.images?.[0]?.url ||
            p.image ||
            'https://images.unsplash.com/photo-1560393464-5c69a73c5770?w=400&h=400&fit=crop',
          rating: p.rating || 4.0,
          reviewCount: p.review_count || 0,
          vendorName: p.vendor?.business_name || p.vendor_name || 'Channah Vendor',
        }))

        setProducts(transformedProducts)
      } catch (error) {
        console.error('Failed to fetch related products:', error)
        setProducts([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchRelatedProducts()
  }, [productId, categoryId, useAI])

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Skeleton className="h-6 w-40" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-lg border bg-card overflow-hidden">
              <Skeleton className="aspect-square w-full" />
              <div className="p-4 space-y-3">
                <Skeleton className="h-3 w-1/3" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-6 w-1/3" />
                <Skeleton className="h-9 w-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (products.length === 0) {
    return null
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h2 className="text-xl font-bold font-display">{title}</h2>
        {isAIPowered && (
          <span className="inline-flex items-center gap-1 text-xs text-primary bg-primary/10 px-2 py-1 rounded-full">
            <Sparkles className="h-3 w-3" />
            AI Powered
          </span>
        )}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  )
}
