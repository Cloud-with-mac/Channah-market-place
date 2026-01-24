'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { Label } from '@/components/ui/label'

interface VariantOption {
  id: string
  value: string
  available?: boolean
  priceModifier?: number
}

interface ProductVariant {
  name: string
  options: VariantOption[]
}

interface ProductVariantsProps {
  variants: ProductVariant[]
  selectedOptions: Record<string, string>
  onOptionChange: (variantName: string, optionId: string) => void
}

export function ProductVariants({
  variants,
  selectedOptions,
  onOptionChange,
}: ProductVariantsProps) {
  if (variants.length === 0) return null

  return (
    <div className="space-y-4">
      {variants.map((variant) => (
        <div key={variant.name}>
          <Label className="text-sm font-medium mb-2 block">
            {variant.name}
            {selectedOptions[variant.name] && (
              <span className="text-muted-foreground font-normal ml-2">
                : {variant.options.find((o) => o.id === selectedOptions[variant.name])?.value}
              </span>
            )}
          </Label>

          {/* Check if this is a color variant */}
          {variant.name.toLowerCase() === 'color' ? (
            <ColorVariant
              options={variant.options}
              selected={selectedOptions[variant.name]}
              onChange={(id) => onOptionChange(variant.name, id)}
            />
          ) : (
            <DefaultVariant
              options={variant.options}
              selected={selectedOptions[variant.name]}
              onChange={(id) => onOptionChange(variant.name, id)}
            />
          )}
        </div>
      ))}
    </div>
  )
}

interface VariantSelectorProps {
  options: VariantOption[]
  selected: string
  onChange: (id: string) => void
}

function DefaultVariant({ options, selected, onChange }: VariantSelectorProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <button
          key={option.id}
          onClick={() => option.available !== false && onChange(option.id)}
          disabled={option.available === false}
          className={cn(
            'px-4 py-2 text-sm font-medium rounded-md border transition-all',
            selected === option.id
              ? 'border-primary bg-primary/10 text-primary'
              : 'border-input bg-background hover:border-primary/50',
            option.available === false && 'opacity-50 cursor-not-allowed line-through'
          )}
        >
          {option.value}
          {option.priceModifier && option.priceModifier > 0 && (
            <span className="text-xs text-muted-foreground ml-1">
              (+${option.priceModifier})
            </span>
          )}
        </button>
      ))}
    </div>
  )
}

// Color codes mapping (can be extended)
const colorMap: Record<string, string> = {
  black: '#000000',
  white: '#FFFFFF',
  red: '#EF4444',
  blue: '#3B82F6',
  green: '#22C55E',
  yellow: '#EAB308',
  orange: '#F97316',
  purple: '#A855F7',
  pink: '#EC4899',
  gray: '#6B7280',
  grey: '#6B7280',
  brown: '#92400E',
  navy: '#1E3A8A',
  gold: '#D4AF37',
  silver: '#C0C0C0',
  beige: '#F5F5DC',
}

function ColorVariant({ options, selected, onChange }: VariantSelectorProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const colorCode = colorMap[option.value.toLowerCase()] || option.value
        const isColorCode = colorCode.startsWith('#')

        return (
          <button
            key={option.id}
            onClick={() => option.available !== false && onChange(option.id)}
            disabled={option.available === false}
            className={cn(
              'relative w-10 h-10 rounded-full border-2 transition-all',
              selected === option.id
                ? 'border-primary ring-2 ring-primary/20'
                : 'border-muted hover:border-muted-foreground/50',
              option.available === false && 'opacity-50 cursor-not-allowed'
            )}
            style={isColorCode ? { backgroundColor: colorCode } : undefined}
            title={option.value}
          >
            {!isColorCode && (
              <span className="absolute inset-0 flex items-center justify-center text-xs font-medium">
                {option.value.slice(0, 2).toUpperCase()}
              </span>
            )}
            {option.available === false && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-full h-0.5 bg-destructive rotate-45" />
              </div>
            )}
          </button>
        )
      })}
    </div>
  )
}
