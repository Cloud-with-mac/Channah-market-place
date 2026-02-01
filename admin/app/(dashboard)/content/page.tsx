'use client'

import * as React from 'react'
import {
  Image as ImageIcon,
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Calendar,
  MoreVertical,
  Upload,
  Link2,
  Tag,
  Percent,
  Clock,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  GripVertical,
  Loader2,
  RefreshCw,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatRelativeTime } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { contentAPI, uploadAPI } from '@/lib/api'

interface Banner {
  id: string
  title: string
  image_url: string
  link_url: string
  position: string
  is_active: boolean
  start_date: string
  end_date: string
  clicks: number
  impressions: number
}

interface Promotion {
  id: string
  name: string
  code: string
  type: 'percentage' | 'fixed'
  value: number
  min_order: number
  max_uses: number
  used_count: number
  is_active: boolean
  start_date: string
  end_date: string
}

interface Announcement {
  id: string
  text: string
  type: 'info' | 'success' | 'warning' | 'error'
  is_active: boolean
  priority: number
}

export default function ContentPage() {
  const { toast } = useToast()

  // Loading states
  const [loadingBanners, setLoadingBanners] = React.useState(true)
  const [loadingPromotions, setLoadingPromotions] = React.useState(true)
  const [loadingAnnouncements, setLoadingAnnouncements] = React.useState(true)
  const [saving, setSaving] = React.useState(false)
  const [uploading, setUploading] = React.useState(false)

  // File upload state
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  // Dialog states
  const [showBannerDialog, setShowBannerDialog] = React.useState(false)
  const [showPromoDialog, setShowPromoDialog] = React.useState(false)
  const [showAnnouncementDialog, setShowAnnouncementDialog] = React.useState(false)

  // Delete confirmation dialog states
  const [deleteConfirmOpen, setDeleteConfirmOpen] = React.useState(false)
  const [itemToDelete, setItemToDelete] = React.useState<{ type: 'banner' | 'promotion' | 'announcement', id: string } | null>(null)

  // Edit states
  const [editingBanner, setEditingBanner] = React.useState<Banner | null>(null)
  const [editingPromo, setEditingPromo] = React.useState<Promotion | null>(null)
  const [editingAnnouncement, setEditingAnnouncement] = React.useState<Announcement | null>(null)

  // Form states
  const [bannerForm, setBannerForm] = React.useState({
    title: '',
    image_url: '',
    link_url: '',
    position: 'hero',
    is_active: true,
    start_date: '',
    end_date: '',
  })

  const [promoForm, setPromoForm] = React.useState({
    name: '',
    code: '',
    type: 'percentage' as 'percentage' | 'fixed',
    value: 0,
    min_order: 0,
    max_uses: 100,
    is_active: true,
    start_date: '',
    end_date: '',
  })

  const [announcementForm, setAnnouncementForm] = React.useState({
    text: '',
    type: 'info' as 'info' | 'success' | 'warning' | 'error',
    is_active: true,
    priority: 0,
  })

  // Data states
  const [banners, setBanners] = React.useState<Banner[]>([])
  const [promotions, setPromotions] = React.useState<Promotion[]>([])
  const [announcements, setAnnouncements] = React.useState<Announcement[]>([])

  // Fetch data on mount
  React.useEffect(() => {
    fetchBanners()
    fetchPromotions()
    fetchAnnouncements()
  }, [])

  const fetchBanners = async () => {
    try {
      setLoadingBanners(true)
      const response = await contentAPI.getBanners()
      // Ensure we always set an array
      setBanners(Array.isArray(response.data) ? response.data : [])
    } catch (error) {
      console.error('Failed to fetch banners:', error)
      setBanners([]) // Reset to empty array on error
      toast({
        title: 'Error',
        description: 'Failed to load banners',
        variant: 'destructive',
      })
    } finally {
      setLoadingBanners(false)
    }
  }

  const fetchPromotions = async () => {
    try {
      setLoadingPromotions(true)
      const response = await contentAPI.getPromotions()
      // Ensure we always set an array
      setPromotions(Array.isArray(response.data) ? response.data : [])
    } catch (error) {
      console.error('Failed to fetch promotions:', error)
      setPromotions([]) // Reset to empty array on error
      toast({
        title: 'Error',
        description: 'Failed to load promotions',
        variant: 'destructive',
      })
    } finally {
      setLoadingPromotions(false)
    }
  }

  const fetchAnnouncements = async () => {
    try {
      setLoadingAnnouncements(true)
      const response = await contentAPI.getAnnouncements()
      // Ensure we always set an array
      setAnnouncements(Array.isArray(response.data) ? response.data : [])
    } catch (error) {
      console.error('Failed to fetch announcements:', error)
      setAnnouncements([]) // Reset to empty array on error
      toast({
        title: 'Error',
        description: 'Failed to load announcements',
        variant: 'destructive',
      })
    } finally {
      setLoadingAnnouncements(false)
    }
  }

  // File upload handler
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      // Create preview URL
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
    }
  }

  const clearFileSelection = () => {
    setSelectedFile(null)
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Banner handlers
  const handleOpenBannerDialog = (banner?: Banner) => {
    // Clear any previous file selection
    clearFileSelection()

    if (banner) {
      setEditingBanner(banner)
      setBannerForm({
        title: banner.title,
        image_url: banner.image_url,
        link_url: banner.link_url,
        position: banner.position,
        is_active: banner.is_active,
        start_date: banner.start_date,
        end_date: banner.end_date,
      })
      // If banner has an image, set it as preview
      if (banner.image_url) {
        setPreviewUrl(banner.image_url.startsWith('/') ? `${(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1').replace('/api/v1', '')}${banner.image_url}` : banner.image_url)
      }
    } else {
      setEditingBanner(null)
      setBannerForm({
        title: '',
        image_url: '',
        link_url: '',
        position: 'hero',
        is_active: true,
        start_date: '',
        end_date: '',
      })
    }
    setShowBannerDialog(true)
  }

  const handleSaveBanner = async () => {
    try {
      setSaving(true)

      let imageUrl = bannerForm.image_url

      // Upload file first if one is selected
      if (selectedFile) {
        setUploading(true)
        try {
          const uploadResponse = await uploadAPI.uploadFile(selectedFile)
          imageUrl = uploadResponse.data.url
        } catch (uploadError) {
          console.error('Failed to upload image:', uploadError)
          toast({
            title: 'Upload Error',
            description: 'Failed to upload image. Please try again.',
            variant: 'destructive',
          })
          return
        } finally {
          setUploading(false)
        }
      }

      const bannerData = { ...bannerForm, image_url: imageUrl }

      if (editingBanner) {
        await contentAPI.updateBanner(editingBanner.id, bannerData)
        toast({ title: 'Banner Updated', description: 'Banner has been updated successfully.' })
      } else {
        await contentAPI.createBanner(bannerData)
        toast({ title: 'Banner Created', description: 'Banner has been created successfully.' })
      }
      setShowBannerDialog(false)
      clearFileSelection()
      fetchBanners()
    } catch (error) {
      console.error('Failed to save banner:', error)
      toast({
        title: 'Error',
        description: 'Failed to save banner',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleToggleBanner = async (bannerId: string) => {
    try {
      await contentAPI.toggleBanner(bannerId)
      setBanners(banners.map(b =>
        b.id === bannerId ? { ...b, is_active: !b.is_active } : b
      ))
      toast({
        title: 'Banner Updated',
        description: 'Banner status has been updated.',
      })
    } catch (error) {
      console.error('Failed to toggle banner:', error)
      toast({
        title: 'Error',
        description: 'Failed to update banner status',
        variant: 'destructive',
      })
    }
  }

  const handleDeleteBanner = async (bannerId: string) => {
    try {
      await contentAPI.deleteBanner(bannerId)
      setBanners(banners.filter(b => b.id !== bannerId))
      toast({
        title: 'Banner Deleted',
        description: 'Banner has been removed.',
      })
    } catch (error) {
      console.error('Failed to delete banner:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete banner',
        variant: 'destructive',
      })
    }
  }

  // Promotion handlers
  const handleOpenPromoDialog = (promo?: Promotion) => {
    if (promo) {
      setEditingPromo(promo)
      setPromoForm({
        name: promo.name,
        code: promo.code,
        type: promo.type,
        value: promo.value,
        min_order: promo.min_order,
        max_uses: promo.max_uses,
        is_active: promo.is_active,
        start_date: promo.start_date,
        end_date: promo.end_date,
      })
    } else {
      setEditingPromo(null)
      setPromoForm({
        name: '',
        code: '',
        type: 'percentage',
        value: 0,
        min_order: 0,
        max_uses: 100,
        is_active: true,
        start_date: '',
        end_date: '',
      })
    }
    setShowPromoDialog(true)
  }

  const handleSavePromo = async () => {
    try {
      setSaving(true)
      if (editingPromo) {
        await contentAPI.updatePromotion(editingPromo.id, promoForm)
        toast({ title: 'Promotion Updated', description: 'Promotion has been updated successfully.' })
      } else {
        await contentAPI.createPromotion(promoForm)
        toast({ title: 'Promotion Created', description: 'Promotion has been created successfully.' })
      }
      setShowPromoDialog(false)
      fetchPromotions()
    } catch (error) {
      console.error('Failed to save promotion:', error)
      toast({
        title: 'Error',
        description: 'Failed to save promotion',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleTogglePromo = async (promoId: string) => {
    try {
      await contentAPI.togglePromotion(promoId)
      setPromotions(promotions.map(p =>
        p.id === promoId ? { ...p, is_active: !p.is_active } : p
      ))
      toast({
        title: 'Promotion Updated',
        description: 'Promotion status has been updated.',
      })
    } catch (error) {
      console.error('Failed to toggle promotion:', error)
      toast({
        title: 'Error',
        description: 'Failed to update promotion status',
        variant: 'destructive',
      })
    }
  }

  const handleDeletePromo = async (promoId: string) => {
    try {
      await contentAPI.deletePromotion(promoId)
      setPromotions(promotions.filter(p => p.id !== promoId))
      toast({
        title: 'Promotion Deleted',
        description: 'Promotion has been removed.',
      })
    } catch (error) {
      console.error('Failed to delete promotion:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete promotion',
        variant: 'destructive',
      })
    }
  }

  // Announcement handlers
  const handleOpenAnnouncementDialog = (announcement?: Announcement) => {
    if (announcement) {
      setEditingAnnouncement(announcement)
      setAnnouncementForm({
        text: announcement.text,
        type: announcement.type,
        is_active: announcement.is_active,
        priority: announcement.priority,
      })
    } else {
      setEditingAnnouncement(null)
      setAnnouncementForm({
        text: '',
        type: 'info',
        is_active: true,
        priority: 0,
      })
    }
    setShowAnnouncementDialog(true)
  }

  const handleSaveAnnouncement = async () => {
    try {
      setSaving(true)
      if (editingAnnouncement) {
        await contentAPI.updateAnnouncement(editingAnnouncement.id, announcementForm)
        toast({ title: 'Announcement Updated', description: 'Announcement has been updated successfully.' })
      } else {
        await contentAPI.createAnnouncement(announcementForm)
        toast({ title: 'Announcement Created', description: 'Announcement has been created successfully.' })
      }
      setShowAnnouncementDialog(false)
      fetchAnnouncements()
    } catch (error) {
      console.error('Failed to save announcement:', error)
      toast({
        title: 'Error',
        description: 'Failed to save announcement',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleToggleAnnouncement = async (announcementId: string) => {
    try {
      await contentAPI.toggleAnnouncement(announcementId)
      setAnnouncements(announcements.map(a =>
        a.id === announcementId ? { ...a, is_active: !a.is_active } : a
      ))
      toast({
        title: 'Announcement Updated',
        description: 'Announcement status has been updated.',
      })
    } catch (error) {
      console.error('Failed to toggle announcement:', error)
      toast({
        title: 'Error',
        description: 'Failed to update announcement status',
        variant: 'destructive',
      })
    }
  }

  const handleDeleteAnnouncement = async (announcementId: string) => {
    try {
      await contentAPI.deleteAnnouncement(announcementId)
      setAnnouncements(announcements.filter(a => a.id !== announcementId))
      toast({
        title: 'Announcement Deleted',
        description: 'Announcement has been removed.',
      })
    } catch (error) {
      console.error('Failed to delete announcement:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete announcement',
        variant: 'destructive',
      })
    }
  }

  // Delete confirmation handler
  const handleConfirmDelete = async () => {
    if (!itemToDelete) return

    switch (itemToDelete.type) {
      case 'banner':
        await handleDeleteBanner(itemToDelete.id)
        break
      case 'promotion':
        await handleDeletePromo(itemToDelete.id)
        break
      case 'announcement':
        await handleDeleteAnnouncement(itemToDelete.id)
        break
    }

    setDeleteConfirmOpen(false)
    setItemToDelete(null)
  }

  const openDeleteConfirm = (type: 'banner' | 'promotion' | 'announcement', id: string) => {
    setItemToDelete({ type, id })
    setDeleteConfirmOpen(true)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display">Content Management</h1>
          <p className="text-muted-foreground">
            Manage banners, promotions, and marketing content
          </p>
        </div>
      </div>

      <Tabs defaultValue="banners" className="space-y-4">
        <TabsList>
          <TabsTrigger value="banners">Banners</TabsTrigger>
          <TabsTrigger value="promotions">Promotions</TabsTrigger>
          <TabsTrigger value="announcements">Announcements</TabsTrigger>
        </TabsList>

        {/* Banners Tab */}
        <TabsContent value="banners">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Banner Management</CardTitle>
                  <CardDescription>Create and manage promotional banners</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" onClick={fetchBanners}>
                    <RefreshCw className={`h-4 w-4 ${loadingBanners ? 'animate-spin' : ''}`} />
                  </Button>
                  <Button onClick={() => handleOpenBannerDialog()}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Banner
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loadingBanners ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : banners.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <ImageIcon className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold">No banners yet</h3>
                  <p className="text-muted-foreground mb-4">Create your first promotional banner</p>
                  <Button onClick={() => handleOpenBannerDialog()}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Banner
                  </Button>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {banners.map((banner) => (
                    <Card key={banner.id} className="overflow-hidden">
                      <div className="aspect-video bg-muted relative">
                        {banner.image_url ? (
                          <img
                            src={banner.image_url.startsWith('/') ? `${(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1').replace('/api/v1', '')}${banner.image_url}` : banner.image_url}
                            alt={banner.title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none'
                              const parent = (e.target as HTMLImageElement).parentElement
                              if (parent) {
                                const fallback = parent.querySelector('.fallback-icon')
                                if (fallback) (fallback as HTMLElement).style.display = 'flex'
                              }
                            }}
                          />
                        ) : null}
                        <div className={`fallback-icon absolute inset-0 ${banner.image_url ? 'hidden' : 'flex'} items-center justify-center`}>
                          <ImageIcon className="h-12 w-12 text-muted-foreground" />
                        </div>
                        <div className="absolute top-2 right-2">
                          <Badge variant={banner.is_active ? 'success' : 'secondary'}>
                            {banner.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                      </div>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold">{banner.title}</h3>
                            <p className="text-sm text-muted-foreground capitalize">{banner.position}</p>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleOpenBannerDialog(banner)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleToggleBanner(banner.id)}>
                                {banner.is_active ? (
                                  <><EyeOff className="mr-2 h-4 w-4" />Deactivate</>
                                ) : (
                                  <><Eye className="mr-2 h-4 w-4" />Activate</>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => openDeleteConfirm('banner', banner.id)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground">
                          <span>{banner.clicks.toLocaleString()} clicks</span>
                          <span>{banner.impressions.toLocaleString()} views</span>
                        </div>
                        <div className="mt-2 text-xs text-muted-foreground">
                          {banner.start_date && banner.end_date ? (
                            `${new Date(banner.start_date).toLocaleDateString()} - ${new Date(banner.end_date).toLocaleDateString()}`
                          ) : (
                            'No date range set'
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Promotions Tab */}
        <TabsContent value="promotions">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Promotion Codes</CardTitle>
                  <CardDescription>Manage discount codes and promotions</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" onClick={fetchPromotions}>
                    <RefreshCw className={`h-4 w-4 ${loadingPromotions ? 'animate-spin' : ''}`} />
                  </Button>
                  <Button onClick={() => handleOpenPromoDialog()}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Promotion
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loadingPromotions ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : promotions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Tag className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold">No promotions yet</h3>
                  <p className="text-muted-foreground mb-4">Create your first discount promotion</p>
                  <Button onClick={() => handleOpenPromoDialog()}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Promotion
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Promotion</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead>Discount</TableHead>
                      <TableHead>Usage</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Valid Until</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {promotions.map((promo) => (
                      <TableRow key={promo.id}>
                        <TableCell className="font-medium">{promo.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-mono">
                            {promo.code}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {promo.type === 'percentage' ? (
                            <span className="flex items-center gap-1">
                              <Percent className="h-3 w-3" />
                              {promo.value}%
                            </span>
                          ) : (
                            <span>${promo.value}</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span>{promo.used_count} / {promo.max_uses}</span>
                            <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary"
                                style={{ width: `${Math.min((promo.used_count / promo.max_uses) * 100, 100)}%` }}
                              />
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={promo.is_active ? 'success' : 'secondary'}>
                            {promo.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {promo.end_date ? new Date(promo.end_date).toLocaleDateString() : 'No end date'}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleOpenPromoDialog(promo)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleTogglePromo(promo.id)}>
                                {promo.is_active ? (
                                  <><EyeOff className="mr-2 h-4 w-4" />Deactivate</>
                                ) : (
                                  <><Eye className="mr-2 h-4 w-4" />Activate</>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => openDeleteConfirm('promotion', promo.id)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Announcements Tab */}
        <TabsContent value="announcements">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Site Announcements</CardTitle>
                  <CardDescription>Manage announcement bars and notifications</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" onClick={fetchAnnouncements}>
                    <RefreshCw className={`h-4 w-4 ${loadingAnnouncements ? 'animate-spin' : ''}`} />
                  </Button>
                  <Button onClick={() => handleOpenAnnouncementDialog()}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Announcement
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loadingAnnouncements ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : announcements.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Tag className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold">No announcements yet</h3>
                  <p className="text-muted-foreground mb-4">Create your first site announcement</p>
                  <Button onClick={() => handleOpenAnnouncementDialog()}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Announcement
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {announcements.map((announcement) => (
                    <div
                      key={announcement.id}
                      className="flex items-center justify-between p-4 rounded-lg border"
                    >
                      <div className="flex items-center gap-4">
                        <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
                        <Badge variant={announcement.type as any}>{announcement.type}</Badge>
                        <span className="font-medium">{announcement.text}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={announcement.is_active}
                          onCheckedChange={() => handleToggleAnnouncement(announcement.id)}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenAnnouncementDialog(announcement)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openDeleteConfirm('announcement', announcement.id)}
                        >
                          <Trash2 className="h-4 w-4" />
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

      {/* Banner Dialog */}
      <Dialog open={showBannerDialog} onOpenChange={setShowBannerDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingBanner ? 'Edit Banner' : 'Create Banner'}</DialogTitle>
            <DialogDescription>
              {editingBanner ? 'Update banner details' : 'Add a new promotional banner'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="Banner title"
                value={bannerForm.title}
                onChange={(e) => setBannerForm({ ...bannerForm, title: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label>Banner Image</Label>
              <div className="space-y-3">
                {/* Preview area */}
                {previewUrl ? (
                  <div className="relative aspect-video rounded-lg border overflow-hidden bg-muted">
                    <img
                      src={previewUrl}
                      alt="Banner preview"
                      className="w-full h-full object-cover"
                      onError={() => setPreviewUrl(null)}
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 h-8 w-8"
                      onClick={clearFileSelection}
                    >
                      <XCircle className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div
                    className="aspect-video rounded-lg border-2 border-dashed border-muted-foreground/25 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">Click to upload an image</p>
                    <p className="text-xs text-muted-foreground mt-1">PNG, JPG, GIF up to 5MB</p>
                  </div>
                )}
                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileSelect}
                />
                {/* Upload button */}
                {!previewUrl && (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Choose Image
                  </Button>
                )}
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="link">Link URL</Label>
              <Input
                id="link"
                placeholder="/sale or https://..."
                value={bannerForm.link_url}
                onChange={(e) => setBannerForm({ ...bannerForm, link_url: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="position">Position</Label>
                <Select
                  value={bannerForm.position}
                  onValueChange={(value) => setBannerForm({ ...bannerForm, position: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hero">Hero</SelectItem>
                    <SelectItem value="sidebar">Sidebar</SelectItem>
                    <SelectItem value="footer">Footer</SelectItem>
                    <SelectItem value="popup">Popup</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Status</Label>
                <div className="flex items-center space-x-2 pt-2">
                  <Switch
                    id="active"
                    checked={bannerForm.is_active}
                    onCheckedChange={(checked) => setBannerForm({ ...bannerForm, is_active: checked })}
                  />
                  <Label htmlFor="active">Active</Label>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="start">Start Date</Label>
                <Input
                  type="date"
                  id="start"
                  value={bannerForm.start_date}
                  onChange={(e) => setBannerForm({ ...bannerForm, start_date: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="end">End Date</Label>
                <Input
                  type="date"
                  id="end"
                  value={bannerForm.end_date}
                  onChange={(e) => setBannerForm({ ...bannerForm, end_date: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBannerDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveBanner} disabled={saving || uploading || !bannerForm.title}>
              {(saving || uploading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {uploading ? 'Uploading...' : saving ? 'Saving...' : editingBanner ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Promotion Dialog */}
      <Dialog open={showPromoDialog} onOpenChange={setShowPromoDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingPromo ? 'Edit Promotion' : 'Create Promotion'}</DialogTitle>
            <DialogDescription>
              {editingPromo ? 'Update promotion details' : 'Add a new discount promotion'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Promotion Name</Label>
              <Input
                id="name"
                placeholder="e.g., Summer Sale"
                value={promoForm.name}
                onChange={(e) => setPromoForm({ ...promoForm, name: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="code">Promo Code</Label>
              <Input
                id="code"
                placeholder="e.g., SUMMER20"
                className="uppercase"
                value={promoForm.code}
                onChange={(e) => setPromoForm({ ...promoForm, code: e.target.value.toUpperCase() })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="type">Discount Type</Label>
                <Select
                  value={promoForm.type}
                  onValueChange={(value: 'percentage' | 'fixed') => setPromoForm({ ...promoForm, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage</SelectItem>
                    <SelectItem value="fixed">Fixed Amount</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="value">Value</Label>
                <Input
                  id="value"
                  type="number"
                  placeholder="20"
                  value={promoForm.value}
                  onChange={(e) => setPromoForm({ ...promoForm, value: Number(e.target.value) })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="minOrder">Min Order Amount</Label>
                <Input
                  id="minOrder"
                  type="number"
                  placeholder="0"
                  value={promoForm.min_order}
                  onChange={(e) => setPromoForm({ ...promoForm, min_order: Number(e.target.value) })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="maxUses">Max Uses</Label>
                <Input
                  id="maxUses"
                  type="number"
                  placeholder="100"
                  value={promoForm.max_uses}
                  onChange={(e) => setPromoForm({ ...promoForm, max_uses: Number(e.target.value) })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="promoStart">Start Date</Label>
                <Input
                  type="date"
                  id="promoStart"
                  value={promoForm.start_date}
                  onChange={(e) => setPromoForm({ ...promoForm, start_date: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="promoEnd">End Date</Label>
                <Input
                  type="date"
                  id="promoEnd"
                  value={promoForm.end_date}
                  onChange={(e) => setPromoForm({ ...promoForm, end_date: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPromoDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSavePromo} disabled={saving || !promoForm.name || !promoForm.code}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingPromo ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Announcement Dialog */}
      <Dialog open={showAnnouncementDialog} onOpenChange={setShowAnnouncementDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingAnnouncement ? 'Edit Announcement' : 'Create Announcement'}</DialogTitle>
            <DialogDescription>
              {editingAnnouncement ? 'Update announcement details' : 'Add a new site announcement'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="text">Announcement Text</Label>
              <Textarea
                id="text"
                placeholder="e.g., Free shipping on orders over $50!"
                value={announcementForm.text}
                onChange={(e) => setAnnouncementForm({ ...announcementForm, text: e.target.value })}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="announcementType">Type</Label>
                <Select
                  value={announcementForm.type}
                  onValueChange={(value: 'info' | 'success' | 'warning' | 'error') =>
                    setAnnouncementForm({ ...announcementForm, type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="success">Success</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="error">Error</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="priority">Priority</Label>
                <Input
                  id="priority"
                  type="number"
                  placeholder="0"
                  value={announcementForm.priority}
                  onChange={(e) => setAnnouncementForm({ ...announcementForm, priority: Number(e.target.value) })}
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="announcementActive"
                checked={announcementForm.is_active}
                onCheckedChange={(checked) => setAnnouncementForm({ ...announcementForm, is_active: checked })}
              />
              <Label htmlFor="announcementActive">Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAnnouncementDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveAnnouncement} disabled={saving || !announcementForm.text}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingAnnouncement ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the{' '}
              {itemToDelete?.type}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
