'use client'

import * as React from 'react'
import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

interface RatingProps {
  value: number
  max?: number
  size?: 'sm' | 'md' | 'lg'
  readonly?: boolean
  onChange?: (value: number) => void
  className?: string
}

export function Rating({ value, max = 5, size = 'md', readonly = true, onChange, className }: RatingProps) {
  const sizes = { sm: 'h-3 w-3', md: 'h-4 w-4', lg: 'h-5 w-5' }

  return (
    <div className={cn('flex items-center gap-0.5', className)}>
      {Array.from({ length: max }, (_, i) => (
        <Star
          key={i}
          className={cn(
            sizes[size],
            i < Math.round(value) ? 'fill-yellow-400 text-yellow-400' : 'fill-muted text-muted',
            !readonly && 'cursor-pointer hover:text-yellow-400'
          )}
          onClick={() => !readonly && onChange?.(i + 1)}
        />
      ))}
    </div>
  )
}
