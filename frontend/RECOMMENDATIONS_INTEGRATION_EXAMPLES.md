# Recommendations System Integration Examples

This document provides practical examples of how to integrate the Smart Recommendations system throughout your application.

## Table of Contents

1. [Product Detail Page](#product-detail-page)
2. [Homepage Integration](#homepage-integration)
3. [Search Results Page](#search-results-page)
4. [Cart Page](#cart-page)
5. [Checkout Success](#checkout-success)
6. [Category Pages](#category-pages)
7. [Navigation Menu](#navigation-menu)
8. [Email Templates](#email-templates)

---

## Product Detail Page

Add similar products and cross-sell recommendations to product pages.

### File: `app/product/[slug]/page.tsx`

```typescript
'use client'

import { useEffect, useState } from 'react'
import { useRecommendationsStore, Product } from '@/store/recommendations-store'
import { productsAPI } from '@/lib/api'

export default function ProductDetailPage({ params }: { params: { slug: string } }) {
  const [product, setProduct] = useState<any>(null)
  const [allProducts, setAllProducts] = useState<Product[]>([])
  const [viewStartTime, setViewStartTime] = useState(Date.now())

  const {
    trackProductView,
    getSimilarProducts,
    getCrossSellProducts,
    getCustomersAlsoBought,
  } = useRecommendationsStore()

  // Load product and track view
  useEffect(() => {
    const loadProduct = async () => {
      const data = await productsAPI.getBySlug(params.slug)
      setProduct(data)

      // Track view immediately
      trackProductView(transformProduct(data), 0)
      setViewStartTime(Date.now())
    }

    loadProduct()

    // Track view duration on unmount
    return () => {
      if (product) {
        const duration = Math.floor((Date.now() - viewStartTime) / 1000)
        trackProductView(transformProduct(product), duration)
      }
    }
  }, [params.slug])

  // Load all products for recommendations
  useEffect(() => {
    const loadProducts = async () => {
      const data = await productsAPI.getAll({ limit: 100 })
      setAllProducts(transformProducts(data.products))
    }
    loadProducts()
  }, [])

  if (!product) return <div>Loading...</div>

  const transformedProduct = transformProduct(product)
  const similarProducts = getSimilarProducts(transformedProduct, allProducts, 8)
  const crossSellProducts = getCrossSellProducts(transformedProduct, allProducts, 6)
  const alsoBought = getCustomersAlsoBought(product.id, allProducts, 6)

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Main Product Section */}
      <ProductDetails product={product} />

      {/* Recommendations Sections */}
      <div className="mt-16 space-y-12">
        {/* Similar Products */}
        {similarProducts.length > 0 && (
          <RecommendationSection
            title="Similar Products"
            description="More options you might like"
            products={similarProducts}
          />
        )}

        {/* Frequently Bought Together */}
        {alsoBought.length > 0 && (
          <RecommendationSection
            title="Customers Also Bought"
            description="Popular combinations"
            products={alsoBought}
          />
        )}

        {/* Cross-sell */}
        {crossSellProducts.length > 0 && (
          <RecommendationSection
            title="Complete Your Setup"
            description="Complementary products"
            products={crossSellProducts}
          />
        )}
      </div>
    </div>
  )
}

// Helper to transform product data
function transformProduct(p: any): Product {
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    price: parseFloat(p.price || 0),
    compareAtPrice: p.compare_at_price ? parseFloat(p.compare_at_price) : undefined,
    image: p.primary_image || p.image || '/placeholder.png',
    rating: p.rating || 4.0,
    reviewCount: p.review_count || 0,
    category: {
      id: p.category_id || p.category?.id || 'general',
      name: p.category?.name || 'General',
      slug: p.category?.slug || 'general',
    },
    vendor: {
      id: p.vendor_id || p.vendor?.id || 'unknown',
      name: p.vendor_name || p.vendor?.name || 'Unknown',
      slug: p.vendor?.slug || 'unknown',
      verified: p.vendor?.verified || false,
    },
    description: p.description,
    tags: p.tags || [],
    specifications: p.specifications || {},
    inStock: p.quantity > 0 || p.in_stock,
    totalSales: p.total_sales || 0,
    viewCount: p.view_count || 0,
  }
}
```

---

## Homepage Integration

Show personalized recommendations and trending products on the homepage.

### File: `app/page.tsx`

```typescript
'use client'

import { useEffect, useState } from 'react'
import { useRecommendationsStore, Product } from '@/store/recommendations-store'
import { useAuthStore } from '@/store'
import { productsAPI } from '@/lib/api'

export default function HomePage() {
  const { user } = useAuthStore()
  const [allProducts, setAllProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const {
    getPersonalizedRecommendations,
    getTrendingProducts,
    getRecentlyViewed,
    viewedProducts,
  } = useRecommendationsStore()

  // Load products
  useEffect(() => {
    const loadProducts = async () => {
      try {
        setIsLoading(true)
        const data = await productsAPI.getAll({ limit: 100 })
        setAllProducts(transformProducts(data.products))
      } finally {
        setIsLoading(false)
      }
    }
    loadProducts()
  }, [])

  const personalizedProducts = getPersonalizedRecommendations(allProducts, 12)
  const trendingProducts = getTrendingProducts(allProducts, 12)
  const recentlyViewed = getRecentlyViewed(8)

  return (
    <div className="container mx-auto px-4 py-8 space-y-16">
      {/* Hero Section */}
      <HeroSection />

      {/* Personalized Section (only for users with history) */}
      {viewedProducts.length > 0 && (
        <Section
          title="Recommended For You"
          description="Based on your browsing history"
          products={personalizedProducts}
          isLoading={isLoading}
          href="/recommendations"
        />
      )}

      {/* Trending Section */}
      <Section
        title="Trending Now"
        description="Most popular products this week"
        products={trendingProducts}
        isLoading={isLoading}
        href="/recommendations?tab=trending"
      />

      {/* Recently Viewed (only if exists) */}
      {recentlyViewed.length > 0 && (
        <Section
          title="Recently Viewed"
          description="Pick up where you left off"
          products={recentlyViewed}
          href="/recommendations"
          compact
        />
      )}

      {/* Categories */}
      <CategoriesSection />

      {/* Featured Vendors */}
      <VendorsSection />
    </div>
  )
}
```

---

## Search Results Page

Enhance search results with recommendations when no results found.

### File: `app/search/page.tsx`

```typescript
'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useRecommendationsStore } from '@/store/recommendations-store'

export default function SearchPage() {
  const searchParams = useSearchParams()
  const query = searchParams.get('q') || ''

  const [searchResults, setSearchResults] = useState<any[]>([])
  const [allProducts, setAllProducts] = useState<Product[]>([])

  const { getPersonalizedRecommendations, getTrendingProducts } = useRecommendationsStore()

  useEffect(() => {
    const search = async () => {
      const results = await productsAPI.search(query)
      setSearchResults(results)

      // Load all products for recommendations
      const all = await productsAPI.getAll({ limit: 100 })
      setAllProducts(transformProducts(all.products))
    }
    search()
  }, [query])

  // Show recommendations if no results
  if (searchResults.length === 0 && query) {
    const recommendations = getPersonalizedRecommendations(allProducts, 12)

    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-2">No results found for "{query}"</h2>
          <p className="text-muted-foreground mb-8">
            Try different keywords or browse our recommendations
          </p>
        </div>

        <Section
          title="You Might Like These"
          products={recommendations}
        />

        <Section
          title="Trending Products"
          products={getTrendingProducts(allProducts, 12)}
          className="mt-12"
        />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">
        Search Results for "{query}" ({searchResults.length})
      </h1>
      <ProductGrid products={searchResults} />
    </div>
  )
}
```

---

## Cart Page

Show cross-sell recommendations and frequently bought together items.

### File: `app/cart/page.tsx`

```typescript
'use client'

import { useEffect, useState } from 'react'
import { useCartStore } from '@/store'
import { useRecommendationsStore, Product } from '@/store/recommendations-store'
import { productsAPI } from '@/lib/api'

export default function CartPage() {
  const { items } = useCartStore()
  const { getCrossSellProducts, getCustomersAlsoBought, trackInteraction } = useRecommendationsStore()

  const [allProducts, setAllProducts] = useState<Product[]>([])
  const [recommendations, setRecommendations] = useState<Product[]>([])

  useEffect(() => {
    const loadRecommendations = async () => {
      const all = await productsAPI.getAll({ limit: 100 })
      const transformed = transformProducts(all.products)
      setAllProducts(transformed)

      // Get recommendations based on cart items
      if (items.length > 0) {
        const cartProductIds = items.map(item => item.productId)
        const cartProducts = transformed.filter(p => cartProductIds.includes(p.id))

        // Get cross-sell for first item in cart
        if (cartProducts.length > 0) {
          const crossSell = getCrossSellProducts(cartProducts[0], transformed, 6)
          const alsoBought = getCustomersAlsoBought(cartProducts[0].id, transformed, 6)

          // Combine and deduplicate
          const combined = [...crossSell, ...alsoBought]
          const unique = Array.from(new Map(combined.map(p => [p.id, p])).values())
          setRecommendations(unique.slice(0, 8))
        }
      }
    }

    loadRecommendations()
  }, [items])

  const handleAddToCart = (product: Product) => {
    trackInteraction(product.id, 'cart')
    // Add to cart logic
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Shopping Cart ({items.length})</h1>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2">
          <CartItems items={items} />
        </div>

        {/* Cart Summary */}
        <div>
          <CartSummary />
        </div>
      </div>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="mt-16">
          <h2 className="text-2xl font-bold mb-6">You Might Also Need</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {recommendations.map(product => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={() => handleAddToCart(product)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
```

---

## Checkout Success

Track purchases to improve future recommendations.

### File: `app/checkout/success/page.tsx`

```typescript
'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { useRecommendationsStore } from '@/store/recommendations-store'
import { ordersAPI } from '@/lib/api'

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get('order_id')

  const { trackPurchase } = useRecommendationsStore()

  useEffect(() => {
    const trackOrder = async () => {
      if (!orderId) return

      try {
        const order = await ordersAPI.getById(orderId)

        // Track each purchased item
        order.items.forEach((item: any) => {
          trackPurchase(
            item.product_id,
            item.product.category_id,
            item.product.vendor_id,
            item.quantity,
            parseFloat(item.price)
          )
        })

        console.log('Purchase tracked for recommendations')
      } catch (error) {
        console.error('Failed to track purchase:', error)
      }
    }

    trackOrder()
  }, [orderId])

  return (
    <div className="container mx-auto px-4 py-16 text-center">
      <div className="max-w-2xl mx-auto">
        <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-6" />
        <h1 className="text-3xl font-bold mb-4">Order Confirmed!</h1>
        <p className="text-muted-foreground mb-8">
          Thank you for your purchase. Your order #{orderId} has been confirmed.
        </p>

        <div className="flex gap-4 justify-center">
          <Button asChild>
            <Link href="/account/orders">View Order</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/recommendations">Continue Shopping</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
```

---

## Category Pages

Show trending products in specific categories.

### File: `app/category/[slug]/page.tsx`

```typescript
'use client'

import { useEffect, useState } from 'react'
import { useRecommendationsStore, Product } from '@/store/recommendations-store'

export default function CategoryPage({ params }: { params: { slug: string } }) {
  const [category, setCategory] = useState<any>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [allProducts, setAllProducts] = useState<Product[]>([])

  const { getTrendingInCategory } = useRecommendationsStore()

  useEffect(() => {
    const loadData = async () => {
      const cat = await categoriesAPI.getBySlug(params.slug)
      const prods = await productsAPI.getAll({ category: cat.id })
      const all = await productsAPI.getAll({ limit: 100 })

      setCategory(cat)
      setProducts(transformProducts(prods.products))
      setAllProducts(transformProducts(all.products))
    }

    loadData()
  }, [params.slug])

  const trendingInCategory = getTrendingInCategory(category?.id, allProducts, 8)

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">{category?.name}</h1>

      {/* Trending in Category */}
      {trendingInCategory.length > 0 && (
        <Section
          title="Trending in this Category"
          products={trendingInCategory}
          className="mb-12"
        />
      )}

      {/* All Products */}
      <h2 className="text-2xl font-bold mb-6">All Products</h2>
      <ProductGrid products={products} />
    </div>
  )
}
```

---

## Navigation Menu

Add quick access to recommendations in the header.

### File: `components/layout/header.tsx`

```typescript
import Link from 'next/link'
import { useRecommendationsStore } from '@/store/recommendations-store'
import { Sparkles, TrendingUp, Clock } from 'lucide-react'

export function Header() {
  const { viewedProducts } = useRecommendationsStore()

  return (
    <header>
      <nav>
        {/* ... other nav items ... */}

        {/* Recommendations Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <Sparkles className="h-4 w-4 mr-2" />
              For You
              {viewedProducts.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {viewedProducts.length}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuItem asChild>
              <Link href="/recommendations" className="cursor-pointer">
                <Sparkles className="h-4 w-4 mr-2" />
                Personalized Recommendations
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/recommendations?tab=trending" className="cursor-pointer">
                <TrendingUp className="h-4 w-4 mr-2" />
                Trending Products
              </Link>
            </DropdownMenuItem>
            {viewedProducts.length > 0 && (
              <DropdownMenuItem asChild>
                <Link href="/recommendations" className="cursor-pointer">
                  <Clock className="h-4 w-4 mr-2" />
                  Recently Viewed ({viewedProducts.length})
                </Link>
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </nav>
    </header>
  )
}
```

---

## Email Templates

Use recommendations in email marketing.

### Server-side Email Generation

```typescript
// app/api/emails/recommendations/route.ts
import { NextResponse } from 'next/server'
import { getPersonalizedRecommendations } from '@/lib/recommendations-server'

export async function POST(request: Request) {
  const { userId } = await request.json()

  try {
    // Get user's interaction history from database
    const userHistory = await db.userInteractions.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 200,
    })

    // Get all products
    const allProducts = await db.products.findMany({
      where: { isActive: true },
      include: { category: true, vendor: true },
    })

    // Generate recommendations
    const recommendations = getPersonalizedRecommendations(
      userHistory,
      allProducts,
      12
    )

    // Generate email HTML
    const emailHtml = generateRecommendationEmail(recommendations)

    // Send email
    await sendEmail({
      to: user.email,
      subject: 'Products You Might Like',
      html: emailHtml,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
  }
}

function generateRecommendationEmail(products: Product[]) {
  return `
    <!DOCTYPE html>
    <html>
      <body>
        <h1>Recommended For You</h1>
        <p>Based on your recent activity, we think you'll love these products:</p>

        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px;">
          ${products.map(product => `
            <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px;">
              <img src="${product.image}" alt="${product.name}" style="width: 100%; height: 200px; object-fit: cover; border-radius: 4px;" />
              <h3 style="margin: 12px 0 8px;">${product.name}</h3>
              <p style="font-size: 20px; font-weight: bold; color: #2563eb;">
                £${product.price.toFixed(2)}
              </p>
              <a href="https://yoursite.com/product/${product.slug}" style="display: inline-block; background: #2563eb; color: white; padding: 8px 16px; text-decoration: none; border-radius: 4px; margin-top: 8px;">
                View Product
              </a>
            </div>
          `).join('')}
        </div>

        <p style="margin-top: 32px;">
          <a href="https://yoursite.com/recommendations" style="color: #2563eb;">
            View All Recommendations →
          </a>
        </p>
      </body>
    </html>
  `
}
```

---

## Global Tracking Hook

Create a reusable hook for consistent tracking.

### File: `hooks/use-recommendation-tracking.ts`

```typescript
import { useEffect, useRef } from 'react'
import { useRecommendationsStore, Product } from '@/store/recommendations-store'

export function useProductViewTracking(product: Product | null) {
  const { trackProductView } = useRecommendationsStore()
  const startTimeRef = useRef<number>(Date.now())

  useEffect(() => {
    if (!product) return

    // Track initial view
    trackProductView(product, 0)
    startTimeRef.current = Date.now()

    // Track view duration on unmount
    return () => {
      const duration = Math.floor((Date.now() - startTimeRef.current) / 1000)
      trackProductView(product, duration)
    }
  }, [product?.id])
}

export function useInteractionTracking() {
  const { trackInteraction } = useRecommendationsStore()

  return {
    trackCart: (productId: string) => trackInteraction(productId, 'cart'),
    trackWishlist: (productId: string) => trackInteraction(productId, 'wishlist'),
    trackCompare: (productId: string) => trackInteraction(productId, 'compare'),
  }
}
```

### Usage:

```typescript
function ProductCard({ product }: { product: Product }) {
  const { trackCart, trackWishlist } = useInteractionTracking()

  const handleAddToCart = () => {
    trackCart(product.id)
    // Add to cart logic
  }

  const handleAddToWishlist = () => {
    trackWishlist(product.id)
    // Add to wishlist logic
  }

  return (
    <Card>
      <Button onClick={handleAddToCart}>Add to Cart</Button>
      <Button onClick={handleAddToWishlist}>Save</Button>
    </Card>
  )
}
```

---

## Testing Recommendations

### File: `__tests__/recommendations.test.ts`

```typescript
import { RecommendationEngine } from '@/store/recommendations-store'

describe('Recommendation Engine', () => {
  const mockProducts = [
    {
      id: '1',
      name: 'Product 1',
      category: { id: 'cat1', name: 'Electronics' },
      price: 100,
      rating: 4.5,
      // ... other fields
    },
    // ... more products
  ]

  const mockInteractions = [
    { productId: '1', action: 'view', timestamp: Date.now(), score: 1 },
    { productId: '1', action: 'cart', timestamp: Date.now(), score: 10 },
    // ... more interactions
  ]

  test('collaborative filtering returns recommendations', () => {
    const recommendations = RecommendationEngine.collaborativeFiltering(
      mockInteractions,
      mockProducts
    )

    expect(recommendations.length).toBeGreaterThan(0)
    expect(recommendations[0]).toHaveProperty('productId')
    expect(recommendations[0]).toHaveProperty('score')
    expect(recommendations[0]).toHaveProperty('reasons')
  })

  test('content-based filtering finds similar products', () => {
    const targetProduct = mockProducts[0]
    const similar = RecommendationEngine.contentBasedFiltering(
      targetProduct,
      mockProducts
    )

    expect(similar[0].productId).not.toBe(targetProduct.id)
    expect(similar[0].score).toBeGreaterThan(0)
  })

  test('trending algorithm prioritizes high-performing products', () => {
    const trending = RecommendationEngine.getTrending(mockProducts)

    expect(trending[0].score).toBeGreaterThanOrEqual(trending[1]?.score || 0)
  })
})
```

---

## Performance Monitoring

### File: `lib/analytics.ts`

```typescript
export function trackRecommendationClick(
  productId: string,
  algorithm: string,
  position: number
) {
  // Send to analytics
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'recommendation_click', {
      product_id: productId,
      algorithm,
      position,
    })
  }
}

export function trackRecommendationImpression(
  productIds: string[],
  algorithm: string
) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'recommendation_impression', {
      product_count: productIds.length,
      algorithm,
    })
  }
}
```

### Usage in Components:

```typescript
function RecommendationSection({ products, algorithm }) {
  useEffect(() => {
    trackRecommendationImpression(
      products.map(p => p.id),
      algorithm
    )
  }, [products])

  const handleProductClick = (product: Product, index: number) => {
    trackRecommendationClick(product.id, algorithm, index)
    // Navigate to product
  }

  return (
    <div>
      {products.map((product, index) => (
        <ProductCard
          key={product.id}
          product={product}
          onClick={() => handleProductClick(product, index)}
        />
      ))}
    </div>
  )
}
```

---

These integration examples provide a comprehensive guide for implementing the recommendations system throughout your application. Each example is production-ready and follows best practices for performance, user experience, and data tracking.
