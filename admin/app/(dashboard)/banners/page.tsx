'use client'

import * as React from 'react'
import { useState, useEffect } from 'react'
import {
  Plus,
  Edit,
  Trash2,
  Upload,
  Star,
  Eye,
  EyeOff,
  Image as ImageIcon,
  X,
  Loader2,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { bannersAPI, uploadAPI } from '@/lib/api'

interface Banner {
  id: string
  title: string
  subtitle?: string
  icon?: string
  color_from: string
  color_to: string
  link_url?: string
  image_url?: string
  images?: string[]
  is_active: boolean
  is_featured: boolean
  sort_order: number
  countdown_end?: string
  countdown_label?: string
}

export default function BannersPage() {
  const [banners, setBanners] = useState<Banner[]>([])
  const [loading, setLoading] = useState(true)
  const [showDialog, setShowDialog] = useState(false)
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadedImages, setUploadedImages] = useState<string[]>([])

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    icon: 'flash',
    color_from: '#3b82f6',
    color_to: '#1d4ed8',
    link_url: '/products',
    is_active: true,
    is_featured: false,
    sort_order: 0,
  })

  useEffect(() => {
    fetchBanners()
  }, [])

  const fetchBanners = async () => {
    setLoading(true)
    try {
      const data = await bannersAPI.getAll()
      setBanners(data)
    } catch (error) {
      console.error('Failed to fetch banners:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setEditingBanner(null)
    setUploadedImages([])
    setFormData({
      title: '',
      subtitle: '',
      icon: 'flash',
      color_from: '#3b82f6',
      color_to: '#1d4ed8',
      link_url: '/products',
      is_active: true,
      is_featured: false,
      sort_order: 0,
    })
    setShowDialog(true)
  }

  const handleEdit = (banner: Banner) => {
    setEditingBanner(banner)
    setUploadedImages(banner.images || [])
    setFormData({
      title: banner.title,
      subtitle: banner.subtitle || '',
      icon: banner.icon || 'flash',
      color_from: banner.color_from,
      color_to: banner.color_to,
      link_url: banner.link_url || '/products',
      is_active: banner.is_active,
      is_featured: banner.is_featured,
      sort_order: banner.sort_order,
    })
    setShowDialog(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this banner?')) return
    try {
      await bannersAPI.delete(id)
      fetchBanners()
    } catch (error) {
      console.error('Failed to delete banner:', error)
      alert('Failed to delete banner')
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    try {
      const newImages: string[] = []
      for (let i = 0; i < Math.min(files.length, 10); i++) {
        const file = files[i]
        const result = await uploadAPI.uploadImage(file)
        newImages.push(result.url)
      }
      setUploadedImages([...uploadedImages, ...newImages])
    } catch (error) {
      console.error('Failed to upload images:', error)
      alert('Failed to upload images')
    } finally {
      setUploading(false)
    }
  }

  const removeImage = (index: number) => {
    setUploadedImages(uploadedImages.filter((_, i) => i !== index))
  }

  const handleSubmit = async () => {
    try {
      const payload = {
        ...formData,
        images: JSON.stringify(uploadedImages),
      }

      if (editingBanner) {
        await bannersAPI.update(editingBanner.id, payload)
      } else {
        await bannersAPI.create(payload)
      }

      setShowDialog(false)
      fetchBanners()
    } catch (error) {
      console.error('Failed to save banner:', error)
      alert('Failed to save banner')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-display">Banner Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage homepage banners and featured advertisements
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Create Banner
        </Button>
      </div>

      {/* Banners Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {banners.map((banner) => (
          <Card key={banner.id}>
            <CardHeader
              className="pb-3"
              style={{
                background: `linear-gradient(to bottom right, ${banner.color_from}, ${banner.color_to})`,
              }}
            >
              <div className="flex items-start justify-between text-white">
                <div className="flex-1">
                  <CardTitle className="text-lg">{banner.title}</CardTitle>
                  {banner.subtitle && (
                    <p className="text-sm text-white/80 mt-1">{banner.subtitle}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  {banner.is_featured && (
                    <Badge variant="secondary" className="bg-white/20 text-white border-0">
                      <Star className="h-3 w-3 mr-1" />
                      Featured
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-3">
                {/* Images Preview */}
                {banner.images && banner.images.length > 0 && (
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {banner.images.map((img, i) => (
                      <div key={i} className="relative w-16 h-16 shrink-0 rounded-md overflow-hidden bg-muted">
                        <img src={img} alt="" className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-2 text-sm">
                  <Badge variant={banner.is_active ? 'default' : 'secondary'}>
                    {banner.is_active ? (
                      <>
                        <Eye className="h-3 w-3 mr-1" />
                        Active
                      </>
                    ) : (
                      <>
                        <EyeOff className="h-3 w-3 mr-1" />
                        Inactive
                      </>
                    )}
                  </Badge>
                  <span className="text-muted-foreground">Order: {banner.sort_order}</span>
                </div>

                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleEdit(banner)} className="flex-1">
                    <Edit className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(banner.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingBanner ? 'Edit Banner' : 'Create Banner'}</DialogTitle>
            <DialogDescription>
              {editingBanner ? 'Update banner details' : 'Add a new banner to the homepage'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Title */}
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g. Up to 70% Off Everything"
              />
            </div>

            {/* Subtitle */}
            <div>
              <Label htmlFor="subtitle">Subtitle</Label>
              <Textarea
                id="subtitle"
                value={formData.subtitle}
                onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                placeholder="e.g. Limited time offer on thousands of products"
                rows={2}
              />
            </div>

            {/* Colors */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="color_from">Gradient Start Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="color_from"
                    type="color"
                    value={formData.color_from}
                    onChange={(e) => setFormData({ ...formData, color_from: e.target.value })}
                    className="w-16 h-10"
                  />
                  <Input
                    value={formData.color_from}
                    onChange={(e) => setFormData({ ...formData, color_from: e.target.value })}
                    placeholder="#3b82f6"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="color_to">Gradient End Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="color_to"
                    type="color"
                    value={formData.color_to}
                    onChange={(e) => setFormData({ ...formData, color_to: e.target.value })}
                    className="w-16 h-10"
                  />
                  <Input
                    value={formData.color_to}
                    onChange={(e) => setFormData({ ...formData, color_to: e.target.value })}
                    placeholder="#1d4ed8"
                  />
                </div>
              </div>
            </div>

            {/* Link URL */}
            <div>
              <Label htmlFor="link_url">Link URL</Label>
              <Input
                id="link_url"
                value={formData.link_url}
                onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
                placeholder="/products"
              />
            </div>

            {/* Icon */}
            <div>
              <Label htmlFor="icon">Icon (Ionicons name)</Label>
              <Input
                id="icon"
                value={formData.icon}
                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                placeholder="flash"
              />
            </div>

            {/* Image Upload */}
            <div>
              <Label>Banner Images (up to 10)</Label>
              <div className="mt-2 space-y-3">
                <div className="flex items-center gap-2">
                  <Input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    disabled={uploading || uploadedImages.length >= 10}
                    className="flex-1"
                  />
                  {uploading && <Loader2 className="h-4 w-4 animate-spin" />}
                </div>

                {uploadedImages.length > 0 && (
                  <div className="grid grid-cols-5 gap-2">
                    {uploadedImages.map((img, i) => (
                      <div key={i} className="relative group">
                        <div className="aspect-square rounded-md overflow-hidden bg-muted">
                          <img src={img} alt="" className="w-full h-full object-cover" />
                        </div>
                        <button
                          onClick={() => removeImage(i)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Settings */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="sort_order">Sort Order</Label>
                <Input
                  id="sort_order"
                  type="number"
                  value={formData.sort_order}
                  onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-3 pt-6">
                <div className="flex items-center justify-between">
                  <Label htmlFor="is_active" className="cursor-pointer">Active</Label>
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="is_featured" className="cursor-pointer">Featured (Large Ad)</Label>
                  <Switch
                    id="is_featured"
                    checked={formData.is_featured}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked })}
                  />
                </div>
              </div>
            </div>

            {/* Preview */}
            <div>
              <Label>Preview</Label>
              <div
                className="mt-2 p-6 rounded-lg text-white"
                style={{
                  background: `linear-gradient(to bottom right, ${formData.color_from}, ${formData.color_to})`,
                }}
              >
                <h3 className="text-xl font-bold">{formData.title || 'Banner Title'}</h3>
                <p className="text-sm mt-1 text-white/80">{formData.subtitle || 'Banner subtitle'}</p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={!formData.title}>
              {editingBanner ? 'Update' : 'Create'} Banner
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
