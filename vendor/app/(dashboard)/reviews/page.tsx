'use client'

import * as React from 'react'
import { Star, MessageSquare } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { vendorReviewsAPI } from '@/lib/api'
import { formatDateTime } from '@/lib/utils'

interface Review {
  id: string
  rating: number
  title?: string
  content: string
  customer_name: string
  product_name: string
  created_at: string
  response?: string
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-4 w-4 ${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/30'}`}
        />
      ))}
    </div>
  )
}

export default function VendorReviewsPage() {
  const [reviews, setReviews] = React.useState<Review[]>([])
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    const fetchReviews = async () => {
      try {
        const response = await vendorReviewsAPI.list({ limit: 50 })
        setReviews(response.data?.results || response.data || [])
      } catch (error) {
        console.error('Failed to fetch reviews:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchReviews()
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-display">Reviews</h1>
        <p className="text-muted-foreground">Manage customer reviews for your products</p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Star className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">No reviews yet</h3>
              <p className="text-muted-foreground text-sm">
                Reviews will appear here when customers review your products
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <Card key={review.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{review.product_name}</CardTitle>
                    <CardDescription>{review.customer_name}</CardDescription>
                  </div>
                  <div className="text-right">
                    <StarRating rating={review.rating} />
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDateTime(review.created_at)}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {review.title && (
                  <h4 className="font-medium mb-2">{review.title}</h4>
                )}
                <p className="text-muted-foreground">{review.content}</p>

                {review.response && (
                  <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <MessageSquare className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">Your Response</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{review.response}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
