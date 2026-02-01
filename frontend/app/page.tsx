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
import { AnimatedSection } from '@/components/ui/animated-section'

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
          productsAPI.getAll({ category: cat.slug, limit: 8 }).catch(() => [])
        )

        const [categoriesRes, ...categoryResults] = await Promise.all([
          categoriesAPI.getFeatured(8).catch(() => []),
          ...categoryPromises,
        ])

        // Map products to their category slugs
        const productsMap: Record<string, Product[]> = {}
        categorySections.forEach((cat, index) => {
          const res = categoryResults[index]
          productsMap[cat.slug] = Array.isArray(res) ? res : (res?.results || res?.items || [])
        })

        setCategoryProducts(productsMap)
        setCategories(Array.isArray(categoriesRes) ? categoriesRes : (categoriesRes?.results || categoriesRes?.items || []))
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
      {/* Hero Section - Alibaba Style with Integrated Search */}
      <section className="relative overflow-hidden bg-gradient-to-br from-background via-background to-primary/5 border-b">
        <div className="container relative py-12 md:py-16">
          <div className="max-w-5xl mx-auto">
            {/* Main Heading */}
            <div className="text-center mb-8">
              <Badge className="px-4 py-2 text-sm bg-primary/10 text-primary border-primary/20 mb-4">
                <Sparkles className="mr-2 h-4 w-4" />
                The Leading B2B Marketplace
              </Badge>
              <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold font-display leading-tight mb-4">
                Find Quality Suppliers<br />
                <span className="text-primary">Ship Worldwide</span>
              </h1>
              <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
                Connect with verified suppliers and manufacturers. Get competitive quotes and trade assurance.
              </p>
            </div>

            {/* Search Bar - Alibaba Style */}
            <div className="bg-card rounded-2xl shadow-2xl border-2 border-border p-2 mb-6">
              <div className="flex gap-2">
                <div className="flex-1 flex items-center gap-3 px-4">
                  <Package className="h-5 w-5 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search for products, suppliers, or categories..."
                    className="flex-1 bg-transparent border-0 outline-none text-foreground placeholder:text-muted-foreground py-3"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const searchValue = (e.target as HTMLInputElement).value
                        if (searchValue.trim()) {
                          window.location.href = `/search?q=${encodeURIComponent(searchValue)}`
                        }
                      }
                    }}
                  />
                </div>
                <Button
                  size="lg"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 font-semibold"
                  onClick={() => {
                    const input = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement
                    if (input && input.value.trim()) {
                      window.location.href = `/search?q=${encodeURIComponent(input.value)}`
                    }
                  }}
                >
                  Search
                </Button>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-6 max-w-2xl mx-auto">
              <div className="text-center">
                <p className="text-2xl md:text-3xl font-bold text-primary">{Object.values(categoryProducts).flat().length > 0 ? `${Object.values(categoryProducts).flat().length}+` : '200K+'}</p>
                <p className="text-xs md:text-sm text-muted-foreground mt-1">Products</p>
              </div>
              <div className="text-center">
                <p className="text-2xl md:text-3xl font-bold text-primary">{categories.length > 0 ? `${categories.length * 100}+` : '5K+'}</p>
                <p className="text-xs md:text-sm text-muted-foreground mt-1">Suppliers</p>
              </div>
              <div className="text-center">
                <p className="text-2xl md:text-3xl font-bold text-primary">{categories.length > 0 ? categories.length : '50+'}</p>
                <p className="text-xs md:text-sm text-muted-foreground mt-1">Categories</p>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-wrap gap-4 justify-center mt-8">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg" asChild>
                <Link href="/products">
                  Browse Products
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="border-primary/30 hover:bg-primary/5" asChild>
                <Link href="/sell">Become a Supplier</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <AnimatedSection delay={0}>
      <section className="py-12 border-b border-border bg-card/30">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group flex items-center gap-3 p-4 rounded-xl bg-background hover:bg-primary/5 border border-border hover:border-primary/30 transition-all duration-300"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">{feature.title}</h3>
                  <p className="text-xs text-muted-foreground">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      </AnimatedSection>

      {/* Categories - Alibaba Grid Style */}
      <AnimatedSection delay={0.1}>
      <section className="py-12 bg-background">
        <div className="container">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold font-display">Shop by Category</h2>
              <p className="text-sm text-muted-foreground mt-1">Browse millions of products from verified suppliers</p>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/categories">
                View All
                <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className="h-24 rounded-lg" />
                ))
              ) : categories.length > 0 ? (
                categories.slice(0, 8).map((category) => (
                  <Link
                    key={category.id}
                    href={`/category/${category.slug}`}
                    className="group flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-primary/5 border border-transparent hover:border-primary/20 transition-all"
                  >
                    <div className="relative h-12 w-12 rounded-full bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
                      {category.image_url ? (
                        <img
                          src={category.image_url}
                          alt={category.name}
                          className="h-8 w-8 object-contain"
                        />
                      ) : (
                        <Package className="h-6 w-6 text-primary" />
                      )}
                    </div>
                    <div className="text-center">
                      <p className="text-xs font-medium text-foreground group-hover:text-primary transition-colors line-clamp-2">
                        {category.name}
                      </p>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="col-span-full text-center py-8 text-muted-foreground">
                  <p className="text-sm">No categories available</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      </AnimatedSection>

      {/* Featured Suppliers - Alibaba Style */}
      <AnimatedSection delay={0.2}>
      <section className="py-12 bg-card/30">
        <div className="container">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold font-display">Featured Suppliers</h2>
              <p className="text-sm text-muted-foreground mt-1">Connect with verified manufacturers and wholesalers</p>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/vendors">
                View All Suppliers
                <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {([] as Array<{ name: string; rating: number; products: number; location: string; verified: boolean }>).map((supplier, index) => (
              <Link
                key={index}
                href="/vendors"
                className="group bg-background border border-border rounded-xl p-4 hover:shadow-lg hover:border-primary/30 transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-lg font-bold text-primary">
                      {supplier.name.charAt(0)}
                    </span>
                  </div>
                  {supplier.verified && (
                    <Badge variant="outline" className="text-[10px] px-2 py-0.5 border-primary/30 text-primary">
                      <Shield className="h-2.5 w-2.5 mr-1" />
                      Verified
                    </Badge>
                  )}
                </div>
                <h3 className="font-semibold text-sm mb-2 line-clamp-1 group-hover:text-primary transition-colors">
                  {supplier.name}
                </h3>
                <div className="flex items-center gap-1 mb-2">
                  <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm font-medium">{supplier.rating}</span>
                  <span className="text-xs text-muted-foreground ml-1">({supplier.products} products)</span>
                </div>
                <p className="text-xs text-muted-foreground">{supplier.location}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      </AnimatedSection>

      {/* Flash Sale Section */}
      <AnimatedSection delay={0}>
      <section className="py-12">
        <div className="container">
          <div className="relative rounded-2xl bg-gradient-to-br from-primary to-primary/80 overflow-hidden p-8 md:p-12">
            <div className="absolute top-0 right-0 h-64 w-64 bg-white/10 rounded-full blur-3xl" />
            <div className="relative max-w-xl">
              <Badge className="bg-white/20 text-white border-0 mb-4">
                <Zap className="h-3 w-3 mr-1" />
                Flash Sale
              </Badge>
              <h2 className="text-3xl md:text-5xl font-bold font-display text-white mb-4">
                Up to 50% Off
              </h2>
              <p className="text-white/90 mb-6 text-lg">
                Amazing deals on selected products! Limited time offer.
              </p>

              <div className="mb-8">
                <div className="flex items-center gap-2 mb-3">
                  <Timer className="h-5 w-5 text-white" />
                  <span className="text-white font-medium">Sale ends in:</span>
                </div>
                <CountdownTimer
                  endDate={new Date(Date.now() + 24 * 60 * 60 * 1000)}
                  size="lg"
                  className="[&_div]:bg-white/20 [&_div]:text-white [&_span]:text-white/60"
                />
              </div>

              <Button size="lg" className="bg-white text-primary hover:bg-white/90 font-bold shadow-lg" asChild>
                <Link href="/deals">
                  Shop Now
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      </AnimatedSection>

      {/* Electronics */}
      <AnimatedSection delay={0.1}>
      <section className="py-12 bg-background">
        <div className="container">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Laptop className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-xl md:text-2xl font-bold font-display">Electronics & Technology</h2>
                <p className="text-xs text-muted-foreground">Latest gadgets from verified suppliers</p>
              </div>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/category/electronics">
                View All
                <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => <ProductSkeleton key={i} />)
            ) : (categoryProducts['electronics'] || []).length > 0 ? (
              (categoryProducts['electronics'] || []).slice(0, 10).map((product) => (
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
                description="Electronics products will appear here when suppliers add them."
              />
            )}
          </div>
        </div>
      </section>

      </AnimatedSection>

      {/* Request for Quotation Banner - B2B Feature */}
      <AnimatedSection delay={0}>
      <section className="py-12 bg-card/30">
        <div className="container">
          <div className="relative rounded-2xl bg-gradient-to-br from-primary via-primary to-accent p-8 md:p-10 text-white overflow-hidden">
            <div className="absolute top-0 right-0 h-48 w-48 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 h-48 w-48 bg-white/10 rounded-full blur-3xl" />
            <div className="relative z-10 max-w-2xl mx-auto text-center">
              <Badge className="bg-white/20 text-white backdrop-blur-sm border-0 mb-4">
                <Sparkles className="mr-2 h-3.5 w-3.5" />
                B2B Trade Services
              </Badge>
              <h3 className="text-2xl md:text-4xl font-bold font-display mb-4">
                Request Quotes from Multiple Suppliers
              </h3>
              <p className="text-white/90 mb-6 text-base md:text-lg">
                Tell us what you need. Get quotes from verified suppliers. Compare and choose the best deal.
              </p>
              <div className="flex flex-wrap gap-4 justify-center">
                <Button size="lg" className="bg-white text-primary hover:bg-white/90 font-semibold shadow-xl" asChild>
                  <Link href="/products">
                    Request Quote
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10" asChild>
                  <Link href="/vendors">Find Suppliers</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      </AnimatedSection>

      {/* Fashion */}
      <AnimatedSection delay={0.1}>
      <section className="py-12 bg-card/30">
        <div className="container">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-pink-500/10 flex items-center justify-center">
                <Shirt className="h-5 w-5 text-pink-500" />
              </div>
              <div>
                <h2 className="text-xl md:text-2xl font-bold font-display">Fashion & Apparel</h2>
                <p className="text-xs text-muted-foreground">Trending styles from fashion suppliers</p>
              </div>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/category/fashion">
                View All
                <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => <ProductSkeleton key={i} />)
            ) : (categoryProducts['fashion'] || []).length > 0 ? (
              (categoryProducts['fashion'] || []).slice(0, 10).map((product) => (
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
                description="Fashion products will appear here when suppliers add them."
              />
            )}
          </div>
        </div>
      </section>

      </AnimatedSection>

      {/* Home & Garden */}
      <AnimatedSection delay={0.2}>
      <section className="py-12 bg-background">
        <div className="container">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <Home className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <h2 className="text-xl md:text-2xl font-bold font-display">Home & Garden</h2>
                <p className="text-xs text-muted-foreground">Quality home products from manufacturers</p>
              </div>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/category/home-garden">
                View All
                <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => <ProductSkeleton key={i} />)
            ) : (categoryProducts['home-garden'] || []).length > 0 ? (
              (categoryProducts['home-garden'] || []).slice(0, 10).map((product) => (
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
                description="Home & garden products will appear here when suppliers add them."
              />
            )}
          </div>
        </div>
      </section>

      </AnimatedSection>

      {/* Become a Supplier CTA */}
      <AnimatedSection delay={0}>
      <section className="py-16 bg-background">
        <div className="container">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold font-display mb-3">
              Start Selling on Vendora
            </h2>
            <p className="text-base text-muted-foreground mb-6">
              Reach millions of buyers worldwide. Get verified and start growing your business today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg" asChild>
                <Link href="/sell">
                  Become a Supplier
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/vendors">Browse Suppliers</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
      </AnimatedSection>
    </div>
  )
}
