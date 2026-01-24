'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Upload, X, Loader2, ImagePlus, Link as LinkIcon } from 'lucide-react'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { vendorProductsAPI, categoriesAPI, uploadAPI } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'
import { vendorCurrencies } from '@/store'
import { VariantManager, ProductVariantData, generateVariantsForAPI } from '@/components/vendor/variant-manager'

const productSchema = z.object({
  name: z.string().min(1, 'Product name is required').max(200),
  description: z.string().min(1, 'Description is required'),
  short_description: z.string().optional(),
  price: z.number().min(0.01, 'Price must be greater than 0'),
  compare_at_price: z.number().optional().nullable(),
  cost_price: z.number().optional().nullable(),
  currency: z.string().default('GBP'),
  sku: z.string().optional(),
  barcode: z.string().optional(),
  quantity: z.number().min(0, 'Stock cannot be negative'),
  low_stock_threshold: z.number().min(0).optional(),
  weight: z.number().optional().nullable(),
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

interface ImageItem {
  url: string
  file?: File
  uploading?: boolean
}

export default function NewProductPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = React.useState(false)
  const [categoryTree, setCategoryTree] = React.useState<Category[]>([])
  const [flatCategories, setFlatCategories] = React.useState<Array<{ id: string; name: string; displayName: string; level: number; fullPath: string }>>([])
  const [images, setImages] = React.useState<ImageItem[]>([])
  const [imageUrl, setImageUrl] = React.useState('')
  const [isDragging, setIsDragging] = React.useState(false)
  const [isUploading, setIsUploading] = React.useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const [variantData, setVariantData] = React.useState<ProductVariantData>({
    hasVariants: false,
    sizeType: 'clothing',
    variantTypes: [],
    variants: [],
  })
  const [selectedCategoryName, setSelectedCategoryName] = React.useState<string>('')

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ProductForm>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      description: '',
      short_description: '',
      price: 0,
      compare_at_price: null,
      cost_price: null,
      currency: 'GBP',
      sku: '',
      barcode: '',
      quantity: 0,
      low_stock_threshold: 5,
      weight: null,
      category_id: '',
      status: 'draft',
      is_featured: false,
    },
  })

  const watchStatus = watch('status')
  const watchIsFeatured = watch('is_featured')
  const watchCurrency = watch('currency')

  React.useEffect(() => {
    const fetchCategories = async () => {
      // Helper to fetch flat list
      const fetchFlatList = async () => {
        const flatResponse = await categoriesAPI.list()
        const cats = flatResponse.data || []
        setCategoryTree(cats)
        setFlatCategories(cats.map((c: Category) => ({
          id: c.id,
          name: c.name,
          displayName: c.name,
          level: 0,
          fullPath: c.name,
        })))
      }

      try {
        const response = await categoriesAPI.getTree()
        const tree = response.data || []

        // If tree is empty, try flat list instead
        if (tree.length === 0) {
          await fetchFlatList()
        } else {
          setCategoryTree(tree)
          setFlatCategories(flattenCategories(tree))
        }
      } catch (error) {
        console.error('Failed to fetch categories tree:', error)
        // Fallback to flat list if tree fails
        try {
          await fetchFlatList()
        } catch (e) {
          console.error('Failed to fetch categories fallback:', e)
        }
      }
    }
    fetchCategories()
  }, [])

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
      return null
    }
  }

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return

    setIsUploading(true)
    const newImages: ImageItem[] = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      if (!file.type.startsWith('image/')) {
        toast({
          title: 'Invalid file',
          description: `${file.name} is not an image`,
          variant: 'destructive',
        })
        continue
      }

      // Create preview
      const previewUrl = URL.createObjectURL(file)
      newImages.push({ url: previewUrl, file, uploading: true })
    }

    setImages(prev => [...prev, ...newImages])

    // Upload files
    for (let i = 0; i < newImages.length; i++) {
      const img = newImages[i]
      if (img.file) {
        const uploadedUrl = await uploadFile(img.file)
        if (uploadedUrl) {
          setImages(prev => prev.map(item =>
            item.url === img.url
              ? { url: uploadedUrl, uploading: false }
              : item
          ))
        } else {
          // Remove failed upload
          setImages(prev => prev.filter(item => item.url !== img.url))
          toast({
            title: 'Upload failed',
            description: `Failed to upload ${img.file?.name}`,
            variant: 'destructive',
          })
        }
      }
    }

    setIsUploading(false)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    handleFileSelect(e.dataTransfer.files)
  }

  const addImageUrl = () => {
    if (imageUrl && !images.find(img => img.url === imageUrl)) {
      setImages([...images, { url: imageUrl }])
      setImageUrl('')
    }
  }

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index))
  }

  const onSubmit = async (data: ProductForm) => {
    // Check if any images are still uploading
    if (images.some(img => img.uploading)) {
      toast({
        title: 'Please wait',
        description: 'Images are still uploading',
        variant: 'destructive',
      })
      return
    }

    setIsLoading(true)
    try {
      // Generate variants for API
      const variants = generateVariantsForAPI(variantData, data.price)

      const productData = {
        ...data,
        images: images.map(img => ({ url: img.url })),
        variants: variants.length > 0 ? variants : undefined,
      }

      await vendorProductsAPI.create(productData)

      toast({
        title: 'Success',
        description: 'Product created successfully',
      })

      router.push('/products')
    } catch (error: any) {
      console.error('Failed to create product:', error)
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to create product',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/products">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold font-display">Add Product</h1>
          <p className="text-muted-foreground">Create a new product listing</p>
        </div>
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
                <CardDescription>Upload images or add from URL</CardDescription>
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
                      className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
                        isDragging
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={(e) => handleFileSelect(e.target.files)}
                      />
                      <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
                      <p className="text-sm font-medium mb-1">
                        {isDragging ? 'Drop images here' : 'Drag & drop images here'}
                      </p>
                      <p className="text-xs text-muted-foreground mb-3">or click to browse</p>
                      <Button type="button" variant="outline" size="sm">
                        <ImagePlus className="h-4 w-4 mr-2" />
                        Select Images
                      </Button>
                      <p className="text-xs text-muted-foreground mt-3">
                        Supports: JPG, PNG, GIF, WebP (max 10MB)
                      </p>
                    </div>
                  </TabsContent>

                  <TabsContent value="url" className="mt-4">
                    <div className="flex gap-2">
                      <Input
                        placeholder="https://example.com/image.jpg"
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addImageUrl())}
                      />
                      <Button type="button" variant="outline" onClick={addImageUrl}>
                        <ImagePlus className="h-4 w-4 mr-2" />
                        Add
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Enter a direct link to an image
                    </p>
                  </TabsContent>
                </Tabs>

                {/* Image Previews */}
                {images.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
                    {images.map((img, index) => (
                      <div key={index} className="relative group aspect-square rounded-lg overflow-hidden bg-muted">
                        <img
                          src={img.url}
                          alt={`Product image ${index + 1}`}
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/200?text=Image+Error'
                          }}
                        />
                        {img.uploading && (
                          <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-2 right-2 p-1 rounded-full bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-4 w-4" />
                        </button>
                        {index === 0 && !img.uploading && (
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
                    <p className="text-xs text-muted-foreground">Original price for showing discounts</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="currency">Currency</Label>
                    <Select
                      value={watchCurrency}
                      onValueChange={(value) => setValue('currency', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                      <SelectContent>
                        {vendorCurrencies.map((curr) => (
                          <SelectItem key={curr.code} value={curr.code}>
                            <span className="flex items-center gap-2">
                              <span>{curr.flag}</span>
                              <span>{curr.code}</span>
                              <span className="text-muted-foreground">- {curr.name}</span>
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">Currency for your product pricing</p>
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
                    <p className="text-xs text-muted-foreground">For profit calculations (not shown to customers)</p>
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
                    <p className="text-xs text-muted-foreground">Get notified when stock falls below</p>
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
                    onValueChange={(value) => {
                      setValue('category_id', value)
                      const cat = flatCategories.find(c => c.id === value)
                      setSelectedCategoryName(cat?.name || '')
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
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
                <Button type="submit" className="w-full" disabled={isLoading || isUploading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : isUploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    'Create Product'
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
