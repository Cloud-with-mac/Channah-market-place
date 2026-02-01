'use client'

import React, { useState, useMemo } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  AlertCircle,
  Plus,
  Archive,
  Trash2,
  Eye,
  Edit,
  Download,
  Upload,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Copy,
  TrendingUp,
  Package,
  Palette,
  FileText,
  Calendar,
  DollarSign,
  Users,
  Clock,
} from 'lucide-react'
import { useOEMStore, type OEMRequest, type BrandingSpecification } from '@/store/oem-store'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

// Request Form Component
function RequestForm({ onSubmit, initialData }: { onSubmit: (data: any) => void; initialData?: OEMRequest }) {
  const [formData, setFormData] = useState(
    initialData || {
      companyName: '',
      contactEmail: '',
      contactPhone: '',
      productDescription: '',
      targetMarket: '',
      estimatedQuantity: 0,
      budget: 0,
      timeline: '',
      branding: {
        id: `brand-${Date.now()}`,
        companyName: '',
        primaryColor: '#000000',
        secondaryColor: '#FFFFFF',
        accentColor: '#FF6B6B',
        fontFamily: 'Inter',
        tagline: '',
        description: '',
      } as BrandingSpecification,
      designMockups: [],
      quotes: [],
      milestones: [],
      status: 'draft',
    }
  )

  const handleChange = (e: any) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'estimatedQuantity' || name === 'budget' ? parseFloat(value) : value,
    }))
  }

  const handleBrandingChange = (e: any) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      branding: { ...prev.branding, [name]: value },
    }))
  }

  const handleSubmit = (e: any) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Company Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Company Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="companyName">Company Name*</Label>
            <Input
              id="companyName"
              name="companyName"
              value={formData.companyName}
              onChange={handleChange}
              required
              placeholder="Your company name"
            />
          </div>
          <div>
            <Label htmlFor="contactEmail">Email*</Label>
            <Input
              id="contactEmail"
              name="contactEmail"
              type="email"
              value={formData.contactEmail}
              onChange={handleChange}
              required
              placeholder="contact@company.com"
            />
          </div>
          <div>
            <Label htmlFor="contactPhone">Phone</Label>
            <Input
              id="contactPhone"
              name="contactPhone"
              type="tel"
              value={formData.contactPhone}
              onChange={handleChange}
              placeholder="+1 (555) 000-0000"
            />
          </div>
          <div>
            <Label htmlFor="targetMarket">Target Market</Label>
            <Input
              id="targetMarket"
              name="targetMarket"
              value={formData.targetMarket}
              onChange={handleChange}
              placeholder="Geographic or demographic focus"
            />
          </div>
        </div>
      </div>

      {/* Product Details */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Product Details</h3>
        <div>
          <Label htmlFor="productDescription">Product Description*</Label>
          <Textarea
            id="productDescription"
            name="productDescription"
            value={formData.productDescription}
            onChange={handleChange}
            required
            placeholder="Describe your product, features, specifications, and requirements"
            className="min-h-[120px]"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="estimatedQuantity">Estimated Quantity*</Label>
            <Input
              id="estimatedQuantity"
              name="estimatedQuantity"
              type="number"
              value={formData.estimatedQuantity}
              onChange={handleChange}
              required
              placeholder="Units per order"
            />
          </div>
          <div>
            <Label htmlFor="budget">Budget (USD)</Label>
            <Input
              id="budget"
              name="budget"
              type="number"
              value={formData.budget}
              onChange={handleChange}
              placeholder="Total budget"
            />
          </div>
          <div>
            <Label htmlFor="timeline">Timeline</Label>
            <Input
              id="timeline"
              name="timeline"
              value={formData.timeline}
              onChange={handleChange}
              placeholder="e.g., 3 months, Q2 2024"
            />
          </div>
        </div>
      </div>

      {/* Branding Specifications */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Palette className="w-5 h-5" />
          Branding Specifications
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="brandName">Brand Name</Label>
            <Input
              id="brandName"
              name="companyName"
              value={formData.branding.companyName}
              onChange={handleBrandingChange}
              placeholder="Brand name for product"
            />
          </div>
          <div>
            <Label htmlFor="fontFamily">Font Family</Label>
            <Input
              id="fontFamily"
              name="fontFamily"
              value={formData.branding.fontFamily}
              onChange={handleBrandingChange}
              placeholder="e.g., Inter, Helvetica"
            />
          </div>
          <div>
            <Label htmlFor="primaryColor">Primary Color</Label>
            <div className="flex items-center gap-2">
              <input
                id="primaryColor"
                name="primaryColor"
                type="color"
                value={formData.branding.primaryColor}
                onChange={handleBrandingChange}
                className="h-10 w-20 rounded cursor-pointer"
              />
              <Input
                type="text"
                value={formData.branding.primaryColor}
                onChange={handleBrandingChange}
                name="primaryColor"
                className="flex-1"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="secondaryColor">Secondary Color</Label>
            <div className="flex items-center gap-2">
              <input
                id="secondaryColor"
                name="secondaryColor"
                type="color"
                value={formData.branding.secondaryColor}
                onChange={handleBrandingChange}
                className="h-10 w-20 rounded cursor-pointer"
              />
              <Input
                type="text"
                value={formData.branding.secondaryColor}
                onChange={handleBrandingChange}
                name="secondaryColor"
                className="flex-1"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="accentColor">Accent Color</Label>
            <div className="flex items-center gap-2">
              <input
                id="accentColor"
                name="accentColor"
                type="color"
                value={formData.branding.accentColor}
                onChange={handleBrandingChange}
                className="h-10 w-20 rounded cursor-pointer"
              />
              <Input
                type="text"
                value={formData.branding.accentColor}
                onChange={handleBrandingChange}
                name="accentColor"
                className="flex-1"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="tagline">Tagline</Label>
            <Input
              id="tagline"
              name="tagline"
              value={formData.branding.tagline}
              onChange={handleBrandingChange}
              placeholder="Brand tagline"
            />
          </div>
        </div>
        <div>
          <Label htmlFor="brandDescription">Brand Description</Label>
          <Textarea
            id="brandDescription"
            name="description"
            value={formData.branding.description}
            onChange={handleBrandingChange}
            placeholder="Brand story and values"
            className="min-h-[80px]"
          />
        </div>
      </div>

      {/* Color Preview */}
      <div className="space-y-2">
        <h4 className="font-medium">Color Palette Preview</h4>
        <div className="flex gap-4 flex-wrap">
          <div className="flex flex-col items-center gap-2">
            <div
              className="w-20 h-20 rounded border"
              style={{ backgroundColor: formData.branding.primaryColor }}
            />
            <span className="text-xs font-medium">Primary</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div
              className="w-20 h-20 rounded border"
              style={{ backgroundColor: formData.branding.secondaryColor }}
            />
            <span className="text-xs font-medium">Secondary</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div
              className="w-20 h-20 rounded border"
              style={{ backgroundColor: formData.branding.accentColor }}
            />
            <span className="text-xs font-medium">Accent</span>
          </div>
        </div>
      </div>

      <Button type="submit" className="w-full">
        {initialData ? 'Update Request' : 'Create Request'}
      </Button>
    </form>
  )
}

// Quote Card Component
function QuoteCard({ quote, onAccept, onReject, onDelete }: any) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'bg-green-50 border-green-200'
      case 'rejected':
        return 'bg-red-50 border-red-200'
      default:
        return 'bg-blue-50 border-blue-200'
    }
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'default'
      case 'rejected':
        return 'destructive'
      default:
        return 'secondary'
    }
  }

  return (
    <Card className={cn('border-2', getStatusColor(quote.status))}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2">
              {quote.vendorName}
              {quote.vendorLogo && (
                <img src={quote.vendorLogo} alt={quote.vendorName} className="w-6 h-6 rounded-full" />
              )}
            </CardTitle>
            <CardDescription>Quote ID: {quote.id}</CardDescription>
          </div>
          <Badge variant={getStatusBadgeVariant(quote.status) as any}>
            {quote.status.charAt(0).toUpperCase() + quote.status.slice(1)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Pricing */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Unit Price</p>
            <p className="text-lg font-semibold">${quote.basePrice.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">MOQ</p>
            <p className="text-lg font-semibold">{quote.moq.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Lead Time</p>
            <p className="text-lg font-semibold">{quote.leadTime} days</p>
          </div>
        </div>

        {/* Additional Info */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-muted-foreground">Quantity Range</p>
            <p className="font-medium">
              {quote.quantityRange.min.toLocaleString()} - {quote.quantityRange.max.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Capacity</p>
            <p className="font-medium">{quote.productionCapacity.toLocaleString()} units/month</p>
          </div>
          <div>
            <p className="text-muted-foreground">Payment Terms</p>
            <p className="font-medium">{quote.paymentTerms}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Guarantee</p>
            <p className="font-medium">{quote.guaranteeMonths} months</p>
          </div>
        </div>

        {/* Costs */}
        {(quote.setupCost || quote.customizationCost || quote.shippingCost) && (
          <div className="border-t pt-3 space-y-2 text-sm">
            {quote.setupCost && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Setup Cost</span>
                <span className="font-medium">${quote.setupCost.toFixed(2)}</span>
              </div>
            )}
            {quote.customizationCost && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Customization</span>
                <span className="font-medium">${quote.customizationCost.toFixed(2)}</span>
              </div>
            )}
            {quote.shippingCost && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shipping</span>
                <span className="font-medium">${quote.shippingCost.toFixed(2)}</span>
              </div>
            )}
          </div>
        )}

        {/* Certifications */}
        {quote.certifications && quote.certifications.length > 0 && (
          <div className="border-t pt-3">
            <p className="text-xs text-muted-foreground mb-2">Certifications</p>
            <div className="flex flex-wrap gap-2">
              {quote.certifications.map((cert: any) => (
                <Badge key={cert} variant="outline" className="text-xs">
                  {cert}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Notes */}
        {quote.notes && (
          <div className="border-t pt-3">
            <p className="text-xs text-muted-foreground mb-1">Notes</p>
            <p className="text-sm">{quote.notes}</p>
          </div>
        )}

        {/* Valid Until */}
        <div className="text-xs text-muted-foreground border-t pt-3">
          Valid until {format(new Date(quote.validUntil), 'MMM dd, yyyy')}
        </div>

        {/* Actions */}
        {quote.status === 'pending' && (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="default"
              onClick={() => onAccept(quote.id)}
              className="flex-1"
            >
              Accept Quote
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onReject(quote.id)}
              className="flex-1"
            >
              Reject
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onDelete(quote.id)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Production Milestone Component
function ProductionTimeline({ milestones, onUpdate }: any) {
  return (
    <div className="space-y-4">
      {milestones.map((milestone: any, index: number) => (
        <div key={milestone.id} className="relative flex gap-4 pb-4">
          {/* Timeline line */}
          {index !== milestones.length - 1 && (
            <div className="absolute left-4 top-12 w-1 h-12 bg-border" />
          )}

          {/* Timeline dot */}
          <div className="flex-shrink-0">
            <div
              className={cn(
                'w-8 h-8 rounded-full border-2 flex items-center justify-center',
                milestone.status === 'completed'
                  ? 'bg-green-500 border-green-500'
                  : milestone.status === 'in-progress'
                    ? 'bg-blue-500 border-blue-500'
                    : milestone.status === 'delayed'
                      ? 'bg-red-500 border-red-500'
                      : 'bg-gray-200 border-gray-300'
              )}
            >
              {milestone.status === 'completed' && (
                <CheckCircle2 className="w-5 h-5 text-white" />
              )}
            </div>
          </div>

          {/* Milestone details */}
          <div className="flex-1 pt-1">
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{milestone.name}</CardTitle>
                  <Badge
                    variant={
                      milestone.status === 'completed'
                        ? 'default'
                        : milestone.status === 'delayed'
                          ? 'destructive'
                          : 'secondary'
                    }
                  >
                    {milestone.status.charAt(0).toUpperCase() + milestone.status.slice(1)}
                  </Badge>
                </div>
                <CardDescription>
                  Due: {format(new Date(milestone.dueDate), 'MMM dd, yyyy')}
                  {milestone.completionDate && (
                    <> • Completed: {format(new Date(milestone.completionDate), 'MMM dd, yyyy')}</>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium">Progress</span>
                    <span>{milestone.percentage}%</span>
                  </div>
                  <Progress value={milestone.percentage} />
                </div>
                {milestone.notes && <p className="text-sm text-muted-foreground">{milestone.notes}</p>}
              </CardContent>
            </Card>
          </div>
        </div>
      ))}
    </div>
  )
}

// Request Overview Card
function RequestOverviewCard({ request, onEdit, onDuplicate, onDelete, onView }: any) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-50'
      case 'submitted':
        return 'bg-blue-50'
      case 'quoted':
        return 'bg-purple-50'
      case 'negotiating':
        return 'bg-yellow-50'
      case 'production':
        return 'bg-orange-50'
      case 'completed':
        return 'bg-green-50'
      default:
        return 'bg-gray-50'
    }
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'completed':
        return 'default'
      case 'production':
        return 'secondary'
      case 'negotiating':
      case 'quoted':
        return 'outline'
      case 'submitted':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  return (
    <Card className={cn('hover:shadow-lg transition-shadow', getStatusColor(request.status))}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <CardTitle className="truncate">{request.companyName}</CardTitle>
              <Badge variant={getStatusBadgeVariant(request.status) as any}>
                {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
              </Badge>
            </div>
            <CardDescription className="truncate">{request.contactEmail}</CardDescription>
          </div>
          <div className="flex-shrink-0 text-right">
            <p className="text-sm font-semibold">
              {request.estimatedQuantity.toLocaleString()} units
            </p>
            {request.budget && <p className="text-xs text-muted-foreground">${request.budget}</p>}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Product Info */}
        <p className="text-sm line-clamp-2 text-muted-foreground">{request.productDescription}</p>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div>
            <p className="text-muted-foreground">Quotes</p>
            <p className="font-semibold">{request.quotes.length}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Milestones</p>
            <p className="font-semibold">{request.milestones.length}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Created</p>
            <p className="font-semibold">{format(new Date(request.createdAt), 'MMM dd')}</p>
          </div>
        </div>

        {/* Production Progress */}
        {request.status === 'production' && request.milestones.length > 0 && (
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="font-medium">Production Progress</span>
              <span>
                {Math.round(
                  request.milestones.reduce((sum: number, m: any) => sum + m.percentage, 0) /
                    request.milestones.length
                )}
                %
              </span>
            </div>
            <Progress
              value={Math.round(
                request.milestones.reduce((sum: number, m: any) => sum + m.percentage, 0) /
                  request.milestones.length
              )}
              className="h-1.5"
            />
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onView(request.id)}
            className="flex-1"
          >
            <Eye className="w-4 h-4 mr-1" />
            View
          </Button>
          {request.status === 'draft' && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onEdit(request.id)}
            >
              <Edit className="w-4 h-4" />
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onDuplicate(request.id)}
          >
            <Copy className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onDelete(request.id)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// Main Page Component
export default function OEMServicesPage() {
  const {
    requests,
    currentEditingRequest,
    createRequest,
    updateRequest,
    deleteRequest,
    getRequest,
    setCurrentEditingRequest,
    duplicateRequest,
    acceptQuote,
    rejectQuote,
    deleteQuote,
    updateMilestoneStatus,
    submitRequest,
    completeProduction,
    getRequestStats,
  } = useOEMStore()

  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null)
  const [showNewRequestDialog, setShowNewRequestDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('overview')

  const selectedRequest = selectedRequestId ? getRequest(selectedRequestId) : null
  const stats = getRequestStats()

  const filteredRequests = useMemo(() => {
    const query = searchQuery.toLowerCase()
    return requests.filter(
      (r) =>
        r.companyName.toLowerCase().includes(query) ||
        r.productDescription.toLowerCase().includes(query) ||
        r.contactEmail.toLowerCase().includes(query)
    )
  }, [requests, searchQuery])

  const handleCreateRequest = (formData: any) => {
    const id = createRequest({
      companyName: formData.companyName,
      contactEmail: formData.contactEmail,
      contactPhone: formData.contactPhone,
      productDescription: formData.productDescription,
      targetMarket: formData.targetMarket,
      estimatedQuantity: formData.estimatedQuantity,
      budget: formData.budget,
      timeline: formData.timeline,
      branding: formData.branding,
      designMockups: [],
      quotes: [],
      milestones: [],
      status: 'draft',
      attachments: [],
    })
    setShowNewRequestDialog(false)
    setSelectedRequestId(id)
  }

  const handleUpdateRequest = (formData: any) => {
    if (selectedRequestId) {
      updateRequest(selectedRequestId, {
        companyName: formData.companyName,
        contactEmail: formData.contactEmail,
        contactPhone: formData.contactPhone,
        productDescription: formData.productDescription,
        targetMarket: formData.targetMarket,
        estimatedQuantity: formData.estimatedQuantity,
        budget: formData.budget,
        timeline: formData.timeline,
        branding: formData.branding,
      })
      setShowEditDialog(false)
    }
  }

  const handleAcceptQuote = (quoteId: string) => {
    if (selectedRequestId) {
      acceptQuote(selectedRequestId, quoteId)
    }
  }

  const handleRejectQuote = (quoteId: string) => {
    if (selectedRequestId) {
      rejectQuote(selectedRequestId, quoteId)
    }
  }

  const handleDeleteQuote = (quoteId: string) => {
    if (selectedRequestId) {
      deleteQuote(selectedRequestId, quoteId)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div>
            <h1 className="text-3xl font-bold font-display">OEM & White-Label Services</h1>
            <p className="text-muted-foreground mt-2">
              Manage custom manufacturing requests and production tracking
            </p>
          </div>
          <Dialog open={showNewRequestDialog} onOpenChange={setShowNewRequestDialog}>
            <DialogTrigger asChild>
              <Button size="lg">
                <Plus className="w-5 h-5 mr-2" />
                New Request
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create OEM Request</DialogTitle>
                <DialogDescription>
                  Submit a new white-label or OEM manufacturing request
                </DialogDescription>
              </DialogHeader>
              <RequestForm onSubmit={handleCreateRequest} />
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <Input
          placeholder="Search requests by company, product, or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-md"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-8">
        <Card className="p-4">
          <div className="text-2xl font-bold">{stats.total}</div>
          <p className="text-xs text-muted-foreground">Total</p>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-gray-600">{stats.draft}</div>
          <p className="text-xs text-muted-foreground">Draft</p>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-blue-600">{stats.submitted}</div>
          <p className="text-xs text-muted-foreground">Submitted</p>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-purple-600">{stats.quoted}</div>
          <p className="text-xs text-muted-foreground">Quoted</p>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-yellow-600">{stats.negotiating}</div>
          <p className="text-xs text-muted-foreground">Negotiating</p>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-orange-600">{stats.production}</div>
          <p className="text-xs text-muted-foreground">Production</p>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
          <p className="text-xs text-muted-foreground">Completed</p>
        </Card>
      </div>

      {/* Main Content */}
      {selectedRequest ? (
        // Detail View
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold">{selectedRequest.companyName}</h2>
              <p className="text-muted-foreground text-sm">{selectedRequest.contactEmail}</p>
            </div>
            <div className="flex gap-2">
              {selectedRequest.status === 'draft' && (
                <>
                  <Button variant="outline" onClick={() => setShowEditDialog(true)}>
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                  <Button onClick={() => submitRequest(selectedRequest.id)}>
                    Submit Request
                  </Button>
                </>
              )}
              {selectedRequest.status === 'production' && (
                <Button
                  onClick={() => completeProduction(selectedRequest.id)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Mark Complete
                </Button>
              )}
              <Button
                variant="ghost"
                onClick={() => {
                  setSelectedRequestId(null)
                  setActiveTab('overview')
                }}
              >
                Back
              </Button>
            </div>
          </div>

          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="quotes">
              Quotes ({selectedRequest.quotes.length})
            </TabsTrigger>
            <TabsTrigger value="production">
              Production ({selectedRequest.milestones.length})
            </TabsTrigger>
            <TabsTrigger value="branding">Branding</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Product Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="w-5 h-5" />
                    Product Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Description</p>
                    <p className="text-sm">{selectedRequest.productDescription}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Quantity</p>
                      <p className="text-lg font-semibold">
                        {selectedRequest.estimatedQuantity.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Budget</p>
                      <p className="text-lg font-semibold">
                        {selectedRequest.budget ? `$${selectedRequest.budget}` : 'Not specified'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Target Market</p>
                      <p className="text-sm">{selectedRequest.targetMarket || 'Not specified'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Timeline</p>
                      <p className="text-sm">{selectedRequest.timeline || 'Not specified'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Contact Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Contact Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Email</p>
                    <p className="text-sm font-medium">{selectedRequest.contactEmail}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Phone</p>
                    <p className="text-sm font-medium">{selectedRequest.contactPhone || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Created</p>
                    <p className="text-sm font-medium">
                      {format(new Date(selectedRequest.createdAt), 'PPP')}
                    </p>
                  </div>
                  {selectedRequest.submittedAt && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Submitted</p>
                      <p className="text-sm font-medium">
                        {format(new Date(selectedRequest.submittedAt), 'PPP')}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Quotes Tab */}
          <TabsContent value="quotes" className="space-y-6">
            {selectedRequest.quotes.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {selectedRequest.quotes.map((quote) => (
                  <QuoteCard
                    key={quote.id}
                    quote={quote}
                    onAccept={handleAcceptQuote}
                    onReject={handleRejectQuote}
                    onDelete={handleDeleteQuote}
                  />
                ))}
              </div>
            ) : (
              <Card className="text-center p-8">
                <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No quotes yet. Quotes will appear once vendors respond.</p>
              </Card>
            )}
          </TabsContent>

          {/* Production Tab */}
          <TabsContent value="production" className="space-y-6">
            {selectedRequest.milestones.length > 0 ? (
              <ProductionTimeline milestones={selectedRequest.milestones} onUpdate={() => {}} />
            ) : (
              <Card className="text-center p-8">
                <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground mb-4">
                  No production milestones created yet.
                </p>
                <p className="text-sm text-muted-foreground">
                  Milestones will be added once a quote is accepted and production begins.
                </p>
              </Card>
            )}
          </TabsContent>

          {/* Branding Tab */}
          <TabsContent value="branding" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="w-5 h-5" />
                  Branding Specifications
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Brand Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Brand Name</p>
                    <p className="text-sm font-medium">{selectedRequest.branding.companyName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Font Family</p>
                    <p className="text-sm font-medium">{selectedRequest.branding.fontFamily}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Tagline</p>
                    <p className="text-sm font-medium">{selectedRequest.branding.tagline || 'Not specified'}</p>
                  </div>
                </div>

                {/* Color Palette */}
                <div>
                  <h4 className="font-semibold mb-4">Color Palette</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <div
                        className="w-full h-24 rounded-lg border shadow-sm"
                        style={{ backgroundColor: selectedRequest.branding.primaryColor }}
                      />
                      <div>
                        <p className="text-xs text-muted-foreground">Primary</p>
                        <p className="text-sm font-mono font-medium">
                          {selectedRequest.branding.primaryColor}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div
                        className="w-full h-24 rounded-lg border shadow-sm"
                        style={{ backgroundColor: selectedRequest.branding.secondaryColor }}
                      />
                      <div>
                        <p className="text-xs text-muted-foreground">Secondary</p>
                        <p className="text-sm font-mono font-medium">
                          {selectedRequest.branding.secondaryColor}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div
                        className="w-full h-24 rounded-lg border shadow-sm"
                        style={{ backgroundColor: selectedRequest.branding.accentColor }}
                      />
                      <div>
                        <p className="text-xs text-muted-foreground">Accent</p>
                        <p className="text-sm font-mono font-medium">
                          {selectedRequest.branding.accentColor}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Brand Description */}
                {selectedRequest.branding.description && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Brand Description</p>
                    <p className="text-sm">{selectedRequest.branding.description}</p>
                  </div>
                )}

                {/* Edit Button */}
                {selectedRequest.status === 'draft' && (
                  <Button
                    variant="outline"
                    onClick={() => setShowEditDialog(true)}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Branding
                  </Button>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      ) : (
        // List View
        <div>
          {filteredRequests.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRequests.map((request) => (
                <RequestOverviewCard
                  key={request.id}
                  request={request}
                  onEdit={(id: any) => {
                    setSelectedRequestId(id)
                    setShowEditDialog(true)
                  }}
                  onDuplicate={(id: any) => {
                    const newId = duplicateRequest(id)
                    setSelectedRequestId(newId)
                  }}
                  onDelete={(id: any) => deleteRequest(id)}
                  onView={(id: any) => {
                    setSelectedRequestId(id)
                    setActiveTab('overview')
                  }}
                />
              ))}
            </div>
          ) : (
            <Card className="text-center p-12">
              <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No OEM Requests</h3>
              <p className="text-muted-foreground mb-6">
                {searchQuery ? 'No requests match your search.' : 'Create your first OEM request to get started.'}
              </p>
              {!searchQuery && (
                <Dialog open={showNewRequestDialog} onOpenChange={setShowNewRequestDialog}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="w-5 h-5 mr-2" />
                      Create Request
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Create OEM Request</DialogTitle>
                      <DialogDescription>
                        Submit a new white-label or OEM manufacturing request
                      </DialogDescription>
                    </DialogHeader>
                    <RequestForm onSubmit={handleCreateRequest} />
                  </DialogContent>
                </Dialog>
              )}
            </Card>
          )}
        </div>
      )}

      {/* Edit Dialog */}
      {selectedRequest && (
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit OEM Request</DialogTitle>
              <DialogDescription>Update your OEM request details</DialogDescription>
            </DialogHeader>
            <RequestForm
              onSubmit={handleUpdateRequest}
              initialData={selectedRequest}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
