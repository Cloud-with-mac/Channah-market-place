'use client'

import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FilterRatingProps {
  value: number | null
  onChange: (rating: number | null) => void
}

const ratings = [4, 3, 2, 1]

export function FilterRating({ value, onChange }: FilterRatingProps) {
  return (
    <div className="space-y-2">
      {ratings.map((rating) => (
        <button
          key={rating}
          onClick={() => onChange(value === rating ? null : rating)}
          className={cn(
            'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors',
            value === rating
              ? 'bg-primary/10 text-primary'
              : 'hover:bg-muted'
          )}
        >
          <div className="flex items-center gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={cn(
                  'h-3.5 w-3.5',
                  i < rating
                    ? 'fill-gold text-gold'
                    : 'text-muted-foreground/30'
                )}
              />
            ))}
          </div>
          <span className="text-muted-foreground">& Up</span>
        </button>
      ))}
    </div>
  )
}
