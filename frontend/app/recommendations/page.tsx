'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  TrendingUp,
  Sparkles,
  Clock,
  ShoppingCart,
  Users,
  Target,
  BarChart3,
  Eye,
  ArrowRight,
  Loader2,
  Package,
  RefreshCw,
  Filter,
  Grid3X3,
  Heart,
  Star,
  Zap,
  Award,
  Flame,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { useRecommendationsStore, Product } from '@/store/recommendations-store'
import { useAuthStore } from '@/store'
import { productsAPI } from '@/lib/api'
import { cn } from '@/lib/utils'
import Image from 'next/image'
import { useCurrencyStore } from '@/store'

// ==================== PRODUCT CARD COMPONENT ====================
interface ProductCardProps {
  product: Product
  badge?: {
    text: string
    variant: 'default' | 'secondary' | 'destructive' | 'outline'
    icon?: React.ReactNode
  }
  reason?: string
  compact?: boolean
  onView?: () => void
}

function ProductCard({ product, badge, reason, compact = false, onView }: ProductCardProps) {
  const router = useRouter()
  const { convertAndFormat } = useCurrencyStore()
  const trackProductView = useRecommendationsStore(state => state.trackProductView)

  const handleClick = () => {
    trackProductView(product)
    onView?.()
    router.push(`/product/${product.slug}`)
  }

  if (compact) {
    return (
      <Card
        className="group cursor-pointer hover:shadow-lg transition-all duration-300 border-border/40"
        onClick={handleClick}
      >
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="relative w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-muted">
              <Image
                src={product.image || '/placeholder.png'}
                alt={product.name}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
              />
              {badge && (
                <Badge
                  variant={badge.variant}
                  className="absolute top-2 left-2 text-xs gap-1"
                >
                  {badge.icon}
                  {badge.text}
                </Badge>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm line-clamp-2 mb-1 group-hover:text-primary transition-colors">
                {product.name}
              </h3>
              <p className="text-xs text-muted-foreground mb-2">{product.vendor.name}</p>
              <div className="flex items-center justify-between gap-2">
                <div className="flex flex-col gap-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-lg font-bold text-primary">
                      {convertAndFormat(product.price)}
                    </span>
                    {product.compareAtPrice && product.compareAtPrice > product.price && (
                      <span className="text-xs text-muted-foreground line-through">
                        {convertAndFormat(product.compareAtPrice)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    <span className="text-xs font-medium">{product.rating.toFixed(1)}</span>
                    <span className="text-xs text-muted-foreground">({product.reviewCount})</span>
                  </div>
                </div>
              </div>
              {reason && (
                <p className="text-xs text-muted-foreground mt-2 line-clamp-1">
                  {reason}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card
      className="group cursor-pointer hover:shadow-xl transition-all duration-300 border-border/40 h-full flex flex-col"
      onClick={handleClick}
    >
      <div className="relative aspect-square overflow-hidden rounded-t-lg bg-muted">
        <Image
          src={product.image || '/placeholder.png'}
          alt={product.name}
          fill
          className="object-cover group-hover:scale-110 transition-transform duration-500"
        />
        {badge && (
          <Badge
            variant={badge.variant}
            className="absolute top-3 left-3 gap-1.5 shadow-lg"
          >
            {badge.icon}
            {badge.text}
          </Badge>
        )}
        {product.compareAtPrice && product.compareAtPrice > product.price && (
          <Badge
            variant="destructive"
            className="absolute top-3 right-3 shadow-lg"
          >
            Save {Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)}%
          </Badge>
        )}
        {!product.inStock && (
          <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
            <Badge variant="secondary" className="text-sm">Out of Stock</Badge>
          </div>
        )}
      </div>
      <CardContent className="p-4 flex-1 flex flex-col">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm line-clamp-2 mb-1 group-hover:text-primary transition-colors">
              {product.name}
            </h3>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span>{product.vendor.name}</span>
              {product.vendor.verified && (
                <Badge variant="secondary" className="h-4 px-1 text-[10px]">
                  <Award className="h-2.5 w-2.5 mr-0.5" />
                  Verified
                </Badge>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 mb-3">
          <div className="flex items-center">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={cn(
                  'h-3.5 w-3.5',
                  i < Math.floor(product.rating)
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-gray-300'
                )}
              />
            ))}
          </div>
          <span className="text-xs font-medium">{product.rating.toFixed(1)}</span>
          <span className="text-xs text-muted-foreground">({product.reviewCount})</span>
        </div>

        <div className="flex items-baseline gap-2 mb-3">
          <span className="text-2xl font-bold text-primary">
            {convertAndFormat(product.price)}
          </span>
          {product.compareAtPrice && product.compareAtPrice > product.price && (
            <span className="text-sm text-muted-foreground line-through">
              {convertAndFormat(product.compareAtPrice)}
            </span>
          )}
        </div>

        {product.category && (
          <Badge variant="outline" className="w-fit mb-3 text-xs">
            {product.category.name}
          </Badge>
        )}

        {reason && (
          <div className="mt-auto pt-3 border-t">
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Sparkles className="h-3 w-3 text-primary" />
              {reason}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ==================== SECTION COMPONENT ====================
interface RecommendationSectionProps {
  title: string
  description?: string
  icon: React.ReactNode
  products: Product[]
  isLoading?: boolean
  badge?: {
    text: string
    variant: 'default' | 'secondary' | 'destructive' | 'outline'
    icon?: React.ReactNode
  }
  compact?: boolean
  onRefresh?: () => void
  emptyMessage?: string
}

function RecommendationSection({
  title,
  description,
  icon,
  products,
  isLoading,
  badge,
  compact = false,
  onRefresh,
  emptyMessage = 'No recommendations available yet',
}: RecommendationSectionProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-primary/10">
              {icon}
            </div>
            <div>
              <Skeleton className="h-6 w-48 mb-2" />
              {description && <Skeleton className="h-4 w-64" />}
            </div>
          </div>
        </div>
        <div className={cn(
          'grid gap-4',
          compact ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
        )}>
          {Array.from({ length: compact ? 3 : 4 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              {!compact && <Skeleton className="aspect-square" />}
              <CardContent className="p-4">
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-3 w-2/3 mb-3" />
                <Skeleton className="h-6 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-primary/10">
              {icon}
            </div>
            <div>
              <h2 className="text-xl font-semibold">{title}</h2>
              {description && <p className="text-sm text-muted-foreground">{description}</p>}
            </div>
          </div>
        </div>
        <Card className="p-8">
          <div className="text-center">
            <Package className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">{emptyMessage}</p>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-primary/10">
            {icon}
          </div>
          <div>
            <h2 className="text-xl font-semibold">{title}</h2>
            {description && <p className="text-sm text-muted-foreground">{description}</p>}
          </div>
        </div>
        {onRefresh && (
          <Button variant="outline" size="sm" onClick={onRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        )}
      </div>
      <div className={cn(
        'grid gap-4',
        compact ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
      )}>
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            badge={badge}
            compact={compact}
          />
        ))}
      </div>
    </div>
  )
}

// ==================== MAIN PAGE COMPONENT ====================
export default function RecommendationsPage() {
  const { user } = useAuthStore()
  const {
    getPersonalizedRecommendations,
    getTrendingProducts,
    getTrendingInCategory,
    getRecentlyViewed,
    viewedProducts,
    userInteractions,
    clearHistory,
  } = useRecommendationsStore()

  const [allProducts, setAllProducts] = React.useState<Product[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [selectedCategory, setSelectedCategory] = React.useState<string | null>(null)
  const [activeTab, setActiveTab] = React.useState('personalized')

  // Load products
  React.useEffect(() => {
    const loadProducts = async () => {
      try {
        setIsLoading(true)
        const response = await productsAPI.getAll({ limit: 100 })

        // Transform to Product type
        const products: Product[] = (response.products || response.items || []).map((p: any) => ({
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
            name: p.vendor_name || p.vendor?.name || 'Unknown Vendor',
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
        }))

        setAllProducts(products)
      } catch (error) {
        console.error('Failed to load products:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadProducts()
  }, [])

  // Get recommendations
  const personalizedProducts = React.useMemo(
    () => getPersonalizedRecommendations(allProducts, 12),
    [allProducts, userInteractions.length]
  )

  const trendingProducts = React.useMemo(
    () => getTrendingProducts(allProducts, 12),
    [allProducts]
  )

  const categoryTrending = React.useMemo(
    () => selectedCategory ? getTrendingInCategory(selectedCategory, allProducts, 8) : [],
    [allProducts, selectedCategory]
  )

  const recentlyViewed = React.useMemo(
    () => getRecentlyViewed(8),
    [viewedProducts.length]
  )

  // Get unique categories from user's viewed products
  const userCategories = React.useMemo(() => {
    const categories = new Map<string, { id: string; name: string; count: number }>()

    viewedProducts.forEach(v => {
      const catId = v.product.category.id
      const existing = categories.get(catId)
      if (existing) {
        existing.count++
      } else {
        categories.set(catId, {
          id: catId,
          name: v.product.category.name,
          count: 1,
        })
      }
    })

    return Array.from(categories.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
  }, [viewedProducts])

  // Cross-sell opportunities (from recently viewed)
  const crossSellProducts = React.useMemo(() => {
    if (recentlyViewed.length === 0) return []
    const lastViewed = recentlyViewed[0]

    // Find complementary products
    return allProducts
      .filter(p =>
        p.id !== lastViewed.id &&
        p.category.id !== lastViewed.category.id &&
        p.price < lastViewed.price * 0.6 &&
        p.rating >= 4.0
      )
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 6)
  }, [allProducts, recentlyViewed])

  // Similar products (from recently viewed)
  const similarProducts = React.useMemo(() => {
    if (recentlyViewed.length === 0) return []
    const lastViewed = recentlyViewed[0]

    return allProducts
      .filter(p =>
        p.id !== lastViewed.id &&
        p.category.id === lastViewed.category.id
      )
      .sort((a, b) => {
        const priceDiffA = Math.abs(a.price - lastViewed.price)
        const priceDiffB = Math.abs(b.price - lastViewed.price)
        return priceDiffA - priceDiffB
      })
      .slice(0, 8)
  }, [allProducts, recentlyViewed])

  // Frequently bought together (simulated)
  const frequentlyBought = React.useMemo(() => {
    if (recentlyViewed.length === 0) return []
    const lastViewed = recentlyViewed[0]

    return allProducts
      .filter(p => p.id !== lastViewed.id && p.vendor.id === lastViewed.vendor.id)
      .sort((a, b) => (b.totalSales || 0) - (a.totalSales || 0))
      .slice(0, 6)
  }, [allProducts, recentlyViewed])

  const stats = {
    totalViewed: viewedProducts.length,
    totalInteractions: userInteractions.length,
    categoriesExplored: new Set(viewedProducts.map(v => v.product.category.id)).size,
    vendorsExplored: new Set(viewedProducts.map(v => v.product.vendor.id)).size,
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Sparkles className="h-8 w-8 text-primary" />
                </div>
                Smart Product Recommendations
              </h1>
              <p className="text-muted-foreground mt-2">
                AI-powered personalized product suggestions based on your interests and browsing behavior
              </p>
            </div>
            {userInteractions.length > 0 && (
              <Button
                variant="outline"
                onClick={() => {
                  if (confirm('Clear all recommendation history?')) {
                    clearHistory()
                    window.location.reload()
                  }
                }}
              >
                Clear History
              </Button>
            )}
          </div>

          {/* Stats Bar */}
          {stats.totalViewed > 0 && (
            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
                <CardContent className="p-4 flex items-center gap-3">
                  <Eye className="h-8 w-8 text-primary" />
                  <div>
                    <p className="text-2xl font-bold">{stats.totalViewed}</p>
                    <p className="text-xs text-muted-foreground">Products Viewed</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-blue-500/5 to-blue-500/10 border-blue-500/20">
                <CardContent className="p-4 flex items-center gap-3">
                  <BarChart3 className="h-8 w-8 text-blue-500" />
                  <div>
                    <p className="text-2xl font-bold">{stats.totalInteractions}</p>
                    <p className="text-xs text-muted-foreground">Total Interactions</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-green-500/5 to-green-500/10 border-green-500/20">
                <CardContent className="p-4 flex items-center gap-3">
                  <Grid3X3 className="h-8 w-8 text-green-500" />
                  <div>
                    <p className="text-2xl font-bold">{stats.categoriesExplored}</p>
                    <p className="text-xs text-muted-foreground">Categories Explored</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-purple-500/5 to-purple-500/10 border-purple-500/20">
                <CardContent className="p-4 flex items-center gap-3">
                  <Users className="h-8 w-8 text-purple-500" />
                  <div>
                    <p className="text-2xl font-bold">{stats.vendorsExplored}</p>
                    <p className="text-xs text-muted-foreground">Vendors Discovered</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 space-y-12">
        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="grid w-full max-w-2xl grid-cols-3">
            <TabsTrigger value="personalized" className="gap-2">
              <Target className="h-4 w-4" />
              For You
            </TabsTrigger>
            <TabsTrigger value="trending" className="gap-2">
              <Flame className="h-4 w-4" />
              Trending
            </TabsTrigger>
            <TabsTrigger value="discover" className="gap-2">
              <Zap className="h-4 w-4" />
              Discover
            </TabsTrigger>
          </TabsList>

          {/* Personalized Tab */}
          <TabsContent value="personalized" className="space-y-12">
            {/* Personalized Recommendations */}
            <RecommendationSection
              title="Recommended For You"
              description="Curated selection based on your browsing history and preferences"
              icon={<Target className="h-5 w-5 text-primary" />}
              products={personalizedProducts}
              isLoading={isLoading}
              badge={{
                text: 'AI Recommended',
                variant: 'default',
                icon: <Sparkles className="h-3 w-3" />,
              }}
              emptyMessage="Start browsing products to get personalized recommendations"
            />

            {/* Recently Viewed */}
            {recentlyViewed.length > 0 && (
              <>
                <Separator />
                <RecommendationSection
                  title="Recently Viewed"
                  description="Pick up where you left off"
                  icon={<Clock className="h-5 w-5 text-blue-500" />}
                  products={recentlyViewed}
                  compact
                  badge={{
                    text: 'Recently Viewed',
                    variant: 'secondary',
                    icon: <Clock className="h-3 w-3" />,
                  }}
                />
              </>
            )}

            {/* Similar Products */}
            {similarProducts.length > 0 && (
              <>
                <Separator />
                <RecommendationSection
                  title="Similar Products"
                  description="More options like what you've been viewing"
                  icon={<Grid3X3 className="h-5 w-5 text-green-500" />}
                  products={similarProducts}
                  badge={{
                    text: 'Similar',
                    variant: 'outline',
                  }}
                />
              </>
            )}

            {/* Frequently Bought Together */}
            {frequentlyBought.length > 0 && (
              <>
                <Separator />
                <RecommendationSection
                  title="Customers Also Bought"
                  description="Popular combinations from the same vendor"
                  icon={<Users className="h-5 w-5 text-purple-500" />}
                  products={frequentlyBought}
                  compact
                  badge={{
                    text: 'Popular Combo',
                    variant: 'secondary',
                    icon: <ShoppingCart className="h-3 w-3" />,
                  }}
                />
              </>
            )}

            {/* Cross-sell Opportunities */}
            {crossSellProducts.length > 0 && (
              <>
                <Separator />
                <RecommendationSection
                  title="Complete Your Setup"
                  description="Complementary products that work great together"
                  icon={<Target className="h-5 w-5 text-orange-500" />}
                  products={crossSellProducts}
                  compact
                  badge={{
                    text: 'Great Addition',
                    variant: 'outline',
                  }}
                />
              </>
            )}
          </TabsContent>

          {/* Trending Tab */}
          <TabsContent value="trending" className="space-y-12">
            {/* Overall Trending */}
            <RecommendationSection
              title="Trending Now"
              description="Most popular products across the marketplace"
              icon={<TrendingUp className="h-5 w-5 text-primary" />}
              products={trendingProducts}
              isLoading={isLoading}
              badge={{
                text: 'Trending',
                variant: 'destructive',
                icon: <Flame className="h-3 w-3" />,
              }}
            />

            {/* Category Trending */}
            {userCategories.length > 0 && (
              <>
                <Separator />
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-lg bg-primary/10">
                        <Filter className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h2 className="text-xl font-semibold">Trending in Your Categories</h2>
                        <p className="text-sm text-muted-foreground">
                          Popular products in categories you've explored
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {userCategories.map((cat) => (
                      <Button
                        key={cat.id}
                        variant={selectedCategory === cat.id ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedCategory(
                          selectedCategory === cat.id ? null : cat.id
                        )}
                      >
                        {cat.name}
                        <Badge variant="secondary" className="ml-2">
                          {cat.count}
                        </Badge>
                      </Button>
                    ))}
                  </div>

                  {selectedCategory && categoryTrending.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {categoryTrending.map((product) => (
                        <ProductCard
                          key={product.id}
                          product={product}
                          badge={{
                            text: 'Category Trending',
                            variant: 'default',
                            icon: <TrendingUp className="h-3 w-3" />,
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </TabsContent>

          {/* Discover Tab */}
          <TabsContent value="discover" className="space-y-12">
            {/* New Arrivals */}
            <RecommendationSection
              title="New Arrivals"
              description="Recently added products you might like"
              icon={<Zap className="h-5 w-5 text-yellow-500" />}
              products={allProducts
                .sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0))
                .slice(0, 12)
              }
              isLoading={isLoading}
              badge={{
                text: 'New',
                variant: 'secondary',
                icon: <Zap className="h-3 w-3" />,
              }}
            />

            <Separator />

            {/* Top Rated */}
            <RecommendationSection
              title="Top Rated Products"
              description="Highest rated products by customers"
              icon={<Star className="h-5 w-5 text-yellow-500" />}
              products={allProducts
                .filter(p => p.reviewCount >= 5)
                .sort((a, b) => {
                  const scoreA = a.rating * Math.log(a.reviewCount + 1)
                  const scoreB = b.rating * Math.log(b.reviewCount + 1)
                  return scoreB - scoreA
                })
                .slice(0, 12)
              }
              isLoading={isLoading}
              badge={{
                text: 'Top Rated',
                variant: 'default',
                icon: <Award className="h-3 w-3" />,
              }}
            />

            <Separator />

            {/* Best Value */}
            <RecommendationSection
              title="Best Value Deals"
              description="Quality products at competitive prices"
              icon={<TrendingUp className="h-5 w-5 text-green-500" />}
              products={allProducts
                .filter(p => p.compareAtPrice && p.compareAtPrice > p.price)
                .sort((a, b) => {
                  const discountA = ((a.compareAtPrice! - a.price) / a.compareAtPrice!) * 100
                  const discountB = ((b.compareAtPrice! - b.price) / b.compareAtPrice!) * 100
                  return discountB - discountA
                })
                .slice(0, 12)
              }
              isLoading={isLoading}
              badge={{
                text: 'Best Value',
                variant: 'destructive',
              }}
            />
          </TabsContent>
        </Tabs>

        {/* CTA Section */}
        <Card className="bg-gradient-to-r from-primary/10 via-primary/5 to-background border-primary/20">
          <CardContent className="p-8 md:p-12 text-center">
            <Sparkles className="h-12 w-12 text-primary mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-3">
              Get Even Better Recommendations
            </h2>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              The more you browse and interact with products, the smarter our recommendations become.
              Explore categories, save favorites, and let our AI learn your preferences!
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Button asChild size="lg">
                <Link href="/products">
                  Browse All Products
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/account/orders">
                  View Order History
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
