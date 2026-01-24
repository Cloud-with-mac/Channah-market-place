'use client'

import * as React from 'react'
import { Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Search, Sparkles, Loader2 } from 'lucide-react'
import { ProductGrid } from '@/components/product/product-grid'
import { SortDropdown, SortOption } from '@/components/product/sort-dropdown'
import { Pagination } from '@/components/product/pagination'
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator } from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
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

        const [searchRes, aiSuggestionsRes] = await Promise.allSettled([
          productsAPI.getAll({ search: query, page: currentPage, limit: ITEMS_PER_PAGE }),
          aiAPI.getSearchSuggestions(query),
        ])

        if (searchRes.status === 'fulfilled') {
          const transformedProducts = (
            searchRes.value.data.results || searchRes.value.data || []
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
            searchRes.value.data.count ||
              searchRes.value.data.length ||
              transformedProducts.length
          )
        } else {
          // No results from API
          setProducts([])
          setTotalProducts(0)
        }

        if (aiSuggestionsRes.status === 'fulfilled') {
          setAiSuggestion(aiSuggestionsRes.value.data.suggestion)
          setSuggestions(aiSuggestionsRes.value.data.related_queries || [])
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
  }, [query, currentPage, sortBy])

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

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b">
        <p className="text-sm text-muted-foreground">
          Showing{' '}
          <span className="font-medium text-foreground">
            {Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, totalProducts)}-
            {Math.min(currentPage * ITEMS_PER_PAGE, totalProducts)}
          </span>{' '}
          of <span className="font-medium text-foreground">{totalProducts}</span> results
        </p>
        <SortDropdown value={sortBy} onChange={handleSortChange} />
      </div>

      {/* Results */}
      {products.length > 0 ? (
        <>
          <ProductGrid products={products} isLoading={isLoading} columns={4} />
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
        <ProductGrid products={[]} isLoading={true} columns={4} />
      )}
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
