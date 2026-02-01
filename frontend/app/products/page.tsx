'use client'

import * as React from 'react'
import { Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Grid3X3, LayoutGrid, Loader2, Package, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ProductGrid } from '@/components/product/product-grid'
import { ProductFilters, ProductFiltersState } from '@/components/product/product-filters'
import { SortDropdown, SortOption } from '@/components/product/sort-dropdown'
import { Pagination } from '@/components/product/pagination'
import { ActiveFilters, ActiveFilter } from '@/components/product/active-filters'
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator } from '@/components/ui/breadcrumb'
import { productsAPI, categoriesAPI } from '@/lib/api'
import { cn } from '@/lib/utils'

const ITEMS_PER_PAGE = 12

interface Category {
  id: string
  name: string
  slug: string
  count: number
}

function EmptyProducts() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <Package className="h-16 w-16 text-muted-foreground/50 mb-4" />
      <h3 className="text-xl font-semibold mb-2">No products available</h3>
      <p className="text-muted-foreground mb-6 max-w-md">
        Products will appear here once vendors start adding them to the marketplace.
      </p>
      <Button asChild>
        <Link href="/sell">
          <Plus className="mr-2 h-4 w-4" />
          Become a Seller
        </Link>
      </Button>
    </div>
  )
}

function ProductsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [products, setProducts] = React.useState<any[]>([])
  const [categories, setCategories] = React.useState<Category[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [totalProducts, setTotalProducts] = React.useState(0)
  const [viewMode, setViewMode] = React.useState<'grid' | 'compact'>('grid')

  // Parse URL params
  const currentPage = parseInt(searchParams.get('page') || '1')
  const sortBy = (searchParams.get('sort') as SortOption) || 'newest'
  const categoryParam = searchParams.get('category')
  const minPriceParam = searchParams.get('min_price')
  const maxPriceParam = searchParams.get('max_price')
  const ratingParam = searchParams.get('rating')
  const inStockParam = searchParams.get('in_stock')
  const onSaleParam = searchParams.get('on_sale')

  const [filters, setFilters] = React.useState<ProductFiltersState>({
    categories: categoryParam ? categoryParam.split(',') : [],
    priceRange: [
      minPriceParam ? parseInt(minPriceParam) : 0,
      maxPriceParam ? parseInt(maxPriceParam) : 10000,
    ],
    rating: ratingParam ? parseInt(ratingParam) : null,
    inStock: inStockParam === 'true',
    onSale: onSaleParam === 'true',
    brands: [],
    sellers: [],
    purpose: [],
    freeShipping: false,
    newArrivals: false,
    bestSellers: false,
    condition: null,
    attributes: {},
  })

  // Map frontend sort options to backend ordering
  const sortMapping: Record<SortOption, string> = {
    newest: '-created_at',
    popular: '-total_sales',
    bestselling: '-total_sales',
    rating: '-rating',
    price_low: 'price',
    price_high: '-price',
    'price-asc': 'price',
    'price-desc': '-price',
    'price-low': 'price',
    'price-high': '-price',
    oldest: 'created_at',
    name_asc: 'name',
    name_desc: '-name',
  }

  // Fetch products and categories
  React.useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        const params: Record<string, string | number> = {
          page: currentPage,
          page_size: ITEMS_PER_PAGE,
          ordering: sortMapping[sortBy] || '-created_at',
        }

        if (filters.categories.length > 0) {
          params.category__slug__in = filters.categories.join(',')
        }
        if (filters.priceRange[0] > 0) {
          params.price__gte = filters.priceRange[0]
        }
        if (filters.priceRange[1] < 10000) {
          params.price__lte = filters.priceRange[1]
        }
        if (filters.rating) {
          params.rating__gte = filters.rating
        }
        if (filters.inStock) {
          params.quantity__gt = 0
        }
        if (filters.onSale) {
          params.on_sale = 'true'
        }

        const [productsRes, categoriesRes] = await Promise.all([
          productsAPI.getAll(params),
          categoriesAPI.getAll(),
        ])

        const transformedProducts = (productsRes.results || productsRes || []).map(
          (p: any) => ({
            id: p.id,
            name: p.name,
            slug: p.slug,
            price: parseFloat(p.price),
            compareAtPrice: p.compare_at_price ? parseFloat(p.compare_at_price) : undefined,
            image: p.primary_image || p.images?.[0]?.url || p.image || '',
            rating: p.rating || 0,
            reviewCount: p.review_count || 0,
            vendorName: p.vendor?.business_name || p.vendor_name || 'Vendor',
          })
        )

        setProducts(transformedProducts)
        setTotalProducts(productsRes.count || transformedProducts.length)

        const transformedCategories = (categoriesRes.results || categoriesRes || []).map(
          (c: any) => ({
            id: c.id,
            name: c.name,
            slug: c.slug,
            count: c.product_count || 0,
          })
        )
        setCategories(transformedCategories)
      } catch (error) {
        console.error('Failed to fetch products:', error)
        setProducts([])
        setCategories([])
        setTotalProducts(0)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [currentPage, sortBy, filters])

  // Update URL when filters change
  const updateURL = React.useCallback(
    (newFilters: ProductFiltersState, newSort: SortOption, newPage: number) => {
      const params = new URLSearchParams()

      if (newPage > 1) params.set('page', newPage.toString())
      if (newSort !== 'newest') params.set('sort', newSort)
      if (newFilters.categories.length > 0)
        params.set('category', newFilters.categories.join(','))
      if (newFilters.priceRange[0] > 0)
        params.set('min_price', newFilters.priceRange[0].toString())
      if (newFilters.priceRange[1] < 10000)
        params.set('max_price', newFilters.priceRange[1].toString())
      if (newFilters.rating) params.set('rating', newFilters.rating.toString())
      if (newFilters.inStock) params.set('in_stock', 'true')
      if (newFilters.onSale) params.set('on_sale', 'true')

      const queryString = params.toString()
      router.push(`/products${queryString ? `?${queryString}` : ''}`, { scroll: false })
    },
    [router]
  )

  const handleFiltersChange = (newFilters: ProductFiltersState) => {
    setFilters(newFilters)
    updateURL(newFilters, sortBy, 1)
  }

  const handleSortChange = (newSort: SortOption) => {
    updateURL(filters, newSort, 1)
  }

  const handlePageChange = (page: number) => {
    updateURL(filters, sortBy, page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Build active filters for display
  const activeFilters: ActiveFilter[] = []
  filters.categories.forEach((cat) => {
    const category = categories.find((c) => c.slug === cat)
    if (category) {
      activeFilters.push({
        key: `category-${cat}`,
        label: 'Category',
        value: category.name,
      })
    }
  })
  if (filters.priceRange[0] > 0 || filters.priceRange[1] < 10000) {
    activeFilters.push({
      key: 'price',
      label: 'Price',
      value: `$${filters.priceRange[0]} - $${filters.priceRange[1]}`,
    })
  }
  if (filters.rating) {
    activeFilters.push({
      key: 'rating',
      label: 'Rating',
      value: `${filters.rating}+ stars`,
    })
  }
  if (filters.inStock) {
    activeFilters.push({ key: 'inStock', label: 'Availability', value: 'In Stock' })
  }
  if (filters.onSale) {
    activeFilters.push({ key: 'onSale', label: 'Sale', value: 'On Sale' })
  }

  const handleRemoveFilter = (key: string) => {
    const newFilters = { ...filters }
    if (key.startsWith('category-')) {
      const cat = key.replace('category-', '')
      newFilters.categories = filters.categories.filter((c) => c !== cat)
    } else if (key === 'price') {
      newFilters.priceRange = [0, 10000]
    } else if (key === 'rating') {
      newFilters.rating = null
    } else if (key === 'inStock') {
      newFilters.inStock = false
    } else if (key === 'onSale') {
      newFilters.onSale = false
    }
    handleFiltersChange(newFilters)
  }

  const handleClearAllFilters = () => {
    handleFiltersChange({
      categories: [],
      priceRange: [0, 10000],
      rating: null,
      inStock: false,
      onSale: false,
      brands: [],
      sellers: [],
      purpose: [],
      freeShipping: false,
      newArrivals: false,
      bestSellers: false,
      condition: null,
      attributes: {},
    })
  }

  const totalPages = Math.ceil(totalProducts / ITEMS_PER_PAGE)

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <Breadcrumb className="mb-6">
        <BreadcrumbItem>
          <BreadcrumbLink href="/">Home</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink href="/products" active>
            All Products
          </BreadcrumbLink>
        </BreadcrumbItem>
      </Breadcrumb>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-display mb-2">All Products</h1>
        <p className="text-muted-foreground">
          Discover amazing products from trusted vendors
        </p>
      </div>

      <div className="flex gap-8">
        {/* Filters Sidebar */}
        <ProductFilters
          categories={categories}
          filters={filters}
          onFiltersChange={handleFiltersChange}
          minPrice={0}
          maxPrice={10000}
        />

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Active Filters */}
          {activeFilters.length > 0 && (
            <div className="mb-4">
              <ActiveFilters
                filters={activeFilters}
                onRemove={handleRemoveFilter}
                onClearAll={handleClearAllFilters}
              />
            </div>
          )}

          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-4 border-b">
            <div className="flex items-center gap-4">
              <ProductFilters
                categories={categories}
                filters={filters}
                onFiltersChange={handleFiltersChange}
                minPrice={0}
                maxPrice={10000}
                className="lg:hidden"
              />
              <p className="text-sm text-muted-foreground">
                {totalProducts > 0 ? (
                  <>
                    Showing{' '}
                    <span className="font-medium text-foreground">
                      {Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, totalProducts)}-
                      {Math.min(currentPage * ITEMS_PER_PAGE, totalProducts)}
                    </span>{' '}
                    of <span className="font-medium text-foreground">{totalProducts}</span> products
                  </>
                ) : (
                  'No products found'
                )}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center border rounded-md">
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    'h-8 w-8 rounded-none rounded-l-md',
                    viewMode === 'grid' && 'bg-muted'
                  )}
                  onClick={() => setViewMode('grid')}
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    'h-8 w-8 rounded-none rounded-r-md',
                    viewMode === 'compact' && 'bg-muted'
                  )}
                  onClick={() => setViewMode('compact')}
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
              </div>

              <SortDropdown value={sortBy} onChange={handleSortChange} />
            </div>
          </div>

          {/* Product Grid or Empty State */}
          {isLoading ? (
            <ProductGrid products={[]} isLoading={true} columns={viewMode === 'compact' ? 4 : 3} />
          ) : products.length > 0 ? (
            <ProductGrid
              products={products}
              isLoading={false}
              columns={viewMode === 'compact' ? 4 : 3}
            />
          ) : (
            <EmptyProducts />
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              className="mt-8"
            />
          )}
        </div>
      </div>
    </div>
  )
}

export default function ProductsPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-16">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    }>
      <ProductsContent />
    </Suspense>
  )
}
