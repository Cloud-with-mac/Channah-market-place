'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Package, Box, TrendingUp, Info } from 'lucide-react'

interface ContainerSpec {
  name: string
  length: number // cm
  width: number // cm
  height: number // cm
  maxWeight: number // kg
  cubicMeters: number
}

const CONTAINERS: Record<string, ContainerSpec> = {
  '20ft': {
    name: '20ft Container',
    length: 589,
    width: 235,
    height: 239,
    maxWeight: 21800,
    cubicMeters: 33.2,
  },
  '40ft': {
    name: '40ft Container',
    length: 1203,
    width: 235,
    height: 239,
    maxWeight: 26700,
    cubicMeters: 67.7,
  },
  '40ft-hc': {
    name: '40ft High Cube',
    length: 1203,
    width: 235,
    height: 269,
    maxWeight: 26500,
    cubicMeters: 76.3,
  },
}

export function ContainerCalculator() {
  const [containerType, setContainerType] = useState<string>('20ft')
  const [packageLength, setPackageLength] = useState('')
  const [packageWidth, setPackageWidth] = useState('')
  const [packageHeight, setPackageHeight] = useState('')
  const [packageWeight, setPackageWeight] = useState('')
  const [stackable, setStackable] = useState(true)
  const [result, setResult] = useState<any>(null)

  const handleCalculate = () => {
    const l = parseFloat(packageLength)
    const w = parseFloat(packageWidth)
    const h = parseFloat(packageHeight)
    const weight = parseFloat(packageWeight)

    if (isNaN(l) || isNaN(w) || isNaN(h) || isNaN(weight)) {
      return
    }

    const container = CONTAINERS[containerType]

    // Calculate how many units fit (simple calculation)
    const unitsPerLength = Math.floor(container.length / l)
    const unitsPerWidth = Math.floor(container.width / w)
    const unitsPerHeight = stackable ? Math.floor(container.height / h) : 1

    const unitsBySpace = unitsPerLength * unitsPerWidth * unitsPerHeight

    // Calculate weight limit
    const unitsByWeight = Math.floor(container.maxWeight / weight)

    // The limiting factor determines actual capacity
    const actualCapacity = Math.min(unitsBySpace, unitsByWeight)
    const limitingFactor = unitsBySpace <= unitsByWeight ? 'space' : 'weight'

    // Calculate volume utilization
    const packageVolume = (l * w * h) / 1000000 // m³
    const totalPackageVolume = packageVolume * actualCapacity
    const volumeUtilization = (totalPackageVolume / container.cubicMeters) * 100

    // Calculate weight utilization
    const totalWeight = weight * actualCapacity
    const weightUtilization = (totalWeight / container.maxWeight) * 100

    setResult({
      capacity: actualCapacity,
      limitingFactor,
      volumeUtilization: volumeUtilization.toFixed(1),
      weightUtilization: weightUtilization.toFixed(1),
      totalWeight: totalWeight.toFixed(0),
      unitsPerLength,
      unitsPerWidth,
      unitsPerHeight,
      containerCubicMeters: container.cubicMeters,
    })
  }

  const container = CONTAINERS[containerType]

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Box className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="font-bold text-lg">Container Load Calculator</h3>
          <p className="text-sm text-muted-foreground">
            Calculate how many units fit in a shipping container
          </p>
        </div>
      </div>

      <Tabs value={containerType} onValueChange={setContainerType}>
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="20ft">20ft</TabsTrigger>
          <TabsTrigger value="40ft">40ft</TabsTrigger>
          <TabsTrigger value="40ft-hc">40ft HC</TabsTrigger>
        </TabsList>

        <TabsContent value={containerType} className="space-y-4">
          {/* Container Info */}
          <div className="grid grid-cols-2 gap-3 p-4 bg-muted rounded-lg text-sm">
            <div>
              <p className="text-muted-foreground text-xs">Internal Dimensions</p>
              <p className="font-semibold">
                {container.length} × {container.width} × {container.height} cm
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Max Load</p>
              <p className="font-semibold">{container.maxWeight.toLocaleString()} kg</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Volume</p>
              <p className="font-semibold">{container.cubicMeters} m³</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Type</p>
              <p className="font-semibold">{container.name}</p>
            </div>
          </div>

          {/* Package Dimensions Input */}
          <div className="space-y-4">
            <div>
              <Label className="mb-2 block">Package Dimensions (cm)</Label>
              <div className="grid grid-cols-3 gap-2">
                <Input
                  placeholder="Length"
                  type="number"
                  value={packageLength}
                  onChange={(e) => setPackageLength(e.target.value)}
                />
                <Input
                  placeholder="Width"
                  type="number"
                  value={packageWidth}
                  onChange={(e) => setPackageWidth(e.target.value)}
                />
                <Input
                  placeholder="Height"
                  type="number"
                  value={packageHeight}
                  onChange={(e) => setPackageHeight(e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="packageWeight">Weight per package (kg)</Label>
              <Input
                id="packageWeight"
                type="number"
                placeholder="10"
                value={packageWeight}
                onChange={(e) => setPackageWeight(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="stackable"
                checked={stackable}
                onChange={(e) => setStackable(e.target.checked)}
                className="h-4 w-4"
              />
              <Label htmlFor="stackable" className="cursor-pointer">
                Packages are stackable
              </Label>
            </div>

            <Button onClick={handleCalculate} className="w-full" size="lg">
              <Box className="h-4 w-4 mr-2" />
              Calculate Container Load
            </Button>
          </div>

          {/* Results */}
          {result && (
            <>
              <Separator className="my-6" />

              <div className="space-y-4">
                {/* Main Result */}
                <div className="text-center p-6 bg-gradient-to-br from-primary/10 to-accent/10 rounded-xl">
                  <p className="text-sm text-muted-foreground mb-2">
                    Maximum Capacity
                  </p>
                  <p className="text-5xl font-bold text-primary mb-2">
                    {result.capacity.toLocaleString()}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    units per {container.name}
                  </p>
                  {result.limitingFactor && (
                    <Badge variant="outline" className="mt-3">
                      <Info className="h-3 w-3 mr-1" />
                      Limited by {result.limitingFactor}
                    </Badge>
                  )}
                </div>

                {/* Detailed Breakdown */}
                <div className="grid md:grid-cols-2 gap-4">
                  {/* Space Utilization */}
                  <Card className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-semibold">Space Utilization</span>
                      <Badge>{result.volumeUtilization}%</Badge>
                    </div>
                    <div className="w-full bg-muted rounded-full h-3 mb-2">
                      <div
                        className="bg-primary h-3 rounded-full transition-all"
                        style={{ width: `${Math.min(100, result.volumeUtilization)}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {result.unitsPerLength} × {result.unitsPerWidth} ×{' '}
                      {result.unitsPerHeight} arrangement
                    </p>
                  </Card>

                  {/* Weight Utilization */}
                  <Card className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-semibold">Weight Utilization</span>
                      <Badge>{result.weightUtilization}%</Badge>
                    </div>
                    <div className="w-full bg-muted rounded-full h-3 mb-2">
                      <div
                        className="bg-primary h-3 rounded-full transition-all"
                        style={{ width: `${Math.min(100, result.weightUtilization)}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {result.totalWeight} kg / {container.maxWeight.toLocaleString()} kg
                    </p>
                  </Card>
                </div>

                {/* Optimization Tips */}
                {(parseFloat(result.volumeUtilization) < 70 ||
                  parseFloat(result.weightUtilization) < 70) && (
                  <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                    <div className="flex items-start gap-2">
                      <TrendingUp className="h-4 w-4 text-amber-600 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-semibold text-amber-900 dark:text-amber-100 mb-1">
                          Optimization Tip
                        </p>
                        <p className="text-amber-700 dark:text-amber-300 text-xs">
                          {parseFloat(result.volumeUtilization) < 70
                            ? 'Consider adjusting package dimensions to better utilize container space.'
                            : 'Container space is well utilized, but weight capacity is underused. Consider denser packaging.'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Info Note */}
      <div className="mt-6 p-3 bg-muted rounded-lg text-xs text-muted-foreground">
        <p>
          * Calculations assume perfectly rectangular packages with no gaps. Actual capacity
          may vary based on packaging efficiency, pallet requirements, and loading
          practices.
        </p>
      </div>
    </Card>
  )
}
