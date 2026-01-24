'use client'

import * as React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Zap, Clock, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { CountdownTimer, FlashDealCard } from '@/components/deals'
import { productsAPI } from '@/lib/api'

interface Product {
  id: string
  name: string
  slug: string
  price: number
  compare_at_price?: number
  primary_image?: string
  quantity: number
}

// Mock deals data - in production, this would come from the API
const generateMockDeals = (products: Product[]) => {
  const now = new Date()
  return products.slice(0, 12).map((product, index) => ({
    product,
    deal: {
      end_date: new Date(now.getTime() + (index + 1) * 3600000 * (index % 3 + 1)).toISOString(),
      discount_percent: [15, 20, 25, 30, 35, 40, 45, 50][index % 8],
      total_quantity: 50 + index * 10,
      sold_quantity: Math.floor(Math.random() * 30) + 10,
    },
  }))
}

export default function DealsPage() {
  const [deals, setDeals] = React.useState<any[]>([])
  const [isLoading, setIsLoading] = React.useState(true)

  // Main flash sale end time (24 hours from now)
  const mainSaleEnd = React.useMemo(() => {
    const end = new Date()
    end.setHours(end.getHours() + 24)
    return end
  }, [])

  React.useEffect(() => {
    const fetchDeals = async () => {
      try {
        const response = await productsAPI.getAll({ limit: 12 })
        const data = response.data
        const products = Array.isArray(data) ? data : (data.results || data.items || [])
        setDeals(generateMockDeals(products))
      } catch (error) {
        console.error('Failed to fetch deals:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchDeals()
  }, [])

  return (
    <div className="container py-8">
      {/* Hero Section */}
      <div className="relative rounded-2xl bg-gradient-to-r from-primary/90 to-primary overflow-hidden mb-8">
        <div className="absolute inset-0 bg-[url('/patterns/circuit.svg')] opacity-10" />
        <div className="relative px-6 py-12 md:px-12 md:py-16">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            {/* Left Side - Content */}
            <div className="text-center md:text-left text-primary-foreground">
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-1.5 mb-4">
                <Zap className="h-4 w-4" />
                <span className="text-sm font-medium">Flash Sale</span>
              </div>
              <h1 className="text-3xl md:text-5xl font-bold font-display mb-4">
                Up to 50% Off
              </h1>
              <p className="text-lg md:text-xl text-primary-foreground/80 mb-6">
                Grab these amazing deals before they&apos;re gone! Limited quantities available.
              </p>
              <div className="flex items-center justify-center md:justify-start gap-3 mb-6">
                <Clock className="h-5 w-5" />
                <span className="font-medium">Sale ends in:</span>
              </div>
              <CountdownTimer endDate={mainSaleEnd} size="lg" className="justify-center md:justify-start" />
              <Button
                size="lg"
                className="mt-6 bg-navy text-cyan hover:bg-navy/90 font-semibold"
                asChild
              >
                <Link href="#deals">
                  Shop Now <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>

            {/* Right Side - Image */}
            <div className="hidden md:flex justify-center items-center relative">
              <div className="relative w-80 h-80 lg:w-96 lg:h-96">
                {/* Background decorations */}
                <div className="absolute -top-4 -right-4 h-full w-full rounded-3xl bg-white/10 transform rotate-6" />
                <div className="absolute -top-8 -right-8 h-full w-full rounded-3xl bg-white/5 transform rotate-12" />

                {/* Main image container */}
                <div className="relative h-full w-full rounded-3xl overflow-hidden shadow-2xl border-4 border-white/20">
                  <Image
                    src="https://images.unsplash.com/photo-1607082350899-7e105aa886ae?w=600&h=600&fit=crop"
                    alt="Flash Sale Shopping"
                    fill
                    className="object-cover"
                    priority
                  />
                  {/* Overlay gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-primary/50 to-transparent" />

                  {/* Floating discount badges */}
                  <div className="absolute top-4 right-4 bg-yellow-400 text-navy font-bold text-lg px-4 py-2 rounded-xl shadow-lg animate-bounce">
                    -50%
                  </div>
                  <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm text-navy font-semibold px-4 py-2 rounded-xl shadow-lg">
                    Limited Time!
                  </div>
                </div>

                {/* Floating product images */}
                <div className="absolute -left-8 top-1/4 h-20 w-20 rounded-xl overflow-hidden shadow-lg border-2 border-white/30 animate-float">
                  <Image
                    src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200"
                    alt="Headphones"
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="absolute -right-4 bottom-1/4 h-16 w-16 rounded-xl overflow-hidden shadow-lg border-2 border-white/30 animate-bounce-soft">
                  <Image
                    src="https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200"
                    alt="Watch"
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Deals Grid */}
      <div id="deals" className="space-y-6 scroll-mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold font-display">Today&apos;s Deals</h2>
          <Button variant="ghost" asChild>
            <Link href="/products">
              View All Products <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {[...Array(8)].map((_, i) => (
              <Card key={i}>
                <Skeleton className="aspect-square" />
                <CardContent className="p-4 space-y-3">
                  <Skeleton className="h-4 w-32 mx-auto" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-6 w-24" />
                  <Skeleton className="h-2 w-full" />
                  <Skeleton className="h-9 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : deals.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <Zap className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">No deals available</h3>
              <p className="mt-2 text-muted-foreground">
                Check back later for amazing deals!
              </p>
              <Button asChild className="mt-4">
                <Link href="/products">Browse Products</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {deals.map((item, index) => (
              <FlashDealCard
                key={item.product.id || index}
                product={item.product}
                deal={item.deal}
              />
            ))}
          </div>
        )}
      </div>

      {/* Info Sections */}
      <div className="grid md:grid-cols-3 gap-6 mt-12">
        <Card>
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Zap className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">Flash Deals</h3>
            <p className="text-sm text-muted-foreground">
              Limited-time offers with the biggest discounts. First come, first served!
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Clock className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">Daily Refresh</h3>
            <p className="text-sm text-muted-foreground">
              New deals added every day. Check back regularly for fresh savings!
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <svg
                className="h-6 w-6 text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="font-semibold mb-2">Best Price Guarantee</h3>
            <p className="text-sm text-muted-foreground">
              Found it cheaper? We&apos;ll match the price on qualifying items.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
