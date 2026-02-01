'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import {
  FileText,
  Users,
  TrendingUp,
  ArrowLeft,
} from 'lucide-react'
import Link from 'next/link'
import { RFQAnalytics } from '@/components/dashboard/rfq-analytics'
import { SupplierPerformance } from '@/components/dashboard/supplier-performance'
import { DemandAnalytics } from '@/components/dashboard/demand-analytics'

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Button variant="ghost" size="sm" asChild className="mb-2">
            <Link href="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>
          <h1 className="text-3xl font-bold font-display">B2B Analytics</h1>
          <p className="text-muted-foreground mt-1">
            Comprehensive business intelligence and performance metrics
          </p>
        </div>
      </div>

      {/* Analytics Tabs */}
      <Tabs defaultValue="rfq" className="w-full">
        <TabsList className="grid w-full max-w-2xl grid-cols-3">
          <TabsTrigger value="rfq" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">RFQ Analytics</span>
            <span className="sm:hidden">RFQ</span>
          </TabsTrigger>
          <TabsTrigger value="suppliers" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Suppliers</span>
            <span className="sm:hidden">Suppliers</span>
          </TabsTrigger>
          <TabsTrigger value="demand" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">Market Demand</span>
            <span className="sm:hidden">Demand</span>
          </TabsTrigger>
        </TabsList>

        <div className="mt-8">
          <TabsContent value="rfq">
            <RFQAnalytics />
          </TabsContent>

          <TabsContent value="suppliers">
            <SupplierPerformance />
          </TabsContent>

          <TabsContent value="demand">
            <DemandAnalytics />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
