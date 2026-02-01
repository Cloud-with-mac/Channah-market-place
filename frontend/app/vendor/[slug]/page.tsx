'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  Store,
  MapPin,
  Calendar,
  Award,
  Shield,
  TrendingUp,
  MessageCircle,
  Building2,
  Package,
  Star,
  CheckCircle2,
  Globe,
  Users,
  Factory,
  Truck,
  Phone,
  Mail,
} from 'lucide-react'
import { vendorsAPI } from '@/lib/api'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ProductCard } from '@/components/product/product-card'
import { Skeleton } from '@/components/ui/skeleton'
import { StarRating } from '@/components/ui/star-rating'

export default function VendorProfilePage() {
  const params = useParams()
  const slug = params.slug as string

  const [vendor, setVendor] = useState<any>(null)
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchVendorData = async () => {
      try {
        const vendorData = await vendorsAPI.getBySlug(slug)
        if (vendorData) {
          setVendor({
            id: vendorData.id,
            name: vendorData.business_name || vendorData.name || slug,
            slug: vendorData.slug || slug,
            logo: vendorData.logo || vendorData.logo_url || '',
            coverImage: vendorData.cover_image || vendorData.banner_url || '',
            description: vendorData.description || '',
            location: vendorData.location || vendorData.business_address || '',
            country: vendorData.country || '',
            memberSince: vendorData.year_established ? vendorData.year_established.toString() : (vendorData.created_at ? new Date(vendorData.created_at).getFullYear().toString() : new Date().getFullYear().toString()),
            verified: vendorData.is_verified || vendorData.status === 'approved' || vendorData.status === 'APPROVED',
            goldSupplier: false,
            rating: vendorData.rating || 0,
            reviewCount: vendorData.total_reviews || vendorData.review_count || 0,
            responseRate: vendorData.response_rate || 0,
            responseTime: vendorData.response_time || 'N/A',
            totalProducts: vendorData.product_count || 0,
            mainProducts: vendorData.main_products || [],
            certifications: vendorData.certifications || [],
            yearEstablished: vendorData.year_established || null,
            tradeCapacity: {
              monthlyOutput: vendorData.monthly_output || 'N/A',
              exportPercentage: vendorData.export_percentage || 'N/A',
              mainMarkets: vendorData.main_markets || [],
              employees: vendorData.employees || 'N/A',
            },
            contact: {
              phone: vendorData.business_phone || vendorData.phone || '',
              email: vendorData.business_email || vendorData.email || '',
              website: vendorData.website || '',
            },
          })

          // Fetch vendor products
          try {
            const productsData = await vendorsAPI.getProducts(vendorData.id, { limit: 8 })
            const rawList = Array.isArray(productsData) ? productsData : (productsData?.items || productsData?.results || [])
            const totalCount = productsData?.total || rawList.length
            setVendor((prev: any) => prev ? { ...prev, totalProducts: totalCount } : prev)
            setProducts(rawList.map((p: any) => ({
              id: p.id,
              name: p.name,
              slug: p.slug,
              price: parseFloat(p.price) || 0,
              compareAtPrice: p.compare_at_price ? parseFloat(p.compare_at_price) : undefined,
              image: p.images?.[0]?.url || p.image || '',
              rating: p.rating || 0,
              reviewCount: p.review_count || p.reviewCount || 0,
              vendorName: vendorData.business_name || vendorData.name,
            })))
          } catch {
            setProducts([])
          }
        }
      } catch (error) {
        console.error('Failed to fetch vendor:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchVendorData()
  }, [slug])

  if (loading) {
    return <VendorProfileSkeleton />
  }

  if (!vendor) {
    return (
      <div className="container py-12 text-center">
        <h1 className="text-2xl font-bold mb-4">Supplier Not Found</h1>
        <p className="text-muted-foreground mb-6">
          The supplier you're looking for doesn't exist or has been removed.
        </p>
        <Button asChild>
          <Link href="/vendors">Browse All Suppliers</Link>
        </Button>
      </div>
    )
  }

  const yearsInBusiness = new Date().getFullYear() - parseInt(vendor.memberSince)

  return (
    <div className="min-h-screen bg-background">
      {/* Cover Image */}
      <div className="h-48 md:h-64 bg-gradient-to-r from-primary via-primary to-accent relative">
        {vendor.coverImage && (
          <img
            src={vendor.coverImage}
            alt={vendor.name}
            className="w-full h-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-black/20" />
      </div>

      {/* Vendor Header */}
      <div className="container">
        <div className="relative -mt-16 md:-mt-20">
          <div className="bg-background rounded-2xl border-2 border-border shadow-xl p-6 md:p-8">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Logo */}
              <Avatar className="h-24 w-24 md:h-32 md:w-32 border-4 border-background shadow-lg flex-shrink-0">
                <AvatarImage src={vendor.logo} alt={vendor.name} />
                <AvatarFallback className="bg-primary text-primary-foreground text-3xl font-bold">
                  {vendor.name.charAt(0)}
                </AvatarFallback>
              </Avatar>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
                  <div>
                    <h1 className="text-2xl md:text-3xl font-bold mb-2">{vendor.name}</h1>

                    {/* Badges */}
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      {vendor.verified && (
                        <Badge className="bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border-0">
                          <Shield className="h-3.5 w-3.5 mr-1" />
                          Verified Supplier
                        </Badge>
                      )}
                      {vendor.goldSupplier && (
                        <Badge className="bg-gradient-to-r from-amber-400 to-yellow-500 text-amber-900 border-0 font-semibold">
                          <Award className="h-3.5 w-3.5 mr-1" />
                          Gold Supplier
                        </Badge>
                      )}
                    </div>

                    {/* Location & Rating */}
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-4 w-4" />
                        <span>{vendor.location}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-4 w-4" />
                        <span>{yearsInBusiness}+ years in business</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <StarRating rating={vendor.rating} size="sm" />
                        <span className="font-medium text-foreground">
                          {vendor.rating} ({vendor.reviewCount} reviews)
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 flex-shrink-0">
                    <Button variant="outline" asChild>
                      <Link href={`/chat?vendor=${vendor.slug}`}>
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Contact
                      </Link>
                    </Button>
                    <Button asChild>
                      <Link href="#products">
                        <Package className="h-4 w-4 mr-2" />
                        View Products
                      </Link>
                    </Button>
                  </div>
                </div>

                <p className="text-muted-foreground leading-relaxed">{vendor.description}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-6 mt-8 mb-12">
          {/* Left Sidebar - Company Info */}
          <div className="lg:col-span-1 space-y-6">
            {/* Quick Stats */}
            <Card className="p-5">
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Performance Metrics
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <span className="text-sm text-muted-foreground">Response Rate</span>
                  <span className="text-lg font-bold text-primary">{vendor.responseRate}%</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <span className="text-sm text-muted-foreground">Response Time</span>
                  <span className="text-sm font-bold">{vendor.responseTime}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <span className="text-sm text-muted-foreground">Total Products</span>
                  <span className="text-lg font-bold">{vendor.totalProducts}</span>
                </div>
              </div>
            </Card>

            {/* Trade Capacity */}
            <Card className="p-5">
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <Factory className="h-5 w-5 text-primary" />
                Trade Capacity
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Monthly Output</p>
                  <p className="font-semibold">{vendor.tradeCapacity.monthlyOutput}</p>
                </div>
                <Separator />
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Export Percentage</p>
                  <p className="font-semibold">{vendor.tradeCapacity.exportPercentage}</p>
                </div>
                <Separator />
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Employees</p>
                  <p className="font-semibold">{vendor.tradeCapacity.employees}</p>
                </div>
              </div>
            </Card>

            {/* Certifications */}
            <Card className="p-5">
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <Award className="h-5 w-5 text-primary" />
                Certifications
              </h3>
              <div className="flex flex-wrap gap-2">
                {vendor.certifications.map((cert: string, index: number) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    {cert}
                  </Badge>
                ))}
              </div>
            </Card>

            {/* Contact Information */}
            <Card className="p-5">
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <Phone className="h-5 w-5 text-primary" />
                Contact Information
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Phone</p>
                    <p className="font-medium">{vendor.contact.phone}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="font-medium break-all">{vendor.contact.email}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Globe className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Website</p>
                    <p className="font-medium">{vendor.contact.website}</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Trade Assurance */}
            <Card className="p-5 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-2 border-green-200 dark:border-green-800">
              <div className="flex items-start gap-3">
                <Shield className="h-6 w-6 text-green-600 dark:text-green-400 flex-shrink-0" />
                <div>
                  <h3 className="font-bold text-green-900 dark:text-green-100 mb-2">
                    Trade Assurance
                  </h3>
                  <p className="text-xs text-green-700 dark:text-green-300 leading-relaxed">
                    This supplier is protected by Vendora's buyer protection program, ensuring safe transactions from payment to delivery.
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Main Content - Products & Reviews */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="products" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="products">
                  Products ({vendor.totalProducts})
                </TabsTrigger>
                <TabsTrigger value="about">About</TabsTrigger>
                <TabsTrigger value="reviews">
                  Reviews ({vendor.reviewCount})
                </TabsTrigger>
              </TabsList>

              {/* Products Tab */}
              <TabsContent value="products" id="products" className="space-y-6">
                {/* Main Products */}
                <div>
                  <h3 className="font-bold mb-4">Main Product Categories</h3>
                  <div className="flex flex-wrap gap-2 mb-6">
                    {vendor.mainProducts.map((product: string, index: number) => (
                      <Badge key={index} variant="outline" className="text-sm py-1.5 px-3">
                        {product}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Product Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>

                {/* View More */}
                <div className="text-center pt-6">
                  <Button variant="outline" size="lg" asChild>
                    <Link href={`/products?vendor=${vendor.slug}`}>
                      View All Products
                    </Link>
                  </Button>
                </div>
              </TabsContent>

              {/* About Tab */}
              <TabsContent value="about" className="space-y-6">
                <Card className="p-6">
                  <h3 className="font-bold text-xl mb-4">Company Overview</h3>
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <p className="leading-relaxed">{vendor.description}</p>
                    <p className="mt-4 leading-relaxed">
                      Founded in {vendor.memberSince}, we have grown to become one of the leading manufacturers
                      in our industry. Our commitment to quality, innovation, and customer satisfaction has
                      earned us a reputation as a trusted B2B partner worldwide.
                    </p>
                  </div>

                  <Separator className="my-6" />

                  <h4 className="font-bold mb-4">Main Markets</h4>
                  <div className="flex flex-wrap gap-2">
                    {vendor.tradeCapacity.mainMarkets.map((market: string, index: number) => (
                      <Badge key={index} variant="secondary">
                        <Globe className="h-3 w-3 mr-1" />
                        {market}
                      </Badge>
                    ))}
                  </div>
                </Card>
              </TabsContent>

              {/* Reviews Tab */}
              <TabsContent value="reviews" className="space-y-6">
                <Card className="p-6">
                  <div className="text-center">
                    <div className="inline-flex flex-col items-center gap-2 mb-6">
                      <div className="text-5xl font-bold">{vendor.rating}</div>
                      <StarRating rating={vendor.rating} size="lg" />
                      <p className="text-sm text-muted-foreground">
                        Based on {vendor.reviewCount} reviews
                      </p>
                    </div>
                  </div>
                  <Separator className="my-6" />
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">
                      Detailed reviews will be displayed here
                    </p>
                  </div>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  )
}

function VendorProfileSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <Skeleton className="h-48 md:h-64 w-full" />
      <div className="container">
        <div className="relative -mt-16 md:-mt-20">
          <div className="bg-background rounded-2xl border-2 border-border shadow-xl p-6 md:p-8">
            <div className="flex flex-col md:flex-row gap-6">
              <Skeleton className="h-24 w-24 md:h-32 md:w-32 rounded-full" />
              <div className="flex-1 space-y-4">
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-20 w-full" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
