'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
  FileText,
  Send,
  Clock,
  Package,
  DollarSign,
  Calendar,
  AlertCircle,
} from 'lucide-react'
import { toast } from '@/hooks/use-toast'

interface RFQItem {
  id: string
  productName: string
  category: string
  quantity: number
  targetPrice?: number
  description: string
  deadline?: string
  buyer: string
  receivedAt: string
  status: 'new' | 'quoted' | 'expired'
}

export function RFQInbox() {
  const [rfqs, setRFQs] = useState<RFQItem[]>([])
  const [selectedRFQ, setSelectedRFQ] = useState<RFQItem | null>(null)
  const [isQuoteDialogOpen, setIsQuoteDialogOpen] = useState(false)

  // Quote form state
  const [quoteForm, setQuoteForm] = useState({
    unitPrice: '',
    moq: '',
    leadTime: '',
    paymentTerms: 'T/T',
    notes: '',
  })

  const newRFQs = rfqs.filter((r) => r.status === 'new')
  const quotedRFQs = rfqs.filter((r) => r.status === 'quoted')

  const handleSubmitQuote = () => {
    if (!selectedRFQ || !quoteForm.unitPrice || !quoteForm.leadTime) {
      toast({
        title: 'Missing information',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      })
      return
    }

    // Update RFQ status
    setRFQs(
      rfqs.map((rfq) =>
        rfq.id === selectedRFQ.id ? { ...rfq, status: 'quoted' as const } : rfq
      )
    )

    toast({
      title: 'Quote submitted successfully',
      description: `Your quote for "${selectedRFQ.productName}" has been sent to the buyer`,
    })

    // Reset form
    setQuoteForm({
      unitPrice: '',
      moq: '',
      leadTime: '',
      paymentTerms: 'T/T',
      notes: '',
    })
    setIsQuoteDialogOpen(false)
    setSelectedRFQ(null)
  }

  const openQuoteDialog = (rfq: RFQItem) => {
    setSelectedRFQ(rfq)
    setQuoteForm({
      unitPrice: rfq.targetPrice?.toString() || '',
      moq: rfq.quantity.toString(),
      leadTime: '15-20 days',
      paymentTerms: 'T/T',
      notes: '',
    })
    setIsQuoteDialogOpen(true)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold mb-2">RFQ Inbox</h2>
        <p className="text-muted-foreground">
          Respond to buyer requests and submit competitive quotes
        </p>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New RFQs</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{newRFQs.length}</div>
            <p className="text-xs text-muted-foreground">Awaiting your response</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quotes Sent</CardTitle>
            <Send className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{quotedRFQs.length}</div>
            <p className="text-xs text-muted-foreground">This week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Response Rate</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3.2h</div>
            <p className="text-xs text-muted-foreground">Average response time</p>
          </CardContent>
        </Card>
      </div>

      {/* RFQ List */}
      {newRFQs.length === 0 ? (
        <Card className="p-12">
          <div className="text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No new RFQs</h3>
            <p className="text-muted-foreground">
              Check back later for new buyer requests
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {newRFQs.map((rfq) => (
            <Card key={rfq.id} className="hover:border-primary/50 transition-colors">
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-lg font-semibold mb-1">{rfq.productName}</h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span className="font-medium">{rfq.buyer}</span>
                          <span>•</span>
                          <Badge variant="outline">{rfq.category}</Badge>
                          {rfq.status === 'new' && <Badge className="bg-blue-500">New</Badge>}
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-sm text-muted-foreground mb-4">{rfq.description}</p>

                    {/* Specs Grid */}
                    <div className="grid md:grid-cols-4 gap-4 mb-4">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-primary" />
                        <div>
                          <p className="text-xs text-muted-foreground">Quantity</p>
                          <p className="font-semibold">{rfq.quantity.toLocaleString()}</p>
                        </div>
                      </div>

                      {rfq.targetPrice && (
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-primary" />
                          <div>
                            <p className="text-xs text-muted-foreground">Target Price</p>
                            <p className="font-semibold">${rfq.targetPrice.toFixed(2)}/unit</p>
                          </div>
                        </div>
                      )}

                      {rfq.deadline && (
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-primary" />
                          <div>
                            <p className="text-xs text-muted-foreground">Deadline</p>
                            <p className="font-semibold">
                              {new Date(rfq.deadline).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-primary" />
                        <div>
                          <p className="text-xs text-muted-foreground">Received</p>
                          <p className="font-semibold">
                            {new Date(rfq.receivedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Deadline Warning */}
                    {rfq.deadline && new Date(rfq.deadline) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) && (
                      <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg text-sm">
                        <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0" />
                        <p className="text-amber-700 dark:text-amber-300">
                          Deadline approaching - respond soon to increase your chances
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2">
                    <Dialog open={isQuoteDialogOpen && selectedRFQ?.id === rfq.id} onOpenChange={(open) => !open && setIsQuoteDialogOpen(false)}>
                      <DialogTrigger asChild>
                        <Button onClick={() => openQuoteDialog(rfq)}>
                          <Send className="h-4 w-4 mr-2" />
                          Submit Quote
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Submit Quote for {selectedRFQ?.productName}</DialogTitle>
                          <DialogDescription>
                            Provide your best pricing and terms for this RFQ
                          </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4 py-4">
                          <div className="grid md:grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="unitPrice">
                                Unit Price (USD) <span className="text-destructive">*</span>
                              </Label>
                              <Input
                                id="unitPrice"
                                type="number"
                                step="0.01"
                                placeholder="10.00"
                                value={quoteForm.unitPrice}
                                onChange={(e) =>
                                  setQuoteForm({ ...quoteForm, unitPrice: e.target.value })
                                }
                              />
                            </div>

                            <div>
                              <Label htmlFor="moq">Minimum Order Quantity</Label>
                              <Input
                                id="moq"
                                type="number"
                                placeholder="100"
                                value={quoteForm.moq}
                                onChange={(e) =>
                                  setQuoteForm({ ...quoteForm, moq: e.target.value })
                                }
                              />
                            </div>
                          </div>

                          <div className="grid md:grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="leadTime">
                                Lead Time <span className="text-destructive">*</span>
                              </Label>
                              <Input
                                id="leadTime"
                                placeholder="15-20 days"
                                value={quoteForm.leadTime}
                                onChange={(e) =>
                                  setQuoteForm({ ...quoteForm, leadTime: e.target.value })
                                }
                              />
                            </div>

                            <div>
                              <Label htmlFor="paymentTerms">Payment Terms</Label>
                              <Input
                                id="paymentTerms"
                                placeholder="T/T, L/C, etc."
                                value={quoteForm.paymentTerms}
                                onChange={(e) =>
                                  setQuoteForm({ ...quoteForm, paymentTerms: e.target.value })
                                }
                              />
                            </div>
                          </div>

                          <div>
                            <Label htmlFor="notes">Additional Notes (Optional)</Label>
                            <Textarea
                              id="notes"
                              placeholder="Certifications, shipping options, customization capabilities..."
                              rows={4}
                              value={quoteForm.notes}
                              onChange={(e) =>
                                setQuoteForm({ ...quoteForm, notes: e.target.value })
                              }
                            />
                          </div>
                        </div>

                        <DialogFooter>
                          <Button variant="outline" onClick={() => setIsQuoteDialogOpen(false)}>
                            Cancel
                          </Button>
                          <Button onClick={handleSubmitQuote}>
                            <Send className="h-4 w-4 mr-2" />
                            Submit Quote
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>

                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
