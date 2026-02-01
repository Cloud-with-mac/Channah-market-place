'use client'

import { Shield, Truck, Package2, Clock, CheckCircle2, Globe } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface TradeAssurancePanelProps {
  moq?: number
  sampleAvailable?: boolean
  samplePrice?: number
  leadTime?: string
  shippingMethods?: string[]
  paymentTerms?: string[]
}

export function TradeAssurancePanel({
  moq = 1,
  sampleAvailable = true,
  samplePrice,
  leadTime = '7-15 days',
  shippingMethods = ['Sea Freight', 'Air Freight', 'Express Delivery'],
  paymentTerms = ['PayPal', 'Credit Card', 'Debit Card'],
}: TradeAssurancePanelProps) {
  return (
    <Card className="border-2 border-border overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-5 py-3.5">
        <div className="flex items-center gap-2 text-white">
          <Shield className="h-5 w-5" />
          <h3 className="font-bold text-sm">Trade Assurance & Logistics</h3>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 space-y-4">
        {/* MOQ */}
        <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 border border-border">
          <div className="flex items-center justify-center h-9 w-9 rounded-full bg-primary/10 flex-shrink-0">
            <Package2 className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-muted-foreground mb-0.5">
              Minimum Order Quantity
            </p>
            <p className="text-base font-bold text-foreground">
              {moq} {moq === 1 ? 'unit' : 'units'}
            </p>
          </div>
        </div>

        {/* Sample Availability */}
        <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 border border-border">
          <div className="flex items-center justify-center h-9 w-9 rounded-full bg-purple-100 dark:bg-purple-950 flex-shrink-0">
            <CheckCircle2 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-muted-foreground mb-0.5">
              Sample Available
            </p>
            {sampleAvailable ? (
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300 border-0">
                  Yes
                </Badge>
                {samplePrice && (
                  <span className="text-sm text-muted-foreground">
                    ${samplePrice.toFixed(2)} per sample
                  </span>
                )}
              </div>
            ) : (
              <Badge variant="secondary" className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-0">
                Contact Supplier
              </Badge>
            )}
          </div>
        </div>

        {/* Lead Time */}
        <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 border border-border">
          <div className="flex items-center justify-center h-9 w-9 rounded-full bg-blue-100 dark:bg-blue-950 flex-shrink-0">
            <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-muted-foreground mb-0.5">
              Production Lead Time
            </p>
            <p className="text-base font-bold text-foreground">{leadTime}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              After payment confirmation
            </p>
          </div>
        </div>

        {/* Shipping Methods */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Truck className="h-4 w-4 text-primary" />
            <span>Shipping Methods</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {shippingMethods.map((method, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {method}
              </Badge>
            ))}
          </div>
        </div>

        {/* Payment Terms */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Globe className="h-4 w-4 text-primary" />
            <span>Payment Terms</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {paymentTerms.map((term, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {term}
              </Badge>
            ))}
          </div>
        </div>

        {/* Trade Assurance Banner */}
        <div className="mt-4 p-4 rounded-lg bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-2 border-green-200 dark:border-green-800">
          <div className="flex items-start gap-3">
            <Shield className="h-6 w-6 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-bold text-green-900 dark:text-green-100 mb-2">
                Protected by Trade Assurance
              </p>
              <ul className="space-y-1.5 text-xs text-green-700 dark:text-green-300">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                  <span>Full payment protection until delivery</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                  <span>Quality assurance & product verification</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                  <span>On-time shipment guarantee</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                  <span>Secure refund policy</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}
