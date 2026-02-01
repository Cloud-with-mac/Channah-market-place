'use client'

import * as React from 'react'
import {
  Building2,
  Package,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Activity,
  BarChart3,
  MapPin,
  Grid3x3,
  Truck,
  ClipboardList,
  DollarSign,
  Search,
  Filter,
  Download,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Warehouse,
  Box,
  Archive,
  PackageCheck,
  PackageX,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ThermometerSnowflake,
  Shield,
  Calendar,
  Phone,
  Mail,
  Layers,
  LayoutGrid,
  BarChart2,
  PieChart,
  Percent,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'
import { formatPrice, formatNumber, formatDate, formatDateTime } from '@/lib/utils'
import {
  useWarehouseStore,
  type WarehouseLocation,
  type InventoryItem,
  type StockMovement,
  type BinLocation,
  type StorageRequest,
  type FulfillmentService,
  type WarehouseFee,
} from '@/store/warehouse-store'

// Data generators - populated from API
const generateMockWarehouses = (): WarehouseLocation[] => []

const generateMockInventory = (): InventoryItem[] => []

const generateMockStockMovements = (): StockMovement[] => []

const generateMockFulfillmentServices = (): FulfillmentService[] => []

const generateMockWarehouseFees = (): WarehouseFee[] => []

export default function WarehousePage() {
  const {
    warehouses,
    inventory,
    stockMovements,
    fulfillmentServices,
    warehouseFees,
    selectedWarehouse,
    setWarehouses,
    setInventory,
    setStockMovements,
    setFulfillmentServices,
    setWarehouseFees,
    setSelectedWarehouse,
    getFilteredInventory,
    getFilteredMovements,
    setInventoryFilters,
    setMovementFilters,
    inventoryFilters,
  } = useWarehouseStore()

  const [searchTerm, setSearchTerm] = React.useState('')
  const [isStockInDialogOpen, setIsStockInDialogOpen] = React.useState(false)
  const [isStockOutDialogOpen, setIsStockOutDialogOpen] = React.useState(false)
  const [isStorageRequestDialogOpen, setIsStorageRequestDialogOpen] = React.useState(false)
  const [selectedTab, setSelectedTab] = React.useState('overview')

  // Initialize mock data
  React.useEffect(() => {
    if (warehouses.length === 0) {
      setWarehouses(generateMockWarehouses())
      setInventory(generateMockInventory())
      setStockMovements(generateMockStockMovements())
      setFulfillmentServices(generateMockFulfillmentServices())
      setWarehouseFees(generateMockWarehouseFees())
    }
  }, [])

  // Calculate metrics
  const totalCapacity = React.useMemo(() => {
    return warehouses.reduce((sum, w) => sum + w.total_capacity, 0)
  }, [warehouses])

  const usedCapacity = React.useMemo(() => {
    return warehouses.reduce((sum, w) => sum + w.used_capacity, 0)
  }, [warehouses])

  const availableCapacity = React.useMemo(() => {
    return warehouses.reduce((sum, w) => sum + w.available_capacity, 0)
  }, [warehouses])

  const utilizationPercentage = React.useMemo(() => {
    return totalCapacity > 0 ? (usedCapacity / totalCapacity) * 100 : 0
  }, [totalCapacity, usedCapacity])

  const totalInventoryValue = React.useMemo(() => {
    return inventory.reduce((sum, item) => sum + item.total_value, 0)
  }, [inventory])

  const lowStockItems = React.useMemo(() => {
    return inventory.filter((item) => item.available_quantity <= item.reorder_point)
  }, [inventory])

  const outOfStockItems = React.useMemo(() => {
    return inventory.filter((item) => item.available_quantity === 0)
  }, [inventory])

  const todayMovements = React.useMemo(() => {
    const today = new Date().toISOString().split('T')[0]
    return stockMovements.filter((m) => m.performed_at.startsWith(today))
  }, [stockMovements])

  const filteredInventory = React.useMemo(() => {
    return getFilteredInventory()
  }, [inventory, inventoryFilters])

  const filteredMovements = React.useMemo(() => {
    return getFilteredMovements()
  }, [stockMovements])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
      case 'maintenance':
      case 'in_progress':
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100'
      case 'full':
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100'
    }
  }

  const getMovementIcon = (type: string) => {
    switch (type) {
      case 'stock-in':
        return <ArrowDownRight className="h-4 w-4" />
      case 'stock-out':
        return <ArrowUpRight className="h-4 w-4" />
      case 'transfer':
        return <RefreshCw className="h-4 w-4" />
      case 'adjustment':
        return <Activity className="h-4 w-4" />
      default:
        return <Package className="h-4 w-4" />
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      {/* Header */}
      <div className="border-b bg-white/80 backdrop-blur-sm dark:bg-gray-900/80">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 p-2">
                  <Warehouse className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    Warehouse Management
                  </h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Comprehensive inventory and warehouse operations
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Export Report
              </Button>
              <Dialog open={isStorageRequestDialogOpen} onOpenChange={setIsStorageRequestDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="bg-gradient-to-r from-blue-600 to-indigo-600">
                    <Plus className="mr-2 h-4 w-4" />
                    Request Storage
                  </Button>
                </DialogTrigger>
                <StorageRequestDialog onClose={() => setIsStorageRequestDialogOpen(false)} />
              </Dialog>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Key Metrics */}
        <div className="mb-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-l-4 border-l-blue-600 bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Capacity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {formatNumber(totalCapacity)} m³
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    {utilizationPercentage.toFixed(1)}% utilized
                  </p>
                </div>
                <div className="rounded-full bg-blue-100 p-3 dark:bg-blue-900">
                  <Building2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              <div className="mt-4">
                <Progress value={utilizationPercentage} className="h-2" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-600 bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Inventory Value
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {formatPrice(totalInventoryValue)}
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    {inventory.length} unique items
                  </p>
                </div>
                <div className="rounded-full bg-green-100 p-3 dark:bg-green-900">
                  <DollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-orange-600 bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Stock Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {lowStockItems.length}
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    {outOfStockItems.length} out of stock
                  </p>
                </div>
                <div className="rounded-full bg-orange-100 p-3 dark:bg-orange-900">
                  <AlertTriangle className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-600 bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Today's Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {todayMovements.length}
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Stock movements
                  </p>
                </div>
                <div className="rounded-full bg-purple-100 p-3 dark:bg-purple-900">
                  <Activity className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-7 bg-white/80 backdrop-blur-sm dark:bg-gray-900/80">
            <TabsTrigger value="overview">
              <LayoutGrid className="mr-2 h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="warehouses">
              <Building2 className="mr-2 h-4 w-4" />
              Warehouses
            </TabsTrigger>
            <TabsTrigger value="inventory">
              <Package className="mr-2 h-4 w-4" />
              Inventory
            </TabsTrigger>
            <TabsTrigger value="movements">
              <Activity className="mr-2 h-4 w-4" />
              Movements
            </TabsTrigger>
            <TabsTrigger value="bins">
              <Grid3x3 className="mr-2 h-4 w-4" />
              Bins
            </TabsTrigger>
            <TabsTrigger value="services">
              <Truck className="mr-2 h-4 w-4" />
              Services
            </TabsTrigger>
            <TabsTrigger value="fees">
              <DollarSign className="mr-2 h-4 w-4" />
              Fees
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Warehouse Locations */}
            <Card className="bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Available Warehouse Locations</CardTitle>
                <CardDescription>
                  Our network of {warehouses.length} strategic warehouse facilities
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
                  {warehouses.map((warehouse) => (
                    <Card
                      key={warehouse.id}
                      className={cn(
                        'cursor-pointer border-2 transition-all hover:shadow-lg',
                        selectedWarehouse === warehouse.id
                          ? 'border-blue-600'
                          : 'border-transparent'
                      )}
                      onClick={() => setSelectedWarehouse(warehouse.id)}
                    >
                      {warehouse.image_url && (
                        <div className="h-40 overflow-hidden rounded-t-lg">
                          <img
                            src={warehouse.image_url}
                            alt={warehouse.name}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      )}
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="flex items-center gap-2">
                              {warehouse.name}
                              <Badge variant="outline" className="font-mono text-xs">
                                {warehouse.code}
                              </Badge>
                            </CardTitle>
                            <CardDescription className="mt-2">
                              <MapPin className="mr-1 inline h-3 w-3" />
                              {warehouse.city}, {warehouse.state}, {warehouse.country}
                            </CardDescription>
                          </div>
                          <Badge className={getStatusColor(warehouse.status)}>
                            {warehouse.status}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Capacity */}
                        <div>
                          <div className="mb-2 flex items-center justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-400">Capacity</span>
                            <span className="font-medium">
                              {formatNumber(warehouse.available_capacity)} / {formatNumber(warehouse.total_capacity)} m³
                            </span>
                          </div>
                          <Progress
                            value={(warehouse.used_capacity / warehouse.total_capacity) * 100}
                            className="h-2"
                          />
                          <p className="mt-1 text-xs text-gray-500">
                            {((warehouse.used_capacity / warehouse.total_capacity) * 100).toFixed(1)}% utilized
                          </p>
                        </div>

                        {/* Features */}
                        <div className="flex flex-wrap gap-2">
                          {warehouse.climate_controlled && (
                            <Badge variant="secondary" className="text-xs">
                              <ThermometerSnowflake className="mr-1 h-3 w-3" />
                              Climate Controlled
                            </Badge>
                          )}
                          <Badge variant="secondary" className="text-xs">
                            <Shield className="mr-1 h-3 w-3" />
                            {warehouse.security_level}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            <Layers className="mr-1 h-3 w-3" />
                            {warehouse.zones.length} Zones
                          </Badge>
                        </div>

                        {/* Pricing */}
                        <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              Monthly Rate
                            </span>
                            <span className="text-lg font-bold text-gray-900 dark:text-white">
                              {formatPrice(warehouse.monthly_rate_per_sqm)}/m²
                            </span>
                          </div>
                        </div>

                        {/* Contact */}
                        <Separator />
                        <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                          <div className="flex items-center gap-2">
                            <Phone className="h-3 w-3" />
                            {warehouse.contact_phone}
                          </div>
                          <div className="flex items-center gap-2">
                            <Mail className="h-3 w-3" />
                            {warehouse.contact_email}
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-3 w-3" />
                            {warehouse.operating_hours}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Capacity Tracker */}
            <Card className="bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Storage Capacity Tracker</CardTitle>
                <CardDescription>Real-time capacity utilization across all facilities</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {warehouses.map((warehouse) => {
                    const utilization = (warehouse.used_capacity / warehouse.total_capacity) * 100
                    return (
                      <div key={warehouse.id} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-gray-900 dark:text-white">
                              {warehouse.name}
                            </h4>
                            <p className="text-sm text-gray-500">
                              {warehouse.city}, {warehouse.state}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="font-medium text-gray-900 dark:text-white">
                              {formatNumber(warehouse.used_capacity)} / {formatNumber(warehouse.total_capacity)} m³
                            </div>
                            <p className="text-sm text-gray-500">{utilization.toFixed(1)}% used</p>
                          </div>
                        </div>
                        <div className="relative">
                          <Progress value={utilization} className="h-3" />
                          {utilization >= 90 && (
                            <AlertCircle className="absolute right-0 top-0 h-3 w-3 -translate-y-1/2 translate-x-1/2 text-red-600" />
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Warehouses Tab */}
          <TabsContent value="warehouses" className="space-y-6">
            <WarehousesView warehouses={warehouses} />
          </TabsContent>

          {/* Inventory Tab */}
          <TabsContent value="inventory" className="space-y-6">
            <InventoryView
              inventory={filteredInventory}
              warehouses={warehouses}
              lowStockItems={lowStockItems}
              outOfStockItems={outOfStockItems}
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              filters={inventoryFilters}
              onFiltersChange={setInventoryFilters}
              onStockIn={() => setIsStockInDialogOpen(true)}
              onStockOut={() => setIsStockOutDialogOpen(true)}
            />
          </TabsContent>

          {/* Movements Tab */}
          <TabsContent value="movements" className="space-y-6">
            <StockMovementsView
              movements={filteredMovements}
              warehouses={warehouses}
              onStockIn={() => setIsStockInDialogOpen(true)}
              onStockOut={() => setIsStockOutDialogOpen(true)}
            />
          </TabsContent>

          {/* Bins Tab */}
          <TabsContent value="bins" className="space-y-6">
            <BinLocationsView warehouses={warehouses} />
          </TabsContent>

          {/* Services Tab */}
          <TabsContent value="services" className="space-y-6">
            <FulfillmentServicesView services={fulfillmentServices} />
          </TabsContent>

          {/* Fees Tab */}
          <TabsContent value="fees" className="space-y-6">
            <WarehouseFeesView fees={warehouseFees} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Stock In Dialog */}
      <Dialog open={isStockInDialogOpen} onOpenChange={setIsStockInDialogOpen}>
        <StockInDialog onClose={() => setIsStockInDialogOpen(false)} warehouses={warehouses} />
      </Dialog>

      {/* Stock Out Dialog */}
      <Dialog open={isStockOutDialogOpen} onOpenChange={setIsStockOutDialogOpen}>
        <StockOutDialog onClose={() => setIsStockOutDialogOpen(false)} warehouses={warehouses} />
      </Dialog>
    </div>
  )
}

// Warehouses View Component
function WarehousesView({ warehouses }: { warehouses: WarehouseLocation[] }) {
  return (
    <div className="grid gap-6">
      {warehouses.map((warehouse) => (
        <Card key={warehouse.id} className="bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  {warehouse.name}
                  <Badge variant="outline" className="font-mono">
                    {warehouse.code}
                  </Badge>
                </CardTitle>
                <CardDescription className="mt-2">
                  {warehouse.address}, {warehouse.city}, {warehouse.state} {warehouse.postal_code}
                </CardDescription>
              </div>
              <Badge className={getStatusColor(warehouse.status)}>{warehouse.status}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Capacity Info */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900 dark:text-white">Capacity</h4>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Total</span>
                    <span className="font-medium">{formatNumber(warehouse.total_capacity)} m³</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Used</span>
                    <span className="font-medium">{formatNumber(warehouse.used_capacity)} m³</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Available</span>
                    <span className="font-medium text-green-600">
                      {formatNumber(warehouse.available_capacity)} m³
                    </span>
                  </div>
                  <Progress
                    value={(warehouse.used_capacity / warehouse.total_capacity) * 100}
                    className="h-2"
                  />
                </div>
              </div>

              {/* Features */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900 dark:text-white">Features & Zones</h4>
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2">
                    {warehouse.features.slice(0, 4).map((feature, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {feature}
                      </Badge>
                    ))}
                  </div>
                  <div className="mt-3">
                    <p className="mb-2 text-sm text-gray-600 dark:text-gray-400">Zones:</p>
                    <div className="flex gap-2">
                      {warehouse.zones.map((zone) => (
                        <Badge key={zone} variant="outline">
                          Zone {zone}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact & Pricing */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900 dark:text-white">Contact & Pricing</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <Phone className="h-4 w-4" />
                    {warehouse.contact_phone}
                  </div>
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <Mail className="h-4 w-4" />
                    {warehouse.contact_email}
                  </div>
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <Clock className="h-4 w-4" />
                    {warehouse.operating_hours}
                  </div>
                  <Separator className="my-3" />
                  <div className="rounded-lg bg-blue-50 p-3 dark:bg-blue-950">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Monthly Rate</span>
                      <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                        {formatPrice(warehouse.monthly_rate_per_sqm)}/m²
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// Inventory View Component
function InventoryView({
  inventory,
  warehouses,
  lowStockItems,
  outOfStockItems,
  searchTerm,
  onSearchChange,
  filters,
  onFiltersChange,
  onStockIn,
  onStockOut,
}: any) {
  return (
    <div className="space-y-6">
      {/* Filters and Actions */}
      <Card className="bg-white/80 backdrop-blur-sm">
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-1 gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search by SKU, product name, or bin location..."
                  value={searchTerm}
                  onChange={(e) => {
                    onSearchChange(e.target.value)
                    onFiltersChange({ search: e.target.value })
                  }}
                  className="pl-10"
                />
              </div>
              <Select
                value={filters.warehouse_id || 'all'}
                onValueChange={(value) =>
                  onFiltersChange({ warehouse_id: value === 'all' ? undefined : value })
                }
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="All Warehouses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Warehouses</SelectItem>
                  {warehouses.map((w: WarehouseLocation) => (
                    <SelectItem key={w.id} value={w.id}>
                      {w.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                onClick={() => onFiltersChange({ low_stock: !filters.low_stock })}
                className={filters.low_stock ? 'border-orange-600 text-orange-600' : ''}
              >
                <AlertTriangle className="mr-2 h-4 w-4" />
                Low Stock
              </Button>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onStockIn}>
                <ArrowDownRight className="mr-2 h-4 w-4" />
                Stock In
              </Button>
              <Button variant="outline" onClick={onStockOut}>
                <ArrowUpRight className="mr-2 h-4 w-4" />
                Stock Out
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Inventory Items */}
      <div className="grid gap-4">
        {inventory.map((item: InventoryItem) => {
          const isLowStock = item.available_quantity <= item.reorder_point
          const isOutOfStock = item.available_quantity === 0

          return (
            <Card
              key={item.id}
              className={cn(
                'bg-white/80 backdrop-blur-sm transition-all hover:shadow-md',
                isOutOfStock && 'border-l-4 border-l-red-600',
                isLowStock && !isOutOfStock && 'border-l-4 border-l-orange-600'
              )}
            >
              <CardContent className="pt-6">
                <div className="grid gap-6 lg:grid-cols-12">
                  {/* Product Info */}
                  <div className="lg:col-span-4">
                    <div className="flex gap-4">
                      {item.image_url && (
                        <img
                          src={item.image_url}
                          alt={item.product_name}
                          className="h-20 w-20 rounded-lg object-cover"
                        />
                      )}
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {item.product_name}
                        </h3>
                        <p className="mt-1 font-mono text-sm text-gray-600 dark:text-gray-400">
                          SKU: {item.sku}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <Badge variant="outline" className="text-xs">
                            {item.warehouse_name}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            <MapPin className="mr-1 h-3 w-3" />
                            {item.bin_location}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Stock Levels */}
                  <div className="lg:col-span-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-xs text-gray-500">Total</p>
                        <p className="mt-1 text-lg font-bold text-gray-900 dark:text-white">
                          {item.quantity}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Reserved</p>
                        <p className="mt-1 text-lg font-bold text-orange-600">
                          {item.reserved_quantity}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Available</p>
                        <p
                          className={cn(
                            'mt-1 text-lg font-bold',
                            isOutOfStock && 'text-red-600',
                            isLowStock && !isOutOfStock && 'text-orange-600',
                            !isLowStock && 'text-green-600'
                          )}
                        >
                          {item.available_quantity}
                        </p>
                      </div>
                    </div>
                    {isLowStock && (
                      <div className="mt-3 flex items-center gap-2 text-xs text-orange-600">
                        <AlertTriangle className="h-3 w-3" />
                        Below reorder point ({item.reorder_point} {item.unit_of_measure})
                      </div>
                    )}
                  </div>

                  {/* Value & Details */}
                  <div className="lg:col-span-4">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Unit Value</span>
                        <span className="font-medium">{formatPrice(item.value_per_unit)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Total Value</span>
                        <span className="font-bold text-gray-900 dark:text-white">
                          {formatPrice(item.total_value)}
                        </span>
                      </div>
                      <Separator />
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Last Movement</span>
                        <span>{formatDate(item.last_movement_date)}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Condition</span>
                        <Badge variant="secondary" className="text-xs">
                          {item.condition}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {inventory.length === 0 && (
        <Card className="bg-white/80 backdrop-blur-sm">
          <CardContent className="py-12 text-center">
            <Package className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
              No inventory items found
            </h3>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Try adjusting your filters or search terms
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// Stock Movements View Component
function StockMovementsView({
  movements,
  warehouses,
  onStockIn,
  onStockOut,
}: {
  movements: StockMovement[]
  warehouses: WarehouseLocation[]
  onStockIn: () => void
  onStockOut: () => void
}) {
  const getMovementTypeColor = (type: string) => {
    switch (type) {
      case 'stock-in':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
      case 'stock-out':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100'
      case 'transfer':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100'
      case 'adjustment':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100'
    }
  }

  const getMovementIcon = (type: string) => {
    switch (type) {
      case 'stock-in':
        return <ArrowDownRight className="h-4 w-4" />
      case 'stock-out':
        return <ArrowUpRight className="h-4 w-4" />
      case 'transfer':
        return <RefreshCw className="h-4 w-4" />
      case 'adjustment':
        return <Activity className="h-4 w-4" />
      default:
        return <Package className="h-4 w-4" />
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />
      case 'in_progress':
        return <Clock className="h-4 w-4 text-orange-600" />
      case 'pending':
        return <AlertCircle className="h-4 w-4 text-blue-600" />
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-600" />
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      {/* Actions */}
      <Card className="bg-white/80 backdrop-blur-sm">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Stock Movements
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {movements.length} total movements
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onStockIn}>
                <ArrowDownRight className="mr-2 h-4 w-4" />
                Record Stock In
              </Button>
              <Button variant="outline" onClick={onStockOut}>
                <ArrowUpRight className="mr-2 h-4 w-4" />
                Record Stock Out
              </Button>
              <Button variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Movements List */}
      <div className="space-y-3">
        {movements.map((movement) => (
          <Card key={movement.id} className="bg-white/80 backdrop-blur-sm transition-all hover:shadow-md">
            <CardContent className="pt-6">
              <div className="grid gap-6 lg:grid-cols-12">
                {/* Movement Type & Status */}
                <div className="lg:col-span-3">
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        'rounded-full p-2',
                        getMovementTypeColor(movement.type).replace('text-', 'bg-').split(' ')[0] +
                          '/20'
                      )}
                    >
                      {getMovementIcon(movement.type)}
                    </div>
                    <div className="flex-1">
                      <Badge className={getMovementTypeColor(movement.type)}>
                        {movement.type.replace('-', ' ')}
                      </Badge>
                      <p className="mt-2 font-mono text-sm font-medium text-gray-900 dark:text-white">
                        {movement.reference_number}
                      </p>
                      <div className="mt-1 flex items-center gap-1">
                        {getStatusIcon(movement.status)}
                        <span className="text-xs capitalize text-gray-600 dark:text-gray-400">
                          {movement.status.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Product Info */}
                <div className="lg:col-span-4">
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      {movement.product_name}
                    </h4>
                    <p className="mt-1 font-mono text-sm text-gray-600 dark:text-gray-400">
                      SKU: {movement.sku}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {movement.warehouse_name}
                      </Badge>
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">
                        Qty: {movement.quantity}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Location Details */}
                <div className="lg:col-span-3">
                  <div className="space-y-2 text-sm">
                    {movement.from_bin && (
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500">From:</span>
                        <Badge variant="secondary" className="text-xs">
                          {movement.from_bin}
                        </Badge>
                      </div>
                    )}
                    {movement.to_bin && (
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500">To:</span>
                        <Badge variant="secondary" className="text-xs">
                          {movement.to_bin}
                        </Badge>
                      </div>
                    )}
                    <div className="text-xs text-gray-500">
                      <p>Reason: {movement.reason}</p>
                    </div>
                  </div>
                </div>

                {/* Metadata */}
                <div className="lg:col-span-2">
                  <div className="space-y-1 text-xs">
                    <p className="text-gray-500">Performed by</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {movement.performed_by}
                    </p>
                    <p className="text-gray-500">{formatDateTime(movement.performed_at)}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {movements.length === 0 && (
        <Card className="bg-white/80 backdrop-blur-sm">
          <CardContent className="py-12 text-center">
            <Activity className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
              No stock movements found
            </h3>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Start recording stock movements to track inventory changes
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// Bin Locations View Component
function BinLocationsView({ warehouses }: { warehouses: WarehouseLocation[] }) {
  const [selectedWarehouse, setSelectedWarehouse] = React.useState(warehouses[0]?.id)

  // Bin data - populated from API
  const mockBins: BinLocation[] = React.useMemo(() => {
    return []
  }, [selectedWarehouse])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'empty':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100'
      case 'partially_filled':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100'
      case 'full':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100'
      case 'reserved':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100'
    }
  }

  const zones = [...new Set(mockBins.map((b) => b.zone))]

  return (
    <div className="space-y-6">
      {/* Warehouse Selector */}
      <Card className="bg-white/80 backdrop-blur-sm">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Bin Location Management
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                View and manage bin locations across zones
              </p>
            </div>
            <Select value={selectedWarehouse} onValueChange={setSelectedWarehouse}>
              <SelectTrigger className="w-[300px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {warehouses.map((w) => (
                  <SelectItem key={w.id} value={w.id}>
                    {w.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Zone Views */}
      {zones.map((zone) => {
        const zoneBins = mockBins.filter((b) => b.zone === zone)
        const emptyBins = zoneBins.filter((b) => b.status === 'empty').length
        const fullBins = zoneBins.filter((b) => b.status === 'full').length
        const totalCapacity = zoneBins.reduce((sum, b) => sum + b.capacity, 0)
        const totalOccupied = zoneBins.reduce((sum, b) => sum + b.occupied, 0)

        return (
          <Card key={zone} className="bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Zone {zone}</CardTitle>
                <div className="flex gap-4 text-sm">
                  <div className="text-center">
                    <p className="text-gray-500">Empty</p>
                    <p className="font-bold text-gray-900 dark:text-white">{emptyBins}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-gray-500">Full</p>
                    <p className="font-bold text-red-600">{fullBins}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-gray-500">Utilization</p>
                    <p className="font-bold text-blue-600">
                      {((totalOccupied / totalCapacity) * 100).toFixed(0)}%
                    </p>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-5">
                {zoneBins.slice(0, 15).map((bin) => (
                  <Card
                    key={bin.id}
                    className={cn(
                      'cursor-pointer transition-all hover:shadow-md',
                      bin.status === 'full' && 'border-red-300',
                      bin.status === 'empty' && 'border-gray-200'
                    )}
                  >
                    <CardContent className="p-4">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="font-mono text-sm font-bold">{bin.full_code}</span>
                        <Badge className={cn('text-xs', getStatusColor(bin.status))}>
                          {bin.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                        <p>Type: {bin.type}</p>
                        <p>
                          Capacity: {bin.occupied}/{bin.capacity}
                        </p>
                      </div>
                      <Progress
                        value={(bin.occupied / bin.capacity) * 100}
                        className="mt-2 h-1"
                      />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

// Fulfillment Services View Component
function FulfillmentServicesView({ services }: { services: FulfillmentService[] }) {
  return (
    <div className="space-y-6">
      <Card className="bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>Fulfillment Services</CardTitle>
          <CardDescription>
            Professional warehouse services to streamline your operations
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {services.map((service) => (
          <Card key={service.id} className="bg-white/80 backdrop-blur-sm transition-all hover:shadow-lg">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="rounded-lg bg-blue-100 p-3 dark:bg-blue-900">
                  <PackageCheck className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                {service.available ? (
                  <Badge className="bg-green-100 text-green-800">Available</Badge>
                ) : (
                  <Badge variant="secondary">Unavailable</Badge>
                )}
              </div>
              <CardTitle className="mt-4">{service.name}</CardTitle>
              <CardDescription>{service.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Pricing */}
              <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-bold text-gray-900 dark:text-white">
                    {formatPrice(service.price_per_unit)}
                  </span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">per unit</span>
                </div>
                <div className="mt-2 flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
                  <span>Min. Order: {service.minimum_order} units</span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {service.turnaround_time}
                  </span>
                </div>
              </div>

              {/* Features */}
              <div>
                <h4 className="mb-2 text-sm font-semibold text-gray-900 dark:text-white">
                  Features
                </h4>
                <ul className="space-y-1">
                  {service.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600" />
                      <span className="text-gray-600 dark:text-gray-400">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <Button className="w-full">Request Service</Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

// Warehouse Fees View Component
function WarehouseFeesView({ fees }: { fees: WarehouseFee[] }) {
  const feeCategories = [...new Set(fees.map((f) => f.category))]

  return (
    <div className="space-y-6">
      <Card className="bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>Warehouse Fees & Pricing</CardTitle>
          <CardDescription>
            Transparent pricing for all warehouse services and operations
          </CardDescription>
        </CardHeader>
      </Card>

      {feeCategories.map((category) => {
        const categoryFees = fees.filter((f) => f.category === category)

        return (
          <Card key={category} className="bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 capitalize">
                <DollarSign className="h-5 w-5" />
                {category.replace('_', ' ')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {categoryFees.map((fee) => (
                  <div
                    key={fee.id}
                    className="rounded-lg border border-gray-200 p-4 dark:border-gray-700"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 dark:text-white">{fee.name}</h4>
                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                          {fee.description}
                        </p>
                      </div>
                      <div className="ml-4 text-right">
                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                          {fee.pricing_model === 'percentage'
                            ? `${fee.base_price}%`
                            : formatPrice(fee.base_price)}
                        </div>
                        <p className="mt-1 text-xs text-gray-500">
                          {fee.pricing_model.replace('_', ' ')}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4">
                      <div className="flex items-center gap-2 text-sm">
                        <Badge variant="outline">{fee.billing_frequency}</Badge>
                        {fee.min_charge && (
                          <span className="text-gray-600 dark:text-gray-400">
                            Min: {formatPrice(fee.min_charge)}
                          </span>
                        )}
                      </div>
                    </div>

                    {fee.includes.length > 0 && (
                      <div className="mt-4">
                        <h5 className="mb-2 text-xs font-semibold text-gray-700 dark:text-gray-300">
                          Includes:
                        </h5>
                        <div className="flex flex-wrap gap-2">
                          {fee.includes.map((item, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {item}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {fee.additional_notes && (
                      <p className="mt-3 text-xs italic text-gray-500">{fee.additional_notes}</p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

// Storage Request Dialog
function StorageRequestDialog({ onClose }: { onClose: () => void }) {
  const { warehouses, addStorageRequest } = useWarehouseStore()
  const [formData, setFormData] = React.useState({
    requester_name: '',
    requester_email: '',
    company_name: '',
    warehouse_id: '',
    storage_type: 'short_term',
    space_required: '',
    duration_months: '',
    start_date: '',
    product_type: '',
    special_requirements: [] as string[],
    climate_controlled: false,
    security_level: 'standard',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const warehouse = warehouses.find((w) => w.id === formData.warehouse_id)
    const request: StorageRequest = {
      id: `req-${Date.now()}`,
      request_number: `SR-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9999)).padStart(4, '0')}`,
      requester_name: formData.requester_name,
      requester_email: formData.requester_email,
      company_name: formData.company_name,
      warehouse_id: formData.warehouse_id,
      warehouse_name: warehouse?.name || '',
      storage_type: formData.storage_type as any,
      space_required: Number(formData.space_required),
      duration_months: Number(formData.duration_months),
      start_date: formData.start_date,
      product_type: formData.product_type,
      special_requirements: formData.special_requirements,
      climate_controlled: formData.climate_controlled,
      security_level: formData.security_level as any,
      estimated_monthly_cost:
        Number(formData.space_required) * (warehouse?.monthly_rate_per_sqm || 25),
      status: 'pending',
      submitted_at: new Date().toISOString(),
    }

    addStorageRequest(request)
    onClose()
  }

  return (
    <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Request Storage Space</DialogTitle>
        <DialogDescription>
          Fill out the form below to request warehouse storage space
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Contact Information */}
        <div className="space-y-4">
          <h4 className="font-semibold text-gray-900 dark:text-white">Contact Information</h4>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="requester_name">Full Name *</Label>
              <Input
                id="requester_name"
                required
                value={formData.requester_name}
                onChange={(e) =>
                  setFormData({ ...formData, requester_name: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="requester_email">Email *</Label>
              <Input
                id="requester_email"
                type="email"
                required
                value={formData.requester_email}
                onChange={(e) =>
                  setFormData({ ...formData, requester_email: e.target.value })
                }
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="company_name">Company Name *</Label>
            <Input
              id="company_name"
              required
              value={formData.company_name}
              onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
            />
          </div>
        </div>

        <Separator />

        {/* Storage Requirements */}
        <div className="space-y-4">
          <h4 className="font-semibold text-gray-900 dark:text-white">Storage Requirements</h4>
          <div className="space-y-2">
            <Label htmlFor="warehouse">Preferred Warehouse *</Label>
            <Select
              value={formData.warehouse_id}
              onValueChange={(value) => setFormData({ ...formData, warehouse_id: value })}
              required
            >
              <SelectTrigger id="warehouse">
                <SelectValue placeholder="Select warehouse" />
              </SelectTrigger>
              <SelectContent>
                {warehouses.map((w) => (
                  <SelectItem key={w.id} value={w.id}>
                    {w.name} - {w.city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="space_required">Space Required (m³) *</Label>
              <Input
                id="space_required"
                type="number"
                required
                value={formData.space_required}
                onChange={(e) =>
                  setFormData({ ...formData, space_required: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration">Duration (months) *</Label>
              <Input
                id="duration"
                type="number"
                required
                value={formData.duration_months}
                onChange={(e) =>
                  setFormData({ ...formData, duration_months: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="start_date">Start Date *</Label>
              <Input
                id="start_date"
                type="date"
                required
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="storage_type">Storage Type *</Label>
            <RadioGroup
              value={formData.storage_type}
              onValueChange={(value) => setFormData({ ...formData, storage_type: value })}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="short_term" id="short_term" />
                <Label htmlFor="short_term">Short Term (1-6 months)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="long_term" id="long_term" />
                <Label htmlFor="long_term">Long Term (6+ months)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="seasonal" id="seasonal" />
                <Label htmlFor="seasonal">Seasonal</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="product_type">Product Type *</Label>
            <Input
              id="product_type"
              required
              placeholder="e.g., Electronics, Textiles, Food Products"
              value={formData.product_type}
              onChange={(e) => setFormData({ ...formData, product_type: e.target.value })}
            />
          </div>
        </div>

        <Separator />

        {/* Special Requirements */}
        <div className="space-y-4">
          <h4 className="font-semibold text-gray-900 dark:text-white">Special Requirements</h4>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="climate_controlled"
              checked={formData.climate_controlled}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, climate_controlled: checked as boolean })
              }
            />
            <Label htmlFor="climate_controlled">Climate Controlled Storage Required</Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="security_level">Security Level</Label>
            <Select
              value={formData.security_level}
              onValueChange={(value) => setFormData({ ...formData, security_level: value })}
            >
              <SelectTrigger id="security_level">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="basic">Basic</SelectItem>
                <SelectItem value="standard">Standard</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="premium">Premium</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" className="bg-gradient-to-r from-blue-600 to-indigo-600">
            Submit Request
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  )
}

// Stock In Dialog
function StockInDialog({
  onClose,
  warehouses,
}: {
  onClose: () => void
  warehouses: WarehouseLocation[]
}) {
  const { addStockMovement } = useWarehouseStore()
  const [formData, setFormData] = React.useState({
    warehouse_id: '',
    sku: '',
    product_name: '',
    quantity: '',
    bin_location: '',
    reason: '',
    notes: '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const warehouse = warehouses.find((w) => w.id === formData.warehouse_id)
    const movement: StockMovement = {
      id: `mov-${Date.now()}`,
      type: 'stock-in',
      reference_number: `SI-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9999)).padStart(4, '0')}`,
      warehouse_id: formData.warehouse_id,
      warehouse_name: warehouse?.name || '',
      item_id: `item-${Date.now()}`,
      sku: formData.sku,
      product_name: formData.product_name,
      quantity: Number(formData.quantity),
      to_bin: formData.bin_location,
      reason: formData.reason,
      performed_by: 'Current User',
      performed_at: new Date().toISOString(),
      status: 'completed',
      notes: formData.notes,
    }

    addStockMovement(movement)
    onClose()
  }

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Record Stock In</DialogTitle>
        <DialogDescription>Add new stock to warehouse inventory</DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="warehouse">Warehouse *</Label>
          <Select
            value={formData.warehouse_id}
            onValueChange={(value) => setFormData({ ...formData, warehouse_id: value })}
            required
          >
            <SelectTrigger id="warehouse">
              <SelectValue placeholder="Select warehouse" />
            </SelectTrigger>
            <SelectContent>
              {warehouses.map((w) => (
                <SelectItem key={w.id} value={w.id}>
                  {w.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="sku">SKU *</Label>
            <Input
              id="sku"
              required
              value={formData.sku}
              onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity *</Label>
            <Input
              id="quantity"
              type="number"
              required
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="product_name">Product Name *</Label>
          <Input
            id="product_name"
            required
            value={formData.product_name}
            onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="bin_location">Bin Location *</Label>
          <Input
            id="bin_location"
            required
            placeholder="e.g., A-01-R5-S3-B2"
            value={formData.bin_location}
            onChange={(e) => setFormData({ ...formData, bin_location: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="reason">Reason *</Label>
          <Input
            id="reason"
            required
            placeholder="e.g., New shipment received"
            value={formData.reason}
            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Notes (Optional)</Label>
          <Textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          />
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">Record Stock In</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  )
}

// Stock Out Dialog
function StockOutDialog({
  onClose,
  warehouses,
}: {
  onClose: () => void
  warehouses: WarehouseLocation[]
}) {
  const { addStockMovement } = useWarehouseStore()
  const [formData, setFormData] = React.useState({
    warehouse_id: '',
    sku: '',
    product_name: '',
    quantity: '',
    bin_location: '',
    reason: '',
    notes: '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const warehouse = warehouses.find((w) => w.id === formData.warehouse_id)
    const movement: StockMovement = {
      id: `mov-${Date.now()}`,
      type: 'stock-out',
      reference_number: `SO-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9999)).padStart(4, '0')}`,
      warehouse_id: formData.warehouse_id,
      warehouse_name: warehouse?.name || '',
      item_id: `item-${Date.now()}`,
      sku: formData.sku,
      product_name: formData.product_name,
      quantity: Number(formData.quantity),
      from_bin: formData.bin_location,
      reason: formData.reason,
      performed_by: 'Current User',
      performed_at: new Date().toISOString(),
      status: 'completed',
      notes: formData.notes,
    }

    addStockMovement(movement)
    onClose()
  }

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Record Stock Out</DialogTitle>
        <DialogDescription>Remove stock from warehouse inventory</DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="warehouse">Warehouse *</Label>
          <Select
            value={formData.warehouse_id}
            onValueChange={(value) => setFormData({ ...formData, warehouse_id: value })}
            required
          >
            <SelectTrigger id="warehouse">
              <SelectValue placeholder="Select warehouse" />
            </SelectTrigger>
            <SelectContent>
              {warehouses.map((w) => (
                <SelectItem key={w.id} value={w.id}>
                  {w.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="sku">SKU *</Label>
            <Input
              id="sku"
              required
              value={formData.sku}
              onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity *</Label>
            <Input
              id="quantity"
              type="number"
              required
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="product_name">Product Name *</Label>
          <Input
            id="product_name"
            required
            value={formData.product_name}
            onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="bin_location">Bin Location *</Label>
          <Input
            id="bin_location"
            required
            placeholder="e.g., A-01-R5-S3-B2"
            value={formData.bin_location}
            onChange={(e) => setFormData({ ...formData, bin_location: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="reason">Reason *</Label>
          <Input
            id="reason"
            required
            placeholder="e.g., Order fulfillment"
            value={formData.reason}
            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Notes (Optional)</Label>
          <Textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          />
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">Record Stock Out</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  )
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'active':
    case 'completed':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
    case 'maintenance':
    case 'in_progress':
    case 'pending':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100'
    case 'full':
    case 'cancelled':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100'
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100'
  }
}
