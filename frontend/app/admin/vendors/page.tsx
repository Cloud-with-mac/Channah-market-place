'use client'

import * as React from 'react'
import Link from 'next/link'
import {
  Search,
  MoreHorizontal,
  CheckCircle,
  XCircle,
  Ban,
  Store,
  ExternalLink,
  Loader2,
  Clock,
  Check,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { adminAPI, vendorsAPI } from '@/lib/api'
import { formatDate } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

interface VendorItem {
  id: string
  business_name: string
  slug: string
  description?: string
  email: string
  phone?: string
  status: string
  rating: number
  total_sales: number
  total_products: number
  created_at: string
  user?: {
    name: string
    email: string
  }
}

const statusConfig: Record<string, { label: string; className: string }> = {
  pending: { label: 'Pending', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
  approved: { label: 'Approved', className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  rejected: { label: 'Rejected', className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
  suspended: { label: 'Suspended', className: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' },
}

export default function AdminVendorsPage() {
  const { toast } = useToast()
  const [pendingVendors, setPendingVendors] = React.useState<VendorItem[]>([])
  const [allVendors, setAllVendors] = React.useState<VendorItem[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [searchQuery, setSearchQuery] = React.useState('')
  const [actionVendor, setActionVendor] = React.useState<{ vendor: VendorItem; action: 'approve' | 'reject' | 'suspend' } | null>(null)
  const [detailVendor, setDetailVendor] = React.useState<VendorItem | null>(null)
  const [isUpdating, setIsUpdating] = React.useState(false)
  const [activeTab, setActiveTab] = React.useState('pending')

  const fetchVendors = React.useCallback(async () => {
    setIsLoading(true)
    try {
      const [pendingRes, allRes] = await Promise.all([
        adminAPI.listPendingVendors(),
        vendorsAPI.getAll(),
      ])
      setPendingVendors(pendingRes.data || [])
      setAllVendors(allRes.data || [])
    } catch (error) {
      console.error('Failed to fetch vendors:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchVendors()
  }, [fetchVendors])

  const handleAction = async () => {
    if (!actionVendor) return

    setIsUpdating(true)
    try {
      switch (actionVendor.action) {
        case 'approve':
          await adminAPI.approveVendor(actionVendor.vendor.id)
          break
        case 'reject':
          await adminAPI.rejectVendor(actionVendor.vendor.id)
          break
        case 'suspend':
          await adminAPI.suspendVendor(actionVendor.vendor.id)
          break
      }

      toast({
        title: `Vendor ${actionVendor.action}d`,
        description: `${actionVendor.vendor.business_name} has been ${actionVendor.action}d.`,
      })

      fetchVendors()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.response?.data?.detail || `Failed to ${actionVendor.action} vendor`,
        variant: 'destructive',
      })
    } finally {
      setIsUpdating(false)
      setActionVendor(null)
    }
  }

  const filteredPendingVendors = pendingVendors.filter(vendor =>
    vendor.business_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    vendor.email?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredAllVendors = allVendors.filter(vendor =>
    vendor.business_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    vendor.email?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const renderVendorTable = (vendors: VendorItem[], showActions: boolean = true) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Business Name</TableHead>
          <TableHead>Contact</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Products</TableHead>
          <TableHead>Joined</TableHead>
          <TableHead className="w-[70px]"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {vendors.map((vendor) => {
          const status = statusConfig[vendor.status] || statusConfig.pending

          return (
            <TableRow key={vendor.id}>
              <TableCell>
                <div>
                  <p className="font-medium">{vendor.business_name}</p>
                  <p className="text-sm text-muted-foreground">/{vendor.slug}</p>
                </div>
              </TableCell>
              <TableCell>
                <div>
                  <p className="text-sm">{vendor.email}</p>
                  {vendor.phone && (
                    <p className="text-sm text-muted-foreground">{vendor.phone}</p>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="secondary" className={status.className}>
                  {status.label}
                </Badge>
              </TableCell>
              <TableCell>{vendor.total_products || 0}</TableCell>
              <TableCell className="text-muted-foreground">
                {formatDate(vendor.created_at)}
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
                    <DropdownMenuItem onClick={() => setDetailVendor(vendor)}>
                      <Store className="mr-2 h-4 w-4" />
                      View Details
                    </DropdownMenuItem>
                    {vendor.status === 'approved' && (
                      <DropdownMenuItem asChild>
                        <Link href={`/vendor/${vendor.slug}`} target="_blank">
                          <ExternalLink className="mr-2 h-4 w-4" />
                          Visit Store
                        </Link>
                      </DropdownMenuItem>
                    )}
                    {showActions && (
                      <>
                        <DropdownMenuSeparator />
                        {vendor.status === 'pending' && (
                          <>
                            <DropdownMenuItem
                              onClick={() => setActionVendor({ vendor, action: 'approve' })}
                            >
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Approve
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => setActionVendor({ vendor, action: 'reject' })}
                            >
                              <XCircle className="mr-2 h-4 w-4" />
                              Reject
                            </DropdownMenuItem>
                          </>
                        )}
                        {vendor.status === 'approved' && (
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => setActionVendor({ vendor, action: 'suspend' })}
                          >
                            <Ban className="mr-2 h-4 w-4" />
                            Suspend
                          </DropdownMenuItem>
                        )}
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold font-display">Vendor Management</h1>
        <p className="text-muted-foreground">
          Review and manage vendor applications and accounts.
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-yellow-100 dark:bg-yellow-900/30">
                <Clock className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingVendors.length}</p>
                <p className="text-sm text-muted-foreground">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-green-100 dark:bg-green-900/30">
                <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {allVendors.filter(v => v.status === 'approved').length}
                </p>
                <p className="text-sm text-muted-foreground">Approved</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-red-100 dark:bg-red-900/30">
                <X className="h-4 w-4 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {allVendors.filter(v => v.status === 'rejected').length}
                </p>
                <p className="text-sm text-muted-foreground">Rejected</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-orange-100 dark:bg-orange-900/30">
                <Ban className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {allVendors.filter(v => v.status === 'suspended').length}
                </p>
                <p className="text-sm text-muted-foreground">Suspended</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search vendors..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="pending">
            Pending Approval
            {pendingVendors.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {pendingVendors.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="all">All Vendors</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-4">
          <Card>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-4 space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <Skeleton className="h-10 w-10 rounded" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-48" />
                        <Skeleton className="h-3 w-32" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredPendingVendors.length === 0 ? (
                <div className="p-16 text-center">
                  <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
                  <h3 className="mt-4 text-lg font-semibold">All caught up!</h3>
                  <p className="mt-2 text-muted-foreground">
                    No pending vendor applications to review.
                  </p>
                </div>
              ) : (
                renderVendorTable(filteredPendingVendors)
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="all" className="mt-4">
          <Card>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-4 space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <Skeleton className="h-10 w-10 rounded" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-48" />
                        <Skeleton className="h-3 w-32" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredAllVendors.length === 0 ? (
                <div className="p-16 text-center">
                  <Store className="mx-auto h-12 w-12 text-muted-foreground/50" />
                  <h3 className="mt-4 text-lg font-semibold">No vendors found</h3>
                  <p className="mt-2 text-muted-foreground">
                    Try adjusting your search.
                  </p>
                </div>
              ) : (
                renderVendorTable(filteredAllVendors)
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Action Confirmation Dialog */}
      <AlertDialog
        open={!!actionVendor}
        onOpenChange={() => setActionVendor(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionVendor?.action === 'approve' && 'Approve Vendor'}
              {actionVendor?.action === 'reject' && 'Reject Vendor'}
              {actionVendor?.action === 'suspend' && 'Suspend Vendor'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actionVendor?.action === 'approve' &&
                `Are you sure you want to approve ${actionVendor.vendor.business_name}? They will be able to start selling products.`}
              {actionVendor?.action === 'reject' &&
                `Are you sure you want to reject ${actionVendor?.vendor.business_name}? They will need to reapply.`}
              {actionVendor?.action === 'suspend' &&
                `Are you sure you want to suspend ${actionVendor?.vendor.business_name}? Their products will be hidden and they won't be able to receive orders.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isUpdating}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleAction}
              disabled={isUpdating}
              className={
                actionVendor?.action === 'reject' || actionVendor?.action === 'suspend'
                  ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
                  : ''
              }
            >
              {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {actionVendor?.action === 'approve' && 'Approve'}
              {actionVendor?.action === 'reject' && 'Reject'}
              {actionVendor?.action === 'suspend' && 'Suspend'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Vendor Details Dialog */}
      <Dialog open={!!detailVendor} onOpenChange={() => setDetailVendor(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{detailVendor?.business_name}</DialogTitle>
            <DialogDescription>Vendor details and information</DialogDescription>
          </DialogHeader>
          {detailVendor && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{detailVendor.email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium">{detailVendor.phone || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge
                    variant="secondary"
                    className={statusConfig[detailVendor.status]?.className}
                  >
                    {statusConfig[detailVendor.status]?.label}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Joined</p>
                  <p className="font-medium">{formatDate(detailVendor.created_at)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Products</p>
                  <p className="font-medium">{detailVendor.total_products || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Sales</p>
                  <p className="font-medium">${detailVendor.total_sales?.toFixed(2) || '0.00'}</p>
                </div>
              </div>
              {detailVendor.description && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Description</p>
                  <p className="text-sm">{detailVendor.description}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
