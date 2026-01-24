'use client'

import { useState, useEffect } from 'react'
import { Sparkles, TrendingUp, AlertTriangle, Lightbulb, RefreshCw, Target, Zap } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

interface Insight {
  id: string
  type: 'success' | 'warning' | 'tip' | 'opportunity'
  title: string
  description: string
  action?: string
  actionUrl?: string
}

interface AIInsightsProps {
  stats: {
    total_revenue: number
    this_month_revenue: number
    total_orders: number
    pending_orders: number
    active_products: number
    average_rating: number
    total_reviews: number
    low_stock_count?: number
  }
  recentOrders?: any[]
}

const insightIcons = {
  success: TrendingUp,
  warning: AlertTriangle,
  tip: Lightbulb,
  opportunity: Target,
}

const insightColors = {
  success: {
    bg: 'bg-emerald-50 dark:bg-emerald-950/30',
    border: 'border-emerald-200 dark:border-emerald-800',
    icon: 'text-emerald-600 dark:text-emerald-400',
    badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300',
  },
  warning: {
    bg: 'bg-amber-50 dark:bg-amber-950/30',
    border: 'border-amber-200 dark:border-amber-800',
    icon: 'text-amber-600 dark:text-amber-400',
    badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300',
  },
  tip: {
    bg: 'bg-blue-50 dark:bg-blue-950/30',
    border: 'border-blue-200 dark:border-blue-800',
    icon: 'text-blue-600 dark:text-blue-400',
    badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
  },
  opportunity: {
    bg: 'bg-purple-50 dark:bg-purple-950/30',
    border: 'border-purple-200 dark:border-purple-800',
    icon: 'text-purple-600 dark:text-purple-400',
    badge: 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300',
  },
}

function generateInsights(stats: AIInsightsProps['stats']): Insight[] {
  const insights: Insight[] = []

  // Revenue insights
  if (stats.this_month_revenue > 0) {
    const avgDailyRevenue = stats.this_month_revenue / 30
    if (avgDailyRevenue > 100) {
      insights.push({
        id: 'revenue-growth',
        type: 'success',
        title: 'Strong Revenue Performance',
        description: `Your store is averaging £${avgDailyRevenue.toFixed(2)} per day. Keep up the momentum by promoting your best-selling products!`,
        action: 'View Analytics',
        actionUrl: '/vendor/analytics',
      })
    }
  }

  // Pending orders
  if (stats.pending_orders > 5) {
    insights.push({
      id: 'pending-orders',
      type: 'warning',
      title: 'Orders Need Attention',
      description: `You have ${stats.pending_orders} pending orders waiting to be processed. Fast fulfillment improves customer satisfaction.`,
      action: 'Process Orders',
      actionUrl: '/vendor/orders?status=pending',
    })
  }

  // Low stock warning
  if (stats.low_stock_count && stats.low_stock_count > 0) {
    insights.push({
      id: 'low-stock',
      type: 'warning',
      title: 'Low Stock Alert',
      description: `${stats.low_stock_count} products are running low on inventory. Restock soon to avoid missing sales.`,
      action: 'Manage Inventory',
      actionUrl: '/vendor/products?filter=low-stock',
    })
  }

  // Rating insights
  if (stats.average_rating >= 4.5 && stats.total_reviews >= 10) {
    insights.push({
      id: 'great-rating',
      type: 'success',
      title: 'Excellent Store Rating',
      description: `Your ${stats.average_rating.toFixed(1)}-star rating with ${stats.total_reviews} reviews builds trust. Consider adding a "Top Rated" badge to your listings.`,
    })
  } else if (stats.average_rating < 4 && stats.total_reviews > 5) {
    insights.push({
      id: 'improve-rating',
      type: 'tip',
      title: 'Improve Your Rating',
      description: 'Focus on product quality and customer service to boost your rating. Respond promptly to customer inquiries.',
    })
  }

  // Product optimization
  if (stats.active_products < 5) {
    insights.push({
      id: 'add-products',
      type: 'opportunity',
      title: 'Expand Your Catalog',
      description: 'Stores with more products tend to attract more customers. Consider adding complementary items to your existing lineup.',
      action: 'Add Product',
      actionUrl: '/vendor/products/new',
    })
  }

  // General tips
  if (insights.length < 3) {
    insights.push({
      id: 'ai-description',
      type: 'tip',
      title: 'AI-Powered Descriptions',
      description: 'Use our AI tool to generate compelling product descriptions that convert browsers into buyers.',
      action: 'Try AI Writer',
      actionUrl: '/vendor/products/new',
    })
  }

  return insights.slice(0, 4)
}

export function AIInsights({ stats, recentOrders }: AIInsightsProps) {
  const [insights, setInsights] = useState<Insight[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    // Simulate AI processing delay
    const timer = setTimeout(() => {
      setInsights(generateInsights(stats))
      setIsLoading(false)
    }, 800)

    return () => clearTimeout(timer)
  }, [stats])

  const handleRefresh = () => {
    setIsRefreshing(true)
    setTimeout(() => {
      setInsights(generateInsights(stats))
      setIsRefreshing(false)
    }, 500)
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-violet-500/10 via-purple-500/10 to-fuchsia-500/10 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                AI-Powered Insights
                <Badge variant="secondary" className="text-[10px] font-normal">
                  <Zap className="h-3 w-3 mr-1" />
                  Smart
                </Badge>
              </CardTitle>
              <p className="text-xs text-muted-foreground">Personalized recommendations for your store</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="h-8"
          >
            <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-3 p-3 rounded-lg border">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-3 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {insights.map((insight) => {
              const Icon = insightIcons[insight.type]
              const colors = insightColors[insight.type]

              return (
                <div
                  key={insight.id}
                  className={cn(
                    "flex gap-3 p-4 rounded-xl border transition-all hover:shadow-sm",
                    colors.bg,
                    colors.border
                  )}
                >
                  <div className={cn("p-2 rounded-lg h-fit", colors.bg)}>
                    <Icon className={cn("h-5 w-5", colors.icon)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-sm">{insight.title}</h4>
                      <Badge variant="secondary" className={cn("text-[10px]", colors.badge)}>
                        {insight.type}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {insight.description}
                    </p>
                    {insight.action && (
                      <Button
                        variant="link"
                        size="sm"
                        className="h-auto p-0 mt-2 text-xs"
                        asChild
                      >
                        <a href={insight.actionUrl}>{insight.action} →</a>
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
