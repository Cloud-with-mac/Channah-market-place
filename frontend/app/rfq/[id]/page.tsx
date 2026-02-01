'use client'

import { useParams, useRouter } from 'next/navigation'
import { useRFQStore } from '@/store/rfq-store'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  ArrowLeft,
  FileText,
  Package,
  MapPin,
  Calendar,
  DollarSign,
  CheckCircle2,
  XCircle,
  Award,
  MessageSquare,
} from 'lucide-react'
import Link from 'next/link'
import { toast } from '@/hooks/use-toast'
import { notFound } from 'next/navigation'

const STATUS_COLORS = {
  draft: 'bg-gray-500',
  open: 'bg-blue-500',
  quoted: 'bg-purple-500',
  negotiating: 'bg-amber-500',
  awarded: 'bg-green-500',
  closed: 'bg-gray-500',
}

export default function RFQDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { getRFQ, acceptQuote, rejectQuote, awardRFQ, closeRFQ } = useRFQStore()

  const rfqId = params.id as string
  const rfq = getRFQ(rfqId)

  if (!rfq) {
    notFound()
  }

  const handleAcceptQuote = (quoteId: string) => {
    acceptQuote(rfqId, quoteId)
    toast({
      title: 'Quote accepted',
      description: 'The supplier has been notified of your interest',
    })
  }

  const handleRejectQuote = (quoteId: string) => {
    rejectQuote(rfqId, quoteId)
    toast({
      title: 'Quote rejected',
      description: 'The quote has been marked as rejected',
    })
  }

  const handleAwardRFQ = (vendorId: string, vendorName: string) => {
    awardRFQ(rfqId, vendorId)
    toast({
      title: 'RFQ Awarded',
      description: `The order has been awarded to ${vendorName}`,
    })
  }

  const handleCloseRFQ = () => {
    closeRFQ(rfqId)
    toast({
      title: 'RFQ Closed',
      description: 'This RFQ has been closed without awarding',
    })
  }

  // Sort quotes: accepted first, then pending, then rejected
  const sortedQuotes = [...rfq.quotes].sort((a, b) => {
    const statusOrder = { accepted: 0, pending: 1, rejected: 2 }
    return statusOrder[a.status] - statusOrder[b.status]
  })

  const lowestQuote = rfq.quotes.length > 0
    ? rfq.quotes.reduce((min, q) => (q.unitPrice < min.unitPrice ? q : min))
    : null

  return (
    <div className="container py-8">
      {/* Header */}
      <div className="mb-8">
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link href="/rfq">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to RFQs
          </Link>
        </Button>

        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold font-display">{rfq.productName}</h1>
              <Badge className={STATUS_COLORS[rfq.status]}>
                {rfq.status.charAt(0).toUpperCase() + rfq.status.slice(1)}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              RFQ #{rfqId.split('-').pop()?.toUpperCase()}
            </p>
          </div>

          {rfq.status !== 'awarded' && rfq.status !== 'closed' && (
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleCloseRFQ}>
                Close RFQ
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Requirements */}
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4">Requirements</h2>

            <div className="space-y-4">
              <div>
                <Label className="text-sm text-muted-foreground">Description</Label>
                <p className="text-sm whitespace-pre-wrap">{rfq.description}</p>
              </div>

              {rfq.specifications.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <Label className="text-sm text-muted-foreground mb-2 block">
                      Specifications
                    </Label>
                    <div className="grid md:grid-cols-2 gap-3">
                      {rfq.specifications.map((spec, index) => (
                        <div
                          key={index}
                          className="flex items-start gap-2 p-3 bg-muted rounded-lg"
                        >
                          <div className="flex-1">
                            <p className="font-medium text-sm">{spec.name}</p>
                            <p className="text-sm text-muted-foreground">{spec.value}</p>
                          </div>
                          {spec.required && (
                            <Badge variant="outline" className="text-xs">
                              Required
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </Card>

          {/* Quotes */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Supplier Quotes ({rfq.quotes.length})
              </h2>
              {lowestQuote && rfq.quotes.length > 1 && (
                <Badge variant="outline" className="text-green-600">
                  Lowest: ${lowestQuote.unitPrice.toFixed(2)}/unit
                </Badge>
              )}
            </div>

            {rfq.quotes.length === 0 ? (
              <div className="text-center py-12">
                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold mb-2">No quotes yet</h3>
                <p className="text-sm text-muted-foreground">
                  Suppliers are reviewing your RFQ. You'll be notified when quotes arrive.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {sortedQuotes.map((quote) => (
                  <Card
                    key={quote.id}
                    className={`p-5 ${
                      quote.status === 'accepted'
                        ? 'border-2 border-green-500 bg-green-50 dark:bg-green-950/20'
                        : quote.status === 'rejected'
                        ? 'opacity-50'
                        : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1">
                        {/* Vendor Logo */}
                        <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                          {quote.vendorLogo ? (
                            <img
                              src={quote.vendorLogo}
                              alt={quote.vendorName}
                              className="h-full w-full object-cover rounded-lg"
                            />
                          ) : (
                            <span className="font-bold text-primary">
                              {quote.vendorName.charAt(0)}
                            </span>
                          )}
                        </div>

                        {/* Vendor Details */}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold">{quote.vendorName}</h4>
                            {quote.status === 'accepted' && (
                              <Badge className="bg-green-600">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Accepted
                              </Badge>
                            )}
                            {quote.status === 'rejected' && (
                              <Badge variant="outline" className="text-red-600">
                                Rejected
                              </Badge>
                            )}
                            {quote.id === lowestQuote?.id && rfq.quotes.length > 1 && (
                              <Badge className="bg-green-600">Best Price</Badge>
                            )}
                          </div>

                          <div className="grid md:grid-cols-2 gap-3 mb-3">
                            <div>
                              <p className="text-xs text-muted-foreground">Unit Price</p>
                              <p className="text-lg font-bold text-primary">
                                ${quote.unitPrice.toFixed(2)}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Total: $
                                {(quote.unitPrice * rfq.quantity).toLocaleString(undefined, {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">MOQ</p>
                              <p className="font-semibold">{quote.moq.toLocaleString()} units</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Lead Time</p>
                              <p className="font-semibold">{quote.leadTime}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Payment</p>
                              <p className="font-semibold">{quote.paymentTerms}</p>
                            </div>
                          </div>

                          {quote.notes && (
                            <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                              {quote.notes}
                            </p>
                          )}

                          <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            <span>
                              Submitted{' '}
                              {new Date(quote.submittedAt).toLocaleDateString()}
                            </span>
                            <span>•</span>
                            <span>Valid until {new Date(quote.validUntil).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      {rfq.status !== 'awarded' && rfq.status !== 'closed' && (
                        <div className="flex flex-col gap-2">
                          {quote.status === 'pending' && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => handleAcceptQuote(quote.id)}
                              >
                                <CheckCircle2 className="h-4 w-4 mr-1" />
                                Accept
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleRejectQuote(quote.id)}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Reject
                              </Button>
                            </>
                          )}
                          {quote.status === 'accepted' && (
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() =>
                                handleAwardRFQ(quote.vendorId, quote.vendorName)
                              }
                            >
                              <Award className="h-4 w-4 mr-1" />
                              Award Order
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* Order Details */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Order Details</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Package className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Quantity</p>
                  <p className="font-semibold">{rfq.quantity.toLocaleString()} units</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Category</p>
                  <p className="font-semibold">{rfq.category}</p>
                </div>
              </div>

              {rfq.targetPrice && (
                <div className="flex items-start gap-3">
                  <DollarSign className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">Target Price</p>
                    <p className="font-semibold">${rfq.targetPrice.toFixed(2)}/unit</p>
                  </div>
                </div>
              )}

              {rfq.deliveryDeadline && (
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">Delivery Deadline</p>
                    <p className="font-semibold">
                      {new Date(rfq.deliveryDeadline).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              )}

              {rfq.destination && (
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">Destination</p>
                    <p className="font-semibold">{rfq.destination}</p>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Timeline */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Timeline</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created</span>
                <span>{new Date(rfq.createdAt).toLocaleDateString()}</span>
              </div>
              {rfq.closedAt && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {rfq.status === 'awarded' ? 'Awarded' : 'Closed'}
                  </span>
                  <span>{new Date(rfq.closedAt).toLocaleDateString()}</span>
                </div>
              )}
              {rfq.awardedTo && (
                <div className="pt-3 border-t">
                  <Badge className="bg-green-600">
                    <Award className="h-3 w-3 mr-1" />
                    Awarded to{' '}
                    {rfq.quotes.find((q) => q.vendorId === rfq.awardedTo)?.vendorName}
                  </Badge>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

function Label({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <p className={`font-medium ${className}`}>{children}</p>
}
