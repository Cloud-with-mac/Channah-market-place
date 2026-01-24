'use client'

import * as React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Search, Store, Star, Package, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { vendorsAPI } from '@/lib/api'

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
  verified: boolean
}

export default function VendorsPage() {
  const [vendors, setVendors] = React.useState<Vendor[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [searchQuery, setSearchQuery] = React.useState('')
  const [sortBy, setSortBy] = React.useState('rating')

  React.useEffect(() => {
    const fetchVendors = async () => {
      try {
        const response = await vendorsAPI.getAll({ status: 'approved' })
        // Handle paginated response
        const data = response.data
        const vendorsList = Array.isArray(data) ? data : (data.results || [])
        setVendors(vendorsList)
      } catch (error) {
        console.error('Failed to fetch vendors:', error)
        setVendors([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchVendors()
  }, [])

  const filteredVendors = React.useMemo(() => {
    let result = vendors.filter(vendor =>
      vendor.business_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vendor.description?.toLowerCase().includes(searchQuery.toLowerCase())
    )

    // Sort
    switch (sortBy) {
      case 'rating':
        result.sort((a, b) => b.rating - a.rating)
        break
      case 'products':
        result.sort((a, b) => b.total_products - a.total_products)
        break
      case 'sales':
        result.sort((a, b) => b.total_sales - a.total_sales)
        break
      case 'name':
        result.sort((a, b) => a.business_name.localeCompare(b.business_name))
        break
    }

    return result
  }, [vendors, searchQuery, sortBy])

  return (
    <div className="container py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold font-display mb-2">Our Vendors</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Discover trusted sellers offering quality products. Shop from verified vendors with excellent ratings.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search vendors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="rating">Highest Rated</SelectItem>
            <SelectItem value="products">Most Products</SelectItem>
            <SelectItem value="sales">Best Sellers</SelectItem>
            <SelectItem value="name">A-Z</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Vendor Grid */}
      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <Skeleton className="h-32 w-full" />
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-32 mb-1" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-9 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredVendors.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Store className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-semibold">No vendors found</h3>
            <p className="mt-2 text-muted-foreground">
              {searchQuery
                ? 'Try adjusting your search.'
                : 'Check back soon for new vendors!'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredVendors.map((vendor) => (
            <Card key={vendor.id} className="overflow-hidden group">
              <Link href={`/vendor/${vendor.slug}`}>
                {/* Banner */}
                <div className="relative h-32 bg-gradient-to-r from-primary/20 to-primary/10">
                  {vendor.banner && (
                    <Image
                      src={vendor.banner}
                      alt={vendor.business_name}
                      fill
                      className="object-cover"
                    />
                  )}
                </div>

                <CardContent className="p-4 space-y-4">
                  {/* Logo & Name */}
                  <div className="flex items-center gap-3 -mt-10 relative">
                    <div className="relative h-16 w-16 rounded-full border-4 border-background bg-muted overflow-hidden flex-shrink-0">
                      {vendor.logo ? (
                        <Image
                          src={vendor.logo}
                          alt={vendor.business_name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center">
                          <Store className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="pt-6">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold line-clamp-1 group-hover:text-primary transition-colors">
                          {vendor.business_name}
                        </h3>
                        {vendor.verified && (
                          <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-xs">
                            Verified
                          </Badge>
                        )}
                      </div>
                      {(vendor.city || vendor.country) && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {[vendor.city, vendor.state, vendor.country].filter(Boolean).join(', ')}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  {vendor.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {vendor.description}
                    </p>
                  )}

                  {/* Stats */}
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                      <span className="font-medium">{vendor.rating?.toFixed(1) || '0.0'}</span>
                      <span className="text-muted-foreground">
                        ({vendor.review_count || 0})
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Package className="h-4 w-4" />
                      <span>{vendor.total_products || 0} products</span>
                    </div>
                  </div>

                  {/* CTA */}
                  <Button className="w-full" variant="outline">
                    Visit Store
                  </Button>
                </CardContent>
              </Link>
            </Card>
          ))}
        </div>
      )}

      {/* Become a Vendor CTA */}
      <Card className="mt-12 bg-gradient-to-r from-primary/10 to-primary/5">
        <CardContent className="py-8 text-center">
          <Store className="mx-auto h-12 w-12 text-primary mb-4" />
          <h3 className="text-xl font-semibold mb-2">Become a Vendor</h3>
          <p className="text-muted-foreground max-w-md mx-auto mb-4">
            Start selling your products to thousands of customers. Join our marketplace today!
          </p>
          <Button asChild>
            <Link href="/sell">Start Selling</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
