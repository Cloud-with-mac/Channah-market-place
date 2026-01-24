'use client'

import * as React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useParams } from 'next/navigation'
import {
  Store,
  Star,
  Package,
  MapPin,
  Calendar,
  Mail,
  Phone,
  Globe,
  ChevronRight,
  Grid3X3,
  List,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ProductCard } from '@/components/product/product-card'
import { vendorsAPI, productsAPI } from '@/lib/api'
import { formatDate } from '@/lib/utils'

interface Vendor {
  id: string
  business_name: string
  slug: string
  description?: string
  logo?: string
  banner?: string
  rating: number
  review_count: number
  total_products: number
  total_sales: number
  city?: string
  state?: string
  country?: string
  email?: string
  phone?: string
  website?: string
  verified: boolean
  created_at: string
}

interface Product {
  id: string
  name: string
  slug: string
  price: number
  compare_at_price?: number
  primary_image?: string
  rating: number
  review_count: number
  quantity: number
}

export default function VendorStorePage() {
  const params = useParams()
  const slug = params.slug as string

  const [vendor, setVendor] = React.useState<Vendor | null>(null)
  const [products, setProducts] = React.useState<Product[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [viewMode, setViewMode] = React.useState<'grid' | 'list'>('grid')

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const [vendorRes, productsRes] = await Promise.allSettled([
          vendorsAPI.getBySlug(slug),
          productsAPI.getAll({ vendor: slug, limit: 50 }),
        ])

        if (vendorRes.status === 'fulfilled') {
          setVendor(vendorRes.value.data)
        }

        if (productsRes.status === 'fulfilled') {
          const data = productsRes.value.data
          const productList = Array.isArray(data) ? data : (data?.results || data?.items || [])
          setProducts(productList)
        }
      } catch (error) {
        console.error('Failed to fetch vendor:', error)
      } finally {
        setIsLoading(false)
      }
    }

    if (slug) {
      fetchData()
    }
  }, [slug])

  if (isLoading) {
    return (
      <div className="container py-8">
        <Skeleton className="h-48 w-full mb-8" />
        <div className="flex items-center gap-4 mb-8">
          <Skeleton className="h-24 w-24 rounded-full" />
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="aspect-square" />
          ))}
        </div>
      </div>
    )
  }

  if (!vendor) {
    return (
      <div className="container py-16 text-center">
        <Store className="mx-auto h-16 w-16 text-muted-foreground/50 mb-4" />
        <h1 className="text-2xl font-bold mb-2">Vendor Not Found</h1>
        <p className="text-muted-foreground mb-4">
          The vendor you&apos;re looking for doesn&apos;t exist or has been removed.
        </p>
        <Button asChild>
          <Link href="/vendors">Browse Vendors</Link>
        </Button>
      </div>
    )
  }

  return (
    <div>
      {/* Banner */}
      <div className="relative h-48 md:h-64 bg-gradient-to-r from-primary/30 to-primary/10">
        {vendor.banner && (
          <Image
            src={vendor.banner}
            alt={vendor.business_name}
            fill
            className="object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
      </div>

      <div className="container">
        {/* Vendor Info */}
        <div className="relative -mt-16 mb-8">
          <div className="flex flex-col md:flex-row md:items-end gap-4">
            {/* Logo */}
            <div className="relative h-32 w-32 rounded-xl border-4 border-background bg-muted overflow-hidden flex-shrink-0">
              {vendor.logo ? (
                <Image
                  src={vendor.logo}
                  alt={vendor.business_name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center bg-primary/10">
                  <Store className="h-12 w-12 text-primary" />
                </div>
              )}
            </div>

            {/* Details */}
            <div className="flex-1 pb-2">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl md:text-3xl font-bold font-display">
                  {vendor.business_name}
                </h1>
                {vendor.verified && (
                  <Badge className="bg-blue-500 text-white">Verified</Badge>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                  <span className="font-medium text-foreground">
                    {vendor.rating?.toFixed(1) || '0.0'}
                  </span>
                  <span>({vendor.review_count || 0} reviews)</span>
                </div>
                <div className="flex items-center gap-1">
                  <Package className="h-4 w-4" />
                  <span>{vendor.total_products || 0} products</span>
                </div>
                {(vendor.city || vendor.country) && (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    <span>
                      {[vendor.city, vendor.state, vendor.country].filter(Boolean).join(', ')}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>Joined {formatDate(vendor.created_at)}</span>
                </div>
              </div>
            </div>

            {/* Contact Button */}
            <Button variant="outline">
              <Mail className="mr-2 h-4 w-4" />
              Contact Seller
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="products" className="space-y-6">
          <TabsList>
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="about">About</TabsTrigger>
          </TabsList>

          {/* Products Tab */}
          <TabsContent value="products" className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-muted-foreground">
                {products.length} {products.length === 1 ? 'product' : 'products'}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                  size="icon"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                  size="icon"
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {products.length === 0 ? (
              <Card>
                <CardContent className="py-16 text-center">
                  <Package className="mx-auto h-12 w-12 text-muted-foreground/50" />
                  <h3 className="mt-4 text-lg font-semibold">No products yet</h3>
                  <p className="mt-2 text-muted-foreground">
                    This vendor hasn&apos;t listed any products yet.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div
                className={
                  viewMode === 'grid'
                    ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6'
                    : 'space-y-4'
                }
              >
                {products.map((product: any) => (
                  <ProductCard
                    key={product.id}
                    product={{
                      id: product.id,
                      name: product.name,
                      slug: product.slug,
                      price: parseFloat(product.price),
                      compareAtPrice: product.compare_at_price ? parseFloat(product.compare_at_price) : undefined,
                      image: product.primary_image || product.images?.[0]?.url || '',
                      rating: product.rating || 0,
                      reviewCount: product.review_count || 0,
                      vendorName: vendor?.business_name,
                    }}
                    variant={viewMode === 'list' ? 'horizontal' : 'default'}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* About Tab */}
          <TabsContent value="about">
            <div className="grid gap-6 md:grid-cols-3">
              {/* Description */}
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>About {vendor.business_name}</CardTitle>
                </CardHeader>
                <CardContent>
                  {vendor.description ? (
                    <p className="text-muted-foreground whitespace-pre-wrap">
                      {vendor.description}
                    </p>
                  ) : (
                    <p className="text-muted-foreground italic">
                      No description provided.
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Contact Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {vendor.email && (
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <a
                        href={`mailto:${vendor.email}`}
                        className="text-sm hover:underline"
                      >
                        {vendor.email}
                      </a>
                    </div>
                  )}
                  {vendor.phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <a
                        href={`tel:${vendor.phone}`}
                        className="text-sm hover:underline"
                      >
                        {vendor.phone}
                      </a>
                    </div>
                  )}
                  {vendor.website && (
                    <div className="flex items-center gap-3">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <a
                        href={vendor.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm hover:underline"
                      >
                        {vendor.website}
                      </a>
                    </div>
                  )}
                  {(vendor.city || vendor.country) && (
                    <div className="flex items-center gap-3">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {[vendor.city, vendor.state, vendor.country].filter(Boolean).join(', ')}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Stats */}
              <Card className="md:col-span-3">
                <CardHeader>
                  <CardTitle>Store Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <p className="text-3xl font-bold text-primary">
                        {vendor.total_products || 0}
                      </p>
                      <p className="text-sm text-muted-foreground">Products</p>
                    </div>
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <p className="text-3xl font-bold text-primary">
                        {vendor.total_sales || 0}
                      </p>
                      <p className="text-sm text-muted-foreground">Sales</p>
                    </div>
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <p className="text-3xl font-bold text-primary">
                        {vendor.rating?.toFixed(1) || '0.0'}
                      </p>
                      <p className="text-sm text-muted-foreground">Rating</p>
                    </div>
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <p className="text-3xl font-bold text-primary">
                        {vendor.review_count || 0}
                      </p>
                      <p className="text-sm text-muted-foreground">Reviews</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
