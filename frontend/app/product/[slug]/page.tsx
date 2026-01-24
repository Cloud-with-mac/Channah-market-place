'use client'

import * as React from 'react'
import { useParams } from 'next/navigation'
import { notFound } from 'next/navigation'
import { ProductGallery } from '@/components/product/product-gallery'
import { ProductInfo } from '@/components/product/product-info'
import { ProductVariants } from '@/components/product/product-variants'
import { AddToCartSection } from '@/components/product/add-to-cart-section'
import { ProductTabs } from '@/components/product/product-tabs'
import { ProductReviews } from '@/components/product/product-reviews'
import { RelatedProducts } from '@/components/product/related-products'
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator } from '@/components/ui/breadcrumb'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { productsAPI } from '@/lib/api'

// Helper function to transform flat variants into grouped format
function transformVariantsFromAPI(variants: any[]): Array<{
  name: string
  options: Array<{ id: string; value: string; available: boolean; priceModifier?: number }>
}> {
  if (!variants || variants.length === 0) return []

  // Extract unique option types and their values
  const optionGroups = new Map<string, Map<string, { id: string; quantity: number; priceModifier?: number }>>()

  for (const variant of variants) {
    // Skip placeholder variants (used to preserve enabled state)
    if (variant.name === '__variants_enabled__') continue

    let options: Record<string, string> = {}

    // Handle options that might be a JSON string
    if (typeof variant.options === 'string') {
      try {
        options = JSON.parse(variant.options)
      } catch {
        options = {}
      }
    } else if (variant.options && typeof variant.options === 'object') {
      options = variant.options
    }

    // Skip placeholder option markers
    if (options.__variants_enabled__) continue

    // Group by option type
    for (const [key, value] of Object.entries(options)) {
      const optionType = key.charAt(0).toUpperCase() + key.slice(1) // Capitalize: "size" -> "Size"
      if (!optionGroups.has(optionType)) {
        optionGroups.set(optionType, new Map())
      }
      const group = optionGroups.get(optionType)!
      const existing = group.get(value as string)
      if (!existing || variant.quantity > 0) {
        group.set(value as string, {
          id: variant.id || `${key}-${value}`,
          quantity: (existing?.quantity || 0) + (variant.quantity || 0),
          priceModifier: variant.price_modifier || 0,
        })
      }
    }
  }

  // Convert to array format
  const result: Array<{
    name: string
    options: Array<{ id: string; value: string; available: boolean; priceModifier?: number }>
  }> = []

  // Define preferred order
  const preferredOrder = ['Size', 'Color']

  // Sort by preferred order
  const sortedKeys = Array.from(optionGroups.keys()).sort((a, b) => {
    const aIndex = preferredOrder.indexOf(a)
    const bIndex = preferredOrder.indexOf(b)
    if (aIndex === -1 && bIndex === -1) return a.localeCompare(b)
    if (aIndex === -1) return 1
    if (bIndex === -1) return -1
    return aIndex - bIndex
  })

  for (const optionType of sortedKeys) {
    const group = optionGroups.get(optionType)!
    result.push({
      name: optionType,
      options: Array.from(group.entries()).map(([value, data]) => ({
        id: data.id,
        value,
        available: data.quantity > 0,
        priceModifier: data.priceModifier,
      })),
    })
  }

  return result
}


export default function ProductDetailPage() {
  const params = useParams()
  const slug = params.slug as string

  const [product, setProduct] = React.useState<any>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState(false)
  const [selectedVariants, setSelectedVariants] = React.useState<Record<string, string>>({})

  React.useEffect(() => {
    const fetchProduct = async () => {
      setIsLoading(true)
      try {
        const response = await productsAPI.getBySlug(slug)
        const data = response.data

        // Transform API response
        const transformedProduct = {
          id: data.id,
          name: data.name,
          slug: data.slug,
          description: data.description || mockProduct.description,
          price: parseFloat(data.price),
          compareAtPrice: data.compare_at_price ? parseFloat(data.compare_at_price) : undefined,
          images: data.images?.length > 0
            ? data.images.map((img: any, idx: number) => ({
                id: img.id || String(idx),
                url: img.url || img.image,
                alt: img.alt || data.name,
              }))
            : mockProduct.images,
          rating: data.rating || 4.0,
          reviewCount: data.review_count || 0,
          vendor: {
            name: data.vendor?.business_name || data.vendor_name || 'Channah Vendor',
            slug: data.vendor?.slug || 'vendor',
          },
          category: data.category
            ? {
                id: data.category.id,
                name: data.category.name,
                slug: data.category.slug,
              }
            : undefined,
          sku: data.sku,
          inStock: (data.stock ?? data.quantity ?? 0) > 0,
          stockQuantity: data.stock ?? data.quantity ?? 0,
          variants: transformVariantsFromAPI(data.variants || []),
          specifications: data.specifications || {},
          shippingInfo: data.shipping_info,
          // Store category info for variant requirement check
          categoryName: data.category?.name || '',
        }

        setProduct(transformedProduct)

        // Set default variant selections
        const defaultVariants: Record<string, string> = {}
        transformedProduct.variants.forEach((v: any) => {
          const availableOption = v.options?.find((o: any) => o.available)
          if (availableOption) {
            defaultVariants[v.name] = availableOption.id
          }
        })
        setSelectedVariants(defaultVariants)
      } catch (err: any) {
        console.error('Failed to fetch product:', err)
        if (err?.response?.status === 404) {
          setError(true)
        } else {
          // Use mock data as fallback
          setProduct(mockProduct)
          const defaultVariants: Record<string, string> = {}
          mockProduct.variants.forEach((v) => {
            const availableOption = v.options?.find((o) => o.available)
            if (availableOption) {
              defaultVariants[v.name] = availableOption.id
            }
          })
          setSelectedVariants(defaultVariants)
        }
      } finally {
        setIsLoading(false)
      }
    }

    fetchProduct()
  }, [slug])

  const handleVariantChange = (variantName: string, optionId: string) => {
    setSelectedVariants((prev) => ({
      ...prev,
      [variantName]: optionId,
    }))
  }

  if (error) {
    notFound()
  }

  if (isLoading) {
    return <ProductDetailSkeleton />
  }

  if (!product) {
    return notFound()
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <Breadcrumb className="mb-6">
        <BreadcrumbItem>
          <BreadcrumbLink href="/">Home</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink href="/products">Products</BreadcrumbLink>
        </BreadcrumbItem>
        {product.category && (
          <>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href={`/category/${product.category.slug}`}>
                {product.category.name}
              </BreadcrumbLink>
            </BreadcrumbItem>
          </>
        )}
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink href={`/product/${product.slug}`} active>
            {product.name}
          </BreadcrumbLink>
        </BreadcrumbItem>
      </Breadcrumb>

      {/* Product Details */}
      <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
        {/* Left: Gallery */}
        <ProductGallery images={product.images} productName={product.name} />

        {/* Right: Info & Actions */}
        <div className="space-y-6">
          <ProductInfo
            name={product.name}
            price={product.price}
            compareAtPrice={product.compareAtPrice}
            rating={product.rating}
            reviewCount={product.reviewCount}
            vendor={product.vendor}
            sku={product.sku}
            inStock={product.inStock}
            stockQuantity={product.stockQuantity}
            category={product.category}
          />

          <Separator />

          {/* Variants */}
          {product.variants.length > 0 && (
            <>
              <ProductVariants
                variants={product.variants}
                selectedOptions={selectedVariants}
                onOptionChange={handleVariantChange}
              />
              <Separator />
            </>
          )}

          {/* Add to Cart */}
          <AddToCartSection
            productId={product.id}
            productName={product.name}
            productSlug={product.slug}
            price={product.price}
            compareAtPrice={product.compareAtPrice}
            image={product.images[0]?.url || ''}
            inStock={product.inStock}
            maxQuantity={product.stockQuantity}
            selectedVariantId={Object.values(selectedVariants).join('-') || undefined}
            variants={product.variants}
            selectedVariants={selectedVariants}
          />
        </div>
      </div>

      {/* Product Tabs */}
      <div className="mt-12">
        <ProductTabs
          description={product.description}
          specifications={product.specifications}
          shippingInfo={product.shippingInfo}
        />
      </div>

      {/* Reviews */}
      <div className="mt-12">
        <Separator className="mb-8" />
        <ProductReviews productId={product.id} />
      </div>

      {/* Related Products */}
      <div className="mt-12">
        <Separator className="mb-8" />
        <RelatedProducts
          productId={product.id}
          categoryId={product.category?.id}
          title="You May Also Like"
        />
      </div>
    </div>
  )
}

function ProductDetailSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-6">
        <Skeleton className="h-4 w-12" />
        <Skeleton className="h-4 w-2" />
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-2" />
        <Skeleton className="h-4 w-24" />
      </div>

      <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
        {/* Gallery Skeleton */}
        <div className="space-y-4">
          <Skeleton className="aspect-square w-full rounded-lg" />
          <div className="flex gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="w-20 h-20 rounded-md" />
            ))}
          </div>
        </div>

        {/* Info Skeleton */}
        <div className="space-y-6">
          <div className="space-y-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-3/4" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-4 w-20" />
            </div>
            <Skeleton className="h-10 w-32" />
          </div>

          <Skeleton className="h-px w-full" />

          <div className="space-y-3">
            <Skeleton className="h-5 w-20" />
            <div className="flex gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-10 rounded-full" />
              ))}
            </div>
          </div>

          <Skeleton className="h-px w-full" />

          <div className="space-y-3">
            <Skeleton className="h-10 w-40" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      </div>
    </div>
  )
}
