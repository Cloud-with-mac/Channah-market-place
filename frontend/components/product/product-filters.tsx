'use client'

import * as React from 'react'
import { ChevronDown, X, SlidersHorizontal, Search, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { FilterPriceRange } from './filter-price-range'
import { cn } from '@/lib/utils'

interface Category {
  id: string
  name: string
  slug: string
  count?: number
}

interface Brand {
  id: string
  name: string
  slug: string
  count?: number
}

interface Seller {
  id: string
  name: string
  slug: string
  rating?: number
  count?: number
}

// Filter option from API
interface FilterOption {
  value: string
  label: string
  count: number
}

// Filter section from API
interface FilterSection {
  key: string
  label: string
  type: string
  options: FilterOption[]
  min_value?: number
  max_value?: number
}

// Vendor filter from API
interface VendorFilter {
  id: string
  name: string
  rating: number
  count: number
}

// Category filters response from API
export interface CategoryFilters {
  category_id?: string
  category_name?: string
  price_min: number
  price_max: number
  attribute_filters: FilterSection[]
  vendors: VendorFilter[]
  rating_counts: Record<number, number>
  has_on_sale: boolean
  has_free_shipping: boolean
  in_stock_count: number
  total_count: number
}

export interface ProductFiltersState {
  categories: string[]
  priceRange: [number, number]
  rating: number | null
  inStock: boolean
  onSale: boolean
  brands: string[]
  sellers: string[]
  purpose: string[]
  freeShipping: boolean
  newArrivals: boolean
  bestSellers: boolean
  condition: string | null
  // Dynamic attribute filters
  attributes: Record<string, string[]>
}

interface ProductFiltersProps {
  categories: Category[]
  brands?: Brand[]
  sellers?: Seller[]
  filters: ProductFiltersState
  onFiltersChange: (filters: ProductFiltersState) => void
  minPrice?: number
  maxPrice?: number
  className?: string
  // Dynamic category filters from API
  categoryFilters?: CategoryFilters | null
}

export function ProductFilters({
  categories,
  brands = [],
  sellers = [],
  filters,
  onFiltersChange,
  minPrice = 0,
  maxPrice = 10000,
  className,
  categoryFilters,
}: ProductFiltersProps) {
  const [expandedSections, setExpandedSections] = React.useState<string[]>([
    'quick',
    'categories',
    'price',
    'rating',
  ])
  const [searchTerms, setSearchTerms] = React.useState<Record<string, string>>({})

  // Use API price range if available
  const effectiveMinPrice = categoryFilters?.price_min ?? minPrice
  const effectiveMaxPrice = categoryFilters?.price_max ?? maxPrice

  const toggleSection = (section: string) => {
    setExpandedSections((prev) =>
      prev.includes(section)
        ? prev.filter((s) => s !== section)
        : [...prev, section]
    )
  }

  const handleCategoryChange = (categorySlug: string, checked: boolean) => {
    const newCategories = checked ? [categorySlug] : []
    onFiltersChange({ ...filters, categories: newCategories })
  }

  const handlePriceChange = (priceRange: [number, number]) => {
    onFiltersChange({ ...filters, priceRange })
  }

  const handleInStockChange = (checked: boolean) => {
    onFiltersChange({ ...filters, inStock: checked })
  }

  const handleOnSaleChange = (checked: boolean) => {
    onFiltersChange({ ...filters, onSale: checked })
  }

  const handleRatingChange = (rating: number) => {
    onFiltersChange({ ...filters, rating: filters.rating === rating ? null : rating })
  }

  const handleBrandChange = (brand: string, checked: boolean) => {
    const newBrands = checked
      ? [...filters.brands, brand]
      : filters.brands.filter((b) => b !== brand)
    onFiltersChange({ ...filters, brands: newBrands })
  }

  const handleSellerChange = (sellerId: string, checked: boolean) => {
    const newSellers = checked
      ? [...filters.sellers, sellerId]
      : filters.sellers.filter((s) => s !== sellerId)
    onFiltersChange({ ...filters, sellers: newSellers })
  }

  const handleAttributeChange = (attrKey: string, value: string, checked: boolean) => {
    const currentValues = filters.attributes?.[attrKey] || []
    const newValues = checked
      ? [...currentValues, value]
      : currentValues.filter((v) => v !== value)

    onFiltersChange({
      ...filters,
      attributes: {
        ...filters.attributes,
        [attrKey]: newValues,
      },
    })
  }

  const handleResetFilters = () => {
    onFiltersChange({
      categories: [],
      priceRange: [effectiveMinPrice, effectiveMaxPrice],
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
    setSearchTerms({})
  }

  const hasActiveFilters =
    filters.categories.length > 0 ||
    filters.priceRange[0] !== effectiveMinPrice ||
    filters.priceRange[1] !== effectiveMaxPrice ||
    filters.inStock ||
    filters.onSale ||
    filters.rating !== null ||
    filters.brands.length > 0 ||
    filters.sellers.length > 0 ||
    Object.values(filters.attributes || {}).some((arr) => arr.length > 0)

  const activeFilterCount =
    filters.categories.length +
    (filters.priceRange[0] !== effectiveMinPrice || filters.priceRange[1] !== effectiveMaxPrice ? 1 : 0) +
    (filters.inStock ? 1 : 0) +
    (filters.onSale ? 1 : 0) +
    (filters.rating ? 1 : 0) +
    filters.brands.length +
    filters.sellers.length +
    Object.values(filters.attributes || {}).reduce((acc, arr) => acc + arr.length, 0)

  // Filter options by search term
  const filterOptions = (options: FilterOption[], key: string) => {
    const term = searchTerms[key]?.toLowerCase() || ''
    if (!term) return options
    return options.filter((opt) => opt.label.toLowerCase().includes(term))
  }

  const FilterContent = () => (
    <div className="space-y-4">
      {/* Quick Filters */}
      <div>
        <FilterSection
          title="Quick Filters"
          expanded={expandedSections.includes('quick')}
          onToggle={() => toggleSection('quick')}
        >
          <div className="space-y-3 pt-1">
            <label className="flex items-center gap-3 cursor-pointer group">
              <Checkbox
                id="filter-in-stock"
                checked={filters.inStock === true}
                onCheckedChange={(checked) => handleInStockChange(checked === true)}
              />
              <span className="text-sm group-hover:text-foreground transition-colors flex-1">
                In Stock Only
              </span>
              {categoryFilters && (
                <span className="text-xs text-muted-foreground">
                  ({categoryFilters.in_stock_count})
                </span>
              )}
            </label>
            {(categoryFilters?.has_on_sale ?? true) && (
              <label className="flex items-center gap-3 cursor-pointer group">
                <Checkbox
                  id="filter-on-sale"
                  checked={filters.onSale === true}
                  onCheckedChange={(checked) => handleOnSaleChange(checked === true)}
                />
                <span className="text-sm group-hover:text-foreground transition-colors">
                  On Sale
                </span>
              </label>
            )}
          </div>
        </FilterSection>
      </div>

      <Separator />

      {/* Categories/Subcategories */}
      {categories.length > 0 && (
        <>
          <div>
            <FilterSection
              title="Category"
              expanded={expandedSections.includes('categories')}
              onToggle={() => toggleSection('categories')}
            >
              <div className="space-y-2 max-h-48 overflow-y-auto pt-1">
                {categories.map((category) => (
                  <label
                    key={category.id}
                    className="flex items-center gap-3 cursor-pointer group"
                  >
                    <Checkbox
                      id={`filter-cat-${category.slug}`}
                      checked={filters.categories.includes(category.slug)}
                      onCheckedChange={(checked) =>
                        handleCategoryChange(category.slug, checked === true)
                      }
                    />
                    <span className="text-sm flex-1 flex items-center justify-between group-hover:text-foreground transition-colors">
                      <span>{category.name}</span>
                      {category.count !== undefined && category.count > 0 && (
                        <span className="text-muted-foreground text-xs">
                          ({category.count})
                        </span>
                      )}
                    </span>
                  </label>
                ))}
              </div>
            </FilterSection>
          </div>
          <Separator />
        </>
      )}

      {/* Price Range */}
      <div>
        <FilterSection
          title="Price"
          expanded={expandedSections.includes('price')}
          onToggle={() => toggleSection('price')}
        >
          <div className="pt-1">
            <FilterPriceRange
              min={effectiveMinPrice}
              max={effectiveMaxPrice}
              value={filters.priceRange}
              onChange={handlePriceChange}
            />
          </div>
        </FilterSection>
      </div>

      <Separator />

      {/* Product Rating */}
      <div>
        <FilterSection
          title="Product Rating"
          expanded={expandedSections.includes('rating')}
          onToggle={() => toggleSection('rating')}
        >
          <div className="space-y-2 pt-1">
            {[5, 4, 3, 2, 1].map((rating) => (
              <label
                key={rating}
                className="flex items-center gap-3 cursor-pointer group"
              >
                <Checkbox
                  checked={filters.rating === rating}
                  onCheckedChange={() => handleRatingChange(rating)}
                />
                <span className="flex items-center gap-1 group-hover:text-foreground transition-colors">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={cn(
                        'h-4 w-4',
                        i < rating
                          ? 'fill-amber-400 text-amber-400'
                          : 'fill-muted text-muted'
                      )}
                    />
                  ))}
                  <span className="text-sm ml-1">& Up</span>
                </span>
                {categoryFilters?.rating_counts?.[rating] !== undefined && (
                  <span className="text-xs text-muted-foreground ml-auto">
                    ({categoryFilters.rating_counts[rating]})
                  </span>
                )}
              </label>
            ))}
          </div>
        </FilterSection>
      </div>

      {/* Dynamic Attribute Filters (Brand, Size, Color, etc.) */}
      {categoryFilters?.attribute_filters?.map((section) => (
        <React.Fragment key={section.key}>
          <Separator />
          <div>
            <FilterSection
              title={section.label}
              expanded={expandedSections.includes(section.key)}
              onToggle={() => toggleSection(section.key)}
            >
              <div className="pt-1 space-y-2">
                {/* Search box for filters with many options */}
                {section.options.length > 6 && (
                  <div className="relative mb-2">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder={`Search ${section.label.toLowerCase()}...`}
                      value={searchTerms[section.key] || ''}
                      onChange={(e) =>
                        setSearchTerms((prev) => ({
                          ...prev,
                          [section.key]: e.target.value,
                        }))
                      }
                      className="pl-8 h-8 text-sm"
                    />
                  </div>
                )}
                <div className="max-h-48 overflow-y-auto space-y-2">
                  {filterOptions(section.options, section.key).map((option) => (
                    <label
                      key={option.value}
                      className="flex items-center gap-3 cursor-pointer group"
                    >
                      <Checkbox
                        checked={filters.attributes?.[section.key]?.includes(option.value) || false}
                        onCheckedChange={(checked) =>
                          handleAttributeChange(section.key, option.value, checked === true)
                        }
                      />
                      <span className="text-sm flex-1 flex items-center justify-between group-hover:text-foreground transition-colors">
                        <span>{option.label}</span>
                        {option.count > 0 && (
                          <span className="text-muted-foreground text-xs">
                            ({option.count})
                          </span>
                        )}
                      </span>
                    </label>
                  ))}
                  {filterOptions(section.options, section.key).length === 0 && (
                    <p className="text-sm text-muted-foreground py-2">
                      No matches found
                    </p>
                  )}
                </div>
              </div>
            </FilterSection>
          </div>
        </React.Fragment>
      ))}

      {/* Seller/Vendor Filter */}
      {categoryFilters?.vendors && categoryFilters.vendors.length > 0 && (
        <>
          <Separator />
          <div>
            <FilterSection
              title="Seller"
              expanded={expandedSections.includes('sellers')}
              onToggle={() => toggleSection('sellers')}
            >
              <div className="pt-1 space-y-2">
                {categoryFilters.vendors.length > 6 && (
                  <div className="relative mb-2">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search sellers..."
                      value={searchTerms['sellers'] || ''}
                      onChange={(e) =>
                        setSearchTerms((prev) => ({
                          ...prev,
                          sellers: e.target.value,
                        }))
                      }
                      className="pl-8 h-8 text-sm"
                    />
                  </div>
                )}
                <div className="max-h-48 overflow-y-auto space-y-2">
                  {categoryFilters.vendors
                    .filter((v) =>
                      !searchTerms['sellers'] ||
                      v.name.toLowerCase().includes(searchTerms['sellers'].toLowerCase())
                    )
                    .map((vendor) => (
                      <label
                        key={vendor.id}
                        className="flex items-center gap-3 cursor-pointer group"
                      >
                        <Checkbox
                          checked={filters.sellers.includes(vendor.id)}
                          onCheckedChange={(checked) =>
                            handleSellerChange(vendor.id, checked === true)
                          }
                        />
                        <span className="text-sm flex-1 group-hover:text-foreground transition-colors">
                          <span className="block">{vendor.name}</span>
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                            {vendor.rating.toFixed(1)}
                            <span className="ml-1">({vendor.count})</span>
                          </span>
                        </span>
                      </label>
                    ))}
                </div>
              </div>
            </FilterSection>
          </div>
        </>
      )}

      {/* Reset Button */}
      {hasActiveFilters && (
        <>
          <Separator />
          <Button
            variant="outline"
            className="w-full"
            onClick={handleResetFilters}
          >
            <X className="h-4 w-4 mr-2" />
            Reset All Filters
          </Button>
        </>
      )}
    </div>
  )

  return (
    <>
      {/* Desktop Filters - Alibaba Style Sticky Sidebar */}
      <aside className={cn('hidden lg:block w-72 flex-shrink-0', className)}>
        <div className="sticky top-20 bg-background rounded-xl border border-border shadow-sm overflow-hidden">
          {/* Header */}
          <div className="bg-primary/5 px-5 py-4 border-b border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="h-5 w-5 text-primary" />
                <h2 className="font-bold text-base">Filters</h2>
                {activeFilterCount > 0 && (
                  <span className="rounded-full bg-primary px-2.5 py-0.5 text-xs font-semibold text-primary-foreground">
                    {activeFilterCount}
                  </span>
                )}
              </div>
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleResetFilters}
                  className="text-xs h-8 text-primary hover:text-primary/90 hover:bg-primary/10 font-medium"
                >
                  Clear all
                </Button>
              )}
            </div>
          </div>

          {/* Filter Content with scroll */}
          <div className="max-h-[calc(100vh-12rem)] overflow-y-auto p-5">
            <FilterContent />
          </div>
        </div>
      </aside>

      {/* Mobile Filters Sheet */}
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" className="lg:hidden">
            <SlidersHorizontal className="h-4 w-4 mr-2" />
            Filters
            {activeFilterCount > 0 && (
              <span className="ml-2 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                {activeFilterCount}
              </span>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-80 overflow-y-auto">
          <SheetHeader>
            <div className="flex items-center justify-between">
              <SheetTitle>Filters</SheetTitle>
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleResetFilters}
                  className="text-xs h-7"
                >
                  Clear all
                </Button>
              )}
            </div>
          </SheetHeader>
          <div className="mt-6">
            <FilterContent />
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}

interface FilterSectionProps {
  title: string
  expanded: boolean
  onToggle: () => void
  children: React.ReactNode
}

function FilterSection({ title, expanded, onToggle, children }: FilterSectionProps) {
  return (
    <div>
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between py-2 text-sm font-medium hover:text-foreground transition-colors"
      >
        {title}
        <ChevronDown
          className={cn(
            'h-4 w-4 text-muted-foreground transition-transform duration-200',
            expanded && 'rotate-180'
          )}
        />
      </button>
      <div
        className={cn(
          'overflow-hidden transition-all duration-200',
          expanded ? 'max-h-[400px] opacity-100' : 'max-h-0 opacity-0'
        )}
      >
        {children}
      </div>
    </div>
  )
}
