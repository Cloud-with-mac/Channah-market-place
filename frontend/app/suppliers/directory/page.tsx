'use client'

import React, { useState, useMemo, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  Search,
  MapPin,
  Star,
  Package,
  Clock,
  Zap,
  Heart,
  Grid3X3,
  List,
  ChevronDown,
  Filter,
  X,
  Briefcase,
  Award,
  TrendingUp,
  Globe,
  Users,
  CheckCircle,
  AlertCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import {
  useSupplierDirectoryStore,
  type SupplierProfile,
  type SupplierFilters,
} from '@/store'
import { cn } from '@/lib/utils'

// Suppliers - populated from API
const mockSuppliers: SupplierProfile[] = []

type SortOption = 'rating' | 'newest' | 'reviews' | 'moq-low' | 'moq-high'

const INDUSTRIES = [
  'Electronics Manufacturing',
  'Textiles Manufacturing',
  'Machinery & Parts Manufacturing',
  'Chemical Manufacturing',
  'Food & Beverage',
  'Packaging',
  'Plastics & Polymers',
]

const CERTIFICATIONS = [
  'ISO 9001:2015',
  'ISO 14001:2015',
  'ISO 45001:2018',
  'ISO/TS 16949:2016',
  'GOTS',
  'Fair Trade',
  'IEC 61000-4-2',
]

const COUNTRIES = [
  'Germany',
  'India',
  'China',
  'Vietnam',
  'Thailand',
  'United States',
  'United Kingdom',
  'Italy',
]

const COMPANY_SIZES = [
  { value: 'small', label: 'Small (1-50 employees)' },
  { value: 'medium', label: 'Medium (51-500 employees)' },
  { value: 'large', label: 'Large (500-1000 employees)' },
  { value: 'enterprise', label: 'Enterprise (1000+ employees)' },
]

interface SupplierCardProps {
  supplier: SupplierProfile
  isFavorite: boolean
  onFavoriteToggle: (id: string) => void
}

function SupplierCard({ supplier, isFavorite, onFavoriteToggle }: SupplierCardProps) {
  return (
    <Card className="overflow-hidden group hover:shadow-lg transition-shadow">
      {/* Banner */}
      <div className="relative h-32 bg-gradient-to-r from-primary/20 to-primary/10 overflow-hidden">
        {supplier.banner && (
          <Image
            src={supplier.banner}
            alt={supplier.businessName}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        )}
        <button
          onClick={() => onFavoriteToggle(supplier.id)}
          className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md hover:shadow-lg transition-shadow"
        >
          <Heart
            className={cn(
              'h-5 w-5 transition-colors',
              isFavorite ? 'fill-red-500 text-red-500' : 'text-muted-foreground'
            )}
          />
        </button>
      </div>

      <CardContent className="p-4 space-y-4">
        {/* Logo & Name */}
        <div className="flex items-start gap-3 -mt-10 relative">
          <div className="relative h-16 w-16 rounded-full border-4 border-background bg-muted overflow-hidden flex-shrink-0">
            {supplier.logo ? (
              <Image
                src={supplier.logo}
                alt={supplier.businessName}
                fill
                className="object-cover"
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center">
                <Briefcase className="h-6 w-6 text-muted-foreground" />
              </div>
            )}
          </div>
          <div className="pt-4 flex-1">
            <Link href={`/suppliers/directory/${supplier.slug}`}>
              <h3 className="font-semibold line-clamp-2 group-hover:text-primary transition-colors cursor-pointer">
                {supplier.businessName}
              </h3>
            </Link>
            {supplier.verified && (
              <div className="flex items-center gap-1 mt-1">
                <CheckCircle className="h-3.5 w-3.5 text-green-600" />
                <span className="text-xs text-green-600 font-medium">Verified Supplier</span>
              </div>
            )}
          </div>
        </div>

        {/* Location */}
        {supplier.country && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span>
              {[supplier.city, supplier.state, supplier.country]
                .filter(Boolean)
                .join(', ')}
            </span>
          </div>
        )}

        {/* Description */}
        <p className="text-sm text-muted-foreground line-clamp-2">
          {supplier.description}
        </p>

        {/* Industry & Category */}
        <div className="flex flex-wrap gap-1">
          <Badge variant="secondary" className="text-xs">
            {supplier.industry}
          </Badge>
          {supplier.subIndustries.slice(0, 1).map((sub) => (
            <Badge key={sub} variant="outline" className="text-xs">
              {sub}
            </Badge>
          ))}
          {supplier.subIndustries.length > 1 && (
            <Badge variant="outline" className="text-xs">
              +{supplier.subIndustries.length - 1} more
            </Badge>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 pt-2 border-t">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
              <span className="font-semibold text-sm">{supplier.rating.toFixed(1)}</span>
            </div>
            <span className="text-xs text-muted-foreground">
              ({supplier.reviewCount})
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs font-medium">{supplier.totalProducts} products</span>
          </div>
        </div>

        {/* B2B Metrics */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-1 p-1.5 bg-muted rounded">
            <Clock className="h-3 w-3" />
            <span className="truncate">{supplier.leadTime}</span>
          </div>
          <div className="flex items-center gap-1 p-1.5 bg-muted rounded">
            <Package className="h-3 w-3" />
            <span className="truncate">MOQ: {supplier.moq}</span>
          </div>
        </div>

        {/* Certifications */}
        {supplier.certifications.length > 0 && (
          <div className="flex items-center gap-1 pt-1">
            <Award className="h-4 w-4 text-blue-600" />
            <span className="text-xs text-muted-foreground">
              {supplier.certifications.length} certifications
            </span>
          </div>
        )}

        {/* CTA */}
        <Link href={`/suppliers/directory/${supplier.slug}`}>
          <Button className="w-full" variant="outline" size="sm">
            View Profile
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}

interface SupplierListItemProps {
  supplier: SupplierProfile
  isFavorite: boolean
  onFavoriteToggle: (id: string) => void
}

function SupplierListItem({ supplier, isFavorite, onFavoriteToggle }: SupplierListItemProps) {
  return (
    <Card className="overflow-hidden group hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex gap-4">
          {/* Logo */}
          <div className="relative h-20 w-20 rounded-lg bg-muted flex-shrink-0 overflow-hidden">
            {supplier.logo ? (
              <Image
                src={supplier.logo}
                alt={supplier.businessName}
                fill
                className="object-cover"
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center">
                <Briefcase className="h-6 w-6 text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1">
            <div className="flex items-start justify-between mb-2">
              <div>
                <Link href={`/suppliers/directory/${supplier.slug}`}>
                  <h3 className="font-semibold hover:text-primary transition-colors cursor-pointer">
                    {supplier.businessName}
                  </h3>
                </Link>
                <div className="flex items-center gap-2 mt-1">
                  {supplier.verified && (
                    <div className="flex items-center gap-1">
                      <CheckCircle className="h-3.5 w-3.5 text-green-600" />
                      <span className="text-xs text-green-600 font-medium">Verified</span>
                    </div>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {supplier.companySize.charAt(0).toUpperCase() +
                      supplier.companySize.slice(1)}{' '}
                    • {supplier.employeeCount}
                  </span>
                </div>
              </div>
              <button
                onClick={() => onFavoriteToggle(supplier.id)}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
              >
                <Heart
                  className={cn(
                    'h-5 w-5 transition-colors',
                    isFavorite ? 'fill-red-500 text-red-500' : 'text-muted-foreground'
                  )}
                />
              </button>
            </div>

            <p className="text-sm text-muted-foreground line-clamp-1 mb-2">
              {supplier.description}
            </p>

            {/* Quick Stats */}
            <div className="flex flex-wrap items-center gap-4 text-sm mb-3">
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                <span className="font-medium">{supplier.rating.toFixed(1)}</span>
                <span className="text-muted-foreground">({supplier.reviewCount})</span>
              </div>
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">
                  {[supplier.city, supplier.country].filter(Boolean).join(', ')}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">{supplier.leadTime}</span>
              </div>
              <div className="flex items-center gap-1">
                <Package className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">MOQ: {supplier.moq}</span>
              </div>
            </div>

            {/* Industries & Certifications */}
            <div className="flex flex-wrap gap-2 items-center">
              <Badge variant="secondary" className="text-xs">
                {supplier.industry}
              </Badge>
              {supplier.certifications.slice(0, 2).map((cert) => (
                <Badge key={cert} variant="outline" className="text-xs">
                  {cert.split(':')[0]}
                </Badge>
              ))}
              {supplier.certifications.length > 2 && (
                <Badge variant="outline" className="text-xs">
                  +{supplier.certifications.length - 2}
                </Badge>
              )}
              <Link href={`/suppliers/directory/${supplier.slug}`}>
                <Button variant="ghost" size="sm" className="ml-auto">
                  View Profile
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function AdvancedFilters({
  filters,
  onFiltersChange,
  isOpen,
  onOpenChange,
}: {
  filters: SupplierFilters
  onFiltersChange: (filters: SupplierFilters) => void
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [localFilters, setLocalFilters] = React.useState<SupplierFilters>(filters)

  const handleApplyFilters = () => {
    onFiltersChange(localFilters)
    onOpenChange(false)
  }

  const handleResetFilters = () => {
    const defaultFilters: SupplierFilters = {}
    setLocalFilters(defaultFilters)
    onFiltersChange(defaultFilters)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Advanced Filters</DialogTitle>
          <DialogDescription>
            Refine your supplier search with advanced filtering options
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="business">Business</TabsTrigger>
            <TabsTrigger value="compliance">Compliance</TabsTrigger>
          </TabsList>

          {/* General Tab */}
          <TabsContent value="general" className="space-y-6 mt-4">
            {/* Industry */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Industry</Label>
              <div className="grid grid-cols-2 gap-3">
                {INDUSTRIES.map((industry) => (
                  <div key={industry} className="flex items-center space-x-2">
                    <Checkbox
                      id={`industry-${industry}`}
                      checked={localFilters.industries?.includes(industry) ?? false}
                      onCheckedChange={(checked) => {
                        setLocalFilters((prev) => ({
                          ...prev,
                          industries: checked
                            ? [...(prev.industries ?? []), industry]
                            : prev.industries?.filter((i) => i !== industry),
                        }))
                      }}
                    />
                    <Label htmlFor={`industry-${industry}`} className="font-normal cursor-pointer">
                      {industry}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Country */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Country</Label>
              <div className="grid grid-cols-2 gap-3">
                {COUNTRIES.map((country) => (
                  <div key={country} className="flex items-center space-x-2">
                    <Checkbox
                      id={`country-${country}`}
                      checked={localFilters.countries?.includes(country) ?? false}
                      onCheckedChange={(checked) => {
                        setLocalFilters((prev) => ({
                          ...prev,
                          countries: checked
                            ? [...(prev.countries ?? []), country]
                            : prev.countries?.filter((c) => c !== country),
                        }))
                      }}
                    />
                    <Label htmlFor={`country-${country}`} className="font-normal cursor-pointer">
                      {country}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Minimum Rating */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Minimum Rating</Label>
              <div className="flex items-center gap-4">
                <Slider
                  defaultValue={[localFilters.minRating ?? 0]}
                  max={5}
                  step={0.5}
                  onValueChange={(value) => {
                    setLocalFilters((prev) => ({
                      ...prev,
                      minRating: value[0],
                    }))
                  }}
                  className="flex-1"
                />
                <span className="font-semibold min-w-12 text-right">
                  {(localFilters.minRating ?? 0).toFixed(1)} +
                </span>
              </div>
            </div>
          </TabsContent>

          {/* Business Tab */}
          <TabsContent value="business" className="space-y-6 mt-4">
            {/* Company Size */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Company Size</Label>
              <div className="space-y-2">
                {COMPANY_SIZES.map(({ value, label }) => (
                  <div key={value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`size-${value}`}
                      checked={
                        localFilters.companySize?.includes(
                          value as 'small' | 'medium' | 'large' | 'enterprise'
                        ) ?? false
                      }
                      onCheckedChange={(checked) => {
                        setLocalFilters((prev) => ({
                          ...prev,
                          companySize: checked
                            ? [
                                ...(prev.companySize ?? []),
                                value as 'small' | 'medium' | 'large' | 'enterprise',
                              ]
                            : prev.companySize?.filter(
                                (s) => s !== (value as 'small' | 'medium' | 'large' | 'enterprise')
                              ),
                        }))
                      }}
                    />
                    <Label htmlFor={`size-${value}`} className="font-normal cursor-pointer">
                      {label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* MOQ Range */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Minimum Order Quantity</Label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="min-moq" className="text-sm text-muted-foreground">
                    Min MOQ
                  </Label>
                  <Input
                    id="min-moq"
                    type="number"
                    placeholder="Minimum"
                    value={localFilters.minMOQ ?? ''}
                    onChange={(e) => {
                      setLocalFilters((prev) => ({
                        ...prev,
                        minMOQ: e.target.value ? parseInt(e.target.value) : undefined,
                      }))
                    }}
                  />
                </div>
                <div>
                  <Label htmlFor="max-moq" className="text-sm text-muted-foreground">
                    Max MOQ
                  </Label>
                  <Input
                    id="max-moq"
                    type="number"
                    placeholder="Maximum"
                    value={localFilters.maxMOQ ?? ''}
                    onChange={(e) => {
                      setLocalFilters((prev) => ({
                        ...prev,
                        maxMOQ: e.target.value ? parseInt(e.target.value) : undefined,
                      }))
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Lead Time */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Lead Time (Days)</Label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="min-lead" className="text-sm text-muted-foreground">
                    Min Days
                  </Label>
                  <Input
                    id="min-lead"
                    type="number"
                    placeholder="Minimum"
                    value={localFilters.minLeadDays ?? ''}
                    onChange={(e) => {
                      setLocalFilters((prev) => ({
                        ...prev,
                        minLeadDays: e.target.value ? parseInt(e.target.value) : undefined,
                      }))
                    }}
                  />
                </div>
                <div>
                  <Label htmlFor="max-lead" className="text-sm text-muted-foreground">
                    Max Days
                  </Label>
                  <Input
                    id="max-lead"
                    type="number"
                    placeholder="Maximum"
                    value={localFilters.maxLeadDays ?? ''}
                    onChange={(e) => {
                      setLocalFilters((prev) => ({
                        ...prev,
                        maxLeadDays: e.target.value ? parseInt(e.target.value) : undefined,
                      }))
                    }}
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Compliance Tab */}
          <TabsContent value="compliance" className="space-y-6 mt-4">
            {/* Certifications */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Certifications</Label>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {CERTIFICATIONS.map((cert) => (
                  <div key={cert} className="flex items-center space-x-2">
                    <Checkbox
                      id={`cert-${cert}`}
                      checked={localFilters.certifications?.includes(cert) ?? false}
                      onCheckedChange={(checked) => {
                        setLocalFilters((prev) => ({
                          ...prev,
                          certifications: checked
                            ? [...(prev.certifications ?? []), cert]
                            : prev.certifications?.filter((c) => c !== cert),
                        }))
                      }}
                    />
                    <Label htmlFor={`cert-${cert}`} className="font-normal cursor-pointer">
                      {cert}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Verified Only */}
            <div className="flex items-center space-x-2 p-4 bg-muted rounded-lg">
              <Checkbox
                id="verified-only"
                checked={localFilters.verified ?? false}
                onCheckedChange={(checked) => {
                  setLocalFilters((prev) => ({
                    ...prev,
                    verified: checked ? true : undefined,
                  }))
                }}
              />
              <Label htmlFor="verified-only" className="font-normal cursor-pointer flex-1">
                Only show verified suppliers
              </Label>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </div>

            {/* Has Gallery */}
            <div className="flex items-center space-x-2 p-4 bg-muted rounded-lg">
              <Checkbox
                id="has-gallery"
                checked={localFilters.hasGallery ?? false}
                onCheckedChange={(checked) => {
                  setLocalFilters((prev) => ({
                    ...prev,
                    hasGallery: checked ? true : undefined,
                  }))
                }}
              />
              <Label htmlFor="has-gallery" className="font-normal cursor-pointer flex-1">
                Suppliers with gallery images
              </Label>
            </div>
          </TabsContent>
        </Tabs>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 border-t">
          <Button
            variant="outline"
            onClick={handleResetFilters}
            className="flex-1"
          >
            Reset Filters
          </Button>
          <Button
            onClick={handleApplyFilters}
            className="flex-1"
          >
            Apply Filters
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default function SupplierDirectoryPage() {
  const store = useSupplierDirectoryStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<SortOption>('rating')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [isFiltersOpen, setIsFiltersOpen] = useState(false)
  const [filters, setFilters] = useState<SupplierFilters>({})
  const [isLoading, setIsLoading] = useState(false)

  // Initialize suppliers from mock data
  React.useEffect(() => {
    const existingSuppliers = store.getAllSuppliers()
    if (existingSuppliers.length === 0) {
      setIsLoading(true)
      mockSuppliers.forEach((supplier) => {
        store.addSupplier({
          businessName: supplier.businessName,
          slug: supplier.slug,
          description: supplier.description,
          logo: supplier.logo,
          banner: supplier.banner,
          rating: supplier.rating,
          reviewCount: supplier.reviewCount,
          country: supplier.country,
          state: supplier.state,
          city: supplier.city,
          address: supplier.address,
          industry: supplier.industry,
          subIndustries: supplier.subIndustries,
          yearEstablished: supplier.yearEstablished,
          employeeCount: supplier.employeeCount,
          companySize: supplier.companySize,
          moq: supplier.moq,
          productCategories: supplier.productCategories,
          leadTime: supplier.leadTime,
          paymentTerms: supplier.paymentTerms,
          priceRange: supplier.priceRange,
          certifications: supplier.certifications,
          verified: supplier.verified,
          verifiedAt: supplier.verifiedAt,
          complianceRatings: supplier.complianceRatings,
          totalProducts: supplier.totalProducts,
          totalOrders: supplier.totalOrders,
          responseTime: supplier.responseTime,
          cancellationRate: supplier.cancellationRate,
          returnRate: supplier.returnRate,
          contactEmail: supplier.contactEmail,
          contactPhone: supplier.contactPhone,
          website: supplier.website,
          socialLinks: supplier.socialLinks,
          galleryImages: supplier.galleryImages,
          languages: supplier.languages,
          acceptedCurrencies: supplier.acceptedCurrencies,
          shipmentsPerMonth: supplier.shipmentsPerMonth,
          minimumOrderValue: supplier.minimumOrderValue,
        })
      })
      setIsLoading(false)
    }
  }, [])

  // Search and filter suppliers
  const filteredSuppliers = useMemo(() => {
    let results = store.searchSuppliers(searchQuery, filters)

    // Sort
    switch (sortBy) {
      case 'rating':
        results.sort((a, b) => b.rating - a.rating)
        break
      case 'reviews':
        results.sort((a, b) => b.reviewCount - a.reviewCount)
        break
      case 'moq-low':
        results.sort((a, b) => a.moq - b.moq)
        break
      case 'moq-high':
        results.sort((a, b) => b.moq - a.moq)
        break
      case 'newest':
      default:
        results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        break
    }

    return results
  }, [searchQuery, sortBy, filters])

  const handleFiltersChange = useCallback((newFilters: SupplierFilters) => {
    setFilters(newFilters)
    store.addSearchHistory(searchQuery, newFilters)
  }, [searchQuery])

  const toggleFavorite = useCallback((supplierId: string) => {
    if (store.isFavorite(supplierId)) {
      store.removeFromFavorites(supplierId)
    } else {
      store.addToFavorites(supplierId)
    }
  }, [])

  const activeFilterCount = Object.values(filters).filter(Boolean).length

  return (
    <div className="container py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Supplier Directory</h1>
        <p className="text-muted-foreground max-w-2xl">
          Discover and connect with verified B2B suppliers worldwide. Find suppliers that match
          your business needs with advanced filtering and detailed profiles.
        </p>
      </div>

      {/* Search & Controls */}
      <div className="space-y-4 mb-8">
        {/* Search Bar */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search suppliers, industries, products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Filters & View Controls */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Filter Button */}
          <Button variant="outline" className="gap-2" onClick={() => setIsFiltersOpen(true)}>
            <Filter className="h-4 w-4" />
            Advanced Filters
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-1">
                {activeFilterCount}
              </Badge>
            )}
          </Button>

          {/* Sort Dropdown */}
          <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="rating">Highest Rated</SelectItem>
              <SelectItem value="reviews">Most Reviews</SelectItem>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="moq-low">Low MOQ First</SelectItem>
              <SelectItem value="moq-high">High MOQ First</SelectItem>
            </SelectContent>
          </Select>

          {/* View Mode */}
          <div className="flex items-center gap-1 bg-muted p-1 rounded-lg">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="gap-2"
            >
              <Grid3X3 className="h-4 w-4" />
              <span className="hidden sm:inline">Grid</span>
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="gap-2"
            >
              <List className="h-4 w-4" />
              <span className="hidden sm:inline">List</span>
            </Button>
          </div>
        </div>

        {/* Active Filters */}
        {activeFilterCount > 0 && (
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-sm text-muted-foreground">Active filters:</span>
            {filters.industries?.map((ind) => (
              <Badge key={ind} variant="secondary" className="gap-1">
                {ind}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => {
                    const newFilters = {
                      ...filters,
                      industries: filters.industries?.filter((i) => i !== ind),
                    }
                    handleFiltersChange(newFilters)
                  }}
                />
              </Badge>
            ))}
            {filters.countries?.map((country) => (
              <Badge key={country} variant="secondary" className="gap-1">
                {country}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => {
                    const newFilters = {
                      ...filters,
                      countries: filters.countries?.filter((c) => c !== country),
                    }
                    handleFiltersChange(newFilters)
                  }}
                />
              </Badge>
            ))}
            {filters.minRating && (
              <Badge variant="secondary" className="gap-1">
                Rating {filters.minRating}+
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => {
                    const newFilters = { ...filters, minRating: undefined }
                    handleFiltersChange(newFilters)
                  }}
                />
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Results Info */}
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-muted-foreground">
          Showing <span className="font-semibold text-foreground">{filteredSuppliers.length}</span>{' '}
          suppliers
        </p>
      </div>

      {/* Suppliers */}
      {isLoading ? (
        <div className={cn(
          'gap-6',
          viewMode === 'grid'
            ? 'grid md:grid-cols-2 lg:grid-cols-3'
            : 'space-y-4'
        )}>
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <Skeleton className="h-32 w-full" />
              <CardContent className="p-4 space-y-3">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-9 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredSuppliers.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No suppliers found</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              {searchQuery || activeFilterCount > 0
                ? 'Try adjusting your search or filters to find suppliers.'
                : 'Browse our complete supplier directory or use filters to find specific suppliers.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div
          className={cn(
            viewMode === 'grid'
              ? 'grid gap-6 md:grid-cols-2 lg:grid-cols-3'
              : 'space-y-4'
          )}
        >
          {filteredSuppliers.map((supplier) => (
            <div key={supplier.id}>
              {viewMode === 'grid' ? (
                <SupplierCard
                  supplier={supplier}
                  isFavorite={store.isFavorite(supplier.id)}
                  onFavoriteToggle={toggleFavorite}
                />
              ) : (
                <SupplierListItem
                  supplier={supplier}
                  isFavorite={store.isFavorite(supplier.id)}
                  onFavoriteToggle={toggleFavorite}
                />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Advanced Filters Dialog */}
      <AdvancedFilters
        filters={filters}
        onFiltersChange={handleFiltersChange}
        isOpen={isFiltersOpen}
        onOpenChange={setIsFiltersOpen}
      />

      {/* Resources Section */}
      <div className="mt-16 grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Top Rated Suppliers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Browse our highest-rated suppliers with excellent compliance scores and delivery
              records.
            </p>
            <Button variant="outline" size="sm" className="w-full">
              View Top Suppliers
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Certifications Guide
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Learn about supplier certifications and compliance standards that matter for your business.
            </p>
            <Button variant="outline" size="sm" className="w-full">
              Learn More
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              RFQ Tool
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Send requests for quotations to multiple suppliers and compare offers instantly.
            </p>
            <Link href="/rfq">
              <Button variant="outline" size="sm" className="w-full">
                Start RFQ
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
