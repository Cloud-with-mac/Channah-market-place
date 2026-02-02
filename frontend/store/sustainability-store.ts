import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Sustainability Certifications
export type CertificationType =
  | 'ISO_14001'
  | 'B_CORP'
  | 'FAIR_TRADE'
  | 'ORGANIC'
  | 'FSC'
  | 'RAINFOREST_ALLIANCE'
  | 'CARBON_NEUTRAL'
  | 'ENERGY_STAR'
  | 'CRADLE_TO_CRADLE'
  | 'LEED'

export interface Certification {
  id: string
  type: CertificationType
  name: string
  description: string
  issuer: string
  issuedDate: string
  expiryDate?: string
  certificateUrl?: string
  verified: boolean
}

export interface SustainabilityMetrics {
  carbonFootprint: number // kg CO2e
  waterUsage: number // liters
  energyConsumption: number // kWh
  wasteGenerated: number // kg
  recycledMaterials: number // percentage
  renewableEnergy: number // percentage
}

export interface EcoProduct {
  id: string
  productId: string
  name: string
  slug: string
  image: string
  price: number
  vendorName: string
  vendorId: string
  sustainabilityScore: number // 0-100
  certifications: CertificationType[]
  metrics: SustainabilityMetrics
  ecoFeatures: string[]
  carbonOffset: number // kg CO2e offset
  recyclable: boolean
  biodegradable: boolean
  locallySourced: boolean
  fairTrade: boolean
  createdAt: string
}

export interface GreenSupplier {
  id: string
  vendorId: string
  name: string
  logo?: string
  description: string
  location: string
  sustainabilityScore: number // 0-100
  certifications: CertificationType[]
  metrics: SustainabilityMetrics
  productsCount: number
  carbonNeutralGoal?: string
  initiatives: string[]
  verified: boolean
  joinedAt: string
}

export interface CarbonCalculation {
  id: string
  type: 'product' | 'shipping' | 'order'
  itemId: string
  carbonEmissions: number // kg CO2e
  factors: {
    production?: number
    packaging?: number
    shipping?: number
    distance?: number
  }
  calculatedAt: string
}

export interface OffsetProgram {
  id: string
  name: string
  description: string
  provider: string
  type: 'reforestation' | 'renewable_energy' | 'ocean_cleanup' | 'carbon_capture'
  costPerTon: number // USD per ton CO2e
  location: string
  impact: string
  certifications: string[]
  active: boolean
  projectUrl?: string
  image?: string
}

export interface OffsetPurchase {
  id: string
  programId: string
  programName: string
  amount: number // tons CO2e
  cost: number // USD
  orderId?: string
  status: 'pending' | 'completed' | 'verified'
  purchasedAt: string
  certificateUrl?: string
}

export interface EnvironmentalReport {
  id: string
  period: string // e.g., "2024-Q1"
  startDate: string
  endDate: string
  metrics: {
    totalCarbonEmissions: number
    carbonOffset: number
    netEmissions: number
    waterSaved: number
    energyFromRenewables: number
    wasteRecycled: number
    productsWithCertifications: number
  }
  topEcoProducts: EcoProduct[]
  topGreenSuppliers: GreenSupplier[]
  improvements: string[]
  goals: { description: string; target: number; current: number; unit: string }[]
  generatedAt: string
}

interface SustainabilityState {
  // Eco Products
  ecoProducts: EcoProduct[]
  addEcoProduct: (product: Omit<EcoProduct, 'id' | 'createdAt'>) => string
  updateEcoProduct: (id: string, updates: Partial<EcoProduct>) => void
  removeEcoProduct: (id: string) => void
  getEcoProduct: (id: string) => EcoProduct | undefined
  getEcoProductsByScore: (minScore: number) => EcoProduct[]
  getEcoProductsByCertification: (certification: CertificationType) => EcoProduct[]

  // Green Suppliers
  greenSuppliers: GreenSupplier[]
  addGreenSupplier: (supplier: Omit<GreenSupplier, 'id' | 'joinedAt'>) => string
  updateGreenSupplier: (id: string, updates: Partial<GreenSupplier>) => void
  removeGreenSupplier: (id: string) => void
  getGreenSupplier: (id: string) => GreenSupplier | undefined
  getTopGreenSuppliers: (limit: number) => GreenSupplier[]

  // Carbon Calculations
  carbonCalculations: CarbonCalculation[]
  calculateProductCarbon: (productId: string, quantity: number, shippingDistance?: number) => number
  calculateShippingCarbon: (distance: number, weight: number) => number
  calculateOrderCarbon: (orderId: string, items: any[]) => number
  addCarbonCalculation: (calculation: Omit<CarbonCalculation, 'id' | 'calculatedAt'>) => void

  // Offset Programs
  offsetPrograms: OffsetProgram[]
  addOffsetProgram: (program: Omit<OffsetProgram, 'id'>) => string
  updateOffsetProgram: (id: string, updates: Partial<OffsetProgram>) => void
  getActiveOffsetPrograms: () => OffsetProgram[]

  // Offset Purchases
  offsetPurchases: OffsetPurchase[]
  purchaseOffset: (programId: string, amount: number, orderId?: string) => string
  getOffsetPurchases: (orderId?: string) => OffsetPurchase[]
  getTotalOffsetPurchased: () => number

  // Environmental Reports
  reports: EnvironmentalReport[]
  generateReport: (startDate: string, endDate: string) => string
  getLatestReport: () => EnvironmentalReport | undefined

  // User Sustainability Stats
  userStats: {
    totalCarbonOffset: number
    productsFromGreenSuppliers: number
    sustainabilityScore: number
    lastUpdated: string
  }
  updateUserStats: () => void
}

// Carbon emission factors (kg CO2e)
const EMISSION_FACTORS = {
  // Production emissions by category (per kg)
  electronics: 50,
  fashion: 15,
  furniture: 10,
  beauty: 5,
  food: 3,
  default: 8,

  // Packaging (per item)
  packaging: 0.5,

  // Shipping (per km per kg)
  truck: 0.209,
  air: 0.500,
  sea: 0.016,
  rail: 0.041,

  // Default shipping
  defaultShipping: 0.209, // truck
}

export const useSustainabilityStore = create<SustainabilityState>()(
  persist(
    (set, get) => ({
      // Eco Products
      ecoProducts: [],

      addEcoProduct: (productData) => {
        const newProduct: EcoProduct = {
          ...productData,
          id: `eco-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          createdAt: new Date().toISOString(),
        }

        set((state) => ({
          ecoProducts: [...state.ecoProducts, newProduct],
        }))

        return newProduct.id
      },

      updateEcoProduct: (id, updates) => {
        set((state) => ({
          ecoProducts: state.ecoProducts.map((product) =>
            product.id === id ? { ...product, ...updates } : product
          ),
        }))
      },

      removeEcoProduct: (id) => {
        set((state) => ({
          ecoProducts: state.ecoProducts.filter((product) => product.id !== id),
        }))
      },

      getEcoProduct: (id) => {
        return get().ecoProducts.find((product) => product.id === id)
      },

      getEcoProductsByScore: (minScore) => {
        return get().ecoProducts
          .filter((product) => product.sustainabilityScore >= minScore)
          .sort((a, b) => b.sustainabilityScore - a.sustainabilityScore)
      },

      getEcoProductsByCertification: (certification) => {
        return get().ecoProducts.filter((product) =>
          product.certifications.includes(certification)
        )
      },

      // Green Suppliers
      greenSuppliers: [],

      addGreenSupplier: (supplierData) => {
        const newSupplier: GreenSupplier = {
          ...supplierData,
          id: `supplier-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          joinedAt: new Date().toISOString(),
        }

        set((state) => ({
          greenSuppliers: [...state.greenSuppliers, newSupplier],
        }))

        return newSupplier.id
      },

      updateGreenSupplier: (id, updates) => {
        set((state) => ({
          greenSuppliers: state.greenSuppliers.map((supplier) =>
            supplier.id === id ? { ...supplier, ...updates } : supplier
          ),
        }))
      },

      removeGreenSupplier: (id) => {
        set((state) => ({
          greenSuppliers: state.greenSuppliers.filter((supplier) => supplier.id !== id),
        }))
      },

      getGreenSupplier: (id) => {
        return get().greenSuppliers.find((supplier) => supplier.id === id)
      },

      getTopGreenSuppliers: (limit) => {
        return get().greenSuppliers
          .sort((a, b) => b.sustainabilityScore - a.sustainabilityScore)
          .slice(0, limit)
      },

      // Carbon Calculations
      carbonCalculations: [],

      calculateProductCarbon: (productId, quantity, shippingDistance = 0) => {
        // Simplified calculation - in production, fetch real product data
        const baseEmissions = EMISSION_FACTORS.default * quantity
        const packagingEmissions = EMISSION_FACTORS.packaging * quantity
        const shippingEmissions = shippingDistance > 0
          ? (shippingDistance * quantity * EMISSION_FACTORS.defaultShipping) / 1000
          : 0

        const totalEmissions = baseEmissions + packagingEmissions + shippingEmissions

        get().addCarbonCalculation({
          type: 'product',
          itemId: productId,
          carbonEmissions: totalEmissions,
          factors: {
            production: baseEmissions,
            packaging: packagingEmissions,
            shipping: shippingEmissions,
            distance: shippingDistance,
          },
        })

        return totalEmissions
      },

      calculateShippingCarbon: (distance, weight) => {
        // Distance in km, weight in kg
        // Using truck as default shipping method
        return (distance * weight * EMISSION_FACTORS.defaultShipping) / 1000
      },

      calculateOrderCarbon: (orderId, items) => {
        let totalEmissions = 0

        items.forEach((item) => {
          const emissions = get().calculateProductCarbon(
            item.productId,
            item.quantity,
            item.shippingDistance || 0
          )
          totalEmissions += emissions
        })

        get().addCarbonCalculation({
          type: 'order',
          itemId: orderId,
          carbonEmissions: totalEmissions,
          factors: {},
        })

        return totalEmissions
      },

      addCarbonCalculation: (calculation) => {
        const newCalculation: CarbonCalculation = {
          ...calculation,
          id: `calc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          calculatedAt: new Date().toISOString(),
        }

        set((state) => ({
          carbonCalculations: [...state.carbonCalculations, newCalculation],
        }))
      },

      // Offset Programs
      offsetPrograms: [
        {
          id: 'prog-1',
          name: 'African Reforestation Initiative',
          description: 'Plant native trees across sub-Saharan Africa to combat desertification and create carbon sinks.',
          provider: 'Green Africa Foundation',
          type: 'reforestation',
          costPerTon: 15,
          location: 'Kenya, Tanzania, Uganda',
          impact: 'Each ton offsets 1000kg CO2e and supports local communities',
          certifications: ['Gold Standard', 'Verified Carbon Standard'],
          active: true,
          projectUrl: 'https://greenafricafoundation.org',
          image: '/sustainability/reforestation.jpg',
        },
        {
          id: 'prog-2',
          name: 'Solar Power for Villages',
          description: 'Install solar panels in rural African communities, replacing diesel generators.',
          provider: 'SolarAid Africa',
          type: 'renewable_energy',
          costPerTon: 20,
          location: 'Nigeria, Ghana, Senegal',
          impact: 'Provides clean energy to 1000+ households per project',
          certifications: ['Clean Development Mechanism', 'Gold Standard'],
          active: true,
          projectUrl: 'https://solaraidafrica.org',
          image: '/sustainability/solar.jpg',
        },
        {
          id: 'prog-3',
          name: 'Coastal Ocean Cleanup',
          description: 'Remove plastic waste from African coastlines and prevent ocean pollution.',
          provider: 'Ocean Conservancy Africa',
          type: 'ocean_cleanup',
          costPerTon: 25,
          location: 'West African Coast',
          impact: 'Removes 50 tons of plastic waste per ton of CO2 offset',
          certifications: ['Blue Carbon Initiative'],
          active: true,
          projectUrl: 'https://oceanconservancy.org',
          image: '/sustainability/ocean.jpg',
        },
        {
          id: 'prog-4',
          name: 'Direct Air Capture Technology',
          description: 'Support cutting-edge carbon capture and storage facilities.',
          provider: 'Carbon Engineering',
          type: 'carbon_capture',
          costPerTon: 35,
          location: 'Global',
          impact: 'Permanently removes CO2 from the atmosphere',
          certifications: ['ISO 14064', 'Puro.earth'],
          active: true,
          projectUrl: 'https://carbonengineering.com',
          image: '/sustainability/capture.jpg',
        },
      ],

      addOffsetProgram: (program) => {
        const newProgram: OffsetProgram = {
          ...program,
          id: `prog-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        }

        set((state) => ({
          offsetPrograms: [...state.offsetPrograms, newProgram],
        }))

        return newProgram.id
      },

      updateOffsetProgram: (id, updates) => {
        set((state) => ({
          offsetPrograms: state.offsetPrograms.map((program) =>
            program.id === id ? { ...program, ...updates } : program
          ),
        }))
      },

      getActiveOffsetPrograms: () => {
        return get().offsetPrograms.filter((program) => program.active)
      },

      // Offset Purchases
      offsetPurchases: [],

      purchaseOffset: (programId, amount, orderId) => {
        const program = get().offsetPrograms.find((p) => p.id === programId)
        if (!program) throw new Error('Program not found')

        const cost = amount * program.costPerTon

        const newPurchase: OffsetPurchase = {
          id: `offset-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          programId,
          programName: program.name,
          amount,
          cost,
          orderId,
          status: 'pending',
          purchasedAt: new Date().toISOString(),
        }

        set((state) => ({
          offsetPurchases: [...state.offsetPurchases, newPurchase],
        }))

        // Update user stats
        get().updateUserStats()

        return newPurchase.id
      },

      getOffsetPurchases: (orderId) => {
        const purchases = get().offsetPurchases
        return orderId
          ? purchases.filter((p) => p.orderId === orderId)
          : purchases
      },

      getTotalOffsetPurchased: () => {
        return get().offsetPurchases
          .filter((p) => p.status === 'completed' || p.status === 'verified')
          .reduce((sum, p) => sum + p.amount, 0)
      },

      // Environmental Reports
      reports: [],

      generateReport: (startDate, endDate) => {
        const ecoProducts = get().ecoProducts
        const greenSuppliers = get().greenSuppliers
        const carbonCalcs = get().carbonCalculations
        const offsetPurchases = get().offsetPurchases

        // Filter data by date range
        const filteredCalcs = carbonCalcs.filter(
          (calc) => calc.calculatedAt >= startDate && calc.calculatedAt <= endDate
        )

        const filteredOffsets = offsetPurchases.filter(
          (offset) => offset.purchasedAt >= startDate && offset.purchasedAt <= endDate
        )

        const totalEmissions = filteredCalcs.reduce(
          (sum, calc) => sum + calc.carbonEmissions, 0
        )

        const totalOffset = filteredOffsets.reduce(
          (sum, offset) => sum + offset.amount * 1000, 0
        ) // Convert tons to kg

        const newReport: EnvironmentalReport = {
          id: `report-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          period: `${startDate} to ${endDate}`,
          startDate,
          endDate,
          metrics: {
            totalCarbonEmissions: totalEmissions,
            carbonOffset: totalOffset,
            netEmissions: Math.max(0, totalEmissions - totalOffset),
            waterSaved: ecoProducts.reduce((sum, p) => sum + (p.metrics.waterUsage || 0), 0),
            energyFromRenewables: greenSuppliers.length > 0
              ? greenSuppliers.reduce((sum, s) => sum + s.metrics.renewableEnergy, 0) / greenSuppliers.length
              : 0,
            wasteRecycled: ecoProducts.reduce((sum, p) => sum + (p.metrics.recycledMaterials || 0), 0) / Math.max(1, ecoProducts.length),
            productsWithCertifications: ecoProducts.filter(p => p.certifications.length > 0).length,
          },
          topEcoProducts: ecoProducts
            .sort((a, b) => b.sustainabilityScore - a.sustainabilityScore)
            .slice(0, 5),
          topGreenSuppliers: get().getTopGreenSuppliers(5),
          improvements: [
            totalOffset > totalEmissions ? 'Carbon Negative Achieved!' : 'Continue carbon offsetting',
            'Increase eco-product inventory by 25%',
            'Partner with 5 more green suppliers',
          ],
          goals: [
            { description: 'Carbon Neutrality', target: 100, current: (totalOffset / Math.max(1, totalEmissions)) * 100, unit: '%' },
            { description: 'Green Suppliers', target: 50, current: greenSuppliers.length, unit: 'suppliers' },
            { description: 'Eco Products', target: 1000, current: ecoProducts.length, unit: 'products' },
          ],
          generatedAt: new Date().toISOString(),
        }

        set((state) => ({
          reports: [...state.reports, newReport],
        }))

        return newReport.id
      },

      getLatestReport: () => {
        const reports = get().reports
        return reports.length > 0
          ? reports.sort((a, b) =>
              new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime()
            )[0]
          : undefined
      },

      // User Stats
      userStats: {
        totalCarbonOffset: 0,
        productsFromGreenSuppliers: 0,
        sustainabilityScore: 0,
        lastUpdated: new Date().toISOString(),
      },

      updateUserStats: () => {
        const totalOffset = get().getTotalOffsetPurchased()
        const greenSuppliers = get().greenSuppliers.length
        const ecoProducts = get().ecoProducts.length

        // Calculate sustainability score (0-100)
        const score = Math.min(100,
          (totalOffset * 2) +
          (greenSuppliers * 5) +
          (ecoProducts * 0.5)
        )

        set({
          userStats: {
            totalCarbonOffset: totalOffset,
            productsFromGreenSuppliers: ecoProducts,
            sustainabilityScore: Math.round(score),
            lastUpdated: new Date().toISOString(),
          },
        })
      },
    }),
    {
      name: 'channah-sustainability',
      partialize: (state) => ({
        ecoProducts: state.ecoProducts,
        greenSuppliers: state.greenSuppliers,
        carbonCalculations: state.carbonCalculations,
        offsetPurchases: state.offsetPurchases,
        reports: state.reports,
        userStats: state.userStats,
      }),
    }
  )
)

// Certification details
export const certificationDetails: Record<CertificationType, {
  name: string
  description: string
  icon: string
  color: string
}> = {
  ISO_14001: {
    name: 'ISO 14001',
    description: 'International standard for environmental management systems',
    icon: '🌍',
    color: 'bg-blue-500',
  },
  B_CORP: {
    name: 'B Corporation',
    description: 'Certified commitment to social and environmental performance',
    icon: '🏢',
    color: 'bg-purple-500',
  },
  FAIR_TRADE: {
    name: 'Fair Trade',
    description: 'Ensures fair wages and ethical treatment of workers',
    icon: '🤝',
    color: 'bg-orange-500',
  },
  ORGANIC: {
    name: 'Organic Certified',
    description: 'Products grown without synthetic pesticides or fertilizers',
    icon: '🌿',
    color: 'bg-green-500',
  },
  FSC: {
    name: 'FSC Certified',
    description: 'Forest Stewardship Council - responsible forest management',
    icon: '🌲',
    color: 'bg-emerald-600',
  },
  RAINFOREST_ALLIANCE: {
    name: 'Rainforest Alliance',
    description: 'Protects forests, improves livelihoods, and promotes human rights',
    icon: '🌴',
    color: 'bg-teal-500',
  },
  CARBON_NEUTRAL: {
    name: 'Carbon Neutral',
    description: 'Net-zero carbon emissions through reduction and offsetting',
    icon: '⚖️',
    color: 'bg-slate-600',
  },
  ENERGY_STAR: {
    name: 'Energy Star',
    description: 'Energy-efficient products that save money and protect the environment',
    icon: '⭐',
    color: 'bg-yellow-500',
  },
  CRADLE_TO_CRADLE: {
    name: 'Cradle to Cradle',
    description: 'Products designed for circular economy and continuous reuse',
    icon: '♻️',
    color: 'bg-cyan-500',
  },
  LEED: {
    name: 'LEED Certified',
    description: 'Leadership in Energy and Environmental Design for buildings',
    icon: '🏗️',
    color: 'bg-indigo-500',
  },
}
