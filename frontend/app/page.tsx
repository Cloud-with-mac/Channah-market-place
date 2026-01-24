'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import {
  ArrowRight,
  Truck,
  Shield,
  Headphones,
  CreditCard,
  Sparkles,
  Star,
  ChevronRight,
  Zap,
  Timer,
  Package,
  Laptop,
  Shirt,
  Home,
  Trophy,
  Baby,
  Monitor,
  Smartphone,
  Watch,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ProductCard } from '@/components/product/product-card'
import { CategoryCard } from '@/components/category/category-card'
import { CountdownTimer } from '@/components/deals'
import { productsAPI, categoriesAPI } from '@/lib/api'

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
}

interface Category {
  id: string
  name: string
  slug: string
  image_url?: string
  product_count?: number
}

const features = [
  { icon: Truck, title: 'Free Worldwide Delivery', description: 'On orders over $50' },
  { icon: Shield, title: 'Secure Payment', description: '100% protected' },
  { icon: Headphones, title: '24/7 Support', description: 'Always here to help' },
  { icon: CreditCard, title: 'Easy Returns', description: '30-day policy' },
]

const testimonials = [
  {
    id: 1,
    name: 'Sarah Mitchell',
    role: 'Fashion Enthusiast',
    content: 'Channah has transformed my shopping experience. The quality of products and delivery speed is exceptional!',
    rating: 5,
    avatar: 'S',
  },
  {
    id: 2,
    name: 'James Chen',
    role: 'Tech Professional',
    content: 'As a vendor, I\'ve seen my business grow 3x since joining Channah. The platform is truly empowering entrepreneurs.',
    rating: 5,
    avatar: 'J',
  },
  {
    id: 3,
    name: 'Emma Thompson',
    role: 'Home Decorator',
    content: 'The variety of home goods available is amazing. I\'ve furnished my entire apartment through Channah!',
    rating: 5,
    avatar: 'E',
  },
]

function ProductSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="aspect-square w-full rounded-lg" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-6 w-1/3" />
    </div>
  )
}

// Hero Image Carousel
const heroImages = [
  { url: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800&h=800&fit=crop', alt: 'Shopping' },
  { url: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800&h=800&fit=crop', alt: 'Fashion' },
  { url: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=800&fit=crop', alt: 'Store' },
]

function HeroImageCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % heroImages.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="relative w-80 h-80 md:w-[400px] md:h-[400px] lg:w-[480px] lg:h-[480px]">
        {heroImages.map((image, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-all duration-1000 ease-in-out ${
              index === currentIndex ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
            }`}
          >
            <div className="relative w-full h-full rounded-3xl overflow-hidden border-4 border-cyan/30 shadow-2xl">
              <img src={image.url} alt={image.alt} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-navy/60 via-transparent to-transparent" />
            </div>
          </div>
        ))}
        <div className="absolute -bottom-4 -right-4 h-full w-full rounded-3xl bg-cyan/20 -z-10 transform rotate-6" />
      </div>
    </div>
  )
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
      <Package className="h-16 w-16 text-muted-foreground/50 mb-4" />
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground mb-4">{description}</p>
      <Button variant="outline" asChild>
        <Link href="/sell">Become a Seller</Link>
      </Button>
    </div>
  )
}

// Category sections configuration
const categorySections = [
  { slug: 'electronics', name: 'Electronics', subtitle: 'Latest gadgets and devices', icon: Laptop, color: 'cyan' },
  { slug: 'fashion', name: 'Fashion', subtitle: 'Trending styles and accessories', icon: Shirt, color: 'pink' },
  { slug: 'home-garden', name: 'Home & Garden', subtitle: 'Everything for your home', icon: Home, color: 'green' },
  { slug: 'sports-outdoors', name: 'Sports & Outdoors', subtitle: 'Gear up for adventure', icon: Trophy, color: 'amber' },
  { slug: 'baby-kids', name: 'Baby & Kids', subtitle: 'Everything for little ones', icon: Baby, color: 'sky' },
  { slug: 'computers-tablets', name: 'Computers & Tablets', subtitle: 'Computing power for everyone', icon: Monitor, color: 'indigo' },
  { slug: 'phones-accessories', name: 'Phones & Accessories', subtitle: 'Stay connected in style', icon: Smartphone, color: 'violet' },
  { slug: 'jewelry-watches', name: 'Jewelry & Watches', subtitle: 'Elegant timepieces and accessories', icon: Watch, color: 'yellow' },
]

export default function HomePage() {
  const [categoryProducts, setCategoryProducts] = useState<Record<string, Product[]>>({})
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch products for each category section
        const categoryPromises = categorySections.map(cat =>
          productsAPI.getAll({ category: cat.slug, limit: 8 }).catch(() => ({ data: [] }))
        )

        const [categoriesRes, ...categoryResults] = await Promise.all([
          categoriesAPI.getFeatured(8).catch(() => ({ data: [] })),
          ...categoryPromises,
        ])

        // Map products to their category slugs
        const productsMap: Record<string, Product[]> = {}
        categorySections.forEach((cat, index) => {
          productsMap[cat.slug] = categoryResults[index]?.data?.results || categoryResults[index]?.data || []
        })

        setCategoryProducts(productsMap)
        setCategories(categoriesRes.data?.results || categoriesRes.data || [])
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-navy-dark via-navy to-cyan-dark/30 text-white">
        <div className="absolute inset-0 bg-gradient-mesh opacity-60" />
        <div className="absolute top-20 right-10 h-80 w-80 rounded-full bg-cyan/20 blur-[100px] animate-pulse" />
        <div className="absolute bottom-10 left-10 h-96 w-96 rounded-full bg-cyan-dark/30 blur-[120px]" />

        <div className="container relative py-16 md:py-24 lg:py-32">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="space-y-6 animate-fade-up">
              <Badge className="px-4 py-2 text-sm bg-cyan/15 text-cyan border-cyan/30 backdrop-blur-sm">
                <Sparkles className="mr-2 h-4 w-4 text-cyan-light" />
                Welcome to the Global Marketplace
              </Badge>
              <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold font-display leading-tight">
                Shop Quality,<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan via-cyan-light to-cyan">Shop Worldwide</span>
              </h1>
              <p className="text-lg md:text-xl text-white/80 max-w-lg leading-relaxed">
                Discover unique products from trusted sellers around the world. From fashion to electronics, find everything you need.
              </p>
              <div className="flex flex-wrap gap-4 pt-4">
                <Button size="lg" className="bg-gradient-to-r from-cyan to-cyan-light text-navy hover:opacity-90 font-semibold shadow-xl" asChild>
                  <Link href="/products">
                    Start Shopping
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="border-cyan/30 text-cyan hover:bg-cyan/10" asChild>
                  <Link href="/sell">Become a Seller</Link>
                </Button>
              </div>

              {/* Stats */}
              <div className="flex gap-10 pt-8 border-t border-cyan/10 mt-8">
                <div className="text-center">
                  <p className="text-4xl font-bold text-cyan">{Object.values(categoryProducts).flat().length > 0 ? `${Object.values(categoryProducts).flat().length}+` : '0'}</p>
                  <p className="text-sm text-white/60 mt-1">Products</p>
                </div>
                <div className="text-center">
                  <p className="text-4xl font-bold text-cyan">{categories.length > 0 ? `${categories.length}+` : '0'}</p>
                  <p className="text-sm text-white/60 mt-1">Categories</p>
                </div>
              </div>
            </div>

            <div className="hidden md:block relative">
              <div className="relative h-[500px] lg:h-[550px] w-full">
                <div className="absolute top-0 right-0 h-64 w-64 rounded-3xl bg-cyan/10 backdrop-blur-md transform rotate-6 animate-float border border-cyan/20" />
                <div className="absolute bottom-10 left-0 h-48 w-48 rounded-3xl bg-cyan-dark/20 backdrop-blur-md transform -rotate-12 border border-cyan/10" />
                <HeroImageCarousel />
              </div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent" />
      </section>

      {/* Features */}
      <section className="py-16 border-b border-border bg-gradient-to-b from-background to-card/30">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group flex items-center gap-4 p-5 md:p-6 rounded-2xl bg-card hover:bg-gradient-to-br hover:from-cyan/5 hover:to-cyan-light/5 border border-border hover:border-cyan/30 transition-all duration-300"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan/10 to-cyan-light/10">
                  <feature.icon className="h-7 w-7 text-cyan" />
                </div>
                <div>
                  <h3 className="font-bold text-sm md:text-base">{feature.title}</h3>
                  <p className="text-xs md:text-sm text-muted-foreground">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16">
        <div className="container">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold font-display">Shop by Category</h2>
              <p className="text-muted-foreground mt-1">Explore our product categories</p>
            </div>
            <Button variant="outline" asChild>
              <Link href="/categories">
                View All
                <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="aspect-square rounded-xl" />
              ))
            ) : categories.length > 0 ? (
              categories.map((category) => (
                <CategoryCard
                  key={category.id}
                  category={{
                    id: category.id,
                    name: category.name,
                    slug: category.slug,
                    image: category.image_url || '',
                    productCount: category.product_count || 0,
                  }}
                />
              ))
            ) : (
              <div className="col-span-full text-center py-8 text-muted-foreground">
                <p>No categories yet. Add categories from the admin dashboard.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Flash Sale Section */}
      <section className="py-12">
        <div className="container">
          <div className="relative rounded-3xl bg-cyan overflow-hidden p-8 md:p-12">
            <div className="max-w-xl">
              <Badge className="bg-cyan-dark/30 text-navy border-0 mb-4">
                <Zap className="h-3 w-3 mr-1" />
                Flash Sale
              </Badge>
              <h2 className="text-4xl md:text-5xl font-bold font-display text-navy mb-4">
                Up to 50% Off
              </h2>
              <p className="text-navy/80 mb-6 text-lg">
                Amazing deals on selected products! Limited time offer.
              </p>

              <div className="mb-8">
                <div className="flex items-center gap-2 mb-3">
                  <Timer className="h-5 w-5 text-navy" />
                  <span className="text-navy font-medium">Sale ends in:</span>
                </div>
                <CountdownTimer
                  endDate={new Date(Date.now() + 24 * 60 * 60 * 1000)}
                  size="lg"
                  className="[&_div]:bg-cyan-dark/20 [&_div]:text-navy [&_span]:text-navy/60"
                />
              </div>

              <Button size="lg" className="bg-navy text-white hover:bg-navy-light font-bold shadow-lg" asChild>
                <Link href="/deals">
                  Shop Now
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Electronics */}
      <section className="py-20 bg-gradient-to-b from-card/30 to-background">
        <div className="container">
          <div className="flex items-center justify-between mb-10">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-cyan/10 to-cyan-light/10 border border-cyan/20">
                  <Laptop className="h-5 w-5 text-cyan" />
                </div>
                <span className="text-sm font-semibold text-cyan uppercase tracking-wider">Tech & Gadgets</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold font-display">Electronics</h2>
              <p className="text-muted-foreground mt-2">Latest gadgets and devices</p>
            </div>
            <Button variant="outline" className="border-cyan/30 hover:bg-cyan hover:text-navy" asChild>
              <Link href="/category/electronics">
                View All
                <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => <ProductSkeleton key={i} />)
            ) : (categoryProducts['electronics'] || []).length > 0 ? (
              (categoryProducts['electronics'] || []).slice(0, 8).map((product) => (
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
              ))
            ) : (
              <EmptyState
                title="No electronics yet"
                description="Electronics products will appear here when vendors add them."
              />
            )}
          </div>
        </div>
      </section>

      {/* AI Recommendations Banner */}
      <section className="py-12">
        <div className="container">
          <div className="relative rounded-3xl bg-gradient-to-br from-navy via-navy-light to-cyan-dark/50 p-8 md:p-14 text-white overflow-hidden border border-cyan/20">
            <div className="absolute inset-0 bg-gradient-mesh opacity-30" />
            <div className="absolute top-10 right-10 h-64 w-64 rounded-full bg-cyan/10 blur-3xl animate-pulse" />
            <div className="relative z-10 max-w-xl">
              <Badge className="bg-cyan/20 text-cyan backdrop-blur-sm border border-cyan/30 mb-4 py-1.5">
                <Sparkles className="mr-2 h-3.5 w-3.5 animate-pulse" />
                AI-Powered Shopping
              </Badge>
              <h3 className="text-3xl md:text-4xl font-bold font-display mb-4">
                Chat with Channah
              </h3>
              <p className="text-white/80 mb-8 text-lg leading-relaxed">
                Our AI assistant helps you find products, compare prices, and get personalized recommendations.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button className="bg-gradient-to-r from-cyan to-cyan-light text-navy hover:opacity-90 font-bold shadow-xl" asChild>
                  <Link href="/chat">
                    <Sparkles className="mr-2 h-4 w-4" />
                    Chat with Channah
                  </Link>
                </Button>
                <Button variant="outline" className="border-cyan/30 text-cyan hover:bg-cyan/10" asChild>
                  <Link href="/products">Browse Products</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Fashion */}
      <section className="py-20">
        <div className="container">
          <div className="flex items-center justify-between mb-10">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-pink-500/10 to-rose-500/10 border border-pink-500/20">
                  <Shirt className="h-5 w-5 text-pink-500" />
                </div>
                <span className="text-sm font-semibold text-pink-500 uppercase tracking-wider">Style & Trends</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold font-display">Fashion</h2>
              <p className="text-muted-foreground mt-2">Trending styles and accessories</p>
            </div>
            <Button variant="outline" className="border-pink-500/30 hover:bg-pink-500 hover:text-white" asChild>
              <Link href="/category/fashion">
                View All
                <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => <ProductSkeleton key={i} />)
            ) : (categoryProducts['fashion'] || []).length > 0 ? (
              (categoryProducts['fashion'] || []).slice(0, 8).map((product) => (
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
              ))
            ) : (
              <EmptyState
                title="No fashion items yet"
                description="Fashion products will appear here when vendors add them."
              />
            )}
          </div>
        </div>
      </section>

      {/* Home & Garden */}
      <section className="py-20 bg-gradient-to-b from-card/30 to-background">
        <div className="container">
          <div className="flex items-center justify-between mb-10">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20">
                  <Home className="h-5 w-5 text-green-500" />
                </div>
                <span className="text-sm font-semibold text-green-500 uppercase tracking-wider">Home Living</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold font-display">Home & Garden</h2>
              <p className="text-muted-foreground mt-2">Everything for your home</p>
            </div>
            <Button variant="outline" className="border-green-500/30 hover:bg-green-500 hover:text-white" asChild>
              <Link href="/category/home-garden">
                View All
                <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => <ProductSkeleton key={i} />)
            ) : (categoryProducts['home-garden'] || []).length > 0 ? (
              (categoryProducts['home-garden'] || []).slice(0, 8).map((product) => (
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
              ))
            ) : (
              <EmptyState
                title="No home & garden items yet"
                description="Home & garden products will appear here when vendors add them."
              />
            )}
          </div>
        </div>
      </section>

      {/* Sports & Outdoors */}
      <section className="py-20">
        <div className="container">
          <div className="flex items-center justify-between mb-10">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20">
                  <Trophy className="h-5 w-5 text-amber-500" />
                </div>
                <span className="text-sm font-semibold text-amber-500 uppercase tracking-wider">Active Life</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold font-display">Sports & Outdoors</h2>
              <p className="text-muted-foreground mt-2">Gear up for adventure</p>
            </div>
            <Button variant="outline" className="border-amber-500/30 hover:bg-amber-500 hover:text-white" asChild>
              <Link href="/category/sports-outdoors">
                View All
                <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => <ProductSkeleton key={i} />)
            ) : (categoryProducts['sports-outdoors'] || []).length > 0 ? (
              (categoryProducts['sports-outdoors'] || []).slice(0, 8).map((product) => (
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
              ))
            ) : (
              <EmptyState
                title="No sports & outdoors items yet"
                description="Sports & outdoors products will appear here when vendors add them."
              />
            )}
          </div>
        </div>
      </section>

      {/* Baby & Kids */}
      <section className="py-20 bg-gradient-to-b from-card/30 to-background">
        <div className="container">
          <div className="flex items-center justify-between mb-10">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-sky-500/10 to-blue-500/10 border border-sky-500/20">
                  <Baby className="h-5 w-5 text-sky-500" />
                </div>
                <span className="text-sm font-semibold text-sky-500 uppercase tracking-wider">Little Ones</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold font-display">Baby & Kids</h2>
              <p className="text-muted-foreground mt-2">Everything for little ones</p>
            </div>
            <Button variant="outline" className="border-sky-500/30 hover:bg-sky-500 hover:text-white" asChild>
              <Link href="/category/baby-kids">
                View All
                <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => <ProductSkeleton key={i} />)
            ) : (categoryProducts['baby-kids'] || []).length > 0 ? (
              (categoryProducts['baby-kids'] || []).slice(0, 8).map((product) => (
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
              ))
            ) : (
              <EmptyState
                title="No baby & kids items yet"
                description="Baby & kids products will appear here when vendors add them."
              />
            )}
          </div>
        </div>
      </section>

      {/* Computers & Tablets */}
      <section className="py-20">
        <div className="container">
          <div className="flex items-center justify-between mb-10">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20">
                  <Monitor className="h-5 w-5 text-indigo-500" />
                </div>
                <span className="text-sm font-semibold text-indigo-500 uppercase tracking-wider">Computing</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold font-display">Computers & Tablets</h2>
              <p className="text-muted-foreground mt-2">Computing power for everyone</p>
            </div>
            <Button variant="outline" className="border-indigo-500/30 hover:bg-indigo-500 hover:text-white" asChild>
              <Link href="/category/computers-tablets">
                View All
                <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => <ProductSkeleton key={i} />)
            ) : (categoryProducts['computers-tablets'] || []).length > 0 ? (
              (categoryProducts['computers-tablets'] || []).slice(0, 8).map((product) => (
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
              ))
            ) : (
              <EmptyState
                title="No computers & tablets yet"
                description="Computers & tablets products will appear here when vendors add them."
              />
            )}
          </div>
        </div>
      </section>

      {/* Phones & Accessories */}
      <section className="py-20 bg-gradient-to-b from-card/30 to-background">
        <div className="container">
          <div className="flex items-center justify-between mb-10">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 border border-violet-500/20">
                  <Smartphone className="h-5 w-5 text-violet-500" />
                </div>
                <span className="text-sm font-semibold text-violet-500 uppercase tracking-wider">Mobile</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold font-display">Phones & Accessories</h2>
              <p className="text-muted-foreground mt-2">Stay connected in style</p>
            </div>
            <Button variant="outline" className="border-violet-500/30 hover:bg-violet-500 hover:text-white" asChild>
              <Link href="/category/phones-accessories">
                View All
                <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => <ProductSkeleton key={i} />)
            ) : (categoryProducts['phones-accessories'] || []).length > 0 ? (
              (categoryProducts['phones-accessories'] || []).slice(0, 8).map((product) => (
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
              ))
            ) : (
              <EmptyState
                title="No phones & accessories yet"
                description="Phones & accessories products will appear here when vendors add them."
              />
            )}
          </div>
        </div>
      </section>

      {/* Jewelry & Watches */}
      <section className="py-20">
        <div className="container">
          <div className="flex items-center justify-between mb-10">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-yellow-500/10 to-amber-500/10 border border-yellow-500/20">
                  <Watch className="h-5 w-5 text-yellow-500" />
                </div>
                <span className="text-sm font-semibold text-yellow-500 uppercase tracking-wider">Luxury</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold font-display">Jewelry & Watches</h2>
              <p className="text-muted-foreground mt-2">Elegant timepieces and accessories</p>
            </div>
            <Button variant="outline" className="border-yellow-500/30 hover:bg-yellow-500 hover:text-white" asChild>
              <Link href="/category/jewelry-watches">
                View All
                <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => <ProductSkeleton key={i} />)
            ) : (categoryProducts['jewelry-watches'] || []).length > 0 ? (
              (categoryProducts['jewelry-watches'] || []).slice(0, 8).map((product) => (
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
              ))
            ) : (
              <EmptyState
                title="No jewelry & watches yet"
                description="Jewelry & watches products will appear here when vendors add them."
              />
            )}
          </div>
        </div>
      </section>

      {/* Browse All Categories */}
      <section className="py-20 bg-gradient-to-b from-card/30 to-background">
        <div className="container">
          <div className="flex items-center justify-between mb-10">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500/10 to-indigo-500/10 border border-purple-500/20">
                  <Package className="h-5 w-5 text-purple-500" />
                </div>
                <span className="text-sm font-semibold text-purple-500 uppercase tracking-wider">Explore</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold font-display">Browse All Categories</h2>
              <p className="text-muted-foreground mt-2">Find exactly what you're looking for</p>
            </div>
            <Button variant="outline" className="border-purple-500/30 hover:bg-purple-500 hover:text-white" asChild>
              <Link href="/categories">
                All Categories
                <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4">
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="aspect-[4/3] rounded-xl" />
              ))
            ) : categories.length > 0 ? (
              categories.slice(0, 8).map((category) => (
                <Link
                  key={category.id}
                  href={`/category/${category.slug}`}
                  className="group relative aspect-[4/3] rounded-2xl bg-gradient-to-br from-card to-card/50 border border-border hover:border-cyan/30 overflow-hidden transition-all duration-300"
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-navy/80 via-navy/40 to-transparent z-10" />
                  {category.image_url ? (
                    <img
                      src={category.image_url}
                      alt={category.name}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-cyan/10 to-purple-500/10" />
                  )}
                  <div className="absolute bottom-0 left-0 right-0 p-4 z-20">
                    <h3 className="font-bold text-white text-lg group-hover:text-cyan transition-colors">
                      {category.name}
                    </h3>
                    <p className="text-white/70 text-sm">
                      {category.product_count || 0} products
                    </p>
                  </div>
                </Link>
              ))
            ) : (
              <div className="col-span-full text-center py-8 text-muted-foreground">
                <p>No categories yet. Add categories from the admin dashboard.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 bg-gradient-to-b from-card/30 to-background">
        <div className="container">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4 border-cyan/30 text-cyan">
              <Star className="h-3 w-3 mr-1 fill-cyan text-cyan" />
              Customer Reviews
            </Badge>
            <h2 className="text-2xl md:text-3xl font-bold font-display mb-2">What Our Customers Say</h2>
            <p className="text-muted-foreground">Join thousands of satisfied shoppers</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial) => (
              <div
                key={testimonial.id}
                className="group relative bg-card rounded-2xl p-6 border border-border hover:border-cyan/30 hover:shadow-xl transition-all duration-300"
              >
                <div className="absolute -top-3 -left-2 text-6xl text-cyan/10 font-serif">"</div>
                <div className="relative">
                  <div className="flex items-center gap-1 mb-4">
                    {Array.from({ length: testimonial.rating }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-cyan text-cyan" />
                    ))}
                  </div>
                  <p className="text-muted-foreground mb-6 leading-relaxed">"{testimonial.content}"</p>
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-cyan to-cyan-light text-navy font-bold text-lg">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <p className="font-semibold">{testimonial.name}</p>
                      <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Become a Seller CTA */}
      <section className="py-20">
        <div className="container">
          <div className="text-center max-w-2xl mx-auto">
            <Badge variant="outline" className="mb-4 border-cyan/30 text-cyan">For Entrepreneurs</Badge>
            <h2 className="text-3xl md:text-4xl font-bold font-display mb-4">
              Start Selling on <span className="text-gradient-premium">Channah</span>
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Join our community of successful sellers and reach customers worldwide.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-gradient-to-r from-cyan to-cyan-light text-navy hover:opacity-90 shadow-lg" asChild>
                <Link href="/sell">
                  Start Selling Today
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
