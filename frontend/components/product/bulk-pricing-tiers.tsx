'use client'

import { TrendingDown, Package2 } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PriceDisplay } from '@/components/ui/price-display'

interface PriceTier {
  minQuantity: number
  maxQuantity?: number
  price: number
  discount?: number
}

interface BulkPricingTiersProps {
  basePrice: number
  tiers?: PriceTier[]
  moq?: number // Minimum Order Quantity
}

export function BulkPricingTiers({ basePrice, tiers, moq = 1 }: BulkPricingTiersProps) {
  // Generate default tiers if none provided
  const defaultTiers: PriceTier[] = [
    { minQuantity: 1, maxQuantity: 99, price: basePrice, discount: 0 },
    { minQuantity: 100, maxQuantity: 499, price: basePrice * 0.95, discount: 5 },
    { minQuantity: 500, maxQuantity: 999, price: basePrice * 0.90, discount: 10 },
    { minQuantity: 1000, price: basePrice * 0.85, discount: 15 },
  ]

  const pricingTiers = tiers && tiers.length > 0 ? tiers : defaultTiers

  return (
    <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-accent px-5 py-3">
        <div className="flex items-center gap-2 text-white">
          <TrendingDown className="h-5 w-5" />
          <h3 className="font-bold text-sm">Bulk Pricing - Save up to {Math.max(...pricingTiers.map(t => t.discount || 0))}%</h3>
        </div>
      </div>

      {/* Pricing Tiers */}
      <div className="p-5 space-y-3">
        {/* MOQ Badge */}
        {moq > 1 && (
          <div className="flex items-center gap-2 mb-4 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <Package2 className="h-4 w-4 text-amber-600" />
            <div className="flex-1">
              <p className="text-xs font-semibold text-amber-900 dark:text-amber-100">
                Minimum Order Quantity
              </p>
              <p className="text-sm font-bold text-amber-700 dark:text-amber-400">
                {moq} {moq === 1 ? 'unit' : 'units'}
              </p>
            </div>
          </div>
        )}

        {/* Tiers Grid */}
        <div className="grid gap-2">
          {pricingTiers.map((tier, index) => (
            <div
              key={index}
              className="group relative flex items-center justify-between p-4 rounded-xl border-2 border-border hover:border-primary/50 bg-background hover:bg-primary/5 transition-all duration-200"
            >
              {/* Quantity Range */}
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <Package2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {tier.minQuantity}{tier.maxQuantity ? `-${tier.maxQuantity}` : '+'} units
                  </p>
                  {tier.discount && tier.discount > 0 && (
                    <Badge variant="secondary" className="mt-1 text-xs bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300 border-0">
                      Save {tier.discount}%
                    </Badge>
                  )}
                </div>
              </div>

              {/* Price */}
              <div className="text-right">
                <PriceDisplay price={tier.price} size="lg" className="font-bold" />
                <p className="text-xs text-muted-foreground mt-0.5">per unit</p>
              </div>

              {/* Best Value Badge */}
              {index === pricingTiers.length - 1 && (
                <div className="absolute -top-2 -right-2">
                  <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 shadow-lg text-xs font-bold">
                    Best Value
                  </Badge>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer Note */}
        <p className="text-xs text-muted-foreground text-center pt-2 border-t border-border">
          💡 Larger quantities? <span className="text-primary font-semibold cursor-pointer hover:underline">Request a custom quote</span>
        </p>
      </div>
    </Card>
  )
}
