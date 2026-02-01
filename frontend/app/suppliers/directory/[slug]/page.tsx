'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  MapPin,
  Star,
  Package,
  Clock,
  Heart,
  Share2,
  Mail,
  Phone,
  Globe,
  Users,
  Calendar,
  TrendingUp,
  Award,
  CheckCircle,
  AlertCircle,
  MessageSquare,
  Plus,
  Briefcase,
  Truck,
  DollarSign,
  Zap,
  ArrowRight,
  ExternalLink,
} from 'lucide-react'
import Image2 from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Rating } from '@/components/ui/rating'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useSupplierDirectoryStore } from '@/store'
import { useParams } from 'next/navigation'
import { cn } from '@/lib/utils'

interface Props {
  params: { slug: string }
}

export default function SupplierProfilePage() {
  const params = useParams()
  const slug = params.slug as string
  const store = useSupplierDirectoryStore()

  const supplier = store.getAllSuppliers().find((s) => s.slug === slug)
  const reviews = supplier ? store.getSupplierReviews(supplier.id) : []
  const isFavorite = supplier ? store.isFavorite(supplier.id) : false

  const [activeTab, setActiveTab] = useState('overview')
  const [showContactForm, setShowContactForm] = useState(false)
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [rating, setRating] = useState(5)
  const [reviewTitle, setReviewTitle] = useState('')
  const [reviewComment, setReviewComment] = useState('')

  if (!supplier) {
    return (
      <div className="container py-16 text-center">
        <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
        <h1 className="text-2xl font-bold mb-2">Supplier Not Found</h1>
        <p className="text-muted-foreground mb-6">
          The supplier you're looking for doesn't exist or has been removed.
        </p>
        <Link href="/suppliers/directory">
          <Button>Back to Directory</Button>
        </Link>
      </div>
    )
  }

  const stats = store.getSupplierStats(supplier.id)
  const averageRating =
    (supplier.complianceRatings.quality +
      supplier.complianceRatings.delivery +
      supplier.complianceRatings.communication +
      supplier.complianceRatings.pricingAccuracy) /
    4

  const handleAddReview = () => {
    if (reviewTitle && reviewComment) {
      store.addReview(supplier.id, {
        supplierId: supplier.id,
        buyerId: 'current-user',
        buyerName: 'You',
        rating,
        title: reviewTitle,
        comment: reviewComment,
        categories: [],
        helpful: 0,
        verified: true,
      })
      setReviewTitle('')
      setReviewComment('')
      setRating(5)
      setShowReviewForm(false)
    }
  }

  const toggleFavorite = () => {
    if (isFavorite) {
      store.removeFromFavorites(supplier.id)
    } else {
      store.addToFavorites(supplier.id)
    }
  }

  return (
    <div className="container py-8">
      {/* Breadcrumb */}
      <div className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/suppliers/directory" className="hover:text-foreground transition-colors">
          Supplier Directory
        </Link>
        <span>/</span>
        <span>{supplier.businessName}</span>
      </div>

      {/* Header Section */}
      <div className="relative mb-8">
        {/* Banner */}
        <div className="relative h-64 bg-gradient-to-r from-primary/20 to-primary/10 rounded-t-lg overflow-hidden">
          {supplier.banner && (
            <Image
              src={supplier.banner}
              alt={supplier.businessName}
              fill
              className="object-cover"
            />
          )}
        </div>

        {/* Logo & Info */}
        <div className="relative px-6 py-6 bg-background border border-t-0 rounded-b-lg">
          <div className="flex items-start gap-6 -mt-20 mb-6">
            {/* Logo */}
            <div className="relative h-24 w-24 rounded-lg border-4 border-background bg-muted overflow-hidden flex-shrink-0">
              {supplier.logo ? (
                <Image
                  src={supplier.logo}
                  alt={supplier.businessName}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center">
                  <Briefcase className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
            </div>

            {/* Company Info */}
            <div className="flex-1 pt-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-bold mb-2">{supplier.businessName}</h1>
                  <div className="flex flex-wrap items-center gap-3 mb-3">
                    {supplier.verified && (
                      <div className="flex items-center gap-1 px-2 py-1 bg-green-100 rounded-full">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium text-green-600">Verified Supplier</span>
                      </div>
                    )}
                    <Badge variant="secondary">{supplier.companySize.toUpperCase()}</Badge>
                    <Badge variant="outline">{supplier.country}</Badge>
                  </div>

                  {/* Quick Stats */}
                  <div className="flex flex-wrap gap-6 text-sm">
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                      <span>
                        <span className="font-semibold">{supplier.rating.toFixed(1)}</span>
                        <span className="text-muted-foreground">
                          {' '}
                          ({supplier.reviewCount} reviews)
                        </span>
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      <span>{supplier.totalProducts} products</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                      <span>{supplier.totalOrders} orders completed</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={toggleFavorite}
                    className={cn(
                      isFavorite && 'bg-red-50 text-red-600 border-red-200'
                    )}
                  >
                    <Heart
                      className={cn(
                        'h-5 w-5',
                        isFavorite && 'fill-current'
                      )}
                    />
                  </Button>
                  <Button variant="outline" size="icon">
                    <Share2 className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2">
          {/* Tabs */}
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="products">Products</TabsTrigger>
              <TabsTrigger value="reviews">Reviews</TabsTrigger>
              <TabsTrigger value="gallery">Gallery</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              {/* Description */}
              <Card>
                <CardHeader>
                  <CardTitle>About the Supplier</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-foreground">{supplier.description}</p>

                  <div className="grid gap-4 md:grid-cols-2 pt-4 border-t">
                    <div>
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Company Info
                      </h4>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <p>
                          <span className="font-medium text-foreground">Founded:</span>{' '}
                          {supplier.yearEstablished}
                        </p>
                        <p>
                          <span className="font-medium text-foreground">Employees:</span>{' '}
                          {supplier.employeeCount}
                        </p>
                        <p>
                          <span className="font-medium text-foreground">Industry:</span>{' '}
                          {supplier.industry}
                        </p>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        Location & Languages
                      </h4>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <p>
                          <span className="font-medium text-foreground">Country:</span>{' '}
                          {supplier.country}
                        </p>
                        <p>
                          <span className="font-medium text-foreground">Languages:</span>{' '}
                          {supplier.languages.join(', ')}
                        </p>
                        <p>
                          <span className="font-medium text-foreground">Currencies:</span>{' '}
                          {supplier.acceptedCurrencies.join(', ')}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* B2B Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle>B2B Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="p-4 rounded-lg bg-muted">
                      <div className="flex items-center gap-2 mb-2">
                        <Truck className="h-5 w-5 text-primary" />
                        <h4 className="font-semibold">Lead Time</h4>
                      </div>
                      <p className="text-2xl font-bold">{supplier.leadTime}</p>
                    </div>

                    <div className="p-4 rounded-lg bg-muted">
                      <div className="flex items-center gap-2 mb-2">
                        <Package className="h-5 w-5 text-primary" />
                        <h4 className="font-semibold">Minimum Order</h4>
                      </div>
                      <p className="text-2xl font-bold">{supplier.moq} units</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Min value: ${supplier.minimumOrderValue}
                      </p>
                    </div>

                    <div className="p-4 rounded-lg bg-muted">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="h-5 w-5 text-primary" />
                        <h4 className="font-semibold">Response Time</h4>
                      </div>
                      <p className="text-2xl font-bold">{supplier.responseTime}</p>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t">
                    <h4 className="font-semibold mb-3">Payment Terms</h4>
                    <div className="flex flex-wrap gap-2">
                      {supplier.paymentTerms.map((term) => (
                        <Badge key={term} variant="secondary">
                          {term}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Compliance & Ratings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    Compliance Score
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Overall Score */}
                    <div className="p-4 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Overall Compliance</p>
                          <p className="text-3xl font-bold">{averageRating.toFixed(1)}/5.0</p>
                        </div>
                        <div className="flex items-center justify-center h-16 w-16 rounded-full bg-white border-2 border-green-400">
                          <span className="text-2xl font-bold text-green-600">
                            {(averageRating * 20).toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Rating Breakdown */}
                    <div className="grid gap-3">
                      {[
                        { label: 'Quality', value: supplier.complianceRatings.quality },
                        { label: 'Delivery', value: supplier.complianceRatings.delivery },
                        { label: 'Communication', value: supplier.complianceRatings.communication },
                        {
                          label: 'Pricing Accuracy',
                          value: supplier.complianceRatings.pricingAccuracy,
                        },
                      ].map(({ label, value }) => (
                        <div key={label}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium">{label}</span>
                            <span className="text-sm font-semibold">{value.toFixed(1)}</span>
                          </div>
                          <div className="h-2 rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-primary to-primary/70 transition-all"
                              style={{ width: `${(value / 5) * 100}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Performance Metrics */}
                    <div className="pt-4 border-t grid grid-cols-2 gap-3">
                      <div className="p-3 rounded-lg bg-muted">
                        <p className="text-xs text-muted-foreground mb-1">Cancellation Rate</p>
                        <p className="text-lg font-semibold">{supplier.cancellationRate}%</p>
                      </div>
                      <div className="p-3 rounded-lg bg-muted">
                        <p className="text-xs text-muted-foreground mb-1">Return Rate</p>
                        <p className="text-lg font-semibold">{supplier.returnRate}%</p>
                      </div>
                      <div className="p-3 rounded-lg bg-muted">
                        <p className="text-xs text-muted-foreground mb-1">Monthly Shipments</p>
                        <p className="text-lg font-semibold">{supplier.shipmentsPerMonth}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-muted">
                        <p className="text-xs text-muted-foreground mb-1">Total Orders</p>
                        <p className="text-lg font-semibold">{supplier.totalOrders.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Certifications */}
              {supplier.certifications.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      Certifications & Standards
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-2">
                      {supplier.certifications.map((cert) => (
                        <div key={cert} className="flex items-center gap-2 p-3 rounded-lg bg-green-50 border border-green-200">
                          <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                          <span className="font-medium text-green-900">{cert}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Products Tab */}
            <TabsContent value="products" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Product Categories</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 md:grid-cols-2">
                    {supplier.productCategories.map((category) => (
                      <div
                        key={category}
                        className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted transition-colors cursor-pointer"
                      >
                        <Package className="h-5 w-5 text-primary flex-shrink-0" />
                        <span className="font-medium">{category}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 pt-6 border-t">
                    <p className="text-sm text-muted-foreground mb-3">
                      Total Products: <span className="font-semibold">{supplier.totalProducts}</span>
                    </p>
                    <Button className="w-full">
                      Request Product Catalog
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Reviews Tab */}
            <TabsContent value="reviews" className="space-y-6">
              {/* Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Customer Reviews</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-end gap-6 mb-6">
                    <div>
                      <div className="text-4xl font-bold mb-2">{supplier.rating.toFixed(1)}</div>
                      <div className="flex items-center gap-1 mb-2">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={cn(
                              'h-4 w-4',
                              i < Math.round(supplier.rating)
                                ? 'text-yellow-500 fill-yellow-500'
                                : 'text-muted-foreground'
                            )}
                          />
                        ))}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Based on {supplier.reviewCount} reviews
                      </p>
                    </div>

                    <Dialog open={showReviewForm} onOpenChange={setShowReviewForm}>
                      <DialogTrigger asChild>
                        <Button className="ml-auto">
                          <Plus className="h-4 w-4 mr-2" />
                          Write a Review
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Write a Review</DialogTitle>
                          <DialogDescription>
                            Share your experience working with {supplier.businessName}
                          </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4">
                          {/* Rating */}
                          <div>
                            <Label className="mb-2">Rating</Label>
                            <div className="flex items-center gap-2">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                  key={star}
                                  onClick={() => setRating(star)}
                                  className="focus:outline-none"
                                >
                                  <Star
                                    className={cn(
                                      'h-6 w-6 transition-colors',
                                      star <= rating
                                        ? 'text-yellow-500 fill-yellow-500'
                                        : 'text-muted-foreground'
                                    )}
                                  />
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Title */}
                          <div>
                            <Label htmlFor="review-title">Title</Label>
                            <Input
                              id="review-title"
                              placeholder="Brief title for your review"
                              value={reviewTitle}
                              onChange={(e) => setReviewTitle(e.target.value)}
                            />
                          </div>

                          {/* Comment */}
                          <div>
                            <Label htmlFor="review-comment">Your Review</Label>
                            <Textarea
                              id="review-comment"
                              placeholder="Share your experience..."
                              value={reviewComment}
                              onChange={(e) => setReviewComment(e.target.value)}
                              rows={5}
                            />
                          </div>

                          <Button onClick={handleAddReview} className="w-full">
                            Submit Review
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardContent>
              </Card>

              {/* Reviews List */}
              <div className="space-y-4">
                {reviews.length === 0 ? (
                  <Card>
                    <CardContent className="py-8 text-center">
                      <MessageSquare className="mx-auto h-8 w-8 text-muted-foreground/50 mb-2" />
                      <p className="text-muted-foreground">No reviews yet</p>
                    </CardContent>
                  </Card>
                ) : (
                  reviews.map((review) => (
                    <Card key={review.id}>
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-semibold">{review.title}</h4>
                            <p className="text-sm text-muted-foreground">{review.buyerName}</p>
                          </div>
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={cn(
                                  'h-4 w-4',
                                  i < review.rating
                                    ? 'text-yellow-500 fill-yellow-500'
                                    : 'text-muted-foreground'
                                )}
                              />
                            ))}
                          </div>
                        </div>
                        <p className="text-sm text-foreground mb-3">{review.comment}</p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          {review.verified && (
                            <div className="flex items-center gap-1">
                              <CheckCircle className="h-3 w-3 text-green-600" />
                              <span>Verified Purchase</span>
                            </div>
                          )}
                          <button className="hover:text-foreground transition-colors">
                            Helpful ({review.helpful})
                          </button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            {/* Gallery Tab */}
            <TabsContent value="gallery" className="space-y-6">
              {supplier.galleryImages.length === 0 ? (
                <Card>
                  <CardContent className="py-16 text-center">
                    <Package className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground">No gallery images</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {/* Main Image */}
                  <Card>
                    <div className="relative h-96 bg-muted overflow-hidden rounded-lg">
                      {supplier.galleryImages[selectedImageIndex] && (
                        <Image
                          src={supplier.galleryImages[selectedImageIndex]}
                          alt={`Gallery image ${selectedImageIndex + 1}`}
                          fill
                          className="object-cover"
                        />
                      )}
                    </div>
                  </Card>

                  {/* Thumbnails */}
                  <div className="grid grid-cols-4 gap-2">
                    {supplier.galleryImages.map((image, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedImageIndex(idx)}
                        className={cn(
                          'relative h-20 rounded-lg overflow-hidden border-2 transition-colors',
                          selectedImageIndex === idx
                            ? 'border-primary'
                            : 'border-muted'
                        )}
                      >
                        <Image
                          src={image}
                          alt={`Thumbnail ${idx + 1}`}
                          fill
                          className="object-cover"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Contact Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Get in Touch</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {supplier.contactEmail && (
                <a
                  href={`mailto:${supplier.contactEmail}`}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors text-sm"
                >
                  <Mail className="h-4 w-4 text-primary flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="font-medium truncate">{supplier.contactEmail}</p>
                  </div>
                </a>
              )}

              {supplier.contactPhone && (
                <a
                  href={`tel:${supplier.contactPhone}`}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors text-sm"
                >
                  <Phone className="h-4 w-4 text-primary flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">Phone</p>
                    <p className="font-medium truncate">{supplier.contactPhone}</p>
                  </div>
                </a>
              )}

              {supplier.website && (
                <a
                  href={supplier.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors text-sm"
                >
                  <Globe className="h-4 w-4 text-primary flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">Website</p>
                    <p className="font-medium truncate">{supplier.website}</p>
                  </div>
                </a>
              )}

              <Dialog open={showContactForm} onOpenChange={setShowContactForm}>
                <DialogTrigger asChild>
                  <Button className="w-full" size="sm">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Send Message
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Contact {supplier.businessName}</DialogTitle>
                    <DialogDescription>
                      Send a message to discuss your B2B needs
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="subject">Subject</Label>
                      <Input id="subject" placeholder="What would you like to discuss?" />
                    </div>
                    <div>
                      <Label htmlFor="message">Message</Label>
                      <Textarea
                        id="message"
                        placeholder="Tell us about your requirements..."
                        rows={5}
                      />
                    </div>
                    <Button className="w-full">Send Message</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>

          {/* Social Links */}
          {supplier.socialLinks && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Follow</CardTitle>
              </CardHeader>
              <CardContent className="flex gap-2">
                {supplier.socialLinks.linkedin && (
                  <a
                    href={`https://${supplier.socialLinks.linkedin}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 p-2 rounded-lg border hover:bg-muted transition-colors text-center text-sm font-medium"
                  >
                    LinkedIn
                  </a>
                )}
                {supplier.socialLinks.twitter && (
                  <a
                    href={`https://${supplier.socialLinks.twitter}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 p-2 rounded-lg border hover:bg-muted transition-colors text-center text-sm font-medium"
                  >
                    Twitter
                  </a>
                )}
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href="/rfq">
                <Button variant="outline" className="w-full justify-start" size="sm">
                  <Zap className="h-4 w-4 mr-2" />
                  Request Quote
                </Button>
              </Link>
              <Link href={`/vendor/${supplier.slug}`}>
                <Button variant="outline" className="w-full justify-start" size="sm">
                  <Store className="h-4 w-4 mr-2" />
                  View Store
                </Button>
              </Link>
              <Button variant="outline" className="w-full justify-start" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                View Price List
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

// Add missing import for Store icon
import { Store } from 'lucide-react'
