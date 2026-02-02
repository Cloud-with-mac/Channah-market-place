'use client'

import * as React from 'react'
import { Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Search, Sparkles, Loader2, Grid3x3, List, SlidersHorizontal, Shield } from 'lucide-react'
import { ProductGrid } from '@/components/product/product-grid'
import { SortDropdown, SortOption } from '@/components/product/sort-dropdown'
import { Pagination } from '@/components/product/pagination'
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator } from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { productsAPI, aiAPI } from '@/lib/api'

const ITEMS_PER_PAGE = 12

function SearchContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const query = searchParams.get('q') || ''
  const currentPage = parseInt(searchParams.get('page') || '1')
  const sortBy = (searchParams.get('sort') as SortOption) || 'popular'

  const [products, setProducts] = React.useState<any[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [totalProducts, setTotalProducts] = React.useState(0)
  const [suggestions, setSuggestions] = React.useState<string[]>([])
  const [aiSuggestion, setAiSuggestion] = React.useState<string | null>(null)
  const [viewMode, setViewMode] = React.useState<'grid' | 'list'>('grid')
  const [showFilters, setShowFilters] = React.useState(false)

  // Filter states
  const [priceRange, setPriceRange] = React.useState([0, 1000])
  const [moqRange, setMoqRange] = React.useState([1, 1000])
  const [verifiedOnly, setVerifiedOnly] = React.useState(false)
  const [goldSupplierOnly, setGoldSupplierOnly] = React.useState(false)
  const [selectedCategory, setSelectedCategory] = React.useState<string>('all')

  // Fetch search results
  React.useEffect(() => {
    if (!query) {
      setProducts([])
      setTotalProducts(0)
      setIsLoading(false)
      return
    }

    const fetchResults = async () => {
      setIsLoading(true)
      try {
        const params = {
          q: query,
          page: currentPage,
          limit: ITEMS_PER_PAGE,
          sort: sortBy,
        }

        const searchParams: Record<string, any> = { search: query, page: currentPage, limit: ITEMS_PER_PAGE, sort: sortBy }
        if (priceRange[0] > 0) searchParams.min_price = priceRange[0]
        if (priceRange[1] < 1000) searchParams.max_price = priceRange[1]
        if (moqRange[0] > 1) searchParams.min_moq = moqRange[0]
        if (moqRange[1] < 1000) searchParams.max_moq = moqRange[1]
        if (selectedCategory && selectedCategory !== 'all') searchParams.category = selectedCategory

        const [searchRes, aiSuggestionsRes] = await Promise.allSettled([
          productsAPI.getAll(searchParams),
          aiAPI.searchSuggestions(query),
        ])

        if (searchRes.status === 'fulfilled') {
          const transformedProducts = (
            searchRes.value.results || searchRes.value || []
          ).map((p: any) => ({
            id: p.id,
            name: p.name,
            slug: p.slug,
            price: parseFloat(p.price),
            compareAtPrice: p.compare_at_price
              ? parseFloat(p.compare_at_price)
              : undefined,
            image:
              p.primary_image ||
              p.images?.[0]?.url ||
              p.image ||
              'https://images.unsplash.com/photo-1560393464-5c69a73c5770?w=400&h=400&fit=crop',
            rating: p.rating || 4.0,
            reviewCount: p.review_count || 0,
            vendorName: p.vendor?.business_name || p.vendor_name || 'Channah Vendor',
          }))

          setProducts(transformedProducts)
          setTotalProducts(
            searchRes.value.count ||
              searchRes.value.length ||
              transformedProducts.length
          )
        } else {
          // No results from API
          setProducts([])
          setTotalProducts(0)
        }

        if (aiSuggestionsRes.status === 'fulfilled') {
          setAiSuggestion(aiSuggestionsRes.value.suggestion)
          setSuggestions(aiSuggestionsRes.value.related_queries || [])
        }
      } catch (error) {
        console.error('Search failed:', error)
        setProducts([])
        setTotalProducts(0)
      } finally {
        setIsLoading(false)
      }
    }

    fetchResults()
  }, [query, currentPage, sortBy, priceRange, moqRange, selectedCategory])

  const updateURL = React.useCallback(
    (newSort: SortOption, newPage: number) => {
      const params = new URLSearchParams()
      params.set('q', query)
      if (newPage > 1) params.set('page', newPage.toString())
      if (newSort !== 'popular') params.set('sort', newSort)
      router.push(`/search?${params.toString()}`, { scroll: false })
    },
    [router, query]
  )

  const handleSortChange = (newSort: SortOption) => {
    updateURL(newSort, 1)
  }

  const handlePageChange = (page: number) => {
    updateURL(sortBy, page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSuggestionClick = (suggestion: string) => {
    router.push(`/search?q=${encodeURIComponent(suggestion)}`)
  }

  const totalPages = Math.ceil(totalProducts / ITEMS_PER_PAGE)

  // Empty state for no query
  if (!query) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="mb-6 rounded-full bg-muted p-6">
            <Search className="h-12 w-12 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Search for Products</h1>
          <p className="text-muted-foreground max-w-md">
            Enter a search term in the search bar above to find products from our marketplace.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <Breadcrumb className="mb-6">
        <BreadcrumbItem>
          <BreadcrumbLink href="/">Home</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink href="/search" active>
            Search Results
          </BreadcrumbLink>
        </BreadcrumbItem>
      </Breadcrumb>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-display mb-2">
          Search Results for &ldquo;{query}&rdquo;
        </h1>
        <p className="text-muted-foreground">
          {totalProducts} {totalProducts === 1 ? 'product' : 'products'} found
        </p>
      </div>

      {/* AI Suggestion */}
      {aiSuggestion && (
        <div className="mb-6 p-4 rounded-lg bg-primary/5 border border-primary/20">
          <div className="flex items-start gap-3">
            <Sparkles className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <p className="font-medium text-sm mb-1">AI Suggestion</p>
              <p className="text-sm text-muted-foreground">{aiSuggestion}</p>
            </div>
          </div>
        </div>
      )}

      {/* Related Searches */}
      {suggestions.length > 0 && (
        <div className="mb-6">
          <p className="text-sm text-muted-foreground mb-2">Related searches:</p>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((suggestion) => (
              <Button
                key={suggestion}
                variant="outline"
                size="sm"
                onClick={() => handleSuggestionClick(suggestion)}
                className="text-xs"
              >
                {suggestion}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Main Content with Filters */}
      <div className="flex gap-6">
        {/* Left Sidebar - Advanced Filters */}
        <aside className="hidden lg:block w-72 flex-shrink-0">
          <div className="sticky top-20">
            <Card className="border-2 overflow-hidden">
              {/* Filter Header */}
              <div className="bg-primary/5 px-5 py-4 border-b border-border">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="h-5 w-5 text-primary" />
                  <h2 className="font-bold text-base">Advanced Filters</h2>
                </div>
              </div>

              {/* Filter Content */}
              <div className="p-5 space-y-6 max-h-[calc(100vh-12rem)] overflow-y-auto">
                {/* Price Range */}
                <div className="space-y-3">
                  <Label className="text-sm font-semibold">Price Range</Label>
                  <div className="space-y-3">
                    <Slider
                      value={priceRange}
                      onValueChange={setPriceRange}
                      max={1000}
                      step={10}
                      className="w-full"
                    />
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">${priceRange[0]}</span>
                      <span className="text-muted-foreground">${priceRange[1]}</span>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* MOQ Range - B2B Feature */}
                <div className="space-y-3">
                  <Label className="text-sm font-semibold">Min. Order Quantity</Label>
                  <div className="space-y-3">
                    <Slider
                      value={moqRange}
                      onValueChange={setMoqRange}
                      max={1000}
                      step={10}
                      className="w-full"
                    />
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{moqRange[0]} units</span>
                      <span className="text-muted-foreground">{moqRange[1]} units</span>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Category Filter */}
                <div className="space-y-3">
                  <Label className="text-sm font-semibold">Category</Label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="electronics">Electronics</SelectItem>
                      <SelectItem value="fashion">Fashion & Apparel</SelectItem>
                      <SelectItem value="home">Home & Garden</SelectItem>
                      <SelectItem value="sports">Sports & Outdoors</SelectItem>
                      <SelectItem value="beauty">Beauty & Health</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                {/* Supplier Type - B2B Feature */}
                <div className="space-y-3">
                  <Label className="text-sm font-semibold">Supplier Type</Label>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="verified"
                        checked={verifiedOnly}
                        onCheckedChange={(checked) => setVerifiedOnly(checked as boolean)}
                      />
                      <label
                        htmlFor="verified"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2"
                      >
                        <Shield className="h-4 w-4 text-blue-600" />
                        Verified Suppliers Only
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="gold"
                        checked={goldSupplierOnly}
                        onCheckedChange={(checked) => setGoldSupplierOnly(checked as boolean)}
                      />
                      <label
                        htmlFor="gold"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2"
                      >
                        <Badge className="bg-gradient-to-r from-amber-400 to-yellow-500 text-amber-900 border-0 h-5 px-2">
                          Gold
                        </Badge>
                        Gold Suppliers Only
                      </label>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Clear Filters */}
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setPriceRange([0, 1000])
                    setMoqRange([1, 1000])
                    setVerifiedOnly(false)
                    setGoldSupplierOnly(false)
                    setSelectedCategory('all')
                  }}
                >
                  Clear All Filters
                </Button>
              </div>
            </Card>
          </div>
        </aside>

        {/* Right Content - Results */}
        <div className="flex-1 min-w-0">
          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 pb-4 border-b">
            <div className="flex items-center gap-3">
              <p className="text-sm text-muted-foreground">
                Showing{' '}
                <span className="font-medium text-foreground">
                  {Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, totalProducts)}-
                  {Math.min(currentPage * ITEMS_PER_PAGE, totalProducts)}
                </span>{' '}
                of <span className="font-medium text-foreground">{totalProducts}</span> results
              </p>

              {/* Mobile Filter Toggle */}
              <Button
                variant="outline"
                size="sm"
                className="lg:hidden"
                onClick={() => setShowFilters(!showFilters)}
              >
                <SlidersHorizontal className="h-4 w-4 mr-2" />
                Filters
              </Button>
            </div>

            <div className="flex items-center gap-3">
              {/* View Toggle */}
              <div className="flex items-center rounded-lg border border-border p-1">
                <Button
                  variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                  size="sm"
                  className="h-8 px-3"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid3x3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                  size="sm"
                  className="h-8 px-3"
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>

              {/* Sort Dropdown */}
              <SortDropdown value={sortBy} onChange={handleSortChange} />
            </div>
          </div>

          {/* Results */}
          {products.length > 0 ? (
            <>
              <ProductGrid products={products} isLoading={isLoading} columns={viewMode === 'grid' ? 3 : 2} />
              {totalPages > 1 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                  className="mt-8"
                />
              )}
            </>
          ) : (
            !isLoading && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="mb-4 rounded-full bg-muted p-4">
                  <Search className="h-8 w-8 text-muted-foreground" />
                </div>
                <h2 className="text-lg font-semibold mb-1">No products found</h2>
                <p className="text-muted-foreground max-w-md mb-6">
                  We couldn&apos;t find any products matching &ldquo;{query}&rdquo;. Try different
                  keywords or browse our categories.
                </p>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => router.push('/products')}>
                    Browse All Products
                  </Button>
                  <Button onClick={() => router.push('/')}>Go to Homepage</Button>
                </div>
              </div>
            )
          )}

          {isLoading && products.length === 0 && (
            <ProductGrid products={[]} isLoading={true} columns={viewMode === 'grid' ? 3 : 2} />
          )}
        </div>
      </div>
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-16">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    }>
      <SearchContent />
    </Suspense>
  )
}
