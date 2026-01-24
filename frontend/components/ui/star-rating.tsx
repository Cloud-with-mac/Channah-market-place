'use client'

import * as React from 'react'
import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StarRatingProps {
  rating: number
  maxRating?: number
  size?: 'sm' | 'md' | 'lg'
  showValue?: boolean
  interactive?: boolean
  onRatingChange?: (rating: number) => void
  className?: string
}

const sizeClasses = {
  sm: 'h-3 w-3',
  md: 'h-4 w-4',
  lg: 'h-5 w-5',
}

export function StarRating({
  rating,
  maxRating = 5,
  size = 'md',
  showValue = false,
  interactive = false,
  onRatingChange,
  className,
}: StarRatingProps) {
  const [hoverRating, setHoverRating] = React.useState(0)

  const handleClick = (index: number) => {
    if (interactive && onRatingChange) {
      onRatingChange(index + 1)
    }
  }

  const handleMouseEnter = (index: number) => {
    if (interactive) {
      setHoverRating(index + 1)
    }
  }

  const handleMouseLeave = () => {
    if (interactive) {
      setHoverRating(0)
    }
  }

  const displayRating = hoverRating || rating

  return (
    <div className={cn('flex items-center gap-0.5', className)}>
      {Array.from({ length: maxRating }).map((_, index) => {
        const filled = index < Math.floor(displayRating)
        const partial = index === Math.floor(displayRating) && displayRating % 1 > 0
        const partialWidth = partial ? `${(displayRating % 1) * 100}%` : '0%'

        return (
          <button
            key={index}
            type="button"
            disabled={!interactive}
            className={cn(
              'relative',
              interactive && 'cursor-pointer transition-transform hover:scale-110',
              !interactive && 'cursor-default'
            )}
            onClick={() => handleClick(index)}
            onMouseEnter={() => handleMouseEnter(index)}
            onMouseLeave={handleMouseLeave}
          >
            {/* Background star (empty) */}
            <Star
              className={cn(
                sizeClasses[size],
                'text-muted-foreground/30'
              )}
            />
            {/* Filled star overlay */}
            <div
              className="absolute inset-0 overflow-hidden"
              style={{ width: filled ? '100%' : partialWidth }}
            >
              <Star
                className={cn(
                  sizeClasses[size],
                  'fill-gold text-gold'
                )}
              />
            </div>
          </button>
        )
      })}
      {showValue && (
        <span className="ml-1 text-sm text-muted-foreground">
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  )
}
