# Smart Product Recommendations System

## Overview

A comprehensive AI-powered product recommendation engine for the Channah B2B Marketplace. This system uses multiple recommendation algorithms including collaborative filtering, content-based filtering, trending analysis, and cross-sell optimization to provide personalized product suggestions.

## Architecture

### Files Structure

```
frontend/
├── store/
│   └── recommendations-store.ts       # Main recommendation engine and state management
├── app/
│   └── recommendations/
│       └── page.tsx                   # Recommendations UI page
```

## Recommendation Algorithms

### 1. Collaborative Filtering (User-Based)

**How it works:**
- Analyzes user interaction history (views, cart additions, wishlist, purchases)
- Builds user preference profiles based on categories and vendors
- Scores products based on category affinity, vendor preference, and price similarity
- Weights: Category (40%), Vendor (30%), Price Similarity (30%)

**Score Calculation:**
```typescript
score = (categoryAffinity * 0.4) + (vendorAffinity * 0.3) + (priceSimilarity * 20)
```

**Use Cases:**
- "Recommended For You" section
- Personalized homepage feeds
- Email recommendations

### 2. Content-Based Filtering (Product Similarity)

**How it works:**
- Compares product attributes (category, price, rating, tags, specifications)
- Calculates similarity scores based on multiple factors
- Finds products similar to what users have viewed or purchased

**Scoring Factors:**
- Same category: +50 points
- Price similarity (±30%): +30 points
- Similar rating: +20 points
- Common tags: +10 points per tag
- Matching specifications: +5 points per match
- Same vendor: +15 points

**Use Cases:**
- "Similar Products" section
- Alternative product suggestions
- Product detail page recommendations

### 3. Trending Algorithm

**How it works:**
- Analyzes product popularity based on sales velocity and view counts
- Applies quality filters (rating, review count)
- Boosts verified vendors and in-stock products

**Scoring Factors:**
```typescript
score = (totalSales * 2) + (viewCount * 0.5) + qualityBonus + verifiedBonus + stockBonus
```

**Quality Bonuses:**
- Rating ≥ 4.5 with 10+ reviews: +30 points
- In stock: +10 points
- Verified vendor: +15 points

**Use Cases:**
- "Trending Now" section
- Homepage featured products
- Category landing pages

### 4. Frequently Bought Together

**How it works:**
- Uses market basket analysis on purchase history
- Groups purchases by session (within 1-hour window)
- Calculates co-occurrence patterns and association rules

**Metrics:**
```typescript
confidence = co-purchases / total_sessions_with_product
lift = co-occurrence / sessions_with_candidate
score = (confidence * 100) + (lift * 20)
```

**Use Cases:**
- "Customers Also Bought" section
- Product bundles
- Cart upsells

### 5. Cross-Sell Opportunities

**How it works:**
- Identifies complementary products from different categories
- Analyzes price relationships (accessories typically 10-50% of main product price)
- Prioritizes same vendor for easier checkout

**Scoring Factors:**
- Complementary category: +40 points
- Price complementarity: +20 points
- Same vendor: +25 points
- High rating (≥4.0): +15 points

**Complementary Category Mapping:**
```typescript
{
  'electronics': ['accessories', 'cables', 'cases'],
  'furniture': ['decor', 'lighting', 'textiles'],
  'apparel': ['footwear', 'accessories', 'jewelry'],
  'kitchen': ['cookware', 'utensils', 'storage']
}
```

**Use Cases:**
- "Complete Your Setup" section
- Checkout recommendations
- Bundle suggestions

### 6. Hybrid Recommendations

**How it works:**
- Combines multiple algorithms with weighted scores
- Adapts weights based on available data
- Provides diverse recommendations

**Default Weights:**
```typescript
{
  collaborative: 0.35,   // 35%
  contentBased: 0.30,    // 30%
  trending: 0.20,        // 20%
  crossSell: 0.15        // 15%
}
```

**Use Cases:**
- Main "For You" feed
- Personalized search results
- Smart sorting

## User Interaction Tracking

### Interaction Types and Scores

| Action | Score | Weight |
|--------|-------|--------|
| View | 1-5 | Based on duration (max 50s = 5 points) |
| Wishlist | 5 | Medium interest |
| Compare | 3 | Evaluation phase |
| Add to Cart | 10 | High intent |
| Purchase | 50 | Strongest signal |

### Data Retention

- **Viewed Products**: Last 50 products
- **User Interactions**: Last 200 interactions
- **Purchase History**: Unlimited (persisted)

### Privacy & Storage

- All data stored locally in browser (Zustand + LocalStorage)
- No server-side tracking by default
- Users can clear history anytime
- GDPR compliant with user control

## Store API Reference

### State

```typescript
interface RecommendationsState {
  // Tracking Data
  viewedProducts: ViewedProduct[]
  purchaseHistory: PurchaseHistory[]
  userInteractions: UserInteraction[]

  // Cached Recommendations
  personalizedRecommendations: Product[]
  similarProducts: Map<string, Product[]>
  trendingProducts: Product[]
  categoryTrending: Map<string, Product[]>

  // Loading States
  isLoadingPersonalized: boolean
  isLoadingTrending: boolean
}
```

### Actions

#### Tracking Actions

```typescript
// Track product view (automatically called on product page)
trackProductView(product: Product, duration?: number): void

// Track purchase (call after successful order)
trackPurchase(
  productId: string,
  categoryId: string,
  vendorId: string,
  quantity: number,
  price: number
): void

// Track interaction (cart, wishlist, compare)
trackInteraction(
  productId: string,
  action: 'view' | 'cart' | 'wishlist' | 'purchase' | 'compare'
): void

// Clear all history
clearHistory(): void
```

#### Recommendation Actions

```typescript
// Get personalized recommendations
getPersonalizedRecommendations(
  allProducts: Product[],
  limit?: number
): Product[]

// Get similar products
getSimilarProducts(
  product: Product,
  allProducts: Product[],
  limit?: number
): Product[]

// Get frequently bought together
getCustomersAlsoBought(
  productId: string,
  allProducts: Product[],
  limit?: number
): Product[]

// Get cross-sell opportunities
getCrossSellProducts(
  product: Product,
  allProducts: Product[],
  limit?: number
): Product[]

// Get trending in category
getTrendingInCategory(
  categoryId: string,
  allProducts: Product[],
  limit?: number
): Product[]

// Get overall trending
getTrendingProducts(
  allProducts: Product[],
  limit?: number
): Product[]

// Get recently viewed
getRecentlyViewed(limit?: number): Product[]

// Get recommendation insights
getRecommendationInsights(productId: string): {
  viewCount: number
  lastViewed?: number
  purchaseCount: number
  interactionScore: number
}
```

## Usage Examples

### Basic Usage

```typescript
import { useRecommendationsStore } from '@/store/recommendations-store'

function ProductPage({ product }) {
  const {
    trackProductView,
    getSimilarProducts,
    getCrossSellProducts
  } = useRecommendationsStore()

  const [allProducts, setAllProducts] = useState([])

  useEffect(() => {
    // Track view on page load
    trackProductView(product, 30) // 30 seconds

    // Load all products for recommendations
    loadProducts().then(setAllProducts)
  }, [product.id])

  const similarProducts = getSimilarProducts(product, allProducts, 8)
  const crossSellProducts = getCrossSellProducts(product, allProducts, 6)

  return (
    <>
      <ProductDetails product={product} />
      <SimilarProducts products={similarProducts} />
      <CrossSellProducts products={crossSellProducts} />
    </>
  )
}
```

### Track Purchase

```typescript
function CheckoutSuccess({ order }) {
  const { trackPurchase } = useRecommendationsStore()

  useEffect(() => {
    order.items.forEach(item => {
      trackPurchase(
        item.productId,
        item.product.categoryId,
        item.product.vendorId,
        item.quantity,
        item.price
      )
    })
  }, [order])

  return <OrderConfirmation order={order} />
}
```

### Track Interactions

```typescript
function ProductCard({ product }) {
  const { trackInteraction } = useRecommendationsStore()
  const { addItem: addToCart } = useCartStore()
  const { addItem: addToWishlist } = useWishlistStore()

  const handleAddToCart = () => {
    trackInteraction(product.id, 'cart')
    addToCart(product)
  }

  const handleAddToWishlist = () => {
    trackInteraction(product.id, 'wishlist')
    addToWishlist(product)
  }

  return (
    <Card>
      <Button onClick={handleAddToCart}>Add to Cart</Button>
      <Button onClick={handleAddToWishlist}>Save</Button>
    </Card>
  )
}
```

### Personalized Homepage

```typescript
function HomePage() {
  const { getPersonalizedRecommendations, getTrendingProducts } = useRecommendationsStore()
  const [allProducts, setAllProducts] = useState([])

  useEffect(() => {
    loadProducts().then(setAllProducts)
  }, [])

  const personalizedProducts = getPersonalizedRecommendations(allProducts, 12)
  const trendingProducts = getTrendingProducts(allProducts, 12)

  return (
    <>
      <Section title="Recommended For You" products={personalizedProducts} />
      <Section title="Trending Now" products={trendingProducts} />
    </>
  )
}
```

## UI Components

### Recommendations Page Features

The `/recommendations` page includes:

1. **Personalized Tab**
   - Recommended For You (AI-powered hybrid recommendations)
   - Recently Viewed (chronological history)
   - Similar Products (content-based)
   - Customers Also Bought (collaborative)
   - Complete Your Setup (cross-sell)

2. **Trending Tab**
   - Trending Now (overall marketplace)
   - Trending in Your Categories (filtered by user interests)
   - Category filter chips

3. **Discover Tab**
   - New Arrivals
   - Top Rated Products
   - Best Value Deals

4. **Statistics Dashboard**
   - Products Viewed
   - Total Interactions
   - Categories Explored
   - Vendors Discovered

### Product Card Features

- Badge system for recommendation reasons
- Discount calculations
- Rating display
- Vendor verification badges
- Stock status
- Hover effects and animations
- Responsive design

## Performance Optimization

### Caching Strategy

1. **Recommendation Caching**
   - Similar products cached per product
   - Trending cached globally
   - Category trending cached per category
   - Cache invalidation on product updates

2. **Computation Optimization**
   - Memoized calculations with useMemo
   - Lazy computation (only when needed)
   - Incremental updates vs full recalculation

3. **Data Limits**
   - Max 50 viewed products
   - Max 200 interactions
   - Automatic cleanup of old data

### Loading States

- Skeleton loaders for better UX
- Progressive rendering
- Lazy loading for off-screen products

## Algorithm Tuning

### Adjustable Parameters

```typescript
// Hybrid algorithm weights
const weights = {
  collaborative: 0.35,
  contentBased: 0.30,
  trending: 0.20,
  crossSell: 0.15
}

// Trending time window
const timeWindowDays = 7

// Session window for co-purchase
const sessionWindow = 60 * 60 * 1000 // 1 hour

// Price similarity threshold
const priceThreshold = 0.3 // ±30%
```

### A/B Testing Recommendations

To test different algorithm configurations:

```typescript
// Version A: More collaborative filtering
const weightsA = { collaborative: 0.5, contentBased: 0.2, trending: 0.2, crossSell: 0.1 }

// Version B: More content-based
const weightsB = { collaborative: 0.25, contentBased: 0.45, trending: 0.2, crossSell: 0.1 }

// Use in recommendation call
const recommendations = RecommendationEngine.getHybridRecommendations(
  userInteractions,
  allProducts,
  currentProduct,
  weightsA // or weightsB
)
```

## Integration with Backend (Optional)

While the current implementation is client-side, you can enhance it with backend integration:

### Track Events API

```typescript
// POST /api/recommendations/track
{
  "event_type": "view" | "cart" | "wishlist" | "purchase",
  "product_id": "string",
  "metadata": {
    "duration": 30,
    "source": "search" | "recommendation" | "direct"
  }
}
```

### Get Recommendations API

```typescript
// GET /api/recommendations/personalized
Response: {
  "recommendations": Product[],
  "algorithm": "hybrid",
  "confidence_score": 0.85
}
```

### Benefits of Backend Integration

1. Cross-device synchronization
2. More sophisticated ML models
3. Real-time collaborative filtering across all users
4. Better trending analysis with global data
5. A/B testing capabilities
6. Analytics and reporting

## Analytics & Metrics

### Key Metrics to Track

1. **Recommendation Quality**
   - Click-through rate (CTR)
   - Conversion rate
   - Add-to-cart rate
   - Revenue per recommendation

2. **User Engagement**
   - Products viewed
   - Categories explored
   - Time spent on recommendations page
   - Return visit rate

3. **Algorithm Performance**
   - Diversity of recommendations
   - Coverage (% of catalog recommended)
   - Novelty (new vs repeat recommendations)
   - Serendipity (unexpected relevant suggestions)

### Success Indicators

- CTR > 5%
- Conversion rate > 2%
- 70%+ of users interact with recommendations
- 30%+ of revenue from recommended products

## Future Enhancements

### Short-term

1. **Session-based Recommendations**
   - Real-time updates during browsing
   - Cart abandonment recovery
   - Search query integration

2. **Enhanced Personalization**
   - Industry-specific recommendations
   - Company size-based filtering
   - Budget-aware suggestions

3. **Social Proof Integration**
   - "Trending in your industry"
   - "Popular with similar companies"
   - Peer-based recommendations

### Long-term

1. **Machine Learning Models**
   - Deep learning for pattern recognition
   - Neural collaborative filtering
   - Contextual bandits for exploration/exploitation

2. **Advanced Features**
   - Image-based similarity
   - Natural language search integration
   - Predictive ordering (auto-suggest reorders)
   - Seasonal and trend forecasting

3. **Business Intelligence**
   - Vendor performance insights
   - Category opportunity analysis
   - Market trend prediction
   - Demand forecasting

## Troubleshooting

### Common Issues

**Q: Recommendations not showing**
- Ensure products are loaded (`allProducts` array not empty)
- Check user has interaction history
- Verify LocalStorage is enabled

**Q: Same products always recommended**
- Clear recommendation history
- Increase diversity in browsing
- Check cache invalidation

**Q: Poor recommendation quality**
- Need more user interactions (min 10-20 views)
- Adjust algorithm weights
- Verify product metadata quality

**Q: Performance issues**
- Reduce product dataset size
- Implement pagination
- Add memoization for expensive calculations

## License

Copyright © 2024 Channah Marketplace. All rights reserved.

---

**Built with:**
- TypeScript
- Zustand (State Management)
- Next.js 14
- Tailwind CSS
- shadcn/ui Components
