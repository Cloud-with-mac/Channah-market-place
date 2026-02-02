'use client'

import * as React from 'react'
import { MessageSquarePlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ReviewStats } from './review-stats'
import { ReviewCard } from './review-card'
import { ReviewForm } from './review-form'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { reviewsAPI } from '@/lib/api'
import { useAuthStore } from '@/store'

interface Review {
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

interface ProductReviewsProps {
  productId: string
  initialReviews?: Review[]
  initialStats?: {
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
}

// Default empty state - reviews will be fetched from API
const defaultReviews: Review[] = []

const defaultStats = {
  averageRating: 0,
  totalReviews: 0,
  distribution: {
    5: 0,
    4: 0,
    3: 0,
    2: 0,
    1: 0,
  },
}

export function ProductReviews({
  productId,
  initialReviews = defaultReviews,
  initialStats = defaultStats,
}: ProductReviewsProps) {
  const [reviews, setReviews] = React.useState(initialReviews)
  const [stats, setStats] = React.useState(initialStats)
  const [showReviewForm, setShowReviewForm] = React.useState(false)
  const [sortBy, setSortBy] = React.useState('newest')
  const [isLoading, setIsLoading] = React.useState(false)
  const [currentPage, setCurrentPage] = React.useState(1)
  const [totalPages, setTotalPages] = React.useState(1)
  const [totalReviews, setTotalReviews] = React.useState(0)
  const { isAuthenticated } = useAuthStore()

  // Fetch reviews
  React.useEffect(() => {
    const fetchReviews = async () => {
      try {
        const data = await reviewsAPI.getByProduct(productId, { sort: sortBy, page: currentPage, limit: 10 })

        if (data?.results || data?.reviews || Array.isArray(data)) {
          const reviewsList = Array.isArray(data) ? data : (data.results || data.reviews || [])
          const transformedReviews = reviewsList.map((r: any) => ({
            id: r.id,
            rating: r.rating,
            title: r.title,
            content: r.content || r.review,
            author: {
              name: r.user?.full_name || r.author_name || 'Anonymous',
              avatar: r.user?.avatar,
            },
            createdAt: r.created_at,
            helpful: r.helpful_count,
            verified: r.is_verified_purchase,
            images: r.images?.map((img: any) => img.url),
          }))
          setReviews(transformedReviews)
        }

        if (data?.stats) {
          setStats(data.stats)
        }
        if (data?.total_pages) {
          setTotalPages(data.total_pages)
        }
        if (data?.total !== undefined) {
          setTotalReviews(data.total)
        }
      } catch (error) {
        console.error('Failed to fetch reviews:', error)
        // Keep initial/mock data
      }
    }

    fetchReviews()
  }, [productId, sortBy, currentPage])

  const handleSubmitReview = async (data: any) => {
    try {
      await reviewsAPI.create({
        product_id: productId,
        rating: data.rating,
        title: data.title,
        content: data.content,
        // Handle image upload separately if needed
      })

      // Refresh reviews
      setShowReviewForm(false)
      setCurrentPage(1)
      // Trigger refetch by toggling sort
      setSortBy((prev) => prev)
    } catch (error) {
      console.error('Failed to submit review:', error)
      throw error
    }
  }

  const handleHelpful = async (reviewId: string) => {
    try {
      await reviewsAPI.helpful(reviewId)
      // Update local state
      setReviews((prev) =>
        prev.map((r) =>
          r.id === reviewId ? { ...r, helpful: (r.helpful || 0) + 1 } : r
        )
      )
    } catch (error) {
      console.error('Failed to mark as helpful:', error)
    }
  }

  const handleReport = async (reviewId: string) => {
    // TODO: Implement report API
    console.log('Report review:', reviewId)
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-xl font-bold font-display">Customer Reviews</h2>
        {isAuthenticated && !showReviewForm && (
          <Button onClick={() => setShowReviewForm(true)}>
            <MessageSquarePlus className="h-4 w-4 mr-2" />
            Write a Review
          </Button>
        )}
      </div>

      {/* Review Form */}
      {showReviewForm && (
        <div className="border rounded-lg p-6">
          <h3 className="font-semibold mb-4">Write Your Review</h3>
          <ReviewForm
            productId={productId}
            onSubmit={handleSubmitReview}
            onCancel={() => setShowReviewForm(false)}
          />
        </div>
      )}

      {/* Stats */}
      <ReviewStats
        averageRating={stats.averageRating}
        totalReviews={stats.totalReviews}
        distribution={stats.distribution}
      />

      {/* Sort & Filter */}
      {reviews.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}
          </p>
          <Select value={sortBy} onValueChange={(val) => { setSortBy(val); setCurrentPage(1); }}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="highest">Highest Rated</SelectItem>
              <SelectItem value="lowest">Lowest Rated</SelectItem>
              <SelectItem value="helpful">Most Helpful</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Reviews List */}
      <div className="divide-y">
        {reviews.length > 0 ? (
          reviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              onHelpful={handleHelpful}
              onReport={handleReport}
            />
          ))
        ) : (
          <div className="py-12 text-center">
            <p className="text-muted-foreground mb-4">
              No reviews yet. Be the first to review this product!
            </p>
            {isAuthenticated && !showReviewForm && (
              <Button onClick={() => setShowReviewForm(true)}>
                Write a Review
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage <= 1}
          >
            Previous
          </Button>
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
            .map((p, idx, arr) => (
              <React.Fragment key={p}>
                {idx > 0 && arr[idx - 1] !== p - 1 && (
                  <span className="text-muted-foreground px-1">...</span>
                )}
                <Button
                  variant={p === currentPage ? "default" : "outline"}
                  size="sm"
                  className="w-9 h-9"
                  onClick={() => setCurrentPage(p)}
                >
                  {p}
                </Button>
              </React.Fragment>
            ))}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage >= totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  )
}
