'use client'

import * as React from 'react'
import Link from 'next/link'
import {
  User,
  ShoppingCart,
  Store,
  Package,
  Star,
  CreditCard,
  AlertCircle,
  CheckCircle,
  XCircle,
  Loader2,
  RefreshCw,
  ExternalLink,
  Clock,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { formatRelativeTime, getInitials } from '@/lib/utils'
import { dashboardAPI } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'

interface Activity {
  id: string
  type: 'user' | 'order' | 'vendor' | 'product' | 'review' | 'payment' | 'alert'
  action: 'created' | 'updated' | 'approved' | 'rejected' | 'completed' | 'flagged'
  title: string
  description: string
  user_name?: string
  user_avatar?: string
  timestamp: string
  link?: string
}


function getActivityIcon(type: string, action: string) {
  const iconProps = { className: 'h-4 w-4' }

  switch (type) {
    case 'user':
      return <User {...iconProps} />
    case 'order':
      return <ShoppingCart {...iconProps} />
    case 'vendor':
      return <Store {...iconProps} />
    case 'product':
      return <Package {...iconProps} />
    case 'review':
      return <Star {...iconProps} />
    case 'payment':
      return <CreditCard {...iconProps} />
    case 'alert':
      return <AlertCircle {...iconProps} />
    default:
      return <User {...iconProps} />
  }
}

function getActionIcon(action: string) {
  switch (action) {
    case 'approved':
    case 'completed':
      return <CheckCircle className="h-3 w-3 text-success" />
    case 'rejected':
      return <XCircle className="h-3 w-3 text-destructive" />
    case 'flagged':
      return <AlertCircle className="h-3 w-3 text-warning" />
    default:
      return null
  }
}

function getActivityColor(type: string) {
  switch (type) {
    case 'order':
      return 'bg-primary/10 text-primary'
    case 'vendor':
      return 'bg-success/10 text-success'
    case 'user':
      return 'bg-cyan/10 text-cyan'
    case 'product':
      return 'bg-purple-500/10 text-purple-500'
    case 'review':
      return 'bg-gold/10 text-gold'
    case 'payment':
      return 'bg-green-500/10 text-green-500'
    case 'alert':
      return 'bg-destructive/10 text-destructive'
    default:
      return 'bg-muted text-muted-foreground'
  }
}

function getActionBadge(action: string) {
  switch (action) {
    case 'created':
      return <Badge variant="info" className="text-[10px]">New</Badge>
    case 'approved':
      return <Badge variant="success" className="text-[10px]">Approved</Badge>
    case 'completed':
      return <Badge variant="success" className="text-[10px]">Completed</Badge>
    case 'rejected':
      return <Badge variant="destructive" className="text-[10px]">Rejected</Badge>
    case 'flagged':
      return <Badge variant="warning" className="text-[10px]">Flagged</Badge>
    case 'updated':
      return <Badge variant="secondary" className="text-[10px]">Updated</Badge>
    default:
      return null
  }
}

export function RecentActivity() {
  const { toast } = useToast()
  const [activities, setActivities] = React.useState<Activity[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [isRefreshing, setIsRefreshing] = React.useState(false)

  const fetchActivities = React.useCallback(async () => {
    try {
      setIsLoading(true)
      // TODO: Backend endpoint not implemented yet
      // const response = await dashboardAPI.getRecentActivity(20)
      // if (response?.activities?.length > 0) {
      //   setActivities(response.activities)
      // } else {
      //   setActivities([])
      // }
      setActivities([])
    } catch (error) {
      console.error('Failed to fetch recent activity:', error)
      setActivities([])
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [])

  React.useEffect(() => {
    fetchActivities()
  }, [fetchActivities])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await fetchActivities()
    toast({
      title: 'Activity Refreshed',
      description: 'Latest activity feed loaded.',
    })
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Clock className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">Recent Activity</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Latest actions and events on the platform
              </CardDescription>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={handleRefresh} disabled={isLoading || isRefreshing}>
            {isLoading || isRefreshing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <AlertCircle className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">No recent activity found.</p>
            <Button variant="link" size="sm" onClick={handleRefresh} className="mt-2">
              Refresh activity
            </Button>
          </div>
        ) : (
          <ScrollArea className="h-[350px] sm:h-[400px] pr-4">
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-[19px] top-0 bottom-0 w-px bg-border hidden sm:block" />

              <div className="space-y-4 sm:space-y-6">
                {activities.map((activity) => (
                  <div key={activity.id} className="relative flex gap-3 sm:gap-4">
                    {/* Icon */}
                    <div
                      className={`relative z-10 flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-full ${getActivityColor(
                        activity.type
                      )}`}
                    >
                      {getActivityIcon(activity.type, activity.action)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 pt-0.5 sm:pt-1">
                      <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                        <p className="text-xs sm:text-sm font-medium truncate">{activity.title}</p>
                        {getActionIcon(activity.action)}
                        {getActionBadge(activity.action)}
                      </div>
                      <p className="text-[10px] sm:text-sm text-muted-foreground mt-0.5 line-clamp-2">
                        {activity.description}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        {activity.user_name && (
                          <>
                            <Avatar className="h-4 w-4 sm:h-5 sm:w-5">
                              <AvatarImage src={activity.user_avatar || undefined} />
                              <AvatarFallback className="text-[8px] sm:text-[10px]">
                                {getInitials(activity.user_name)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-[10px] sm:text-xs text-muted-foreground truncate max-w-[100px]">
                              {activity.user_name}
                            </span>
                            <span className="text-muted-foreground/50 hidden sm:inline">•</span>
                          </>
                        )}
                        <span className="text-[10px] sm:text-xs text-muted-foreground">
                          {formatRelativeTime(activity.timestamp)}
                        </span>
                        {activity.link && (
                          <>
                            <span className="text-muted-foreground/50 hidden sm:inline">•</span>
                            <Button variant="link" size="sm" className="h-auto p-0 text-[10px] sm:text-xs hidden sm:inline-flex" asChild>
                              <Link href={activity.link}>
                                View <ExternalLink className="h-2.5 w-2.5 ml-0.5" />
                              </Link>
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </ScrollArea>
        )}
        <div className="mt-4 pt-4 border-t">
          <Button variant="outline" size="sm" className="w-full text-xs sm:text-sm" asChild>
            <Link href="/system/logs" className="flex items-center justify-center gap-2">
              View Full Activity Log
              <ExternalLink className="h-3 w-3" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
