'use client'

import * as React from 'react'
import { useCurrencyStore } from '@/store'
import { cn } from '@/lib/utils'

interface FilterPriceRangeProps {
  min: number
  max: number
  value: [number, number]
  onChange: (value: [number, number]) => void
}

// Preset price ranges
const priceRanges = [
  { label: 'Up to £10', min: 0, max: 10 },
  { label: '£10 to £20', min: 10, max: 20 },
  { label: '£20 to £50', min: 20, max: 50 },
  { label: '£50 to £100', min: 50, max: 100 },
  { label: '£100 to £200', min: 100, max: 200 },
  { label: '£200 & above', min: 200, max: 10000 },
]

export function FilterPriceRange({
  min,
  max,
  value,
  onChange,
}: FilterPriceRangeProps) {
  const { convertAndFormat, formatBasePrice, isHydrated } = useCurrencyStore()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  // Check if a range is currently selected
  const isRangeSelected = (rangeMin: number, rangeMax: number) => {
    return value[0] === rangeMin && value[1] === rangeMax
  }

  // Check if no preset is selected (custom range or default)
  const isDefaultRange = value[0] === min && value[1] === max

  const handleRangeSelect = (rangeMin: number, rangeMax: number) => {
    // If clicking the same range, deselect it (reset to default)
    if (isRangeSelected(rangeMin, rangeMax)) {
      onChange([min, max])
    } else {
      onChange([rangeMin, rangeMax])
    }
  }

  return (
    <div className="space-y-2">
      {priceRanges.map((range, index) => {
        const isSelected = isRangeSelected(range.min, range.max)

        return (
          <button
            key={index}
            onClick={() => handleRangeSelect(range.min, range.max)}
            className={cn(
              'w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-all',
              'border hover:border-cyan-500/50',
              isSelected
                ? 'bg-cyan-500/10 border-cyan-500/50 text-cyan-600 dark:text-cyan-400'
                : 'border-border hover:bg-muted/50'
            )}
          >
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  'w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all',
                  isSelected
                    ? 'border-cyan-500 bg-cyan-500'
                    : 'border-muted-foreground/30'
                )}
              >
                {isSelected && (
                  <div className="w-1.5 h-1.5 rounded-full bg-white" />
                )}
              </div>
              <span className={cn(
                'font-medium',
                isSelected && 'text-cyan-600 dark:text-cyan-400'
              )}>
                {range.label}
              </span>
            </div>
          </button>
        )
      })}
    </div>
  )
}
