// @ts-nocheck
'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  TrendingDown,
  Users,
  Package,
  Calendar,
  Plus,
  Search,
  Filter,
  Download,
  Copy,
  Edit,
  Trash2,
  Power,
  Calculator,
  FileSpreadsheet,
  ChevronDown,
  ChevronUp,
  Percent,
  DollarSign,
  Tag,
  BarChart3,
  Clock,
  Target,
  Layers,
  Settings,
  AlertCircle,
  Check,
  X,
  ArrowRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { useCurrencyStore } from '@/store'

// Inline pricing types for vendor app
type CustomerGroup = 'retail' | 'wholesale' | 'vip' | 'distributor' | 'reseller' | 'corporate'
type DiscountType = 'percentage' | 'fixed' | 'fixed_price'

interface TieredPricingRule {
  id: string; minQty: number; maxQty: number | null; price: number; discount: number; discountType: DiscountType;
}
interface VolumeDiscountRule {
  id: string; minQty: number; maxQty: number | null; discountPercent: number;
}
interface PromotionalPricing {
  id: string; name: string; discount: number; discountType: DiscountType; startDate: string; endDate: string; active: boolean; productIds: string[];
}
interface CustomerGroupPricing {
  id: string; group: CustomerGroup; discount: number; discountType: DiscountType; minOrderValue: number;
}
interface ProductSpecificPricing {
  id: string; productId: string; productName: string; basePrice: number; tiers: TieredPricingRule[];
}
interface PriceCalculation {
  basePrice: number; quantity: number; customerGroup: CustomerGroup; subtotal: number; discount: number; total: number; unitPrice: number; savingsPercent: number;
}

// Local pricing store using React state (no cross-project import needed)
const usePricingStore = () => {
  const [tieredRules, setTieredRules] = React.useState<any[]>([])
  const [volumeRules, setVolumeRules] = React.useState<any[]>([])
  const [promotionalRules, setPromotionalRules] = React.useState<any[]>([])
  const [customerGroupRules, setCustomerGroupRules] = React.useState<any[]>([])
  const [productRules, setProductRules] = React.useState<any[]>([])
  const [pricingSheets, setPricingSheets] = React.useState<any[]>([])
  const [calculatorResults, setCalculatorResults] = React.useState<any[]>([])

  const makeId = () => Math.random().toString(36).slice(2, 10)

  return {
    tieredRules, volumeRules, promotionalRules, customerGroupRules, productRules, pricingSheets, calculatorResults,
    addTieredRule: (rule: any) => setTieredRules(prev => [...prev, { ...rule, id: makeId(), active: true }]),
    updateTieredRule: (id: string, data: any) => setTieredRules(prev => prev.map(r => r.id === id ? { ...r, ...data } : r)),
    deleteTieredRule: (id: string) => setTieredRules(prev => prev.filter(r => r.id !== id)),
    toggleTieredRule: (id: string) => setTieredRules(prev => prev.map(r => r.id === id ? { ...r, active: !r.active } : r)),
    addVolumeRule: (rule: any) => setVolumeRules(prev => [...prev, { ...rule, id: makeId(), active: true }]),
    updateVolumeRule: (id: string, data: any) => setVolumeRules(prev => prev.map(r => r.id === id ? { ...r, ...data } : r)),
    deleteVolumeRule: (id: string) => setVolumeRules(prev => prev.filter(r => r.id !== id)),
    toggleVolumeRule: (id: string) => setVolumeRules(prev => prev.map(r => r.id === id ? { ...r, active: !r.active } : r)),
    addPromotionalRule: (rule: any) => setPromotionalRules(prev => [...prev, { ...rule, id: makeId(), active: true }]),
    updatePromotionalRule: (id: string, data: any) => setPromotionalRules(prev => prev.map(r => r.id === id ? { ...r, ...data } : r)),
    deletePromotionalRule: (id: string) => setPromotionalRules(prev => prev.filter(r => r.id !== id)),
    togglePromotionalRule: (id: string) => setPromotionalRules(prev => prev.map(r => r.id === id ? { ...r, active: !r.active } : r)),
    addCustomerGroupRule: (rule: any) => setCustomerGroupRules(prev => [...prev, { ...rule, id: makeId(), active: true }]),
    updateCustomerGroupRule: (id: string, data: any) => setCustomerGroupRules(prev => prev.map(r => r.id === id ? { ...r, ...data } : r)),
    deleteCustomerGroupRule: (id: string) => setCustomerGroupRules(prev => prev.filter(r => r.id !== id)),
    toggleCustomerGroupRule: (id: string) => setCustomerGroupRules(prev => prev.map(r => r.id === id ? { ...r, active: !r.active } : r)),
    addProductRule: (rule: any) => setProductRules(prev => [...prev, { ...rule, id: makeId(), active: true }]),
    updateProductRule: (id: string, data: any) => setProductRules(prev => prev.map(r => r.id === id ? { ...r, ...data } : r)),
    deleteProductRule: (id: string) => setProductRules(prev => prev.filter(r => r.id !== id)),
    toggleProductRule: (id: string) => setProductRules(prev => prev.map(r => r.id === id ? { ...r, active: !r.active } : r)),
    calculatePrice: (...args: any[]) => {
      const price = typeof args[0] === 'string' ? parseFloat(args[0]) || 0 : (args[0] || 0)
      const qty = args[1] || 1
      const group = args[2] || 'retail'
      const total = price * qty
      const result = { basePrice: price, quantity: qty, customerGroup: group, subtotal: total, discount: 0, total, unitPrice: price, savingsPercent: 0 }
      setCalculatorResults(prev => [...prev, result])
      return result
    },
    calculateBulkPrices: (...args: any[]) => {
      const items = Array.isArray(args[0]) ? args[0] : []
      const group = args[1] || 'retail'
      return items.map((item: any) => {
        const price = item.basePrice || 0
        const qty = item.quantity || 1
        return { basePrice: price, quantity: qty, customerGroup: group, subtotal: price * qty, discount: 0, total: price * qty, unitPrice: price, savingsPercent: 0 }
      })
    },
    createPricingSheet: (...args: any[]) => {
      const data = typeof args[0] === 'object' ? args[0] : { name: args[0], rules: args[1] }
      const sheet = { id: makeId(), ...data, createdAt: new Date().toISOString() }
      setPricingSheets(prev => [...prev, sheet])
      return sheet
    },
    exportPricingSheet: (...args: any[]) => { console.log('Exporting sheet', args) },
    duplicateRule: (...args: any[]) => { console.log('Duplicating', args) },
  }
}

const customerGroups: { value: CustomerGroup; label: string }[] = [
  { value: 'retail', label: 'Retail Customers' },
  { value: 'wholesale', label: 'Wholesale' },
  { value: 'vip', label: 'VIP' },
  { value: 'distributor', label: 'Distributors' },
  { value: 'reseller', label: 'Resellers' },
  { value: 'corporate', label: 'Corporate' },
]

const discountTypes: { value: DiscountType; label: string; icon: any }[] = [
  { value: 'percentage', label: 'Percentage', icon: Percent },
  { value: 'fixed', label: 'Fixed Amount', icon: DollarSign },
  { value: 'fixed_price', label: 'Fixed Price', icon: Tag },
]

export default function PricingPage() {
  const { convertAndFormat } = useCurrencyStore()
  const {
    tieredRules,
    volumeRules,
    promotionalRules,
    customerGroupRules,
    productRules,
    pricingSheets,
    calculatorResults,
    addTieredRule,
    updateTieredRule,
    deleteTieredRule,
    toggleTieredRule,
    addVolumeRule,
    updateVolumeRule,
    deleteVolumeRule,
    toggleVolumeRule,
    addPromotionalRule,
    updatePromotionalRule,
    deletePromotionalRule,
    togglePromotionalRule,
    addCustomerGroupRule,
    updateCustomerGroupRule,
    deleteCustomerGroupRule,
    toggleCustomerGroupRule,
    addProductRule,
    updateProductRule,
    deleteProductRule,
    toggleProductRule,
    calculatePrice,
    calculateBulkPrices,
    createPricingSheet,
    exportPricingSheet,
    duplicateRule,
  } = usePricingStore()

  const [activeTab, setActiveTab] = React.useState('overview')
  const [searchQuery, setSearchQuery] = React.useState('')
  const [filterStatus, setFilterStatus] = React.useState<'all' | 'active' | 'inactive'>('all')

  // Dialogs
  const [showTieredDialog, setShowTieredDialog] = React.useState(false)
  const [showVolumeDialog, setShowVolumeDialog] = React.useState(false)
  const [showPromotionalDialog, setShowPromotionalDialog] = React.useState(false)
  const [showCustomerGroupDialog, setShowCustomerGroupDialog] = React.useState(false)
  const [showProductDialog, setShowProductDialog] = React.useState(false)
  const [showCalculatorDialog, setShowCalculatorDialog] = React.useState(false)
  const [showExportDialog, setShowExportDialog] = React.useState(false)

  // Tiered Pricing Form
  const [tieredForm, setTieredForm] = React.useState({
    name: '',
    productIds: '',
    tiers: [
      { minQuantity: 1, maxQuantity: 10, discountType: 'percentage' as DiscountType, discountValue: 0 },
      { minQuantity: 11, maxQuantity: 50, discountType: 'percentage' as DiscountType, discountValue: 5 },
      { minQuantity: 51, discountType: 'percentage' as DiscountType, discountValue: 10 },
    ],
    active: true,
    priority: 1,
  })

  // Volume Discount Form
  const [volumeForm, setVolumeForm] = React.useState({
    name: '',
    productIds: '',
    volumeBreaks: [
      { minQuantity: 10, discountPercentage: 5 },
      { minQuantity: 50, discountPercentage: 10 },
      { minQuantity: 100, discountPercentage: 15 },
    ],
    stackable: false,
    active: true,
    priority: 1,
  })

  // Promotional Pricing Form
  const [promotionalForm, setPromotionalForm] = React.useState({
    name: '',
    description: '',
    productIds: '',
    discountType: 'percentage' as DiscountType,
    discountValue: 0,
    startDate: '',
    endDate: '',
    limitPerCustomer: undefined as number | undefined,
    totalLimit: undefined as number | undefined,
    active: true,
    priority: 1,
  })

  // Customer Group Form
  const [customerGroupForm, setCustomerGroupForm] = React.useState({
    name: '',
    customerGroup: 'wholesale' as CustomerGroup,
    productIds: '',
    discountType: 'percentage' as DiscountType,
    discountValue: 0,
    minOrderQuantity: undefined as number | undefined,
    maxOrderQuantity: undefined as number | undefined,
    active: true,
    priority: 1,
  })

  // Product Specific Form
  const [productForm, setProductForm] = React.useState({
    name: '',
    productId: '',
    productName: '',
    basePrice: 0,
    specialPrice: undefined as number | undefined,
    costPrice: undefined as number | undefined,
    msrp: undefined as number | undefined,
    active: true,
  })

  // Calculator Form
  const [calculatorForm, setCalculatorForm] = React.useState({
    productId: '',
    quantity: 1,
    customerGroup: undefined as CustomerGroup | undefined,
  })

  const [bulkCalculatorItems, setBulkCalculatorItems] = React.useState([
    { productId: '', quantity: 1 },
  ])

  // Add tier to tiered pricing
  const addTier = () => {
    setTieredForm({
      ...tieredForm,
      tiers: [
        ...tieredForm.tiers,
        {
          minQuantity: (tieredForm.tiers[tieredForm.tiers.length - 1]?.maxQuantity || 0) + 1,
          discountType: 'percentage' as DiscountType,
          discountValue: 0,
        },
      ],
    })
  }

  const removeTier = (index: number) => {
    setTieredForm({
      ...tieredForm,
      tiers: tieredForm.tiers.filter((_, i) => i !== index),
    })
  }

  // Add volume break
  const addVolumeBreak = () => {
    setVolumeForm({
      ...volumeForm,
      volumeBreaks: [
        ...volumeForm.volumeBreaks,
        {
          minQuantity: (volumeForm.volumeBreaks[volumeForm.volumeBreaks.length - 1]?.minQuantity || 0) + 10,
          discountPercentage: 0,
        },
      ],
    })
  }

  const removeVolumeBreak = (index: number) => {
    setVolumeForm({
      ...volumeForm,
      volumeBreaks: volumeForm.volumeBreaks.filter((_, i) => i !== index),
    })
  }

  // Submit handlers
  const handleCreateTieredRule = () => {
    addTieredRule({
      ...tieredForm,
      productIds: tieredForm.productIds.split(',').map((id) => id.trim()),
      productNames: tieredForm.productIds.split(',').map((id) => `Product ${id.trim()}`),
    })
    setShowTieredDialog(false)
    setTieredForm({
      name: '',
      productIds: '',
      tiers: [
        { minQuantity: 1, maxQuantity: 10, discountType: 'percentage', discountValue: 0 },
        { minQuantity: 11, maxQuantity: 50, discountType: 'percentage', discountValue: 5 },
        { minQuantity: 51, discountType: 'percentage', discountValue: 10 },
      ],
      active: true,
      priority: 1,
    })
  }

  const handleCreateVolumeRule = () => {
    addVolumeRule({
      ...volumeForm,
      productIds: volumeForm.productIds.split(',').map((id) => id.trim()),
      productNames: volumeForm.productIds.split(',').map((id) => `Product ${id.trim()}`),
    })
    setShowVolumeDialog(false)
    setVolumeForm({
      name: '',
      productIds: '',
      volumeBreaks: [
        { minQuantity: 10, discountPercentage: 5 },
        { minQuantity: 50, discountPercentage: 10 },
        { minQuantity: 100, discountPercentage: 15 },
      ],
      stackable: false,
      active: true,
      priority: 1,
    })
  }

  const handleCreatePromotionalRule = () => {
    addPromotionalRule({
      ...promotionalForm,
      productIds: promotionalForm.productIds.split(',').map((id) => id.trim()),
      productNames: promotionalForm.productIds.split(',').map((id) => `Product ${id.trim()}`),
    })
    setShowPromotionalDialog(false)
    setPromotionalForm({
      name: '',
      description: '',
      productIds: '',
      discountType: 'percentage',
      discountValue: 0,
      startDate: '',
      endDate: '',
      limitPerCustomer: undefined,
      totalLimit: undefined,
      active: true,
      priority: 1,
    })
  }

  const handleCreateCustomerGroupRule = () => {
    addCustomerGroupRule({
      ...customerGroupForm,
      productIds: customerGroupForm.productIds.split(',').map((id) => id.trim()),
      productNames: customerGroupForm.productIds.split(',').map((id) => `Product ${id.trim()}`),
    })
    setShowCustomerGroupDialog(false)
    setCustomerGroupForm({
      name: '',
      customerGroup: 'wholesale',
      productIds: '',
      discountType: 'percentage',
      discountValue: 0,
      minOrderQuantity: undefined,
      maxOrderQuantity: undefined,
      active: true,
      priority: 1,
    })
  }

  const handleCreateProductRule = () => {
    addProductRule({
      ...productForm,
      rules: [],
    })
    setShowProductDialog(false)
    setProductForm({
      name: '',
      productId: '',
      productName: '',
      basePrice: 0,
      specialPrice: undefined,
      costPrice: undefined,
      msrp: undefined,
      active: true,
    })
  }

  const handleCalculatePrice = () => {
    if (calculatorForm.productId && calculatorForm.quantity > 0) {
      calculatePrice(calculatorForm.productId, calculatorForm.quantity, calculatorForm.customerGroup)
    }
  }

  const handleBulkCalculate = () => {
    const validItems = bulkCalculatorItems.filter((item) => item.productId && item.quantity > 0)
    if (validItems.length > 0) {
      calculateBulkPrices(validItems, calculatorForm.customerGroup)
    }
  }

  const addBulkCalculatorItem = () => {
    setBulkCalculatorItems([...bulkCalculatorItems, { productId: '', quantity: 1 }])
  }

  const removeBulkCalculatorItem = (index: number) => {
    setBulkCalculatorItems(bulkCalculatorItems.filter((_, i) => i !== index))
  }

  const handleExportSheet = () => {
    createPricingSheet({
      name: `Pricing Sheet ${new Date().toLocaleDateString()}`,
      description: 'Generated pricing sheet',
      products: productRules.map((rule) => ({
        productId: rule.productId,
        productName: rule.productName || `Product ${rule.productId}`,
        sku: rule.productId,
        basePrice: rule.basePrice,
        tiers: tieredRules
          .filter((tr) => tr.productIds.includes(rule.productId))
          .flatMap((tr) =>
            tr.tiers.map((tier) => ({
              quantity: tier.minQuantity,
              unitPrice: tier.discountType === 'fixed_price' ? tier.discountValue : rule.basePrice - tier.discountValue,
              discount: tier.discountType === 'percentage' ? `${tier.discountValue}%` : convertAndFormat(tier.discountValue),
            }))
          ),
      })),
    })
    setShowExportDialog(false)
  }

  // Stats
  const totalRules = tieredRules.length + volumeRules.length + promotionalRules.length + customerGroupRules.length + productRules.length
  const activeRules = [
    ...tieredRules.filter((r) => r.active),
    ...volumeRules.filter((r) => r.active),
    ...promotionalRules.filter((r) => r.active),
    ...customerGroupRules.filter((r) => r.active),
    ...productRules.filter((r) => r.active),
  ].length

  const activePromotions = promotionalRules.filter((r) => {
    if (!r.active) return false
    const now = new Date()
    const start = new Date(r.startDate)
    const end = new Date(r.endDate)
    return now >= start && now <= end
  }).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold font-display">Bulk Pricing Builder</h1>
          </div>
          <p className="text-muted-foreground mt-1">
            Create tiered pricing, volume discounts, and promotional offers
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setShowCalculatorDialog(true)}>
            <Calculator className="mr-2 h-4 w-4" />
            Price Calculator
          </Button>
          <Button variant="outline" onClick={() => setShowExportDialog(true)}>
            <Download className="mr-2 h-4 w-4" />
            Export Sheet
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Rules</p>
              <h3 className="text-2xl font-bold mt-2">{totalRules}</h3>
            </div>
            <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center">
              <Layers className="h-6 w-6 text-blue-500" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Active Rules</p>
              <h3 className="text-2xl font-bold mt-2">{activeRules}</h3>
            </div>
            <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
              <Power className="h-6 w-6 text-green-500" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Active Promotions</p>
              <h3 className="text-2xl font-bold mt-2">{activePromotions}</h3>
            </div>
            <div className="h-12 w-12 rounded-full bg-purple-500/10 flex items-center justify-center">
              <Tag className="h-6 w-6 text-purple-500" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Pricing Sheets</p>
              <h3 className="text-2xl font-bold mt-2">{pricingSheets.length}</h3>
            </div>
            <div className="h-12 w-12 rounded-full bg-orange-500/10 flex items-center justify-center">
              <FileSpreadsheet className="h-6 w-6 text-orange-500" />
            </div>
          </div>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tiered">Tiered Pricing</TabsTrigger>
          <TabsTrigger value="volume">Volume Discounts</TabsTrigger>
          <TabsTrigger value="promotional">Promotions</TabsTrigger>
          <TabsTrigger value="customer">Customer Groups</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Quick Actions */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Button
                  className="w-full justify-start"
                  variant="outline"
                  onClick={() => setShowTieredDialog(true)}
                >
                  <TrendingDown className="mr-2 h-4 w-4" />
                  Create Tiered Pricing
                </Button>
                <Button
                  className="w-full justify-start"
                  variant="outline"
                  onClick={() => setShowVolumeDialog(true)}
                >
                  <Package className="mr-2 h-4 w-4" />
                  Add Volume Discount
                </Button>
                <Button
                  className="w-full justify-start"
                  variant="outline"
                  onClick={() => setShowPromotionalDialog(true)}
                >
                  <Tag className="mr-2 h-4 w-4" />
                  Launch Promotion
                </Button>
                <Button
                  className="w-full justify-start"
                  variant="outline"
                  onClick={() => setShowCustomerGroupDialog(true)}
                >
                  <Users className="mr-2 h-4 w-4" />
                  Set Group Pricing
                </Button>
              </div>
            </Card>

            {/* Recent Activity */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Recent Pricing Rules</h3>
              <ScrollArea className="h-[240px]">
                <div className="space-y-3">
                  {[...tieredRules, ...volumeRules, ...promotionalRules, ...customerGroupRules]
                    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
                    .slice(0, 5)
                    .map((rule) => (
                      <div
                        key={rule.id}
                        className="flex items-center justify-between p-3 rounded-lg border bg-card"
                      >
                        <div className="flex-1">
                          <p className="font-medium">{rule.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(rule.updatedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge variant={rule.active ? 'default' : 'secondary'}>
                          {rule.active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    ))}
                </div>
              </ScrollArea>
            </Card>
          </div>

          {/* Pricing Guide */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Pricing Strategy Guide</h3>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div className="p-4 rounded-lg border bg-blue-500/5">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                    <TrendingDown className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Tiered Pricing</h4>
                    <p className="text-sm text-muted-foreground">
                      Offer quantity breaks with automatic price adjustments based on order volume.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-lg border bg-green-500/5">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0">
                    <Package className="h-5 w-5 text-green-500" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Volume Discounts</h4>
                    <p className="text-sm text-muted-foreground">
                      Reward bulk purchases with percentage-based volume discounts.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-lg border bg-purple-500/5">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-full bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                    <Tag className="h-5 w-5 text-purple-500" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Promotions</h4>
                    <p className="text-sm text-muted-foreground">
                      Create time-limited offers to drive sales and clear inventory.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-lg border bg-orange-500/5">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-full bg-orange-500/10 flex items-center justify-center flex-shrink-0">
                    <Users className="h-5 w-5 text-orange-500" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Customer Groups</h4>
                    <p className="text-sm text-muted-foreground">
                      Set special pricing for wholesale, VIP, and corporate customers.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-lg border bg-pink-500/5">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-full bg-pink-500/10 flex items-center justify-center flex-shrink-0">
                    <Target className="h-5 w-5 text-pink-500" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Product-Specific</h4>
                    <p className="text-sm text-muted-foreground">
                      Configure custom pricing rules for individual products.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-lg border bg-yellow-500/5">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-full bg-yellow-500/10 flex items-center justify-center flex-shrink-0">
                    <Calculator className="h-5 w-5 text-yellow-500" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Price Calculator</h4>
                    <p className="text-sm text-muted-foreground">
                      Preview pricing outcomes before applying rules to products.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Tiered Pricing Tab */}
        <TabsContent value="tiered" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Tiered Pricing Rules</h3>
              <p className="text-sm text-muted-foreground">
                {tieredRules.length} rule{tieredRules.length !== 1 ? 's' : ''} configured
              </p>
            </div>
            <Button onClick={() => setShowTieredDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Tiered Pricing
            </Button>
          </div>

          <div className="grid gap-4">
            {tieredRules.map((rule) => (
              <Card key={rule.id} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold">{rule.name}</h4>
                      <Badge variant={rule.active ? 'default' : 'secondary'}>
                        {rule.active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {rule.productIds.length} product{rule.productIds.length !== 1 ? 's' : ''} • {rule.tiers.length} tier{rule.tiers.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => toggleTieredRule(rule.id)}>
                        <Power className="mr-2 h-4 w-4" />
                        {rule.active ? 'Deactivate' : 'Activate'}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => duplicateRule('tiered', rule.id)}>
                        <Copy className="mr-2 h-4 w-4" />
                        Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => deleteTieredRule(rule.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="space-y-2">
                  <div className="grid grid-cols-4 gap-4 text-sm font-medium text-muted-foreground pb-2 border-b">
                    <div>Quantity Range</div>
                    <div>Discount Type</div>
                    <div>Discount Value</div>
                    <div>Price Impact</div>
                  </div>
                  {rule.tiers.map((tier, index) => (
                    <div key={index} className="grid grid-cols-4 gap-4 text-sm items-center">
                      <div>
                        {tier.minQuantity}{tier.maxQuantity ? ` - ${tier.maxQuantity}` : '+'}
                      </div>
                      <div className="capitalize">{tier.discountType.replace('_', ' ')}</div>
                      <div>
                        {tier.discountType === 'percentage'
                          ? `${tier.discountValue}%`
                          : convertAndFormat(tier.discountValue)}
                      </div>
                      <div className="text-green-600 font-medium">
                        {tier.discountType === 'percentage' ? `${tier.discountValue}% off` : `Save ${convertAndFormat(tier.discountValue)}`}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            ))}

            {tieredRules.length === 0 && (
              <Card className="p-12">
                <div className="text-center">
                  <TrendingDown className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No tiered pricing rules</h3>
                  <p className="text-muted-foreground mb-4">
                    Create your first tiered pricing rule to offer quantity-based discounts
                  </p>
                  <Button onClick={() => setShowTieredDialog(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Tiered Pricing
                  </Button>
                </div>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Volume Discounts Tab */}
        <TabsContent value="volume" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Volume Discount Rules</h3>
              <p className="text-sm text-muted-foreground">
                {volumeRules.length} rule{volumeRules.length !== 1 ? 's' : ''} configured
              </p>
            </div>
            <Button onClick={() => setShowVolumeDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Volume Discount
            </Button>
          </div>

          <div className="grid gap-4">
            {volumeRules.map((rule) => (
              <Card key={rule.id} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold">{rule.name}</h4>
                      <Badge variant={rule.active ? 'default' : 'secondary'}>
                        {rule.active ? 'Active' : 'Inactive'}
                      </Badge>
                      {rule.stackable && (
                        <Badge variant="outline">Stackable</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {rule.productIds.length} product{rule.productIds.length !== 1 ? 's' : ''} • {rule.volumeBreaks.length} volume break{rule.volumeBreaks.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => toggleVolumeRule(rule.id)}>
                        <Power className="mr-2 h-4 w-4" />
                        {rule.active ? 'Deactivate' : 'Activate'}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => duplicateRule('volume', rule.id)}>
                        <Copy className="mr-2 h-4 w-4" />
                        Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => deleteVolumeRule(rule.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="space-y-2">
                  <div className="grid grid-cols-3 gap-4 text-sm font-medium text-muted-foreground pb-2 border-b">
                    <div>Minimum Quantity</div>
                    <div>Discount Percentage</div>
                    <div>Savings</div>
                  </div>
                  {rule.volumeBreaks.map((vb, index) => (
                    <div key={index} className="grid grid-cols-3 gap-4 text-sm items-center">
                      <div>{vb.minQuantity}+ units</div>
                      <div>{vb.discountPercentage}%</div>
                      <div className="text-green-600 font-medium">
                        {vb.discountPercentage}% off total
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            ))}

            {volumeRules.length === 0 && (
              <Card className="p-12">
                <div className="text-center">
                  <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No volume discount rules</h3>
                  <p className="text-muted-foreground mb-4">
                    Create volume discounts to incentivize bulk purchases
                  </p>
                  <Button onClick={() => setShowVolumeDialog(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Volume Discount
                  </Button>
                </div>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Promotional Pricing Tab */}
        <TabsContent value="promotional" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Promotional Pricing</h3>
              <p className="text-sm text-muted-foreground">
                {promotionalRules.length} promotion{promotionalRules.length !== 1 ? 's' : ''} • {activePromotions} active
              </p>
            </div>
            <Button onClick={() => setShowPromotionalDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Launch Promotion
            </Button>
          </div>

          <div className="grid gap-4">
            {promotionalRules.map((rule) => {
              const now = new Date()
              const start = new Date(rule.startDate)
              const end = new Date(rule.endDate)
              const isActive = rule.active && now >= start && now <= end
              const isUpcoming = rule.active && now < start
              const isExpired = now > end

              return (
                <Card key={rule.id} className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold">{rule.name}</h4>
                        <Badge variant={isActive ? 'default' : isUpcoming ? 'secondary' : 'outline'}>
                          {isActive ? 'Active' : isUpcoming ? 'Upcoming' : isExpired ? 'Expired' : 'Inactive'}
                        </Badge>
                      </div>
                      {rule.description && (
                        <p className="text-sm text-muted-foreground mb-2">{rule.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {new Date(rule.startDate).toLocaleDateString()} - {new Date(rule.endDate).toLocaleDateString()}
                        </div>
                        {rule.totalLimit && (
                          <div className="flex items-center gap-1">
                            <Target className="h-3.5 w-3.5" />
                            {rule.currentUsage}/{rule.totalLimit} used
                          </div>
                        )}
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <Settings className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => togglePromotionalRule(rule.id)}>
                          <Power className="mr-2 h-4 w-4" />
                          {rule.active ? 'Deactivate' : 'Activate'}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => duplicateRule('promotional', rule.id)}>
                          <Copy className="mr-2 h-4 w-4" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => deletePromotionalRule(rule.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
                    <div className="flex-1">
                      <p className="text-sm font-medium mb-1">Discount</p>
                      <p className="text-2xl font-bold">
                        {rule.discountType === 'percentage'
                          ? `${rule.discountValue}%`
                          : convertAndFormat(rule.discountValue)}
                      </p>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium mb-1">Products</p>
                      <p className="text-2xl font-bold">{rule.productIds.length}</p>
                    </div>
                    {rule.limitPerCustomer && (
                      <div className="flex-1">
                        <p className="text-sm font-medium mb-1">Per Customer</p>
                        <p className="text-2xl font-bold">{rule.limitPerCustomer}</p>
                      </div>
                    )}
                  </div>
                </Card>
              )
            })}

            {promotionalRules.length === 0 && (
              <Card className="p-12">
                <div className="text-center">
                  <Tag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No promotional pricing</h3>
                  <p className="text-muted-foreground mb-4">
                    Launch time-limited promotions to boost sales
                  </p>
                  <Button onClick={() => setShowPromotionalDialog(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Promotion
                  </Button>
                </div>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Customer Groups Tab */}
        <TabsContent value="customer" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Customer Group Pricing</h3>
              <p className="text-sm text-muted-foreground">
                {customerGroupRules.length} rule{customerGroupRules.length !== 1 ? 's' : ''} configured
              </p>
            </div>
            <Button onClick={() => setShowCustomerGroupDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Group Pricing
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {customerGroupRules.map((rule) => (
              <Card key={rule.id} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold">{rule.name}</h4>
                      <Badge variant={rule.active ? 'default' : 'secondary'}>
                        {rule.active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground capitalize">
                      {rule.customerGroup.replace('_', ' ')} • {rule.productIds.length} product{rule.productIds.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => toggleCustomerGroupRule(rule.id)}>
                        <Power className="mr-2 h-4 w-4" />
                        {rule.active ? 'Deactivate' : 'Activate'}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => duplicateRule('customer_group', rule.id)}>
                        <Copy className="mr-2 h-4 w-4" />
                        Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => deleteCustomerGroupRule(rule.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <span className="text-sm font-medium">Discount</span>
                    <span className="font-bold">
                      {rule.discountType === 'percentage'
                        ? `${rule.discountValue}%`
                        : convertAndFormat(rule.discountValue)}
                    </span>
                  </div>

                  {(rule.minOrderQuantity || rule.maxOrderQuantity) && (
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <span className="text-sm font-medium">Quantity Range</span>
                      <span className="font-bold">
                        {rule.minOrderQuantity || 0} - {rule.maxOrderQuantity || '∞'}
                      </span>
                    </div>
                  )}
                </div>
              </Card>
            ))}

            {customerGroupRules.length === 0 && (
              <Card className="p-12 md:col-span-2">
                <div className="text-center">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No customer group pricing</h3>
                  <p className="text-muted-foreground mb-4">
                    Set special pricing for different customer segments
                  </p>
                  <Button onClick={() => setShowCustomerGroupDialog(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Group Pricing
                  </Button>
                </div>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Products Tab */}
        <TabsContent value="products" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Product-Specific Pricing</h3>
              <p className="text-sm text-muted-foreground">
                {productRules.length} product{productRules.length !== 1 ? 's' : ''} configured
              </p>
            </div>
            <Button onClick={() => setShowProductDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Product Pricing
            </Button>
          </div>

          <div className="grid gap-4">
            {productRules.map((rule) => (
              <Card key={rule.id} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold">{rule.name}</h4>
                      <Badge variant={rule.active ? 'default' : 'secondary'}>
                        {rule.active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {rule.productName || `Product ${rule.productId}`}
                    </p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => toggleProductRule(rule.id)}>
                        <Power className="mr-2 h-4 w-4" />
                        {rule.active ? 'Deactivate' : 'Activate'}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => duplicateRule('product_specific', rule.id)}>
                        <Copy className="mr-2 h-4 w-4" />
                        Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => deleteProductRule(rule.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-sm font-medium text-muted-foreground mb-1">Base Price</p>
                    <p className="text-lg font-bold">{convertAndFormat(rule.basePrice)}</p>
                  </div>

                  {rule.specialPrice && (
                    <div className="p-3 rounded-lg bg-green-500/10">
                      <p className="text-sm font-medium text-muted-foreground mb-1">Special Price</p>
                      <p className="text-lg font-bold text-green-600">{convertAndFormat(rule.specialPrice)}</p>
                    </div>
                  )}

                  {rule.costPrice && (
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-sm font-medium text-muted-foreground mb-1">Cost Price</p>
                      <p className="text-lg font-bold">{convertAndFormat(rule.costPrice)}</p>
                    </div>
                  )}

                  {rule.marginPercentage && (
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-sm font-medium text-muted-foreground mb-1">Margin</p>
                      <p className="text-lg font-bold">{rule.marginPercentage}%</p>
                    </div>
                  )}
                </div>
              </Card>
            ))}

            {productRules.length === 0 && (
              <Card className="p-12">
                <div className="text-center">
                  <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No product pricing configured</h3>
                  <p className="text-muted-foreground mb-4">
                    Set custom pricing for individual products
                  </p>
                  <Button onClick={() => setShowProductDialog(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Product Pricing
                  </Button>
                </div>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Tiered Pricing Dialog */}
      <Dialog open={showTieredDialog} onOpenChange={setShowTieredDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Tiered Pricing Rule</DialogTitle>
            <DialogDescription>
              Set quantity-based price breaks for products
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="tiered-name">Rule Name</Label>
              <Input
                id="tiered-name"
                placeholder="e.g., Bulk Discount 2024"
                value={tieredForm.name}
                onChange={(e) => setTieredForm({ ...tieredForm, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tiered-products">Product IDs (comma-separated)</Label>
              <Input
                id="tiered-products"
                placeholder="e.g., prod_123, prod_456"
                value={tieredForm.productIds}
                onChange={(e) => setTieredForm({ ...tieredForm, productIds: e.target.value })}
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Pricing Tiers</Label>
                <Button type="button" variant="outline" size="sm" onClick={addTier}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Tier
                </Button>
              </div>

              {tieredForm.tiers.map((tier, index) => (
                <Card key={index} className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="flex-1 grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Min Quantity</Label>
                        <Input
                          type="number"
                          value={tier.minQuantity}
                          onChange={(e) => {
                            const newTiers = [...tieredForm.tiers]
                            newTiers[index].minQuantity = parseInt(e.target.value) || 0
                            setTieredForm({ ...tieredForm, tiers: newTiers })
                          }}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Max Quantity (optional)</Label>
                        <Input
                          type="number"
                          value={tier.maxQuantity || ''}
                          onChange={(e) => {
                            const newTiers = [...tieredForm.tiers]
                            newTiers[index].maxQuantity = e.target.value ? parseInt(e.target.value) : undefined
                            setTieredForm({ ...tieredForm, tiers: newTiers })
                          }}
                          placeholder="No limit"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Discount Type</Label>
                        <Select
                          value={tier.discountType}
                          onValueChange={(value: DiscountType) => {
                            const newTiers = [...tieredForm.tiers]
                            newTiers[index].discountType = value
                            setTieredForm({ ...tieredForm, tiers: newTiers })
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {discountTypes.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Discount Value</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={tier.discountValue}
                          onChange={(e) => {
                            const newTiers = [...tieredForm.tiers]
                            newTiers[index].discountValue = parseFloat(e.target.value) || 0
                            setTieredForm({ ...tieredForm, tiers: newTiers })
                          }}
                        />
                      </div>
                    </div>

                    {tieredForm.tiers.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeTier(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </Card>
              ))}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="tiered-priority">Priority</Label>
                <Input
                  id="tiered-priority"
                  type="number"
                  value={tieredForm.priority}
                  onChange={(e) => setTieredForm({ ...tieredForm, priority: parseInt(e.target.value) || 1 })}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="tiered-active"
                  checked={tieredForm.active}
                  onCheckedChange={(checked) => setTieredForm({ ...tieredForm, active: checked })}
                />
                <Label htmlFor="tiered-active">Active</Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTieredDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateTieredRule}>Create Rule</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Volume Discount Dialog */}
      <Dialog open={showVolumeDialog} onOpenChange={setShowVolumeDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Volume Discount</DialogTitle>
            <DialogDescription>
              Set percentage-based discounts for bulk purchases
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="volume-name">Rule Name</Label>
              <Input
                id="volume-name"
                placeholder="e.g., Bulk Volume Discount"
                value={volumeForm.name}
                onChange={(e) => setVolumeForm({ ...volumeForm, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="volume-products">Product IDs (comma-separated)</Label>
              <Input
                id="volume-products"
                placeholder="e.g., prod_123, prod_456"
                value={volumeForm.productIds}
                onChange={(e) => setVolumeForm({ ...volumeForm, productIds: e.target.value })}
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Volume Breaks</Label>
                <Button type="button" variant="outline" size="sm" onClick={addVolumeBreak}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Break
                </Button>
              </div>

              {volumeForm.volumeBreaks.map((vb, index) => (
                <Card key={index} className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="flex-1 grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Minimum Quantity</Label>
                        <Input
                          type="number"
                          value={vb.minQuantity}
                          onChange={(e) => {
                            const newBreaks = [...volumeForm.volumeBreaks]
                            newBreaks[index].minQuantity = parseInt(e.target.value) || 0
                            setVolumeForm({ ...volumeForm, volumeBreaks: newBreaks })
                          }}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Discount Percentage</Label>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            step="0.1"
                            value={vb.discountPercentage}
                            onChange={(e) => {
                              const newBreaks = [...volumeForm.volumeBreaks]
                              newBreaks[index].discountPercentage = parseFloat(e.target.value) || 0
                              setVolumeForm({ ...volumeForm, volumeBreaks: newBreaks })
                            }}
                          />
                          <Percent className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                    </div>

                    {volumeForm.volumeBreaks.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeVolumeBreak(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </Card>
              ))}
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="volume-stackable"
                  checked={volumeForm.stackable}
                  onCheckedChange={(checked) => setVolumeForm({ ...volumeForm, stackable: checked })}
                />
                <Label htmlFor="volume-stackable">Stackable with other discounts</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="volume-active"
                  checked={volumeForm.active}
                  onCheckedChange={(checked) => setVolumeForm({ ...volumeForm, active: checked })}
                />
                <Label htmlFor="volume-active">Active</Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowVolumeDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateVolumeRule}>Create Rule</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Promotional Pricing Dialog */}
      <Dialog open={showPromotionalDialog} onOpenChange={setShowPromotionalDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Launch Promotional Pricing</DialogTitle>
            <DialogDescription>
              Create time-limited promotional offers
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="promo-name">Promotion Name</Label>
              <Input
                id="promo-name"
                placeholder="e.g., Summer Sale 2024"
                value={promotionalForm.name}
                onChange={(e) => setPromotionalForm({ ...promotionalForm, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="promo-description">Description (optional)</Label>
              <Input
                id="promo-description"
                placeholder="Describe your promotion"
                value={promotionalForm.description}
                onChange={(e) => setPromotionalForm({ ...promotionalForm, description: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="promo-products">Product IDs (comma-separated)</Label>
              <Input
                id="promo-products"
                placeholder="e.g., prod_123, prod_456"
                value={promotionalForm.productIds}
                onChange={(e) => setPromotionalForm({ ...promotionalForm, productIds: e.target.value })}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="promo-discount-type">Discount Type</Label>
                <Select
                  value={promotionalForm.discountType}
                  onValueChange={(value: DiscountType) => setPromotionalForm({ ...promotionalForm, discountType: value })}
                >
                  <SelectTrigger id="promo-discount-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {discountTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="promo-discount-value">Discount Value</Label>
                <Input
                  id="promo-discount-value"
                  type="number"
                  step="0.01"
                  value={promotionalForm.discountValue}
                  onChange={(e) => setPromotionalForm({ ...promotionalForm, discountValue: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="promo-start">Start Date</Label>
                <Input
                  id="promo-start"
                  type="datetime-local"
                  value={promotionalForm.startDate}
                  onChange={(e) => setPromotionalForm({ ...promotionalForm, startDate: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="promo-end">End Date</Label>
                <Input
                  id="promo-end"
                  type="datetime-local"
                  value={promotionalForm.endDate}
                  onChange={(e) => setPromotionalForm({ ...promotionalForm, endDate: e.target.value })}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="promo-per-customer">Limit Per Customer (optional)</Label>
                <Input
                  id="promo-per-customer"
                  type="number"
                  placeholder="No limit"
                  value={promotionalForm.limitPerCustomer || ''}
                  onChange={(e) => setPromotionalForm({ ...promotionalForm, limitPerCustomer: e.target.value ? parseInt(e.target.value) : undefined })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="promo-total">Total Limit (optional)</Label>
                <Input
                  id="promo-total"
                  type="number"
                  placeholder="No limit"
                  value={promotionalForm.totalLimit || ''}
                  onChange={(e) => setPromotionalForm({ ...promotionalForm, totalLimit: e.target.value ? parseInt(e.target.value) : undefined })}
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="promo-active"
                checked={promotionalForm.active}
                onCheckedChange={(checked) => setPromotionalForm({ ...promotionalForm, active: checked })}
              />
              <Label htmlFor="promo-active">Active</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPromotionalDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreatePromotionalRule}>Launch Promotion</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Customer Group Dialog */}
      <Dialog open={showCustomerGroupDialog} onOpenChange={setShowCustomerGroupDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Customer Group Pricing</DialogTitle>
            <DialogDescription>
              Set special pricing for customer segments
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="group-name">Rule Name</Label>
              <Input
                id="group-name"
                placeholder="e.g., Wholesale Pricing"
                value={customerGroupForm.name}
                onChange={(e) => setCustomerGroupForm({ ...customerGroupForm, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="group-type">Customer Group</Label>
              <Select
                value={customerGroupForm.customerGroup}
                onValueChange={(value: CustomerGroup) => setCustomerGroupForm({ ...customerGroupForm, customerGroup: value })}
              >
                <SelectTrigger id="group-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {customerGroups.map((group) => (
                    <SelectItem key={group.value} value={group.value}>
                      {group.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="group-products">Product IDs (comma-separated)</Label>
              <Input
                id="group-products"
                placeholder="e.g., prod_123, prod_456"
                value={customerGroupForm.productIds}
                onChange={(e) => setCustomerGroupForm({ ...customerGroupForm, productIds: e.target.value })}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="group-discount-type">Discount Type</Label>
                <Select
                  value={customerGroupForm.discountType}
                  onValueChange={(value: DiscountType) => setCustomerGroupForm({ ...customerGroupForm, discountType: value })}
                >
                  <SelectTrigger id="group-discount-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {discountTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="group-discount-value">Discount Value</Label>
                <Input
                  id="group-discount-value"
                  type="number"
                  step="0.01"
                  value={customerGroupForm.discountValue}
                  onChange={(e) => setCustomerGroupForm({ ...customerGroupForm, discountValue: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="group-min">Min Order Quantity (optional)</Label>
                <Input
                  id="group-min"
                  type="number"
                  placeholder="No minimum"
                  value={customerGroupForm.minOrderQuantity || ''}
                  onChange={(e) => setCustomerGroupForm({ ...customerGroupForm, minOrderQuantity: e.target.value ? parseInt(e.target.value) : undefined })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="group-max">Max Order Quantity (optional)</Label>
                <Input
                  id="group-max"
                  type="number"
                  placeholder="No maximum"
                  value={customerGroupForm.maxOrderQuantity || ''}
                  onChange={(e) => setCustomerGroupForm({ ...customerGroupForm, maxOrderQuantity: e.target.value ? parseInt(e.target.value) : undefined })}
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="group-active"
                checked={customerGroupForm.active}
                onCheckedChange={(checked) => setCustomerGroupForm({ ...customerGroupForm, active: checked })}
              />
              <Label htmlFor="group-active">Active</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCustomerGroupDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateCustomerGroupRule}>Create Rule</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Product Pricing Dialog */}
      <Dialog open={showProductDialog} onOpenChange={setShowProductDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Product Pricing</DialogTitle>
            <DialogDescription>
              Configure pricing for a specific product
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="product-name">Product Name</Label>
              <Input
                id="product-name"
                placeholder="Enter product name"
                value={productForm.name}
                onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="product-id">Product ID</Label>
                <Input
                  id="product-id"
                  placeholder="e.g., prod_123"
                  value={productForm.productId}
                  onChange={(e) => setProductForm({ ...productForm, productId: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="product-base-price">Base Price</Label>
                <Input
                  id="product-base-price"
                  type="number"
                  step="0.01"
                  value={productForm.basePrice}
                  onChange={(e) => setProductForm({ ...productForm, basePrice: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="product-special">Special Price (optional)</Label>
                <Input
                  id="product-special"
                  type="number"
                  step="0.01"
                  placeholder="Sale price"
                  value={productForm.specialPrice || ''}
                  onChange={(e) => setProductForm({ ...productForm, specialPrice: e.target.value ? parseFloat(e.target.value) : undefined })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="product-cost">Cost Price (optional)</Label>
                <Input
                  id="product-cost"
                  type="number"
                  step="0.01"
                  placeholder="Your cost"
                  value={productForm.costPrice || ''}
                  onChange={(e) => setProductForm({ ...productForm, costPrice: e.target.value ? parseFloat(e.target.value) : undefined })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="product-msrp">MSRP (optional)</Label>
              <Input
                id="product-msrp"
                type="number"
                step="0.01"
                placeholder="Manufacturer's suggested retail price"
                value={productForm.msrp || ''}
                onChange={(e) => setProductForm({ ...productForm, msrp: e.target.value ? parseFloat(e.target.value) : undefined })}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="product-active"
                checked={productForm.active}
                onCheckedChange={(checked) => setProductForm({ ...productForm, active: checked })}
              />
              <Label htmlFor="product-active">Active</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowProductDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateProductRule}>Add Product</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Price Calculator Dialog */}
      <Dialog open={showCalculatorDialog} onOpenChange={setShowCalculatorDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Price Calculator</DialogTitle>
            <DialogDescription>
              Preview pricing outcomes with your configured rules
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="single" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="single">Single Product</TabsTrigger>
              <TabsTrigger value="bulk">Bulk Calculator</TabsTrigger>
            </TabsList>

            <TabsContent value="single" className="space-y-6 py-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="calc-product">Product ID</Label>
                  <Input
                    id="calc-product"
                    placeholder="e.g., prod_123"
                    value={calculatorForm.productId}
                    onChange={(e) => setCalculatorForm({ ...calculatorForm, productId: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="calc-quantity">Quantity</Label>
                  <Input
                    id="calc-quantity"
                    type="number"
                    min="1"
                    value={calculatorForm.quantity}
                    onChange={(e) => setCalculatorForm({ ...calculatorForm, quantity: parseInt(e.target.value) || 1 })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="calc-group">Customer Group (optional)</Label>
                  <Select
                    value={calculatorForm.customerGroup || 'none'}
                    onValueChange={(value) => setCalculatorForm({ ...calculatorForm, customerGroup: value === 'none' ? undefined : value as CustomerGroup })}
                  >
                    <SelectTrigger id="calc-group">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {customerGroups.map((group) => (
                        <SelectItem key={group.value} value={group.value}>
                          {group.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button className="w-full" onClick={handleCalculatePrice}>
                <Calculator className="mr-2 h-4 w-4" />
                Calculate Price
              </Button>

              {calculatorResults.length > 0 && calculatorResults[0] && (
                <Card className="p-6 bg-gradient-to-br from-primary/5 to-primary/10">
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-lg font-semibold mb-2">{calculatorResults[0].productName}</h4>
                      <p className="text-sm text-muted-foreground">
                        Quantity: {calculatorResults[0].quantity} units
                      </p>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="p-4 rounded-lg bg-background/50 border">
                        <p className="text-sm text-muted-foreground mb-1">Base Price</p>
                        <p className="text-2xl font-bold">{convertAndFormat(calculatorResults[0].basePrice)}</p>
                      </div>

                      <div className="p-4 rounded-lg bg-background/50 border">
                        <p className="text-sm text-muted-foreground mb-1">Unit Price</p>
                        <p className="text-2xl font-bold text-primary">{convertAndFormat(calculatorResults[0].unitPrice)}</p>
                      </div>

                      <div className="p-4 rounded-lg bg-background/50 border">
                        <p className="text-sm text-muted-foreground mb-1">Subtotal</p>
                        <p className="text-2xl font-bold">{convertAndFormat(calculatorResults[0].subtotal)}</p>
                      </div>

                      <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                        <p className="text-sm text-muted-foreground mb-1">Total Savings</p>
                        <p className="text-2xl font-bold text-green-600">
                          {convertAndFormat(calculatorResults[0].savings)} ({calculatorResults[0].savingsPercentage.toFixed(1)}%)
                        </p>
                      </div>
                    </div>

                    <div className="pt-4 border-t">
                      <p className="text-lg font-semibold mb-2">Final Total</p>
                      <p className="text-4xl font-bold text-primary">{convertAndFormat(calculatorResults[0].total)}</p>
                    </div>

                    {calculatorResults[0].appliedRules.length > 0 && (
                      <div className="pt-4 border-t">
                        <p className="text-sm font-medium mb-3">Applied Rules:</p>
                        <div className="space-y-2">
                          {calculatorResults[0].appliedRules.map((rule, index) => (
                            <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-background/50 border">
                              <div>
                                <p className="font-medium">{rule.ruleName}</p>
                                <p className="text-sm text-muted-foreground capitalize">{rule.ruleType.replace('_', ' ')}</p>
                              </div>
                              <p className="font-bold text-green-600">-{convertAndFormat(rule.discountAmount)}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="bulk" className="space-y-6 py-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Products</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addBulkCalculatorItem}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Product
                  </Button>
                </div>

                {bulkCalculatorItems.map((item, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <div className="flex-1">
                      <Input
                        placeholder="Product ID"
                        value={item.productId}
                        onChange={(e) => {
                          const newItems = [...bulkCalculatorItems]
                          newItems[index].productId = e.target.value
                          setBulkCalculatorItems(newItems)
                        }}
                      />
                    </div>
                    <div className="w-32">
                      <Input
                        type="number"
                        min="1"
                        placeholder="Qty"
                        value={item.quantity}
                        onChange={(e) => {
                          const newItems = [...bulkCalculatorItems]
                          newItems[index].quantity = parseInt(e.target.value) || 1
                          setBulkCalculatorItems(newItems)
                        }}
                      />
                    </div>
                    {bulkCalculatorItems.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeBulkCalculatorItem(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <Label htmlFor="bulk-calc-group">Customer Group (optional)</Label>
                <Select
                  value={calculatorForm.customerGroup || 'none'}
                  onValueChange={(value) => setCalculatorForm({ ...calculatorForm, customerGroup: value === 'none' ? undefined : value as CustomerGroup })}
                >
                  <SelectTrigger id="bulk-calc-group">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {customerGroups.map((group) => (
                      <SelectItem key={group.value} value={group.value}>
                        {group.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button className="w-full" onClick={handleBulkCalculate}>
                <Calculator className="mr-2 h-4 w-4" />
                Calculate Bulk Prices
              </Button>

              {calculatorResults.length > 0 && (
                <div className="space-y-4">
                  {calculatorResults.map((result, index) => (
                    <Card key={index} className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-semibold">{result.productName}</p>
                          <p className="text-sm text-muted-foreground">{result.quantity} units</p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold">{convertAndFormat(result.total)}</p>
                          {result.savings > 0 && (
                            <p className="text-sm text-green-600">Save {convertAndFormat(result.savings)}</p>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}

                  <Card className="p-6 bg-gradient-to-br from-primary/5 to-primary/10">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-lg font-semibold mb-1">Grand Total</p>
                        <p className="text-sm text-muted-foreground">
                          {calculatorResults.reduce((sum, r) => sum + r.quantity, 0)} total units
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-4xl font-bold text-primary">
                          {convertAndFormat(calculatorResults.reduce((sum, r) => sum + r.total, 0))}
                        </p>
                        <p className="text-sm text-green-600">
                          Total Savings: {convertAndFormat(calculatorResults.reduce((sum, r) => sum + r.savings, 0))}
                        </p>
                      </div>
                    </div>
                  </Card>
                </div>
              )}
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCalculatorDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Export Pricing Sheet Dialog */}
      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Export Pricing Sheet</DialogTitle>
            <DialogDescription>
              Generate a pricing sheet for your customers
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="p-4 rounded-lg border bg-muted/50">
              <h4 className="font-semibold mb-2">Export Summary</h4>
              <div className="space-y-1 text-sm">
                <p>Products: {productRules.length}</p>
                <p>Tiered Rules: {tieredRules.length}</p>
                <p>Active Promotions: {activePromotions}</p>
              </div>
            </div>

            <p className="text-sm text-muted-foreground">
              This will generate a CSV file with all your product pricing and tier information.
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowExportDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleExportSheet}>
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
