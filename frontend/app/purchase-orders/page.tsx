'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePOStore } from '@/store/po-store'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  FileText,
  Plus,
  Eye,
  Send,
  CheckCircle2,
  Clock,
  XCircle,
  Download,
  Printer,
} from 'lucide-react'

const STATUS_CONFIG = {
  draft: { label: 'Draft', color: 'bg-gray-500', icon: FileText },
  pending_approval: { label: 'Pending Approval', color: 'bg-amber-500', icon: Clock },
  approved: { label: 'Approved', color: 'bg-green-500', icon: CheckCircle2 },
  sent: { label: 'Sent', color: 'bg-blue-500', icon: Send },
  partially_received: { label: 'Partially Received', color: 'bg-purple-500', icon: Clock },
  received: { label: 'Received', color: 'bg-green-600', icon: CheckCircle2 },
  cancelled: { label: 'Cancelled', color: 'bg-red-500', icon: XCircle },
}

export default function PurchaseOrdersPage() {
  const { purchaseOrders, getPOsByStatus } = usePOStore()
  const [activeTab, setActiveTab] = useState('all')

  const draftPOs = getPOsByStatus('draft')
  const pendingPOs = getPOsByStatus('pending_approval')
  const approvedPOs = getPOsByStatus('approved')
  const sentPOs = getPOsByStatus('sent')

  const filteredPOs = {
    all: purchaseOrders,
    draft: draftPOs,
    pending: pendingPOs,
    approved: approvedPOs,
    sent: sentPOs,
  }

  const displayPOs = filteredPOs[activeTab as keyof typeof filteredPOs] || purchaseOrders

  return (
    <div className="container py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold font-display mb-2">Purchase Orders</h1>
          <p className="text-muted-foreground">
            Create and manage purchase orders for your suppliers
          </p>
        </div>
        <Button size="lg" asChild>
          <Link href="/purchase-orders/create">
            <Plus className="h-5 w-5 mr-2" />
            Create PO
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-4 mb-8">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total POs</p>
              <p className="text-2xl font-bold">{purchaseOrders.length}</p>
            </div>
            <FileText className="h-8 w-8 text-primary" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Pending Approval</p>
              <p className="text-2xl font-bold">{pendingPOs.length}</p>
            </div>
            <Clock className="h-8 w-8 text-amber-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Approved</p>
              <p className="text-2xl font-bold">{approvedPOs.length}</p>
            </div>
            <CheckCircle2 className="h-8 w-8 text-green-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Sent to Vendors</p>
              <p className="text-2xl font-bold">{sentPOs.length}</p>
            </div>
            <Send className="h-8 w-8 text-blue-500" />
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="all">All ({purchaseOrders.length})</TabsTrigger>
          <TabsTrigger value="draft">Draft ({draftPOs.length})</TabsTrigger>
          <TabsTrigger value="pending">Pending ({pendingPOs.length})</TabsTrigger>
          <TabsTrigger value="approved">Approved ({approvedPOs.length})</TabsTrigger>
          <TabsTrigger value="sent">Sent ({sentPOs.length})</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab}>
          {displayPOs.length === 0 ? (
            <Card className="p-12">
              <div className="text-center">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No purchase orders found</h3>
                <p className="text-muted-foreground mb-6">
                  {activeTab === 'all'
                    ? 'Create your first purchase order to start tracking supplier orders'
                    : `No ${activeTab} purchase orders at the moment`}
                </p>
                {activeTab === 'all' && (
                  <Button asChild>
                    <Link href="/purchase-orders/create">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Purchase Order
                    </Link>
                  </Button>
                )}
              </div>
            </Card>
          ) : (
            <div className="grid gap-4">
              {displayPOs.map((po) => {
                const statusConfig = STATUS_CONFIG[po.status]
                const StatusIcon = statusConfig.icon

                return (
                  <Card key={po.id} className="p-6 hover:border-primary/50 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        {/* Header */}
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="text-lg font-semibold">{po.poNumber}</h3>
                          <Badge className={statusConfig.color}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {statusConfig.label}
                          </Badge>
                        </div>

                        {/* Details */}
                        <div className="grid md:grid-cols-4 gap-4 text-sm mb-4">
                          <div>
                            <p className="text-muted-foreground text-xs">Vendor</p>
                            <p className="font-semibold">{po.vendorName}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground text-xs">Items</p>
                            <p className="font-semibold">{po.lineItems.length}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground text-xs">Total Amount</p>
                            <p className="font-semibold">${po.total.toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground text-xs">Created</p>
                            <p className="font-semibold">
                              {new Date(po.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        {/* Payment Terms */}
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>Payment Terms: {po.paymentTerms}</span>
                          <span>•</span>
                          <span>Created by: {po.createdBy}</span>
                          {po.approvedBy && (
                            <>
                              <span>•</span>
                              <span>Approved by: {po.approvedBy}</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/purchase-orders/${po.id}`}>
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </Link>
                        </Button>
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4 mr-2" />
                          PDF
                        </Button>
                        <Button variant="outline" size="sm">
                          <Printer className="h-4 w-4 mr-2" />
                          Print
                        </Button>
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
