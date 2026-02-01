import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Pricing Rule Types
export type PricingRuleType =
  | 'tiered'
  | 'volume'
  | 'promotional'
  | 'customer_group'
  | 'product_specific'

export type DiscountType = 'percentage' | 'fixed' | 'fixed_price'

export type CustomerGroup =
  | 'retail'
  | 'wholesale'
  | 'vip'
  | 'distributor'
  | 'reseller'
  | 'corporate'

// Tiered Pricing (Quantity Breaks)
export interface TieredPricingRule {
  id: string
  name: string
  productIds: string[]
  productNames?: string[]
  tiers: {
    minQuantity: number
    maxQuantity?: number
    discountType: DiscountType
    discountValue: number
    finalPrice?: number
  }[]
  active: boolean
  startDate?: string
  endDate?: string
  priority: number
  createdAt: string
  updatedAt: string
}

// Volume Discount
export interface VolumeDiscountRule {
  id: string
  name: string
  productIds: string[]
  productNames?: string[]
  volumeBreaks: {
    minQuantity: number
    discountPercentage: number
  }[]
  stackable: boolean
  active: boolean
  startDate?: string
  endDate?: string
  priority: number
  createdAt: string
  updatedAt: string
}

// Promotional Pricing
export interface PromotionalPricing {
  id: string
  name: string
  description?: string
  productIds: string[]
  productNames?: string[]
  discountType: DiscountType
  discountValue: number
  startDate: string
  endDate: string
  limitPerCustomer?: number
  totalLimit?: number
  currentUsage: number
  active: boolean
  priority: number
  createdAt: string
  updatedAt: string
}

// Customer Group Pricing
export interface CustomerGroupPricing {
  id: string
  name: string
  customerGroup: CustomerGroup
  productIds: string[]
  productNames?: string[]
  discountType: DiscountType
  discountValue: number
  minOrderQuantity?: number
  maxOrderQuantity?: number
  active: boolean
  startDate?: string
  endDate?: string
  priority: number
  createdAt: string
  updatedAt: string
}

// Product-Specific Pricing Rule
export interface ProductSpecificPricing {
  id: string
  name: string
  productId: string
  productName?: string
  basePrice: number
  specialPrice?: number
  costPrice?: number
  msrp?: number
  marginPercentage?: number
  rules: {
    type: 'bulk' | 'seasonal' | 'clearance' | 'loyalty'
    condition: string
    discountType: DiscountType
    discountValue: number
  }[]
  active: boolean
  createdAt: string
  updatedAt: string
}

// Pricing Calculator Result
export interface PriceCalculation {
  productId: string
  productName: string
  quantity: number
  basePrice: number
  unitPrice: number
  subtotal: number
  discount: number
  total: number
  appliedRules: {
    ruleId: string
    ruleName: string
    ruleType: PricingRuleType
    discountAmount: number
  }[]
  savings: number
  savingsPercentage: number
}

// Pricing Sheet Export
export interface PricingSheet {
  id: string
  name: string
  description?: string
  products: {
    productId: string
    productName: string
    sku?: string
    basePrice: number
    tiers?: {
      quantity: number
      unitPrice: number
      discount: string
    }[]
  }[]
  customerGroup?: CustomerGroup
  validFrom?: string
  validTo?: string
  createdAt: string
}

interface PricingState {
  // Pricing Rules
  tieredRules: TieredPricingRule[]
  volumeRules: VolumeDiscountRule[]
  promotionalRules: PromotionalPricing[]
  customerGroupRules: CustomerGroupPricing[]
  productRules: ProductSpecificPricing[]

  // Pricing Sheets
  pricingSheets: PricingSheet[]

  // UI State
  isLoading: boolean
  selectedRule: string | null
  calculatorResults: PriceCalculation[]

  // Tiered Pricing Actions
  addTieredRule: (rule: Omit<TieredPricingRule, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateTieredRule: (id: string, rule: Partial<TieredPricingRule>) => void
  deleteTieredRule: (id: string) => void
  toggleTieredRule: (id: string) => void

  // Volume Discount Actions
  addVolumeRule: (rule: Omit<VolumeDiscountRule, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateVolumeRule: (id: string, rule: Partial<VolumeDiscountRule>) => void
  deleteVolumeRule: (id: string) => void
  toggleVolumeRule: (id: string) => void

  // Promotional Pricing Actions
  addPromotionalRule: (rule: Omit<PromotionalPricing, 'id' | 'createdAt' | 'updatedAt' | 'currentUsage'>) => void
  updatePromotionalRule: (id: string, rule: Partial<PromotionalPricing>) => void
  deletePromotionalRule: (id: string) => void
  togglePromotionalRule: (id: string) => void

  // Customer Group Pricing Actions
  addCustomerGroupRule: (rule: Omit<CustomerGroupPricing, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateCustomerGroupRule: (id: string, rule: Partial<CustomerGroupPricing>) => void
  deleteCustomerGroupRule: (id: string) => void
  toggleCustomerGroupRule: (id: string) => void

  // Product-Specific Pricing Actions
  addProductRule: (rule: Omit<ProductSpecificPricing, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateProductRule: (id: string, rule: Partial<ProductSpecificPricing>) => void
  deleteProductRule: (id: string) => void
  toggleProductRule: (id: string) => void

  // Pricing Calculator
  calculatePrice: (productId: string, quantity: number, customerGroup?: CustomerGroup) => PriceCalculation | null
  calculateBulkPrices: (items: { productId: string; quantity: number }[], customerGroup?: CustomerGroup) => PriceCalculation[]

  // Pricing Sheets
  createPricingSheet: (sheet: Omit<PricingSheet, 'id' | 'createdAt'>) => void
  updatePricingSheet: (id: string, sheet: Partial<PricingSheet>) => void
  deletePricingSheet: (id: string) => void
  exportPricingSheet: (id: string, format: 'csv' | 'xlsx' | 'pdf') => void

  // Utility
  setSelectedRule: (id: string | null) => void
  setLoading: (loading: boolean) => void
  clearCalculatorResults: () => void
  getActiveRulesForProduct: (productId: string) => any[]
  duplicateRule: (ruleType: PricingRuleType, ruleId: string) => void
}

// Helper functions
const generateId = () => `pr-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

const isRuleActive = (rule: any): boolean => {
  if (!rule.active) return false

  const now = new Date()
  if (rule.startDate && new Date(rule.startDate) > now) return false
  if (rule.endDate && new Date(rule.endDate) < now) return false

  return true
}

export const usePricingStore = create<PricingState>()(
  persist(
    (set, get) => ({
      // Initial State
      tieredRules: [],
      volumeRules: [],
      promotionalRules: [],
      customerGroupRules: [],
      productRules: [],
      pricingSheets: [],
      isLoading: false,
      selectedRule: null,
      calculatorResults: [],

      // Tiered Pricing Actions
      addTieredRule: (rule) => {
        const newRule: TieredPricingRule = {
          ...rule,
          id: generateId(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        set((state) => ({ tieredRules: [...state.tieredRules, newRule] }))
      },

      updateTieredRule: (id, updates) => {
        set((state) => ({
          tieredRules: state.tieredRules.map((rule) =>
            rule.id === id ? { ...rule, ...updates, updatedAt: new Date().toISOString() } : rule
          ),
        }))
      },

      deleteTieredRule: (id) => {
        set((state) => ({
          tieredRules: state.tieredRules.filter((rule) => rule.id !== id),
        }))
      },

      toggleTieredRule: (id) => {
        set((state) => ({
          tieredRules: state.tieredRules.map((rule) =>
            rule.id === id ? { ...rule, active: !rule.active, updatedAt: new Date().toISOString() } : rule
          ),
        }))
      },

      // Volume Discount Actions
      addVolumeRule: (rule) => {
        const newRule: VolumeDiscountRule = {
          ...rule,
          id: generateId(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        set((state) => ({ volumeRules: [...state.volumeRules, newRule] }))
      },

      updateVolumeRule: (id, updates) => {
        set((state) => ({
          volumeRules: state.volumeRules.map((rule) =>
            rule.id === id ? { ...rule, ...updates, updatedAt: new Date().toISOString() } : rule
          ),
        }))
      },

      deleteVolumeRule: (id) => {
        set((state) => ({
          volumeRules: state.volumeRules.filter((rule) => rule.id !== id),
        }))
      },

      toggleVolumeRule: (id) => {
        set((state) => ({
          volumeRules: state.volumeRules.map((rule) =>
            rule.id === id ? { ...rule, active: !rule.active, updatedAt: new Date().toISOString() } : rule
          ),
        }))
      },

      // Promotional Pricing Actions
      addPromotionalRule: (rule) => {
        const newRule: PromotionalPricing = {
          ...rule,
          id: generateId(),
          currentUsage: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        set((state) => ({ promotionalRules: [...state.promotionalRules, newRule] }))
      },

      updatePromotionalRule: (id, updates) => {
        set((state) => ({
          promotionalRules: state.promotionalRules.map((rule) =>
            rule.id === id ? { ...rule, ...updates, updatedAt: new Date().toISOString() } : rule
          ),
        }))
      },

      deletePromotionalRule: (id) => {
        set((state) => ({
          promotionalRules: state.promotionalRules.filter((rule) => rule.id !== id),
        }))
      },

      togglePromotionalRule: (id) => {
        set((state) => ({
          promotionalRules: state.promotionalRules.map((rule) =>
            rule.id === id ? { ...rule, active: !rule.active, updatedAt: new Date().toISOString() } : rule
          ),
        }))
      },

      // Customer Group Pricing Actions
      addCustomerGroupRule: (rule) => {
        const newRule: CustomerGroupPricing = {
          ...rule,
          id: generateId(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        set((state) => ({ customerGroupRules: [...state.customerGroupRules, newRule] }))
      },

      updateCustomerGroupRule: (id, updates) => {
        set((state) => ({
          customerGroupRules: state.customerGroupRules.map((rule) =>
            rule.id === id ? { ...rule, ...updates, updatedAt: new Date().toISOString() } : rule
          ),
        }))
      },

      deleteCustomerGroupRule: (id) => {
        set((state) => ({
          customerGroupRules: state.customerGroupRules.filter((rule) => rule.id !== id),
        }))
      },

      toggleCustomerGroupRule: (id) => {
        set((state) => ({
          customerGroupRules: state.customerGroupRules.map((rule) =>
            rule.id === id ? { ...rule, active: !rule.active, updatedAt: new Date().toISOString() } : rule
          ),
        }))
      },

      // Product-Specific Pricing Actions
      addProductRule: (rule) => {
        const newRule: ProductSpecificPricing = {
          ...rule,
          id: generateId(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        set((state) => ({ productRules: [...state.productRules, newRule] }))
      },

      updateProductRule: (id, updates) => {
        set((state) => ({
          productRules: state.productRules.map((rule) =>
            rule.id === id ? { ...rule, ...updates, updatedAt: new Date().toISOString() } : rule
          ),
        }))
      },

      deleteProductRule: (id) => {
        set((state) => ({
          productRules: state.productRules.filter((rule) => rule.id !== id),
        }))
      },

      toggleProductRule: (id) => {
        set((state) => ({
          productRules: state.productRules.map((rule) =>
            rule.id === id ? { ...rule, active: !rule.active, updatedAt: new Date().toISOString() } : rule
          ),
        }))
      },

      // Pricing Calculator
      calculatePrice: (productId, quantity, customerGroup) => {
        const state = get()
        const appliedRules: any[] = []
        let basePrice = 100 // Default base price, should come from product
        let unitPrice = basePrice
        let totalDiscount = 0

        // Get product-specific pricing
        const productRule = state.productRules.find(
          (r) => r.productId === productId && isRuleActive(r)
        )
        if (productRule) {
          basePrice = productRule.basePrice
          unitPrice = productRule.specialPrice || basePrice
        }

        // Apply tiered pricing
        const tieredRule = state.tieredRules.find(
          (r) => r.productIds.includes(productId) && isRuleActive(r)
        )
        if (tieredRule) {
          const tier = tieredRule.tiers.find(
            (t) => quantity >= t.minQuantity && (!t.maxQuantity || quantity <= t.maxQuantity)
          )
          if (tier) {
            let discount = 0
            if (tier.discountType === 'percentage') {
              discount = (basePrice * tier.discountValue) / 100
              unitPrice = basePrice - discount
            } else if (tier.discountType === 'fixed') {
              discount = tier.discountValue
              unitPrice = basePrice - discount
            } else if (tier.discountType === 'fixed_price') {
              unitPrice = tier.discountValue
              discount = basePrice - tier.discountValue
            }

            totalDiscount += discount * quantity
            appliedRules.push({
              ruleId: tieredRule.id,
              ruleName: tieredRule.name,
              ruleType: 'tiered' as PricingRuleType,
              discountAmount: discount * quantity,
            })
          }
        }

        // Apply volume discount
        const volumeRule = state.volumeRules.find(
          (r) => r.productIds.includes(productId) && isRuleActive(r)
        )
        if (volumeRule) {
          const volumeBreak = [...volumeRule.volumeBreaks]
            .sort((a, b) => b.minQuantity - a.minQuantity)
            .find((vb) => quantity >= vb.minQuantity)

          if (volumeBreak) {
            const discount = (unitPrice * volumeBreak.discountPercentage) / 100
            if (volumeRule.stackable) {
              unitPrice -= discount
              totalDiscount += discount * quantity
            } else {
              const volumeDiscount = discount * quantity
              if (volumeDiscount > totalDiscount) {
                totalDiscount = volumeDiscount
                unitPrice = basePrice - discount
              }
            }

            appliedRules.push({
              ruleId: volumeRule.id,
              ruleName: volumeRule.name,
              ruleType: 'volume' as PricingRuleType,
              discountAmount: discount * quantity,
            })
          }
        }

        // Apply customer group pricing
        if (customerGroup) {
          const groupRule = state.customerGroupRules.find(
            (r) =>
              r.customerGroup === customerGroup &&
              r.productIds.includes(productId) &&
              isRuleActive(r) &&
              (!r.minOrderQuantity || quantity >= r.minOrderQuantity) &&
              (!r.maxOrderQuantity || quantity <= r.maxOrderQuantity)
          )

          if (groupRule) {
            let discount = 0
            if (groupRule.discountType === 'percentage') {
              discount = (unitPrice * groupRule.discountValue) / 100
            } else if (groupRule.discountType === 'fixed') {
              discount = groupRule.discountValue
            }

            unitPrice -= discount
            totalDiscount += discount * quantity

            appliedRules.push({
              ruleId: groupRule.id,
              ruleName: groupRule.name,
              ruleType: 'customer_group' as PricingRuleType,
              discountAmount: discount * quantity,
            })
          }
        }

        // Apply promotional pricing
        const promoRule = state.promotionalRules.find(
          (r) => r.productIds.includes(productId) && isRuleActive(r)
        )
        if (promoRule && (!promoRule.totalLimit || promoRule.currentUsage < promoRule.totalLimit)) {
          let discount = 0
          if (promoRule.discountType === 'percentage') {
            discount = (unitPrice * promoRule.discountValue) / 100
          } else if (promoRule.discountType === 'fixed') {
            discount = promoRule.discountValue
          }

          unitPrice -= discount
          totalDiscount += discount * quantity

          appliedRules.push({
            ruleId: promoRule.id,
            ruleName: promoRule.name,
            ruleType: 'promotional' as PricingRuleType,
            discountAmount: discount * quantity,
          })
        }

        const subtotal = basePrice * quantity
        const total = unitPrice * quantity
        const savings = subtotal - total
        const savingsPercentage = subtotal > 0 ? (savings / subtotal) * 100 : 0

        return {
          productId,
          productName: productRule?.productName || `Product ${productId}`,
          quantity,
          basePrice,
          unitPrice,
          subtotal,
          discount: totalDiscount,
          total,
          appliedRules,
          savings,
          savingsPercentage,
        }
      },

      calculateBulkPrices: (items, customerGroup) => {
        const results = items.map((item) =>
          get().calculatePrice(item.productId, item.quantity, customerGroup)
        ).filter((r): r is PriceCalculation => r !== null)

        set({ calculatorResults: results })
        return results
      },

      // Pricing Sheets
      createPricingSheet: (sheet) => {
        const newSheet: PricingSheet = {
          ...sheet,
          id: generateId(),
          createdAt: new Date().toISOString(),
        }
        set((state) => ({ pricingSheets: [...state.pricingSheets, newSheet] }))
      },

      updatePricingSheet: (id, updates) => {
        set((state) => ({
          pricingSheets: state.pricingSheets.map((sheet) =>
            sheet.id === id ? { ...sheet, ...updates } : sheet
          ),
        }))
      },

      deletePricingSheet: (id) => {
        set((state) => ({
          pricingSheets: state.pricingSheets.filter((sheet) => sheet.id !== id),
        }))
      },

      exportPricingSheet: (id, format) => {
        const sheet = get().pricingSheets.find((s) => s.id === id)
        if (!sheet) return

        // Create CSV content
        let content = 'Product Name,SKU,Base Price'
        const maxTiers = Math.max(...sheet.products.map((p) => p.tiers?.length || 0))

        for (let i = 0; i < maxTiers; i++) {
          content += `,Tier ${i + 1} Qty,Tier ${i + 1} Price,Tier ${i + 1} Discount`
        }
        content += '\n'

        sheet.products.forEach((product) => {
          content += `"${product.productName}","${product.sku || ''}",${product.basePrice}`

          if (product.tiers) {
            product.tiers.forEach((tier) => {
              content += `,${tier.quantity},${tier.unitPrice},"${tier.discount}"`
            })
          }

          content += '\n'
        })

        // Download file
        const blob = new Blob([content], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${sheet.name.replace(/\s+/g, '_')}.${format}`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
      },

      // Utility
      setSelectedRule: (id) => set({ selectedRule: id }),
      setLoading: (loading) => set({ isLoading: loading }),
      clearCalculatorResults: () => set({ calculatorResults: [] }),

      getActiveRulesForProduct: (productId) => {
        const state = get()
        const rules: any[] = []

        state.tieredRules
          .filter((r) => r.productIds.includes(productId) && isRuleActive(r))
          .forEach((r) => rules.push({ ...r, type: 'tiered' }))

        state.volumeRules
          .filter((r) => r.productIds.includes(productId) && isRuleActive(r))
          .forEach((r) => rules.push({ ...r, type: 'volume' }))

        state.promotionalRules
          .filter((r) => r.productIds.includes(productId) && isRuleActive(r))
          .forEach((r) => rules.push({ ...r, type: 'promotional' }))

        state.customerGroupRules
          .filter((r) => r.productIds.includes(productId) && isRuleActive(r))
          .forEach((r) => rules.push({ ...r, type: 'customer_group' }))

        state.productRules
          .filter((r) => r.productId === productId && isRuleActive(r))
          .forEach((r) => rules.push({ ...r, type: 'product_specific' }))

        return rules.sort((a, b) => b.priority - a.priority)
      },

      duplicateRule: (ruleType, ruleId) => {
        const state = get()

        switch (ruleType) {
          case 'tiered': {
            const rule = state.tieredRules.find((r) => r.id === ruleId)
            if (rule) {
              const { id, createdAt, updatedAt, ...rest } = rule
              get().addTieredRule({ ...rest, name: `${rest.name} (Copy)` })
            }
            break
          }
          case 'volume': {
            const rule = state.volumeRules.find((r) => r.id === ruleId)
            if (rule) {
              const { id, createdAt, updatedAt, ...rest } = rule
              get().addVolumeRule({ ...rest, name: `${rest.name} (Copy)` })
            }
            break
          }
          case 'promotional': {
            const rule = state.promotionalRules.find((r) => r.id === ruleId)
            if (rule) {
              const { id, createdAt, updatedAt, currentUsage, ...rest } = rule
              get().addPromotionalRule({ ...rest, name: `${rest.name} (Copy)` })
            }
            break
          }
          case 'customer_group': {
            const rule = state.customerGroupRules.find((r) => r.id === ruleId)
            if (rule) {
              const { id, createdAt, updatedAt, ...rest } = rule
              get().addCustomerGroupRule({ ...rest, name: `${rest.name} (Copy)` })
            }
            break
          }
          case 'product_specific': {
            const rule = state.productRules.find((r) => r.id === ruleId)
            if (rule) {
              const { id, createdAt, updatedAt, ...rest } = rule
              get().addProductRule({ ...rest, name: `${rest.name} (Copy)` })
            }
            break
          }
        }
      },
    }),
    {
      name: 'pricing-storage',
      partialize: (state) => ({
        tieredRules: state.tieredRules,
        volumeRules: state.volumeRules,
        promotionalRules: state.promotionalRules,
        customerGroupRules: state.customerGroupRules,
        productRules: state.productRules,
        pricingSheets: state.pricingSheets,
      }),
    }
  )
)
