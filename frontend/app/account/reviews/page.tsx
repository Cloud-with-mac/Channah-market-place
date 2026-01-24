'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Star, Package, Edit2, Trash2, ThumbsUp, Calendar, Store } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

interface Review {
  id: string
  productId: string
  productName: string
  productImage: string
  productSlug: string
  vendorName: string
  rating: number
  title: string
  content: string
  createdAt: string
  helpful: number
  verified: boolean
}

// Reviews will be fetched from API when available
// For now, show empty state
const initialReviews: Review[] = []

interface PendingReview {
  id: string
  productId: string
  productName: string
  productImage: string
  productSlug: string
  vendorName: string
  orderId: string
  purchaseDate: string
}

// Pending reviews will be fetched from API when available
const pendingReviews: PendingReview[] = []

function StarRating({ rating, size = 16 }: { rating: number; size?: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={size}
          className={star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/30'}
        />
      ))}
    </div>
  )
}

export default function AccountReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>(initialReviews)

  const deleteReview = (id: string) => {
    setReviews((prev) => prev.filter((r) => r.id !== id))
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-display">My Reviews</h1>
        <p className="text-muted-foreground">
          Manage your product reviews and help other shoppers
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-cyan/10 to-transparent border-cyan/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-cyan/20">
                <Star className="h-5 w-5 text-cyan" />
              </div>
              <div>
                <p className="text-2xl font-bold">{reviews.length}</p>
                <p className="text-sm text-muted-foreground">Reviews Written</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-yellow-500/10 to-transparent border-yellow-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-yellow-500/20">
                <ThumbsUp className="h-5 w-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{reviews.reduce((sum, r) => sum + r.helpful, 0)}</p>
                <p className="text-sm text-muted-foreground">Helpful Votes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-orange-500/10 to-transparent border-orange-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-orange-500/20">
                <Package className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingReviews.length}</p>
                <p className="text-sm text-muted-foreground">Pending Reviews</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="written" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="written">Written Reviews ({reviews.length})</TabsTrigger>
          <TabsTrigger value="pending">To Review ({pendingReviews.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="written" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Your Reviews</CardTitle>
              <CardDescription>Reviews you&apos;ve written for products you purchased</CardDescription>
            </CardHeader>
            <CardContent>
              {reviews.length === 0 ? (
                <div className="text-center py-12">
                  <Star className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">No reviews yet</h3>
                  <p className="text-muted-foreground text-sm mb-4">
                    You haven&apos;t written any reviews yet. Share your experience with products you&apos;ve purchased!
                  </p>
                  <Button asChild>
                    <Link href="/account/orders">View Orders</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div
                      key={review.id}
                      className="rounded-xl border border-border p-4 hover:border-cyan/30 transition-colors"
                    >
                      <div className="flex gap-4">
                        <Link href={`/product/${review.productSlug}`} className="shrink-0">
                          <div className="relative h-20 w-20 rounded-lg overflow-hidden bg-muted">
                            <Image
                              src={review.productImage}
                              alt={review.productName}
                              fill
                              className="object-cover"
                            />
                          </div>
                        </Link>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <Link
                                href={`/product/${review.productSlug}`}
                                className="font-semibold hover:text-cyan transition-colors line-clamp-1"
                              >
                                {review.productName}
                              </Link>
                              <div className="flex items-center gap-2 mt-1">
                                <Store className="h-3.5 w-3.5 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">{review.vendorName}</span>
                              </div>
                            </div>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Review</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete this review? This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => deleteReview(review.id)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 mt-2">
                            <StarRating rating={review.rating} />
                            {review.verified && (
                              <Badge variant="outline" className="text-xs border-green-500/30 text-green-500">
                                Verified Purchase
                              </Badge>
                            )}
                          </div>

                          <h4 className="font-medium mt-2">{review.title}</h4>
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{review.content}</p>

                          <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5" />
                              {review.createdAt}
                            </span>
                            <span className="flex items-center gap-1">
                              <ThumbsUp className="h-3.5 w-3.5" />
                              {review.helpful} found this helpful
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pending" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Products to Review</CardTitle>
              <CardDescription>Share your experience with these recent purchases</CardDescription>
            </CardHeader>
            <CardContent>
              {pendingReviews.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">All caught up!</h3>
                  <p className="text-muted-foreground text-sm">
                    You&apos;ve reviewed all your recent purchases. Keep shopping to leave more reviews!
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingReviews.map((product) => (
                    <div
                      key={product.id}
                      className="rounded-xl border border-border p-4 hover:border-cyan/30 transition-colors"
                    >
                      <div className="flex gap-4 items-center">
                        <Link href={`/product/${product.productSlug}`} className="shrink-0">
                          <div className="relative h-16 w-16 rounded-lg overflow-hidden bg-muted">
                            <Image
                              src={product.productImage}
                              alt={product.productName}
                              fill
                              className="object-cover"
                            />
                          </div>
                        </Link>
                        <div className="flex-1 min-w-0">
                          <Link
                            href={`/product/${product.productSlug}`}
                            className="font-semibold hover:text-cyan transition-colors line-clamp-1"
                          >
                            {product.productName}
                          </Link>
                          <div className="flex items-center gap-2 mt-1">
                            <Store className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">{product.vendorName}</span>
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                            <span>Order {product.orderId}</span>
                            <span>Purchased {product.purchaseDate}</span>
                          </div>
                        </div>
                        <Button className="bg-cyan text-navy hover:bg-cyan/90 shrink-0">
                          Write Review
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
