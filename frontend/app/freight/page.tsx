'use client'

import React, { useState, useMemo } from 'react'
import { useFreightStore, type FreightForwarder, type ShippingQuote, type ShippingMode } from '@/store/freight-store'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import {
  AlertCircle,
  Briefcase,
  Calendar,
  CheckCircle2,
  Clock,
  Globe,
  MapPin,
  MessageSquare,
  Navigation,
  Package,
  Phone,
  Plane,
  Plus,
  Search,
  Ship,
  Star,
  Truck,
  TrendingUp,
  Zap,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Freight Forwarder Card Component
function ForwarderCard({
  forwarder,
  onSelectForwarder,
  onRequestQuote,
}: {
  forwarder: FreightForwarder
  onSelectForwarder: (forwarder: FreightForwarder) => void
  onRequestQuote: (forwarder: FreightForwarder) => void
}) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">{forwarder.name}</CardTitle>
            <CardDescription className="mt-1">{forwarder.description}</CardDescription>
          </div>
          {forwarder.logo && (
            <img
              src={forwarder.logo}
              alt={forwarder.name}
              className="w-12 h-12 rounded-lg object-cover ml-4"
            />
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Rating */}
        <div className="flex items-center gap-2">
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={cn(
                  'w-4 h-4',
                  i < Math.floor(forwarder.rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                )}
              />
            ))}
          </div>
          <span className="text-sm font-medium">{forwarder.rating.toFixed(1)}</span>
          <span className="text-sm text-muted-foreground">({forwarder.reviewCount} reviews)</span>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <p className="text-muted-foreground">Years in Business</p>
            <p className="font-semibold">{forwarder.yearsInBusiness} years</p>
          </div>
          <div>
            <p className="text-muted-foreground">Success Rate</p>
            <p className="font-semibold">{forwarder.successRate}%</p>
          </div>
          <div>
            <p className="text-muted-foreground">Total Shipments</p>
            <p className="font-semibold">{forwarder.totalShipments.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Response Time</p>
            <p className="font-semibold text-green-600">{forwarder.responseTime.replace(/-/g, ' ')}</p>
          </div>
        </div>

        {/* Certifications */}
        <div>
          <p className="text-sm font-semibold mb-2">Certifications</p>
          <div className="flex flex-wrap gap-1">
            {forwarder.certifications.map((cert, idx) => (
              <Badge key={idx} variant="outline" className="text-xs">
                {cert.name}
                {cert.verified && ' ✓'}
              </Badge>
            ))}
          </div>
        </div>

        {/* Specializations */}
        <div>
          <p className="text-sm font-semibold mb-2">Specializations</p>
          <div className="flex flex-wrap gap-1">
            {forwarder.specializations.slice(0, 3).map((spec, idx) => (
              <Badge key={idx} variant="secondary" className="text-xs">
                {spec}
              </Badge>
            ))}
          </div>
        </div>

        {/* Contact Info */}
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-muted-foreground" />
            <span>{forwarder.phone}</span>
          </div>
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-muted-foreground" />
            <span className="break-all">{forwarder.email}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-4">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => onSelectForwarder(forwarder)}
          >
            <Navigation className="w-4 h-4 mr-2" />
            View Details
          </Button>
          <Button
            size="sm"
            className="flex-1"
            onClick={() => onRequestQuote(forwarder)}
          >
            <Zap className="w-4 h-4 mr-2" />
            Get Quote
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// Quote Request Dialog
function QuoteRequestDialog({
  forwarder,
  isOpen,
  onOpenChange,
  onSubmit,
}: {
  forwarder: FreightForwarder | null
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: any) => void
}) {
  const [formData, setFormData] = useState({
    origin: '',
    destination: '',
    mode: 'sea' as ShippingMode,
    weight: '',
    volume: '',
    itemDescription: '',
    quantity: '',
    pickupDate: '',
    specialRequirements: '',
    includeInsurance: false,
  })

  const handleSubmit = () => {
    if (!formData.origin || !formData.destination || !formData.weight) {
      alert('Please fill in all required fields')
      return
    }
    onSubmit(formData)
    setFormData({
      origin: '',
      destination: '',
      mode: 'sea',
      weight: '',
      volume: '',
      itemDescription: '',
      quantity: '',
      pickupDate: '',
      specialRequirements: '',
      includeInsurance: false,
    })
    onOpenChange(false)
  }

  if (!forwarder) return null

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Request Shipping Quote</DialogTitle>
          <DialogDescription>
            Get a quote from {forwarder.name} for your shipment
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
          {/* Route Information */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm">Route Information</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Origin *</label>
                <Input
                  placeholder="Departure city/country"
                  value={formData.origin}
                  onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Destination *</label>
                <Input
                  placeholder="Arrival city/country"
                  value={formData.destination}
                  onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          {/* Shipping Mode */}
          <div>
            <label className="text-sm font-medium">Shipping Mode</label>
            <Select value={formData.mode} onValueChange={(val) => setFormData({ ...formData, mode: val as ShippingMode })}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="air">Air Freight</SelectItem>
                <SelectItem value="sea">Sea Freight</SelectItem>
                <SelectItem value="land">Land Freight</SelectItem>
                <SelectItem value="multimodal">Multimodal</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Cargo Details */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm">Cargo Details</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Weight (kg) *</label>
                <Input
                  type="number"
                  placeholder="0"
                  value={formData.weight}
                  onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Volume (CBM)</label>
                <Input
                  type="number"
                  placeholder="0"
                  value={formData.volume}
                  onChange={(e) => setFormData({ ...formData, volume: e.target.value })}
                  className="mt-1"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Quantity</label>
                <Input
                  type="number"
                  placeholder="1"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Pickup Date</label>
                <Input
                  type="date"
                  value={formData.pickupDate}
                  onChange={(e) => setFormData({ ...formData, pickupDate: e.target.value })}
                  className="mt-1"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Item Description</label>
              <Input
                placeholder="What are you shipping?"
                value={formData.itemDescription}
                onChange={(e) => setFormData({ ...formData, itemDescription: e.target.value })}
                className="mt-1"
              />
            </div>
          </div>

          {/* Special Requirements */}
          <div>
            <label className="text-sm font-medium">Special Requirements</label>
            <Input
              placeholder="Temperature control, hazmat, etc."
              value={formData.specialRequirements}
              onChange={(e) => setFormData({ ...formData, specialRequirements: e.target.value })}
              className="mt-1"
            />
          </div>

          {/* Insurance */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="insurance"
              checked={formData.includeInsurance}
              onChange={(e) => setFormData({ ...formData, includeInsurance: e.target.checked })}
              className="w-4 h-4 rounded"
            />
            <label htmlFor="insurance" className="text-sm font-medium">
              Include Cargo Insurance
            </label>
          </div>
        </div>

        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Request Quote</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Booking History Card
function BookingCard({ booking }: { booking: any }) {
  const statusColors: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-800',
    confirmed: 'bg-blue-100 text-blue-800',
    'in-transit': 'bg-purple-100 text-purple-800',
    delivered: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base">{booking.bookingNumber}</CardTitle>
            <CardDescription>{booking.forwarderName}</CardDescription>
          </div>
          <Badge className={cn('text-xs', statusColors[booking.status])}>
            {booking.status.replace(/-/g, ' ').toUpperCase()}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Route</p>
            <p className="font-semibold">{booking.origin} → {booking.destination}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Cost</p>
            <p className="font-semibold">{booking.currency} {booking.totalCost.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Pickup</p>
            <p className="font-semibold">{new Date(booking.pickupDate).toLocaleDateString()}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Est. Delivery</p>
            <p className="font-semibold">{new Date(booking.estimatedDeliveryDate).toLocaleDateString()}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Main Page Component
export default function FreightPage() {
  const {
    forwarders,
    quotes,
    bookings,
    shipments,
    searchForwarders,
    filterForwardersByRating,
    addQuote,
    getQuote,
    acceptQuote,
  } = useFreightStore()

  const [selectedTab, setSelectedTab] = useState('directory')
  const [selectedForwarder, setSelectedForwarder] = useState<FreightForwarder | null>(null)
  const [showQuoteDialog, setShowQuoteDialog] = useState(false)
  const [quoteForwarder, setQuoteForwarder] = useState<FreightForwarder | null>(null)
  const [searchOrigin, setSearchOrigin] = useState('')
  const [searchDestination, setSearchDestination] = useState('')
  const [minRating, setMinRating] = useState(0)

  // Filter forwarders based on search
  const filteredForwarders = useMemo(() => {
    let result = forwarders

    if (searchOrigin && searchDestination) {
      result = searchForwarders(searchOrigin, searchDestination)
    }

    if (minRating > 0) {
      result = result.filter(f => f.rating >= minRating)
    }

    return result
  }, [forwarders, searchOrigin, searchDestination, minRating, searchForwarders])

  const handleRequestQuote = (forwarder: FreightForwarder) => {
    setQuoteForwarder(forwarder)
    setShowQuoteDialog(true)
  }

  const handleSubmitQuote = (formData: any) => {
    if (!quoteForwarder) return

    const quoteId = addQuote({
      forwarderId: quoteForwarder.id,
      forwarderName: quoteForwarder.name,
      forwarderLogo: quoteForwarder.logo,
      quoteNumber: `QT-${Date.now().toString().slice(-6)}`,
      origin: formData.origin,
      destination: formData.destination,
      mode: formData.mode,
      lineItems: [
        {
          description: formData.itemDescription,
          quantity: parseInt(formData.quantity) || 1,
          weight: parseFloat(formData.weight) || 0,
          volume: parseFloat(formData.volume) || 0,
          unitPrice: 0,
        },
      ],
      totalWeight: parseFloat(formData.weight) || 0,
      totalVolume: parseFloat(formData.volume) || 0,
      baseCost: 1500,
      handlingFee: 150,
      insurance: formData.includeInsurance ? 100 : 0,
      documentation: 50,
      customs: 75,
      totalCost: 1875,
      currency: 'USD',
      incoTerm: 'CIF',
      transitTime: '14-21 days',
      validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      includesInsurance: formData.includeInsurance,
      notes: formData.specialRequirements,
      status: 'pending',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      submittedAt: new Date().toISOString(),
    })

    alert(`Quote requested successfully! Quote ID: ${quoteId}`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/50">
      {/* Header */}
      <div className="border-b bg-white">
        <div className="container mx-auto px-4 py-6">
          <Breadcrumb className="mb-4">
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/freight" active>
                Freight Forwarding
              </BreadcrumbLink>
            </BreadcrumbItem>
          </Breadcrumb>

          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold font-display mb-2">Freight Forwarding</h1>
              <p className="text-muted-foreground">
                Connect with verified freight forwarders for reliable international shipping
              </p>
            </div>
            <div className="flex gap-2">
              <Badge variant="outline" className="h-fit">
                <Briefcase className="w-3 h-3 mr-2" />
                {forwarders.length} Partners
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="directory">Forwarder Directory</TabsTrigger>
            <TabsTrigger value="quotes">
              Quotes
              {quotes.length > 0 && (
                <Badge variant="secondary" className="ml-2 h-5 w-5 flex items-center justify-center p-0 text-xs">
                  {quotes.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="bookings">
              Bookings
              {bookings.length > 0 && (
                <Badge variant="secondary" className="ml-2 h-5 w-5 flex items-center justify-center p-0 text-xs">
                  {bookings.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="tracking">
              Tracking
              {shipments.length > 0 && (
                <Badge variant="secondary" className="ml-2 h-5 w-5 flex items-center justify-center p-0 text-xs">
                  {shipments.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Directory Tab */}
          <TabsContent value="directory" className="space-y-6">
            {/* Search & Filter Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Find Freight Forwarders</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Origin Location</label>
                    <Input
                      placeholder="Departure city or country"
                      value={searchOrigin}
                      onChange={(e) => setSearchOrigin(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Destination Location</label>
                    <Input
                      placeholder="Arrival city or country"
                      value={searchDestination}
                      onChange={(e) => setSearchDestination(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Minimum Rating</label>
                  <Select
                    value={minRating.toString()}
                    onValueChange={(val) => setMinRating(parseFloat(val))}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">All Ratings</SelectItem>
                      <SelectItem value="3">3+ Stars</SelectItem>
                      <SelectItem value="3.5">3.5+ Stars</SelectItem>
                      <SelectItem value="4">4+ Stars</SelectItem>
                      <SelectItem value="4.5">4.5+ Stars</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Forwarders Grid */}
            {filteredForwarders.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredForwarders.map((forwarder) => (
                  <ForwarderCard
                    key={forwarder.id}
                    forwarder={forwarder}
                    onSelectForwarder={setSelectedForwarder}
                    onRequestQuote={handleRequestQuote}
                  />
                ))}
              </div>
            ) : (
              <Card className="text-center py-12">
                <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">No Forwarders Found</h3>
                <p className="text-muted-foreground">
                  {searchOrigin || searchDestination
                    ? 'Try adjusting your search criteria'
                    : 'Enter location details to find forwarders'}
                </p>
              </Card>
            )}
          </TabsContent>

          {/* Quotes Tab */}
          <TabsContent value="quotes" className="space-y-6">
            {quotes.length > 0 ? (
              <div className="space-y-4">
                {quotes.map((quote) => (
                  <Card key={quote.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-base">{quote.quoteNumber}</CardTitle>
                          <CardDescription>
                            {quote.forwarderName} • {quote.origin} → {quote.destination}
                          </CardDescription>
                        </div>
                        <Badge className={cn(
                          'text-xs',
                          quote.status === 'pending' && 'bg-yellow-100 text-yellow-800',
                          quote.status === 'quoted' && 'bg-blue-100 text-blue-800',
                          quote.status === 'accepted' && 'bg-green-100 text-green-800',
                          quote.status === 'rejected' && 'bg-red-100 text-red-800',
                          quote.status === 'expired' && 'bg-gray-100 text-gray-800',
                        )}>
                          {quote.status.toUpperCase()}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Weight</p>
                          <p className="font-semibold">{quote.totalWeight} kg</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Volume</p>
                          <p className="font-semibold">{quote.totalVolume} CBM</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Mode</p>
                          <p className="font-semibold capitalize">{quote.mode}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Transit Time</p>
                          <p className="font-semibold">{quote.transitTime}</p>
                        </div>
                      </div>

                      <div className="border-t pt-3">
                        <div className="flex justify-between mb-2">
                          <span className="text-sm text-muted-foreground">Base Cost</span>
                          <span className="text-sm font-medium">{quote.currency} {quote.baseCost.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm text-muted-foreground">Handling Fee</span>
                          <span className="text-sm font-medium">{quote.currency} {quote.handlingFee.toFixed(2)}</span>
                        </div>
                        {quote.insurance > 0 && (
                          <div className="flex justify-between mb-2">
                            <span className="text-sm text-muted-foreground">Insurance</span>
                            <span className="text-sm font-medium">{quote.currency} {quote.insurance.toFixed(2)}</span>
                          </div>
                        )}
                        <div className="flex justify-between mb-2">
                          <span className="text-sm text-muted-foreground">Documentation</span>
                          <span className="text-sm font-medium">{quote.currency} {quote.documentation.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between border-t pt-2 font-semibold">
                          <span>Total Cost</span>
                          <span>{quote.currency} {quote.totalCost.toFixed(2)}</span>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-2">
                        {quote.status === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1"
                            >
                              Reject
                            </Button>
                            <Button
                              size="sm"
                              className="flex-1"
                              onClick={() => acceptQuote(quote.id)}
                            >
                              <CheckCircle2 className="w-4 h-4 mr-2" />
                              Accept Quote
                            </Button>
                          </>
                        )}
                        {quote.status === 'accepted' && (
                          <Button size="sm" disabled className="w-full">
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            Quote Accepted
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="text-center py-12">
                <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">No Quotes Yet</h3>
                <p className="text-muted-foreground mb-4">
                  Request quotes from freight forwarders to get started
                </p>
                <Button onClick={() => setSelectedTab('directory')}>
                  <Plus className="w-4 h-4 mr-2" />
                  Request a Quote
                </Button>
              </Card>
            )}
          </TabsContent>

          {/* Bookings Tab */}
          <TabsContent value="bookings" className="space-y-6">
            {bookings.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {bookings.map((booking) => (
                  <BookingCard key={booking.id} booking={booking} />
                ))}
              </div>
            ) : (
              <Card className="text-center py-12">
                <Briefcase className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">No Active Bookings</h3>
                <p className="text-muted-foreground mb-4">
                  Accept a quote to create a booking
                </p>
                <Button onClick={() => setSelectedTab('quotes')}>
                  View Quotes
                </Button>
              </Card>
            )}
          </TabsContent>

          {/* Tracking Tab */}
          <TabsContent value="tracking" className="space-y-6">
            {shipments.length > 0 ? (
              <div className="space-y-4">
                {shipments.map((shipment) => (
                  <Card key={shipment.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-base">TRK-{shipment.trackingNumber}</CardTitle>
                          <CardDescription>
                            {shipment.origin} → {shipment.destination}
                          </CardDescription>
                        </div>
                        <Badge className="bg-blue-100 text-blue-800 text-xs">
                          {shipment.status.replace(/-/g, ' ').toUpperCase()}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Current Location</p>
                          <p className="font-semibold">{shipment.currentLocation}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Est. Delivery</p>
                          <p className="font-semibold">
                            {new Date(shipment.estimatedDeliveryDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      {/* Timeline */}
                      <div className="border-l-2 border-primary ml-4 space-y-3">
                        {shipment.events.slice(-5).reverse().map((event, idx) => (
                          <div key={event.id} className="relative pl-6">
                            <div className="absolute -left-3 w-4 h-4 rounded-full bg-primary mt-0.5" />
                            <p className="text-sm font-medium">{event.description}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(event.timestamp).toLocaleString()}
                            </p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="text-center py-12">
                <Truck className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">No Shipments to Track</h3>
                <p className="text-muted-foreground">
                  Your shipments will appear here once they're in transit
                </p>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Forwarder Details Dialog */}
      <Dialog open={!!selectedForwarder} onOpenChange={(open) => !open && setSelectedForwarder(null)}>
        <DialogContent className="max-w-2xl">
          {selectedForwarder && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedForwarder.name}</DialogTitle>
                <DialogDescription>{selectedForwarder.description}</DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                {/* Key Information */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-muted rounded-lg">
                    <Star className="w-5 h-5 text-yellow-400 mb-2" />
                    <p className="text-xs text-muted-foreground">Rating</p>
                    <p className="text-lg font-semibold">{selectedForwarder.rating}</p>
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <TrendingUp className="w-5 h-5 text-green-600 mb-2" />
                    <p className="text-xs text-muted-foreground">Success Rate</p>
                    <p className="text-lg font-semibold">{selectedForwarder.successRate}%</p>
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <Briefcase className="w-5 h-5 text-blue-600 mb-2" />
                    <p className="text-xs text-muted-foreground">Shipments</p>
                    <p className="text-lg font-semibold">{(selectedForwarder.totalShipments / 1000).toFixed(1)}k</p>
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <Clock className="w-5 h-5 text-purple-600 mb-2" />
                    <p className="text-xs text-muted-foreground">Response</p>
                    <p className="text-xs font-semibold">{selectedForwarder.responseTime.replace(/-/g, ' ')}</p>
                  </div>
                </div>

                {/* Certifications */}
                <div>
                  <h4 className="font-semibold mb-2">Certifications & Licenses</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedForwarder.certifications.map((cert, idx) => (
                      <div key={idx} className="flex items-center gap-2 p-2 border rounded">
                        {cert.verified && <CheckCircle2 className="w-4 h-4 text-green-600" />}
                        <div>
                          <p className="text-sm font-medium">{cert.name}</p>
                          {cert.expiryDate && (
                            <p className="text-xs text-muted-foreground">
                              Expires: {new Date(cert.expiryDate).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Service Areas */}
                <div>
                  <h4 className="font-semibold mb-2">Service Areas</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedForwarder.serviceAreas.map((area, idx) => (
                      <div key={idx} className="flex items-center gap-2 p-2 bg-muted rounded">
                        <Globe className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">{area.country}</p>
                          {area.ports && (
                            <p className="text-xs text-muted-foreground">{area.ports.join(', ')}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Contact Information */}
                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-3">Contact Information</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <span>{selectedForwarder.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-muted-foreground" />
                      <span className="break-all">{selectedForwarder.email}</span>
                    </div>
                    {selectedForwarder.website && (
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-muted-foreground" />
                        <a href={`https://${selectedForwarder.website}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                          {selectedForwarder.website}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setSelectedForwarder(null)}>
                  Close
                </Button>
                <Button onClick={() => {
                  handleRequestQuote(selectedForwarder)
                  setSelectedForwarder(null)
                }}>
                  <Zap className="w-4 h-4 mr-2" />
                  Request Quote
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Quote Request Dialog */}
      <QuoteRequestDialog
        forwarder={quoteForwarder}
        isOpen={showQuoteDialog}
        onOpenChange={setShowQuoteDialog}
        onSubmit={handleSubmitQuote}
      />
    </div>
  )
}
