'use client'

import { ThumbsUp, MoreHorizontal, Flag } from 'lucide-react'
import { StarRating } from '@/components/ui/star-rating'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { formatDistanceToNow } from 'date-fns'

interface ReviewCardProps {
  review: {
    id: string
    rating: number
    title?: string
    content: string
    author: {
      name: string
      avatar?: string
    }
    createdAt: string
    helpful?: number
    verified?: boolean
    images?: string[]
  }
  onHelpful?: (reviewId: string) => void
  onReport?: (reviewId: string) => void
}

export function ReviewCard({ review, onHelpful, onReport }: ReviewCardProps) {
  const initials = review.author.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="py-6 border-b last:border-b-0">
      <div className="flex items-start justify-between gap-4">
        {/* Author Info */}
        <div className="flex items-start gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={review.author.avatar} alt={review.author.name} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">{review.author.name}</span>
              {review.verified && (
                <span className="text-xs text-green-600 bg-green-50 px-1.5 py-0.5 rounded">
                  Verified Purchase
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <StarRating rating={review.rating} size="sm" />
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}
              </span>
            </div>
          </div>
        </div>

        {/* Actions Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onReport?.(review.id)}>
              <Flag className="h-4 w-4 mr-2" />
              Report Review
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Review Content */}
      <div className="mt-3 ml-13">
        {review.title && (
          <h4 className="font-medium mb-1">{review.title}</h4>
        )}
        <p className="text-sm text-muted-foreground leading-relaxed">
          {review.content}
        </p>

        {/* Review Images */}
        {review.images && review.images.length > 0 && (
          <div className="flex gap-2 mt-3">
            {review.images.map((image, index) => (
              <img
                key={index}
                src={image}
                alt={`Review image ${index + 1}`}
                className="h-16 w-16 object-cover rounded-md"
              />
            ))}
          </div>
        )}

        {/* Helpful Button */}
        <div className="mt-3">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs text-muted-foreground hover:text-foreground"
            onClick={() => onHelpful?.(review.id)}
          >
            <ThumbsUp className="h-3.5 w-3.5 mr-1.5" />
            Helpful {review.helpful && review.helpful > 0 && `(${review.helpful})`}
          </Button>
        </div>
      </div>
    </div>
  )
}
