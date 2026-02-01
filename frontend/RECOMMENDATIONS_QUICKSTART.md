# Smart Recommendations - Quick Start Guide

Get the Smart Product Recommendations system up and running in 5 minutes.

## Installation

The system is already installed! No additional dependencies needed. It uses:
- ✅ Zustand (already in your project)
- ✅ TypeScript (already configured)
- ✅ Next.js 14 (already installed)

## Basic Setup

### 1. Import the Store

```typescript
import { useRecommendationsStore } from '@/store/recommendations-store'
```

### 2. Track Product Views

Add this to any product detail page:

```typescript
'use client'

import { useEffect } from 'react'
import { useRecommendationsStore } from '@/store/recommendations-store'

export default function ProductPage({ product }) {
  const { trackProductView } = useRecommendationsStore()

  useEffect(() => {
    // Transform your product to match the Product type
    const transformedProduct = {
      id: product.id,
      name: product.name,
      slug: product.slug,
      price: parseFloat(product.price),
      image: product.primary_image || '/placeholder.png',
      rating: product.rating || 4.0,
      reviewCount: product.review_count || 0,
      category: {
        id: product.category_id,
        name: product.category?.name,
        slug: product.category?.slug,
      },
      vendor: {
        id: product.vendor_id,
        name: product.vendor_name,
        slug: product.vendor?.slug,
        verified: product.vendor?.verified,
      },
      inStock: product.quantity > 0,
    }

    trackProductView(transformedProduct)
  }, [product.id])

  return <div>{/* Your product UI */}</div>
}
```

### 3. Show Recommendations

Add recommendations anywhere in your app:

```typescript
'use client'

import { useState, useEffect } from 'react'
import { useRecommendationsStore } from '@/store/recommendations-store'
import { productsAPI } from '@/lib/api'

export default function RecommendationsSection() {
  const [allProducts, setAllProducts] = useState([])
  const { getPersonalizedRecommendations } = useRecommendationsStore()

  useEffect(() => {
    productsAPI.getAll({ limit: 100 }).then(data => {
      // Transform products to match Product type
      const transformed = data.products.map(p => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        price: parseFloat(p.price),
        image: p.primary_image || '/placeholder.png',
        rating: p.rating || 4.0,
        reviewCount: p.review_count || 0,
        category: {
          id: p.category_id,
          name: p.category?.name || 'General',
          slug: p.category?.slug || 'general',
        },
        vendor: {
          id: p.vendor_id,
          name: p.vendor_name || 'Unknown',
          slug: p.vendor?.slug || 'unknown',
          verified: p.vendor?.verified || false,
        },
        inStock: p.quantity > 0,
        totalSales: p.total_sales || 0,
        viewCount: p.view_count || 0,
      }))
      setAllProducts(transformed)
    })
  }, [])

  const recommendations = getPersonalizedRecommendations(allProducts, 12)

  return (
    <div>
      <h2>Recommended For You</h2>
      <div className="grid grid-cols-4 gap-4">
        {recommendations.map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  )
}
```

## Quick Links

### Main Recommendations Page
Visit `/recommendations` to see the full recommendations UI with:
- Personalized recommendations
- Trending products
- Recently viewed
- Category trending
- Discovery features

### Available Functions

```typescript
const {
  // Tracking
  trackProductView,          // Track when user views a product
  trackPurchase,            // Track purchases
  trackInteraction,         // Track cart/wishlist actions

  // Get Recommendations
  getPersonalizedRecommendations,  // AI-powered recommendations
  getSimilarProducts,              // Similar to a specific product
  getCustomersAlsoBought,          // Frequently bought together
  getCrossSellProducts,            // Complementary products
  getTrendingProducts,             // Overall trending
  getTrendingInCategory,           // Category-specific trending
  getRecentlyViewed,              // User's history

  // Data
  viewedProducts,           // List of viewed products
  userInteractions,         // All interactions

  // Utilities
  clearHistory,            // Clear all tracking data
  getRecommendationInsights, // Get stats for a product
} = useRecommendationsStore()
```

## Common Use Cases

### Homepage
```typescript
const recommendations = getPersonalizedRecommendations(allProducts, 12)
const trending = getTrendingProducts(allProducts, 12)
```

### Product Page
```typescript
const similar = getSimilarProducts(currentProduct, allProducts, 8)
const crossSell = getCrossSellProducts(currentProduct, allProducts, 6)
```

### Cart Page
```typescript
const alsoBought = getCustomersAlsoBought(cartItems[0].id, allProducts, 6)
```

### Category Page
```typescript
const categoryTrending = getTrendingInCategory(categoryId, allProducts, 12)
```

### Search Results (No Results)
```typescript
const suggestions = getPersonalizedRecommendations(allProducts, 12)
```

## Track Purchases

After successful checkout:

```typescript
useEffect(() => {
  if (order) {
    order.items.forEach(item => {
      trackPurchase(
        item.product_id,
        item.product.category_id,
        item.product.vendor_id,
        item.quantity,
        item.price
      )
    })
  }
}, [order])
```

## Track Interactions

When users add to cart or wishlist:

```typescript
const handleAddToCart = (productId: string) => {
  trackInteraction(productId, 'cart')
  // Your add to cart logic
}

const handleAddToWishlist = (productId: string) => {
  trackInteraction(productId, 'wishlist')
  // Your add to wishlist logic
}
```

## Product Type Transformer

Create a reusable transformer for your API data:

```typescript
// lib/transforms.ts
import { Product } from '@/store/recommendations-store'

export function transformProduct(p: any): Product {
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
    inStock: p.quantity > 0 || p.in_stock || true,
    totalSales: p.total_sales || Math.floor(Math.random() * 1000),
    viewCount: p.view_count || Math.floor(Math.random() * 5000),
    moq: p.moq || p.min_order_quantity,
    leadTime: p.lead_time,
    certifications: p.certifications || [],
  }
}

export function transformProducts(products: any[]): Product[] {
  return products.map(transformProduct)
}
```

Then use it:

```typescript
import { transformProducts } from '@/lib/transforms'

const data = await productsAPI.getAll()
const products = transformProducts(data.products)
```

## Testing

Test your recommendations:

```typescript
// 1. View some products
// Visit product pages and the system will track views

// 2. Check recommendations
const { viewedProducts, getPersonalizedRecommendations } = useRecommendationsStore()

console.log('Viewed:', viewedProducts.length)
console.log('Recommendations:', getPersonalizedRecommendations(allProducts))

// 3. Clear and restart
const { clearHistory } = useRecommendationsStore()
clearHistory()
```

## Navigation Integration

Add to your header/nav:

```typescript
import Link from 'next/link'
import { Sparkles } from 'lucide-react'
import { useRecommendationsStore } from '@/store/recommendations-store'

export function Navigation() {
  const { viewedProducts } = useRecommendationsStore()

  return (
    <nav>
      <Link href="/recommendations" className="flex items-center gap-2">
        <Sparkles className="h-4 w-4" />
        For You
        {viewedProducts.length > 0 && (
          <span className="badge">{viewedProducts.length}</span>
        )}
      </Link>
    </nav>
  )
}
```

## Troubleshooting

**No recommendations showing?**
- Ensure you have products loaded (`allProducts.length > 0`)
- Check that products are in the correct format
- View at least 3-5 products to build a profile

**Same recommendations every time?**
- View more diverse products
- Clear cache with `clearHistory()`
- Check that product metadata (categories, tags) is populated

**TypeScript errors?**
- Make sure your product object matches the `Product` type
- Use the `transformProduct` helper
- Check all required fields are present

## Performance Tips

1. **Load products once**: Cache the all products array
2. **Memoize recommendations**: Use React.useMemo
3. **Lazy load**: Only load recommendations when section is visible
4. **Limit results**: Don't request more than you need

```typescript
const recommendations = useMemo(
  () => getPersonalizedRecommendations(allProducts, 12),
  [allProducts, userInteractions.length]
)
```

## Next Steps

1. ✅ Add tracking to product pages
2. ✅ Show recommendations on homepage
3. ✅ Add to cart page recommendations
4. ✅ Track purchases after checkout
5. ✅ Add navigation link to `/recommendations`

## Full Documentation

- 📖 [RECOMMENDATIONS_SYSTEM.md](./RECOMMENDATIONS_SYSTEM.md) - Complete algorithm documentation
- 📚 [RECOMMENDATIONS_INTEGRATION_EXAMPLES.md](./RECOMMENDATIONS_INTEGRATION_EXAMPLES.md) - Detailed integration examples

## Support

For issues or questions:
1. Check the documentation files
2. Review the TypeScript types in `recommendations-store.ts`
3. Look at the `/recommendations` page for working examples

---

**Made with ❤️ for Channah B2B Marketplace**
