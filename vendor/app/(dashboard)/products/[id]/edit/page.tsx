'use client'

import * as React from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, X, Loader2, ImagePlus, Trash2, Upload, Link as LinkIcon, Plus } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { vendorProductsAPI, categoriesAPI, uploadAPI } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'
import { VariantManager, ProductVariantData, generateVariantsForAPI, parseVariantsFromAPI } from '@/components/vendor/variant-manager'

const productSchema = z.object({
  name: z.string().min(1, 'Product name is required').max(200),
  description: z.string().min(1, 'Description is required'),
  short_description: z.string().optional(),
  price: z.number().min(0.01, 'Price must be greater than 0'),
  compare_at_price: z.number().optional().nullable(),
  cost_price: z.number().optional().nullable(),
  sku: z.string().optional(),
  barcode: z.string().optional(),
  quantity: z.number().min(0, 'Stock cannot be negative'),
  low_stock_threshold: z.number().min(0).optional(),
  weight: z.number().optional().nullable(),
  shipping_cost: z.number().min(0).optional().nullable(),
  category_id: z.string().optional(),
  status: z.enum(['draft', 'active']),
  is_featured: z.boolean().optional(),
})

type ProductForm = z.infer<typeof productSchema>

interface Category {
  id: string
  name: string
  slug: string
  parent_id?: string | null
  children?: Category[]
}

// Helper to flatten category tree with indentation info
function flattenCategories(categories: Category[], level: number = 0, parentPath: string = ''): Array<{ id: string; name: string; displayName: string; level: number; fullPath: string }> {
  const result: Array<{ id: string; name: string; displayName: string; level: number; fullPath: string }> = []

  for (const cat of categories) {
    const fullPath = parentPath ? `${parentPath} > ${cat.name}` : cat.name
    result.push({
      id: cat.id,
      name: cat.name,
      displayName: '  '.repeat(level) + (level > 0 ? '└ ' : '') + cat.name,
      level,
      fullPath,
    })

    if (cat.children && cat.children.length > 0) {
      result.push(...flattenCategories(cat.children, level + 1, fullPath))
    }
  }

  return result
}

interface ProductImage {
  id: string
  url: string
  alt_text?: string
  is_primary: boolean
}

export default function EditProductPage() {
  const router = useRouter()
  const params = useParams()
  const productId = params.id as string
  const { toast } = useToast()

  const [isLoading, setIsLoading] = React.useState(true)
  const [isSaving, setIsSaving] = React.useState(false)
  const [isDeleting, setIsDeleting] = React.useState(false)
  const [categoryTree, setCategoryTree] = React.useState<Category[]>([])
  const [flatCategories, setFlatCategories] = React.useState<Array<{ id: string; name: string; displayName: string; level: number; fullPath: string }>>([])
  const [images, setImages] = React.useState<ProductImage[]>([])
  const [imageUrl, setImageUrl] = React.useState('')
  const [isUploading, setIsUploading] = React.useState(false)
  const [isDragOver, setIsDragOver] = React.useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const [variantData, setVariantData] = React.useState<ProductVariantData>({
    hasVariants: false,
    sizeType: 'clothing',
    variantTypes: [],
    variants: [],
  })
  const [selectedCategoryName, setSelectedCategoryName] = React.useState<string>('')
  const [bulkPricingTiers, setBulkPricingTiers] = React.useState<Array<{ min_qty: number; max_qty: number | null; price: number }>>([])
  const [moq, setMoq] = React.useState(1)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<ProductForm>({
    resolver: zodResolver(productSchema),
  })

  const watchStatus = watch('status')
  const watchIsFeatured = watch('is_featured')
  const watchCategoryId = watch('category_id')

  // Fetch product and categories
  React.useEffect(() => {
    const fetchData = async () => {
      try {
        // Helper to fetch flat list
        const fetchFlatCategories = async () => {
          const flatRes = await categoriesAPI.list()
          const cats = Array.isArray(flatRes) ? flatRes : (flatRes?.data || [])
          setCategoryTree(cats)
          return cats.map((c: Category) => ({
            id: c.id,
            name: c.name,
            displayName: c.name,
            level: 0,
            fullPath: c.name,
          }))
        }

        // Try to get category tree, fallback to flat list
        let categoriesList: Array<{ id: string; name: string; displayName: string; level: number; fullPath: string }> = []
        try {
          const treeRes = await categoriesAPI.getTree()
          const tree = Array.isArray(treeRes) ? treeRes : (treeRes?.data || [])

          // If tree is empty, try flat list instead
          if (tree.length === 0) {
            categoriesList = await fetchFlatCategories()
          } else {
            setCategoryTree(tree)
            categoriesList = flattenCategories(tree)
          }
        } catch {
          categoriesList = await fetchFlatCategories()
        }
        setFlatCategories(categoriesList)

        const product = await vendorProductsAPI.get(productId)
        setImages(product.images || [])

        // Set category name for variant manager
        if (product.category_id) {
          const cat = categoriesList.find((c) => c.id === product.category_id)
          setSelectedCategoryName(cat?.name || product.category?.name || '')
        }

        // Load existing variants
        if (product.variants && product.variants.length > 0) {
          const parsedVariants = parseVariantsFromAPI(product.variants)
          setVariantData(parsedVariants)
        }

        // Load bulk pricing
        if (product.moq) setMoq(product.moq)
        if (product.bulk_pricing && Array.isArray(product.bulk_pricing)) {
          setBulkPricingTiers(product.bulk_pricing)
        }

        // Reset form with product data
        reset({
          name: product.name,
          description: product.description || '',
          short_description: product.short_description || '',
          price: product.price,
          compare_at_price: product.compare_at_price,
          cost_price: product.cost_price,
          sku: product.sku || '',
          barcode: product.barcode || '',
          quantity: product.quantity,
          low_stock_threshold: product.low_stock_threshold || 5,
          weight: product.weight,
          shipping_cost: product.shipping_cost || 0,
          category_id: product.category_id || '',
          status: product.status as 'draft' | 'active',
          is_featured: product.is_featured || false,
        })
      } catch (error) {
        console.error('Failed to fetch product:', error)
        toast({
          title: 'Error',
          description: 'Failed to load product',
          variant: 'destructive',
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [productId, reset, toast])

  const addImageUrl = () => {
    if (imageUrl && !images.find(img => img.url === imageUrl)) {
      setImages([...images, { id: `new-${Date.now()}`, url: imageUrl, is_primary: images.length === 0 }])
      setImageUrl('')
    }
  }

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index))
  }

  // File upload function
  const uploadFile = async (file: File): Promise<string | null> => {
    try {
      const response = await uploadAPI.uploadImage(file)
      let url = response.data.url
      // If the URL is relative, prepend the API base URL
      if (url && url.startsWith('/')) {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001/api/v1'
        const baseUrl = apiUrl.replace('/api/v1', '')
        url = `${baseUrl}${url}`
      }
      return url
    } catch (error) {
      console.error('Failed to upload file:', error)
      toast({
        title: 'Upload failed',
        description: 'Failed to upload image. Please try again.',
        variant: 'destructive',
      })
      return null
    }
  }

  // Handle file selection
  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return

    setIsUploading(true)
    const uploadPromises: Promise<string | null>[] = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      if (file.type.startsWith('image/')) {
        uploadPromises.push(uploadFile(file))
      }
    }

    const uploadedUrls = await Promise.all(uploadPromises)
    const validUrls = uploadedUrls.filter((url): url is string => url !== null)

    if (validUrls.length > 0) {
      const newImages = validUrls.map((url, index) => ({
        id: `new-${Date.now()}-${index}`,
        url,
        is_primary: images.length === 0 && index === 0,
      }))
      setImages([...images, ...newImages])
    }

    setIsUploading(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    await handleFileSelect(e.dataTransfer.files)
  }

  const onSubmit = async (data: ProductForm) => {
    setIsSaving(true)
    try {
      // Prepare image URLs for the API
      const imageUrls = images.map(img => img.url)

      // Generate variants for API
      const variants = generateVariantsForAPI(variantData, data.price)

      await vendorProductsAPI.update(productId, {
        ...data,
        stock: data.quantity,
        moq,
        bulk_pricing: bulkPricingTiers.length > 0 ? bulkPricingTiers : undefined,
        image_urls: imageUrls,
        primary_image: imageUrls.length > 0 ? imageUrls[0] : null,
        variants: variants.length > 0 ? variants : undefined,
      })

      toast({
        title: 'Success',
        description: 'Product updated successfully',
      })

      router.push('/products')
    } catch (error: any) {
      console.error('Failed to update product:', error)
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to update product',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      return
    }

    setIsDeleting(true)
    try {
      await vendorProductsAPI.delete(productId)
      toast({
        title: 'Success',
        description: 'Product deleted successfully',
      })
      router.push('/products')
    } catch (error: any) {
      console.error('Failed to delete product:', error)
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to delete product',
        variant: 'destructive',
      })
    } finally {
      setIsDeleting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-32 mt-2" />
          </div>
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-[300px]" />
            <Skeleton className="h-[200px]" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-[150px]" />
            <Skeleton className="h-[150px]" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/products">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold font-display">Edit Product</h1>
            <p className="text-muted-foreground">Update product details</p>
          </div>
        </div>
        <Button
          variant="destructive"
          onClick={handleDelete}
          disabled={isDeleting}
        >
          {isDeleting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="mr-2 h-4 w-4" />
          )}
          Delete
        </Button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>Product name and description</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Product Name *</Label>
                  <Input
                    id="name"
                    {...register('name')}
                    placeholder="Enter product name"
                    className={errors.name ? 'border-destructive' : ''}
                  />
                  {errors.name && (
                    <p className="text-sm text-destructive">{errors.name.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="short_description">Short Description</Label>
                  <Input
                    id="short_description"
                    {...register('short_description')}
                    placeholder="Brief description for product listings"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Full Description *</Label>
                  <Textarea
                    id="description"
                    {...register('description')}
                    placeholder="Detailed product description"
                    rows={6}
                    className={errors.description ? 'border-destructive' : ''}
                  />
                  {errors.description && (
                    <p className="text-sm text-destructive">{errors.description.message}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Images */}
            <Card>
              <CardHeader>
                <CardTitle>Product Images</CardTitle>
                <CardDescription>Upload images or add image URLs</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Tabs defaultValue="upload" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="upload">
                      <Upload className="h-4 w-4 mr-2" />
                      Upload
                    </TabsTrigger>
                    <TabsTrigger value="url">
                      <LinkIcon className="h-4 w-4 mr-2" />
                      URL
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="upload" className="mt-4">
                    <div
                      className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                        isDragOver
                          ? 'border-primary bg-primary/5'
                          : 'border-muted-foreground/25 hover:border-muted-foreground/50'
                      }`}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                    >
                      {isUploading ? (
                        <div className="flex flex-col items-center gap-2">
                          <Loader2 className="h-8 w-8 animate-spin text-primary" />
                          <p className="text-sm text-muted-foreground">Uploading images...</p>
                        </div>
                      ) : (
                        <>
                          <Upload className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground mb-2">
                            Drag and drop images here, or click to select
                          </p>
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            multiple
                            className="hidden"
                            onChange={(e) => handleFileSelect(e.target.files)}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => fileInputRef.current?.click()}
                          >
                            <ImagePlus className="h-4 w-4 mr-2" />
                            Select Images
                          </Button>
                        </>
                      )}
                    </div>
                  </TabsContent>
                  <TabsContent value="url" className="mt-4">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Enter image URL (https://...)"
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addImageUrl())}
                      />
                      <Button type="button" variant="outline" onClick={addImageUrl}>
                        <ImagePlus className="h-4 w-4 mr-2" />
                        Add
                      </Button>
                    </div>
                  </TabsContent>
                </Tabs>

                {images.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
                    {images.map((img, index) => (
                      <div key={img.id} className="relative group aspect-square rounded-lg overflow-hidden bg-muted">
                        <img
                          src={img.url}
                          alt={img.alt_text || `Product image ${index + 1}`}
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/200?text=Image+Error'
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-2 right-2 p-1 rounded-full bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-4 w-4" />
                        </button>
                        {index === 0 && (
                          <span className="absolute bottom-2 left-2 text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded">
                            Primary
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Pricing */}
            <Card>
              <CardHeader>
                <CardTitle>Pricing</CardTitle>
                <CardDescription>Set product prices</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="price">Price *</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      {...register('price', { valueAsNumber: true })}
                      placeholder="0.00"
                      className={errors.price ? 'border-destructive' : ''}
                    />
                    {errors.price && (
                      <p className="text-sm text-destructive">{errors.price.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="compare_at_price">Compare at Price</Label>
                    <Input
                      id="compare_at_price"
                      type="number"
                      step="0.01"
                      {...register('compare_at_price', { valueAsNumber: true })}
                      placeholder="0.00"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cost_price">Cost Price</Label>
                    <Input
                      id="cost_price"
                      type="number"
                      step="0.01"
                      {...register('cost_price', { valueAsNumber: true })}
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Inventory */}
            <Card>
              <CardHeader>
                <CardTitle>Inventory</CardTitle>
                <CardDescription>Manage stock levels</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="sku">SKU</Label>
                    <Input
                      id="sku"
                      {...register('sku')}
                      placeholder="Stock Keeping Unit"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="barcode">Barcode</Label>
                    <Input
                      id="barcode"
                      {...register('barcode')}
                      placeholder="ISBN, UPC, GTIN, etc."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="quantity">Stock Quantity *</Label>
                    <Input
                      id="quantity"
                      type="number"
                      {...register('quantity', { valueAsNumber: true })}
                      placeholder="0"
                      className={errors.quantity ? 'border-destructive' : ''}
                    />
                    {errors.quantity && (
                      <p className="text-sm text-destructive">{errors.quantity.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="low_stock_threshold">Low Stock Alert</Label>
                    <Input
                      id="low_stock_threshold"
                      type="number"
                      {...register('low_stock_threshold', { valueAsNumber: true })}
                      placeholder="5"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="weight">Weight (kg)</Label>
                    <Input
                      id="weight"
                      type="number"
                      step="0.01"
                      {...register('weight', { valueAsNumber: true })}
                      placeholder="0.00"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="shipping_cost">Shipping Cost per Item</Label>
                    <Input
                      id="shipping_cost"
                      type="number"
                      step="0.01"
                      {...register('shipping_cost', { valueAsNumber: true })}
                      placeholder="0.00"
                    />
                    <p className="text-xs text-muted-foreground">Set to 0 for free shipping</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Bulk Pricing */}
            <Card>
              <CardHeader>
                <CardTitle>Bulk Pricing</CardTitle>
                <CardDescription>Set volume discounts for bulk orders</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="moq">Minimum Order Quantity (MOQ)</Label>
                  <Input
                    id="moq"
                    type="number"
                    min="1"
                    value={moq}
                    onChange={(e) => setMoq(Math.max(1, parseInt(e.target.value) || 1))}
                  />
                  <p className="text-xs text-muted-foreground">Minimum units a customer must order</p>
                </div>

                <div className="space-y-3">
                  <Label>Price Tiers</Label>
                  {bulkPricingTiers.map((tier, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        type="number"
                        min="1"
                        placeholder="Min qty"
                        value={tier.min_qty || ''}
                        onChange={(e) => {
                          const updated = [...bulkPricingTiers]
                          updated[index] = { ...tier, min_qty: parseInt(e.target.value) || 0 }
                          setBulkPricingTiers(updated)
                        }}
                        className="w-24"
                      />
                      <span className="text-muted-foreground">-</span>
                      <Input
                        type="number"
                        min="1"
                        placeholder="Max qty"
                        value={tier.max_qty || ''}
                        onChange={(e) => {
                          const updated = [...bulkPricingTiers]
                          updated[index] = { ...tier, max_qty: parseInt(e.target.value) || null }
                          setBulkPricingTiers(updated)
                        }}
                        className="w-24"
                      />
                      <span className="text-muted-foreground">units @</span>
                      <Input
                        type="number"
                        step="0.01"
                        min="0.01"
                        placeholder="Price"
                        value={tier.price || ''}
                        onChange={(e) => {
                          const updated = [...bulkPricingTiers]
                          updated[index] = { ...tier, price: parseFloat(e.target.value) || 0 }
                          setBulkPricingTiers(updated)
                        }}
                        className="w-28"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => setBulkPricingTiers(bulkPricingTiers.filter((_, i) => i !== index))}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setBulkPricingTiers([...bulkPricingTiers, { min_qty: 0, max_qty: null, price: 0 }])}
                  >
                    <Plus className="h-4 w-4 mr-1" /> Add Tier
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Variants */}
            <VariantManager
              basePrice={watch('price') || 0}
              value={variantData}
              onChange={setVariantData}
              categoryName={selectedCategoryName}
            />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status */}
            <Card>
              <CardHeader>
                <CardTitle>Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Product Status</Label>
                  <Select
                    value={watchStatus}
                    onValueChange={(value) => setValue('status', value as 'draft' | 'active')}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="is_featured">Featured Product</Label>
                  <Switch
                    id="is_featured"
                    checked={watchIsFeatured}
                    onCheckedChange={(checked) => setValue('is_featured', checked)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Category */}
            <Card>
              <CardHeader>
                <CardTitle>Organization</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select
                    value={watchCategoryId}
                    onValueChange={(value) => {
                      setValue('category_id', value)
                      const cat = flatCategories.find(c => c.id === value)
                      setSelectedCategoryName(cat?.name || '')
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px] overflow-y-auto">
                      {flatCategories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          <span className={category.level > 0 ? 'text-muted-foreground' : ''}>
                            {category.level > 0 ? '└ ' : ''}{category.name}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Select a category or subcategory for your product
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardContent className="pt-6 space-y-3">
                <Button type="submit" className="w-full" disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
                <Button type="button" variant="outline" className="w-full" asChild>
                  <Link href="/products">Cancel</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  )
}
