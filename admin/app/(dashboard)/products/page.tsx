'use client'

import * as React from 'react'
import {
  Package,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  ImageIcon,
  Loader2,
  Tag,
  Download,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/hooks/use-toast'
import { formatPrice, formatDate } from '@/lib/utils'
import { productsAPI } from '@/lib/api'
import { exportToCSV } from '@/lib/export'

interface ProductVariant {
  id: string
  name: string
  sku?: string
  price: number
  quantity: number
  options?: Record<string, string> | string
}

interface Product {
  id: string
  name: string
  slug: string
  price: number
  compare_price?: number
  vendor_name: string
  category?: string
  status: string
  stock_quantity: number
  sales_count: number
  created_at: string
  images: string[]
}

interface ProductDetail extends Product {
  description?: string
  short_description?: string
  sku?: string
  variants?: ProductVariant[]
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'active':
      return <Badge variant="success">Active</Badge>
    case 'draft':
      return <Badge variant="secondary">Draft</Badge>
    case 'pending':
      return <Badge variant="warning">Pending</Badge>
    case 'inactive':
      return <Badge variant="outline">Inactive</Badge>
    case 'out_of_stock':
      return <Badge variant="destructive">Out of Stock</Badge>
    case 'rejected':
      return <Badge variant="destructive">Rejected</Badge>
    default:
      return <Badge variant="secondary">{status}</Badge>
  }
}

export default function ProductsPage() {
  const { toast } = useToast()
  const [products, setProducts] = React.useState<Product[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [search, setSearch] = React.useState('')
  const [debouncedSearch, setDebouncedSearch] = React.useState('')
  const [statusFilter, setStatusFilter] = React.useState<string>('all')
  const [page, setPage] = React.useState(1)
  const [total, setTotal] = React.useState(0)
  const [productToDelete, setProductToDelete] = React.useState<Product | null>(null)
  const [productToView, setProductToView] = React.useState<ProductDetail | null>(null)
  const [isLoadingDetail, setIsLoadingDetail] = React.useState(false)
  const limit = 20

  // Debounce search
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
    }, 500)
    return () => clearTimeout(timer)
  }, [search])

  const fetchProductDetail = async (productId: string) => {
    setIsLoadingDetail(true)
    try {
      const response = await productsAPI.get(productId)
      setProductToView(response.data)
    } catch (error) {
      console.error('Failed to fetch product details:', error)
    } finally {
      setIsLoadingDetail(false)
    }
  }

  // Helper to parse variant options
  const parseVariantOptions = (options: Record<string, string> | string | undefined): Record<string, string> => {
    if (!options) return {}
    if (typeof options === 'string') {
      try {
        return JSON.parse(options)
      } catch {
        return {}
      }
    }
    return options
  }

  const fetchProducts = React.useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await productsAPI.list({
        page,
        limit,
        search: debouncedSearch || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
      })

      if (response) {
        setProducts(response.products || [])
        setTotal(response.total || 0)
      } else {
        setProducts([])
        setTotal(0)
      }
    } catch (error) {
      console.error('Failed to fetch products:', error)
      setProducts([])
      setTotal(0)
    } finally {
      setIsLoading(false)
    }
  }, [page, debouncedSearch, statusFilter])

  React.useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  const handleStatusChange = async (product: Product, newStatus: string) => {
    try {
      await productsAPI.update(product.id, { status: newStatus })
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, status: newStatus } : p))
      )
      toast({
        title: 'Status Updated',
        description: `${product.name} status changed to ${newStatus}.`,
      })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to update status.',
        variant: 'destructive',
      })
    }
  }

  const handleDelete = async () => {
    if (!productToDelete) return
    try {
      await productsAPI.delete(productToDelete.id)
      setProducts((prev) => prev.filter((p) => p.id !== productToDelete.id))
      toast({
        title: 'Product Deleted',
        description: `${productToDelete.name} has been deleted.`,
      })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to delete product.',
        variant: 'destructive',
      })
    } finally {
      setProductToDelete(null)
    }
  }

  const totalPages = Math.ceil(total / limit)

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="flex gap-4">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Card>
          <CardContent className="p-0">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-20 m-4" />
            ))}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display">Product Management</h1>
          <p className="text-muted-foreground">
            Manage all products across the marketplace.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => exportToCSV(products, 'products')}>
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="out_of_stock">Out of Stock</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Products Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="p-4 text-left text-sm font-medium">Product</th>
                  <th className="p-4 text-left text-sm font-medium">Vendor</th>
                  <th className="p-4 text-left text-sm font-medium">Price</th>
                  <th className="p-4 text-left text-sm font-medium">Stock</th>
                  <th className="p-4 text-left text-sm font-medium">Sales</th>
                  <th className="p-4 text-left text-sm font-medium">Status</th>
                  <th className="p-4 text-right text-sm font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id} className="border-b hover:bg-muted/50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
                          {product.images?.[0] ? (
                            <img
                              src={product.images[0]}
                              alt={product.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <ImageIcon className="h-6 w-6 text-muted-foreground" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-sm text-muted-foreground">{product.category || 'Uncategorized'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-sm">{product.vendor_name}</td>
                    <td className="p-4">
                      <div>
                        <p className="font-medium">{formatPrice(product.price, 'USD')}</p>
                        {product.compare_price && (
                          <p className="text-sm text-muted-foreground line-through">
                            {formatPrice(product.compare_price, 'USD')}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-sm">{product.stock_quantity}</td>
                    <td className="p-4 text-sm">{product.sales_count}</td>
                    <td className="p-4">{getStatusBadge(product.status)}</td>
                    <td className="p-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => fetchProductDetail(product.id)}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          {product.status !== 'active' && (
                            <DropdownMenuItem onClick={() => handleStatusChange(product, 'active')}>
                              <CheckCircle className="h-4 w-4 mr-2 text-success" />
                              Activate
                            </DropdownMenuItem>
                          )}
                          {product.status === 'active' && (
                            <DropdownMenuItem onClick={() => handleStatusChange(product, 'draft')}>
                              <XCircle className="h-4 w-4 mr-2 text-warning" />
                              Deactivate
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => setProductToDelete(product)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
                {products.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-muted-foreground">
                      <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No products found</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between p-4 border-t">
            <p className="text-sm text-muted-foreground">
              Showing {products.length} of {total} products
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm">
                Page {page} of {totalPages || 1}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!productToDelete} onOpenChange={() => setProductToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Product</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{productToDelete?.name}</strong>?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setProductToDelete(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Product Detail Dialog */}
      <Dialog open={!!productToView || isLoadingDetail} onOpenChange={() => setProductToView(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Product Details</DialogTitle>
          </DialogHeader>
          {isLoadingDetail ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : productToView ? (
            <div className="space-y-6">
              {/* Product Info */}
              <div className="flex gap-4">
                <div className="h-24 w-24 rounded-lg bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                  {productToView.images?.[0] ? (
                    <img
                      src={productToView.images[0]}
                      alt={productToView.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <ImageIcon className="h-8 w-8 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold">{productToView.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {productToView.vendor_name} • {productToView.category || 'Uncategorized'}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    {getStatusBadge(productToView.status)}
                    <span className="text-lg font-bold">{formatPrice(productToView.price, 'USD')}</span>
                    {productToView.compare_price && (
                      <span className="text-sm text-muted-foreground line-through">
                        {formatPrice(productToView.compare_price, 'USD')}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Description */}
              {productToView.description && (
                <div>
                  <h4 className="font-medium mb-2">Description</h4>
                  <p className="text-sm text-muted-foreground">{productToView.description}</p>
                </div>
              )}

              {/* Stock & SKU */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Stock Quantity:</span>
                  <span className="ml-2 font-medium">{productToView.stock_quantity}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Sales Count:</span>
                  <span className="ml-2 font-medium">{productToView.sales_count}</span>
                </div>
                {productToView.sku && (
                  <div>
                    <span className="text-muted-foreground">SKU:</span>
                    <span className="ml-2 font-medium">{productToView.sku}</span>
                  </div>
                )}
                <div>
                  <span className="text-muted-foreground">Created:</span>
                  <span className="ml-2 font-medium">{formatDate(productToView.created_at)}</span>
                </div>
              </div>

              {/* Variants */}
              {productToView.variants && productToView.variants.filter(v => v.name !== '__variants_enabled__').length > 0 && (
                <div>
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <Tag className="h-4 w-4" />
                    Product Variants ({productToView.variants.filter(v => v.name !== '__variants_enabled__').length})
                  </h4>
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-muted/50 border-b">
                          <th className="p-2 text-left font-medium">Variant</th>
                          <th className="p-2 text-left font-medium">Options</th>
                          <th className="p-2 text-right font-medium">Price</th>
                          <th className="p-2 text-right font-medium">Stock</th>
                        </tr>
                      </thead>
                      <tbody>
                        {productToView.variants
                          .filter(v => v.name !== '__variants_enabled__')
                          .map((variant, index) => {
                            const options = parseVariantOptions(variant.options)
                            // Skip placeholder options
                            const displayOptions = Object.entries(options).filter(([key]) => key !== '__variants_enabled__')
                            return (
                              <tr key={variant.id || index} className="border-b last:border-0">
                                <td className="p-2 font-medium">{variant.name}</td>
                                <td className="p-2">
                                  <div className="flex flex-wrap gap-1">
                                    {displayOptions.map(([key, value]) => (
                                      <Badge key={key} variant="secondary" className="text-xs">
                                        {key}: {value}
                                      </Badge>
                                    ))}
                                  </div>
                                </td>
                                <td className="p-2 text-right">{formatPrice(variant.price, 'USD')}</td>
                                <td className="p-2 text-right">
                                  <Badge variant={variant.quantity > 0 ? 'success' : 'destructive'}>
                                    {variant.quantity}
                                  </Badge>
                                </td>
                              </tr>
                            )
                          })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setProductToView(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
