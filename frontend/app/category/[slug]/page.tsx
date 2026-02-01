'use client'

import * as React from 'react'
import { Suspense } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Loader2, PackageX } from 'lucide-react'
import { ProductGrid } from '@/components/product/product-grid'
import { ProductFilters, ProductFiltersState, CategoryFilters } from '@/components/product/product-filters'
import { SortDropdown, SortOption } from '@/components/product/sort-dropdown'
import { Pagination } from '@/components/product/pagination'
import { ActiveFilters, ActiveFilter } from '@/components/product/active-filters'
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator } from '@/components/ui/breadcrumb'
import { Skeleton } from '@/components/ui/skeleton'
import { productsAPI, categoriesAPI } from '@/lib/api'
import { useCurrencyStore } from '@/store'

const ITEMS_PER_PAGE = 12

interface Subcategory {
  id: string
  name: string
  slug: string
  image_url?: string
  count: number
}

function SubcategoryCircle({ sub }: { sub: Subcategory }) {
  const [imgSrc, setImgSrc] = React.useState(
    sub.image_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(sub.name)}&size=128&background=random&color=fff&bold=true&format=png`
  )
  const [hasError, setHasError] = React.useState(false)

  const fallbackUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(sub.name)}&size=128&background=random&color=fff&bold=true&format=png`

  return (
    <Link
      href={`/category/${sub.slug}`}
      className="group flex flex-col items-center gap-2"
    >
      <div className="relative w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full overflow-hidden bg-muted border border-border/50 group-hover:border-primary/50 group-hover:shadow-md transition-all duration-300">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={hasError ? fallbackUrl : imgSrc}
          alt={sub.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
          onError={() => {
            if (!hasError) {
              setHasError(true)
              setImgSrc(fallbackUrl)
            }
          }}
          loading="lazy"
        />
      </div>
      <span className="text-xs sm:text-sm font-medium text-center line-clamp-2 group-hover:text-primary transition-colors max-w-[80px] sm:max-w-[96px] md:max-w-[112px]">
        {sub.name}
      </span>
    </Link>
  )
}

function SubcategoriesGrid({ subcategories, parentSlug }: { subcategories: Subcategory[]; parentSlug: string }) {
  return (
    <div className="mb-8">
      <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-9 gap-4 md:gap-6">
        {subcategories.map((sub) => (
          <SubcategoryCircle key={sub.id} sub={sub} />
        ))}
      </div>
    </div>
  )
}

function CategoryContent() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const slug = params.slug as string
  const { convertAndFormat } = useCurrencyStore()

  const [category, setCategory] = React.useState<any>(null)
  const [products, setProducts] = React.useState<any[]>([])
  const [subcategories, setSubcategories] = React.useState<any[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [totalProducts, setTotalProducts] = React.useState(0)
  const [categoryFilters, setCategoryFilters] = React.useState<CategoryFilters | null>(null)

  // Parse URL params
  const currentPage = parseInt(searchParams.get('page') || '1')
  const sortBy = (searchParams.get('sort') as SortOption) || 'newest'
  const subCategoryParam = searchParams.get('subcategory')
  const minPriceParam = searchParams.get('min_price')
  const maxPriceParam = searchParams.get('max_price')
  const ratingParam = searchParams.get('rating')
  const inStockParam = searchParams.get('in_stock')
  const onSaleParam = searchParams.get('on_sale')
  const brandsParam = searchParams.get('brands')
  const sizesParam = searchParams.get('sizes')
  const colorsParam = searchParams.get('colors')
  const sellersParam = searchParams.get('sellers')

  const [filters, setFilters] = React.useState<ProductFiltersState>({
    categories: subCategoryParam ? subCategoryParam.split(',') : [],
    priceRange: [
      minPriceParam ? parseInt(minPriceParam) : 0,
      maxPriceParam ? parseInt(maxPriceParam) : 10000,
    ],
    rating: ratingParam ? parseInt(ratingParam) : null,
    inStock: inStockParam === 'true',
    onSale: onSaleParam === 'true',
    brands: brandsParam ? brandsParam.split(',') : [],
    sellers: sellersParam ? sellersParam.split(',') : [],
    purpose: [],
    freeShipping: false,
    newArrivals: false,
    bestSellers: false,
    condition: null,
    attributes: {
      ...(sizesParam ? { size: sizesParam.split(',') } : {}),
      ...(colorsParam ? { color: colorsParam.split(',') } : {}),
    },
  })

  // Fetch filter options for all categories (parent and subcategory)
  React.useEffect(() => {
    const fetchFilters = async () => {
      if (category) {
        try {
          const response = await productsAPI.getFilters(slug)
          setCategoryFilters(response as any)
        } catch (error) {
          console.error('Failed to fetch category filters:', error)
          setCategoryFilters(null)
        }
      }
    }
    fetchFilters()
  }, [slug, category])

  // Fetch category data
  React.useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)

      try {
        // Fetch category info
        const categoryRes = await categoriesAPI.getBySlug(slug)
        const categoryData = categoryRes
        setCategory(categoryData)

        // Build query params for products
        const queryParams: Record<string, string | number> = {
          skip: (currentPage - 1) * ITEMS_PER_PAGE,
          limit: ITEMS_PER_PAGE,
          sort_by: sortBy === 'price-low' ? 'price' : sortBy === 'price-high' ? 'price' : sortBy === 'rating' ? 'rating' : 'created_at',
          sort_order: sortBy === 'price-low' ? 'asc' : sortBy === 'oldest' ? 'asc' : 'desc',
          category: slug,
        }

        if (filters.categories.length > 0) {
          queryParams.subcategory = filters.categories.join(',')
        }
        if (filters.priceRange[0] > 0) {
          queryParams.min_price = filters.priceRange[0]
        }
        if (filters.priceRange[1] < 10000) {
          queryParams.max_price = filters.priceRange[1]
        }
        if (filters.rating) {
          queryParams.min_rating = filters.rating
        }
        if (filters.inStock) {
          queryParams.in_stock = 'true'
        }
        if (filters.onSale) {
          queryParams.on_sale = 'true'
        }
        // Brand filter (from attributes)
        if (filters.brands.length > 0 || filters.attributes?.brand?.length > 0) {
          const allBrands = [...filters.brands, ...(filters.attributes?.brand || [])]
          queryParams.brands = [...new Set(allBrands)].join(',')
        }
        // Size filter
        if (filters.attributes?.size?.length > 0) {
          queryParams.sizes = filters.attributes.size.join(',')
        }
        // Color filter
        if (filters.attributes?.color?.length > 0) {
          queryParams.colors = filters.attributes.color.join(',')
        }
        // Seller filter
        if (filters.sellers.length > 0) {
          queryParams.sellers = filters.sellers.join(',')
        }
        // Other dynamic attributes as JSON
        const otherAttrs: Record<string, string[]> = {}
        Object.entries(filters.attributes || {}).forEach(([key, values]) => {
          if (!['brand', 'size', 'color'].includes(key) && values.length > 0) {
            otherAttrs[key] = values
          }
        })
        if (Object.keys(otherAttrs).length > 0) {
          queryParams.attributes = JSON.stringify(otherAttrs)
        }

        // Fetch products
        const productsRes = await productsAPI.getAll(queryParams)

        // Transform API response
        const transformedProducts = (productsRes.results || productsRes || []).map(
          (p: any) => ({
            id: p.id,
            name: p.name,
            slug: p.slug,
            price: parseFloat(p.price),
            compareAtPrice: p.compare_at_price ? parseFloat(p.compare_at_price) : undefined,
            image: p.primary_image || p.images?.[0]?.url || p.image || null,
            rating: p.rating || 0,
            reviewCount: p.review_count || 0,
            vendorName: p.vendor?.business_name || p.vendor_name || 'Vendora Vendor',
          })
        )

        setProducts(transformedProducts)
        setTotalProducts(productsRes.count || productsRes.total || transformedProducts.length)

        // Set subcategories from category children
        if (categoryData?.children) {
          const mappedSubcategories = categoryData.children.map((c: any) => ({
            id: c.id,
            name: c.name,
            slug: c.slug,
            image_url: c.image_url,
            count: c.product_count || 0,
          }))
          setSubcategories(mappedSubcategories)
        } else {
          setSubcategories([])
        }
      } catch (error) {
        console.error('Failed to fetch category data:', error)
        // Set category name from slug if API fails
        const categoryName = slug
          .split('-')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ')
        setCategory({
          name: categoryName,
          description: `Browse our collection of ${categoryName.toLowerCase()} products from trusted sellers worldwide.`,
        })
        setProducts([])
        setTotalProducts(0)
        setSubcategories([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [slug, currentPage, sortBy, filters])

  // Update URL when filters change
  const updateURL = React.useCallback(
    (newFilters: ProductFiltersState, newSort: SortOption, newPage: number) => {
      const params = new URLSearchParams()

      if (newPage > 1) params.set('page', newPage.toString())
      if (newSort !== 'newest') params.set('sort', newSort)
      if (newFilters.categories.length > 0)
        params.set('subcategory', newFilters.categories.join(','))
      if (newFilters.priceRange[0] > 0)
        params.set('min_price', newFilters.priceRange[0].toString())
      if (newFilters.priceRange[1] < 10000)
        params.set('max_price', newFilters.priceRange[1].toString())
      if (newFilters.rating) params.set('rating', newFilters.rating.toString())
      if (newFilters.inStock) params.set('in_stock', 'true')
      if (newFilters.onSale) params.set('on_sale', 'true')
      // Add new filter params
      const allBrands = [...newFilters.brands, ...(newFilters.attributes?.brand || [])]
      if (allBrands.length > 0) params.set('brands', [...new Set(allBrands)].join(','))
      if (newFilters.attributes?.size?.length > 0)
        params.set('sizes', newFilters.attributes.size.join(','))
      if (newFilters.attributes?.color?.length > 0)
        params.set('colors', newFilters.attributes.color.join(','))
      if (newFilters.sellers.length > 0)
        params.set('sellers', newFilters.sellers.join(','))

      const queryString = params.toString()
      router.push(`/category/${slug}${queryString ? `?${queryString}` : ''}`, { scroll: false })
    },
    [router, slug]
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
    const subcat = subcategories.find((c) => c.slug === cat)
    if (subcat) {
      activeFilters.push({
        key: `subcategory-${cat}`,
        label: 'Subcategory',
        value: subcat.name,
      })
    }
  })
  if (filters.priceRange[0] > (categoryFilters?.price_min || 0) || filters.priceRange[1] < (categoryFilters?.price_max || 10000)) {
    activeFilters.push({
      key: 'price',
      label: 'Price',
      value: `${convertAndFormat(filters.priceRange[0])} - ${convertAndFormat(filters.priceRange[1])}`,
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
  // Brand filters
  filters.brands.forEach((brand) => {
    activeFilters.push({
      key: `brand-${brand}`,
      label: 'Brand',
      value: brand,
    })
  })
  // Seller filters
  filters.sellers.forEach((sellerId) => {
    const vendor = categoryFilters?.vendors?.find((v) => v.id === sellerId)
    activeFilters.push({
      key: `seller-${sellerId}`,
      label: 'Seller',
      value: vendor?.name || sellerId,
    })
  })
  // Dynamic attribute filters
  Object.entries(filters.attributes || {}).forEach(([attrKey, values]) => {
    values.forEach((value) => {
      activeFilters.push({
        key: `attr-${attrKey}-${value}`,
        label: attrKey.charAt(0).toUpperCase() + attrKey.slice(1),
        value: value,
      })
    })
  })

  const handleRemoveFilter = (key: string) => {
    const newFilters = { ...filters, attributes: { ...filters.attributes } }
    if (key.startsWith('subcategory-')) {
      const cat = key.replace('subcategory-', '')
      newFilters.categories = filters.categories.filter((c) => c !== cat)
    } else if (key === 'price') {
      newFilters.priceRange = [categoryFilters?.price_min || 0, categoryFilters?.price_max || 10000]
    } else if (key === 'rating') {
      newFilters.rating = null
    } else if (key === 'inStock') {
      newFilters.inStock = false
    } else if (key === 'onSale') {
      newFilters.onSale = false
    } else if (key.startsWith('brand-')) {
      const brand = key.replace('brand-', '')
      newFilters.brands = filters.brands.filter((b) => b !== brand)
    } else if (key.startsWith('seller-')) {
      const sellerId = key.replace('seller-', '')
      newFilters.sellers = filters.sellers.filter((s) => s !== sellerId)
    } else if (key.startsWith('attr-')) {
      const parts = key.split('-')
      const attrKey = parts[1]
      const value = parts.slice(2).join('-')
      if (newFilters.attributes[attrKey]) {
        newFilters.attributes[attrKey] = newFilters.attributes[attrKey].filter((v) => v !== value)
        if (newFilters.attributes[attrKey].length === 0) {
          delete newFilters.attributes[attrKey]
        }
      }
    }
    handleFiltersChange(newFilters)
  }

  const handleClearAllFilters = () => {
    handleFiltersChange({
      categories: [],
      priceRange: [categoryFilters?.price_min || 0, categoryFilters?.price_max || 10000],
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

  // Only show filters on subcategory pages (categories without children)
  const isSubcategory = category && (!category.children || category.children.length === 0)
  const showFilters = isSubcategory

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <Breadcrumb className="mb-6">
        <BreadcrumbItem>
          <BreadcrumbLink href="/">Home</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink href="/products">Products</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink href={`/category/${slug}`} active>
            {category?.name || (
              <Skeleton className="h-4 w-24 inline-block" />
            )}
          </BreadcrumbLink>
        </BreadcrumbItem>
      </Breadcrumb>

      {/* Category Banner */}
      <div className="mb-6 rounded-xl bg-gradient-to-r from-primary to-primary/80 p-6 text-primary-foreground">
        {category ? (
          <>
            <h1 className="text-3xl font-bold font-display mb-2">{category.name}</h1>
            {category.description && (
              <p className="text-primary-foreground/90 max-w-2xl">{category.description}</p>
            )}
          </>
        ) : (
          <>
            <Skeleton className="h-9 w-48 mb-2 bg-primary-foreground/20" />
            <Skeleton className="h-4 w-96 bg-primary-foreground/20" />
          </>
        )}
      </div>

      {/* Subcategories Carousel */}
      {subcategories.length > 0 && (
        <SubcategoriesGrid subcategories={subcategories} parentSlug={slug} />
      )}

      <div className={showFilters ? "flex gap-8" : ""}>
        {/* Filters Sidebar - only show on subcategory pages */}
        {showFilters && (
          <ProductFilters
            categories={subcategories}
            filters={filters}
            onFiltersChange={handleFiltersChange}
            minPrice={categoryFilters?.price_min || 0}
            maxPrice={categoryFilters?.price_max || 10000}
            categoryFilters={categoryFilters}
          />
        )}

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Active Filters - only show on subcategory pages */}
          {showFilters && activeFilters.length > 0 && (
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
              {/* Mobile filters button - only show on subcategory pages */}
              {showFilters && (
                <ProductFilters
                  categories={subcategories}
                  filters={filters}
                  onFiltersChange={handleFiltersChange}
                  minPrice={categoryFilters?.price_min || 0}
                  maxPrice={categoryFilters?.price_max || 10000}
                  categoryFilters={categoryFilters}
                  className="lg:hidden"
                />
              )}
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

            <SortDropdown value={sortBy} onChange={handleSortChange} />
          </div>

          {/* Product Grid or Empty State */}
          {isLoading ? (
            <ProductGrid products={[]} isLoading={true} columns={4} />
          ) : products.length > 0 ? (
            <ProductGrid products={products} isLoading={false} columns={4} />
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <PackageX className="h-16 w-16 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No products yet</h3>
              <p className="text-muted-foreground max-w-md">
                There are no products in this category yet. Check back soon as our vendors add new items!
              </p>
            </div>
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

export default function CategoryPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-16">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    }>
      <CategoryContent />
    </Suspense>
  )
}
