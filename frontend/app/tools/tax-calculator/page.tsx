'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Calculator,
  Download,
  Info,
  FileText,
  TrendingUp,
  AlertCircle,
  Globe,
  DollarSign,
  Package,
  Clock,
  BookOpen,
  Save,
  Trash2,
  Search,
  ChevronRight,
} from 'lucide-react'
import { formatPrice, formatDate, generateId } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

// Types
interface ProductCategory {
  id: string
  name: string
  hsCode: string
  description: string
  averageDuty: number
}

interface Country {
  code: string
  name: string
  region: string
  vatRate: number
  dutyThreshold: number
  currency: string
}

interface ShippingMethod {
  id: string
  name: string
  description: string
  estimatedDays: string
}

interface TaxCalculation {
  id: string
  timestamp: string
  productCategory: string
  productValue: number
  originCountry: string
  destinationCountry: string
  shippingMethod: string
  weight: number
  dutyRate: number
  dutyAmount: number
  vatRate: number
  vatAmount: number
  otherTaxes: number
  totalLandedCost: number
  currency: string
}

// Data
const productCategories: ProductCategory[] = [
  { id: 'electronics', name: 'Electronics & Computers', hsCode: '8471', description: 'Laptops, phones, tablets, computers', averageDuty: 0 },
  { id: 'textiles', name: 'Textiles & Apparel', hsCode: '6201-6211', description: 'Clothing, fabrics, garments', averageDuty: 16.5 },
  { id: 'machinery', name: 'Machinery & Equipment', hsCode: '8419-8479', description: 'Industrial machines, tools', averageDuty: 2.5 },
  { id: 'food', name: 'Food & Beverages', hsCode: '0401-2106', description: 'Processed foods, drinks', averageDuty: 15 },
  { id: 'cosmetics', name: 'Beauty & Cosmetics', hsCode: '3304', description: 'Makeup, skincare, perfumes', averageDuty: 6.5 },
  { id: 'furniture', name: 'Furniture & Home Goods', hsCode: '9401-9403', description: 'Chairs, tables, home decor', averageDuty: 4.5 },
  { id: 'toys', name: 'Toys & Games', hsCode: '9503', description: 'Children toys, games', averageDuty: 0 },
  { id: 'automotive', name: 'Automotive Parts', hsCode: '8708', description: 'Car parts, accessories', averageDuty: 3 },
  { id: 'jewelry', name: 'Jewelry & Watches', hsCode: '7113-7114', description: 'Jewelry, precious metals, watches', averageDuty: 5.5 },
  { id: 'sports', name: 'Sports & Outdoor', hsCode: '9506', description: 'Sports equipment, outdoor gear', averageDuty: 4 },
  { id: 'medical', name: 'Medical Equipment', hsCode: '9018-9022', description: 'Medical devices, instruments', averageDuty: 0 },
  { id: 'chemicals', name: 'Chemicals & Materials', hsCode: '2801-3826', description: 'Industrial chemicals, materials', averageDuty: 5 },
]

const countries: Country[] = [
  { code: 'US', name: 'United States', region: 'North America', vatRate: 0, dutyThreshold: 800, currency: 'USD' },
  { code: 'GB', name: 'United Kingdom', region: 'Europe', vatRate: 20, dutyThreshold: 135, currency: 'GBP' },
  { code: 'DE', name: 'Germany', region: 'Europe', vatRate: 19, dutyThreshold: 150, currency: 'EUR' },
  { code: 'FR', name: 'France', region: 'Europe', vatRate: 20, dutyThreshold: 150, currency: 'EUR' },
  { code: 'CN', name: 'China', region: 'Asia', vatRate: 13, dutyThreshold: 50, currency: 'CNY' },
  { code: 'JP', name: 'Japan', region: 'Asia', vatRate: 10, dutyThreshold: 130, currency: 'JPY' },
  { code: 'AU', name: 'Australia', region: 'Oceania', vatRate: 10, dutyThreshold: 1000, currency: 'AUD' },
  { code: 'CA', name: 'Canada', region: 'North America', vatRate: 5, dutyThreshold: 20, currency: 'CAD' },
  { code: 'IN', name: 'India', region: 'Asia', vatRate: 18, dutyThreshold: 0, currency: 'INR' },
  { code: 'BR', name: 'Brazil', region: 'South America', vatRate: 17, dutyThreshold: 50, currency: 'BRL' },
  { code: 'NG', name: 'Nigeria', region: 'Africa', vatRate: 7.5, dutyThreshold: 0, currency: 'NGN' },
  { code: 'ZA', name: 'South Africa', region: 'Africa', vatRate: 15, dutyThreshold: 500, currency: 'ZAR' },
  { code: 'KE', name: 'Kenya', region: 'Africa', vatRate: 16, dutyThreshold: 0, currency: 'KES' },
  { code: 'AE', name: 'United Arab Emirates', region: 'Middle East', vatRate: 5, dutyThreshold: 1000, currency: 'AED' },
  { code: 'SG', name: 'Singapore', region: 'Asia', vatRate: 8, dutyThreshold: 400, currency: 'SGD' },
]

const shippingMethods: ShippingMethod[] = [
  { id: 'air-express', name: 'Air Express', description: 'Fastest delivery', estimatedDays: '3-7 days' },
  { id: 'air-standard', name: 'Air Standard', description: 'Fast and economical', estimatedDays: '7-14 days' },
  { id: 'sea-fcl', name: 'Sea Freight (FCL)', description: 'Full container load', estimatedDays: '25-45 days' },
  { id: 'sea-lcl', name: 'Sea Freight (LCL)', description: 'Less than container load', estimatedDays: '30-50 days' },
  { id: 'rail', name: 'Rail Freight', description: 'Eco-friendly option', estimatedDays: '20-35 days' },
  { id: 'road', name: 'Road Freight', description: 'Regional delivery', estimatedDays: '5-15 days' },
]

export default function TaxCalculatorPage() {
  const { toast } = useToast()

  // Form state
  const [category, setCategory] = useState<string>('')
  const [productValue, setProductValue] = useState<string>('')
  const [originCountry, setOriginCountry] = useState<string>('')
  const [destinationCountry, setDestinationCountry] = useState<string>('')
  const [shippingMethod, setShippingMethod] = useState<string>('')
  const [weight, setWeight] = useState<string>('')
  const [shippingCost, setShippingCost] = useState<string>('')

  // Results state
  const [calculation, setCalculation] = useState<TaxCalculation | null>(null)
  const [history, setHistory] = useState<TaxCalculation[]>([])

  // Search state for HS Code lookup
  const [hsSearchQuery, setHsSearchQuery] = useState('')
  const [filteredCategories, setFilteredCategories] = useState(productCategories)

  // Load history from localStorage
  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem('taxCalculatorHistory')
      if (savedHistory) {
        setHistory(JSON.parse(savedHistory))
      }
    } catch {
      localStorage.removeItem('taxCalculatorHistory')
    }
  }, [])

  // Filter categories based on search
  useEffect(() => {
    if (hsSearchQuery.trim()) {
      const filtered = productCategories.filter(cat =>
        cat.name.toLowerCase().includes(hsSearchQuery.toLowerCase()) ||
        cat.hsCode.toLowerCase().includes(hsSearchQuery.toLowerCase()) ||
        cat.description.toLowerCase().includes(hsSearchQuery.toLowerCase())
      )
      setFilteredCategories(filtered)
    } else {
      setFilteredCategories(productCategories)
    }
  }, [hsSearchQuery])

  const calculateTaxes = () => {
    // Validation
    if (!category || !productValue || !originCountry || !destinationCountry || !shippingMethod || !weight) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      })
      return
    }

    const value = parseFloat(productValue)
    const shipCost = parseFloat(shippingCost) || 0

    if (isNaN(value) || value <= 0) {
      toast({
        title: 'Invalid Product Value',
        description: 'Please enter a valid product value',
        variant: 'destructive',
      })
      return
    }

    // Get category and country data
    const selectedCategory = productCategories.find(c => c.id === category)
    const destCountry = countries.find(c => c.code === destinationCountry)

    if (!selectedCategory || !destCountry) return

    // Calculate duty
    let dutyRate = selectedCategory.averageDuty
    let dutyAmount = 0

    // Check if value exceeds duty threshold
    if (value > destCountry.dutyThreshold) {
      dutyAmount = (value * dutyRate) / 100
    }

    // Calculate customs value (product value + shipping)
    const customsValue = value + shipCost

    // Calculate VAT/GST (applied to customs value + duty)
    const vatBaseAmount = customsValue + dutyAmount
    const vatRate = destCountry.vatRate
    const vatAmount = (vatBaseAmount * vatRate) / 100

    // Other taxes (simplified - can include handling fees, etc.)
    const otherTaxes = shipCost * 0.05 // 5% handling fee on shipping

    // Total landed cost
    const totalLandedCost = customsValue + dutyAmount + vatAmount + otherTaxes

    const result: TaxCalculation = {
      id: generateId(),
      timestamp: new Date().toISOString(),
      productCategory: selectedCategory.name,
      productValue: value,
      originCountry: countries.find(c => c.code === originCountry)?.name || originCountry,
      destinationCountry: destCountry.name,
      shippingMethod: shippingMethods.find(m => m.id === shippingMethod)?.name || shippingMethod,
      weight: parseFloat(weight),
      dutyRate,
      dutyAmount,
      vatRate,
      vatAmount,
      otherTaxes,
      totalLandedCost,
      currency: destCountry.currency,
    }

    setCalculation(result)

    toast({
      title: 'Calculation Complete',
      description: 'Tax and duty breakdown is ready',
    })
  }

  const saveCalculation = () => {
    if (!calculation) return

    const newHistory = [calculation, ...history.slice(0, 9)] // Keep last 10
    setHistory(newHistory)
    localStorage.setItem('taxCalculatorHistory', JSON.stringify(newHistory))

    toast({
      title: 'Saved',
      description: 'Calculation saved to history',
    })
  }

  const loadFromHistory = (calc: TaxCalculation) => {
    setCalculation(calc)

    // Populate form fields
    const cat = productCategories.find(c => c.name === calc.productCategory)
    const origin = countries.find(c => c.name === calc.originCountry)
    const dest = countries.find(c => c.name === calc.destinationCountry)
    const shipping = shippingMethods.find(m => m.name === calc.shippingMethod)

    if (cat) setCategory(cat.id)
    if (origin) setOriginCountry(origin.code)
    if (dest) setDestinationCountry(dest.code)
    if (shipping) setShippingMethod(shipping.id)
    setProductValue(calc.productValue.toString())
    setWeight(calc.weight.toString())

    toast({
      title: 'Loaded',
      description: 'Calculation loaded from history',
    })
  }

  const clearHistory = () => {
    setHistory([])
    localStorage.removeItem('taxCalculatorHistory')

    toast({
      title: 'History Cleared',
      description: 'All saved calculations have been deleted',
    })
  }

  const exportToPDF = () => {
    if (!calculation) return

    const html = generateCalculationPDF(calculation)

    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(html)
      printWindow.document.close()
      printWindow.onload = () => {
        printWindow.print()
      }
    }
  }

  const resetForm = () => {
    setCategory('')
    setProductValue('')
    setOriginCountry('')
    setDestinationCountry('')
    setShippingMethod('')
    setWeight('')
    setShippingCost('')
    setCalculation(null)
  }

  return (
    <div className="container py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-display mb-2 flex items-center gap-3">
          <Calculator className="h-8 w-8 text-primary" />
          Tax & Duty Calculator
        </h1>
        <p className="text-muted-foreground">
          Calculate import duties, VAT/GST, and total landed costs for international shipments
        </p>
      </div>

      {/* Info Banner */}
      <Card className="mb-8 border-blue-200 dark:border-blue-800 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                Professional Tax & Duty Calculator
              </h3>
              <p className="text-sm text-blue-700 dark:text-blue-300 leading-relaxed">
                Get accurate estimates for import duties, VAT/GST, and total landed costs across 15+ countries.
                Our calculator uses real tariff rates and country-specific tax rules. All estimates are for
                informational purposes and should be verified with customs authorities or a licensed customs broker.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Column - Calculator Form */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Shipment Details
              </CardTitle>
              <CardDescription>
                Enter your product and shipping information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Product Category */}
              <div className="space-y-2">
                <Label htmlFor="category">
                  Product Category <span className="text-red-500">*</span>
                </Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select product category" />
                  </SelectTrigger>
                  <SelectContent>
                    {productCategories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        <div className="flex flex-col">
                          <span className="font-medium">{cat.name}</span>
                          <span className="text-xs text-muted-foreground">
                            HS Code: {cat.hsCode} • Avg Duty: {cat.averageDuty}%
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {category && (
                  <p className="text-xs text-muted-foreground">
                    {productCategories.find(c => c.id === category)?.description}
                  </p>
                )}
              </div>

              {/* Product Value */}
              <div className="space-y-2">
                <Label htmlFor="value">
                  Product Value (FOB) <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="value"
                    type="number"
                    placeholder="0.00"
                    value={productValue}
                    onChange={(e) => setProductValue(e.target.value)}
                    className="pl-10"
                    step="0.01"
                    min="0"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Free On Board value (product cost excluding shipping)
                </p>
              </div>

              {/* Weight */}
              <div className="space-y-2">
                <Label htmlFor="weight">
                  Total Weight (kg) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="weight"
                  type="number"
                  placeholder="0.00"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  step="0.01"
                  min="0"
                />
              </div>

              {/* Shipping Cost */}
              <div className="space-y-2">
                <Label htmlFor="shipping-cost">
                  Shipping Cost (optional)
                </Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="shipping-cost"
                    type="number"
                    placeholder="0.00"
                    value={shippingCost}
                    onChange={(e) => setShippingCost(e.target.value)}
                    className="pl-10"
                    step="0.01"
                    min="0"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Freight and insurance costs (included in customs value)
                </p>
              </div>

              <Separator />

              {/* Countries */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="origin">
                    Origin Country <span className="text-red-500">*</span>
                  </Label>
                  <Select value={originCountry} onValueChange={setOriginCountry}>
                    <SelectTrigger id="origin">
                      <SelectValue placeholder="Select origin" />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map((country) => (
                        <SelectItem key={country.code} value={country.code}>
                          {country.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="destination">
                    Destination Country <span className="text-red-500">*</span>
                  </Label>
                  <Select value={destinationCountry} onValueChange={setDestinationCountry}>
                    <SelectTrigger id="destination">
                      <SelectValue placeholder="Select destination" />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map((country) => (
                        <SelectItem key={country.code} value={country.code}>
                          <div className="flex flex-col">
                            <span>{country.name}</span>
                            <span className="text-xs text-muted-foreground">
                              VAT: {country.vatRate}% • Threshold: {formatPrice(country.dutyThreshold, country.currency)}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Shipping Method */}
              <div className="space-y-2">
                <Label htmlFor="shipping">
                  Shipping Method <span className="text-red-500">*</span>
                </Label>
                <Select value={shippingMethod} onValueChange={setShippingMethod}>
                  <SelectTrigger id="shipping">
                    <SelectValue placeholder="Select shipping method" />
                  </SelectTrigger>
                  <SelectContent>
                    {shippingMethods.map((method) => (
                      <SelectItem key={method.id} value={method.id}>
                        <div className="flex flex-col">
                          <span className="font-medium">{method.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {method.description} • {method.estimatedDays}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={calculateTaxes}
                  className="flex-1"
                  size="lg"
                >
                  <Calculator className="h-4 w-4 mr-2" />
                  Calculate
                </Button>
                <Button
                  onClick={resetForm}
                  variant="outline"
                  size="lg"
                >
                  Reset
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Results */}
          {calculation && (
            <Card className="border-primary/20 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-primary/10 to-accent/10">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-primary" />
                      Calculation Results
                    </CardTitle>
                    <CardDescription>
                      Detailed breakdown of taxes and duties
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={saveCalculation}
                      variant="outline"
                      size="sm"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Save
                    </Button>
                    <Button
                      onClick={exportToPDF}
                      variant="outline"
                      size="sm"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      PDF
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                {/* Summary Info */}
                <div className="grid sm:grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Product Category</p>
                    <p className="font-medium">{calculation.productCategory}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Route</p>
                    <p className="font-medium">
                      {calculation.originCountry} → {calculation.destinationCountry}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Shipping Method</p>
                    <p className="font-medium">{calculation.shippingMethod}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Weight</p>
                    <p className="font-medium">{calculation.weight} kg</p>
                  </div>
                </div>

                <Separator />

                {/* Cost Breakdown */}
                <div className="space-y-3">
                  <h3 className="font-semibold flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Cost Breakdown
                  </h3>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center py-2">
                      <span className="text-sm">Product Value (FOB)</span>
                      <span className="font-medium">
                        {formatPrice(calculation.productValue, calculation.currency)}
                      </span>
                    </div>

                    {parseFloat(shippingCost) > 0 && (
                      <div className="flex justify-between items-center py-2 border-t">
                        <span className="text-sm">Shipping & Insurance</span>
                        <span className="font-medium">
                          {formatPrice(parseFloat(shippingCost), calculation.currency)}
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between items-center py-2 border-t">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">Import Duty</span>
                        <Badge variant="secondary" className="text-xs">
                          {calculation.dutyRate}%
                        </Badge>
                      </div>
                      <span className="font-medium">
                        {formatPrice(calculation.dutyAmount, calculation.currency)}
                      </span>
                    </div>

                    {calculation.dutyAmount === 0 && (
                      <p className="text-xs text-muted-foreground pl-4">
                        <AlertCircle className="h-3 w-3 inline mr-1" />
                        Below duty-free threshold or duty-exempt category
                      </p>
                    )}

                    <div className="flex justify-between items-center py-2 border-t">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">VAT / GST</span>
                        <Badge variant="secondary" className="text-xs">
                          {calculation.vatRate}%
                        </Badge>
                      </div>
                      <span className="font-medium">
                        {formatPrice(calculation.vatAmount, calculation.currency)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center py-2 border-t">
                      <span className="text-sm">Handling & Other Fees</span>
                      <span className="font-medium">
                        {formatPrice(calculation.otherTaxes, calculation.currency)}
                      </span>
                    </div>

                    <Separator className="my-3" />

                    <div className="flex justify-between items-center py-3 bg-primary/5 px-4 rounded-lg">
                      <span className="font-semibold text-lg">Total Landed Cost</span>
                      <span className="font-bold text-2xl text-primary">
                        {formatPrice(calculation.totalLandedCost, calculation.currency)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Explanations */}
                <div className="space-y-3 bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
                  <h3 className="font-semibold text-sm flex items-center gap-2 text-blue-900 dark:text-blue-100">
                    <BookOpen className="h-4 w-4" />
                    Understanding Your Costs
                  </h3>

                  <div className="space-y-2 text-xs text-blue-800 dark:text-blue-200">
                    <div>
                      <span className="font-semibold">Import Duty:</span> Tax imposed by the destination
                      country on imported goods, calculated as a percentage of the product value.
                    </div>
                    <div>
                      <span className="font-semibold">VAT/GST:</span> Value Added Tax or Goods and Services
                      Tax applied to the total customs value (product + shipping + duty).
                    </div>
                    <div>
                      <span className="font-semibold">Landed Cost:</span> The total cost of getting your
                      product from the supplier to your door, including all taxes, duties, and fees.
                    </div>
                  </div>
                </div>

                {/* Country-Specific Notes */}
                <CountrySpecificNotes
                  countryCode={destinationCountry}
                  countries={countries}
                />
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Tools & History */}
        <div className="space-y-6">
          {/* HS Code Lookup */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Search className="h-4 w-4" />
                HS Code Lookup
              </CardTitle>
              <CardDescription className="text-xs">
                Find the right classification for your product
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by product or HS code..."
                  value={hsSearchQuery}
                  onChange={(e) => setHsSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              <ScrollArea className="h-[300px]">
                <div className="space-y-2">
                  {filteredCategories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => {
                        setCategory(cat.id)
                        setHsSearchQuery('')
                      }}
                      className="w-full p-3 text-left hover:bg-muted rounded-lg transition-colors border border-transparent hover:border-primary/20"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{cat.name}</p>
                          <p className="text-xs text-muted-foreground">HS: {cat.hsCode}</p>
                        </div>
                        <Badge variant="outline" className="text-xs shrink-0">
                          {cat.averageDuty}%
                        </Badge>
                      </div>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Coverage
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-primary/5 rounded-lg">
                  <p className="text-2xl font-bold text-primary">{countries.length}</p>
                  <p className="text-xs text-muted-foreground">Countries</p>
                </div>
                <div className="p-3 bg-accent/5 rounded-lg">
                  <p className="text-2xl font-bold text-accent">{productCategories.length}</p>
                  <p className="text-xs text-muted-foreground">Categories</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Calculation History */}
          {history.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Recent Calculations
                  </CardTitle>
                  <Button
                    onClick={clearHistory}
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs"
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Clear
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <div className="space-y-2">
                    {history.map((calc) => (
                      <button
                        key={calc.id}
                        onClick={() => loadFromHistory(calc)}
                        className="w-full p-3 text-left hover:bg-muted rounded-lg transition-colors border border-transparent hover:border-primary/20"
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <p className="font-medium text-sm">{calc.productCategory}</p>
                          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                        </div>
                        <div className="space-y-1 text-xs text-muted-foreground">
                          <p>{calc.originCountry} → {calc.destinationCountry}</p>
                          <p className="font-medium text-primary">
                            {formatPrice(calc.totalLandedCost, calc.currency)}
                          </p>
                          <p className="text-[10px]">
                            {formatDate(calc.timestamp)}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}

          {/* Important Notice */}
          <Card className="border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20">
            <CardContent className="p-4">
              <div className="flex gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-2 text-xs text-amber-800 dark:text-amber-200">
                  <p className="font-semibold">Important Disclaimer</p>
                  <p className="leading-relaxed">
                    These calculations are estimates based on standard tariff rates. Actual duties
                    and taxes may vary based on trade agreements, product specifications, and current
                    regulations. Always consult with a licensed customs broker for accurate quotes.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

// Country-Specific Notes Component
function CountrySpecificNotes({
  countryCode,
  countries
}: {
  countryCode: string
  countries: Country[]
}) {
  const country = countries.find(c => c.code === countryCode)
  if (!country) return null

  const notes: Record<string, string[]> = {
    US: [
      'De minimis value: $800 - shipments below this are duty-free',
      'No federal VAT/sales tax on imports (state sales tax may apply)',
      'Additional fees may include MPF (0.3464%) and HMF ($5.29-$528.33)',
    ],
    GB: [
      'Duty threshold: £135 for most goods',
      'Brexit regulations apply - may differ from EU',
      'Additional handling fees may be charged by courier',
    ],
    CN: [
      'Strict customs regulations and documentation requirements',
      'Import license required for many product categories',
      'Consumption tax may apply to specific goods (alcohol, cosmetics, etc.)',
    ],
    NG: [
      'All imports subject to duty regardless of value',
      'PAAR (Pre-Arrival Assessment Report) required',
      'Additional levies may include ECOWAS levy and CISS',
    ],
    AU: [
      'Goods valued under AUD 1,000 are GST-free',
      'Strict biosecurity requirements for food and agricultural products',
      'Additional Import Processing Charge (IPC) may apply',
    ],
  }

  const countryNotes = notes[countryCode] || [
    'Standard import procedures apply',
    'Verify specific requirements with customs authorities',
  ]

  return (
    <div className="space-y-3 bg-green-50 dark:bg-green-950/20 p-4 rounded-lg">
      <h3 className="font-semibold text-sm flex items-center gap-2 text-green-900 dark:text-green-100">
        <Globe className="h-4 w-4" />
        {country.name} - Specific Information
      </h3>

      <ul className="space-y-1.5 text-xs text-green-800 dark:text-green-200">
        {countryNotes.map((note, index) => (
          <li key={index} className="flex items-start gap-2">
            <span className="text-green-600 dark:text-green-400 mt-0.5">•</span>
            <span>{note}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

// PDF Generation Function
function generateCalculationPDF(calculation: TaxCalculation): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tax & Duty Calculation - ${calculation.id}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #333;
      background: #fff;
      padding: 40px;
    }

    .header {
      border-bottom: 3px solid #2563eb;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }

    .header h1 {
      font-size: 28px;
      color: #2563eb;
      margin-bottom: 5px;
    }

    .header .subtitle {
      color: #666;
      font-size: 14px;
    }

    .section {
      margin-bottom: 30px;
    }

    .section-title {
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 15px;
      color: #1e40af;
    }

    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 15px;
      margin-bottom: 20px;
    }

    .info-item {
      padding: 12px;
      background: #f9fafb;
      border-radius: 6px;
    }

    .info-label {
      font-size: 11px;
      text-transform: uppercase;
      color: #666;
      margin-bottom: 4px;
      font-weight: 600;
    }

    .info-value {
      font-size: 14px;
      font-weight: 500;
    }

    .breakdown-table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }

    .breakdown-table tr {
      border-bottom: 1px solid #e5e7eb;
    }

    .breakdown-table td {
      padding: 12px 0;
      font-size: 14px;
    }

    .breakdown-table td:last-child {
      text-align: right;
      font-weight: 500;
    }

    .breakdown-table .total-row {
      border-top: 2px solid #e5e7eb;
      border-bottom: 2px solid #e5e7eb;
      font-weight: 700;
      font-size: 18px;
    }

    .breakdown-table .total-row td {
      padding: 16px 0;
      color: #2563eb;
    }

    .badge {
      display: inline-block;
      padding: 2px 8px;
      background: #e0e7ff;
      color: #3730a3;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 600;
      margin-left: 8px;
    }

    .disclaimer {
      margin-top: 40px;
      padding: 20px;
      background: #fef3c7;
      border-left: 4px solid #f59e0b;
      border-radius: 6px;
    }

    .disclaimer-title {
      font-weight: 600;
      margin-bottom: 8px;
      color: #92400e;
    }

    .disclaimer-text {
      font-size: 12px;
      color: #78350f;
      line-height: 1.6;
    }

    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 2px solid #e5e7eb;
      text-align: center;
      font-size: 12px;
      color: #666;
    }

    @media print {
      body {
        padding: 20px;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Tax & Duty Calculation Report</h1>
    <div class="subtitle">Generated on ${formatDate(calculation.timestamp)}</div>
  </div>

  <div class="section">
    <div class="section-title">Shipment Information</div>
    <div class="info-grid">
      <div class="info-item">
        <div class="info-label">Product Category</div>
        <div class="info-value">${calculation.productCategory}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Product Value</div>
        <div class="info-value">${formatPrice(calculation.productValue, calculation.currency)}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Origin Country</div>
        <div class="info-value">${calculation.originCountry}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Destination Country</div>
        <div class="info-value">${calculation.destinationCountry}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Shipping Method</div>
        <div class="info-value">${calculation.shippingMethod}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Total Weight</div>
        <div class="info-value">${calculation.weight} kg</div>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Cost Breakdown</div>
    <table class="breakdown-table">
      <tr>
        <td>Product Value (FOB)</td>
        <td>${formatPrice(calculation.productValue, calculation.currency)}</td>
      </tr>
      <tr>
        <td>
          Import Duty
          <span class="badge">${calculation.dutyRate}%</span>
        </td>
        <td>${formatPrice(calculation.dutyAmount, calculation.currency)}</td>
      </tr>
      <tr>
        <td>
          VAT / GST
          <span class="badge">${calculation.vatRate}%</span>
        </td>
        <td>${formatPrice(calculation.vatAmount, calculation.currency)}</td>
      </tr>
      <tr>
        <td>Handling & Other Fees</td>
        <td>${formatPrice(calculation.otherTaxes, calculation.currency)}</td>
      </tr>
      <tr class="total-row">
        <td>TOTAL LANDED COST</td>
        <td>${formatPrice(calculation.totalLandedCost, calculation.currency)}</td>
      </tr>
    </table>
  </div>

  <div class="disclaimer">
    <div class="disclaimer-title">Important Disclaimer</div>
    <div class="disclaimer-text">
      This calculation is an estimate based on standard tariff rates and typical import procedures.
      Actual duties, taxes, and fees may vary depending on:
      <ul style="margin-top: 8px; margin-left: 20px;">
        <li>Specific product classification and HS code verification</li>
        <li>Trade agreements and preferential tariff programs</li>
        <li>Current customs regulations and policy changes</li>
        <li>Additional handling fees charged by carriers or brokers</li>
        <li>Currency exchange rate fluctuations</li>
      </ul>
      <br>
      For accurate quotes and compliance with import regulations, please consult with a licensed
      customs broker or freight forwarder. This report is for informational purposes only and
      does not constitute professional customs or legal advice.
    </div>
  </div>

  <div class="footer">
    <p><strong>Channah Tax & Duty Calculator</strong></p>
    <p>Premium Marketplace | www.channah.com</p>
    <p style="margin-top: 8px;">Report ID: ${calculation.id}</p>
  </div>
</body>
</html>
  `.trim()
}
