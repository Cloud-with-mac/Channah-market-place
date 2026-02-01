'use client'

import * as React from 'react'
import {
  Bell,
  CheckCheck,
  Trash2,
  Package,
  Users,
  Store,
  AlertTriangle,
  Info,
  ShoppingCart,
  Star,
  Settings,
  Filter,
  Search,
  MoreHorizontal,
  Check,
  X,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
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
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/hooks/use-toast'
import { formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { notificationsAPI } from '@/lib/api'

interface Notification {
  id: string
  type: 'order' | 'vendor' | 'user' | 'system' | 'alert' | 'review'
  title: string
  message: string
  read: boolean
  timestamp: string
  link?: string
}


function getNotificationIcon(type: string) {
  switch (type) {
    case 'order':
      return <ShoppingCart className="h-5 w-5" />
    case 'vendor':
      return <Store className="h-5 w-5" />
    case 'user':
      return <Users className="h-5 w-5" />
    case 'alert':
      return <AlertTriangle className="h-5 w-5" />
    case 'review':
      return <Star className="h-5 w-5" />
    case 'system':
      return <Settings className="h-5 w-5" />
    default:
      return <Info className="h-5 w-5" />
  }
}

function getNotificationColor(type: string) {
  switch (type) {
    case 'order':
      return 'bg-cyan/10 text-cyan'
    case 'vendor':
      return 'bg-purple-500/10 text-purple-500'
    case 'user':
      return 'bg-blue-500/10 text-blue-500'
    case 'alert':
      return 'bg-amber-500/10 text-amber-500'
    case 'review':
      return 'bg-yellow-500/10 text-yellow-500'
    case 'system':
      return 'bg-gray-500/10 text-gray-500'
    default:
      return 'bg-muted text-muted-foreground'
  }
}

function getRelativeTime(timestamp: string) {
  const now = new Date()
  const time = new Date(timestamp)
  const diffMs = now.getTime() - time.getTime()
  const diffMins = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return formatDate(timestamp)
}

export default function NotificationsPage() {
  const { toast } = useToast()
  const [notifications, setNotifications] = React.useState<Notification[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [search, setSearch] = React.useState('')
  const [typeFilter, setTypeFilter] = React.useState<string>('all')
  const [readFilter, setReadFilter] = React.useState<string>('all')
  const [selectedNotifications, setSelectedNotifications] = React.useState<string[]>([])

  React.useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const data = await notificationsAPI.list()
        const items = Array.isArray(data) ? data : data?.notifications || data?.items || []
        setNotifications(items)
      } catch (error) {
        console.error('Failed to fetch notifications:', error)
        setNotifications([])
      } finally {
        setIsLoading(false)
      }
    }
    fetchNotifications()
  }, [])

  const filteredNotifications = notifications.filter((notification) => {
    const matchesSearch =
      notification.title.toLowerCase().includes(search.toLowerCase()) ||
      notification.message.toLowerCase().includes(search.toLowerCase())
    const matchesType = typeFilter === 'all' || notification.type === typeFilter
    const matchesRead =
      readFilter === 'all' ||
      (readFilter === 'unread' && !notification.read) ||
      (readFilter === 'read' && notification.read)
    return matchesSearch && matchesType && matchesRead
  })

  const unreadCount = notifications.filter((n) => !n.read).length

  const toggleSelectAll = () => {
    if (selectedNotifications.length === filteredNotifications.length) {
      setSelectedNotifications([])
    } else {
      setSelectedNotifications(filteredNotifications.map((n) => n.id))
    }
  }

  const toggleSelect = (id: string) => {
    setSelectedNotifications((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }

  const handleMarkAsRead = async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    )
    try {
      await notificationsAPI.markAsRead(id)
    } catch (error) {
      console.error('Failed to mark as read:', error)
    }
    toast({
      title: 'Marked as read',
      description: 'Notification has been marked as read.',
    })
  }

  const handleMarkAsUnread = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: false } : n))
    )
    toast({
      title: 'Marked as unread',
      description: 'Notification has been marked as unread.',
    })
  }

  const handleDelete = async (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
    setSelectedNotifications((prev) => prev.filter((i) => i !== id))
    try {
      await notificationsAPI.delete(id)
    } catch (error) {
      console.error('Failed to delete notification:', error)
    }
    toast({
      title: 'Notification deleted',
      description: 'Notification has been removed.',
    })
  }

  const handleBulkMarkAsRead = async () => {
    setNotifications((prev) =>
      prev.map((n) => (selectedNotifications.includes(n.id) ? { ...n, read: true } : n))
    )
    try {
      await Promise.allSettled(selectedNotifications.map((id) => notificationsAPI.markAsRead(id)))
    } catch (error) {
      console.error('Failed to bulk mark as read:', error)
    }
    setSelectedNotifications([])
    toast({
      title: 'Marked as read',
      description: `${selectedNotifications.length} notification(s) marked as read.`,
    })
  }

  const handleBulkDelete = async () => {
    setNotifications((prev) => prev.filter((n) => !selectedNotifications.includes(n.id)))
    try {
      await Promise.allSettled(selectedNotifications.map((id) => notificationsAPI.delete(id)))
    } catch (error) {
      console.error('Failed to bulk delete:', error)
    }
    setSelectedNotifications([])
    toast({
      title: 'Notifications deleted',
      description: `${selectedNotifications.length} notification(s) deleted.`,
    })
  }

  const handleMarkAllAsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    try {
      await notificationsAPI.markAllAsRead()
    } catch (error) {
      console.error('Failed to mark all as read:', error)
    }
    toast({
      title: 'All marked as read',
      description: 'All notifications have been marked as read.',
    })
  }

  const handleClearAll = async () => {
    setNotifications([])
    setSelectedNotifications([])
    try {
      await notificationsAPI.clearAll()
    } catch (error) {
      console.error('Failed to clear all:', error)
    }
    toast({
      title: 'All cleared',
      description: 'All notifications have been cleared.',
    })
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="flex gap-4">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Card>
          <CardContent className="p-0">
            <div className="space-y-4 p-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-20" />
              ))}
            </div>
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
          <h1 className="text-2xl font-bold font-display flex items-center gap-2">
            <Bell className="h-6 w-6" />
            Notifications
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unreadCount} unread
              </Badge>
            )}
          </h1>
          <p className="text-muted-foreground">
            Stay updated with platform activities and alerts.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleMarkAllAsRead} disabled={unreadCount === 0}>
            <CheckCheck className="h-4 w-4 mr-2" />
            Mark all read
          </Button>
          <Button variant="outline" size="sm" onClick={handleClearAll} disabled={notifications.length === 0}>
            <Trash2 className="h-4 w-4 mr-2" />
            Clear all
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Bell className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{notifications.length}</p>
                <p className="text-sm text-muted-foreground">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold">{unreadCount}</p>
                <p className="text-sm text-muted-foreground">Unread</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-cyan/10 flex items-center justify-center">
                <ShoppingCart className="h-5 w-5 text-cyan" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {notifications.filter((n) => n.type === 'order').length}
                </p>
                <p className="text-sm text-muted-foreground">Orders</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {notifications.filter((n) => n.type === 'alert').length}
                </p>
                <p className="text-sm text-muted-foreground">Alerts</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search notifications..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-[150px]">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="order">Orders</SelectItem>
            <SelectItem value="vendor">Vendors</SelectItem>
            <SelectItem value="user">Users</SelectItem>
            <SelectItem value="alert">Alerts</SelectItem>
            <SelectItem value="review">Reviews</SelectItem>
            <SelectItem value="system">System</SelectItem>
          </SelectContent>
        </Select>
        <Select value={readFilter} onValueChange={setReadFilter}>
          <SelectTrigger className="w-full sm:w-[150px]">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="unread">Unread</SelectItem>
            <SelectItem value="read">Read</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Bulk Actions */}
      {selectedNotifications.length > 0 && (
        <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
          <span className="text-sm font-medium">
            {selectedNotifications.length} selected
          </span>
          <Button variant="outline" size="sm" onClick={handleBulkMarkAsRead}>
            <Check className="h-4 w-4 mr-2" />
            Mark as read
          </Button>
          <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setSelectedNotifications([])}>
            Clear selection
          </Button>
        </div>
      )}

      {/* Notifications List */}
      <Card>
        <CardContent className="p-0">
          {filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Bell className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-1">No notifications</h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                {search || typeFilter !== 'all' || readFilter !== 'all'
                  ? 'No notifications match your filters.'
                  : "You're all caught up! No new notifications."}
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {/* Select All Header */}
              <div className="flex items-center gap-4 px-4 py-3 bg-muted/50">
                <Checkbox
                  checked={
                    selectedNotifications.length === filteredNotifications.length &&
                    filteredNotifications.length > 0
                  }
                  onCheckedChange={toggleSelectAll}
                />
                <span className="text-sm text-muted-foreground">
                  {selectedNotifications.length > 0
                    ? `${selectedNotifications.length} selected`
                    : 'Select all'}
                </span>
              </div>

              {filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    'flex items-start gap-4 p-4 hover:bg-muted/50 transition-colors',
                    !notification.read && 'bg-primary/5'
                  )}
                >
                  <Checkbox
                    checked={selectedNotifications.includes(notification.id)}
                    onCheckedChange={() => toggleSelect(notification.id)}
                    className="mt-1"
                  />
                  <div
                    className={cn(
                      'h-10 w-10 rounded-lg flex items-center justify-center shrink-0',
                      getNotificationColor(notification.type)
                    )}
                  >
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className={cn('font-medium', !notification.read && 'font-semibold')}>
                          {notification.title}
                        </p>
                        <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                          {notification.message}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {getRelativeTime(notification.timestamp)}
                        </span>
                        {!notification.read && (
                          <div className="h-2 w-2 rounded-full bg-primary" />
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="secondary" className="text-xs capitalize">
                        {notification.type}
                      </Badge>
                      {notification.link && (
                        <Button variant="link" size="sm" className="h-auto p-0 text-xs" asChild>
                          <a href={notification.link}>View details</a>
                        </Button>
                      )}
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="shrink-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {notification.read ? (
                        <DropdownMenuItem onClick={() => handleMarkAsUnread(notification.id)}>
                          <X className="h-4 w-4 mr-2" />
                          Mark as unread
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem onClick={() => handleMarkAsRead(notification.id)}>
                          <Check className="h-4 w-4 mr-2" />
                          Mark as read
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => handleDelete(notification.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
