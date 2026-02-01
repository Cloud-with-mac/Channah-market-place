'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { ChevronRight, Package, Loader2, Grid3x3 } from 'lucide-react'
import { categoriesAPI } from '@/lib/api'

interface Category {
  id: string
  name: string
  slug: string
  icon?: string
  image_url?: string
  product_count?: number
  children?: Category[]
}

interface MegaMenuProps {
  isOpen: boolean
  onClose: () => void
}

export function MegaMenu({ isOpen, onClose }: MegaMenuProps) {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null)

  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await categoriesAPI.getTree()
        const cats = Array.isArray(res) ? res : res.results || []
        setCategories(cats)
        // Auto-select first category
        if (cats.length > 0) {
          setHoveredCategory(cats[0].id)
        }
      } catch (error) {
        console.error('Failed to fetch categories:', error)
        // Fallback to flat list
        try {
          const res = await categoriesAPI.getAll()
          const cats = res.results || res || []
          setCategories(cats)
        } catch {
          setCategories([])
        }
      } finally {
        setLoading(false)
      }
    }
    fetchCategories()
  }, [])

  if (!isOpen) return null

  const activeCategory = categories.find((c) => c.id === hoveredCategory)
  const subcategories = activeCategory?.children || []

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 z-40"
        onClick={onClose}
      />

      {/* Mega Menu Content */}
      <div className="absolute left-0 right-0 top-full bg-background border-t border-b border-border shadow-2xl z-50 max-h-[70vh] overflow-y-auto">
        <div className="container py-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : categories.length > 0 ? (
            <div className="grid grid-cols-12 gap-0">
              {/* Left: Parent Category List */}
              <div className="col-span-3 border-r border-border pr-2">
                <h3 className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider px-4">
                  All Categories
                </h3>
                <div className="space-y-0.5 max-h-[420px] overflow-y-auto">
                  {categories.map((category) => (
                    <Link
                      key={category.id}
                      href={`/category/${category.slug}`}
                      className={`group flex items-center justify-between px-4 py-2.5 rounded-lg transition-colors ${
                        hoveredCategory === category.id
                          ? 'bg-primary/10 text-primary'
                          : 'hover:bg-muted/50'
                      }`}
                      onMouseEnter={() => setHoveredCategory(category.id)}
                      onClick={onClose}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          hoveredCategory === category.id
                            ? 'bg-primary/20'
                            : 'bg-primary/10'
                        }`}>
                          <Package className="h-4 w-4 text-primary" />
                        </div>
                        <span className="text-sm font-medium">
                          {category.name}
                        </span>
                      </div>
                      {(category.children?.length || 0) > 0 && (
                        <ChevronRight className={`h-4 w-4 transition-colors ${
                          hoveredCategory === category.id
                            ? 'text-primary'
                            : 'text-muted-foreground'
                        }`} />
                      )}
                    </Link>
                  ))}
                </div>
                <Link
                  href="/products"
                  className="mt-3 flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary hover:underline"
                  onClick={onClose}
                >
                  <Grid3x3 className="h-4 w-4" />
                  View All Products
                </Link>
              </div>

              {/* Middle: Subcategories Panel */}
              <div className="col-span-5 px-6">
                {activeCategory && (
                  <>
                    <h3 className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider">
                      {activeCategory.name}
                    </h3>
                    {subcategories.length > 0 ? (
                      <div className="grid grid-cols-2 gap-x-6 gap-y-1">
                        {subcategories.map((sub) => (
                          <Link
                            key={sub.id}
                            href={`/category/${sub.slug}`}
                            className="group flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-primary/5 transition-colors"
                            onClick={onClose}
                          >
                            <div className="h-2 w-2 rounded-full bg-primary/30 group-hover:bg-primary transition-colors flex-shrink-0" />
                            <div>
                              <p className="text-sm font-medium group-hover:text-primary transition-colors">
                                {sub.name}
                              </p>
                              {(sub.product_count ?? 0) > 0 && (
                                <p className="text-xs text-muted-foreground">
                                  {sub.product_count} items
                                </p>
                              )}
                            </div>
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground px-3">
                        Browse all {activeCategory.name.toLowerCase()} products
                      </p>
                    )}
                    <Link
                      href={`/category/${activeCategory.slug}`}
                      className="mt-4 inline-flex items-center gap-1 px-3 text-sm font-medium text-primary hover:underline"
                      onClick={onClose}
                    >
                      View all {activeCategory.name}
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                  </>
                )}
              </div>

              {/* Right: Quick Links & Promotion */}
              <div className="col-span-4 pl-6 border-l border-border space-y-5">
                {/* Quick Links */}
                <div>
                  <h3 className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider">
                    Quick Links
                  </h3>
                  <div className="space-y-1">
                    <Link
                      href="/new-arrivals"
                      className="block px-3 py-2 text-sm rounded-lg hover:bg-primary/5 hover:text-primary transition-colors"
                      onClick={onClose}
                    >
                      New Arrivals
                    </Link>
                    <Link
                      href="/best-sellers"
                      className="block px-3 py-2 text-sm rounded-lg hover:bg-primary/5 hover:text-primary transition-colors"
                      onClick={onClose}
                    >
                      Best Sellers
                    </Link>
                    <Link
                      href="/vendors"
                      className="block px-3 py-2 text-sm rounded-lg hover:bg-primary/5 hover:text-primary transition-colors"
                      onClick={onClose}
                    >
                      Find Suppliers
                    </Link>
                  </div>
                </div>

                {/* Promotion Banner */}
                <div className="rounded-xl bg-gradient-to-br from-primary to-accent p-5 text-white">
                  <h4 className="text-sm font-bold mb-1.5">Trade Services</h4>
                  <p className="text-xs mb-3 text-white/90">
                    Get quotes from verified suppliers worldwide
                  </p>
                  <Link
                    href="/products"
                    className="inline-block px-4 py-2 bg-white text-primary rounded-lg text-xs font-semibold hover:bg-white/90 transition-colors"
                    onClick={onClose}
                  >
                    Request Quote
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No categories available</p>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
