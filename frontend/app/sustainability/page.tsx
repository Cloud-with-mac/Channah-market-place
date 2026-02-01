'use client'

import { useState, useMemo } from 'react'
import {
  Leaf,
  TrendingDown,
  Award,
  Building2,
  Calculator,
  FileBarChart,
  Zap,
  Droplet,
  Recycle,
  Wind,
  Trees,
  Sun,
  Waves,
  Factory,
  ShoppingBag,
  Check,
  Search,
  Filter,
  ArrowRight,
  Target,
  Trophy,
  BarChart3,
  DollarSign,
  MapPin,
  Calendar,
  ExternalLink,
  Info,
  Star,
  ChevronRight,
  Globe,
  Heart,
  Users,
  Package
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import {
  useSustainabilityStore,
  certificationDetails,
  type EcoProduct,
  type GreenSupplier,
  type OffsetProgram,
  type SustainabilityCertificationType as CertificationType
} from '@/store'
import { useCurrencyStore } from '@/store'

// Eco products - populated from API
const generateMockEcoProducts = (): EcoProduct[] => []

// Green suppliers - populated from API
const generateMockGreenSuppliers = (): GreenSupplier[] => []

export default function SustainabilityPage() {
  const { formatBasePrice } = useCurrencyStore()
  const {
    offsetPrograms,
    purchaseOffset,
    getTotalOffsetPurchased,
    userStats,
    updateUserStats
  } = useSustainabilityStore()

  // State
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCertifications, setSelectedCertifications] = useState<CertificationType[]>([])
  const [minScore, setMinScore] = useState(0)
  const [selectedTab, setSelectedTab] = useState('products')

  // Carbon Calculator State
  const [calcDistance, setCalcDistance] = useState(500)
  const [calcWeight, setCalcWeight] = useState(5)
  const [calcCategory, setCalcCategory] = useState('electronics')

  // Mock data
  const ecoProducts = useMemo(() => generateMockEcoProducts(), [])
  const greenSuppliers = useMemo(() => generateMockGreenSuppliers(), [])

  // Filtered products
  const filteredProducts = useMemo(() => {
    return ecoProducts.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesScore = product.sustainabilityScore >= minScore
      const matchesCerts = selectedCertifications.length === 0 ||
        selectedCertifications.some(cert => product.certifications.includes(cert))

      return matchesSearch && matchesScore && matchesCerts
    })
  }, [ecoProducts, searchQuery, minScore, selectedCertifications])

  // Filtered suppliers
  const filteredSuppliers = useMemo(() => {
    return greenSuppliers.filter(supplier => {
      const matchesSearch = supplier.name.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesScore = supplier.sustainabilityScore >= minScore
      const matchesCerts = selectedCertifications.length === 0 ||
        selectedCertifications.some(cert => supplier.certifications.includes(cert))

      return matchesSearch && matchesScore && matchesCerts
    })
  }, [greenSuppliers, searchQuery, minScore, selectedCertifications])

  // Carbon Calculator
  const calculateEmissions = () => {
    const categoryFactors: Record<string, number> = {
      electronics: 50,
      fashion: 15,
      furniture: 10,
      beauty: 5,
      food: 3,
      other: 8,
    }

    const productionEmissions = (categoryFactors[calcCategory] || 8) * calcWeight
    const packagingEmissions = 0.5
    const shippingEmissions = (calcDistance * calcWeight * 0.209) / 1000

    return {
      production: productionEmissions,
      packaging: packagingEmissions,
      shipping: shippingEmissions,
      total: productionEmissions + packagingEmissions + shippingEmissions,
    }
  }

  const emissions = calculateEmissions()

  // Toggle certification filter
  const toggleCertification = (cert: CertificationType) => {
    setSelectedCertifications(prev =>
      prev.includes(cert)
        ? prev.filter(c => c !== cert)
        : [...prev, cert]
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 via-emerald-50/30 to-white dark:from-green-950/20 dark:via-emerald-950/10 dark:to-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b bg-gradient-to-br from-green-600 via-emerald-600 to-teal-700 text-white">
        <div className="absolute inset-0 bg-grid-white/10" />
        <div className="container relative py-16 md:py-24">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 backdrop-blur-sm">
              <Leaf className="h-5 w-5" />
              <span className="text-sm font-medium">Sustainability Center</span>
            </div>

            <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
              Building a Greener
              <span className="block bg-gradient-to-r from-green-200 to-emerald-200 bg-clip-text text-transparent">
                Marketplace Together
              </span>
            </h1>

            <p className="mb-8 text-lg text-green-100 md:text-xl">
              Discover eco-friendly products, track your carbon footprint, and support green suppliers
              committed to environmental sustainability.
            </p>

            {/* Stats */}
            <div className="grid gap-6 sm:grid-cols-3">
              <Card className="border-green-200/20 bg-white/10 backdrop-blur-sm">
                <CardContent className="pt-6 text-center">
                  <div className="mb-2 text-3xl font-bold">{filteredProducts.length}</div>
                  <div className="text-sm text-green-100">Eco Products</div>
                </CardContent>
              </Card>
              <Card className="border-green-200/20 bg-white/10 backdrop-blur-sm">
                <CardContent className="pt-6 text-center">
                  <div className="mb-2 text-3xl font-bold">{filteredSuppliers.length}</div>
                  <div className="text-sm text-green-100">Green Suppliers</div>
                </CardContent>
              </Card>
              <Card className="border-green-200/20 bg-white/10 backdrop-blur-sm">
                <CardContent className="pt-6 text-center">
                  <div className="mb-2 text-3xl font-bold">{getTotalOffsetPurchased().toFixed(1)}</div>
                  <div className="text-sm text-green-100">Tons CO₂ Offset</div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <div className="container py-8">
        {/* Main Content */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-8">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-6 lg:w-auto">
            <TabsTrigger value="products" className="gap-2">
              <ShoppingBag className="h-4 w-4" />
              <span className="hidden sm:inline">Eco Products</span>
            </TabsTrigger>
            <TabsTrigger value="suppliers" className="gap-2">
              <Building2 className="h-4 w-4" />
              <span className="hidden sm:inline">Green Suppliers</span>
            </TabsTrigger>
            <TabsTrigger value="calculator" className="gap-2">
              <Calculator className="h-4 w-4" />
              <span className="hidden sm:inline">Calculator</span>
            </TabsTrigger>
            <TabsTrigger value="certifications" className="gap-2">
              <Award className="h-4 w-4" />
              <span className="hidden sm:inline">Certifications</span>
            </TabsTrigger>
            <TabsTrigger value="offset" className="gap-2">
              <Trees className="h-4 w-4" />
              <span className="hidden sm:inline">Offset</span>
            </TabsTrigger>
            <TabsTrigger value="reports" className="gap-2">
              <FileBarChart className="h-4 w-4" />
              <span className="hidden sm:inline">Reports</span>
            </TabsTrigger>
          </TabsList>

          {/* Eco Products Tab */}
          <TabsContent value="products" className="space-y-6">
            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5 text-green-600" />
                  Filter Products
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col gap-4 md:flex-row">
                  <div className="flex-1">
                    <Label>Search Products</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder="Search eco-friendly products..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                  </div>
                  <div className="w-full md:w-64">
                    <Label>Minimum Sustainability Score: {minScore}</Label>
                    <Slider
                      value={[minScore]}
                      onValueChange={(value) => setMinScore(value[0])}
                      max={100}
                      step={5}
                      className="mt-2"
                    />
                  </div>
                </div>

                <div>
                  <Label>Certifications</Label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {Object.entries(certificationDetails).map(([key, cert]) => (
                      <Badge
                        key={key}
                        variant={selectedCertifications.includes(key as CertificationType) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => toggleCertification(key as CertificationType)}
                      >
                        <span className="mr-1">{cert.icon}</span>
                        {cert.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Products Grid */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredProducts.map((product) => (
                <Card key={product.id} className="group overflow-hidden transition-all hover:shadow-lg">
                  <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-green-50 to-emerald-50">
                    <div className="flex h-full items-center justify-center">
                      <Package className="h-24 w-24 text-green-200" />
                    </div>
                    <div className="absolute right-2 top-2 flex flex-col gap-1">
                      <Badge className="bg-green-600 shadow-md">
                        <Leaf className="mr-1 h-3 w-3" />
                        {product.sustainabilityScore}
                      </Badge>
                      {product.carbonOffset > 0 && (
                        <Badge variant="secondary" className="shadow-md">
                          <TrendingDown className="mr-1 h-3 w-3" />
                          Offset
                        </Badge>
                      )}
                    </div>
                  </div>

                  <CardHeader>
                    <div className="mb-2 flex flex-wrap gap-1">
                      {product.certifications.slice(0, 3).map((cert) => (
                        <Badge key={cert} variant="outline" className="text-xs">
                          {certificationDetails[cert].icon}
                        </Badge>
                      ))}
                      {product.certifications.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{product.certifications.length - 3}
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="line-clamp-2 text-lg">{product.name}</CardTitle>
                    <CardDescription className="flex items-center gap-1">
                      <Building2 className="h-3 w-3" />
                      {product.vendorName}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Carbon Footprint</span>
                        <span className="font-medium">{product.metrics.carbonFootprint} kg CO₂e</span>
                      </div>
                      <Progress value={100 - (product.metrics.carbonFootprint / 10) * 100} className="h-2" />
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Droplet className="h-3 w-3" />
                        {product.metrics.waterUsage}L
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Zap className="h-3 w-3" />
                        {product.metrics.energyConsumption} kWh
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Recycle className="h-3 w-3" />
                        {product.metrics.recycledMaterials}%
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Wind className="h-3 w-3" />
                        {product.metrics.renewableEnergy}%
                      </div>
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-2xl font-bold text-green-600">
                          {formatBasePrice(product.price)}
                        </div>
                      </div>
                      <Button className="bg-green-600 hover:bg-green-700">
                        View Details
                        <ChevronRight className="ml-1 h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredProducts.length === 0 && (
              <Card className="py-12">
                <CardContent className="text-center">
                  <Leaf className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                  <h3 className="mb-2 text-lg font-semibold">No products found</h3>
                  <p className="text-muted-foreground">
                    Try adjusting your filters or search query
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Green Suppliers Tab */}
          <TabsContent value="suppliers" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Verified Green Suppliers</CardTitle>
                <CardDescription>
                  Businesses committed to environmental sustainability and ethical practices
                </CardDescription>
              </CardHeader>
            </Card>

            <div className="grid gap-6 lg:grid-cols-2">
              {filteredSuppliers.map((supplier) => (
                <Card key={supplier.id} className="overflow-hidden">
                  <CardHeader className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/10">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-emerald-600 text-2xl font-bold text-white">
                          {supplier.name[0]}
                        </div>
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            {supplier.name}
                            {supplier.verified && (
                              <Badge variant="default" className="bg-green-600">
                                <Check className="mr-1 h-3 w-3" />
                                Verified
                              </Badge>
                            )}
                          </CardTitle>
                          <CardDescription className="mt-1 flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {supplier.location}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-bold text-green-600">
                          {supplier.sustainabilityScore}
                        </div>
                        <div className="text-xs text-muted-foreground">Score</div>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4 pt-6">
                    <p className="text-sm text-muted-foreground">{supplier.description}</p>

                    <div className="flex flex-wrap gap-2">
                      {supplier.certifications.map((cert) => {
                        const details = certificationDetails[cert]
                        return (
                          <Badge key={cert} variant="outline" className="gap-1">
                            <span>{details.icon}</span>
                            {details.name}
                          </Badge>
                        )
                      })}
                    </div>

                    <Separator />

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="mb-1 text-muted-foreground">Products</div>
                        <div className="font-semibold">{supplier.productsCount}</div>
                      </div>
                      <div>
                        <div className="mb-1 text-muted-foreground">Carbon Neutral Goal</div>
                        <div className="font-semibold">{supplier.carbonNeutralGoal || 'N/A'}</div>
                      </div>
                      <div>
                        <div className="mb-1 text-muted-foreground">Renewable Energy</div>
                        <Progress value={supplier.metrics.renewableEnergy} className="mt-1 h-2" />
                      </div>
                      <div>
                        <div className="mb-1 text-muted-foreground">Recycled Materials</div>
                        <Progress value={supplier.metrics.recycledMaterials} className="mt-1 h-2" />
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <div className="mb-2 font-medium">Sustainability Initiatives</div>
                      <ul className="space-y-1 text-sm">
                        {supplier.initiatives.slice(0, 3).map((initiative, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                            <span className="text-muted-foreground">{initiative}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>

                  <CardFooter>
                    <Button variant="outline" className="w-full gap-2">
                      <Building2 className="h-4 w-4" />
                      View Supplier Profile
                      <ChevronRight className="ml-auto h-4 w-4" />
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Carbon Calculator Tab */}
          <TabsContent value="calculator" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calculator className="h-5 w-5 text-green-600" />
                    Carbon Footprint Calculator
                  </CardTitle>
                  <CardDescription>
                    Calculate the environmental impact of your purchases
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label>Product Category</Label>
                    <Select value={calcCategory} onValueChange={setCalcCategory}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="electronics">Electronics</SelectItem>
                        <SelectItem value="fashion">Fashion & Apparel</SelectItem>
                        <SelectItem value="furniture">Furniture</SelectItem>
                        <SelectItem value="beauty">Beauty & Personal Care</SelectItem>
                        <SelectItem value="food">Food & Beverages</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Weight (kg): {calcWeight}</Label>
                    <Slider
                      value={[calcWeight]}
                      onValueChange={(value) => setCalcWeight(value[0])}
                      max={50}
                      step={0.5}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Shipping Distance (km): {calcDistance}</Label>
                    <Slider
                      value={[calcDistance]}
                      onValueChange={(value) => setCalcDistance(value[0])}
                      max={5000}
                      step={50}
                    />
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <div className="flex items-center justify-between rounded-lg bg-green-50 p-4 dark:bg-green-950/20">
                      <div>
                        <div className="text-sm text-muted-foreground">Total Carbon Emissions</div>
                        <div className="text-3xl font-bold text-green-600">
                          {emissions.total.toFixed(2)} kg
                        </div>
                        <div className="text-xs text-muted-foreground">CO₂ equivalent</div>
                      </div>
                      <TrendingDown className="h-12 w-12 text-green-600 opacity-50" />
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <Factory className="h-4 w-4 text-muted-foreground" />
                          <span>Production</span>
                        </div>
                        <span className="font-medium">{emissions.production.toFixed(2)} kg</span>
                      </div>
                      <Progress value={(emissions.production / emissions.total) * 100} />

                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-muted-foreground" />
                          <span>Packaging</span>
                        </div>
                        <span className="font-medium">{emissions.packaging.toFixed(2)} kg</span>
                      </div>
                      <Progress value={(emissions.packaging / emissions.total) * 100} />

                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <Globe className="h-4 w-4 text-muted-foreground" />
                          <span>Shipping</span>
                        </div>
                        <span className="font-medium">{emissions.shipping.toFixed(2)} kg</span>
                      </div>
                      <Progress value={(emissions.shipping / emissions.total) * 100} />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Info className="h-5 w-5 text-blue-600" />
                      Comparison
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="rounded-lg border p-4">
                      <div className="mb-2 text-sm font-medium">Your emissions are equivalent to:</div>
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        <li className="flex items-start gap-2">
                          <Check className="mt-0.5 h-4 w-4 shrink-0" />
                          Driving {(emissions.total * 4.6).toFixed(0)} km in a car
                        </li>
                        <li className="flex items-start gap-2">
                          <Check className="mt-0.5 h-4 w-4 shrink-0" />
                          Charging {(emissions.total * 121).toFixed(0)} smartphones
                        </li>
                        <li className="flex items-start gap-2">
                          <Check className="mt-0.5 h-4 w-4 shrink-0" />
                          {(emissions.total / 21).toFixed(1)} trees needed to absorb annually
                        </li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Leaf className="h-5 w-5 text-green-600" />
                      Offset This Carbon
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="mb-4 text-sm text-muted-foreground">
                      Offset your carbon footprint by supporting verified environmental projects.
                    </p>
                    <div className="flex items-center justify-between rounded-lg bg-green-50 p-4 dark:bg-green-950/20">
                      <div>
                        <div className="text-sm text-muted-foreground">Offset Cost</div>
                        <div className="text-2xl font-bold text-green-600">
                          ${((emissions.total / 1000) * 15).toFixed(2)}
                        </div>
                      </div>
                      <Button className="bg-green-600 hover:bg-green-700">
                        <Trees className="mr-2 h-4 w-4" />
                        Offset Now
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/20">
                  <CardContent className="pt-6">
                    <div className="flex gap-3">
                      <Info className="h-5 w-5 shrink-0 text-blue-600" />
                      <div className="text-sm">
                        <p className="font-medium text-blue-900 dark:text-blue-100">
                          Reduce Your Impact
                        </p>
                        <ul className="mt-2 space-y-1 text-blue-700 dark:text-blue-300">
                          <li>• Choose products with lower carbon footprints</li>
                          <li>• Buy from local suppliers when possible</li>
                          <li>• Select carbon-neutral shipping options</li>
                          <li>• Support green suppliers and eco-certified products</li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Certifications Tab */}
          <TabsContent value="certifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-green-600" />
                  Sustainability Certifications
                </CardTitle>
                <CardDescription>
                  Recognized standards for environmental and social responsibility
                </CardDescription>
              </CardHeader>
            </Card>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {Object.entries(certificationDetails).map(([key, cert]) => (
                <Card key={key} className="overflow-hidden">
                  <div className={`${cert.color} p-6 text-white`}>
                    <div className="mb-2 text-4xl">{cert.icon}</div>
                    <h3 className="text-xl font-bold">{cert.name}</h3>
                  </div>
                  <CardContent className="pt-6">
                    <p className="mb-4 text-sm text-muted-foreground">{cert.description}</p>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Products</span>
                        <span className="font-medium">
                          {ecoProducts.filter(p => p.certifications.includes(key as CertificationType)).length}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Suppliers</span>
                        <span className="font-medium">
                          {greenSuppliers.filter(s => s.certifications.includes(key as CertificationType)).length}
                        </span>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      className="mt-4 w-full"
                      onClick={() => {
                        setSelectedCertifications([key as CertificationType])
                        setSelectedTab('products')
                      }}
                    >
                      View Products
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Carbon Offset Programs Tab */}
          <TabsContent value="offset" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trees className="h-5 w-5 text-green-600" />
                  Carbon Offset Programs
                </CardTitle>
                <CardDescription>
                  Support verified environmental projects to offset your carbon footprint
                </CardDescription>
              </CardHeader>
            </Card>

            <div className="grid gap-6 lg:grid-cols-2">
              {offsetPrograms.filter(p => p.active).map((program) => {
                const icons = {
                  reforestation: Trees,
                  renewable_energy: Sun,
                  ocean_cleanup: Waves,
                  carbon_capture: Factory,
                }
                const Icon = icons[program.type]

                return (
                  <Card key={program.id} className="overflow-hidden">
                    <div className="relative h-48 bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-950 dark:to-emerald-950">
                      <div className="flex h-full items-center justify-center">
                        <Icon className="h-24 w-24 text-green-600 opacity-50" />
                      </div>
                    </div>

                    <CardHeader>
                      <CardTitle>{program.name}</CardTitle>
                      <CardDescription className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {program.location}
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      <p className="text-sm text-muted-foreground">{program.description}</p>

                      <div className="rounded-lg border p-3">
                        <div className="mb-2 flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Provider</span>
                          <span className="text-sm font-medium">{program.provider}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Cost per Ton CO₂</span>
                          <span className="text-lg font-bold text-green-600">
                            ${program.costPerTon}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="text-sm font-medium">Environmental Impact</div>
                        <p className="text-sm text-muted-foreground">{program.impact}</p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {program.certifications.map((cert, idx) => (
                          <Badge key={idx} variant="outline">
                            <Check className="mr-1 h-3 w-3" />
                            {cert}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>

                    <CardFooter className="flex gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button className="flex-1 bg-green-600 hover:bg-green-700">
                            <DollarSign className="mr-2 h-4 w-4" />
                            Purchase Offset
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Offset Carbon Emissions</DialogTitle>
                            <DialogDescription>
                              Support {program.name} to offset your carbon footprint
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div className="space-y-2">
                              <Label>Amount (tons CO₂)</Label>
                              <Input type="number" min="0.1" step="0.1" defaultValue="1" />
                            </div>
                            <div className="rounded-lg bg-green-50 p-4 dark:bg-green-950/20">
                              <div className="mb-1 text-sm text-muted-foreground">Total Cost</div>
                              <div className="text-3xl font-bold text-green-600">
                                ${program.costPerTon.toFixed(2)}
                              </div>
                            </div>
                            <Button className="w-full bg-green-600 hover:bg-green-700">
                              Complete Purchase
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                      {program.projectUrl && (
                        <Button variant="outline" asChild>
                          <a href={program.projectUrl} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                    </CardFooter>
                  </Card>
                )
              })}
            </div>
          </TabsContent>

          {/* Environmental Reports Tab */}
          <TabsContent value="reports" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileBarChart className="h-5 w-5 text-green-600" />
                  Environmental Impact Dashboard
                </CardTitle>
                <CardDescription>
                  Track sustainability metrics and progress toward environmental goals
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Key Metrics */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="rounded-full bg-green-100 p-3 dark:bg-green-900">
                      <TrendingDown className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold">
                        {ecoProducts.reduce((sum, p) => sum + p.metrics.carbonFootprint, 0).toFixed(0)}
                      </div>
                      <div className="text-sm text-muted-foreground">kg CO₂ Emissions</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="rounded-full bg-blue-100 p-3 dark:bg-blue-900">
                      <Droplet className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold">
                        {(ecoProducts.reduce((sum, p) => sum + p.metrics.waterUsage, 0) / 1000).toFixed(1)}
                      </div>
                      <div className="text-sm text-muted-foreground">m³ Water Used</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="rounded-full bg-yellow-100 p-3 dark:bg-yellow-900">
                      <Zap className="h-6 w-6 text-yellow-600" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold">
                        {greenSuppliers.length > 0
                          ? (greenSuppliers.reduce((sum, s) => sum + s.metrics.renewableEnergy, 0) / greenSuppliers.length).toFixed(0)
                          : 0}%
                      </div>
                      <div className="text-sm text-muted-foreground">Renewable Energy</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="rounded-full bg-purple-100 p-3 dark:bg-purple-900">
                      <Recycle className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold">
                        {ecoProducts.length > 0
                          ? (ecoProducts.reduce((sum, p) => sum + p.metrics.recycledMaterials, 0) / ecoProducts.length).toFixed(0)
                          : 0}%
                      </div>
                      <div className="text-sm text-muted-foreground">Recycled Materials</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Goals Progress */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Sustainability Goals
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-medium">Carbon Neutrality</span>
                    <span className="text-sm text-muted-foreground">45 / 100%</span>
                  </div>
                  <Progress value={45} className="h-3" />
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-medium">Green Suppliers Network</span>
                    <span className="text-sm text-muted-foreground">{greenSuppliers.length} / 50</span>
                  </div>
                  <Progress value={(greenSuppliers.length / 50) * 100} className="h-3" />
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-medium">Eco Product Catalog</span>
                    <span className="text-sm text-muted-foreground">{ecoProducts.length} / 1000</span>
                  </div>
                  <Progress value={(ecoProducts.length / 1000) * 100} className="h-3" />
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-medium">Renewable Energy Usage</span>
                    <span className="text-sm text-muted-foreground">
                      {greenSuppliers.length > 0
                        ? (greenSuppliers.reduce((sum, s) => sum + s.metrics.renewableEnergy, 0) / greenSuppliers.length).toFixed(0)
                        : 0} / 100%
                    </span>
                  </div>
                  <Progress
                    value={greenSuppliers.length > 0
                      ? greenSuppliers.reduce((sum, s) => sum + s.metrics.renewableEnergy, 0) / greenSuppliers.length
                      : 0}
                    className="h-3"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Top Performers */}
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-yellow-600" />
                    Top Eco Products
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {ecoProducts
                      .sort((a, b) => b.sustainabilityScore - a.sustainabilityScore)
                      .slice(0, 5)
                      .map((product, idx) => (
                        <div key={product.id} className="flex items-center gap-3">
                          <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                            idx === 0 ? 'bg-yellow-100 text-yellow-700' :
                            idx === 1 ? 'bg-gray-100 text-gray-700' :
                            idx === 2 ? 'bg-orange-100 text-orange-700' :
                            'bg-muted text-muted-foreground'
                          }`}>
                            {idx + 1}
                          </div>
                          <div className="flex-1">
                            <div className="font-medium">{product.name}</div>
                            <div className="text-xs text-muted-foreground">{product.vendorName}</div>
                          </div>
                          <Badge className="bg-green-600">
                            {product.sustainabilityScore}
                          </Badge>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-yellow-600" />
                    Top Green Suppliers
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {greenSuppliers
                      .sort((a, b) => b.sustainabilityScore - a.sustainabilityScore)
                      .slice(0, 5)
                      .map((supplier, idx) => (
                        <div key={supplier.id} className="flex items-center gap-3">
                          <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                            idx === 0 ? 'bg-yellow-100 text-yellow-700' :
                            idx === 1 ? 'bg-gray-100 text-gray-700' :
                            idx === 2 ? 'bg-orange-100 text-orange-700' :
                            'bg-muted text-muted-foreground'
                          }`}>
                            {idx + 1}
                          </div>
                          <div className="flex-1">
                            <div className="font-medium">{supplier.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {supplier.productsCount} products
                            </div>
                          </div>
                          <Badge className="bg-green-600">
                            {supplier.sustainabilityScore}
                          </Badge>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
