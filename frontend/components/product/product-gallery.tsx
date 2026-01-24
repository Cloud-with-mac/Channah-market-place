'use client'

import * as React from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, ZoomIn, Maximize2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'

interface ProductImage {
  id: string
  url: string
  alt?: string
}

interface ProductGalleryProps {
  images: ProductImage[]
  productName: string
}

export function ProductGallery({ images, productName }: ProductGalleryProps) {
  const [selectedIndex, setSelectedIndex] = React.useState(0)
  const [isZoomed, setIsZoomed] = React.useState(false)
  const [zoomPosition, setZoomPosition] = React.useState({ x: 50, y: 50 })

  const selectedImage = images[selectedIndex] || images[0]

  // Ensure we have at least 4 thumbnail slots (fill with duplicates if needed)
  const displayImages = images.length >= 4
    ? images.slice(0, 4)
    : [...images, ...Array(4 - images.length).fill(images[0])].slice(0, 4)

  const goToPrevious = () => {
    setSelectedIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))
  }

  const goToNext = () => {
    setSelectedIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isZoomed) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    setZoomPosition({ x, y })
  }

  if (images.length === 0) {
    return (
      <div className="aspect-square bg-card rounded-lg flex items-center justify-center border border-border">
        <p className="text-muted-foreground">No image available</p>
      </div>
    )
  }

  return (
    <div className="flex gap-4">
      {/* Vertical Thumbnails on the Left */}
      <div className="hidden md:flex flex-col gap-3 w-20">
        {displayImages.map((image, index) => (
          <button
            key={`${image.id}-${index}`}
            onClick={() => {
              if (index < images.length) {
                setSelectedIndex(index)
              }
            }}
            onMouseEnter={() => {
              if (index < images.length) {
                setSelectedIndex(index)
              }
            }}
            className={cn(
              'relative w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden border-2 transition-all duration-200',
              selectedIndex === index
                ? 'border-cyan ring-2 ring-cyan/20 shadow-lg shadow-cyan/10'
                : 'border-border hover:border-cyan/50 hover:shadow-md'
            )}
          >
            <Image
              src={image.url}
              alt={image.alt || `${productName} thumbnail ${index + 1}`}
              fill
              className="object-cover"
              sizes="80px"
            />
            {/* Overlay for selected */}
            {selectedIndex === index && (
              <div className="absolute inset-0 bg-cyan/5" />
            )}
          </button>
        ))}

        {/* Show more indicator if there are more than 4 images */}
        {images.length > 4 && (
          <div className="w-20 h-20 rounded-xl border border-border bg-card flex items-center justify-center">
            <span className="text-sm text-muted-foreground font-medium">
              +{images.length - 4}
            </span>
          </div>
        )}
      </div>

      {/* Main Image */}
      <div className="flex-1">
        <div
          className={cn(
            "relative aspect-square overflow-hidden rounded-2xl bg-card border border-border group cursor-zoom-in",
            isZoomed && "cursor-zoom-out"
          )}
          onClick={() => setIsZoomed(!isZoomed)}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setIsZoomed(false)}
        >
          <Image
            src={selectedImage.url}
            alt={selectedImage.alt || productName}
            fill
            className={cn(
              "object-cover transition-transform duration-300",
              isZoomed && "scale-150"
            )}
            style={isZoomed ? {
              transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`
            } : undefined}
            sizes="(max-width: 768px) 100vw, 50vw"
            priority
          />

          {/* Zoom Button */}
          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant="secondary"
                size="icon"
                className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity bg-navy/80 hover:bg-navy border-cyan/20 text-cyan"
                onClick={(e) => e.stopPropagation()}
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-5xl p-0 overflow-hidden bg-navy border-border">
              <div className="relative aspect-square">
                <Image
                  src={selectedImage.url}
                  alt={selectedImage.alt || productName}
                  fill
                  className="object-contain"
                  sizes="100vw"
                />
              </div>
              {/* Thumbnail strip in modal */}
              {images.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 p-2 bg-navy/80 backdrop-blur-sm rounded-xl border border-border">
                  {images.map((image, index) => (
                    <button
                      key={image.id}
                      onClick={() => setSelectedIndex(index)}
                      className={cn(
                        'relative w-12 h-12 rounded-lg overflow-hidden border-2 transition-all',
                        selectedIndex === index
                          ? 'border-cyan'
                          : 'border-transparent hover:border-cyan/50'
                      )}
                    >
                      <Image
                        src={image.url}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="48px"
                      />
                    </button>
                  ))}
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* Navigation Arrows */}
          {images.length > 1 && (
            <>
              <Button
                variant="secondary"
                size="icon"
                className="absolute left-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-navy/80 hover:bg-navy border-cyan/20"
                onClick={(e) => {
                  e.stopPropagation()
                  goToPrevious()
                }}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="secondary"
                size="icon"
                className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-navy/80 hover:bg-navy border-cyan/20"
                onClick={(e) => {
                  e.stopPropagation()
                  goToNext()
                }}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </>
          )}

          {/* Image Counter Badge */}
          {images.length > 1 && (
            <div className="absolute bottom-4 left-4 bg-navy/80 backdrop-blur-sm text-foreground text-xs px-3 py-1.5 rounded-full border border-border">
              <span className="text-cyan font-semibold">{selectedIndex + 1}</span>
              <span className="text-muted-foreground"> / {images.length}</span>
            </div>
          )}

          {/* Zoom hint */}
          <div className="absolute bottom-4 right-4 bg-navy/80 backdrop-blur-sm text-muted-foreground text-xs px-3 py-1.5 rounded-full border border-border opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5">
            <ZoomIn className="h-3 w-3" />
            <span>Click to zoom</span>
          </div>
        </div>

        {/* Mobile Thumbnails */}
        <div className="flex md:hidden gap-2 mt-4 overflow-x-auto pb-2">
          {images.map((image, index) => (
            <button
              key={image.id}
              onClick={() => setSelectedIndex(index)}
              className={cn(
                'relative w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all',
                selectedIndex === index
                  ? 'border-cyan ring-2 ring-cyan/20'
                  : 'border-border hover:border-cyan/50'
              )}
            >
              <Image
                src={image.url}
                alt={image.alt || `${productName} thumbnail ${index + 1}`}
                fill
                className="object-cover"
                sizes="64px"
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
