import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Types
export interface WarehouseLocation {
  id: string
  name: string
  code: string
  address: string
  city: string
  state: string
  country: string
  postal_code: string
  total_capacity: number // in cubic meters
  used_capacity: number
  available_capacity: number
  zones: string[]
  features: string[]
  climate_controlled: boolean
  security_level: 'basic' | 'standard' | 'high' | 'premium'
  operating_hours: string
  contact_name: string
  contact_phone: string
  contact_email: string
  status: 'active' | 'maintenance' | 'full'
  monthly_rate_per_sqm: number
  currency: string
  image_url?: string
}

export interface InventoryItem {
  id: string
  sku: string
  product_name: string
  product_id: string
  warehouse_id: string
  warehouse_name: string
  bin_location: string
  zone: string
  quantity: number
  reserved_quantity: number
  available_quantity: number
  unit_of_measure: string
  reorder_point: number
  reorder_quantity: number
  last_counted_date: string
  last_movement_date: string
  batch_number?: string
  expiry_date?: string
  condition: 'new' | 'good' | 'fair' | 'damaged'
  value_per_unit: number
  total_value: number
  weight_per_unit: number
  dimensions: {
    length: number
    width: number
    height: number
    unit: 'cm' | 'in'
  }
  image_url?: string
}

export interface StockMovement {
  id: string
  type: 'stock-in' | 'stock-out' | 'transfer' | 'adjustment' | 'return'
  reference_number: string
  warehouse_id: string
  warehouse_name: string
  item_id: string
  sku: string
  product_name: string
  quantity: number
  from_bin?: string
  to_bin?: string
  from_warehouse?: string
  to_warehouse?: string
  reason: string
  performed_by: string
  performed_at: string
  notes?: string
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  documents?: {
    name: string
    url: string
    type: string
  }[]
}

export interface BinLocation {
  id: string
  warehouse_id: string
  code: string
  zone: string
  aisle: string
  rack: string
  shelf: string
  bin: string
  full_code: string // e.g., "A-01-R5-S3-B2"
  capacity: number
  occupied: number
  available: number
  type: 'pallet' | 'shelf' | 'floor' | 'bulk'
  dimensions: {
    length: number
    width: number
    height: number
    unit: 'cm' | 'in'
  }
  weight_limit: number
  items: {
    sku: string
    quantity: number
    product_name: string
  }[]
  status: 'empty' | 'partially_filled' | 'full' | 'reserved'
  accessibility: 'easy' | 'medium' | 'difficult'
  last_updated: string
}

export interface StorageRequest {
  id: string
  request_number: string
  requester_name: string
  requester_email: string
  company_name: string
  warehouse_id: string
  warehouse_name: string
  storage_type: 'short_term' | 'long_term' | 'seasonal'
  space_required: number // in cubic meters
  duration_months: number
  start_date: string
  product_type: string
  special_requirements: string[]
  climate_controlled: boolean
  security_level: 'basic' | 'standard' | 'high' | 'premium'
  estimated_monthly_cost: number
  status: 'pending' | 'reviewing' | 'approved' | 'rejected' | 'active' | 'completed'
  submitted_at: string
  reviewed_at?: string
  reviewed_by?: string
  notes?: string
}

export interface FulfillmentService {
  id: string
  name: string
  description: string
  type: 'pick_and_pack' | 'kitting' | 'labeling' | 'quality_check' | 'returns_processing' | 'custom'
  price_per_unit: number
  minimum_order: number
  turnaround_time: string
  available: boolean
  features: string[]
  icon: string
}

export interface WarehouseFee {
  id: string
  category: 'storage' | 'handling' | 'fulfillment' | 'special_services' | 'utilities'
  name: string
  description: string
  pricing_model: 'per_sqm' | 'per_pallet' | 'per_unit' | 'per_order' | 'flat_rate' | 'percentage'
  base_price: number
  min_charge?: number
  currency: string
  billing_frequency: 'monthly' | 'per_transaction' | 'one_time'
  includes: string[]
  additional_notes?: string
}

export interface CapacityMetrics {
  total_capacity: number
  used_capacity: number
  available_capacity: number
  utilization_percentage: number
  reserved_capacity: number
  by_zone: {
    zone: string
    total: number
    used: number
    available: number
  }[]
  by_warehouse: {
    warehouse_id: string
    warehouse_name: string
    total: number
    used: number
    available: number
  }[]
}

export interface WarehouseAnalytics {
  inventory_value: number
  total_items: number
  low_stock_items: number
  out_of_stock_items: number
  stock_movements_today: number
  stock_movements_this_week: number
  stock_movements_this_month: number
  avg_fulfillment_time: number // in hours
  accuracy_rate: number // percentage
  top_moving_items: {
    sku: string
    product_name: string
    movements: number
  }[]
  warehouse_utilization: {
    warehouse_name: string
    utilization: number
  }[]
}

interface WarehouseState {
  // Data
  warehouses: WarehouseLocation[]
  inventory: InventoryItem[]
  stockMovements: StockMovement[]
  binLocations: BinLocation[]
  storageRequests: StorageRequest[]
  fulfillmentServices: FulfillmentService[]
  warehouseFees: WarehouseFee[]
  capacityMetrics: CapacityMetrics | null
  analytics: WarehouseAnalytics | null

  // UI State
  selectedWarehouse: string | null
  selectedInventoryItem: string | null
  isLoading: boolean
  error: string | null

  // Filters
  inventoryFilters: {
    warehouse_id?: string
    zone?: string
    condition?: string
    low_stock?: boolean
    search?: string
  }
  movementFilters: {
    warehouse_id?: string
    type?: string
    date_from?: string
    date_to?: string
  }

  // Actions - Warehouses
  setWarehouses: (warehouses: WarehouseLocation[]) => void
  addWarehouse: (warehouse: WarehouseLocation) => void
  updateWarehouse: (id: string, updates: Partial<WarehouseLocation>) => void
  setSelectedWarehouse: (id: string | null) => void

  // Actions - Inventory
  setInventory: (items: InventoryItem[]) => void
  addInventoryItem: (item: InventoryItem) => void
  updateInventoryItem: (id: string, updates: Partial<InventoryItem>) => void
  removeInventoryItem: (id: string) => void
  setInventoryFilters: (filters: Partial<WarehouseState['inventoryFilters']>) => void
  getFilteredInventory: () => InventoryItem[]

  // Actions - Stock Movements
  setStockMovements: (movements: StockMovement[]) => void
  addStockMovement: (movement: StockMovement) => void
  updateStockMovement: (id: string, updates: Partial<StockMovement>) => void
  setMovementFilters: (filters: Partial<WarehouseState['movementFilters']>) => void
  getFilteredMovements: () => StockMovement[]

  // Actions - Bin Locations
  setBinLocations: (bins: BinLocation[]) => void
  updateBinLocation: (id: string, updates: Partial<BinLocation>) => void
  getBinsByWarehouse: (warehouseId: string) => BinLocation[]

  // Actions - Storage Requests
  setStorageRequests: (requests: StorageRequest[]) => void
  addStorageRequest: (request: StorageRequest) => void
  updateStorageRequest: (id: string, updates: Partial<StorageRequest>) => void

  // Actions - Fulfillment Services
  setFulfillmentServices: (services: FulfillmentService[]) => void

  // Actions - Warehouse Fees
  setWarehouseFees: (fees: WarehouseFee[]) => void

  // Actions - Analytics
  setCapacityMetrics: (metrics: CapacityMetrics) => void
  setAnalytics: (analytics: WarehouseAnalytics) => void

  // Actions - UI
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void

  // Reset
  reset: () => void
}

const initialState = {
  warehouses: [],
  inventory: [],
  stockMovements: [],
  binLocations: [],
  storageRequests: [],
  fulfillmentServices: [],
  warehouseFees: [],
  capacityMetrics: null,
  analytics: null,
  selectedWarehouse: null,
  selectedInventoryItem: null,
  isLoading: false,
  error: null,
  inventoryFilters: {},
  movementFilters: {},
}

export const useWarehouseStore = create<WarehouseState>()(
  persist(
    (set, get) => ({
      ...initialState,

      // Warehouse actions
      setWarehouses: (warehouses) => set({ warehouses }),
      addWarehouse: (warehouse) => set((state) => ({
        warehouses: [...state.warehouses, warehouse]
      })),
      updateWarehouse: (id, updates) => set((state) => ({
        warehouses: state.warehouses.map((w) =>
          w.id === id ? { ...w, ...updates } : w
        )
      })),
      setSelectedWarehouse: (id) => set({ selectedWarehouse: id }),

      // Inventory actions
      setInventory: (items) => set({ inventory: items }),
      addInventoryItem: (item) => set((state) => ({
        inventory: [...state.inventory, item]
      })),
      updateInventoryItem: (id, updates) => set((state) => ({
        inventory: state.inventory.map((item) =>
          item.id === id ? { ...item, ...updates } : item
        )
      })),
      removeInventoryItem: (id) => set((state) => ({
        inventory: state.inventory.filter((item) => item.id !== id)
      })),
      setInventoryFilters: (filters) => set((state) => ({
        inventoryFilters: { ...state.inventoryFilters, ...filters }
      })),
      getFilteredInventory: () => {
        const { inventory, inventoryFilters } = get()
        let filtered = [...inventory]

        if (inventoryFilters.warehouse_id) {
          filtered = filtered.filter((item) => item.warehouse_id === inventoryFilters.warehouse_id)
        }

        if (inventoryFilters.zone) {
          filtered = filtered.filter((item) => item.zone === inventoryFilters.zone)
        }

        if (inventoryFilters.condition) {
          filtered = filtered.filter((item) => item.condition === inventoryFilters.condition)
        }

        if (inventoryFilters.low_stock) {
          filtered = filtered.filter((item) => item.available_quantity <= item.reorder_point)
        }

        if (inventoryFilters.search) {
          const search = inventoryFilters.search.toLowerCase()
          filtered = filtered.filter((item) =>
            item.sku.toLowerCase().includes(search) ||
            item.product_name.toLowerCase().includes(search) ||
            item.bin_location.toLowerCase().includes(search)
          )
        }

        return filtered
      },

      // Stock movement actions
      setStockMovements: (movements) => set({ stockMovements: movements }),
      addStockMovement: (movement) => set((state) => ({
        stockMovements: [movement, ...state.stockMovements]
      })),
      updateStockMovement: (id, updates) => set((state) => ({
        stockMovements: state.stockMovements.map((m) =>
          m.id === id ? { ...m, ...updates } : m
        )
      })),
      setMovementFilters: (filters) => set((state) => ({
        movementFilters: { ...state.movementFilters, ...filters }
      })),
      getFilteredMovements: () => {
        const { stockMovements, movementFilters } = get()
        let filtered = [...stockMovements]

        if (movementFilters.warehouse_id) {
          filtered = filtered.filter((m) => m.warehouse_id === movementFilters.warehouse_id)
        }

        if (movementFilters.type) {
          filtered = filtered.filter((m) => m.type === movementFilters.type)
        }

        if (movementFilters.date_from) {
          filtered = filtered.filter((m) => m.performed_at >= movementFilters.date_from!)
        }

        if (movementFilters.date_to) {
          filtered = filtered.filter((m) => m.performed_at <= movementFilters.date_to!)
        }

        return filtered
      },

      // Bin location actions
      setBinLocations: (bins) => set({ binLocations: bins }),
      updateBinLocation: (id, updates) => set((state) => ({
        binLocations: state.binLocations.map((bin) =>
          bin.id === id ? { ...bin, ...updates } : bin
        )
      })),
      getBinsByWarehouse: (warehouseId) => {
        const { binLocations } = get()
        return binLocations.filter((bin) => bin.warehouse_id === warehouseId)
      },

      // Storage request actions
      setStorageRequests: (requests) => set({ storageRequests: requests }),
      addStorageRequest: (request) => set((state) => ({
        storageRequests: [request, ...state.storageRequests]
      })),
      updateStorageRequest: (id, updates) => set((state) => ({
        storageRequests: state.storageRequests.map((r) =>
          r.id === id ? { ...r, ...updates } : r
        )
      })),

      // Fulfillment services actions
      setFulfillmentServices: (services) => set({ fulfillmentServices: services }),

      // Warehouse fees actions
      setWarehouseFees: (fees) => set({ warehouseFees: fees }),

      // Analytics actions
      setCapacityMetrics: (metrics) => set({ capacityMetrics: metrics }),
      setAnalytics: (analytics) => set({ analytics }),

      // UI actions
      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),

      // Reset
      reset: () => set(initialState),
    }),
    {
      name: 'warehouse-storage',
      partialize: (state) => ({
        selectedWarehouse: state.selectedWarehouse,
        inventoryFilters: state.inventoryFilters,
        movementFilters: state.movementFilters,
      }),
    }
  )
)
