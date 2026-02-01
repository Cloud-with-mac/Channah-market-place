'use client'

import * as React from 'react'
import { ProductGrid } from '@/components/product/product-grid'
import { SortDropdown, SortOption } from '@/components/product/sort-dropdown'
import { Pagination } from '@/components/product/pagination'
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator } from '@/components/ui/breadcrumb'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { AlertCircle, RefreshCw, TrendingUp } from 'lucide-react'
import { productsAPI } from '@/lib/api'

const ITEMS_PER_PAGE = 12

export default function BestSellersPage() {
  const [products, setProducts] = React.useState<any[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [totalProducts, setTotalProducts] = React.useState(0)
  const [currentPage, setCurrentPage] = React.useState(1)
  const [sortBy, setSortBy] = React.useState<SortOption>('bestselling')

  const fetchProducts = React.useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await productsAPI.getBestSellers(24)

      // Transform API response
      const transformedProducts = (Array.isArray(data) ? data : data.results || []).map(
        (p: any) => ({
          id: p.id,
          name: p.name,
          slug: p.slug,
          price: parseFloat(p.price),
          compareAtPrice: p.compare_at_price ? parseFloat(p.compare_at_price) : undefined,
          image: p.primary_image || p.images?.[0]?.url || p.image || 'https://images.unsplash.com/photo-1560393464-5c69a73c5770?w=400&h=400&fit=crop',
          rating: p.rating || 4.0,
          reviewCount: p.review_count || 0,
          vendorName: p.vendor?.business_name || p.vendor_name || 'Vendora Vendor',
          salesCount: p.sales_count || 0,
        })
      )

      setProducts(transformedProducts)
      setTotalProducts(transformedProducts.length)
    } catch (error: any) {
      console.error('Failed to fetch best sellers:', error)
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        setError('Connection timed out. Please make sure the backend server is running on port 8000.')
      } else if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
        setError('Cannot connect to the server. Please make sure the backend is running: cd backend && uvicorn app.main:app --reload')
      } else {
        setError(error.response?.data?.detail || 'Failed to load products. Please try again.')
      }
      setProducts([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  const handleSortChange = (newSort: SortOption) => {
    setSortBy(newSort)
    // Sort products client-side
    const sorted = [...products].sort((a, b) => {
      switch (newSort) {
        case 'price-asc':
          return a.price - b.price
        case 'price-desc':
          return b.price - a.price
        case 'rating':
          return b.rating - a.rating
        case 'bestselling':
          return b.salesCount - a.salesCount
        case 'newest':
        default:
          return 0
      }
    })
    setProducts(sorted)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const totalPages = Math.ceil(totalProducts / ITEMS_PER_PAGE)
  const paginatedProducts = products.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <Breadcrumb className="mb-6">
        <BreadcrumbItem>
          <BreadcrumbLink href="/">Home</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink href="/best-sellers" active>
            Best Sellers
          </BreadcrumbLink>
        </BreadcrumbItem>
      </Breadcrumb>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-display mb-2">Best Sellers</h1>
        <p className="text-muted-foreground max-w-2xl">
          Shop our most popular products loved by thousands of customers. These top-rated items are flying off the shelves!
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Connection Error</AlertTitle>
          <AlertDescription className="mt-2">
            <p>{error}</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={fetchProducts}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Toolbar */}
      {!error && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-4 border-b">
          <p className="text-sm text-muted-foreground">
            Showing{' '}
            <span className="font-medium text-foreground">
              {Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, totalProducts)}-
              {Math.min(currentPage * ITEMS_PER_PAGE, totalProducts)}
            </span>{' '}
            of <span className="font-medium text-foreground">{totalProducts}</span> products
          </p>

          <SortDropdown value={sortBy} onChange={handleSortChange} />
        </div>
      )}

      {/* Product Grid */}
      {!error && isLoading && (
        <ProductGrid products={[]} isLoading={true} columns={4} />
      )}

      {!error && !isLoading && products.length > 0 && (
        <ProductGrid products={paginatedProducts} isLoading={false} columns={4} />
      )}

      {!error && !isLoading && products.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-4 rounded-full bg-amber-500/10 p-4">
            <TrendingUp className="h-12 w-12 text-amber-500" />
          </div>
          <h2 className="text-lg font-semibold mb-2">No best sellers yet</h2>
          <p className="text-muted-foreground max-w-md">
            Our vendors are just getting started. Check back soon to see the most popular products!
          </p>
        </div>
      )}

      {/* Pagination */}
      {!error && !isLoading && products.length > 0 && totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          className="mt-8"
        />
      )}
    </div>
  )
}
