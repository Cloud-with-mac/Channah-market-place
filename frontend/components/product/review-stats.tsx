'use client'

import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ReviewStatsProps {
  averageRating: number
  totalReviews: number
  distribution: {
    5: number
    4: number
    3: number
    2: number
    1: number
  }
}

export function ReviewStats({ averageRating, totalReviews, distribution }: ReviewStatsProps) {
  const maxCount = Math.max(...Object.values(distribution), 1)

  return (
    <div className="flex flex-col md:flex-row gap-8 p-6 bg-muted/30 rounded-lg">
      {/* Average Rating */}
      <div className="flex flex-col items-center justify-center text-center min-w-[140px]">
        <div className="text-5xl font-bold">{averageRating.toFixed(1)}</div>
        <div className="flex items-center gap-0.5 mt-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={cn(
                'h-5 w-5',
                i < Math.round(averageRating)
                  ? 'fill-gold text-gold'
                  : 'text-muted-foreground/30'
              )}
            />
          ))}
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          Based on {totalReviews} {totalReviews === 1 ? 'review' : 'reviews'}
        </p>
      </div>

      {/* Rating Distribution */}
      <div className="flex-1 space-y-2">
        {[5, 4, 3, 2, 1].map((stars) => {
          const count = distribution[stars as keyof typeof distribution] || 0
          const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0

          return (
            <div key={stars} className="flex items-center gap-3">
              <div className="flex items-center gap-1 w-12 text-sm">
                <span>{stars}</span>
                <Star className="h-3.5 w-3.5 fill-gold text-gold" />
              </div>
              <div className="flex-1 h-2.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-gold rounded-full transition-all duration-500"
                  style={{ width: `${(count / maxCount) * 100}%` }}
                />
              </div>
              <div className="w-16 text-right">
                <span className="text-sm text-muted-foreground">{count}</span>
                <span className="text-xs text-muted-foreground ml-1">
                  ({percentage.toFixed(0)}%)
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
