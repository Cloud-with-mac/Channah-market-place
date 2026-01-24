'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Grid3X3, ArrowRight, FolderOpen } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { categoriesAPI } from '@/lib/api'

interface Category {
  id: string
  name: string
  slug: string
  image_url?: string
  product_count?: number
  description?: string
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchCategories() {
      try {
        const response = await categoriesAPI.getAll()
        const data = response.data?.results || response.data || []
        setCategories(data)
      } catch {
        setCategories([])
      } finally {
        setLoading(false)
      }
    }
    fetchCategories()
  }, [])

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="bg-gradient-to-br from-navy-dark via-navy to-cyan-dark/30 text-white py-16">
        <div className="container text-center">
          <Badge className="bg-cyan/20 text-cyan border border-cyan/30 mb-4">
            <Grid3X3 className="h-3 w-3 mr-1" />
            Browse
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold font-display mb-4">All Categories</h1>
          <p className="text-xl text-white/70 max-w-2xl mx-auto">
            Explore our wide range of product categories from sellers worldwide
          </p>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="py-16">
        <div className="container">
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="aspect-[4/3] w-full rounded-xl" />
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))}
            </div>
          ) : categories.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {categories.map((category) => (
                <Link
                  key={category.id}
                  href={`/category/${category.slug}`}
                  className="group"
                >
                  <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-card border border-border hover:border-cyan/50 transition-all">
                    {category.image_url ? (
                      <img
                        src={category.image_url}
                        alt={category.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-cyan/20 to-primary/20 flex items-center justify-center">
                        <FolderOpen className="h-12 w-12 text-cyan/50" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-navy/90 via-navy/30 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <h3 className="text-lg font-bold text-white mb-1">{category.name}</h3>
                      <p className="text-sm text-white/60">
                        {category.product_count?.toLocaleString() || 0} products
                      </p>
                    </div>
                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="p-2 rounded-full bg-cyan text-navy">
                        <ArrowRight className="h-4 w-4" />
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <FolderOpen className="h-16 w-16 text-muted-foreground/50 mb-4" />
              <h3 className="text-xl font-semibold mb-2">No categories yet</h3>
              <p className="text-muted-foreground mb-6 max-w-md">
                Categories will appear here once they are added from the admin dashboard.
              </p>
              <Button variant="outline" asChild>
                <Link href="/products">Browse All Products</Link>
              </Button>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
