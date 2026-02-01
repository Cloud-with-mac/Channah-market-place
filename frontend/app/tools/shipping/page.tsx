'use client'

import { ShippingCalculator } from '@/components/shipping/shipping-calculator'
import { ContainerCalculator } from '@/components/shipping/container-calculator'
import { LeadTimeEstimator } from '@/components/shipping/lead-time-estimator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Ship, Box, Clock, Info } from 'lucide-react'
import { Card } from '@/components/ui/card'

export default function ShippingToolsPage() {
  return (
    <div className="container py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-display mb-2">
          Logistics & Shipping Tools
        </h1>
        <p className="text-muted-foreground">
          Professional B2B shipping calculators and planning tools
        </p>
      </div>

      {/* Info Banner */}
      <Card className="p-4 mb-8 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-700 dark:text-blue-300">
            <p className="font-semibold mb-1">Free B2B Shipping Tools</p>
            <p className="text-xs">
              Use these professional calculators to estimate shipping costs, container
              loads, and delivery timelines for your international orders. All estimates
              are provided as general guidelines and should be verified with your chosen
              freight forwarder.
            </p>
          </div>
        </div>
      </Card>

      {/* Tools Tabs */}
      <Tabs defaultValue="shipping" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-8">
          <TabsTrigger value="shipping" className="flex items-center gap-2">
            <Ship className="h-4 w-4" />
            <span className="hidden sm:inline">Shipping Calculator</span>
            <span className="sm:hidden">Shipping</span>
          </TabsTrigger>
          <TabsTrigger value="container" className="flex items-center gap-2">
            <Box className="h-4 w-4" />
            <span className="hidden sm:inline">Container Load</span>
            <span className="sm:hidden">Container</span>
          </TabsTrigger>
          <TabsTrigger value="leadtime" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span className="hidden sm:inline">Lead Time</span>
            <span className="sm:hidden">Timeline</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="shipping">
          <ShippingCalculator />
        </TabsContent>

        <TabsContent value="container">
          <ContainerCalculator />
        </TabsContent>

        <TabsContent value="leadtime">
          <LeadTimeEstimator />
        </TabsContent>
      </Tabs>

      {/* Additional Resources */}
      <div className="mt-12 grid md:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Ship className="h-5 w-5 text-primary" />
            </div>
            <h3 className="font-semibold">Freight Forwarding</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Need help with international shipping? Our verified freight partners can
            handle customs, documentation, and door-to-door delivery.
          </p>
          <a
            href="/freight-partners"
            className="text-sm text-primary hover:underline font-medium"
          >
            Find Freight Partners →
          </a>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Box className="h-5 w-5 text-primary" />
            </div>
            <h3 className="font-semibold">Packaging Services</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Optimize your shipping costs with professional export packaging solutions
            from our trusted partners.
          </p>
          <a
            href="/packaging-partners"
            className="text-sm text-primary hover:underline font-medium"
          >
            View Packaging Options →
          </a>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Clock className="h-5 w-5 text-primary" />
            </div>
            <h3 className="font-semibold">Trade Insurance</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Protect your shipment with comprehensive cargo insurance covering loss,
            damage, and delays.
          </p>
          <a
            href="/trade-insurance"
            className="text-sm text-primary hover:underline font-medium"
          >
            Get Insurance Quote →
          </a>
        </Card>
      </div>
    </div>
  )
}
