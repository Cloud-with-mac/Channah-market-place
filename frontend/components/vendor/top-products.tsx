'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Package, ArrowRight, TrendingUp, Star, Eye } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

interface Product {
  id: string
  name: string
  slug: string
  image?: string
  price: number
  sales_count: number
  revenue: number
  rating: number
  stock: number
}

interface TopProductsProps {
  products: Product[]
  formatPrice: (price: number) => string
}

export function TopProducts({ products, formatPrice }: TopProductsProps) {
  const maxSales = products.length > 0 ? Math.max(...products.map(p => p.sales_count)) : 1

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/50">
            <TrendingUp className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          </div>
          <CardTitle className="text-lg">Top Products</CardTitle>
        </div>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/vendor/products" className="text-xs">
            View All <ArrowRight className="ml-1 h-3 w-3" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {products.length === 0 ? (
          <div className="text-center py-8">
            <Package className="mx-auto h-12 w-12 text-muted-foreground/30" />
            <p className="mt-4 text-muted-foreground text-sm">No products yet</p>
            <Button className="mt-4" size="sm" asChild>
              <Link href="/vendor/products/new">Add Your First Product</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {products.slice(0, 5).map((product, index) => (
              <div
                key={product.id}
                className={cn(
                  "flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors",
                  index < products.length - 1 && "border-b"
                )}
              >
                <div className="relative h-14 w-14 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                  {product.image ? (
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <Package className="h-6 w-6 text-muted-foreground absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                  )}
                  <div className="absolute top-1 left-1 bg-background/80 rounded-full px-1.5 py-0.5 text-[10px] font-bold">
                    #{index + 1}
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{product.name}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-muted-foreground">
                      {product.sales_count} sales
                    </span>
                    <span className="flex items-center text-xs text-amber-600 dark:text-amber-400">
                      <Star className="h-3 w-3 fill-current mr-0.5" />
                      {product.rating.toFixed(1)}
                    </span>
                  </div>
                  <Progress
                    value={(product.sales_count / maxSales) * 100}
                    className="h-1.5 mt-2"
                  />
                </div>

                <div className="text-right">
                  <p className="font-semibold text-sm">{formatPrice(product.revenue)}</p>
                  <p className="text-xs text-muted-foreground">Revenue</p>
                </div>

                <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                  <Link href={`/vendor/products/${product.id}/edit`}>
                    <Eye className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
