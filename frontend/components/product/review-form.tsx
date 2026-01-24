'use client'

import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Star, Upload, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

const reviewSchema = z.object({
  rating: z.number().min(1, 'Please select a rating').max(5),
  title: z.string().min(3, 'Title must be at least 3 characters').max(100).optional(),
  content: z.string().min(10, 'Review must be at least 10 characters').max(1000),
})

type ReviewFormData = z.infer<typeof reviewSchema>

interface ReviewFormProps {
  productId: string
  onSubmit: (data: ReviewFormData & { images?: File[] }) => Promise<void>
  onCancel?: () => void
}

export function ReviewForm({ productId, onSubmit, onCancel }: ReviewFormProps) {
  const [rating, setRating] = React.useState(0)
  const [hoverRating, setHoverRating] = React.useState(0)
  const [images, setImages] = React.useState<File[]>([])
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ReviewFormData>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      rating: 0,
      title: '',
      content: '',
    },
  })

  const handleRatingClick = (value: number) => {
    setRating(value)
    setValue('rating', value)
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files) {
      const newImages = Array.from(files).slice(0, 5 - images.length)
      setImages((prev) => [...prev, ...newImages])
    }
  }

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index))
  }

  const onFormSubmit = async (data: ReviewFormData) => {
    setIsSubmitting(true)
    try {
      await onSubmit({ ...data, images })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      {/* Rating */}
      <div>
        <Label className="text-sm font-medium mb-2 block">Your Rating</Label>
        <div className="flex items-center gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleRatingClick(i + 1)}
              onMouseEnter={() => setHoverRating(i + 1)}
              onMouseLeave={() => setHoverRating(0)}
              className="p-1 transition-transform hover:scale-110"
            >
              <Star
                className={cn(
                  'h-8 w-8 transition-colors',
                  i < (hoverRating || rating)
                    ? 'fill-gold text-gold'
                    : 'text-muted-foreground/30'
                )}
              />
            </button>
          ))}
          <span className="ml-2 text-sm text-muted-foreground">
            {rating > 0 && ['Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][rating - 1]}
          </span>
        </div>
        {errors.rating && (
          <p className="text-sm text-destructive mt-1">{errors.rating.message}</p>
        )}
      </div>

      {/* Title */}
      <div>
        <Label htmlFor="title" className="text-sm font-medium mb-2 block">
          Review Title (Optional)
        </Label>
        <Input
          id="title"
          placeholder="Summarize your experience"
          {...register('title')}
          error={!!errors.title}
        />
        {errors.title && (
          <p className="text-sm text-destructive mt-1">{errors.title.message}</p>
        )}
      </div>

      {/* Content */}
      <div>
        <Label htmlFor="content" className="text-sm font-medium mb-2 block">
          Your Review
        </Label>
        <Textarea
          id="content"
          placeholder="Share your experience with this product..."
          rows={5}
          {...register('content')}
          error={!!errors.content}
        />
        {errors.content && (
          <p className="text-sm text-destructive mt-1">{errors.content.message}</p>
        )}
      </div>

      {/* Image Upload */}
      <div>
        <Label className="text-sm font-medium mb-2 block">
          Add Photos (Optional)
        </Label>
        <div className="flex flex-wrap gap-3">
          {images.map((image, index) => (
            <div key={index} className="relative">
              <img
                src={URL.createObjectURL(image)}
                alt={`Upload ${index + 1}`}
                className="h-20 w-20 object-cover rounded-md"
              />
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute -top-2 -right-2 p-1 rounded-full bg-destructive text-destructive-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
          {images.length < 5 && (
            <label className="h-20 w-20 flex flex-col items-center justify-center border-2 border-dashed border-muted-foreground/30 rounded-md cursor-pointer hover:border-primary/50 transition-colors">
              <Upload className="h-5 w-5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground mt-1">Add</span>
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleImageUpload}
              />
            </label>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Upload up to 5 images (JPG, PNG)
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Submitting...' : 'Submit Review'}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  )
}
