'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Calculator, Package, Ship, Plane, Truck, TrendingDown } from 'lucide-react'

interface ShippingMethod {
  id: string
  name: string
  icon: any
  baseRate: number // USD per kg
  estimatedDays: string
  description: string
}

const SHIPPING_METHODS: ShippingMethod[] = [
  {
    id: 'sea',
    name: 'Sea Freight',
    icon: Ship,
    baseRate: 0.5,
    estimatedDays: '25-35',
    description: 'Most economical for large shipments',
  },
  {
    id: 'air',
    name: 'Air Freight',
    icon: Plane,
    baseRate: 4.5,
    estimatedDays: '5-7',
    description: 'Fast delivery for urgent orders',
  },
  {
    id: 'express',
    name: 'Express Delivery',
    icon: Truck,
    baseRate: 8.0,
    estimatedDays: '2-4',
    description: 'Fastest option with door-to-door service',
  },
]

interface ShippingCalculatorProps {
  defaultWeight?: number
  defaultDestination?: string
}

export function ShippingCalculator({
  defaultWeight = 100,
  defaultDestination = 'US',
}: ShippingCalculatorProps) {
  const [weight, setWeight] = useState(defaultWeight.toString())
  const [quantity, setQuantity] = useState('100')
  const [destination, setDestination] = useState(defaultDestination)
  const [results, setResults] = useState<any[]>([])
  const [calculated, setCalculated] = useState(false)

  // Regional multipliers
  const REGION_MULTIPLIERS: Record<string, number> = {
    US: 1.0,
    EU: 1.1,
    UK: 1.15,
    AU: 1.2,
    CA: 1.05,
    AS: 0.8, // Asia
    ME: 1.25, // Middle East
    AF: 1.3, // Africa
    SA: 1.15, // South America
  }

  const handleCalculate = () => {
    const weightNum = parseFloat(weight)
    const qtyNum = parseInt(quantity)

    if (isNaN(weightNum) || isNaN(qtyNum) || weightNum <= 0 || qtyNum <= 0) {
      return
    }

    const totalWeight = (weightNum * qtyNum) / 1000 // Convert to kg
    const regionMultiplier = REGION_MULTIPLIERS[destination] || 1.0

    const calculatedResults = SHIPPING_METHODS.map((method) => {
      const baseCost = totalWeight * method.baseRate * regionMultiplier

      // Add handling fees based on method
      const handlingFee = method.id === 'sea' ? 150 : method.id === 'air' ? 75 : 50

      const totalCost = baseCost + handlingFee
      const costPerUnit = totalCost / qtyNum

      return {
        ...method,
        totalCost,
        costPerUnit,
        totalWeight,
      }
    })

    setResults(calculatedResults)
    setCalculated(true)
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Calculator className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="font-bold text-lg">Shipping Calculator</h3>
          <p className="text-sm text-muted-foreground">
            Estimate shipping costs for your order
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Input Fields */}
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="quantity">Quantity (units)</Label>
            <Input
              id="quantity"
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="100"
              min="1"
            />
          </div>
          <div>
            <Label htmlFor="weight">Weight per unit (grams)</Label>
            <Input
              id="weight"
              type="number"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="100"
              min="1"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="destination">Destination</Label>
          <Select value={destination} onValueChange={setDestination}>
            <SelectTrigger id="destination">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="US">🇺🇸 United States</SelectItem>
              <SelectItem value="EU">🇪🇺 European Union</SelectItem>
              <SelectItem value="UK">🇬🇧 United Kingdom</SelectItem>
              <SelectItem value="CA">🇨🇦 Canada</SelectItem>
              <SelectItem value="AU">🇦🇺 Australia</SelectItem>
              <SelectItem value="AS">🌏 Asia Pacific</SelectItem>
              <SelectItem value="ME">🌍 Middle East</SelectItem>
              <SelectItem value="AF">🌍 Africa</SelectItem>
              <SelectItem value="SA">🌎 South America</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button onClick={handleCalculate} className="w-full" size="lg">
          <Calculator className="h-4 w-4 mr-2" />
          Calculate Shipping Costs
        </Button>
      </div>

      {/* Results */}
      {calculated && results.length > 0 && (
        <>
          <Separator className="my-6" />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold">Shipping Options</h4>
              <Badge variant="outline">
                <Package className="h-3 w-3 mr-1" />
                Total: {results[0].totalWeight.toFixed(2)} kg
              </Badge>
            </div>

            {results.map((result, index) => {
              const Icon = result.icon
              const isCheapest = index === 0

              return (
                <Card
                  key={result.id}
                  className={`p-4 ${
                    isCheapest
                      ? 'border-2 border-green-500 bg-green-50 dark:bg-green-950/20'
                      : 'border'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h5 className="font-semibold">{result.name}</h5>
                          {isCheapest && (
                            <Badge className="bg-green-600">
                              <TrendingDown className="h-3 w-3 mr-1" />
                              Best Value
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">
                          {result.description}
                        </p>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-muted-foreground">
                            Delivery: {result.estimatedDays} days
                          </span>
                          <span className="text-primary font-medium">
                            ${result.costPerUnit.toFixed(2)}/unit
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Total Cost</p>
                      <p className="text-2xl font-bold">
                        ${result.totalCost.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>

          {/* Info */}
          <div className="mt-4 p-3 bg-muted rounded-lg text-xs text-muted-foreground">
            <p>
              * Estimates include base shipping rates and handling fees. Final costs may
              vary based on dimensional weight, customs duties, and additional services.
            </p>
          </div>
        </>
      )}
    </Card>
  )
}
