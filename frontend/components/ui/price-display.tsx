'use client'

import { cn } from '@/lib/utils'
import { useCurrencyStore } from '@/store'

interface PriceDisplayProps {
  price: number
  compareAtPrice?: number | null
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showDiscount?: boolean
  className?: string
}

const sizeClasses = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
  xl: 'text-2xl',
}

export function PriceDisplay({
  price,
  compareAtPrice,
  size = 'md',
  showDiscount = true,
  className,
}: PriceDisplayProps) {
  const { convertAndFormat } = useCurrencyStore()

  const hasDiscount = compareAtPrice && compareAtPrice > price
  const discountPercentage = hasDiscount
    ? Math.round((1 - price / compareAtPrice) * 100)
    : 0

  return (
    <div className={cn('flex items-center gap-2 flex-wrap', className)}>
      <span
        className={cn(
          'font-bold text-foreground',
          sizeClasses[size],
          hasDiscount && 'text-destructive'
        )}
      >
        {convertAndFormat(price)}
      </span>
      {hasDiscount && (
        <>
          <span
            className={cn(
              'text-muted-foreground line-through',
              size === 'sm' && 'text-xs',
              size === 'md' && 'text-sm',
              size === 'lg' && 'text-base',
              size === 'xl' && 'text-lg'
            )}
          >
            {convertAndFormat(compareAtPrice)}
          </span>
          {showDiscount && (
            <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-semibold text-destructive">
              -{discountPercentage}%
            </span>
          )}
        </>
      )}
    </div>
  )
}
