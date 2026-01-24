'use client'

import { useState } from 'react'
import { Bell, Package, CreditCard, Tag, MessageSquare, CheckCircle, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface Notification {
  id: string
  type: 'order' | 'payment' | 'promotion' | 'message' | 'system'
  title: string
  message: string
  isRead: boolean
  createdAt: string
  link?: string
}

const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'order',
    title: 'Order Shipped',
    message: 'Your order #12345 has been shipped and is on its way!',
    isRead: false,
    createdAt: '2 hours ago',
    link: '/account/orders/12345',
  },
  {
    id: '2',
    type: 'promotion',
    title: 'Flash Sale Alert!',
    message: 'Up to 70% off on electronics. Limited time only!',
    isRead: false,
    createdAt: '5 hours ago',
    link: '/deals',
  },
  {
    id: '3',
    type: 'payment',
    title: 'Payment Successful',
    message: 'Payment of £89.99 for order #12344 was successful.',
    isRead: true,
    createdAt: '1 day ago',
  },
  {
    id: '4',
    type: 'message',
    title: 'New Message from Seller',
    message: 'TechGear Store replied to your inquiry about the headphones.',
    isRead: true,
    createdAt: '2 days ago',
  },
  {
    id: '5',
    type: 'system',
    title: 'Welcome to Channah!',
    message: 'Thanks for joining. Start exploring products from around the world.',
    isRead: true,
    createdAt: '3 days ago',
  },
]

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
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')

  const unreadCount = notifications.filter((n) => !n.isRead).length
  const filteredNotifications = filter === 'unread'
    ? notifications.filter((n) => !n.isRead)
    : notifications

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    )
  }

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
  }

  const deleteNotification = (id: string) => {
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
            {filteredNotifications.length === 0 ? (
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
                            <p className="text-xs text-muted-foreground mt-2">{notification.createdAt}</p>
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
