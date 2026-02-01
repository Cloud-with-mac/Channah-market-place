'use client'

import * as React from 'react'
import {
  Store,
  Search,
  Filter,
  Download,
  MoreHorizontal,
  CheckCircle,
  XCircle,
  Eye,
  Ban,
  Star,
  DollarSign,
  Package,
  Clock,
  ChevronLeft,
  ChevronRight,
  KeyRound,
  Copy,
  Loader2,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { formatDate, formatPrice, getInitials } from '@/lib/utils'
import { vendorsAPI } from '@/lib/api'
import { exportToCSV } from '@/lib/export'

interface Vendor {
  id: string
  business_name: string
  slug: string
  owner_name: string
  email: string
  phone: string
  status: 'pending' | 'approved' | 'rejected' | 'suspended'
  created_at: string
  verified_at?: string
  total_sales: number
  balance: number
  rating: number
  total_reviews: number
  total_products: number
  commission_rate: number
  logo?: string
}


function getStatusBadge(status: string) {
  switch (status) {
    case 'approved':
      return <Badge variant="success">Approved</Badge>
    case 'pending':
      return <Badge variant="warning">Pending</Badge>
    case 'rejected':
      return <Badge variant="destructive">Rejected</Badge>
    case 'suspended':
      return <Badge variant="destructive">Suspended</Badge>
    default:
      return <Badge variant="secondary">{status}</Badge>
  }
}

export default function VendorsPage() {
  const { toast } = useToast()
  const [vendors, setVendors] = React.useState<Vendor[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [search, setSearch] = React.useState('')
  const [statusFilter, setStatusFilter] = React.useState<string>('all')
  const [activeTab, setActiveTab] = React.useState('all')
  const [selectedVendor, setSelectedVendor] = React.useState<Vendor | null>(null)
  const [actionType, setActionType] = React.useState<'approve' | 'reject' | 'suspend' | null>(null)
  const [rejectionReason, setRejectionReason] = React.useState('')
  const [resetPasswordVendor, setResetPasswordVendor] = React.useState<Vendor | null>(null)
  const [newPassword, setNewPassword] = React.useState('')
  const [sendEmailNotification, setSendEmailNotification] = React.useState(true)
  const [isResettingPassword, setIsResettingPassword] = React.useState(false)

  const fetchVendors = React.useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await vendorsAPI.list({
        search: search || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
      })

      if (!response) {
        setVendors([])
        return
      }

      const vendorData = response.vendors || response.results || response || []
      const fetchedVendors = Array.isArray(vendorData) ? vendorData.map((v: any) => ({
        id: v.id,
        business_name: v.business_name,
        slug: v.slug,
        owner_name: v.owner_name || `${v.user?.first_name || ''} ${v.user?.last_name || ''}`.trim() || 'Unknown',
        email: v.email || v.user?.email || '',
        phone: v.phone || '',
        status: v.status,
        created_at: v.created_at,
        verified_at: v.verified_at,
        total_sales: v.total_sales || 0,
        balance: v.balance || 0,
        rating: v.rating || 0,
        total_reviews: v.total_reviews || 0,
        total_products: v.total_products || 0,
        commission_rate: v.commission_rate ?? 10,
        logo: v.logo_url,
      })) : []
      setVendors(fetchedVendors)
    } catch (error) {
      console.error('Failed to fetch vendors:', error)
      setVendors([])
    } finally {
      setIsLoading(false)
    }
  }, [search, statusFilter])

  React.useEffect(() => {
    fetchVendors()
  }, [fetchVendors])

  const filteredVendors = vendors.filter((vendor) => {
    const matchesSearch =
      vendor.business_name.toLowerCase().includes(search.toLowerCase()) ||
      vendor.owner_name.toLowerCase().includes(search.toLowerCase()) ||
      vendor.email.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === 'all' || vendor.status === statusFilter
    const matchesTab =
      activeTab === 'all' ||
      (activeTab === 'pending' && vendor.status === 'pending') ||
      (activeTab === 'approved' && vendor.status === 'approved') ||
      (activeTab === 'suspended' && vendor.status === 'suspended')
    return matchesSearch && matchesStatus && matchesTab
  })

  const pendingCount = vendors.filter((v) => v.status === 'pending').length

  const handleAction = async () => {
    if (!selectedVendor || !actionType) return

    try {
      let newStatus: Vendor['status'] = selectedVendor.status
      let message = ''

      switch (actionType) {
        case 'approve':
          await vendorsAPI.approve(selectedVendor.id)
          newStatus = 'approved'
          message = `${selectedVendor.business_name} has been approved.`
          break
        case 'reject':
          await vendorsAPI.reject(selectedVendor.id)
          newStatus = 'rejected'
          message = `${selectedVendor.business_name} has been rejected.`
          break
        case 'suspend':
          await vendorsAPI.suspend(selectedVendor.id)
          newStatus = 'suspended'
          message = `${selectedVendor.business_name} has been suspended.`
          break
      }

      setVendors((prev) =>
        prev.map((v) =>
          v.id === selectedVendor.id
            ? { ...v, status: newStatus, verified_at: actionType === 'approve' ? new Date().toISOString() : v.verified_at }
            : v
        )
      )

      toast({
        title: 'Action Completed',
        description: message,
      })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to perform action.',
        variant: 'destructive',
      })
    } finally {
      setSelectedVendor(null)
      setActionType(null)
      setRejectionReason('')
    }
  }

  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
    const array = new Uint32Array(12)
    crypto.getRandomValues(array)
    let password = ''
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(array[i] % chars.length)
    }
    setNewPassword(password)
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast({
        title: 'Copied',
        description: 'Password copied to clipboard.',
      })
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to copy to clipboard.',
        variant: 'destructive',
      })
    }
  }

  const handleResetPassword = async () => {
    if (!resetPasswordVendor || !newPassword) return

    setIsResettingPassword(true)
    try {
      // Call API to reset vendor password
      await vendorsAPI.resetPassword(resetPasswordVendor.id, {
        new_password: newPassword,
        send_notification: sendEmailNotification,
      })

      toast({
        title: 'Password Reset',
        description: `Password for ${resetPasswordVendor.business_name} has been reset.${sendEmailNotification ? ' An email notification has been sent.' : ''}`,
      })

      setResetPasswordVendor(null)
      setNewPassword('')
      setSendEmailNotification(true)
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to reset password. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsResettingPassword(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-10 w-full" />
        <Card>
          <CardContent className="p-0">
            <div className="space-y-4 p-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-20" />
              ))}
            </div>
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
          <h1 className="text-2xl font-bold font-display">Vendor Management</h1>
          <p className="text-muted-foreground">
            Manage vendor applications, approvals, and payouts.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => exportToCSV(vendors, 'vendors')}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Store className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{vendors.length}</p>
                <p className="text-sm text-muted-foreground">Total Vendors</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-warning/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center">
                <Clock className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingCount}</p>
                <p className="text-sm text-muted-foreground">Pending Approval</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {formatPrice(
                    vendors.reduce((sum, v) => sum + v.total_sales, 0),
                    'GBP'
                  )}
                </p>
                <p className="text-sm text-muted-foreground">Total Sales</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-gold/10 flex items-center justify-center">
                <Star className="h-5 w-5 text-gold" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {(
                    vendors
                      .filter((v) => v.rating > 0)
                      .reduce((sum, v) => sum + v.rating, 0) /
                      vendors.filter((v) => v.rating > 0).length || 0
                  ).toFixed(1)}
                </p>
                <p className="text-sm text-muted-foreground">Avg. Rating</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All Vendors</TabsTrigger>
          <TabsTrigger value="pending" className="relative">
            Pending
            {pendingCount > 0 && (
              <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 justify-center">
                {pendingCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="suspended">Suspended</TabsTrigger>
        </TabsList>

        <div className="mt-4 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search vendors..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Vendors List */}
        <Card className="mt-4">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="p-4 text-left text-sm font-medium">Vendor</th>
                    <th className="p-4 text-left text-sm font-medium">Status</th>
                    <th className="p-4 text-left text-sm font-medium">Products</th>
                    <th className="p-4 text-left text-sm font-medium">Sales</th>
                    <th className="p-4 text-left text-sm font-medium">Rating</th>
                    <th className="p-4 text-left text-sm font-medium">Balance</th>
                    <th className="p-4 text-left text-sm font-medium">Commission</th>
                    <th className="p-4 text-left text-sm font-medium">Joined</th>
                    <th className="p-4 text-right text-sm font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredVendors.map((vendor) => (
                    <tr
                      key={vendor.id}
                      className="border-b hover:bg-muted/50 transition-colors"
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={vendor.logo} />
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {getInitials(vendor.business_name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{vendor.business_name}</p>
                            <p className="text-sm text-muted-foreground">
                              {vendor.owner_name} • {vendor.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">{getStatusBadge(vendor.status)}</td>
                      <td className="p-4 text-sm">
                        <div className="flex items-center gap-1">
                          <Package className="h-4 w-4 text-muted-foreground" />
                          {vendor.total_products}
                        </div>
                      </td>
                      <td className="p-4 text-sm font-medium">
                        {formatPrice(vendor.total_sales, 'GBP')}
                      </td>
                      <td className="p-4">
                        {vendor.rating > 0 ? (
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 fill-gold text-gold" />
                            <span className="text-sm font-medium">{vendor.rating}</span>
                            <span className="text-xs text-muted-foreground">
                              ({vendor.total_reviews})
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">No reviews</span>
                        )}
                      </td>
                      <td className="p-4 text-sm">
                        {formatPrice(vendor.balance, 'GBP')}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1">
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            step="0.5"
                            defaultValue={vendor.commission_rate}
                            className="w-20 h-8 text-sm"
                            onBlur={async (e) => {
                              const newRate = parseFloat(e.target.value)
                              if (isNaN(newRate) || newRate === vendor.commission_rate) return
                              try {
                                await vendorsAPI.updateCommission(vendor.id, newRate)
                                setVendors(prev => prev.map(v => v.id === vendor.id ? { ...v, commission_rate: newRate } : v))
                                toast({ title: 'Updated', description: `Commission set to ${newRate}%` })
                              } catch {
                                e.target.value = String(vendor.commission_rate)
                                toast({ title: 'Error', description: 'Failed to update commission', variant: 'destructive' })
                              }
                            }}
                          />
                          <span className="text-xs text-muted-foreground">%</span>
                        </div>
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">
                        {formatDate(vendor.created_at)}
                      </td>
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
                            <DropdownMenuItem>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setResetPasswordVendor(vendor)
                                generatePassword()
                              }}
                            >
                              <KeyRound className="h-4 w-4 mr-2" />
                              Reset Password
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {vendor.status === 'pending' && (
                              <>
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedVendor(vendor)
                                    setActionType('approve')
                                  }}
                                >
                                  <CheckCircle className="h-4 w-4 mr-2 text-success" />
                                  Approve
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedVendor(vendor)
                                    setActionType('reject')
                                  }}
                                >
                                  <XCircle className="h-4 w-4 mr-2 text-destructive" />
                                  Reject
                                </DropdownMenuItem>
                              </>
                            )}
                            {vendor.status === 'approved' && (
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedVendor(vendor)
                                  setActionType('suspend')
                                }}
                              >
                                <Ban className="h-4 w-4 mr-2 text-destructive" />
                                Suspend
                              </DropdownMenuItem>
                            )}
                            {vendor.status === 'suspended' && (
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedVendor(vendor)
                                  setActionType('approve')
                                }}
                              >
                                <CheckCircle className="h-4 w-4 mr-2 text-success" />
                                Reactivate
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                  {filteredVendors.length === 0 && (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-muted-foreground">
                        No vendors found matching your criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between p-4 border-t">
              <p className="text-sm text-muted-foreground">
                Showing {filteredVendors.length} of {vendors.length} vendors
              </p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm">
                  1
                </Button>
                <Button variant="outline" size="sm">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </Tabs>

      {/* Action Confirmation Dialog */}
      <Dialog
        open={!!selectedVendor && !!actionType}
        onOpenChange={() => {
          setSelectedVendor(null)
          setActionType(null)
          setRejectionReason('')
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'approve' && 'Approve Vendor'}
              {actionType === 'reject' && 'Reject Vendor'}
              {actionType === 'suspend' && 'Suspend Vendor'}
            </DialogTitle>
            <DialogDescription>
              {actionType === 'approve' &&
                `Are you sure you want to approve ${selectedVendor?.business_name}? They will be able to list products and receive orders.`}
              {actionType === 'reject' &&
                `Are you sure you want to reject ${selectedVendor?.business_name}? They will be notified of this decision.`}
              {actionType === 'suspend' &&
                `Are you sure you want to suspend ${selectedVendor?.business_name}? Their products will be hidden from the marketplace.`}
            </DialogDescription>
          </DialogHeader>
          {actionType === 'reject' && (
            <div className="space-y-2">
              <Label htmlFor="reason">Rejection Reason</Label>
              <Textarea
                id="reason"
                placeholder="Please provide a reason for rejection..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
              />
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setSelectedVendor(null)
                setActionType(null)
                setRejectionReason('')
              }}
            >
              Cancel
            </Button>
            <Button
              variant={actionType === 'approve' ? 'default' : 'destructive'}
              onClick={handleAction}
            >
              {actionType === 'approve' && 'Approve'}
              {actionType === 'reject' && 'Reject'}
              {actionType === 'suspend' && 'Suspend'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog
        open={!!resetPasswordVendor}
        onOpenChange={() => {
          setResetPasswordVendor(null)
          setNewPassword('')
          setSendEmailNotification(true)
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reset Vendor Password</DialogTitle>
            <DialogDescription>
              Reset the password for {resetPasswordVendor?.business_name} ({resetPasswordVendor?.email})
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <div className="flex gap-2">
                <Input
                  id="new-password"
                  type="text"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => copyToClipboard(newPassword)}
                  disabled={!newPassword}
                  title="Copy password"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={generatePassword}
                className="mt-2"
              >
                <KeyRound className="h-4 w-4 mr-2" />
                Generate Strong Password
              </Button>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="send-email"
                checked={sendEmailNotification}
                onCheckedChange={(checked) => setSendEmailNotification(checked as boolean)}
              />
              <Label htmlFor="send-email" className="text-sm font-normal cursor-pointer">
                Send email notification to vendor with the new password
              </Label>
            </div>

            <div className="rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
              <p>
                <strong>Note:</strong> After resetting, the vendor will need to use this new password to log in.
                {sendEmailNotification
                  ? ' They will receive an email with the new password.'
                  : ' Make sure to communicate the new password to them securely.'}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setResetPasswordVendor(null)
                setNewPassword('')
                setSendEmailNotification(true)
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleResetPassword}
              disabled={!newPassword || isResettingPassword}
            >
              {isResettingPassword ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Resetting...
                </>
              ) : (
                'Reset Password'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
