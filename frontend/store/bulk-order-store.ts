import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface BulkOrderItem {
  sku: string
  productName: string
  quantity: number
  unitPrice: number
  variants?: Record<string, string>
  notes?: string
  error?: string
}

export interface BulkOrderTemplate {
  id: string
  name: string
  items: BulkOrderItem[]
  createdAt: string
  lastUsed?: string
}

interface BulkOrderState {
  templates: BulkOrderTemplate[]
  currentImport: BulkOrderItem[]

  // Template Management
  createTemplate: (name: string, items: BulkOrderItem[]) => string
  updateTemplate: (id: string, items: BulkOrderItem[]) => void
  deleteTemplate: (id: string) => void
  getTemplate: (id: string) => BulkOrderTemplate | undefined

  // Import/Export
  setCurrentImport: (items: BulkOrderItem[]) => void
  clearCurrentImport: () => void
  validateImport: (items: BulkOrderItem[]) => BulkOrderItem[]

  // CSV Handling
  parseCSV: (csvText: string) => BulkOrderItem[]
  exportToCSV: (items: BulkOrderItem[]) => string
  generateTemplate: () => string
}

export const useBulkOrderStore = create<BulkOrderState>()(
  persist(
    (set, get) => ({
      templates: [],
      currentImport: [],

      createTemplate: (name, items) => {
        const newTemplate: BulkOrderTemplate = {
          id: `template-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name,
          items,
          createdAt: new Date().toISOString(),
        }

        set((state) => ({
          templates: [...state.templates, newTemplate],
        }))

        return newTemplate.id
      },

      updateTemplate: (id, items) => {
        set((state) => ({
          templates: state.templates.map((template) =>
            template.id === id
              ? { ...template, items, lastUsed: new Date().toISOString() }
              : template
          ),
        }))
      },

      deleteTemplate: (id) => {
        set((state) => ({
          templates: state.templates.filter((template) => template.id !== id),
        }))
      },

      getTemplate: (id) => {
        return get().templates.find((template) => template.id === id)
      },

      setCurrentImport: (items) => {
        set({ currentImport: items })
      },

      clearCurrentImport: () => {
        set({ currentImport: [] })
      },

      validateImport: (items) => {
        return items.map((item) => {
          let error: string | undefined

          if (!item.sku || item.sku.trim() === '') {
            error = 'SKU is required'
          } else if (!item.quantity || item.quantity <= 0) {
            error = 'Valid quantity is required'
          } else if (item.unitPrice && item.unitPrice < 0) {
            error = 'Unit price must be positive'
          }

          return { ...item, error }
        })
      },

      parseCSV: (csvText) => {
        const lines = csvText.trim().split('\n')
        if (lines.length < 2) return []

        const headers = lines[0].split(',').map((h) => h.trim().toLowerCase())
        const items: BulkOrderItem[] = []

        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',').map((v) => v.trim())

          const skuIndex = headers.findIndex((h) => h.includes('sku') || h.includes('code'))
          const nameIndex = headers.findIndex((h) => h.includes('name') || h.includes('product'))
          const qtyIndex = headers.findIndex((h) => h.includes('qty') || h.includes('quantity'))
          const priceIndex = headers.findIndex((h) => h.includes('price') || h.includes('cost'))
          const notesIndex = headers.findIndex((h) => h.includes('note') || h.includes('comment'))

          if (skuIndex === -1 || qtyIndex === -1) continue

          items.push({
            sku: values[skuIndex] || '',
            productName: values[nameIndex] || 'Unknown Product',
            quantity: parseInt(values[qtyIndex]) || 0,
            unitPrice: parseFloat(values[priceIndex]) || 0,
            notes: notesIndex !== -1 ? values[notesIndex] : undefined,
          })
        }

        return items
      },

      exportToCSV: (items) => {
        const headers = ['SKU', 'Product Name', 'Quantity', 'Unit Price', 'Notes']
        const rows = items.map((item) => [
          item.sku,
          `"${item.productName}"`,
          item.quantity.toString(),
          item.unitPrice.toFixed(2),
          item.notes ? `"${item.notes}"` : '',
        ])

        return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n')
      },

      generateTemplate: () => {
        const headers = ['SKU', 'Product Name', 'Quantity', 'Unit Price', 'Notes']
        const example = [
          'PROD-001',
          'Example Product',
          '100',
          '10.50',
          'Optional notes',
        ]

        return [headers.join(','), example.join(',')].join('\n')
      },
    }),
    {
      name: 'channah-bulk-orders',
    }
  )
)
