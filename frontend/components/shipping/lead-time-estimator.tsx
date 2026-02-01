'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Clock, Factory, Ship, Plane, CheckCircle2, Calendar } from 'lucide-react'

interface LeadTimeBreakdown {
  production: number
  qualityCheck: number
  packaging: number
  shipping: number
  customs: number
  total: number
}

export function LeadTimeEstimator() {
  const [quantity, setQuantity] = useState('')
  const [moq, setMoq] = useState('100')
  const [productionComplexity, setProductionComplexity] = useState<string>('medium')
  const [shippingMethod, setShippingMethod] = useState<string>('sea')
  const [destination, setDestination] = useState<string>('US')
  const [customization, setCustomization] = useState<string>('none')
  const [result, setResult] = useState<LeadTimeBreakdown | null>(null)

  const handleCalculate = () => {
    const qty = parseInt(quantity)
    const minQty = parseInt(moq)

    if (isNaN(qty) || qty <= 0) {
      return
    }

    // Base production time (days)
    const complexityMultipliers: Record<string, number> = {
      simple: 0.7,
      medium: 1.0,
      complex: 1.5,
      'very-complex': 2.0,
    }

    const baseProduction = 7 // Base: 7 days for MOQ
    const complexityMult = complexityMultipliers[productionComplexity] || 1.0

    // Scale production time based on quantity
    const quantityRatio = qty / minQty
    let productionTime = baseProduction * complexityMult

    if (quantityRatio > 1) {
      // Add time for quantities above MOQ (diminishing returns)
      productionTime += Math.log2(quantityRatio) * 2
    }

    // Customization adds time
    const customizationDays: Record<string, number> = {
      none: 0,
      logo: 2,
      packaging: 3,
      full: 7,
    }
    productionTime += customizationDays[customization] || 0

    // Quality check
    const qualityCheck = qty > 1000 ? 3 : qty > 500 ? 2 : 1

    // Packaging
    const packaging = qty > 1000 ? 2 : 1

    // Shipping time
    const shippingTimes: Record<string, Record<string, number>> = {
      sea: { US: 28, EU: 25, UK: 30, AU: 20, CA: 25, AS: 10, ME: 20, AF: 30, SA: 25 },
      air: { US: 6, EU: 5, UK: 5, AU: 7, CA: 5, AS: 3, ME: 4, AF: 6, SA: 6 },
      express: { US: 3, EU: 3, UK: 3, AU: 4, CA: 3, AS: 2, ME: 3, AF: 4, SA: 4 },
    }
    const shipping = shippingTimes[shippingMethod]?.[destination] || 20

    // Customs clearance
    const customsClearance = shippingMethod === 'express' ? 1 : shippingMethod === 'air' ? 2 : 3

    const total =
      Math.ceil(productionTime) + qualityCheck + packaging + shipping + customsClearance

    setResult({
      production: Math.ceil(productionTime),
      qualityCheck,
      packaging,
      shipping,
      customs: customsClearance,
      total,
    })
  }

  // Calculate expected delivery date
  const getDeliveryDate = () => {
    if (!result) return null
    const today = new Date()
    const deliveryDate = new Date(today.setDate(today.getDate() + result.total))
    return deliveryDate.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Clock className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="font-bold text-lg">Lead Time Estimator</h3>
          <p className="text-sm text-muted-foreground">
            Estimate production and delivery timeline
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Order Details */}
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="quantity">Order Quantity</Label>
            <Input
              id="quantity"
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="1000"
              min="1"
            />
          </div>
          <div>
            <Label htmlFor="moq">Minimum Order Quantity</Label>
            <Input
              id="moq"
              type="number"
              value={moq}
              onChange={(e) => setMoq(e.target.value)}
              placeholder="100"
              min="1"
            />
          </div>
        </div>

        {/* Production Complexity */}
        <div>
          <Label htmlFor="complexity">Production Complexity</Label>
          <Select value={productionComplexity} onValueChange={setProductionComplexity}>
            <SelectTrigger id="complexity">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="simple">Simple (Basic items)</SelectItem>
              <SelectItem value="medium">Medium (Standard products)</SelectItem>
              <SelectItem value="complex">Complex (Multi-component)</SelectItem>
              <SelectItem value="very-complex">Very Complex (High precision)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Customization */}
        <div>
          <Label htmlFor="customization">Customization Level</Label>
          <Select value={customization} onValueChange={setCustomization}>
            <SelectTrigger id="customization">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              <SelectItem value="logo">Logo/Branding Only</SelectItem>
              <SelectItem value="packaging">Custom Packaging</SelectItem>
              <SelectItem value="full">Full Customization</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Shipping Details */}
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="shipping">Shipping Method</Label>
            <Select value={shippingMethod} onValueChange={setShippingMethod}>
              <SelectTrigger id="shipping">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sea">
                  <div className="flex items-center gap-2">
                    <Ship className="h-4 w-4" />
                    Sea Freight
                  </div>
                </SelectItem>
                <SelectItem value="air">
                  <div className="flex items-center gap-2">
                    <Plane className="h-4 w-4" />
                    Air Freight
                  </div>
                </SelectItem>
                <SelectItem value="express">
                  <div className="flex items-center gap-2">
                    <Plane className="h-4 w-4" />
                    Express
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
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
        </div>

        <Button onClick={handleCalculate} className="w-full" size="lg">
          <Clock className="h-4 w-4 mr-2" />
          Calculate Lead Time
        </Button>
      </div>

      {/* Results */}
      {result && (
        <div className="mt-6 space-y-4">
          {/* Expected Delivery */}
          <div className="text-center p-6 bg-gradient-to-br from-primary/10 to-accent/10 rounded-xl">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Calendar className="h-5 w-5 text-primary" />
              <p className="text-sm text-muted-foreground">Expected Delivery</p>
            </div>
            <p className="text-3xl font-bold text-primary mb-1">{getDeliveryDate()}</p>
            <Badge variant="outline" className="mt-2">
              {result.total} total days
            </Badge>
          </div>

          {/* Timeline Breakdown */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm">Timeline Breakdown</h4>

            {/* Production */}
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Factory className="h-4 w-4 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Production</p>
                <p className="text-xs text-muted-foreground">Manufacturing + customization</p>
              </div>
              <Badge variant="outline">{result.production} days</Badge>
            </div>

            {/* Quality Check */}
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Quality Inspection</p>
                <p className="text-xs text-muted-foreground">QC & testing</p>
              </div>
              <Badge variant="outline">{result.qualityCheck} days</Badge>
            </div>

            {/* Packaging */}
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <Clock className="h-4 w-4 text-purple-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Packaging & Prep</p>
                <p className="text-xs text-muted-foreground">Export packaging</p>
              </div>
              <Badge variant="outline">{result.packaging} days</Badge>
            </div>

            {/* Shipping */}
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <div className="p-2 bg-cyan-100 dark:bg-cyan-900/30 rounded-lg">
                {shippingMethod === 'sea' ? (
                  <Ship className="h-4 w-4 text-cyan-600" />
                ) : (
                  <Plane className="h-4 w-4 text-cyan-600" />
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">International Shipping</p>
                <p className="text-xs text-muted-foreground">
                  {shippingMethod === 'sea'
                    ? 'Sea freight'
                    : shippingMethod === 'air'
                    ? 'Air freight'
                    : 'Express delivery'}
                </p>
              </div>
              <Badge variant="outline">{result.shipping} days</Badge>
            </div>

            {/* Customs */}
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                <Clock className="h-4 w-4 text-amber-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Customs Clearance</p>
                <p className="text-xs text-muted-foreground">Import processing</p>
              </div>
              <Badge variant="outline">{result.customs} days</Badge>
            </div>
          </div>
        </div>
      )}

      {/* Info Note */}
      <div className="mt-6 p-3 bg-muted rounded-lg text-xs text-muted-foreground">
        <p>
          * Estimates are based on average lead times. Actual delivery may vary due to
          production capacity, holidays, weather conditions, and customs processing times.
        </p>
      </div>
    </Card>
  )
}
