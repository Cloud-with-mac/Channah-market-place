'use client'

import * as React from 'react'
import {
  Star,
  Search,
  MoreHorizontal,
  Eye,
  CheckCircle,
  XCircle,
  Trash2,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  User,
  Package,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useToast } from '@/hooks/use-toast'
import { formatDate, getInitials } from '@/lib/utils'
import { reviewsAPI } from '@/lib/api'

interface Review {
  id: string
  product_id: string
  product_name: string
  user_id: string
  user_name: string
  rating: number
  title: string
  content: string
  status: string
  created_at: string
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'approved':
      return <Badge variant="success">Approved</Badge>
    case 'pending':
      return <Badge variant="warning">Pending</Badge>
    case 'rejected':
      return <Badge variant="destructive">Rejected</Badge>
    default:
      return <Badge variant="secondary">{status}</Badge>
  }
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-4 w-4 ${
            star <= rating
              ? 'fill-yellow-500 text-yellow-500'
              : 'fill-muted text-muted'
          }`}
        />
      ))}
    </div>
  )
}

export default function ReviewsPage() {
  const { toast } = useToast()
  const [reviews, setReviews] = React.useState<Review[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [statusFilter, setStatusFilter] = React.useState<string>('all')
  const [ratingFilter, setRatingFilter] = React.useState<string>('all')
  const [page, setPage] = React.useState(1)
  const [total, setTotal] = React.useState(0)
  const [selectedReview, setSelectedReview] = React.useState<Review | null>(null)
  const [actionType, setActionType] = React.useState<'approve' | 'reject' | 'delete' | null>(null)
  const [rejectReason, setRejectReason] = React.useState('')
  const [isProcessing, setIsProcessing] = React.useState(false)
  const limit = 20

  const fetchReviews = React.useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await reviewsAPI.list({
        page,
        limit,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        rating: ratingFilter !== 'all' ? parseInt(ratingFilter) : undefined,
      })
      setReviews(response.data.reviews || [])
      setTotal(response.data.total || 0)
    } catch (error) {
      console.error('Failed to fetch reviews:', error)
      setReviews([])
    } finally {
      setIsLoading(false)
    }
  }, [page, statusFilter, ratingFilter])

  React.useEffect(() => {
    fetchReviews()
  }, [fetchReviews])

  const handleAction = async () => {
    if (!selectedReview || !actionType) return
    try {
      setIsProcessing(true)
      switch (actionType) {
        case 'approve':
          await reviewsAPI.approve(selectedReview.id)
          setReviews((prev) =>
            prev.map((r) => (r.id === selectedReview.id ? { ...r, status: 'approved' } : r))
          )
          toast({
            title: 'Review Approved',
            description: 'The review has been approved and is now visible.',
          })
          break
        case 'reject':
          await reviewsAPI.reject(selectedReview.id, rejectReason)
          setReviews((prev) =>
            prev.map((r) => (r.id === selectedReview.id ? { ...r, status: 'rejected' } : r))
          )
          toast({
            title: 'Review Rejected',
            description: 'The review has been rejected.',
          })
          break
        case 'delete':
          await reviewsAPI.delete(selectedReview.id)
          setReviews((prev) => prev.filter((r) => r.id !== selectedReview.id))
          toast({
            title: 'Review Deleted',
            description: 'The review has been permanently deleted.',
          })
          break
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to perform action.',
        variant: 'destructive',
      })
    } finally {
      setIsProcessing(false)
      setSelectedReview(null)
      setActionType(null)
      setRejectReason('')
    }
  }

  const openActionDialog = (review: Review, action: 'approve' | 'reject' | 'delete') => {
    setSelectedReview(review)
    setActionType(action)
  }

  const totalPages = Math.ceil(total / limit)

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="flex gap-4">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Card>
          <CardContent className="p-0">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-24 m-4" />
            ))}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display">Review Moderation</h1>
          <p className="text-muted-foreground">
            Moderate and manage product reviews.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
        <Select value={ratingFilter} onValueChange={setRatingFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Rating" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Ratings</SelectItem>
            <SelectItem value="5">5 Stars</SelectItem>
            <SelectItem value="4">4 Stars</SelectItem>
            <SelectItem value="3">3 Stars</SelectItem>
            <SelectItem value="2">2 Stars</SelectItem>
            <SelectItem value="1">1 Star</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Reviews List */}
      <Card>
        <CardContent className="p-0">
          <div className="divide-y">
            {reviews.map((review) => (
              <div key={review.id} className="p-4 hover:bg-muted/50 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    {/* Review Header */}
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">
                          {getInitials(review.user_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm">{review.user_name}</span>
                          <StarRating rating={review.rating} />
                          {getStatusBadge(review.status)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(review.created_at)}
                        </p>
                      </div>
                    </div>

                    {/* Product Info */}
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Package className="h-4 w-4" />
                      <span>{review.product_name}</span>
                    </div>

                    {/* Review Content */}
                    {review.title && (
                      <p className="font-medium text-sm">{review.title}</p>
                    )}
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {review.content}
                    </p>
                  </div>

                  {/* Actions */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>
                        <Eye className="h-4 w-4 mr-2" />
                        View Full Review
                      </DropdownMenuItem>
                      {review.status === 'pending' && (
                        <>
                          <DropdownMenuItem onClick={() => openActionDialog(review, 'approve')}>
                            <CheckCircle className="h-4 w-4 mr-2 text-success" />
                            Approve
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openActionDialog(review, 'reject')}>
                            <XCircle className="h-4 w-4 mr-2 text-warning" />
                            Reject
                          </DropdownMenuItem>
                        </>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => openActionDialog(review, 'delete')}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
            {reviews.length === 0 && (
              <div className="p-8 text-center text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No reviews found</p>
              </div>
            )}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between p-4 border-t">
            <p className="text-sm text-muted-foreground">
              Showing {reviews.length} of {total} reviews
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm">
                Page {page} of {totalPages || 1}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Confirmation Dialog */}
      <Dialog
        open={!!selectedReview && !!actionType}
        onOpenChange={() => {
          setSelectedReview(null)
          setActionType(null)
          setRejectReason('')
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'approve' && 'Approve Review'}
              {actionType === 'reject' && 'Reject Review'}
              {actionType === 'delete' && 'Delete Review'}
            </DialogTitle>
            <DialogDescription>
              {actionType === 'approve' &&
                'This review will be visible to all users on the product page.'}
              {actionType === 'reject' &&
                'This review will be hidden. Please provide a reason for rejection.'}
              {actionType === 'delete' &&
                'This action cannot be undone. The review will be permanently deleted.'}
            </DialogDescription>
          </DialogHeader>

          {actionType === 'reject' && (
            <Textarea
              placeholder="Enter reason for rejection..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
            />
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setSelectedReview(null)
                setActionType(null)
                setRejectReason('')
              }}
            >
              Cancel
            </Button>
            <Button
              variant={actionType === 'delete' ? 'destructive' : 'default'}
              onClick={handleAction}
              disabled={isProcessing || (actionType === 'reject' && !rejectReason.trim())}
            >
              {isProcessing ? 'Processing...' : 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
