'use client'

import * as React from 'react'
import {
  Star,
  CheckCircle,
  Trash2,
  Loader2,
  MessageSquare,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { adminAPI } from '@/lib/api'
import { formatDate } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

interface Review {
  id: string
  product_id: string
  rating: number
  title?: string
  content: string
  created_at: string
  user?: {
    name: string
    email: string
  }
  product?: {
    name: string
    slug: string
  }
}

export default function AdminReviewsPage() {
  const { toast } = useToast()
  const [reviews, setReviews] = React.useState<Review[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [actionReview, setActionReview] = React.useState<{ review: Review; action: 'approve' | 'delete' } | null>(null)
  const [isUpdating, setIsUpdating] = React.useState(false)

  const fetchReviews = async () => {
    setIsLoading(true)
    try {
      const data = await adminAPI.getPendingReviews(50)
      setReviews(data || [])
    } catch (error) {
      console.error('Failed to fetch reviews:', error)
    } finally {
      setIsLoading(false)
    }
  }

  React.useEffect(() => {
    fetchReviews()
  }, [])

  const handleAction = async () => {
    if (!actionReview) return

    setIsUpdating(true)
    try {
      if (actionReview.action === 'approve') {
        await adminAPI.approveReview(actionReview.review.id)
        toast({
          title: 'Review approved',
          description: 'The review is now visible to customers.',
        })
      } else {
        await adminAPI.deleteReview(actionReview.review.id)
        toast({
          title: 'Review deleted',
          description: 'The review has been removed.',
        })
      }

      setReviews(prev => prev.filter(r => r.id !== actionReview.review.id))
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.response?.data?.detail || `Failed to ${actionReview.action} review`,
        variant: 'destructive',
      })
    } finally {
      setIsUpdating(false)
      setActionReview(null)
    }
  }

  const renderStars = (rating: number) => (
    <div className="flex items-center gap-0.5">
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${
            i < rating
              ? 'text-yellow-400 fill-yellow-400'
              : 'text-muted-foreground'
          }`}
        />
      ))}
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold font-display">Review Moderation</h1>
        <p className="text-muted-foreground">
          Approve or remove customer reviews.
        </p>
      </div>

      {/* Reviews */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-16 w-full" />
                  </div>
                  <Skeleton className="h-9 w-20" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <Card>
          <CardContent className="p-16 text-center">
            <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
            <h3 className="mt-4 text-lg font-semibold">All caught up!</h3>
            <p className="mt-2 text-muted-foreground">
              No reviews pending moderation.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <Card key={review.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3">
                      {renderStars(review.rating)}
                      <span className="text-sm text-muted-foreground">
                        {formatDate(review.created_at)}
                      </span>
                    </div>

                    {review.title && (
                      <h3 className="font-semibold">{review.title}</h3>
                    )}

                    <p className="text-sm">{review.content}</p>

                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>By: {review.user?.name || review.user?.email || 'Anonymous'}</span>
                      {review.product && (
                        <>
                          <span>•</span>
                          <span>Product: {review.product.name}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => setActionReview({ review, action: 'approve' })}
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => setActionReview({ review, action: 'delete' })}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Action Confirmation Dialog */}
      <AlertDialog
        open={!!actionReview}
        onOpenChange={() => setActionReview(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionReview?.action === 'approve' ? 'Approve Review' : 'Delete Review'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actionReview?.action === 'approve'
                ? 'Are you sure you want to approve this review? It will be visible to customers.'
                : 'Are you sure you want to delete this review? This action cannot be undone.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isUpdating}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleAction}
              disabled={isUpdating}
              className={actionReview?.action === 'delete' ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : ''}
            >
              {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {actionReview?.action === 'approve' ? 'Approve' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
