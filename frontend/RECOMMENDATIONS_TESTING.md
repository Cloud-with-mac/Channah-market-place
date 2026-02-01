# Recommendations System - Testing Guide

Complete testing guide for the Smart Product Recommendations system.

## Testing Strategy

### 1. Unit Tests - Algorithm Testing
### 2. Integration Tests - Store Testing
### 3. Component Tests - UI Testing
### 4. E2E Tests - User Flow Testing
### 5. Performance Tests - Load Testing

---

## 1. Unit Tests - Algorithm Testing

Test individual recommendation algorithms in isolation.

### Setup

```bash
npm install --save-dev @testing-library/react @testing-library/jest-dom jest
```

### Test File: `__tests__/recommendation-engine.test.ts`

```typescript
import {
  Product,
  UserInteraction,
  PurchaseHistory,
} from '@/store/recommendations-store'

// Import the RecommendationEngine class
// Note: You may need to export it from the store file
import { RecommendationEngine } from '@/store/recommendations-store'

describe('RecommendationEngine', () => {
  // Mock data
  const mockProducts: Product[] = [
    {
      id: '1',
      name: 'Industrial Mixer Pro',
      slug: 'industrial-mixer-pro',
      price: 599.99,
      image: '/mixer.jpg',
      rating: 4.5,
      reviewCount: 120,
      category: {
        id: 'cat1',
        name: 'Kitchen Equipment',
        slug: 'kitchen-equipment',
      },
      vendor: {
        id: 'vendor1',
        name: 'ProEquip Ltd',
        slug: 'proequip',
        verified: true,
      },
      inStock: true,
      totalSales: 450,
      viewCount: 2500,
      tags: ['industrial', 'commercial', 'heavy-duty'],
      specifications: { power: '2000W', capacity: '20L' },
    },
    {
      id: '2',
      name: 'Commercial Blender X500',
      slug: 'commercial-blender-x500',
      price: 449.99,
      compareAtPrice: 549.99,
      image: '/blender.jpg',
      rating: 4.7,
      reviewCount: 200,
      category: {
        id: 'cat1',
        name: 'Kitchen Equipment',
        slug: 'kitchen-equipment',
      },
      vendor: {
        id: 'vendor2',
        name: 'BlendMaster Co',
        slug: 'blendmaster',
        verified: true,
      },
      inStock: true,
      totalSales: 680,
      viewCount: 3200,
      tags: ['commercial', 'blender', 'heavy-duty'],
      specifications: { power: '1800W', capacity: '2L' },
    },
    {
      id: '3',
      name: 'Food Processor Elite',
      slug: 'food-processor-elite',
      price: 349.99,
      image: '/processor.jpg',
      rating: 4.3,
      reviewCount: 85,
      category: {
        id: 'cat1',
        name: 'Kitchen Equipment',
        slug: 'kitchen-equipment',
      },
      vendor: {
        id: 'vendor1',
        name: 'ProEquip Ltd',
        slug: 'proequip',
        verified: true,
      },
      inStock: true,
      totalSales: 320,
      viewCount: 1800,
      tags: ['commercial', 'processor'],
      specifications: { power: '1200W', capacity: '4L' },
    },
    {
      id: '4',
      name: 'Measuring Cup Set',
      slug: 'measuring-cup-set',
      price: 29.99,
      image: '/cups.jpg',
      rating: 4.8,
      reviewCount: 450,
      category: {
        id: 'cat2',
        name: 'Accessories',
        slug: 'accessories',
      },
      vendor: {
        id: 'vendor3',
        name: 'Kitchen Basics',
        slug: 'kitchen-basics',
        verified: false,
      },
      inStock: true,
      totalSales: 1200,
      viewCount: 5000,
      tags: ['accessories', 'measuring'],
      specifications: { material: 'stainless-steel' },
    },
  ]

  const mockInteractions: UserInteraction[] = [
    { productId: '1', action: 'view', timestamp: Date.now() - 10000, score: 3 },
    { productId: '1', action: 'cart', timestamp: Date.now() - 5000, score: 10 },
    { productId: '2', action: 'view', timestamp: Date.now() - 8000, score: 2 },
    { productId: '3', action: 'wishlist', timestamp: Date.now() - 3000, score: 5 },
  ]

  describe('Collaborative Filtering', () => {
    test('should return recommendations based on user preferences', () => {
      const recommendations = RecommendationEngine.collaborativeFiltering(
        mockInteractions,
        mockProducts
      )

      expect(recommendations).toBeDefined()
      expect(recommendations.length).toBeGreaterThan(0)
      expect(recommendations[0]).toHaveProperty('productId')
      expect(recommendations[0]).toHaveProperty('score')
      expect(recommendations[0]).toHaveProperty('reasons')
      expect(recommendations[0]).toHaveProperty('algorithm')
    })

    test('should prioritize categories user has interacted with', () => {
      const recommendations = RecommendationEngine.collaborativeFiltering(
        mockInteractions,
        mockProducts
      )

      // User interacted with Kitchen Equipment, should be recommended
      const kitchenProducts = recommendations.filter(r => {
        const product = mockProducts.find(p => p.id === r.productId)
        return product?.category.id === 'cat1'
      })

      expect(kitchenProducts.length).toBeGreaterThan(0)
    })

    test('should not recommend products already interacted with', () => {
      const currentProduct = mockProducts[0]
      const recommendations = RecommendationEngine.collaborativeFiltering(
        mockInteractions,
        mockProducts,
        currentProduct
      )

      expect(recommendations.every(r => r.productId !== currentProduct.id)).toBe(true)
    })

    test('should return empty array when no interactions', () => {
      const recommendations = RecommendationEngine.collaborativeFiltering(
        [],
        mockProducts
      )

      expect(recommendations.length).toBe(0)
    })
  })

  describe('Content-Based Filtering', () => {
    test('should find similar products', () => {
      const targetProduct = mockProducts[0]
      const similar = RecommendationEngine.contentBasedFiltering(
        targetProduct,
        mockProducts
      )

      expect(similar).toBeDefined()
      expect(similar.length).toBeGreaterThan(0)
      expect(similar.every(s => s.productId !== targetProduct.id)).toBe(true)
    })

    test('should prioritize same category products', () => {
      const targetProduct = mockProducts[0]
      const similar = RecommendationEngine.contentBasedFiltering(
        targetProduct,
        mockProducts
      )

      const topRecommendation = mockProducts.find(p => p.id === similar[0].productId)
      expect(topRecommendation?.category.id).toBe(targetProduct.category.id)
    })

    test('should score by price similarity', () => {
      const targetProduct = mockProducts[0] // Price: 599.99
      const similar = RecommendationEngine.contentBasedFiltering(
        targetProduct,
        mockProducts
      )

      // Product 2 (449.99) should score higher than Product 4 (29.99)
      const product2Score = similar.find(s => s.productId === '2')?.score || 0
      const product4Score = similar.find(s => s.productId === '4')?.score || 0

      expect(product2Score).toBeGreaterThan(product4Score)
    })

    test('should consider tag overlap', () => {
      const targetProduct = mockProducts[0] // Tags: industrial, commercial, heavy-duty
      const similar = RecommendationEngine.contentBasedFiltering(
        targetProduct,
        mockProducts
      )

      // Product 2 has 2 common tags: commercial, heavy-duty
      const product2 = similar.find(s => s.productId === '2')
      expect(product2?.reasons).toContain('Similar features')
    })
  })

  describe('Trending Algorithm', () => {
    test('should return trending products', () => {
      const trending = RecommendationEngine.getTrending(mockProducts)

      expect(trending).toBeDefined()
      expect(trending.length).toBe(mockProducts.length)
    })

    test('should prioritize high sales products', () => {
      const trending = RecommendationEngine.getTrending(mockProducts)

      // Product 4 has highest sales (1200)
      expect(trending[0].productId).toBe('4')
    })

    test('should filter by category', () => {
      const categoryTrending = RecommendationEngine.getTrending(
        mockProducts,
        'cat1'
      )

      const allInCategory = categoryTrending.every(t => {
        const product = mockProducts.find(p => p.id === t.productId)
        return product?.category.id === 'cat1'
      })

      expect(allInCategory).toBe(true)
    })

    test('should boost verified vendors', () => {
      const trending = RecommendationEngine.getTrending(mockProducts)

      // Check that verified vendor products have boost in score
      const verifiedProduct = trending.find(t => t.productId === '1')
      expect(verifiedProduct?.reasons).toContain('Verified vendor')
    })

    test('should boost high-rated products', () => {
      const trending = RecommendationEngine.getTrending(mockProducts)

      // Product 4 has rating 4.8 with 450 reviews
      const topRated = trending.find(t => t.productId === '4')
      expect(topRated?.reasons).toContain('Highly rated')
    })
  })

  describe('Frequently Bought Together', () => {
    const mockPurchaseHistory: PurchaseHistory[] = [
      {
        productId: '1',
        categoryId: 'cat1',
        vendorId: 'vendor1',
        purchasedAt: Date.now() - 60000,
        quantity: 1,
        price: 599.99,
      },
      {
        productId: '2',
        categoryId: 'cat1',
        vendorId: 'vendor2',
        purchasedAt: Date.now() - 50000,
        quantity: 1,
        price: 449.99,
      },
      {
        productId: '1',
        categoryId: 'cat1',
        vendorId: 'vendor1',
        purchasedAt: Date.now() - 120000,
        quantity: 1,
        price: 599.99,
      },
      {
        productId: '3',
        categoryId: 'cat1',
        vendorId: 'vendor1',
        purchasedAt: Date.now() - 110000,
        quantity: 1,
        price: 349.99,
      },
    ]

    test('should find products bought together', () => {
      const alsoBought = RecommendationEngine.frequentlyBoughtTogether(
        '1',
        mockPurchaseHistory,
        mockProducts
      )

      expect(alsoBought).toBeDefined()
      expect(alsoBought.length).toBeGreaterThan(0)
    })

    test('should calculate co-purchase confidence', () => {
      const alsoBought = RecommendationEngine.frequentlyBoughtTogether(
        '1',
        mockPurchaseHistory,
        mockProducts
      )

      // Should have confidence percentage in reasons
      expect(alsoBought[0].reasons.some(r => r.includes('%'))).toBe(true)
    })

    test('should return empty when no purchase history', () => {
      const alsoBought = RecommendationEngine.frequentlyBoughtTogether(
        '1',
        [],
        mockProducts
      )

      expect(alsoBought.length).toBe(0)
    })
  })

  describe('Cross-Sell Opportunities', () => {
    test('should find complementary products', () => {
      const targetProduct = mockProducts[0] // Kitchen Equipment
      const crossSell = RecommendationEngine.getCrossSellOpportunities(
        targetProduct,
        mockProducts
      )

      expect(crossSell).toBeDefined()
      expect(crossSell.length).toBeGreaterThan(0)
    })

    test('should prioritize different categories', () => {
      const targetProduct = mockProducts[0]
      const crossSell = RecommendationEngine.getCrossSellOpportunities(
        targetProduct,
        mockProducts
      )

      // Should include accessories (different category)
      const hasAccessories = crossSell.some(cs => {
        const product = mockProducts.find(p => p.id === cs.productId)
        return product?.category.id === 'cat2'
      })

      expect(hasAccessories).toBe(true)
    })

    test('should prefer lower-priced complementary items', () => {
      const targetProduct = mockProducts[0] // Price: 599.99
      const crossSell = RecommendationEngine.getCrossSellOpportunities(
        targetProduct,
        mockProducts
      )

      // Product 4 (29.99) should be recommended as affordable addition
      const affordableItem = crossSell.find(cs => cs.productId === '4')
      expect(affordableItem).toBeDefined()
      expect(affordableItem?.reasons).toContain('Affordable addition')
    })
  })

  describe('Hybrid Recommendations', () => {
    test('should combine multiple algorithms', () => {
      const recommendations = RecommendationEngine.getHybridRecommendations(
        mockInteractions,
        mockProducts
      )

      expect(recommendations).toBeDefined()
      expect(recommendations.length).toBeGreaterThan(0)
      expect(recommendations[0].algorithm).toContain('hybrid')
    })

    test('should respect custom weights', () => {
      const weights = {
        collaborative: 0.5,
        contentBased: 0.2,
        trending: 0.2,
        crossSell: 0.1,
      }

      const recommendations = RecommendationEngine.getHybridRecommendations(
        mockInteractions,
        mockProducts,
        undefined,
        weights
      )

      expect(recommendations).toBeDefined()
      expect(recommendations.length).toBeGreaterThan(0)
    })

    test('should combine reasons from multiple algorithms', () => {
      const recommendations = RecommendationEngine.getHybridRecommendations(
        mockInteractions,
        mockProducts
      )

      // Should have multiple reasons from different algorithms
      expect(recommendations[0].reasons.length).toBeGreaterThan(1)
    })
  })
})
```

---

## 2. Integration Tests - Store Testing

Test the Zustand store integration.

### Test File: `__tests__/recommendations-store.test.ts`

```typescript
import { renderHook, act } from '@testing-library/react'
import { useRecommendationsStore, Product } from '@/store/recommendations-store'

describe('RecommendationsStore', () => {
  beforeEach(() => {
    // Clear store before each test
    const { result } = renderHook(() => useRecommendationsStore())
    act(() => {
      result.current.clearHistory()
    })
  })

  const mockProduct: Product = {
    id: 'test-1',
    name: 'Test Product',
    slug: 'test-product',
    price: 99.99,
    image: '/test.jpg',
    rating: 4.5,
    reviewCount: 100,
    category: {
      id: 'cat1',
      name: 'Test Category',
      slug: 'test-category',
    },
    vendor: {
      id: 'vendor1',
      name: 'Test Vendor',
      slug: 'test-vendor',
      verified: true,
    },
    inStock: true,
  }

  describe('Product View Tracking', () => {
    test('should track product view', () => {
      const { result } = renderHook(() => useRecommendationsStore())

      act(() => {
        result.current.trackProductView(mockProduct, 30)
      })

      expect(result.current.viewedProducts.length).toBe(1)
      expect(result.current.viewedProducts[0].product.id).toBe('test-1')
      expect(result.current.viewedProducts[0].viewDuration).toBe(30)
    })

    test('should limit viewed products to 50', () => {
      const { result } = renderHook(() => useRecommendationsStore())

      act(() => {
        for (let i = 0; i < 60; i++) {
          result.current.trackProductView(
            { ...mockProduct, id: `product-${i}` },
            10
          )
        }
      })

      expect(result.current.viewedProducts.length).toBe(50)
    })

    test('should create user interaction on view', () => {
      const { result } = renderHook(() => useRecommendationsStore())

      act(() => {
        result.current.trackProductView(mockProduct, 50)
      })

      const interactions = result.current.userInteractions
      const viewInteraction = interactions.find(i => i.productId === 'test-1')

      expect(viewInteraction).toBeDefined()
      expect(viewInteraction?.action).toBe('view')
      expect(viewInteraction?.score).toBeLessThanOrEqual(5)
    })
  })

  describe('Purchase Tracking', () => {
    test('should track purchase', () => {
      const { result } = renderHook(() => useRecommendationsStore())

      act(() => {
        result.current.trackPurchase('test-1', 'cat1', 'vendor1', 2, 99.99)
      })

      expect(result.current.purchaseHistory.length).toBe(1)
      expect(result.current.purchaseHistory[0].productId).toBe('test-1')
      expect(result.current.purchaseHistory[0].quantity).toBe(2)
    })

    test('should create high-score interaction for purchase', () => {
      const { result } = renderHook(() => useRecommendationsStore())

      act(() => {
        result.current.trackPurchase('test-1', 'cat1', 'vendor1', 1, 99.99)
      })

      const interactions = result.current.userInteractions
      const purchaseInteraction = interactions.find(
        i => i.productId === 'test-1' && i.action === 'purchase'
      )

      expect(purchaseInteraction).toBeDefined()
      expect(purchaseInteraction?.score).toBe(50)
    })
  })

  describe('Interaction Tracking', () => {
    test('should track cart action', () => {
      const { result } = renderHook(() => useRecommendationsStore())

      act(() => {
        result.current.trackInteraction('test-1', 'cart')
      })

      const interaction = result.current.userInteractions[0]
      expect(interaction.action).toBe('cart')
      expect(interaction.score).toBe(10)
    })

    test('should track wishlist action', () => {
      const { result } = renderHook(() => useRecommendationsStore())

      act(() => {
        result.current.trackInteraction('test-1', 'wishlist')
      })

      const interaction = result.current.userInteractions[0]
      expect(interaction.action).toBe('wishlist')
      expect(interaction.score).toBe(5)
    })

    test('should limit interactions to 200', () => {
      const { result } = renderHook(() => useRecommendationsStore())

      act(() => {
        for (let i = 0; i < 250; i++) {
          result.current.trackInteraction(`product-${i}`, 'view')
        }
      })

      expect(result.current.userInteractions.length).toBe(200)
    })
  })

  describe('Get Recommendations', () => {
    const allProducts: Product[] = [
      mockProduct,
      { ...mockProduct, id: 'test-2', name: 'Product 2' },
      { ...mockProduct, id: 'test-3', name: 'Product 3' },
    ]

    test('should get personalized recommendations', () => {
      const { result } = renderHook(() => useRecommendationsStore())

      act(() => {
        result.current.trackProductView(mockProduct, 30)
      })

      const recommendations = result.current.getPersonalizedRecommendations(
        allProducts,
        10
      )

      expect(recommendations).toBeDefined()
      expect(Array.isArray(recommendations)).toBe(true)
    })

    test('should get similar products', () => {
      const { result } = renderHook(() => useRecommendationsStore())

      const similar = result.current.getSimilarProducts(
        mockProduct,
        allProducts,
        5
      )

      expect(similar).toBeDefined()
      expect(similar.every(p => p.id !== mockProduct.id)).toBe(true)
    })

    test('should cache similar products', () => {
      const { result } = renderHook(() => useRecommendationsStore())

      // First call
      const similar1 = result.current.getSimilarProducts(
        mockProduct,
        allProducts,
        5
      )

      // Second call should use cache
      const similar2 = result.current.getSimilarProducts(
        mockProduct,
        allProducts,
        5
      )

      expect(similar1).toEqual(similar2)
    })

    test('should get recently viewed', () => {
      const { result } = renderHook(() => useRecommendationsStore())

      act(() => {
        result.current.trackProductView(mockProduct, 30)
        result.current.trackProductView(allProducts[1], 20)
      })

      const recent = result.current.getRecentlyViewed(5)

      expect(recent.length).toBe(2)
      expect(recent[0].id).toBe('test-2') // Most recent first
    })
  })

  describe('Clear History', () => {
    test('should clear all history', () => {
      const { result } = renderHook(() => useRecommendationsStore())

      act(() => {
        result.current.trackProductView(mockProduct, 30)
        result.current.trackPurchase('test-1', 'cat1', 'vendor1', 1, 99.99)
        result.current.trackInteraction('test-1', 'cart')
      })

      expect(result.current.viewedProducts.length).toBe(1)
      expect(result.current.purchaseHistory.length).toBe(1)
      expect(result.current.userInteractions.length).toBeGreaterThan(0)

      act(() => {
        result.current.clearHistory()
      })

      expect(result.current.viewedProducts.length).toBe(0)
      expect(result.current.purchaseHistory.length).toBe(0)
      expect(result.current.userInteractions.length).toBe(0)
    })
  })

  describe('Recommendation Insights', () => {
    test('should get insights for a product', () => {
      const { result } = renderHook(() => useRecommendationsStore())

      act(() => {
        result.current.trackProductView(mockProduct, 30)
        result.current.trackProductView(mockProduct, 45)
        result.current.trackInteraction('test-1', 'cart')
        result.current.trackPurchase('test-1', 'cat1', 'vendor1', 1, 99.99)
      })

      const insights = result.current.getRecommendationInsights('test-1')

      expect(insights.viewCount).toBe(2)
      expect(insights.purchaseCount).toBe(1)
      expect(insights.interactionScore).toBeGreaterThan(50)
      expect(insights.lastViewed).toBeDefined()
    })
  })
})
```

---

## 3. Component Tests - UI Testing

Test React components.

### Test File: `__tests__/recommendations-page.test.tsx`

```typescript
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import RecommendationsPage from '@/app/recommendations/page'
import { useRecommendationsStore } from '@/store/recommendations-store'
import { productsAPI } from '@/lib/api'

jest.mock('@/lib/api')
jest.mock('@/store/recommendations-store')

describe('RecommendationsPage', () => {
  const mockProducts = [
    {
      id: '1',
      name: 'Test Product 1',
      price: 99.99,
      // ... other fields
    },
  ]

  beforeEach(() => {
    ;(productsAPI.getAll as jest.Mock).mockResolvedValue({
      products: mockProducts,
    })

    ;(useRecommendationsStore as unknown as jest.Mock).mockReturnValue({
      getPersonalizedRecommendations: jest.fn(() => mockProducts),
      getTrendingProducts: jest.fn(() => mockProducts),
      getRecentlyViewed: jest.fn(() => []),
      viewedProducts: [],
      userInteractions: [],
      clearHistory: jest.fn(),
    })
  })

  test('renders page title', async () => {
    render(<RecommendationsPage />)

    await waitFor(() => {
      expect(screen.getByText('Smart Product Recommendations')).toBeInTheDocument()
    })
  })

  test('shows loading state', () => {
    render(<RecommendationsPage />)

    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })

  test('displays recommendations after loading', async () => {
    render(<RecommendationsPage />)

    await waitFor(() => {
      expect(screen.getByText('Test Product 1')).toBeInTheDocument()
    })
  })

  test('switches between tabs', async () => {
    render(<RecommendationsPage />)
    const user = userEvent.setup()

    // Click Trending tab
    const trendingTab = screen.getByRole('tab', { name: /trending/i })
    await user.click(trendingTab)

    await waitFor(() => {
      expect(screen.getByText('Trending Now')).toBeInTheDocument()
    })
  })

  test('clears history when button clicked', async () => {
    const mockClearHistory = jest.fn()
    ;(useRecommendationsStore as unknown as jest.Mock).mockReturnValue({
      // ... other mocks
      clearHistory: mockClearHistory,
      userInteractions: [{ id: '1' }], // Has interactions
    })

    render(<RecommendationsPage />)
    const user = userEvent.setup()

    const clearButton = screen.getByText(/clear history/i)
    await user.click(clearButton)

    // Confirm dialog
    window.confirm = jest.fn(() => true)

    await waitFor(() => {
      expect(mockClearHistory).toHaveBeenCalled()
    })
  })
})
```

---

## 4. E2E Tests - User Flow Testing

Test complete user journeys with Playwright or Cypress.

### Test File: `e2e/recommendations.spec.ts` (Playwright)

```typescript
import { test, expect } from '@playwright/test'

test.describe('Recommendations Flow', () => {
  test('complete recommendation journey', async ({ page }) => {
    // 1. View some products
    await page.goto('/products')
    await page.click('text=Industrial Mixer')
    await page.waitForTimeout(5000) // Simulate viewing

    await page.goto('/products')
    await page.click('text=Commercial Blender')
    await page.waitForTimeout(3000)

    // 2. Add to cart
    await page.click('button:has-text("Add to Cart")')
    await expect(page.locator('.cart-count')).toContainText('1')

    // 3. Visit recommendations page
    await page.goto('/recommendations')

    // 4. Check recommendations appear
    await expect(page.locator('h2:has-text("Recommended For You")')).toBeVisible()
    await expect(page.locator('.product-card')).toHaveCount(12, { timeout: 10000 })

    // 5. Check recently viewed
    await expect(page.locator('h2:has-text("Recently Viewed")')).toBeVisible()
    await expect(page.locator('text=Industrial Mixer')).toBeVisible()

    // 6. Switch to Trending tab
    await page.click('button:has-text("Trending")')
    await expect(page.locator('h2:has-text("Trending Now")')).toBeVisible()

    // 7. Click a recommendation
    await page.click('.product-card >> nth=0')
    await expect(page.url()).toContain('/product/')

    // 8. Verify view was tracked
    await page.goto('/recommendations')
    const viewCount = await page.locator('.stat-card >> text=/Products Viewed/')
    await expect(viewCount).toContainText('3') // Original 2 + 1 from click
  })

  test('clear history functionality', async ({ page }) => {
    // Setup: View some products
    await page.goto('/products')
    await page.click('.product-card >> nth=0')
    await page.goto('/recommendations')

    // Clear history
    page.on('dialog', dialog => dialog.accept())
    await page.click('button:has-text("Clear History")')

    // Verify cleared
    await page.reload()
    const viewCount = await page.locator('.stat-card >> text=/Products Viewed/')
    await expect(viewCount).toContainText('0')
  })

  test('recommendations persist across sessions', async ({ page, context }) => {
    // View products
    await page.goto('/products')
    await page.click('.product-card >> nth=0')

    // Close and reopen
    await context.close()
    const newContext = await context.browser()!.newContext()
    const newPage = await newContext.newPage()

    // Check persistence
    await newPage.goto('/recommendations')
    const viewCount = await newPage.locator('.stat-card >> text=/Products Viewed/')
    await expect(viewCount).toContainText('1')
  })
})
```

---

## 5. Performance Tests

Test recommendation generation performance.

### Test File: `__tests__/performance.test.ts`

```typescript
import { performance } from 'perf_hooks'
import { RecommendationEngine } from '@/store/recommendations-store'

describe('Performance Tests', () => {
  // Generate large dataset
  const generateProducts = (count: number) => {
    return Array.from({ length: count }, (_, i) => ({
      id: `product-${i}`,
      name: `Product ${i}`,
      slug: `product-${i}`,
      price: Math.random() * 1000,
      image: '/test.jpg',
      rating: 3 + Math.random() * 2,
      reviewCount: Math.floor(Math.random() * 500),
      category: {
        id: `cat-${i % 10}`,
        name: `Category ${i % 10}`,
        slug: `category-${i % 10}`,
      },
      vendor: {
        id: `vendor-${i % 50}`,
        name: `Vendor ${i % 50}`,
        slug: `vendor-${i % 50}`,
        verified: Math.random() > 0.5,
      },
      inStock: Math.random() > 0.2,
      totalSales: Math.floor(Math.random() * 1000),
      viewCount: Math.floor(Math.random() * 5000),
      tags: [`tag-${i % 20}`, `tag-${(i + 1) % 20}`],
    }))
  }

  const generateInteractions = (count: number) => {
    return Array.from({ length: count }, (_, i) => ({
      productId: `product-${Math.floor(Math.random() * 100)}`,
      action: ['view', 'cart', 'wishlist', 'purchase'][
        Math.floor(Math.random() * 4)
      ] as any,
      timestamp: Date.now() - Math.random() * 86400000,
      score: Math.floor(Math.random() * 50),
    }))
  }

  test('collaborative filtering with 1000 products', () => {
    const products = generateProducts(1000)
    const interactions = generateInteractions(200)

    const start = performance.now()
    const recommendations = RecommendationEngine.collaborativeFiltering(
      interactions,
      products as any
    )
    const end = performance.now()

    const executionTime = end - start

    expect(recommendations.length).toBeGreaterThan(0)
    expect(executionTime).toBeLessThan(1000) // Should complete in < 1 second

    console.log(`Collaborative filtering (1000 products): ${executionTime.toFixed(2)}ms`)
  })

  test('content-based filtering with 1000 products', () => {
    const products = generateProducts(1000)
    const targetProduct = products[0]

    const start = performance.now()
    const recommendations = RecommendationEngine.contentBasedFiltering(
      targetProduct as any,
      products as any
    )
    const end = performance.now()

    const executionTime = end - start

    expect(recommendations.length).toBeGreaterThan(0)
    expect(executionTime).toBeLessThan(500) // Should complete in < 500ms

    console.log(`Content-based filtering (1000 products): ${executionTime.toFixed(2)}ms`)
  })

  test('hybrid recommendations with large dataset', () => {
    const products = generateProducts(1000)
    const interactions = generateInteractions(200)

    const start = performance.now()
    const recommendations = RecommendationEngine.getHybridRecommendations(
      interactions,
      products as any
    )
    const end = performance.now()

    const executionTime = end - start

    expect(recommendations.length).toBeGreaterThan(0)
    expect(executionTime).toBeLessThan(2000) // Should complete in < 2 seconds

    console.log(`Hybrid recommendations (1000 products): ${executionTime.toFixed(2)}ms`)
  })

  test('memory usage stays reasonable', () => {
    const initialMemory = process.memoryUsage().heapUsed
    const products = generateProducts(5000)
    const interactions = generateInteractions(1000)

    RecommendationEngine.getHybridRecommendations(
      interactions,
      products as any
    )

    const finalMemory = process.memoryUsage().heapUsed
    const memoryIncrease = (finalMemory - initialMemory) / 1024 / 1024 // MB

    expect(memoryIncrease).toBeLessThan(100) // Should use < 100MB

    console.log(`Memory increase: ${memoryIncrease.toFixed(2)}MB`)
  })
})
```

---

## Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run specific test file
npm test recommendations-store.test.ts

# Run in watch mode
npm test -- --watch

# Run E2E tests
npx playwright test

# Performance tests
npm test -- performance.test.ts --verbose
```

---

## Test Coverage Goals

```
Statements   : 80% or higher
Branches     : 75% or higher
Functions    : 80% or higher
Lines        : 80% or higher
```

---

## Continuous Testing

### GitHub Actions Workflow

```yaml
name: Test Recommendations

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install
      - run: npm test -- --coverage
      - run: npx playwright test
```

---

This comprehensive testing suite ensures your recommendation system works correctly, performs well, and provides a great user experience!
