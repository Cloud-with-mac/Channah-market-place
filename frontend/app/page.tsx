'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useState, useMemo } from 'react'
import {
  ArrowRight,
  Truck,
  Shield,
  Headphones,
  CreditCard,
  Sparkles,
  Star,
  ChevronRight,
  ChevronLeft,
  Zap,
  Package,
  Laptop,
  Shirt,
  Home,
  Trophy,
  Baby,
  Monitor,
  Smartphone,
  Watch,
  Search,
  Grid3X3,
  LayoutGrid,
  Loader2,
  ShoppingBag,
  TrendingUp,
  Eye,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ProductCard } from '@/components/product/product-card'
import { productsAPI, categoriesAPI, bannersAPI } from '@/lib/api'

interface Product {
  id: string
  name: string
  slug: string
  price: number
  compare_at_price?: number
  images: { url: string }[]
  rating: number
  review_count: number
  vendor?: { business_name: string }
  primary_image?: string
  category?: { name: string; slug: string }
}

interface Category {
  id: string
  name: string
  slug: string
  image_url?: string
  product_count?: number
  children?: Category[]
}

const categoryIcons: Record<string, any> = {
  'electronics': Laptop,
  'fashion': Shirt,
  'home-garden': Home,
  'sports-outdoors': Trophy,
  'baby-kids': Baby,
  'computers-tablets': Monitor,
  'phones-accessories': Smartphone,
  'jewelry-watches': Watch,
}

const PRODUCTS_PER_PAGE = 60

const DEFAULT_BANNERS = [
  { title: 'Trade Assurance', subtitle: 'Built-in order protection service for every purchase', color_from: '#2563eb', color_to: '#4338ca', link_url: '/products', icon: '' },
  { title: 'New Arrivals Weekly', subtitle: 'Fresh products from verified suppliers around the world', color_from: '#059669', color_to: '#0f766e', link_url: '/products', icon: '' },
  { title: 'Bulk Discounts Available', subtitle: 'Save more when you buy in volume from trusted vendors', color_from: '#f97316', color_to: '#dc2626', link_url: '/products', icon: '' },
]

const features = [
  { icon: Truck, title: 'Fast Delivery', desc: 'Worldwide shipping' },
  { icon: Shield, title: 'Trade Assurance', desc: 'Buyer protection' },
  { icon: Headphones, title: '24/7 Support', desc: 'Always available' },
  { icon: CreditCard, title: 'Secure Pay', desc: 'Safe transactions' },
]

export default function HomePage() {
  const [allProducts, setAllProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [categoryLoading, setCategoryLoading] = useState(false)
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [visibleCount, setVisibleCount] = useState(PRODUCTS_PER_PAGE)
  const [heroBanners, setHeroBanners] = useState<any[]>(DEFAULT_BANNERS)
  const [featuredAd, setFeaturedAd] = useState<any>(null)
  const [bannerIndex, setBannerIndex] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null)

  // Fetch initial data (categories + all products)
  useEffect(() => {
    async function fetchData() {
      try {
        const [catsRes, productsRes, bannersRes, featuredRes] = await Promise.all([
          categoriesAPI.getAll().catch(() => []),
          productsAPI.getAll({ limit: 500, sort_by: 'created_at', sort_order: 'desc' }).catch(() => []),
          bannersAPI.getAll().catch(() => []),
          bannersAPI.getFeatured().catch(() => null),
        ])

        const cats = Array.isArray(catsRes) ? catsRes : (catsRes?.results || catsRes?.items || [])
        const prods = Array.isArray(productsRes) ? productsRes : (productsRes?.results || productsRes?.items || [])
        const banners = Array.isArray(bannersRes) ? bannersRes : []

        setCategories(cats)
        setAllProducts(prods)
        if (banners.length > 0) setHeroBanners(banners)
        if (featuredRes) setFeaturedAd(featuredRes)
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // Fetch products when category changes
  useEffect(() => {
    async function fetchCategoryProducts() {
      setCategoryLoading(true)
      setVisibleCount(PRODUCTS_PER_PAGE)
      try {
        const params: any = { limit: 500, sort_by: 'created_at', sort_order: 'desc' }
        if (activeCategory !== 'all') {
          params.category = activeCategory
        }
        const res = await productsAPI.getAll(params).catch(() => [])
        const prods = Array.isArray(res) ? res : (res?.results || res?.items || [])
        setAllProducts(prods)
      } catch (error) {
        console.error('Error fetching category products:', error)
      } finally {
        setCategoryLoading(false)
      }
    }
    if (!loading) {
      fetchCategoryProducts()
    }
  }, [activeCategory])

  // Auto-rotate banner
  useEffect(() => {
    if (heroBanners.length === 0) return
    const interval = setInterval(() => {
      setBannerIndex(i => (i + 1) % heroBanners.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [heroBanners])

  const filteredProducts = useMemo(() => {
    let prods = allProducts
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      prods = prods.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.vendor?.business_name?.toLowerCase().includes(q)
      )
    }
    return prods
  }, [allProducts, searchQuery])

  const visibleProducts = filteredProducts.slice(0, visibleCount)
  const hasMore = visibleCount < filteredProducts.length

  const topCategories = categories.filter((c: any) => !c.parent_id).slice(0, 16)

  const newArrivals = allProducts.slice(0, 10)
  const topRated = [...allProducts].sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 10)

  return (
    <div className="flex flex-col bg-muted/30">

      {/* ═══════ HERO: Sidebar Categories + Banner ═══════ */}
      <section className="border-b bg-background">
        <div className="container py-4">
          <div className="flex gap-4 h-[360px]">

            {/* Left Category Sidebar */}
            <div className="hidden lg:flex flex-col w-[240px] shrink-0 bg-card rounded-xl border overflow-hidden">
              <div className="px-4 py-3 border-b bg-muted/50">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <Grid3X3 className="h-4 w-4 text-primary" />
                  All Categories
                </h3>
              </div>
              <nav className="flex-1 overflow-y-auto py-1">
                {loading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="px-4 py-2"><Skeleton className="h-4 w-full" /></div>
                  ))
                ) : topCategories.length > 0 ? (
                  topCategories.map(cat => {
                    const Icon = categoryIcons[cat.slug] || Package
                    return (
                      <Link
                        key={cat.id}
                        href={`/category/${cat.slug}`}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-primary/5 hover:text-primary transition-colors group"
                        onMouseEnter={() => setHoveredCategory(cat.slug)}
                        onMouseLeave={() => setHoveredCategory(null)}
                      >
                        <Icon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                        <span className="flex-1 truncate">{cat.name}</span>
                        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50" />
                      </Link>
                    )
                  })
                ) : (
                  <div className="px-4 py-8 text-center text-xs text-muted-foreground">No categories</div>
                )}
              </nav>
            </div>

            {/* Center Banner Carousel */}
            <div className="flex-1 relative rounded-xl overflow-hidden">
              {heroBanners.map((banner, i) => (
                <div
                  key={banner.id || i}
                  style={{ background: `linear-gradient(to bottom right, ${banner.color_from || '#2563eb'}, ${banner.color_to || '#4338ca'})` }}
                  className={`absolute inset-0 transition-opacity duration-700 flex flex-col justify-center px-8 md:px-12 ${
                    i === bannerIndex ? 'opacity-100' : 'opacity-0 pointer-events-none'
                  }`}
                >
                  <Badge className="bg-white/20 text-white border-0 w-fit mb-4">
                    {banner.icon ? <span className="mr-1">{banner.icon}</span> : <Sparkles className="h-3 w-3 mr-1" />}
                    Channah
                  </Badge>
                  <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-3 font-display">
                    {banner.title}
                  </h1>
                  <p className="text-white/80 text-base md:text-lg mb-6 max-w-lg">
                    {banner.subtitle}
                  </p>
                  <Button size="lg" className="bg-white text-gray-900 hover:bg-white/90 w-fit font-semibold" asChild>
                    <Link href={banner.link_url || '/products'}>
                      Shop Now
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              ))}
              {/* Banner dots */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                {heroBanners.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setBannerIndex(i)}
                    aria-label="Select banner slide"
                    className={`w-2.5 h-2.5 rounded-full transition-all ${
                      i === bannerIndex ? 'bg-white w-6' : 'bg-white/50'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Right Side Cards */}
            <div className="hidden xl:flex flex-col gap-3 w-[220px] shrink-0">
              <Link
                href="/sell"
                className="flex-1 rounded-xl bg-gradient-to-br from-primary to-primary/80 p-5 flex flex-col justify-between text-white hover:shadow-lg transition-shadow"
              >
                <ShoppingBag className="h-8 w-8 mb-2 opacity-80" />
                <div>
                  <p className="font-bold text-sm">Start Selling</p>
                  <p className="text-xs text-white/70 mt-1">Join thousands of suppliers</p>
                </div>
              </Link>
              <Link
                href="/products"
                className="flex-1 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 p-5 flex flex-col justify-between text-white hover:shadow-lg transition-shadow"
              >
                <Zap className="h-8 w-8 mb-2 opacity-80" />
                <div>
                  <p className="font-bold text-sm">Deals & Offers</p>
                  <p className="text-xs text-white/70 mt-1">Up to 50% off on top items</p>
                </div>
              </Link>
              <div className="flex-1 rounded-xl bg-card border p-5 flex flex-col justify-between">
                <TrendingUp className="h-8 w-8 mb-2 text-primary opacity-80" />
                <div>
                  <p className="font-bold text-sm text-foreground">{allProducts.length}+</p>
                  <p className="text-xs text-muted-foreground mt-1">Products available</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ FEATURES BAR ═══════ */}
      <section className="border-b bg-background">
        <div className="container py-3">
          <div className="flex items-center justify-between gap-4 overflow-x-auto">
            {features.map(f => (
              <div key={f.title} className="flex items-center gap-2.5 shrink-0">
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <f.icon className="h-4.5 w-4.5 text-primary" />
                </div>
                <div>
                  <p className="text-xs font-semibold">{f.title}</p>
                  <p className="text-[10px] text-muted-foreground">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ LARGE ADVERTISEMENT BANNER ═══════ */}
      {featuredAd && (
        <section className="py-16 relative overflow-hidden min-h-[400px]">
          {/* Background - Image Carousel or Gradient */}
          {featuredAd.images && featuredAd.images.length > 0 ? (
            <div className="absolute inset-0">
              {featuredAd.images.map((img: string, i: number) => (
                <div
                  key={i}
                  className={`absolute inset-0 transition-opacity duration-1000 ${
                    i === bannerIndex % featuredAd.images.length ? 'opacity-100' : 'opacity-0'
                  }`}
                >
                  <img src={img} alt={featuredAd.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-b from-black/50 to-black/30" />
                </div>
              ))}
            </div>
          ) : (
            <div
              className="absolute inset-0"
              style={{ background: `linear-gradient(to bottom right, ${featuredAd.color_from || '#9333ea'}, ${featuredAd.color_to || '#ef4444'})` }}
            >
              <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
              <div className="absolute top-10 left-10 w-20 h-20 rounded-full bg-white/10 blur-xl" />
              <div className="absolute bottom-10 right-10 w-32 h-32 rounded-full bg-white/10 blur-xl" />
            </div>
          )}

          {/* Content */}
          <div className="container relative z-10">
            <div className="max-w-4xl mx-auto text-center text-white">
              <Badge className="bg-white/20 backdrop-blur-sm text-white border-0 mb-4 text-sm px-4 py-1.5">
                <Sparkles className="h-4 w-4 mr-2" />
                {featuredAd.icon?.toUpperCase() || 'FEATURED'}
              </Badge>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 font-display drop-shadow-lg">
                {featuredAd.title}
              </h2>
              <p className="text-lg md:text-xl text-white/95 mb-8 max-w-2xl mx-auto drop-shadow-md">
                {featuredAd.subtitle}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Button size="lg" className="bg-white text-gray-900 hover:bg-white/90 font-semibold text-lg px-8 shadow-xl" asChild>
                  <Link href={featuredAd.link_url || '/products'}>
                    Shop Now
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="bg-white/10 backdrop-blur-sm border-2 border-white text-white hover:bg-white/20 font-semibold text-lg px-8" asChild>
                  <Link href="/deals">
                    View All Deals
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ═══════ SEARCH BAR ═══════ */}
      <section className="bg-background border-b">
        <div className="container py-4">
          <div className="flex items-center gap-3 max-w-3xl mx-auto">
            <div className="flex-1 flex items-center gap-3 bg-card border-2 border-primary/30 focus-within:border-primary rounded-xl px-4 py-2.5 transition-colors">
              <Search className="h-5 w-5 text-muted-foreground shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search products, suppliers, categories..."
                aria-label="Search products"
                className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground"
                onKeyDown={e => {
                  if (e.key === 'Enter' && searchQuery.trim()) {
                    window.location.href = `/search?q=${encodeURIComponent(searchQuery)}`
                  }
                }}
              />
            </div>
            <Button
              className="bg-primary text-primary-foreground px-6 font-semibold shrink-0"
              onClick={() => {
                if (searchQuery.trim()) {
                  window.location.href = `/search?q=${encodeURIComponent(searchQuery)}`
                }
              }}
            >
              Search
            </Button>
          </div>
        </div>
      </section>

      {/* ═══════ CATEGORY CHIPS (mobile-friendly horizontal scroll) ═══════ */}
      <section className="bg-background border-b sticky top-0 z-30">
        <div className="container py-3">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <button
              onClick={() => setActiveCategory('all')}
              className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium border transition-all ${
                activeCategory === 'all'
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-card text-foreground border-border hover:border-primary/40'
              }`}
            >
              All Products
            </button>
            {topCategories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.slug)}
                className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium border transition-all ${
                  activeCategory === cat.slug
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-card text-foreground border-border hover:border-primary/40'
                }`}
              >
                {cat.name}
                {cat.product_count ? <span className="ml-1.5 text-xs opacity-70">({cat.product_count})</span> : null}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ NEW ARRIVALS (horizontal scroll) ═══════ */}
      {newArrivals.length > 0 && (
        <section className="bg-background py-6">
          <div className="container">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-1 bg-primary rounded-full" />
                <h2 className="text-lg md:text-xl font-bold">New Arrivals</h2>
                <Badge variant="secondary" className="text-xs">Fresh</Badge>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/products?sort=newest">
                  View All <ChevronRight className="h-4 w-4 ml-0.5" />
                </Link>
              </Button>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {newArrivals.map(product => (
                <div key={product.id} className="shrink-0 w-[180px]">
                  <ProductCard
                    product={{
                      id: product.id,
                      name: product.name,
                      slug: product.slug,
                      price: product.price,
                      compareAtPrice: product.compare_at_price,
                      image: product.primary_image || product.images?.[0]?.url || '',
                      rating: product.rating,
                      reviewCount: product.review_count,
                      vendorName: product.vendor?.business_name,
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ═══════ TOP RATED (horizontal scroll) ═══════ */}
      {topRated.length > 0 && (
        <section className="bg-card/50 py-6 border-y">
          <div className="container">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-1 bg-amber-500 rounded-full" />
                <h2 className="text-lg md:text-xl font-bold">Top Rated</h2>
                <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-700">
                  <Star className="h-3 w-3 mr-1 fill-amber-500 text-amber-500" />
                  Best
                </Badge>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/products?sort=rating">
                  View All <ChevronRight className="h-4 w-4 ml-0.5" />
                </Link>
              </Button>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {topRated.map(product => (
                <div key={`rated-${product.id}`} className="shrink-0 w-[180px]">
                  <ProductCard
                    product={{
                      id: product.id,
                      name: product.name,
                      slug: product.slug,
                      price: product.price,
                      compareAtPrice: product.compare_at_price,
                      image: product.primary_image || product.images?.[0]?.url || '',
                      rating: product.rating,
                      reviewCount: product.review_count,
                      vendorName: product.vendor?.business_name,
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ═══════ MAIN PRODUCT GRID (Alibaba-style dense grid) ═══════ */}
      <section className="py-8">
        <div className="container">
          {/* Section header */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-1 bg-primary rounded-full" />
              <h2 className="text-lg md:text-xl font-bold">
                {activeCategory === 'all' ? 'Recommended For You' : topCategories.find(c => c.slug === activeCategory)?.name || 'Products'}
              </h2>
              <span className="text-sm text-muted-foreground">
                ({filteredProducts.length} products)
              </span>
            </div>
          </div>

          {/* Product Grid */}
          {loading || categoryLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {Array.from({ length: 18 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="aspect-square w-full rounded-lg" />
                  <Skeleton className="h-3 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                  <Skeleton className="h-4 w-1/3" />
                </div>
              ))}
            </div>
          ) : visibleProducts.length > 0 ? (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                {visibleProducts.map(product => (
                  <ProductCard
                    key={product.id}
                    product={{
                      id: product.id,
                      name: product.name,
                      slug: product.slug,
                      price: product.price,
                      compareAtPrice: product.compare_at_price,
                      image: product.primary_image || product.images?.[0]?.url || '',
                      rating: product.rating,
                      reviewCount: product.review_count,
                      vendorName: product.vendor?.business_name,
                    }}
                  />
                ))}
              </div>

              {/* Load More */}
              {hasMore && (
                <div className="flex justify-center mt-8">
                  <Button
                    variant="outline"
                    size="lg"
                    className="px-12"
                    onClick={() => setVisibleCount(v => v + PRODUCTS_PER_PAGE)}
                  >
                    Load More Products
                    <span className="ml-2 text-sm text-muted-foreground">
                      (showing {visibleProducts.length} of {filteredProducts.length})
                    </span>
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Package className="h-16 w-16 text-muted-foreground/40 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No products found</h3>
              <p className="text-muted-foreground mb-4 text-sm">
                {searchQuery ? 'Try a different search term' : 'Products will appear here when suppliers add them'}
              </p>
              <Button variant="outline" asChild>
                <Link href="/sell">Become a Supplier</Link>
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* ═══════ CATEGORY BROWSE GRID ═══════ */}
      {topCategories.length > 0 && (
        <section className="py-8 bg-background border-t">
          <div className="container">
            <div className="flex items-center gap-2.5 mb-5">
              <div className="h-8 w-1 bg-primary rounded-full" />
              <h2 className="text-lg md:text-xl font-bold">Browse Categories</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
              {topCategories.map(cat => {
                const Icon = categoryIcons[cat.slug] || Package
                return (
                  <Link
                    key={cat.id}
                    href={`/category/${cat.slug}`}
                    className="group flex flex-col items-center gap-2.5 p-4 rounded-xl bg-card border border-border hover:border-primary/30 hover:shadow-md transition-all"
                  >
                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      {cat.image_url ? (
                        <Image src={cat.image_url} alt={cat.name} width={28} height={28} className="h-7 w-7 object-contain" />
                      ) : (
                        <Icon className="h-6 w-6 text-primary" />
                      )}
                    </div>
                    <p className="text-xs font-medium text-center line-clamp-2 group-hover:text-primary transition-colors">
                      {cat.name}
                    </p>
                    {cat.product_count ? (
                      <span className="text-[10px] text-muted-foreground">{cat.product_count} items</span>
                    ) : null}
                  </Link>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* ═══════ SUPPLIER CTA ═══════ */}
      <section className="py-12 bg-background border-t">
        <div className="container">
          <div className="relative rounded-2xl bg-gradient-to-br from-primary via-primary to-indigo-700 p-8 md:p-12 text-white overflow-hidden">
            <div className="absolute top-0 right-0 h-64 w-64 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 h-48 w-48 bg-white/10 rounded-full blur-3xl" />
            <div className="relative z-10 max-w-2xl mx-auto text-center">
              <h3 className="text-2xl md:text-3xl font-bold font-display mb-3">
                Start Selling on Channah
              </h3>
              <p className="text-white/80 mb-6 text-base">
                Reach millions of buyers worldwide. Get verified and grow your business.
              </p>
              <div className="flex gap-4 justify-center flex-wrap">
                <Button size="lg" className="bg-white text-primary hover:bg-white/90 font-semibold" asChild>
                  <Link href="/sell">
                    Become a Supplier
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10" asChild>
                  <Link href="/vendors">Browse Suppliers</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
