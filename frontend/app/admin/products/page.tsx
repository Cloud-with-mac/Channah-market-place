'use client'

import * as React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  Search,
  MoreHorizontal,
  Eye,
  CheckCircle,
  XCircle,
  Package,
  Loader2,
  ExternalLink,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { adminAPI, productsAPI } from '@/lib/api'
import { formatPrice, formatDate } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

interface ProductItem {
  id: string
  name: string
  slug: string
  price: number
  status: string
  quantity: number
  primary_image?: string
  rating: number
  review_count: number
  vendor?: {
    id: string
    business_name: string
    slug: string
  }
  created_at: string
}

const statusConfig: Record<string, { label: string; className: string }> = {
  active: { label: 'Active', className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  draft: { label: 'Draft', className: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400' },
  pending: { label: 'Pending', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
  inactive: { label: 'Inactive', className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
  out_of_stock: { label: 'Out of Stock', className: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' },
}

export default function AdminProductsPage() {
  const { toast } = useToast()
  const [products, setProducts] = React.useState<ProductItem[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [searchQuery, setSearchQuery] = React.useState('')
  const [statusFilter, setStatusFilter] = React.useState<string>('all')
  const [actionProduct, setActionProduct] = React.useState<{ product: ProductItem; action: 'activate' | 'deactivate' } | null>(null)
  const [isUpdating, setIsUpdating] = React.useState(false)

  const fetchProducts = React.useCallback(async () => {
    setIsLoading(true)
    try {
      const params: Record<string, any> = { limit: 100 }
      if (statusFilter !== 'all') params.status = statusFilter

      const response = await productsAPI.getAll(params)
      setProducts(response.data?.items || response.data || [])
    } catch (error) {
      console.error('Failed to fetch products:', error)
    } finally {
      setIsLoading(false)
    }
  }, [statusFilter])

  React.useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  const handleStatusChange = async () => {
    if (!actionProduct) return

    setIsUpdating(true)
    try {
      const newStatus = actionProduct.action === 'activate' ? 'active' : 'inactive'
      await adminAPI.updateProductStatus(actionProduct.product.id, newStatus)
      setProducts(prev => prev.map(p =>
        p.id === actionProduct.product.id ? { ...p, status: newStatus } : p
      ))
      toast({
        title: `Product ${actionProduct.action}d`,
        description: `${actionProduct.product.name} has been ${actionProduct.action}d.`,
      })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.response?.data?.detail || `Failed to ${actionProduct.action} product`,
        variant: 'destructive',
      })
    } finally {
      setIsUpdating(false)
      setActionProduct(null)
    }
  }

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.vendor?.business_name?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold font-display">Product Moderation</h1>
        <p className="text-muted-foreground">
          Review and manage all products on the platform.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products or vendors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Products Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-16 w-16 rounded-md" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <Skeleton className="h-6 w-20" />
                </div>
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="p-16 text-center">
              <Package className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">No products found</h3>
              <p className="mt-2 text-muted-foreground">
                Try adjusting your search or filters.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[350px]">Product</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-[70px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => {
                  const status = statusConfig[product.status] || statusConfig.draft

                  return (
                    <TableRow key={product.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="relative h-12 w-12 rounded-md bg-muted overflow-hidden flex-shrink-0">
                            {product.primary_image ? (
                              <Image
                                src={product.primary_image}
                                alt={product.name}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center">
                                <Package className="h-5 w-5 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium truncate">{product.name}</p>
                            <p className="text-sm text-muted-foreground truncate">
                              /{product.slug}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {product.vendor ? (
                          <Link
                            href={`/vendor/${product.vendor.slug}`}
                            className="text-sm hover:underline"
                            target="_blank"
                          >
                            {product.vendor.business_name}
                          </Link>
                        ) : (
                          <span className="text-muted-foreground">N/A</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={status.className}>
                          {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatPrice(product.price)}</TableCell>
                      <TableCell>
                        <span className={product.quantity <= 5 ? 'text-destructive font-medium' : ''}>
                          {product.quantity}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(product.created_at)}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                              <Link href={`/product/${product.slug}`} target="_blank">
                                <Eye className="mr-2 h-4 w-4" />
                                View Product
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {product.status === 'active' ? (
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => setActionProduct({ product, action: 'deactivate' })}
                              >
                                <XCircle className="mr-2 h-4 w-4" />
                                Deactivate
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                onClick={() => setActionProduct({ product, action: 'activate' })}
                              >
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Activate
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Status Change Confirmation Dialog */}
      <AlertDialog
        open={!!actionProduct}
        onOpenChange={() => setActionProduct(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionProduct?.action === 'activate' ? 'Activate Product' : 'Deactivate Product'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actionProduct?.action === 'activate'
                ? `Are you sure you want to activate "${actionProduct.product.name}"? It will be visible to customers.`
                : `Are you sure you want to deactivate "${actionProduct?.product.name}"? It will be hidden from customers.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isUpdating}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleStatusChange}
              disabled={isUpdating}
              className={actionProduct?.action === 'deactivate' ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : ''}
            >
              {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {actionProduct?.action === 'activate' ? 'Activate' : 'Deactivate'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
