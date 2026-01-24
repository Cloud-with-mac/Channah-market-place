'use client'

import * as React from 'react'
import { Camera, Loader2 } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/store'
import { authAPI } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:8000'

export function AvatarUpload() {
  const { user, setUser } = useAuthStore()
  const { toast } = useToast()
  const [isUploading, setIsUploading] = React.useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const getInitials = (firstName?: string, lastName?: string) => {
    const first = firstName?.charAt(0) || ''
    const last = lastName?.charAt(0) || ''
    return (first + last).toUpperCase() || 'U'
  }

  // Get full avatar URL (handle relative paths from backend)
  const getAvatarUrl = () => {
    const avatarUrl = user?.avatar_url || user?.avatar
    if (!avatarUrl) return undefined
    // If it's a relative path starting with /uploads, prepend API base URL
    if (avatarUrl.startsWith('/uploads')) {
      return `${API_BASE_URL}${avatarUrl}`
    }
    return avatarUrl
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload an image file.',
        variant: 'destructive',
      })
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Please upload an image smaller than 5MB.',
        variant: 'destructive',
      })
      return
    }

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('avatar', file)

      const response = await authAPI.updateAvatar(formData)
      setUser(response.data)
      toast({
        title: 'Avatar updated',
        description: 'Your profile picture has been updated.',
      })
    } catch (error: any) {
      console.error('Avatar upload error:', error)
      toast({
        title: 'Upload failed',
        description: error?.response?.data?.detail || error?.response?.data?.message || 'Failed to upload avatar.',
        variant: 'destructive',
      })
    } finally {
      setIsUploading(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  return (
    <div className="flex items-center gap-6">
      <div className="relative">
        <Avatar className="h-24 w-24">
          <AvatarImage src={getAvatarUrl()} alt={user?.first_name} />
          <AvatarFallback className="text-2xl bg-primary/10 text-primary">
            {getInitials(user?.first_name, user?.last_name)}
          </AvatarFallback>
        </Avatar>
        {isUploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-full">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}
      </div>

      <div className="space-y-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
          id="avatar-upload"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
        >
          <Camera className="mr-2 h-4 w-4" />
          Change Photo
        </Button>
        <p className="text-xs text-muted-foreground">
          JPG, PNG or GIF. Max size 5MB.
        </p>
      </div>
    </div>
  )
}
