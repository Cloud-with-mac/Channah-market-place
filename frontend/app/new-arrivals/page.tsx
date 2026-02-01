'use client'

import * as React from 'react'
import { ProductGrid } from '@/components/product/product-grid'
import { SortDropdown, SortOption } from '@/components/product/sort-dropdown'
import { Pagination } from '@/components/product/pagination'
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator } from '@/components/ui/breadcrumb'
import { PackagePlus } from 'lucide-react'
import { productsAPI } from '@/lib/api'

const ITEMS_PER_PAGE = 12

export default function NewArrivalsPage() {
  const [products, setProducts] = React.useState<any[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [totalProducts, setTotalProducts] = React.useState(0)
  const [currentPage, setCurrentPage] = React.useState(1)
  const [sortBy, setSortBy] = React.useState<SortOption>('newest')

  React.useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true)
      try {
        const data = await productsAPI.getNewArrivals(24)

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
          })
        )

        setProducts(transformedProducts)
        setTotalProducts(transformedProducts.length)
      } catch (error) {
        console.error('Failed to fetch new arrivals:', error)
        setProducts([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchProducts()
  }, [])

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
          <BreadcrumbLink href="/new-arrivals" active>
            New Arrivals
          </BreadcrumbLink>
        </BreadcrumbItem>
      </Breadcrumb>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-display mb-2">New Arrivals</h1>
        <p className="text-muted-foreground max-w-2xl">
          Discover the latest products added to our marketplace. Be the first to get your hands on fresh arrivals from our trusted vendors.
        </p>
      </div>

      {/* Toolbar */}
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

      {/* Product Grid */}
      {isLoading && (
        <ProductGrid products={[]} isLoading={true} columns={4} />
      )}

      {!isLoading && products.length > 0 && (
        <ProductGrid products={paginatedProducts} isLoading={false} columns={4} />
      )}

      {!isLoading && products.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-4 rounded-full bg-green-500/10 p-4">
            <PackagePlus className="h-12 w-12 text-green-500" />
          </div>
          <h2 className="text-lg font-semibold mb-2">No new arrivals yet</h2>
          <p className="text-muted-foreground max-w-md">
            Our vendors are preparing new products. Check back soon for fresh arrivals!
          </p>
        </div>
      )}

      {/* Pagination */}
      {!isLoading && products.length > 0 && totalPages > 1 && (
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
