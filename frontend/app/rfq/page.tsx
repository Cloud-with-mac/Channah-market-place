'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRFQStore } from '@/store/rfq-store'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  FileText,
  Plus,
  Clock,
  CheckCircle2,
  XCircle,
  Award,
  Eye,
  MessageSquare,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

const STATUS_CONFIG = {
  draft: {
    label: 'Draft',
    icon: FileText,
    color: 'bg-gray-500',
  },
  open: {
    label: 'Open',
    icon: Clock,
    color: 'bg-blue-500',
  },
  quoted: {
    label: 'Quoted',
    icon: MessageSquare,
    color: 'bg-purple-500',
  },
  negotiating: {
    label: 'Negotiating',
    icon: MessageSquare,
    color: 'bg-amber-500',
  },
  awarded: {
    label: 'Awarded',
    icon: Award,
    color: 'bg-green-500',
  },
  closed: {
    label: 'Closed',
    icon: XCircle,
    color: 'bg-gray-500',
  },
}

export default function RFQDashboard() {
  const { rfqs, getOpenRFQs, getClosedRFQs } = useRFQStore()
  const [activeTab, setActiveTab] = useState('all')

  const openRFQs = getOpenRFQs()
  const closedRFQs = getClosedRFQs()

  const filteredRFQs = {
    all: rfqs,
    open: openRFQs,
    quoted: rfqs.filter((r) => r.status === 'quoted'),
    closed: closedRFQs,
  }

  const displayRFQs = filteredRFQs[activeTab as keyof typeof filteredRFQs] || rfqs

  return (
    <div className="container py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold font-display mb-2">
            Request for Quotations
          </h1>
          <p className="text-muted-foreground">
            Manage your RFQs and compare supplier quotes
          </p>
        </div>
        <Button size="lg" asChild className="gap-2">
          <Link href="/rfq/create">
            <Plus className="h-5 w-5" />
            Create RFQ
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-4 gap-4 mb-8">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total RFQs</p>
              <p className="text-2xl font-bold">{rfqs.length}</p>
            </div>
            <div className="p-3 bg-primary/10 rounded-lg">
              <FileText className="h-5 w-5 text-primary" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Open</p>
              <p className="text-2xl font-bold">{openRFQs.length}</p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Clock className="h-5 w-5 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Quoted</p>
              <p className="text-2xl font-bold">
                {rfqs.filter((r) => r.status === 'quoted').length}
              </p>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <MessageSquare className="h-5 w-5 text-purple-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Awarded</p>
              <p className="text-2xl font-bold">
                {rfqs.filter((r) => r.status === 'awarded').length}
              </p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <Award className="h-5 w-5 text-green-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="all">All ({rfqs.length})</TabsTrigger>
          <TabsTrigger value="open">Open ({openRFQs.length})</TabsTrigger>
          <TabsTrigger value="quoted">
            Quoted ({rfqs.filter((r) => r.status === 'quoted').length})
          </TabsTrigger>
          <TabsTrigger value="closed">Closed ({closedRFQs.length})</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab}>
          {displayRFQs.length === 0 ? (
            <Card className="p-12">
              <div className="text-center">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No RFQs found</h3>
                <p className="text-muted-foreground mb-6">
                  {activeTab === 'all'
                    ? 'Create your first RFQ to start receiving quotes from suppliers'
                    : `No ${activeTab} RFQs at the moment`}
                </p>
                {activeTab === 'all' && (
                  <Button asChild>
                    <Link href="/rfq/create">
                      <Plus className="h-4 w-4 mr-2" />
                      Create RFQ
                    </Link>
                  </Button>
                )}
              </div>
            </Card>
          ) : (
            <div className="grid gap-4">
              {displayRFQs.map((rfq) => {
                const statusConfig = STATUS_CONFIG[rfq.status]
                const StatusIcon = statusConfig.icon

                return (
                  <Card key={rfq.id} className="p-6 hover:border-primary/50 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        {/* Header */}
                        <div className="flex items-start gap-3 mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="text-lg font-semibold line-clamp-1">
                                {rfq.productName}
                              </h3>
                              <Badge className={statusConfig.color}>
                                <StatusIcon className="h-3 w-3 mr-1" />
                                {statusConfig.label}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span>Qty: {rfq.quantity.toLocaleString()}</span>
                              <span>•</span>
                              <span>{rfq.category}</span>
                              {rfq.targetPrice && (
                                <>
                                  <span>•</span>
                                  <span>Target: ${rfq.targetPrice.toFixed(2)}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Description */}
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                          {rfq.description}
                        </p>

                        {/* Quotes Summary */}
                        {rfq.quotes.length > 0 && (
                          <div className="flex items-center gap-4 mb-4">
                            <div className="flex items-center gap-2">
                              <MessageSquare className="h-4 w-4 text-primary" />
                              <span className="text-sm font-medium">
                                {rfq.quotes.length} {rfq.quotes.length === 1 ? 'Quote' : 'Quotes'}
                              </span>
                            </div>
                            {rfq.quotes.some((q) => q.status === 'accepted') && (
                              <Badge variant="outline" className="text-green-600 border-green-200">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                {rfq.quotes.filter((q) => q.status === 'accepted').length} Accepted
                              </Badge>
                            )}
                          </div>
                        )}

                        {/* Footer */}
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>
                            Created {formatDistanceToNow(new Date(rfq.createdAt), { addSuffix: true })}
                          </span>
                          {rfq.deliveryDeadline && (
                            <>
                              <span>•</span>
                              <span>Delivery by: {new Date(rfq.deliveryDeadline).toLocaleDateString()}</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/rfq/${rfq.id}`}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </Link>
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
