'use client'

import * as React from 'react'
import { useState, useMemo } from 'react'
import {
  Plus,
  Search,
  Filter,
  Calendar,
  Package,
  DollarSign,
  MapPin,
  Clock,
  Award,
  TrendingUp,
  FileText,
  Users,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Send,
  Edit,
  Trash2,
  Eye,
  Building2,
  Shield,
  Truck,
  CreditCard,
} from 'lucide-react'
import { format } from 'date-fns'
import { useSourcingStore, SourcingRequest, SourcingBid } from '@/store/sourcing-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

// Mock user ID (in production, get from auth)
const CURRENT_USER_ID = 'buyer-123'
const CURRENT_VENDOR_ID = 'vendor-456'
const CURRENT_VENDOR_NAME = 'Premium Supplies Co.'

export default function SourcingPage() {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState<'browse' | 'my-requests'>('browse')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [selectedRequest, setSelectedRequest] = useState<SourcingRequest | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showBidDialog, setShowBidDialog] = useState(false)
  const [expandedRequests, setExpandedRequests] = useState<Set<string>>(new Set())

  const { requests, createRequest, deleteRequest, closeRequest, awardRequest, addBid, getOpenRequests, getMyRequests } = useSourcingStore()

  // Filter requests
  const filteredRequests = useMemo(() => {
    let result = activeTab === 'browse' ? getOpenRequests() : getMyRequests(CURRENT_USER_ID)

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (req) =>
          req.title.toLowerCase().includes(query) ||
          req.description.toLowerCase().includes(query) ||
          req.category.toLowerCase().includes(query)
      )
    }

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter((req) => req.status === statusFilter)
    }

    // Category filter
    if (categoryFilter !== 'all') {
      result = result.filter((req) => req.category === categoryFilter)
    }

    return result
  }, [requests, activeTab, searchQuery, statusFilter, categoryFilter, getOpenRequests, getMyRequests])

  // Get unique categories
  const categories = useMemo(() => {
    const cats = new Set(requests.map((req) => req.category))
    return Array.from(cats)
  }, [requests])

  const toggleRequestExpansion = (id: string) => {
    setExpandedRequests((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const getStatusBadge = (status: SourcingRequest['status']) => {
    const variants: Record<SourcingRequest['status'], { variant: any; label: string; icon: any }> = {
      open: { variant: 'default', label: 'Open', icon: FileText },
      bidding: { variant: 'warning', label: 'Bidding', icon: TrendingUp },
      awarded: { variant: 'success', label: 'Awarded', icon: Award },
      closed: { variant: 'secondary', label: 'Closed', icon: XCircle },
    }
    const config = variants[status]
    const Icon = config.icon
    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    )
  }

  const getBidStatusBadge = (status: SourcingBid['status']) => {
    const variants: Record<SourcingBid['status'], { variant: any; label: string }> = {
      pending: { variant: 'outline', label: 'Pending' },
      accepted: { variant: 'success', label: 'Accepted' },
      rejected: { variant: 'destructive', label: 'Rejected' },
    }
    const config = variants[status]
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Header */}
      <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-background border-b">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-3xl">
            <h1 className="text-4xl font-bold font-display mb-3">Product Sourcing</h1>
            <p className="text-lg text-muted-foreground mb-6">
              Connect with verified suppliers to source products at competitive prices. Post your requirements and receive bids from qualified vendors.
            </p>
            <div className="flex flex-wrap gap-3">
              <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogTrigger asChild>
                  <Button size="lg" className="gap-2">
                    <Plus className="h-5 w-5" />
                    Create Sourcing Request
                  </Button>
                </DialogTrigger>
                <CreateRequestDialog
                  onClose={() => setShowCreateDialog(false)}
                  onCreate={createRequest}
                  toast={toast}
                />
              </Dialog>
              <Button size="lg" variant="outline" className="gap-2">
                <Building2 className="h-5 w-5" />
                Vendor Directory
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="browse" className="gap-2">
              <Search className="h-4 w-4" />
              Browse Requests
            </TabsTrigger>
            <TabsTrigger value="my-requests" className="gap-2">
              <FileText className="h-4 w-4" />
              My Requests
            </TabsTrigger>
          </TabsList>

          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="search">Search</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="search"
                      placeholder="Search requests..."
                      className="pl-9"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger id="status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="bidding">Bidding</SelectItem>
                      <SelectItem value="awarded">Awarded</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger id="category">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Browse Requests Tab */}
          <TabsContent value="browse" className="space-y-4">
            {filteredRequests.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Package className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No sourcing requests found</h3>
                  <p className="text-sm text-muted-foreground text-center max-w-md">
                    {searchQuery || statusFilter !== 'all' || categoryFilter !== 'all'
                      ? 'Try adjusting your filters to see more results.'
                      : 'Be the first to create a sourcing request and connect with vendors.'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredRequests.map((request) => (
                <RequestCard
                  key={request.id}
                  request={request}
                  expanded={expandedRequests.has(request.id)}
                  onToggleExpand={() => toggleRequestExpansion(request.id)}
                  onBid={() => {
                    setSelectedRequest(request)
                    setShowBidDialog(true)
                  }}
                  currentUserId={CURRENT_USER_ID}
                  getStatusBadge={getStatusBadge}
                  getBidStatusBadge={getBidStatusBadge}
                  showActions={false}
                />
              ))
            )}
          </TabsContent>

          {/* My Requests Tab */}
          <TabsContent value="my-requests" className="space-y-4">
            {filteredRequests.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No requests created yet</h3>
                  <p className="text-sm text-muted-foreground text-center max-w-md mb-6">
                    Create your first sourcing request to start receiving bids from qualified vendors.
                  </p>
                  <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Create Request
                  </Button>
                </CardContent>
              </Card>
            ) : (
              filteredRequests.map((request) => (
                <RequestCard
                  key={request.id}
                  request={request}
                  expanded={expandedRequests.has(request.id)}
                  onToggleExpand={() => toggleRequestExpansion(request.id)}
                  onClose={() => {
                    closeRequest(request.id)
                    toast({
                      title: 'Request Closed',
                      description: 'The sourcing request has been closed.',
                    })
                  }}
                  onAward={(vendorId) => {
                    awardRequest(request.id, vendorId)
                    toast({
                      title: 'Request Awarded',
                      description: 'The request has been awarded to the selected vendor.',
                    })
                  }}
                  onDelete={() => {
                    deleteRequest(request.id)
                    toast({
                      title: 'Request Deleted',
                      description: 'The sourcing request has been deleted.',
                    })
                  }}
                  currentUserId={CURRENT_USER_ID}
                  getStatusBadge={getStatusBadge}
                  getBidStatusBadge={getBidStatusBadge}
                  showActions={true}
                />
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Bid Submission Dialog */}
      {selectedRequest && (
        <Dialog open={showBidDialog} onOpenChange={setShowBidDialog}>
          <BidSubmissionDialog
            request={selectedRequest}
            onClose={() => {
              setShowBidDialog(false)
              setSelectedRequest(null)
            }}
            onSubmit={addBid}
            vendorId={CURRENT_VENDOR_ID}
            vendorName={CURRENT_VENDOR_NAME}
            toast={toast}
          />
        </Dialog>
      )}
    </div>
  )
}

// Request Card Component
interface RequestCardProps {
  request: SourcingRequest
  expanded: boolean
  onToggleExpand: () => void
  onBid?: () => void
  onClose?: () => void
  onAward?: (vendorId: string) => void
  onDelete?: () => void
  currentUserId: string
  getStatusBadge: (status: SourcingRequest['status']) => React.ReactNode
  getBidStatusBadge: (status: SourcingBid['status']) => React.ReactNode
  showActions: boolean
}

function RequestCard({
  request,
  expanded,
  onToggleExpand,
  onBid,
  onClose,
  onAward,
  onDelete,
  currentUserId,
  getStatusBadge,
  getBidStatusBadge,
  showActions,
}: RequestCardProps) {
  const isOwner = request.createdBy === currentUserId
  const canBid = !isOwner && (request.status === 'open' || request.status === 'bidding')
  const hasDeadline = request.deadline && new Date(request.deadline) > new Date()

  return (
    <Card className="overflow-hidden transition-shadow hover:shadow-lg">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {getStatusBadge(request.status)}
              {hasDeadline && (
                <Badge variant="outline" className="gap-1">
                  <Clock className="h-3 w-3" />
                  {format(new Date(request.deadline!), 'MMM dd, yyyy')}
                </Badge>
              )}
            </div>
            <CardTitle className="text-xl mb-2">{request.title}</CardTitle>
            <CardDescription className="flex flex-wrap gap-3 text-sm">
              <span className="flex items-center gap-1">
                <Package className="h-4 w-4" />
                {request.category}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {request.destination}
              </span>
              <span className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                {request.bids.length} {request.bids.length === 1 ? 'bid' : 'bids'}
              </span>
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {canBid && onBid && (
              <Button onClick={onBid} size="sm" className="gap-2">
                <Send className="h-4 w-4" />
                Submit Bid
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={onToggleExpand}>
              {expanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Summary Info */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Quantity</p>
            <p className="font-semibold">{request.quantity.toLocaleString()} units</p>
          </div>
          {request.targetPrice && (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Target Price</p>
              <p className="font-semibold">${request.targetPrice.toLocaleString()}/unit</p>
            </div>
          )}
          {request.budget && (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Total Budget</p>
              <p className="font-semibold">${request.budget.toLocaleString()}</p>
            </div>
          )}
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Posted</p>
            <p className="font-semibold">{format(new Date(request.createdAt), 'MMM dd, yyyy')}</p>
          </div>
        </div>

        {/* Expanded Details */}
        {expanded && (
          <>
            <Separator />
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Description</h4>
                <p className="text-sm text-muted-foreground whitespace-pre-line">{request.description}</p>
              </div>

              {request.specifications.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Specifications</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {request.specifications.map((spec, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <div>
                          <span className="font-medium">{spec.name}:</span>{' '}
                          <span className="text-muted-foreground">{spec.value}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Bids Section */}
              {request.bids.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold">Bids Received ({request.bids.length})</h4>
                    {isOwner && request.status !== 'closed' && request.status !== 'awarded' && (
                      <p className="text-xs text-muted-foreground">Click a bid to award the contract</p>
                    )}
                  </div>
                  <div className="space-y-3">
                    {request.bids.map((bid) => (
                      <BidCard
                        key={bid.id}
                        bid={bid}
                        request={request}
                        isOwner={isOwner}
                        onAward={onAward}
                        getBidStatusBadge={getBidStatusBadge}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>

      {/* Actions Footer for Owner */}
      {showActions && isOwner && (
        <CardFooter className="bg-muted/50 border-t gap-2 flex-wrap">
          {request.status !== 'closed' && request.status !== 'awarded' && onClose && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <XCircle className="h-4 w-4 mr-2" />
                  Close Request
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Close Sourcing Request?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will close the request without awarding it to any vendor. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={onClose}>Close Request</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          {onDelete && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Sourcing Request?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete the request and all associated bids. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={onDelete} className="bg-destructive text-destructive-foreground">
                    Delete Request
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </CardFooter>
      )}
    </Card>
  )
}

// Bid Card Component
interface BidCardProps {
  bid: SourcingBid
  request: SourcingRequest
  isOwner: boolean
  onAward?: (vendorId: string) => void
  getBidStatusBadge: (status: SourcingBid['status']) => React.ReactNode
}

function BidCard({ bid, request, isOwner, onAward, getBidStatusBadge }: BidCardProps) {
  const canAward = isOwner && bid.status === 'pending' && request.status !== 'closed' && request.status !== 'awarded'
  const totalCost = bid.unitPrice * request.quantity

  return (
    <Card className={cn('transition-all', bid.status === 'accepted' && 'border-green-500 bg-green-50 dark:bg-green-950/20')}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h5 className="font-semibold">{bid.vendorName}</h5>
                <p className="text-xs text-muted-foreground">Submitted {format(new Date(bid.submittedAt), 'MMM dd, yyyy')}</p>
              </div>
              {getBidStatusBadge(bid.status)}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <DollarSign className="h-3 w-3" />
                  Unit Price
                </p>
                <p className="font-semibold">${bid.unitPrice.toLocaleString()}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Package className="h-3 w-3" />
                  MOQ
                </p>
                <p className="font-semibold">{bid.moq.toLocaleString()} units</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Truck className="h-3 w-3" />
                  Lead Time
                </p>
                <p className="font-semibold">{bid.leadTime}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <CreditCard className="h-3 w-3" />
                  Payment
                </p>
                <p className="font-semibold">{bid.paymentTerms}</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-background rounded-md border">
              <span className="text-sm font-medium">Total Cost Estimate</span>
              <span className="text-lg font-bold">${totalCost.toLocaleString()}</span>
            </div>

            {bid.notes && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">Additional Notes</p>
                <p className="text-sm text-muted-foreground">{bid.notes}</p>
              </div>
            )}

            {bid.certifications && bid.certifications.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {bid.certifications.map((cert, idx) => (
                  <Badge key={idx} variant="outline" className="gap-1">
                    <Shield className="h-3 w-3" />
                    {cert}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {canAward && onAward && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="sm" className="gap-2">
                  <Award className="h-4 w-4" />
                  Award
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Award Contract to {bid.vendorName}?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will award the sourcing request to {bid.vendorName} and close the request. You can then proceed to negotiate the final terms and place an order.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => onAward(bid.vendorId)}>Award Contract</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// Create Request Dialog Component
interface CreateRequestDialogProps {
  onClose: () => void
  onCreate: (request: any) => string
  toast: any
}

function CreateRequestDialog({ onClose, onCreate, toast }: CreateRequestDialogProps) {
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    description: '',
    quantity: '',
    targetPrice: '',
    budget: '',
    deadline: '',
    destination: '',
    specifications: [{ name: '', value: '' }],
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (!formData.title || !formData.category || !formData.description || !formData.quantity || !formData.destination) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      })
      return
    }

    const requestData = {
      title: formData.title,
      category: formData.category,
      description: formData.description,
      quantity: parseInt(formData.quantity),
      targetPrice: formData.targetPrice ? parseFloat(formData.targetPrice) : undefined,
      budget: formData.budget ? parseFloat(formData.budget) : undefined,
      deadline: formData.deadline || undefined,
      destination: formData.destination,
      specifications: formData.specifications.filter((spec) => spec.name && spec.value),
      attachments: [],
      createdBy: CURRENT_USER_ID,
    }

    onCreate(requestData)
    toast({
      title: 'Request Created',
      description: 'Your sourcing request has been posted successfully.',
    })
    onClose()
  }

  const addSpecification = () => {
    setFormData({
      ...formData,
      specifications: [...formData.specifications, { name: '', value: '' }],
    })
  }

  const removeSpecification = (index: number) => {
    setFormData({
      ...formData,
      specifications: formData.specifications.filter((_, i) => i !== index),
    })
  }

  const updateSpecification = (index: number, field: 'name' | 'value', value: string) => {
    const updated = [...formData.specifications]
    updated[index][field] = value
    setFormData({ ...formData, specifications: updated })
  }

  return (
    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Create Sourcing Request</DialogTitle>
        <DialogDescription>Post a new sourcing request to receive bids from qualified vendors.</DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2 space-y-2">
            <Label htmlFor="title">
              Request Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              placeholder="e.g., 1000 units of Industrial Safety Helmets"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">
              Category <span className="text-destructive">*</span>
            </Label>
            <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
              <SelectTrigger id="category">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Electronics">Electronics</SelectItem>
                <SelectItem value="Industrial Equipment">Industrial Equipment</SelectItem>
                <SelectItem value="Safety Equipment">Safety Equipment</SelectItem>
                <SelectItem value="Office Supplies">Office Supplies</SelectItem>
                <SelectItem value="Raw Materials">Raw Materials</SelectItem>
                <SelectItem value="Packaging">Packaging</SelectItem>
                <SelectItem value="Machinery">Machinery</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="quantity">
              Quantity <span className="text-destructive">*</span>
            </Label>
            <Input
              id="quantity"
              type="number"
              placeholder="e.g., 1000"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="targetPrice">Target Unit Price (Optional)</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="targetPrice"
                type="number"
                step="0.01"
                placeholder="0.00"
                className="pl-9"
                value={formData.targetPrice}
                onChange={(e) => setFormData({ ...formData, targetPrice: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="budget">Total Budget (Optional)</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="budget"
                type="number"
                step="0.01"
                placeholder="0.00"
                className="pl-9"
                value={formData.budget}
                onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="deadline">Deadline (Optional)</Label>
            <Input
              id="deadline"
              type="date"
              value={formData.deadline}
              onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="destination">
              Destination <span className="text-destructive">*</span>
            </Label>
            <Input
              id="destination"
              placeholder="e.g., Lagos, Nigeria"
              value={formData.destination}
              onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
              required
            />
          </div>

          <div className="col-span-2 space-y-2">
            <Label htmlFor="description">
              Description <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="description"
              placeholder="Provide detailed requirements, quality standards, and any other relevant information..."
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
            />
          </div>

          <div className="col-span-2 space-y-2">
            <div className="flex items-center justify-between">
              <Label>Specifications (Optional)</Label>
              <Button type="button" variant="outline" size="sm" onClick={addSpecification}>
                <Plus className="h-4 w-4 mr-2" />
                Add Specification
              </Button>
            </div>
            <div className="space-y-2">
              {formData.specifications.map((spec, idx) => (
                <div key={idx} className="flex gap-2">
                  <Input
                    placeholder="Name (e.g., Material)"
                    value={spec.name}
                    onChange={(e) => updateSpecification(idx, 'name', e.target.value)}
                  />
                  <Input
                    placeholder="Value (e.g., Stainless Steel)"
                    value={spec.value}
                    onChange={(e) => updateSpecification(idx, 'value', e.target.value)}
                  />
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeSpecification(idx)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">Create Request</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  )
}

// Bid Submission Dialog Component
interface BidSubmissionDialogProps {
  request: SourcingRequest
  onClose: () => void
  onSubmit: (requestId: string, bid: any) => void
  vendorId: string
  vendorName: string
  toast: any
}

function BidSubmissionDialog({ request, onClose, onSubmit, vendorId, vendorName, toast }: BidSubmissionDialogProps) {
  const [formData, setFormData] = useState({
    unitPrice: '',
    moq: '',
    leadTime: '',
    paymentTerms: '',
    notes: '',
    certifications: '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.unitPrice || !formData.moq || !formData.leadTime || !formData.paymentTerms) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      })
      return
    }

    const bidData = {
      vendorId,
      vendorName,
      unitPrice: parseFloat(formData.unitPrice),
      moq: parseInt(formData.moq),
      leadTime: formData.leadTime,
      paymentTerms: formData.paymentTerms,
      notes: formData.notes || undefined,
      certifications: formData.certifications ? formData.certifications.split(',').map((c) => c.trim()) : undefined,
    }

    onSubmit(request.id, bidData)
    toast({
      title: 'Bid Submitted',
      description: 'Your bid has been submitted successfully.',
    })
    onClose()
  }

  return (
    <DialogContent className="max-w-2xl">
      <DialogHeader>
        <DialogTitle>Submit Bid for {request.title}</DialogTitle>
        <DialogDescription>Provide your best quote for this sourcing request.</DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="p-4 bg-muted rounded-lg space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Requested Quantity:</span>
            <span className="font-semibold">{request.quantity.toLocaleString()} units</span>
          </div>
          {request.targetPrice && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Target Price:</span>
              <span className="font-semibold">${request.targetPrice.toLocaleString()}/unit</span>
            </div>
          )}
          {request.budget && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total Budget:</span>
              <span className="font-semibold">${request.budget.toLocaleString()}</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="unitPrice">
              Unit Price <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="unitPrice"
                type="number"
                step="0.01"
                placeholder="0.00"
                className="pl-9"
                value={formData.unitPrice}
                onChange={(e) => setFormData({ ...formData, unitPrice: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="moq">
              Minimum Order Quantity <span className="text-destructive">*</span>
            </Label>
            <Input
              id="moq"
              type="number"
              placeholder="e.g., 500"
              value={formData.moq}
              onChange={(e) => setFormData({ ...formData, moq: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="leadTime">
              Lead Time <span className="text-destructive">*</span>
            </Label>
            <Input
              id="leadTime"
              placeholder="e.g., 30 days"
              value={formData.leadTime}
              onChange={(e) => setFormData({ ...formData, leadTime: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="paymentTerms">
              Payment Terms <span className="text-destructive">*</span>
            </Label>
            <Select value={formData.paymentTerms} onValueChange={(value) => setFormData({ ...formData, paymentTerms: value })}>
              <SelectTrigger id="paymentTerms">
                <SelectValue placeholder="Select terms" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="100% Advance">100% Advance</SelectItem>
                <SelectItem value="50% Advance, 50% on Delivery">50% Advance, 50% on Delivery</SelectItem>
                <SelectItem value="30% Advance, 70% on Delivery">30% Advance, 70% on Delivery</SelectItem>
                <SelectItem value="Net 30">Net 30</SelectItem>
                <SelectItem value="Net 60">Net 60</SelectItem>
                <SelectItem value="PayPal">PayPal</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="col-span-2 space-y-2">
            <Label htmlFor="certifications">Certifications (Optional, comma-separated)</Label>
            <Input
              id="certifications"
              placeholder="e.g., ISO 9001, CE, FDA"
              value={formData.certifications}
              onChange={(e) => setFormData({ ...formData, certifications: e.target.value })}
            />
          </div>

          <div className="col-span-2 space-y-2">
            <Label htmlFor="notes">Additional Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Include any additional information about your offer..."
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>
        </div>

        {formData.unitPrice && (
          <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
            <div className="flex justify-between items-center">
              <span className="font-medium">Total Bid Amount</span>
              <span className="text-2xl font-bold">${(parseFloat(formData.unitPrice) * request.quantity).toLocaleString()}</span>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">Submit Bid</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  )
}
