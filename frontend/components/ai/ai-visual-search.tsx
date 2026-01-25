'use client'

import * as React from 'react'
import { Camera, Upload, X, Loader2, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { aiAPI } from '@/lib/api'
import Image from 'next/image'
import Link from 'next/link'

interface Product {
  id: string
  name: string
  price: number
  image_url?: string
  category?: string
  similarity_score?: number
}

interface VisualSearchProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AIVisualSearch({ open, onOpenChange }: VisualSearchProps) {
  const { toast } = useToast()
  const [isAnalyzing, setIsAnalyzing] = React.useState(false)
  const [selectedImage, setSelectedImage] = React.useState<string | null>(null)
  const [results, setResults] = React.useState<Product[]>([])
  const [detectedCategory, setDetectedCategory] = React.useState<string>('')
  const [detectedTags, setDetectedTags] = React.useState<string[]>([])
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const handleImageUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file',
        description: 'Please upload an image file',
        variant: 'destructive',
      })
      return
    }

    // Show preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setSelectedImage(e.target?.result as string)
    }
    reader.readAsDataURL(file)

    // Analyze image
    setIsAnalyzing(true)
    try {
      // Step 1: Analyze the image to get category and tags
      const analysisResponse = await aiAPI.analyzeImage(file)

      setDetectedCategory(analysisResponse.category || '')
      setDetectedTags(analysisResponse.tags || [])

      // Step 2: Search for similar products based on category and tags
      const searchQuery = [analysisResponse.category, ...analysisResponse.tags].filter(Boolean).join(' ')
      const searchResults = await aiAPI.visualSearch(searchQuery)

      setResults(searchResults.products || [])

      toast({
        title: 'Image analyzed',
        description: `Found ${searchResults.products?.length || 0} similar products`,
      })
    } catch (error: any) {
      console.error('Visual search failed:', error)
      toast({
        title: 'Search failed',
        description: error.response?.data?.detail || 'Could not analyze image. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleImageUpload(file)
    }
  }

  const handleReset = () => {
    setSelectedImage(null)
    setResults([])
    setDetectedCategory('')
    setDetectedTags([])
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Visual Search
          </DialogTitle>
          <DialogDescription>
            Upload a product image to find similar items in our marketplace
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Upload Section */}
          {!selectedImage ? (
            <div className="border-2 border-dashed border-border rounded-lg p-12 text-center">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <Camera className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">Upload Product Image</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Drop an image here or click to browse
              </p>
              <Button onClick={() => fileInputRef.current?.click()}>
                <Upload className="h-4 w-4 mr-2" />
                Choose Image
              </Button>
            </div>
          ) : (
            <>
              {/* Image Preview */}
              <div className="relative">
                <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
                  <Image
                    src={selectedImage}
                    alt="Search image"
                    fill
                    className="object-contain"
                  />
                </div>
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={handleReset}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Analysis Results */}
              {isAnalyzing ? (
                <div className="text-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
                  <p className="text-sm text-muted-foreground">Analyzing image with AI...</p>
                </div>
              ) : detectedCategory && (
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Detected Category:</p>
                    <Badge className="text-sm">{detectedCategory}</Badge>
                  </div>
                  {detectedTags.length > 0 && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Detected Tags:</p>
                      <div className="flex flex-wrap gap-2">
                        {detectedTags.map((tag, idx) => (
                          <Badge key={idx} variant="outline">{tag}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Search Results */}
              {results.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-semibold">
                    Similar Products ({results.length})
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {results.map((product) => (
                      <Link
                        key={product.id}
                        href={`/products/${product.id}`}
                        onClick={() => onOpenChange(false)}
                      >
                        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                          <CardContent className="p-3">
                            <div className="aspect-square relative mb-2 rounded-lg overflow-hidden bg-muted">
                              {product.image_url && (
                                <Image
                                  src={product.image_url}
                                  alt={product.name}
                                  fill
                                  className="object-cover"
                                />
                              )}
                            </div>
                            <p className="text-sm font-medium line-clamp-2 mb-1">
                              {product.name}
                            </p>
                            <div className="flex items-center justify-between">
                              <p className="text-primary font-semibold">
                                £{product.price.toFixed(2)}
                              </p>
                              {product.similarity_score && (
                                <Badge variant="secondary" className="text-xs">
                                  {Math.round(product.similarity_score * 100)}% match
                                </Badge>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {results.length === 0 && !isAnalyzing && detectedCategory && (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No similar products found. Try a different image.</p>
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
