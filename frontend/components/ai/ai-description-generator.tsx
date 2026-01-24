'use client'

import * as React from 'react'
import { Sparkles, Loader2, Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { aiAPI } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'

interface AIDescriptionGeneratorProps {
  productName: string
  category?: string
  onDescriptionGenerated: (data: {
    short_description: string
    description: string
    tags: string[]
  }) => void
}

export function AIDescriptionGenerator({
  productName,
  category,
  onDescriptionGenerated,
}: AIDescriptionGeneratorProps) {
  const { toast } = useToast()
  const [isOpen, setIsOpen] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)
  const [features, setFeatures] = React.useState('')
  const [targetAudience, setTargetAudience] = React.useState('')
  const [generatedContent, setGeneratedContent] = React.useState<{
    short_description: string
    description: string
    tags: string[]
  } | null>(null)
  const [copiedField, setCopiedField] = React.useState<string | null>(null)

  const handleGenerate = async () => {
    if (!productName) {
      toast({
        title: 'Product name required',
        description: 'Please enter a product name first.',
        variant: 'destructive',
      })
      return
    }

    setIsLoading(true)
    try {
      const response = await aiAPI.generateDescription({
        name: productName,
        category: category,
        features: features ? features.split(',').map(f => f.trim()) : undefined,
        target_audience: targetAudience || undefined,
      })

      setGeneratedContent(response.data)
    } catch (error: any) {
      toast({
        title: 'Generation failed',
        description: error?.response?.data?.detail || 'Failed to generate description',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopy = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 2000)
  }

  const handleApply = () => {
    if (generatedContent) {
      onDescriptionGenerated(generatedContent)
      setIsOpen(false)
      toast({
        title: 'Content applied',
        description: 'AI-generated content has been applied to your product.',
      })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm">
          <Sparkles className="mr-2 h-4 w-4" />
          AI Generate
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Description Generator
          </DialogTitle>
          <DialogDescription>
            Generate compelling product descriptions powered by AI.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Input Fields */}
          <div className="space-y-4 border-b pb-4">
            <div className="space-y-2">
              <Label>Product Name</Label>
              <Input value={productName} disabled />
            </div>

            <div className="space-y-2">
              <Label htmlFor="features">Key Features (comma-separated)</Label>
              <Input
                id="features"
                placeholder="e.g., wireless, noise-canceling, 40hr battery"
                value={features}
                onChange={(e) => setFeatures(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="audience">Target Audience (optional)</Label>
              <Input
                id="audience"
                placeholder="e.g., professionals, students, music lovers"
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
              />
            </div>

            <Button
              type="button"
              onClick={handleGenerate}
              disabled={isLoading || !productName}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Description
                </>
              )}
            </Button>
          </div>

          {/* Generated Content */}
          {generatedContent && (
            <div className="space-y-4">
              {/* Short Description */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Short Description</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopy(generatedContent.short_description, 'short')}
                  >
                    {copiedField === 'short' ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <div className="p-3 bg-muted rounded-lg text-sm">
                  {generatedContent.short_description}
                </div>
              </div>

              {/* Full Description */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Full Description</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopy(generatedContent.description, 'full')}
                  >
                    {copiedField === 'full' ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <div className="p-3 bg-muted rounded-lg text-sm whitespace-pre-wrap max-h-48 overflow-y-auto">
                  {generatedContent.description}
                </div>
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <Label>Suggested Tags</Label>
                <div className="flex flex-wrap gap-2">
                  {generatedContent.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleApply}
            disabled={!generatedContent}
          >
            Apply to Product
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
