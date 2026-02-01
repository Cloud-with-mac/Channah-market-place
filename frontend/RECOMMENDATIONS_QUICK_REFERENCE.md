# Smart Recommendations - Quick Reference Card

## Quick Links

| What | Where |
|------|-------|
| Live Page | `/recommendations` |
| Store File | `frontend/store/recommendations-store.ts` |
| UI Page | `frontend/app/recommendations/page.tsx` |
| Quick Start | `RECOMMENDATIONS_QUICKSTART.md` |
| Full Docs | `RECOMMENDATIONS_SYSTEM.md` |

## Import & Use

```typescript
import { useRecommendationsStore } from '@/store/recommendations-store'

const {
  // Track actions
  trackProductView,
  trackPurchase,
  trackInteraction,

  // Get recommendations
  getPersonalizedRecommendations,
  getSimilarProducts,
  getTrendingProducts,

  // Data
  viewedProducts,
  userInteractions
} = useRecommendationsStore()
```

## Track User Actions

```typescript
// On product page
trackProductView(product, 30) // product object, 30 seconds

// After purchase
trackPurchase(productId, categoryId, vendorId, quantity, price)

// On add to cart
trackInteraction(productId, 'cart')

// On add to wishlist
trackInteraction(productId, 'wishlist')
```

## Get Recommendations

```typescript
// Personalized for user
const recommended = getPersonalizedRecommendations(allProducts, 12)

// Similar to current product
const similar = getSimilarProducts(currentProduct, allProducts, 8)

// Customers also bought
const alsoBought = getCustomersAlsoBought(productId, allProducts, 6)

// Cross-sell opportunities
const crossSell = getCrossSellProducts(currentProduct, allProducts, 6)

// Overall trending
const trending = getTrendingProducts(allProducts, 12)

// Category trending
const categoryTrending = getTrendingInCategory(categoryId, allProducts, 8)

// Recently viewed
const recent = getRecentlyViewed(10)
```

## Interaction Scores

| Action | Score | Weight |
|--------|-------|--------|
| View (basic) | 1 | Low |
| View (50s+) | 5 | Medium |
| Wishlist | 5 | Medium |
| Compare | 3 | Low-Medium |
| Add to Cart | 10 | High |
| Purchase | 50 | Very High |

## Algorithm Weights

| Algorithm | Weight | Use Case |
|-----------|--------|----------|
| Collaborative | 35% | User preferences |
| Content-Based | 30% | Product similarity |
| Trending | 20% | Popular products |
| Cross-Sell | 15% | Complementary items |

## Product Type

```typescript
interface Product {
  id: string
  name: string
  slug: string
  price: number
  compareAtPrice?: number
  image: string
  rating: number
  reviewCount: number
  category: {
    id: string
    name: string
    slug: string
  }
  vendor: {
    id: string
    name: string
    slug: string
    verified?: boolean
  }
  inStock?: boolean
  totalSales?: number
  viewCount?: number
  tags?: string[]
  specifications?: Record<string, any>
}
```

## Transform API Data

```typescript
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
      id: p.category_id || 'general',
      name: p.category?.name || 'General',
      slug: p.category?.slug || 'general',
    },
    vendor: {
      id: p.vendor_id || 'unknown',
      name: p.vendor_name || 'Unknown',
      slug: p.vendor?.slug || 'unknown',
      verified: p.vendor?.verified || false,
    },
    inStock: p.quantity > 0 || p.in_stock || true,
    totalSales: p.total_sales || 0,
    viewCount: p.view_count || 0,
    tags: p.tags || [],
    specifications: p.specifications || {},
  }
}
```

## Common Patterns

### Product Detail Page
```typescript
useEffect(() => {
  trackProductView(product, viewDuration)
  return () => {
    const duration = Math.floor((Date.now() - startTime) / 1000)
    trackProductView(product, duration)
  }
}, [product.id])

const similar = getSimilarProducts(product, allProducts, 8)
```

### Homepage
```typescript
const personalized = getPersonalizedRecommendations(allProducts, 12)
const trending = getTrendingProducts(allProducts, 12)
```

### Cart Page
```typescript
const alsoBought = getCustomersAlsoBought(cartItems[0].id, allProducts, 6)
const crossSell = getCrossSellProducts(cartItems[0], allProducts, 6)
```

### Checkout Success
```typescript
useEffect(() => {
  order.items.forEach(item => {
    trackPurchase(item.product_id, item.category_id, item.vendor_id, item.quantity, item.price)
  })
}, [order])
```

## UI Components

### Product Card
```typescript
<ProductCard
  product={product}
  badge={{ text: 'Trending', variant: 'destructive', icon: <Flame /> }}
  reason="Popular in your category"
  compact={false}
/>
```

### Recommendation Section
```typescript
<RecommendationSection
  title="Recommended For You"
  description="Based on your browsing"
  icon={<Sparkles className="h-5 w-5" />}
  products={recommendations}
  badge={{ text: 'AI Recommended', variant: 'default' }}
/>
```

## Performance Tips

```typescript
// Memoize recommendations
const recommendations = useMemo(
  () => getPersonalizedRecommendations(allProducts, 12),
  [allProducts, userInteractions.length]
)

// Load products once
useEffect(() => {
  productsAPI.getAll().then(setAllProducts)
}, [])

// Limit results
getTrendingProducts(allProducts, 12) // Don't request more than needed
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| No recommendations | Check `allProducts.length > 0` |
| Same recommendations | Clear cache with `clearHistory()` |
| TypeScript errors | Use `transformProduct()` helper |
| Slow performance | Reduce product count or use memoization |

## Data Limits

- **Viewed Products**: Max 50 (automatic cleanup)
- **Interactions**: Max 200 (automatic cleanup)
- **Purchase History**: Unlimited (user controlled)
- **Recommended Products**: 1000+ supported

## Features

✅ 6 recommendation algorithms
✅ Real-time tracking
✅ Persistent storage (LocalStorage)
✅ Privacy-first (client-side only)
✅ Professional UI
✅ Responsive design
✅ Currency conversion support
✅ Performance optimized

## Key Files

```
frontend/
├── store/
│   └── recommendations-store.ts       # Core engine (23.6 KB)
├── app/
│   └── recommendations/
│       └── page.tsx                   # UI page (31.0 KB)
└── docs/
    ├── RECOMMENDATIONS_QUICKSTART.md
    ├── RECOMMENDATIONS_SYSTEM.md
    ├── RECOMMENDATIONS_INTEGRATION_EXAMPLES.md
    ├── RECOMMENDATIONS_ARCHITECTURE.md
    └── RECOMMENDATIONS_TESTING.md
```

## Testing

```typescript
// Mock usage
const { trackProductView, getPersonalizedRecommendations } = useRecommendationsStore()

// Track some views
trackProductView(product1, 30)
trackProductView(product2, 20)

// Get recommendations
const recs = getPersonalizedRecommendations(allProducts, 10)
console.log(recs) // Array of recommended products

// Check insights
const insights = getRecommendationInsights(product1.id)
console.log(insights) // { viewCount, lastViewed, purchaseCount, interactionScore }

// Clear data
clearHistory() // Removes all tracking data
```

## Navigation Integration

```typescript
// Add to header
<Link href="/recommendations" className="flex items-center gap-2">
  <Sparkles className="h-4 w-4" />
  For You
  {viewedProducts.length > 0 && (
    <Badge>{viewedProducts.length}</Badge>
  )}
</Link>
```

## Customization

### Adjust Weights
```typescript
// In recommendations-store.ts, line ~520
const recommendations = RecommendationEngine.getHybridRecommendations(
  userInteractions,
  allProducts,
  currentProduct,
  {
    collaborative: 0.40,  // Increase from 0.35
    contentBased: 0.30,
    trending: 0.20,
    crossSell: 0.10       // Decrease from 0.15
  }
)
```

### Add Custom Algorithm
```typescript
// In RecommendationEngine class
static customAlgorithm(params): RecommendationScore[] {
  // Your custom logic
  return scores
}

// Use in hybrid
const custom = RecommendationEngine.customAlgorithm(params)
```

## Support

- 📖 Read: `RECOMMENDATIONS_SYSTEM.md`
- 🚀 Quick: `RECOMMENDATIONS_QUICKSTART.md`
- 💡 Examples: `RECOMMENDATIONS_INTEGRATION_EXAMPLES.md`
- 🏗️ Architecture: `RECOMMENDATIONS_ARCHITECTURE.md`
- 🧪 Testing: `RECOMMENDATIONS_TESTING.md`

---

**Keep this card handy for quick reference!**
