'use client'

import { useState, useEffect } from 'react'
import { Bell, Package, CreditCard, Tag, MessageSquare, CheckCircle, Trash2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { notificationsAPI } from '@/lib/api'

interface Notification {
  id: string
  type: 'order' | 'payment' | 'promotion' | 'message' | 'system'
  title: string
  message: string
  isRead: boolean
  createdAt: string
  link?: string
}

const formatRelativeTime = (dateStr: string) => {
  if (dateStr.includes('ago') || dateStr.includes('just now')) return dateStr
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return dateStr
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 30) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
  const diffMonths = Math.floor(diffDays / 30)
  return `${diffMonths} month${diffMonths > 1 ? 's' : ''} ago`
}

const getIcon = (type: string) => {
  switch (type) {
    case 'order':
      return Package
    case 'payment':
      return CreditCard
    case 'promotion':
      return Tag
    case 'message':
      return MessageSquare
    default:
      return Bell
  }
}

const getIconColor = (type: string) => {
  switch (type) {
    case 'order':
      return 'text-blue-500 bg-blue-500/10'
    case 'payment':
      return 'text-green-500 bg-green-500/10'
    case 'promotion':
      return 'text-orange-500 bg-orange-500/10'
    case 'message':
      return 'text-purple-500 bg-purple-500/10'
    default:
      return 'text-cyan bg-cyan/10'
  }
}

export default function AccountNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const data = await notificationsAPI.list()
        const items = Array.isArray(data) ? data : data?.notifications || data?.items || []
        setNotifications(items.map((n: any) => ({
          id: n.id,
          type: n.type || 'system',
          title: n.title,
          message: n.message || n.content || '',
          isRead: n.is_read || n.read || false,
          createdAt: n.created_at || n.timestamp || '',
          link: n.link,
        })))
      } catch (error) {
        console.error('Failed to fetch notifications:', error)
        setNotifications([])
      } finally {
        setIsLoading(false)
      }
    }
    fetchNotifications()
  }, [])

  const unreadCount = notifications.filter((n) => !n.isRead).length
  const filteredNotifications = filter === 'unread'
    ? notifications.filter((n) => !n.isRead)
    : notifications

  const markAsRead = async (id: string) => {
    try { await notificationsAPI.markAsRead(id) } catch {}
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    )
  }

  const markAllAsRead = async () => {
    try { await notificationsAPI.markAllAsRead() } catch {}
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
  }

  const deleteNotification = async (id: string) => {
    try { await notificationsAPI.delete(id) } catch {}
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display">Notifications</h1>
          <p className="text-muted-foreground">
            {unreadCount > 0 ? `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={markAllAsRead} disabled={unreadCount === 0}>
          <CheckCircle className="h-4 w-4 mr-2" />
          Mark all read
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('all')}
          className={filter === 'all' ? 'bg-cyan text-navy' : ''}
        >
          All ({notifications.length})
        </Button>
        <Button
          variant={filter === 'unread' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('unread')}
          className={filter === 'unread' ? 'bg-cyan text-navy' : ''}
        >
          Unread ({unreadCount})
        </Button>
      </div>

      {/* Notifications List */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Notifications</CardTitle>
          <CardDescription>Stay updated on your orders and promotions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex gap-4 p-4 rounded-xl border">
                    <Skeleton className="h-11 w-11 rounded-xl" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-1/3" />
                      <Skeleton className="h-3 w-2/3" />
                      <Skeleton className="h-3 w-1/4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="text-center py-12">
                <Bell className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="font-semibold mb-2">No notifications</h3>
                <p className="text-muted-foreground text-sm">
                  {filter === 'unread' ? "You've read all your notifications!" : "You don't have any notifications yet."}
                </p>
              </div>
            ) : (
              filteredNotifications.map((notification) => {
                const Icon = getIcon(notification.type)
                const iconColorClass = getIconColor(notification.type)

                return (
                  <div
                    key={notification.id}
                    className={`relative rounded-xl p-4 border transition-colors ${
                      !notification.isRead ? 'border-cyan/50 bg-cyan/5' : 'border-border'
                    }`}
                  >
                    <div className="flex gap-4">
                      <div className={`p-3 rounded-xl ${iconColorClass}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="font-semibold flex items-center gap-2">
                              {notification.title}
                              {!notification.isRead && (
                                <Badge className="bg-cyan text-navy text-xs">New</Badge>
                              )}
                            </h3>
                            <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                            <p className="text-xs text-muted-foreground mt-2">{formatRelativeTime(notification.createdAt)}</p>
                          </div>
                          <div className="flex gap-1">
                            {!notification.isRead && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => markAsRead(notification.id)}
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => deleteNotification(notification.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
