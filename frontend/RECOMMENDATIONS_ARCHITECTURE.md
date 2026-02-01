# Smart Recommendations System - Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                    CHANNAH MARKETPLACE FRONTEND                      │
│                                                                       │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │                    User Interface Layer                         │ │
│  │                                                                  │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │ │
│  │  │  Homepage    │  │   Product    │  │  Category    │         │ │
│  │  │              │  │   Detail     │  │   Pages      │         │ │
│  │  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘         │ │
│  │         │                 │                  │                  │ │
│  │         │   ┌─────────────┴──────────────┐  │                  │ │
│  │         │   │  /recommendations          │  │                  │ │
│  │         │   │  Main Recommendations Page │  │                  │ │
│  │         │   └─────────────┬──────────────┘  │                  │ │
│  │         └─────────────────┴─────────────────┘                  │ │
│  │                           │                                      │ │
│  └───────────────────────────┼──────────────────────────────────────┘ │
│                              │                                        │
│  ┌───────────────────────────┼──────────────────────────────────────┐ │
│  │               Recommendations Store (Zustand)                    │ │
│  │                                                                  │ │
│  │  ┌──────────────────────────────────────────────────────────┐  │ │
│  │  │                    State Management                       │  │ │
│  │  │                                                            │  │ │
│  │  │  • viewedProducts[]      (Recent 50 products)            │  │ │
│  │  │  • userInteractions[]    (Recent 200 actions)            │  │ │
│  │  │  • purchaseHistory[]     (All purchases)                 │  │ │
│  │  │  • personalizedRecs[]    (Cached results)                │  │ │
│  │  │  • trendingProducts[]    (Cached trending)               │  │ │
│  │  │                                                            │  │ │
│  │  └────────────────────────┬─────────────────────────────────┘  │ │
│  │                           │                                     │ │
│  │  ┌────────────────────────┴─────────────────────────────────┐  │ │
│  │  │              Recommendation Engine                        │  │ │
│  │  │                                                            │  │ │
│  │  │  ┌──────────────────────────────────────────────────┐    │  │ │
│  │  │  │  Collaborative Filtering                         │    │  │ │
│  │  │  │  • User preference profiling                     │    │  │ │
│  │  │  │  • Category affinity (40% weight)                │    │  │ │
│  │  │  │  • Vendor preference (30% weight)                │    │  │ │
│  │  │  │  • Price similarity (30% weight)                 │    │  │ │
│  │  │  └──────────────────────────────────────────────────┘    │  │ │
│  │  │                                                            │  │ │
│  │  │  ┌──────────────────────────────────────────────────┐    │  │ │
│  │  │  │  Content-Based Filtering                         │    │  │ │
│  │  │  │  • Product attribute comparison                  │    │  │ │
│  │  │  │  • Category matching (+50 points)                │    │  │ │
│  │  │  │  • Price similarity (+30 points)                 │    │  │ │
│  │  │  │  • Tag/spec overlap (+10/+5 points)              │    │  │ │
│  │  │  └──────────────────────────────────────────────────┘    │  │ │
│  │  │                                                            │  │ │
│  │  │  ┌──────────────────────────────────────────────────┐    │  │ │
│  │  │  │  Trending Algorithm                              │    │  │ │
│  │  │  │  • Sales velocity (2x multiplier)                │    │  │ │
│  │  │  │  • View count (0.5x multiplier)                  │    │  │ │
│  │  │  │  • Quality bonuses (rating, reviews)             │    │  │ │
│  │  │  └──────────────────────────────────────────────────┘    │  │ │
│  │  │                                                            │  │ │
│  │  │  ┌──────────────────────────────────────────────────┐    │  │ │
│  │  │  │  Frequently Bought Together                      │    │  │ │
│  │  │  │  • Market basket analysis                        │    │  │ │
│  │  │  │  • Co-occurrence patterns                        │    │  │ │
│  │  │  │  • Association rules (confidence + lift)         │    │  │ │
│  │  │  └──────────────────────────────────────────────────┘    │  │ │
│  │  │                                                            │  │ │
│  │  │  ┌──────────────────────────────────────────────────┐    │  │ │
│  │  │  │  Cross-Sell Opportunities                        │    │  │ │
│  │  │  │  • Complementary categories                      │    │  │ │
│  │  │  │  • Price relationships                           │    │  │ │
│  │  │  │  • Same vendor optimization                      │    │  │ │
│  │  │  └──────────────────────────────────────────────────┘    │  │ │
│  │  │                                                            │  │ │
│  │  │  ┌──────────────────────────────────────────────────┐    │  │ │
│  │  │  │  Hybrid Recommender                              │    │  │ │
│  │  │  │  • Combines all algorithms                       │    │  │ │
│  │  │  │  • Weighted scoring                              │    │  │ │
│  │  │  │  • Adaptive algorithm selection                  │    │  │ │
│  │  │  └──────────────────────────────────────────────────┘    │  │ │
│  │  │                                                            │  │ │
│  │  └────────────────────────────────────────────────────────┘  │ │
│  │                                                                │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │                    Persistence Layer                           │ │
│  │                                                                 │ │
│  │    Browser LocalStorage (Zustand Persist Middleware)          │ │
│  │    • Automatic serialization                                   │ │
│  │    • Rehydration on page load                                  │ │
│  │    • GDPR compliant (client-side only)                         │ │
│  │                                                                 │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

## Data Flow

### 1. User Interaction Tracking

```
User Action ──┐
              │
              ├─► View Product ────────► trackProductView()
              │                               │
              │                               ├─► Store in viewedProducts[]
              │                               └─► Create UserInteraction (score: 1-5)
              │
              ├─► Add to Cart ────────► trackInteraction('cart')
              │                               │
              │                               └─► Create UserInteraction (score: 10)
              │
              ├─► Add to Wishlist ───► trackInteraction('wishlist')
              │                               │
              │                               └─► Create UserInteraction (score: 5)
              │
              └─► Purchase ───────────► trackPurchase()
                                             │
                                             ├─► Store in purchaseHistory[]
                                             └─► Create UserInteraction (score: 50)
```

### 2. Recommendation Generation

```
Request Recommendations
         │
         ├─► Load allProducts[] from API
         │
         ├─► Get user's interaction history
         │         │
         │         ├─► viewedProducts[]
         │         ├─► userInteractions[]
         │         └─► purchaseHistory[]
         │
         ├─► Run Recommendation Algorithms
         │         │
         │         ├─► Collaborative Filtering ──► 35% weight
         │         │        │
         │         │        ├─► Category preferences
         │         │        ├─► Vendor preferences
         │         │        └─► Price patterns
         │         │
         │         ├─► Content-Based Filtering ──► 30% weight
         │         │        │
         │         │        ├─► Product similarity
         │         │        ├─► Attribute matching
         │         │        └─► Specification overlap
         │         │
         │         ├─► Trending Analysis ────────► 20% weight
         │         │        │
         │         │        ├─► Sales velocity
         │         │        ├─► View counts
         │         │        └─► Quality metrics
         │         │
         │         └─► Cross-Sell Analysis ───────► 15% weight
         │                  │
         │                  ├─► Complementary products
         │                  ├─► Price relationships
         │                  └─► Vendor matching
         │
         ├─► Combine & Weight Scores
         │         │
         │         └─► Normalize and rank
         │
         ├─► Apply Business Rules
         │         │
         │         ├─► Remove out-of-stock (optional)
         │         ├─► Boost verified vendors
         │         ├─► Diversify categories
         │         └─► Filter duplicates
         │
         ├─► Cache Results
         │
         └─► Return Top N Products
```

### 3. Scoring System

```
Product Score = Σ (Algorithm Score × Weight)

Example Calculation:
─────────────────────────────────────────────────────────
Product: "Industrial Mixer X2000"

Collaborative Filtering:
  Category affinity:    45 points
  Vendor preference:    30 points
  Price similarity:     20 points
  ───────────────────────────────
  Subtotal:             95 × 0.35 = 33.25

Content-Based:
  Same category:        50 points
  Similar price:        25 points
  Tag overlap:          20 points
  ───────────────────────────────
  Subtotal:             95 × 0.30 = 28.50

Trending:
  Sales velocity:       80 points
  View count:           40 points
  Quality bonus:        30 points
  ───────────────────────────────
  Subtotal:            150 × 0.20 = 30.00

Cross-Sell:
  (Not applicable for this context)
  Subtotal:              0 × 0.15 = 0.00
  ───────────────────────────────

TOTAL SCORE:                     = 91.75
─────────────────────────────────────────────────────────
```

## Component Architecture

### Store Structure

```typescript
RecommendationsStore
│
├─── State
│    ├─── viewedProducts: ViewedProduct[]
│    ├─── purchaseHistory: PurchaseHistory[]
│    ├─── userInteractions: UserInteraction[]
│    ├─── personalizedRecommendations: Product[]
│    ├─── similarProducts: Map<productId, Product[]>
│    ├─── trendingProducts: Product[]
│    └─── categoryTrending: Map<categoryId, Product[]>
│
├─── Tracking Actions
│    ├─── trackProductView(product, duration)
│    ├─── trackPurchase(productId, categoryId, vendorId, qty, price)
│    ├─── trackInteraction(productId, action)
│    └─── clearHistory()
│
├─── Recommendation Actions
│    ├─── getPersonalizedRecommendations(allProducts, limit)
│    ├─── getSimilarProducts(product, allProducts, limit)
│    ├─── getCustomersAlsoBought(productId, allProducts, limit)
│    ├─── getCrossSellProducts(product, allProducts, limit)
│    ├─── getTrendingInCategory(categoryId, allProducts, limit)
│    ├─── getTrendingProducts(allProducts, limit)
│    └─── getRecentlyViewed(limit)
│
└─── Utilities
     └─── getRecommendationInsights(productId)
```

### UI Component Hierarchy

```
/recommendations (Page)
│
├─── Header Section
│    ├─── Page Title
│    ├─── Description
│    └─── Statistics Dashboard
│         ├─── Products Viewed
│         ├─── Total Interactions
│         ├─── Categories Explored
│         └─── Vendors Discovered
│
├─── Tabs Navigation
│    ├─── For You
│    ├─── Trending
│    └─── Discover
│
├─── Tab: For You
│    ├─── Recommended For You (Hybrid Algorithm)
│    ├─── Recently Viewed (Chronological)
│    ├─── Similar Products (Content-Based)
│    ├─── Customers Also Bought (Collaborative)
│    └─── Complete Your Setup (Cross-Sell)
│
├─── Tab: Trending
│    ├─── Trending Now (Overall)
│    ├─── Category Filter Chips
│    └─── Trending in Category (Filtered)
│
├─── Tab: Discover
│    ├─── New Arrivals
│    ├─── Top Rated Products
│    └─── Best Value Deals
│
└─── CTA Section
     └─── Get Better Recommendations
```

## Algorithm Details

### Collaborative Filtering

```
Input: userInteractions[], allProducts[]

Process:
1. Build user preference profile
   ├─── categoryPreferences = Map<categoryId, score>
   ├─── vendorPreferences = Map<vendorId, score>
   └─── avgPrice = average of purchased/carted prices

2. For each product:
   score = 0

   if (product.category in categoryPreferences):
     score += categoryPreferences[category] × 0.4

   if (product.vendor in vendorPreferences):
     score += vendorPreferences[vendor] × 0.3

   priceDiff = |product.price - avgPrice| / avgPrice
   if (priceDiff < 0.3):
     score += 20 × (1 - priceDiff)

3. Sort by score descending

Output: RecommendationScore[]
```

### Content-Based Filtering

```
Input: targetProduct, allProducts[]

Process:
1. For each candidate product (except target):
   score = 0

   if (candidate.category == target.category):
     score += 50

   priceDiff = |candidate.price - target.price| / target.price
   if (priceDiff < 0.3):
     score += 30 × (1 - priceDiff)

   ratingDiff = |candidate.rating - target.rating|
   if (ratingDiff < 1):
     score += 20 × (1 - ratingDiff/5)

   commonTags = intersection(target.tags, candidate.tags)
   score += commonTags.length × 10

   if (candidate.vendor == target.vendor):
     score += 15

2. Sort by score descending

Output: RecommendationScore[]
```

### Trending Algorithm

```
Input: allProducts[], categoryId (optional)

Process:
1. Filter by category (if specified)

2. For each product:
   score = 0

   score += product.totalSales × 2
   score += product.viewCount × 0.5

   if (product.rating >= 4.5 && reviewCount >= 10):
     score += 30

   if (product.inStock):
     score += 10

   if (product.vendor.verified):
     score += 15

3. Sort by score descending

Output: RecommendationScore[]
```

## Performance Characteristics

### Time Complexity

| Operation | Complexity | Notes |
|-----------|-----------|-------|
| trackProductView | O(1) | Simple array append |
| trackInteraction | O(1) | Simple array append |
| Collaborative Filtering | O(n × m) | n = products, m = interactions |
| Content-Based Filtering | O(n) | n = products |
| Trending Algorithm | O(n) | n = products |
| Hybrid Recommendations | O(n × m) | Combines multiple algorithms |

### Space Complexity

| Data Structure | Size | Retention |
|----------------|------|-----------|
| viewedProducts | Max 50 items | Recent only |
| userInteractions | Max 200 items | Recent only |
| purchaseHistory | Unlimited | Persistent |
| Cache (similar products) | Per product | Until reload |
| Cache (trending) | Global | Until reload |

### Optimization Strategies

1. **Memoization**: Cache expensive calculations
2. **Lazy Loading**: Compute only when needed
3. **Incremental Updates**: Update scores, don't recalculate all
4. **Data Pruning**: Limit historical data to recent items
5. **Index Structures**: Use Maps for O(1) lookups

## Scalability Considerations

### Current (Client-Side)

```
Handles:
✓ Up to 1,000 products efficiently
✓ Up to 200 user interactions
✓ Real-time recommendations
✓ No server overhead

Limitations:
✗ No cross-device sync
✗ Limited to browser storage
✗ No global collaborative filtering
```

### Future (Backend Integration)

```
Potential Enhancements:
✓ Distributed computing for large catalogs
✓ Real-time collaborative filtering across users
✓ Machine learning model training
✓ A/B testing frameworks
✓ Advanced analytics

Architecture:
┌─────────┐
│ Frontend│───► Track Events ───► │ Event Queue │
└─────────┘                        │   (Kafka)   │
                                   └──────┬──────┘
                                          │
                           ┌──────────────┴───────────────┐
                           │                              │
                    ┌──────▼──────┐              ┌───────▼──────┐
                    │   Stream    │              │   Batch      │
                    │  Processing │              │  Processing  │
                    │  (Flink)    │              │  (Spark)     │
                    └──────┬──────┘              └───────┬──────┘
                           │                              │
                    ┌──────▼──────────────────────────────▼──────┐
                    │      Recommendation Service                │
                    │      (Python/FastAPI)                      │
                    └──────┬─────────────────────────────────────┘
                           │
                    ┌──────▼──────┐
                    │   Cache     │
                    │   (Redis)   │
                    └─────────────┘
```

## Security & Privacy

### Data Protection

```
✓ Client-side only (no server transmission)
✓ LocalStorage encrypted by browser
✓ No PII tracking (only product IDs)
✓ User-controlled (can clear anytime)
✓ GDPR compliant (user data ownership)
```

### Privacy Features

```typescript
// Users can clear their data
clearHistory() // Removes all tracking data

// No external API calls for recommendations
// Everything computed locally

// Transparent to users
getRecommendationInsights(productId) // Show what we know
```

## Monitoring & Analytics

### Key Metrics to Track

```
Recommendation Quality:
├─── Click-Through Rate (CTR)
├─── Conversion Rate
├─── Add-to-Cart Rate
└─── Revenue Attribution

User Engagement:
├─── Products Viewed
├─── Recommendation Page Visits
├─── Time on Recommendations
└─── Interaction Depth

Algorithm Performance:
├─── Coverage (% catalog recommended)
├─── Diversity (category spread)
├─── Novelty (new discoveries)
└─── Serendipity (surprising relevance)
```

## Future Enhancements Roadmap

### Phase 1: Enhanced Personalization
- Industry-specific recommendations
- Company size-based filtering
- Budget-aware suggestions
- Seasonal trending

### Phase 2: Machine Learning
- Neural collaborative filtering
- Deep learning for embeddings
- Image similarity matching
- NLP for product descriptions

### Phase 3: Business Intelligence
- Vendor performance insights
- Market trend prediction
- Demand forecasting
- Inventory optimization

### Phase 4: Advanced Features
- Real-time collaborative filtering
- Social proof integration
- Predictive ordering
- Auto-suggest reorders

---

**Architecture designed for scalability, performance, and user privacy**
