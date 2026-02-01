'use client'

import * as React from 'react'
import Link from 'next/link'
import { Plus, Search, Package, MoreHorizontal, Edit, Trash2, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { vendorProductsAPI } from '@/lib/api'
import { useCurrencyStore } from '@/store'
import { useToast } from '@/hooks/use-toast'

interface Product {
  id: string
  name: string
  slug: string
  price: number
  stock: number
  status: string
  primary_image?: string
  images?: { url: string }[]
  category?: { name: string }
  created_at: string
}

export default function VendorProductsPage() {
  const { convertAndFormat } = useCurrencyStore()
  const [products, setProducts] = React.useState<Product[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [searchQuery, setSearchQuery] = React.useState('')
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await vendorProductsAPI.list({ limit: 50 })
        const data = Array.isArray(response) ? response : (response?.items || response?.results || [])
        setProducts(Array.isArray(data) ? data : [])
      } catch (err: any) {
        const status = err?.response?.status
        if (status === 404) {
          setError('vendor_not_found')
        } else if (status === 401 || status === 403) {
          setError('not_authenticated')
        } else {
          console.error('Failed to fetch products:', err)
        }
      } finally {
        setIsLoading(false)
      }
    }

    fetchProducts()
  }, [])

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      active: 'default',
      draft: 'secondary',
      out_of_stock: 'destructive',
    }
    return <Badge variant={variants[status] || 'outline'}>{status}</Badge>
  }

  const { toast } = useToast()
  const [deletingId, setDeletingId] = React.useState<string | null>(null)

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return
    setDeletingId(id)
    try {
      await vendorProductsAPI.delete(id)
      setProducts(products.filter(p => p.id !== id))
      toast({ title: 'Product deleted', description: 'The product has been removed.' })
    } catch (error) {
      console.error('Failed to delete product:', error)
      toast({ title: 'Delete failed', description: 'Could not delete the product. Please try again.', variant: 'destructive' })
    } finally {
      setDeletingId(null)
    }
  }

  if (error === 'vendor_not_found') {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <Package className="h-16 w-16 text-muted-foreground/30" />
        <h2 className="text-xl font-semibold">Vendor Profile Not Found</h2>
        <p className="text-muted-foreground text-center max-w-md">
          Your vendor profile hasn&apos;t been set up yet. Please complete your vendor registration to start managing products.
        </p>
      </div>
    )
  }

  if (error === 'not_authenticated') {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <Package className="h-16 w-16 text-muted-foreground/30" />
        <h2 className="text-xl font-semibold">Authentication Required</h2>
        <p className="text-muted-foreground text-center max-w-md">
          Please log in with your vendor account to manage products.
        </p>
        <Button asChild>
          <Link href="/login">Log In</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display">Products</h1>
          <p className="text-muted-foreground">Manage your product inventory</p>
        </div>
        <Button asChild>
          <Link href="/products/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">No products found</h3>
              <p className="text-muted-foreground text-sm mb-4">
                {searchQuery ? 'Try a different search term' : 'Add your first product to get started'}
              </p>
              {!searchQuery && (
                <Button asChild>
                  <Link href="/products/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Product
                  </Link>
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-muted overflow-hidden">
                          {(product.primary_image || product.images?.[0]?.url) && (
                            <img
                              src={product.primary_image || product.images?.[0]?.url}
                              alt={product.name}
                              className="h-full w-full object-cover"
                            />
                          )}
                        </div>
                        <span className="font-medium">{product.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {product.category?.name || '-'}
                    </TableCell>
                    <TableCell>{convertAndFormat(product.price)}</TableCell>
                    <TableCell>{product.stock}</TableCell>
                    <TableCell>{getStatusBadge(product.status)}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/products/${product.id}/edit`}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <a
                              href={`${process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000'}/product/${product.slug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              View
                            </a>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleDelete(product.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
