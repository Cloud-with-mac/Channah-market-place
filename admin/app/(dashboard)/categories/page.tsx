'use client'

import * as React from 'react'
import {
  FolderTree,
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  ChevronRight,
  ChevronDown,
  GripVertical,
  ImageIcon,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { useToast } from '@/hooks/use-toast'
import { adminCategoriesAPI } from '@/lib/api'

interface Category {
  id: string
  name: string
  slug: string
  description?: string
  image_url?: string
  parent_id?: string
  product_count: number
  is_active: boolean
  children?: Category[]
}

export default function CategoriesPage() {
  const { toast } = useToast()
  const [categories, setCategories] = React.useState<Category[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [expandedCategories, setExpandedCategories] = React.useState<Set<string>>(new Set())
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [editingCategory, setEditingCategory] = React.useState<Category | null>(null)
  const [categoryToDelete, setCategoryToDelete] = React.useState<Category | null>(null)
  const [isProcessing, setIsProcessing] = React.useState(false)

  // Form state
  const [formData, setFormData] = React.useState({
    name: '',
    slug: '',
    description: '',
    image_url: '',
    parent_id: '',
    is_active: true,
  })

  const fetchCategories = React.useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await adminCategoriesAPI.list()
      setCategories(response.data || [])
    } catch (error) {
      console.error('Failed to fetch categories:', error)
      setCategories([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  const toggleExpanded = (categoryId: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev)
      if (next.has(categoryId)) {
        next.delete(categoryId)
      } else {
        next.add(categoryId)
      }
      return next
    })
  }

  const openCreateDialog = (parentId?: string) => {
    setEditingCategory(null)
    setFormData({
      name: '',
      slug: '',
      description: '',
      image_url: '',
      parent_id: parentId || '',
      is_active: true,
    })
    setIsDialogOpen(true)
  }

  const openEditDialog = (category: Category) => {
    setEditingCategory(category)
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      image_url: category.image_url || '',
      parent_id: category.parent_id || '',
      is_active: category.is_active,
    })
    setIsDialogOpen(true)
  }

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
  }

  const handleNameChange = (name: string) => {
    setFormData((prev) => ({
      ...prev,
      name,
      slug: editingCategory ? prev.slug : generateSlug(name),
    }))
  }

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast({
        title: 'Error',
        description: 'Category name is required.',
        variant: 'destructive',
      })
      return
    }

    try {
      setIsProcessing(true)
      if (editingCategory) {
        await adminCategoriesAPI.update(editingCategory.id, formData)
        toast({
          title: 'Category Updated',
          description: `${formData.name} has been updated.`,
        })
      } else {
        await adminCategoriesAPI.create(formData)
        toast({
          title: 'Category Created',
          description: `${formData.name} has been created.`,
        })
      }
      fetchCategories()
      setIsDialogOpen(false)
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to save category.',
        variant: 'destructive',
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDelete = async () => {
    if (!categoryToDelete) return
    try {
      setIsProcessing(true)
      await adminCategoriesAPI.delete(categoryToDelete.id)
      toast({
        title: 'Category Deleted',
        description: `${categoryToDelete.name} has been deleted.`,
      })
      fetchCategories()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to delete category.',
        variant: 'destructive',
      })
    } finally {
      setIsProcessing(false)
      setCategoryToDelete(null)
    }
  }

  // Get flat list for parent selection
  const getFlatCategories = (cats: Category[], depth = 0): { id: string; name: string; depth: number }[] => {
    const result: { id: string; name: string; depth: number }[] = []
    for (const cat of cats) {
      result.push({ id: cat.id, name: cat.name, depth })
      if (cat.children) {
        result.push(...getFlatCategories(cat.children, depth + 1))
      }
    }
    return result
  }

  const flatCategories = getFlatCategories(categories)

  // Render category tree item
  const renderCategoryItem = (category: Category, depth: number = 0) => {
    const hasChildren = category.children && category.children.length > 0
    const isExpanded = expandedCategories.has(category.id)

    return (
      <div key={category.id}>
        <div
          className={`flex items-center gap-2 p-3 hover:bg-muted/50 transition-colors border-b`}
          style={{ paddingLeft: `${depth * 24 + 12}px` }}
        >
          <div className="w-6 flex justify-center">
            {hasChildren ? (
              <button
                onClick={() => toggleExpanded(category.id)}
                className="p-0.5 hover:bg-muted rounded"
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </button>
            ) : (
              <div className="w-4" />
            )}
          </div>

          <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
            {category.image_url ? (
              <img
                src={category.image_url}
                alt={category.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <FolderTree className="h-5 w-5 text-muted-foreground" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-medium truncate">{category.name}</p>
              {!category.is_active && (
                <Badge variant="secondary">Inactive</Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {category.product_count} products • /{category.slug}
            </p>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => openCreateDialog(category.id)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Subcategory
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => openEditDialog(category)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => setCategoryToDelete(category)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Render children if expanded */}
        {hasChildren && isExpanded && (
          <div>
            {category.children!.map((child) => renderCategoryItem(child, depth + 1))}
          </div>
        )}
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Card>
          <CardContent className="p-0">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 m-4" />
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
          <h1 className="text-2xl font-bold font-display">Category Management</h1>
          <p className="text-muted-foreground">
            Organize products with categories and subcategories.
          </p>
        </div>
        <Button onClick={() => openCreateDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          Add Category
        </Button>
      </div>

      {/* Categories Tree */}
      <Card>
        <CardHeader className="pb-0">
          <CardTitle className="text-lg">Category Hierarchy</CardTitle>
        </CardHeader>
        <CardContent className="p-0 mt-4">
          {categories.length > 0 ? (
            <div className="border-t">
              {categories.map((category) => renderCategoryItem(category))}
            </div>
          ) : (
            <div className="p-8 text-center text-muted-foreground border-t">
              <FolderTree className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No categories found</p>
              <Button className="mt-4" onClick={() => openCreateDialog()}>
                <Plus className="mr-2 h-4 w-4" />
                Create First Category
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? 'Edit Category' : 'Create Category'}
            </DialogTitle>
            <DialogDescription>
              {editingCategory
                ? 'Update the category details below.'
                : 'Fill in the details to create a new category.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. Electronics"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder="e.g. electronics"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="image_url">Image URL</Label>
              <div className="flex gap-2">
                <Input
                  id="image_url"
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                  className="flex-1"
                />
                {formData.image_url && (
                  <div className="h-10 w-10 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                    <img
                      src={formData.image_url}
                      alt="Preview"
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none'
                      }}
                    />
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Image displayed in category carousel on the customer app
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="parent">Parent Category</Label>
              <Select
                value={formData.parent_id || '__none__'}
                onValueChange={(value) => setFormData({ ...formData, parent_id: value === '__none__' ? '' : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="None (Top Level)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None (Top Level)</SelectItem>
                  {flatCategories
                    .filter((c) => c.id !== editingCategory?.id)
                    .map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {'  '.repeat(cat.depth)}{cat.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optional category description..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isProcessing}>
              {isProcessing ? 'Saving...' : editingCategory ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!categoryToDelete} onOpenChange={() => setCategoryToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Category</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{categoryToDelete?.name}</strong>?
              {categoryToDelete?.product_count && categoryToDelete.product_count > 0 && (
                <span className="block mt-2 text-warning">
                  Warning: This category has {categoryToDelete.product_count} products.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCategoryToDelete(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isProcessing}>
              {isProcessing ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
