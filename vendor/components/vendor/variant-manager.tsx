'use client'

import * as React from 'react'
import { Plus, X, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

// Predefined size options
const CLOTHING_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL']
const SHOE_SIZES = ['36', '37', '38', '39', '40', '41', '42', '43', '44', '45', '46', '47', '48']

// Common colors with their hex codes
const COMMON_COLORS = [
  { name: 'Black', hex: '#000000' },
  { name: 'White', hex: '#FFFFFF' },
  { name: 'Red', hex: '#EF4444' },
  { name: 'Blue', hex: '#3B82F6' },
  { name: 'Green', hex: '#22C55E' },
  { name: 'Yellow', hex: '#EAB308' },
  { name: 'Orange', hex: '#F97316' },
  { name: 'Purple', hex: '#A855F7' },
  { name: 'Pink', hex: '#EC4899' },
  { name: 'Gray', hex: '#6B7280' },
  { name: 'Brown', hex: '#92400E' },
  { name: 'Navy', hex: '#1E3A8A' },
  { name: 'Beige', hex: '#F5F5DC' },
]

export interface VariantOption {
  id: string
  value: string
  quantity: number
  priceModifier: number
}

export interface VariantType {
  name: string
  enabled: boolean
  options: VariantOption[]
}

export interface ProductVariantData {
  hasVariants: boolean
  sizeType: 'clothing' | 'shoes' | 'custom'
  variantTypes: VariantType[]
  // Generated variants for API submission
  variants: Array<{
    name: string
    sku?: string
    price: number
    quantity: number
    options: Record<string, string>
  }>
}

interface VariantManagerProps {
  basePrice: number
  value: ProductVariantData
  onChange: (data: ProductVariantData) => void
  categoryName?: string
}

export function VariantManager({ basePrice, value, onChange, categoryName }: VariantManagerProps) {
  const [expanded, setExpanded] = React.useState(value.hasVariants)

  // Detect if this is a fashion/shoe category
  const isFashionCategory = React.useMemo(() => {
    if (!categoryName) return false
    const fashionKeywords = ['clothing', 'fashion', 'apparel', 'wear', 'shirt', 'dress', 'pants', 'jacket', 'coat']
    return fashionKeywords.some(keyword => categoryName.toLowerCase().includes(keyword))
  }, [categoryName])

  const isShoeCategory = React.useMemo(() => {
    if (!categoryName) return false
    const shoeKeywords = ['shoe', 'footwear', 'sneaker', 'boot', 'sandal', 'slipper']
    return shoeKeywords.some(keyword => categoryName.toLowerCase().includes(keyword))
  }, [categoryName])

  // Track if we've initialized to prevent infinite loops
  const initializedRef = React.useRef(false)

  // Initialize variant types - always include Size and Color options
  React.useEffect(() => {
    // Skip if already initialized with both types
    const hasSize = value.variantTypes.some(vt => vt.name === 'Size')
    const hasColor = value.variantTypes.some(vt => vt.name === 'Color')

    if (hasSize && hasColor) {
      initializedRef.current = true
      return
    }

    if (initializedRef.current) return

    const sizeOptions = isShoeCategory ? SHOE_SIZES : CLOTHING_SIZES

    if (value.variantTypes.length === 0) {
      // First time initialization
      initializedRef.current = true
      const initialTypes: VariantType[] = [
        // Size type - always available, auto-enabled for fashion/shoe categories
        {
          name: 'Size',
          enabled: isFashionCategory || isShoeCategory,
          options: sizeOptions.map((size, idx) => ({
            id: `size-${idx}`,
            value: size,
            quantity: 0,
            priceModifier: 0,
          })),
        },
        // Color type - always available, disabled by default
        {
          name: 'Color',
          enabled: false,
          options: [],
        },
      ]

      onChange({
        ...value,
        sizeType: isShoeCategory ? 'shoes' : 'clothing',
        variantTypes: initialTypes,
      })
    } else if (!hasSize) {
      // Add missing Size variant type
      initializedRef.current = true
      const updatedTypes: VariantType[] = [
        {
          name: 'Size',
          enabled: false,
          options: sizeOptions.map((size, idx) => ({
            id: `size-${idx}`,
            value: size,
            quantity: 0,
            priceModifier: 0,
          })),
        },
        ...value.variantTypes,
      ]
      onChange({
        ...value,
        variantTypes: updatedTypes,
      })
    }
  }, [isFashionCategory, isShoeCategory, onChange, value])

  const handleToggleVariants = (enabled: boolean) => {
    setExpanded(enabled)
    onChange({ ...value, hasVariants: enabled })
  }

  const handleToggleVariantType = (typeName: string, enabled: boolean) => {
    const updatedTypes = value.variantTypes.map(vt =>
      vt.name === typeName ? { ...vt, enabled } : vt
    )
    onChange({ ...value, variantTypes: updatedTypes })
  }

  const handleSizeTypeChange = (sizeType: 'clothing' | 'shoes' | 'custom') => {
    const sizeOptions = sizeType === 'shoes' ? SHOE_SIZES : CLOTHING_SIZES
    const updatedTypes = value.variantTypes.map(vt => {
      if (vt.name === 'Size') {
        return {
          ...vt,
          options: sizeOptions.map((size, idx) => ({
            id: `size-${idx}`,
            value: size,
            quantity: 0,
            priceModifier: 0,
          })),
        }
      }
      return vt
    })
    onChange({ ...value, sizeType, variantTypes: updatedTypes })
  }

  const handleToggleSizeOption = (sizeValue: string) => {
    const updatedTypes = value.variantTypes.map(vt => {
      if (vt.name === 'Size') {
        const existingOption = vt.options.find(o => o.value === sizeValue)
        if (existingOption) {
          // Toggle off - set quantity to 0 or remove
          return {
            ...vt,
            options: vt.options.map(o =>
              o.value === sizeValue ? { ...o, quantity: o.quantity > 0 ? 0 : 10 } : o
            ),
          }
        }
      }
      return vt
    })
    onChange({ ...value, variantTypes: updatedTypes })
  }

  const handleUpdateSizeQuantity = (sizeValue: string, quantity: number) => {
    const updatedTypes = value.variantTypes.map(vt => {
      if (vt.name === 'Size') {
        return {
          ...vt,
          options: vt.options.map(o =>
            o.value === sizeValue ? { ...o, quantity: Math.max(0, quantity) } : o
          ),
        }
      }
      return vt
    })
    onChange({ ...value, variantTypes: updatedTypes })
  }

  const handleAddColor = (colorName: string, colorHex?: string) => {
    const updatedTypes = value.variantTypes.map(vt => {
      if (vt.name === 'Color') {
        const exists = vt.options.some(o => o.value.toLowerCase() === colorName.toLowerCase())
        if (exists) return vt
        return {
          ...vt,
          options: [
            ...vt.options,
            {
              id: `color-${Date.now()}`,
              value: colorName,
              quantity: 10,
              priceModifier: 0,
            },
          ],
        }
      }
      return vt
    })
    onChange({ ...value, variantTypes: updatedTypes })
  }

  const handleRemoveColor = (colorId: string) => {
    const updatedTypes = value.variantTypes.map(vt => {
      if (vt.name === 'Color') {
        return {
          ...vt,
          options: vt.options.filter(o => o.id !== colorId),
        }
      }
      return vt
    })
    onChange({ ...value, variantTypes: updatedTypes })
  }

  const handleUpdateColorQuantity = (colorId: string, quantity: number) => {
    const updatedTypes = value.variantTypes.map(vt => {
      if (vt.name === 'Color') {
        return {
          ...vt,
          options: vt.options.map(o =>
            o.id === colorId ? { ...o, quantity: Math.max(0, quantity) } : o
          ),
        }
      }
      return vt
    })
    onChange({ ...value, variantTypes: updatedTypes })
  }

  const sizeVariant = value.variantTypes.find(vt => vt.name === 'Size')
  const colorVariant = value.variantTypes.find(vt => vt.name === 'Color')
  const activeSizes = sizeVariant?.options.filter(o => o.quantity > 0) || []
  const activeColors = colorVariant?.options || []

  // Calculate total inventory
  const totalInventory = React.useMemo(() => {
    if (!value.hasVariants) return 0

    // If both size and color are enabled, we'd need combinations
    // For now, just sum up the quantities
    let total = 0
    if (sizeVariant?.enabled) {
      total += activeSizes.reduce((sum, s) => sum + s.quantity, 0)
    }
    if (colorVariant?.enabled && activeColors.length > 0) {
      total += activeColors.reduce((sum, c) => sum + c.quantity, 0)
    }
    return total
  }, [value.hasVariants, sizeVariant, colorVariant, activeSizes, activeColors])

  return (
    <Card>
      <CardHeader
        className="cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              Product Variants
              {value.hasVariants && activeSizes.length > 0 && (
                <Badge variant="secondary">{activeSizes.length} sizes</Badge>
              )}
              {value.hasVariants && activeColors.length > 0 && (
                <Badge variant="secondary">{activeColors.length} colors</Badge>
              )}
            </CardTitle>
            <CardDescription>
              Add size and color options for this product
            </CardDescription>
          </div>
          {expanded ? (
            <ChevronUp className="h-5 w-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-5 w-5 text-muted-foreground" />
          )}
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="space-y-6">
          {/* Enable Variants Toggle */}
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div>
              <Label className="font-medium">Enable Product Variants</Label>
              <p className="text-sm text-muted-foreground">
                Allow customers to select size, color, or other options
              </p>
            </div>
            <Switch
              checked={value.hasVariants}
              onCheckedChange={handleToggleVariants}
            />
          </div>

          {value.hasVariants && (
            <>
              {/* Size Options */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={sizeVariant?.enabled ?? false}
                      onCheckedChange={(checked) => handleToggleVariantType('Size', checked)}
                    />
                    <Label className="font-medium">Size Options</Label>
                  </div>
                  {sizeVariant?.enabled && (
                    <Select
                      value={value.sizeType}
                      onValueChange={(v) => handleSizeTypeChange(v as 'clothing' | 'shoes')}
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="clothing">Clothing (XS-4XL)</SelectItem>
                        <SelectItem value="shoes">Shoes (36-48)</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>

                {sizeVariant?.enabled && (
                  <div className="space-y-3 p-4 border rounded-lg">
                    <p className="text-sm text-muted-foreground mb-3">
                      Click on sizes to enable them, then set the quantity for each
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {sizeVariant.options.map((option) => (
                        <div
                          key={option.id}
                          className={cn(
                            'flex flex-col items-center border rounded-lg p-2 transition-all cursor-pointer min-w-[60px]',
                            option.quantity > 0
                              ? 'border-primary bg-primary/10'
                              : 'border-input hover:border-primary/50'
                          )}
                          onClick={() => handleToggleSizeOption(option.value)}
                        >
                          <span className="font-medium text-sm">{option.value}</span>
                          {option.quantity > 0 && (
                            <div className="mt-1" onClick={(e) => e.stopPropagation()}>
                              <Input
                                type="number"
                                min="0"
                                value={option.quantity}
                                onChange={(e) =>
                                  handleUpdateSizeQuantity(option.value, parseInt(e.target.value) || 0)
                                }
                                className="w-16 h-7 text-xs text-center"
                              />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    {activeSizes.length > 0 && (
                      <p className="text-sm text-muted-foreground mt-2">
                        Total size inventory: {activeSizes.reduce((sum, s) => sum + s.quantity, 0)} units
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Color Options */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Switch
                    checked={colorVariant?.enabled ?? false}
                    onCheckedChange={(checked) => handleToggleVariantType('Color', checked)}
                  />
                  <Label className="font-medium">Color Options</Label>
                </div>

                {colorVariant?.enabled && (
                  <div className="space-y-3 p-4 border rounded-lg">
                    {/* Quick add common colors */}
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Quick add colors:</p>
                      <div className="flex flex-wrap gap-2">
                        {COMMON_COLORS.map((color) => {
                          const isAdded = activeColors.some(
                            c => c.value.toLowerCase() === color.name.toLowerCase()
                          )
                          return (
                            <button
                              key={color.name}
                              type="button"
                              onClick={() => !isAdded && handleAddColor(color.name, color.hex)}
                              disabled={isAdded}
                              className={cn(
                                'flex items-center gap-1.5 px-2 py-1 rounded-md border text-xs transition-all',
                                isAdded
                                  ? 'opacity-50 cursor-not-allowed border-primary bg-primary/10'
                                  : 'hover:border-primary/50'
                              )}
                            >
                              <span
                                className="w-3 h-3 rounded-full border border-muted"
                                style={{ backgroundColor: color.hex }}
                              />
                              {color.name}
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    {/* Selected colors with quantities */}
                    {activeColors.length > 0 && (
                      <div className="mt-4">
                        <p className="text-sm font-medium mb-2">Selected colors:</p>
                        <div className="space-y-2">
                          {activeColors.map((color) => {
                            const colorData = COMMON_COLORS.find(
                              c => c.name.toLowerCase() === color.value.toLowerCase()
                            )
                            return (
                              <div
                                key={color.id}
                                className="flex items-center gap-3 p-2 border rounded-lg"
                              >
                                <span
                                  className="w-6 h-6 rounded-full border"
                                  style={{ backgroundColor: colorData?.hex || '#ccc' }}
                                />
                                <span className="flex-1 font-medium">{color.value}</span>
                                <div className="flex items-center gap-2">
                                  <Label className="text-xs text-muted-foreground">Qty:</Label>
                                  <Input
                                    type="number"
                                    min="0"
                                    value={color.quantity}
                                    onChange={(e) =>
                                      handleUpdateColorQuantity(color.id, parseInt(e.target.value) || 0)
                                    }
                                    className="w-20 h-8"
                                  />
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleRemoveColor(color.id)}
                                    className="h-8 w-8 text-destructive hover:text-destructive"
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                        <p className="text-sm text-muted-foreground mt-2">
                          Total color inventory: {activeColors.reduce((sum, c) => sum + c.quantity, 0)} units
                        </p>
                      </div>
                    )}

                    {activeColors.length === 0 && (
                      <p className="text-sm text-muted-foreground italic">
                        No colors selected. Click on colors above to add them.
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Summary */}
              {(activeSizes.length > 0 || activeColors.length > 0) && (
                <div className="p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-medium mb-2">Variant Summary</h4>
                  <div className="text-sm text-muted-foreground space-y-1">
                    {activeSizes.length > 0 && (
                      <p>Sizes: {activeSizes.map(s => s.value).join(', ')}</p>
                    )}
                    {activeColors.length > 0 && (
                      <p>Colors: {activeColors.map(c => c.value).join(', ')}</p>
                    )}
                    <p className="font-medium text-foreground mt-2">
                      Total inventory across variants: {totalInventory} units
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      )}
    </Card>
  )
}

// Helper function to generate variants for API submission
export function generateVariantsForAPI(
  variantData: ProductVariantData,
  basePrice: number
): Array<{
  name: string
  sku?: string
  price: number
  quantity: number
  options: Record<string, string>
}> {
  if (!variantData.hasVariants) return []

  const variants: Array<{
    name: string
    sku?: string
    price: number
    quantity: number
    options: Record<string, string>
  }> = []

  const sizeVariant = variantData.variantTypes.find(vt => vt.name === 'Size' && vt.enabled)
  const colorVariant = variantData.variantTypes.find(vt => vt.name === 'Color' && vt.enabled)

  // Get sizes with quantity > 0, or all sizes if none have quantity (to preserve enabled state)
  const sizesWithQty = sizeVariant?.options.filter(o => o.quantity > 0) || []
  const activeSizes = sizesWithQty.length > 0 ? sizesWithQty : (sizeVariant?.options.slice(0, 1) || []) // At least save one size option

  // Get colors with quantity > 0
  const activeColors = colorVariant?.options.filter(o => o.quantity > 0) || []

  // If both size and color are enabled, create combinations
  if (sizeVariant?.enabled && colorVariant?.enabled && activeColors.length > 0) {
    const sizesToUse = sizesWithQty.length > 0 ? sizesWithQty : activeSizes
    for (const size of sizesToUse) {
      for (const color of activeColors) {
        variants.push({
          name: `${color.value} / ${size.value}`,
          price: basePrice + size.priceModifier + color.priceModifier,
          quantity: Math.min(size.quantity, color.quantity),
          options: {
            size: size.value,
            color: color.value,
          },
        })
      }
    }
  } else if (sizeVariant?.enabled && activeSizes.length > 0) {
    // Only sizes - save at least one even with quantity 0 to preserve enabled state
    for (const size of activeSizes) {
      variants.push({
        name: size.value,
        price: basePrice + size.priceModifier,
        quantity: size.quantity,
        options: {
          size: size.value,
        },
      })
    }
  } else if (colorVariant?.enabled && activeColors.length > 0) {
    // Only colors
    for (const color of activeColors) {
      variants.push({
        name: color.value,
        price: basePrice + color.priceModifier,
        quantity: color.quantity,
        options: {
          color: color.value,
        },
      })
    }
  }

  // If hasVariants is true but no actual variants were generated,
  // create a placeholder variant to preserve the enabled state
  if (variants.length === 0) {
    variants.push({
      name: '__variants_enabled__',
      price: basePrice,
      quantity: 0,
      options: {
        __variants_enabled__: 'true',
      },
    })
  }

  return variants
}

// Helper function to parse variants from API response into grouped format
export function parseVariantsFromAPI(
  variants: Array<{
    id: string
    name: string
    price: number
    quantity: number
    options?: Record<string, string> | string
  }>
): ProductVariantData {
  if (!variants || variants.length === 0) {
    return {
      hasVariants: false,
      sizeType: 'clothing',
      variantTypes: [],
      variants: [],
    }
  }

  // Check for placeholder variant (indicates variants were enabled but no specific options set)
  const hasPlaceholder = variants.some(v => {
    let options: Record<string, string> = {}
    if (typeof v.options === 'string') {
      try {
        options = JSON.parse(v.options)
      } catch {
        options = {}
      }
    } else if (v.options) {
      options = v.options
    }
    return options.__variants_enabled__ === 'true' || v.name === '__variants_enabled__'
  })

  // Filter out placeholder variants for processing
  const realVariants = variants.filter(v => {
    let options: Record<string, string> = {}
    if (typeof v.options === 'string') {
      try {
        options = JSON.parse(v.options)
      } catch {
        options = {}
      }
    } else if (v.options) {
      options = v.options
    }
    return options.__variants_enabled__ !== 'true' && v.name !== '__variants_enabled__'
  })

  // If only placeholder exists (no real variants), return hasVariants: true with empty types
  // The VariantManager will initialize the default types
  if (hasPlaceholder && realVariants.length === 0) {
    return {
      hasVariants: true,
      sizeType: 'clothing',
      variantTypes: [],
      variants: [],
    }
  }

  // Extract unique sizes and colors from variants
  const sizes = new Map<string, { quantity: number; priceModifier: number }>()
  const colors = new Map<string, { quantity: number; priceModifier: number }>()

  for (const variant of realVariants) {
    let options: Record<string, string> = {}

    // Handle options that might be a JSON string
    if (typeof variant.options === 'string') {
      try {
        options = JSON.parse(variant.options)
      } catch {
        options = {}
      }
    } else if (variant.options) {
      options = variant.options
    }

    if (options.size) {
      const existing = sizes.get(options.size)
      sizes.set(options.size, {
        quantity: (existing?.quantity || 0) + variant.quantity,
        priceModifier: 0,
      })
    }

    if (options.color) {
      const existing = colors.get(options.color)
      colors.set(options.color, {
        quantity: (existing?.quantity || 0) + variant.quantity,
        priceModifier: 0,
      })
    }
  }

  // Determine size type based on values
  const sizeValues = Array.from(sizes.keys())
  const isShoeSize = sizeValues.some(s => !isNaN(Number(s)) && Number(s) >= 30)
  const sizeType = isShoeSize ? 'shoes' : 'clothing'

  // Build variant types
  const variantTypes: VariantType[] = []

  // Size variant type
  const allSizes = sizeType === 'shoes' ? SHOE_SIZES : CLOTHING_SIZES
  variantTypes.push({
    name: 'Size',
    enabled: sizes.size > 0,
    options: allSizes.map((size, idx) => ({
      id: `size-${idx}`,
      value: size,
      quantity: sizes.get(size)?.quantity || 0,
      priceModifier: sizes.get(size)?.priceModifier || 0,
    })),
  })

  // Color variant type
  variantTypes.push({
    name: 'Color',
    enabled: colors.size > 0,
    options: Array.from(colors.entries()).map(([color, data], idx) => ({
      id: `color-${idx}`,
      value: color,
      quantity: data.quantity,
      priceModifier: data.priceModifier,
    })),
  })

  return {
    hasVariants: true,
    sizeType,
    variantTypes,
    variants: [],
  }
}
