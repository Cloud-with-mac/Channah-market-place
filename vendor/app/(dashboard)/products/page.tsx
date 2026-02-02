'use client'

import * as React from 'react'
import Link from 'next/link'
import { Plus, Search, Package, MoreHorizontal, Edit, Trash2, Eye, Check, X, AlertTriangle } from 'lucide-react'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { vendorProductsAPI, vendorInventoryAPI } from '@/lib/api'
import { useCurrencyStore } from '@/store'
import { useToast } from '@/hooks/use-toast'

interface Product {
  id: string
  name: string
  slug: string
  price: number
  compare_at_price?: number
  stock: number
  status: string
  sku?: string
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
  const [statusFilter, setStatusFilter] = React.useState('all')
  const [error, setError] = React.useState<string | null>(null)
  const [editingStockId, setEditingStockId] = React.useState<string | null>(null)
  const [editingStockValue, setEditingStockValue] = React.useState<number>(0)
  const [savingStock, setSavingStock] = React.useState(false)

  const { toast } = useToast()
  const [deletingId, setDeletingId] = React.useState<string | null>(null)

  const fetchProducts = React.useCallback(async () => {
    try {
      const params: any = { limit: 100 }
      if (statusFilter !== 'all') params.status = statusFilter
      const response = await vendorProductsAPI.list(params)
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
  }, [statusFilter])

  React.useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const lowStockProducts = products.filter(p => p.stock > 0 && p.stock <= 5)

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      active: 'default',
      draft: 'secondary',
      out_of_stock: 'destructive',
      inactive: 'outline',
    }
    const labels: Record<string, string> = {
      active: 'Active',
      draft: 'Draft',
      out_of_stock: 'Out of Stock',
      inactive: 'Inactive',
    }
    return <Badge variant={variants[status] || 'outline'}>{labels[status] || status}</Badge>
  }

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

  const handleStartEditStock = (product: Product) => {
    setEditingStockId(product.id)
    setEditingStockValue(product.stock)
  }

  const handleSaveStock = async () => {
    if (!editingStockId) return
    setSavingStock(true)
    try {
      await vendorInventoryAPI.updateStock(editingStockId, editingStockValue)
      setProducts(products.map(p =>
        p.id === editingStockId ? { ...p, stock: editingStockValue } : p
      ))
      toast({ title: 'Stock updated', description: `Stock quantity set to ${editingStockValue}.` })
      setEditingStockId(null)
    } catch (error) {
      console.error('Failed to update stock:', error)
      toast({ title: 'Update failed', description: 'Could not update stock. Please try again.', variant: 'destructive' })
    } finally {
      setSavingStock(false)
    }
  }

  const handleCancelEditStock = () => {
    setEditingStockId(null)
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
          <p className="text-muted-foreground">Manage your product inventory ({products.length} products)</p>
        </div>
        <Button asChild>
          <Link href="/products/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Link>
        </Button>
      </div>

      {/* Low Stock Alert */}
      {lowStockProducts.length > 0 && (
        <Card className="border-yellow-500/50 bg-yellow-500/5">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-500 flex-shrink-0" />
              <div>
                <p className="font-medium text-sm">Low Stock Alert</p>
                <p className="text-muted-foreground text-sm">
                  {lowStockProducts.length} product{lowStockProducts.length > 1 ? 's have' : ' has'} low stock:{' '}
                  {lowStockProducts.slice(0, 3).map(p => p.name).join(', ')}
                  {lowStockProducts.length > 3 && ` and ${lowStockProducts.length - 3} more`}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Filter status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
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
                        <div className="h-10 w-10 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                          {(product.primary_image || product.images?.[0]?.url) && (
                            <img
                              src={product.primary_image || product.images?.[0]?.url}
                              alt={product.name}
                              className="h-full w-full object-cover"
                            />
                          )}
                        </div>
                        <div>
                          <span className="font-medium">{product.name}</span>
                          {product.sku && (
                            <p className="text-xs text-muted-foreground">SKU: {product.sku}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {product.category?.name || '-'}
                    </TableCell>
                    <TableCell>
                      <div>
                        {convertAndFormat(product.price)}
                        {product.compare_at_price && (
                          <span className="text-xs text-muted-foreground line-through ml-1">
                            {convertAndFormat(product.compare_at_price)}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {editingStockId === product.id ? (
                        <div className="flex items-center gap-1">
                          <Input
                            type="number"
                            min={0}
                            value={editingStockValue}
                            onChange={(e) => setEditingStockValue(parseInt(e.target.value) || 0)}
                            className="w-20 h-8 text-sm"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveStock()
                              if (e.key === 'Escape') handleCancelEditStock()
                            }}
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={handleSaveStock}
                            disabled={savingStock}
                          >
                            <Check className="h-3.5 w-3.5 text-green-500" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={handleCancelEditStock}
                          >
                            <X className="h-3.5 w-3.5 text-muted-foreground" />
                          </Button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleStartEditStock(product)}
                          className={`text-sm cursor-pointer hover:underline ${
                            product.stock <= 5 && product.stock > 0
                              ? 'text-yellow-500 font-medium'
                              : product.stock === 0
                                ? 'text-destructive font-medium'
                                : ''
                          }`}
                          title="Click to edit stock"
                        >
                          {product.stock}
                          {product.stock <= 5 && product.stock > 0 && ' (Low)'}
                          {product.stock === 0 && ' (Out)'}
                        </button>
                      )}
                    </TableCell>
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
                              View on Store
                            </a>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleDelete(product.id)}
                            disabled={deletingId === product.id}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            {deletingId === product.id ? 'Deleting...' : 'Delete'}
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
