import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// ==================== TYPES ====================
export interface Product {
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
  description?: string
  tags?: string[]
  specifications?: Record<string, any>
  inStock?: boolean
  totalSales?: number
  viewCount?: number
  moq?: number
  leadTime?: string
  certifications?: string[]
}

export interface ViewedProduct {
  product: Product
  viewedAt: number
  viewDuration?: number
}

export interface PurchaseHistory {
  productId: string
  categoryId: string
  vendorId: string
  purchasedAt: number
  quantity: number
  price: number
}

export interface UserInteraction {
  productId: string
  action: 'view' | 'cart' | 'wishlist' | 'purchase' | 'compare'
  timestamp: number
  score: number
}

export interface RecommendationScore {
  productId: string
  score: number
  reasons: string[]
  algorithm: string
}

// ==================== RECOMMENDATION ALGORITHMS ====================

class RecommendationEngine {
  // Collaborative Filtering - User-based
  static collaborativeFiltering(
    userInteractions: UserInteraction[],
    allProducts: Product[],
    currentProduct?: Product
  ): RecommendationScore[] {
    const scores = new Map<string, { score: number; reasons: Set<string> }>()

    // Build user preference profile
    const categoryPreferences = new Map<string, number>()
    const vendorPreferences = new Map<string, number>()
    const priceRanges = userInteractions
      .filter(i => i.action === 'purchase' || i.action === 'cart')
      .map(i => {
        const product = allProducts.find(p => p.id === i.productId)
        return product?.price || 0
      })

    const avgPrice = priceRanges.length > 0
      ? priceRanges.reduce((a, b) => a + b, 0) / priceRanges.length
      : 0

    // Calculate category and vendor preferences
    userInteractions.forEach(interaction => {
      const product = allProducts.find(p => p.id === interaction.productId)
      if (!product) return

      const categoryId = product.category.id
      const vendorId = product.vendor.id

      categoryPreferences.set(
        categoryId,
        (categoryPreferences.get(categoryId) || 0) + interaction.score
      )
      vendorPreferences.set(
        vendorId,
        (vendorPreferences.get(vendorId) || 0) + interaction.score
      )
    })

    // Score products based on user preferences
    allProducts.forEach(product => {
      if (currentProduct && product.id === currentProduct.id) return

      let score = 0
      const reasons: Set<string> = new Set()

      // Category affinity
      const categoryScore = categoryPreferences.get(product.category.id) || 0
      if (categoryScore > 0) {
        score += categoryScore * 0.4
        reasons.add('Similar to your interests')
      }

      // Vendor affinity
      const vendorScore = vendorPreferences.get(product.vendor.id) || 0
      if (vendorScore > 0) {
        score += vendorScore * 0.3
        reasons.add('From vendors you like')
      }

      // Price similarity
      if (avgPrice > 0 && Math.abs(product.price - avgPrice) / avgPrice < 0.3) {
        score += 20
        reasons.add('In your price range')
      }

      if (score > 0) {
        scores.set(product.id, { score, reasons })
      }
    })

    return Array.from(scores.entries())
      .map(([productId, data]) => ({
        productId,
        score: data.score,
        reasons: Array.from(data.reasons),
        algorithm: 'collaborative',
      }))
      .sort((a, b) => b.score - a.score)
  }

  // Content-Based Filtering - Product similarity
  static contentBasedFiltering(
    product: Product,
    allProducts: Product[]
  ): RecommendationScore[] {
    const scores: RecommendationScore[] = []

    allProducts.forEach(candidate => {
      if (candidate.id === product.id) return

      let score = 0
      const reasons: Set<string> = new Set()

      // Same category (high weight)
      if (candidate.category.id === product.category.id) {
        score += 50
        reasons.add('Same category')
      }

      // Price similarity (±30%)
      const priceDiff = Math.abs(candidate.price - product.price) / product.price
      if (priceDiff < 0.3) {
        score += 30 * (1 - priceDiff)
        reasons.add('Similar price')
      }

      // Rating similarity
      const ratingDiff = Math.abs(candidate.rating - product.rating)
      if (ratingDiff < 1) {
        score += 20 * (1 - ratingDiff / 5)
        reasons.add('Similar quality')
      }

      // Tag/specification overlap
      const productTags = new Set(product.tags || [])
      const candidateTags = new Set(candidate.tags || [])
      const commonTags = Array.from(productTags).filter(tag => candidateTags.has(tag))

      if (commonTags.length > 0) {
        score += commonTags.length * 10
        reasons.add('Similar features')
      }

      // Specification similarity
      if (product.specifications && candidate.specifications) {
        const productSpecs = Object.keys(product.specifications)
        const candidateSpecs = Object.keys(candidate.specifications)
        const commonSpecs = productSpecs.filter(spec =>
          candidateSpecs.includes(spec) &&
          product.specifications![spec] === candidate.specifications![spec]
        )

        if (commonSpecs.length > 0) {
          score += commonSpecs.length * 5
          reasons.add('Matching specifications')
        }
      }

      // Same vendor
      if (candidate.vendor.id === product.vendor.id) {
        score += 15
        reasons.add('Same vendor')
      }

      if (score > 0) {
        scores.push({
          productId: candidate.id,
          score,
          reasons: Array.from(reasons),
          algorithm: 'content-based',
        })
      }
    })

    return scores.sort((a, b) => b.score - a.score)
  }

  // Trending products algorithm
  static getTrending(
    allProducts: Product[],
    categoryId?: string,
    timeWindowDays: number = 7
  ): RecommendationScore[] {
    const now = Date.now()
    const timeWindow = timeWindowDays * 24 * 60 * 60 * 1000

    return allProducts
      .filter(product => !categoryId || product.category.id === categoryId)
      .map(product => {
        let score = 0
        const reasons: Set<string> = new Set()

        // Recent sales velocity
        const salesScore = (product.totalSales || 0) * 2
        if (salesScore > 0) {
          score += salesScore
          reasons.add('High sales volume')
        }

        // View count
        const viewScore = (product.viewCount || 0) * 0.5
        if (viewScore > 0) {
          score += viewScore
          reasons.add('Popular product')
        }

        // Rating boost
        if (product.rating >= 4.5 && product.reviewCount >= 10) {
          score += 30
          reasons.add('Highly rated')
        }

        // In stock availability
        if (product.inStock) {
          score += 10
          reasons.add('In stock')
        }

        // Verified vendor boost
        if (product.vendor.verified) {
          score += 15
          reasons.add('Verified vendor')
        }

        return {
          productId: product.id,
          score,
          reasons: Array.from(reasons),
          algorithm: 'trending',
        }
      })
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
  }

  // Frequently Bought Together algorithm
  static frequentlyBoughtTogether(
    productId: string,
    purchaseHistory: PurchaseHistory[],
    allProducts: Product[]
  ): RecommendationScore[] {
    // Group purchases by user session (within 1 hour)
    const sessionWindow = 60 * 60 * 1000
    const sessions: string[][] = []

    const sortedHistory = [...purchaseHistory].sort((a, b) => a.purchasedAt - b.purchasedAt)
    let currentSession: string[] = []
    let lastPurchaseTime = 0

    sortedHistory.forEach(purchase => {
      if (purchase.purchasedAt - lastPurchaseTime > sessionWindow) {
        if (currentSession.length > 1) {
          sessions.push(currentSession)
        }
        currentSession = [purchase.productId]
      } else {
        currentSession.push(purchase.productId)
      }
      lastPurchaseTime = purchase.purchasedAt
    })

    if (currentSession.length > 1) {
      sessions.push(currentSession)
    }

    // Find products bought with the target product
    const coOccurrence = new Map<string, number>()

    sessions.forEach(session => {
      if (session.includes(productId)) {
        session.forEach(id => {
          if (id !== productId) {
            coOccurrence.set(id, (coOccurrence.get(id) || 0) + 1)
          }
        })
      }
    })

    // Calculate association scores
    const totalSessionsWithProduct = sessions.filter(s => s.includes(productId)).length

    return Array.from(coOccurrence.entries())
      .map(([id, count]) => {
        const confidence = totalSessionsWithProduct > 0 ? count / totalSessionsWithProduct : 0
        const lift = count / sessions.filter(s => s.includes(id)).length

        return {
          productId: id,
          score: confidence * 100 + lift * 20,
          reasons: [`Bought together ${count} times`, `${Math.round(confidence * 100)}% co-purchase rate`],
          algorithm: 'frequently-bought-together',
        }
      })
      .sort((a, b) => b.score - a.score)
  }

  // Cross-sell opportunities
  static getCrossSellOpportunities(
    product: Product,
    allProducts: Product[]
  ): RecommendationScore[] {
    const scores: RecommendationScore[] = []

    // Define complementary category relationships
    const complementaryCategories: Record<string, string[]> = {
      'electronics': ['accessories', 'cables', 'cases'],
      'furniture': ['decor', 'lighting', 'textiles'],
      'apparel': ['footwear', 'accessories', 'jewelry'],
      'kitchen': ['cookware', 'utensils', 'storage'],
    }

    allProducts.forEach(candidate => {
      if (candidate.id === product.id) return

      let score = 0
      const reasons: Set<string> = new Set()

      // Different category but complementary
      if (candidate.category.id !== product.category.id) {
        const productCatSlug = product.category.slug
        const candidateCatSlug = candidate.category.slug

        Object.entries(complementaryCategories).forEach(([mainCat, complementary]) => {
          if (productCatSlug.includes(mainCat) &&
              complementary.some(comp => candidateCatSlug.includes(comp))) {
            score += 40
            reasons.add('Complementary product')
          }
        })
      }

      // Price complementarity (accessories typically cheaper)
      if (candidate.price < product.price * 0.5 && candidate.price > product.price * 0.1) {
        score += 20
        reasons.add('Affordable addition')
      }

      // Same vendor (easier single checkout)
      if (candidate.vendor.id === product.vendor.id) {
        score += 25
        reasons.add('From same vendor')
      }

      // High rating for trust
      if (candidate.rating >= 4.0) {
        score += 15
        reasons.add('Well-reviewed')
      }

      if (score > 0) {
        scores.push({
          productId: candidate.id,
          score,
          reasons: Array.from(reasons),
          algorithm: 'cross-sell',
        })
      }
    })

    return scores.sort((a, b) => b.score - a.score)
  }

  // Hybrid recommendation combining multiple algorithms
  static getHybridRecommendations(
    userInteractions: UserInteraction[],
    allProducts: Product[],
    currentProduct?: Product,
    weights = {
      collaborative: 0.35,
      contentBased: 0.30,
      trending: 0.20,
      crossSell: 0.15,
    }
  ): RecommendationScore[] {
    const allScores = new Map<string, { totalScore: number; reasons: Set<string>; algorithms: Set<string> }>()

    // Run different algorithms
    const algorithms: { scores: RecommendationScore[]; weight: number }[] = []

    if (userInteractions.length > 0) {
      algorithms.push({
        scores: this.collaborativeFiltering(userInteractions, allProducts, currentProduct),
        weight: weights.collaborative,
      })
    }

    if (currentProduct) {
      algorithms.push({
        scores: this.contentBasedFiltering(currentProduct, allProducts),
        weight: weights.contentBased,
      })

      algorithms.push({
        scores: this.getCrossSellOpportunities(currentProduct, allProducts),
        weight: weights.crossSell,
      })
    }

    algorithms.push({
      scores: this.getTrending(allProducts),
      weight: weights.trending,
    })

    // Combine scores
    algorithms.forEach(({ scores, weight }) => {
      scores.forEach(item => {
        const existing = allScores.get(item.productId)
        if (existing) {
          existing.totalScore += item.score * weight
          item.reasons.forEach(r => existing.reasons.add(r))
          existing.algorithms.add(item.algorithm)
        } else {
          allScores.set(item.productId, {
            totalScore: item.score * weight,
            reasons: new Set(item.reasons),
            algorithms: new Set([item.algorithm]),
          })
        }
      })
    })

    // Convert to array and sort
    return Array.from(allScores.entries())
      .map(([productId, data]) => ({
        productId,
        score: data.totalScore,
        reasons: Array.from(data.reasons),
        algorithm: `hybrid (${Array.from(data.algorithms).join(', ')})`,
      }))
      .sort((a, b) => b.score - a.score)
  }
}

// ==================== STORE ====================
interface RecommendationsState {
  // Tracking data
  viewedProducts: ViewedProduct[]
  purchaseHistory: PurchaseHistory[]
  userInteractions: UserInteraction[]

  // Cached recommendations
  personalizedRecommendations: Product[]
  similarProducts: Map<string, Product[]>
  trendingProducts: Product[]
  categoryTrending: Map<string, Product[]>

  // Loading states
  isLoadingPersonalized: boolean
  isLoadingTrending: boolean

  // Actions - Tracking
  trackProductView: (product: Product, duration?: number) => void
  trackPurchase: (productId: string, categoryId: string, vendorId: string, quantity: number, price: number) => void
  trackInteraction: (productId: string, action: UserInteraction['action']) => void
  clearHistory: () => void

  // Actions - Recommendations
  getPersonalizedRecommendations: (allProducts: Product[], limit?: number) => Product[]
  getSimilarProducts: (product: Product, allProducts: Product[], limit?: number) => Product[]
  getCustomersAlsoBought: (productId: string, allProducts: Product[], limit?: number) => Product[]
  getCrossSellProducts: (product: Product, allProducts: Product[], limit?: number) => Product[]
  getTrendingInCategory: (categoryId: string, allProducts: Product[], limit?: number) => Product[]
  getTrendingProducts: (allProducts: Product[], limit?: number) => Product[]
  getRecentlyViewed: (limit?: number) => Product[]

  // Utilities
  getRecommendationInsights: (productId: string) => {
    viewCount: number
    lastViewed?: number
    purchaseCount: number
    interactionScore: number
  }
}

export const useRecommendationsStore = create<RecommendationsState>()(
  persist(
    (set, get) => ({
      // Initial state
      viewedProducts: [],
      purchaseHistory: [],
      userInteractions: [],
      personalizedRecommendations: [],
      similarProducts: new Map(),
      trendingProducts: [],
      categoryTrending: new Map(),
      isLoadingPersonalized: false,
      isLoadingTrending: false,

      // Track product view
      trackProductView: (product, duration) => {
        const { viewedProducts, userInteractions } = get()

        // Add to viewed products
        const newViewed: ViewedProduct = {
          product,
          viewedAt: Date.now(),
          viewDuration: duration,
        }

        // Keep only last 50 viewed products
        const updatedViewed = [
          newViewed,
          ...viewedProducts.filter(v => v.product.id !== product.id),
        ].slice(0, 50)

        // Add interaction
        const newInteraction: UserInteraction = {
          productId: product.id,
          action: 'view',
          timestamp: Date.now(),
          score: duration ? Math.min(duration / 10, 5) : 1, // Up to 5 points for 50+ seconds
        }

        set({
          viewedProducts: updatedViewed,
          userInteractions: [...userInteractions, newInteraction].slice(-200),
        })
      },

      // Track purchase
      trackPurchase: (productId, categoryId, vendorId, quantity, price) => {
        const { purchaseHistory, userInteractions } = get()

        const purchase: PurchaseHistory = {
          productId,
          categoryId,
          vendorId,
          purchasedAt: Date.now(),
          quantity,
          price,
        }

        const interaction: UserInteraction = {
          productId,
          action: 'purchase',
          timestamp: Date.now(),
          score: 50, // Highest weight for purchases
        }

        set({
          purchaseHistory: [...purchaseHistory, purchase],
          userInteractions: [...userInteractions, interaction].slice(-200),
        })
      },

      // Track interaction
      trackInteraction: (productId, action) => {
        const { userInteractions } = get()

        const scoreMap = {
          view: 1,
          cart: 10,
          wishlist: 5,
          purchase: 50,
          compare: 3,
        }

        const interaction: UserInteraction = {
          productId,
          action,
          timestamp: Date.now(),
          score: scoreMap[action],
        }

        set({
          userInteractions: [...userInteractions, interaction].slice(-200),
        })
      },

      // Clear history
      clearHistory: () => {
        set({
          viewedProducts: [],
          purchaseHistory: [],
          userInteractions: [],
          personalizedRecommendations: [],
          similarProducts: new Map(),
        })
      },

      // Get personalized recommendations
      getPersonalizedRecommendations: (allProducts, limit = 12) => {
        const { userInteractions, personalizedRecommendations } = get()

        // Return cached if available and recent
        if (personalizedRecommendations.length > 0) {
          return personalizedRecommendations.slice(0, limit)
        }

        if (userInteractions.length === 0) {
          // No interaction history - return trending
          return get().getTrendingProducts(allProducts, limit)
        }

        const scores = RecommendationEngine.getHybridRecommendations(
          userInteractions,
          allProducts
        )

        const recommended = scores
          .slice(0, limit)
          .map(s => allProducts.find(p => p.id === s.productId))
          .filter((p): p is Product => p !== undefined)

        set({ personalizedRecommendations: recommended })
        return recommended
      },

      // Get similar products
      getSimilarProducts: (product, allProducts, limit = 8) => {
        const { similarProducts } = get()

        // Check cache
        const cached = similarProducts.get(product.id)
        if (cached && cached.length > 0) {
          return cached.slice(0, limit)
        }

        const scores = RecommendationEngine.contentBasedFiltering(product, allProducts)

        const similar = scores
          .slice(0, limit)
          .map(s => allProducts.find(p => p.id === s.productId))
          .filter((p): p is Product => p !== undefined)

        // Cache result
        const newCache = new Map(similarProducts)
        newCache.set(product.id, similar)
        set({ similarProducts: newCache })

        return similar
      },

      // Get customers also bought
      getCustomersAlsoBought: (productId, allProducts, limit = 8) => {
        const { purchaseHistory } = get()

        if (purchaseHistory.length === 0) {
          // Fallback to similar products
          const product = allProducts.find(p => p.id === productId)
          if (product) {
            return get().getSimilarProducts(product, allProducts, limit)
          }
          return []
        }

        const scores = RecommendationEngine.frequentlyBoughtTogether(
          productId,
          purchaseHistory,
          allProducts
        )

        return scores
          .slice(0, limit)
          .map(s => allProducts.find(p => p.id === s.productId))
          .filter((p): p is Product => p !== undefined)
      },

      // Get cross-sell products
      getCrossSellProducts: (product, allProducts, limit = 6) => {
        const scores = RecommendationEngine.getCrossSellOpportunities(product, allProducts)

        return scores
          .slice(0, limit)
          .map(s => allProducts.find(p => p.id === s.productId))
          .filter((p): p is Product => p !== undefined)
      },

      // Get trending in category
      getTrendingInCategory: (categoryId, allProducts, limit = 8) => {
        const { categoryTrending } = get()

        // Check cache
        const cached = categoryTrending.get(categoryId)
        if (cached && cached.length > 0) {
          return cached.slice(0, limit)
        }

        const scores = RecommendationEngine.getTrending(allProducts, categoryId)

        const trending = scores
          .slice(0, limit)
          .map(s => allProducts.find(p => p.id === s.productId))
          .filter((p): p is Product => p !== undefined)

        // Cache result
        const newCache = new Map(categoryTrending)
        newCache.set(categoryId, trending)
        set({ categoryTrending: newCache })

        return trending
      },

      // Get trending products
      getTrendingProducts: (allProducts, limit = 12) => {
        const { trendingProducts } = get()

        // Return cached if available
        if (trendingProducts.length > 0) {
          return trendingProducts.slice(0, limit)
        }

        const scores = RecommendationEngine.getTrending(allProducts)

        const trending = scores
          .slice(0, limit)
          .map(s => allProducts.find(p => p.id === s.productId))
          .filter((p): p is Product => p !== undefined)

        set({ trendingProducts: trending })
        return trending
      },

      // Get recently viewed
      getRecentlyViewed: (limit = 10) => {
        const { viewedProducts } = get()

        return viewedProducts
          .slice(0, limit)
          .map(v => v.product)
      },

      // Get recommendation insights
      getRecommendationInsights: (productId) => {
        const { viewedProducts, purchaseHistory, userInteractions } = get()

        const viewCount = viewedProducts.filter(v => v.product.id === productId).length
        const lastViewed = viewedProducts.find(v => v.product.id === productId)?.viewedAt
        const purchaseCount = purchaseHistory.filter(p => p.productId === productId).length
        const interactionScore = userInteractions
          .filter(i => i.productId === productId)
          .reduce((sum, i) => sum + i.score, 0)

        return {
          viewCount,
          lastViewed,
          purchaseCount,
          interactionScore,
        }
      },
    }),
    {
      name: 'vendora-recommendations',
      partialize: (state) => ({
        viewedProducts: state.viewedProducts,
        purchaseHistory: state.purchaseHistory,
        userInteractions: state.userInteractions,
      }),
    }
  )
)
