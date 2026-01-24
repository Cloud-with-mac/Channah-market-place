'use client'

import * as React from 'react'
import Link from 'next/link'
import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Lightbulb,
  RefreshCw,
  Loader2,
  ExternalLink,
  ChevronRight,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useToast } from '@/hooks/use-toast'

interface Insight {
  id: string
  type: 'opportunity' | 'warning' | 'trend' | 'tip'
  title: string
  description: string
  impact?: string
  action?: string
  actionLink?: string
}

const mockInsights: Insight[] = [
  {
    id: '1',
    type: 'opportunity',
    title: 'Weekend Sales Spike',
    description: 'Sales typically increase by 35% on weekends. Consider launching promotions on Friday evenings.',
    impact: '+15% revenue potential',
    action: 'Schedule promotion',
    actionLink: '/content',
  },
  {
    id: '2',
    type: 'warning',
    title: 'Cart Abandonment Rising',
    description: 'Cart abandonment rate increased to 68% this week, up from 62% last week.',
    impact: 'Lost potential: ~$12,450',
    action: 'Review checkout flow',
    actionLink: '/analytics',
  },
  {
    id: '3',
    type: 'trend',
    title: 'Electronics Category Growth',
    description: 'Electronics sales up 28% month-over-month. Consider expanding vendor partnerships.',
    impact: 'Category revenue: +$45,000',
    action: 'View analytics',
    actionLink: '/analytics',
  },
  {
    id: '4',
    type: 'tip',
    title: 'Optimize Product Images',
    description: '15% of top-selling products have low-quality images. Better images could boost conversions.',
    action: 'View products',
    actionLink: '/products',
  },
  {
    id: '5',
    type: 'opportunity',
    title: 'New Vendor Onboarding',
    description: '3 high-potential vendor applications pending review. Fast approval can increase product variety.',
    impact: '+12% product catalog',
    action: 'Review applications',
    actionLink: '/vendors?status=pending',
  },
  {
    id: '6',
    type: 'warning',
    title: 'Low Stock Alert',
    description: '8 popular products are running low on stock and may need restocking soon.',
    impact: 'Risk of stockouts',
    action: 'View products',
    actionLink: '/products?stock=low',
  },
]

function getInsightIcon(type: string) {
  switch (type) {
    case 'opportunity':
      return <TrendingUp className="h-4 w-4 text-success" />
    case 'warning':
      return <AlertTriangle className="h-4 w-4 text-warning" />
    case 'trend':
      return <TrendingDown className="h-4 w-4 text-primary" />
    case 'tip':
      return <Lightbulb className="h-4 w-4 text-gold" />
    default:
      return <Sparkles className="h-4 w-4 text-primary" />
  }
}

function getInsightBadge(type: string) {
  switch (type) {
    case 'opportunity':
      return <Badge variant="success" className="text-[10px] sm:text-xs">Opportunity</Badge>
    case 'warning':
      return <Badge variant="warning" className="text-[10px] sm:text-xs">Warning</Badge>
    case 'trend':
      return <Badge variant="info" className="text-[10px] sm:text-xs">Trend</Badge>
    case 'tip':
      return <Badge variant="secondary" className="text-[10px] sm:text-xs">Tip</Badge>
    default:
      return null
  }
}

export function AIInsightsPanel() {
  const { toast } = useToast()
  const [isRefreshing, setIsRefreshing] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(true)
  const [insights, setInsights] = React.useState<Insight[]>([])
  const [dismissedIds, setDismissedIds] = React.useState<Set<string>>(new Set())

  // Simulate initial loading
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setInsights(mockInsights)
      setIsLoading(false)
    }, 800)
    return () => clearTimeout(timer)
  }, [])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500))

    // Shuffle insights to simulate new data
    const shuffled = [...mockInsights].sort(() => Math.random() - 0.5)
    setInsights(shuffled)
    setDismissedIds(new Set())
    setIsRefreshing(false)

    toast({
      title: 'Insights Refreshed',
      description: 'AI has analyzed your latest data.',
    })
  }

  const handleDismiss = (id: string) => {
    setDismissedIds((prev) => new Set([...prev, id]))
    toast({
      title: 'Insight Dismissed',
      description: 'This insight has been removed from the list.',
    })
  }

  const handleAction = (insight: Insight) => {
    toast({
      title: `Action: ${insight.action}`,
      description: `Navigating to ${insight.action?.toLowerCase()}...`,
    })
  }

  const visibleInsights = insights.filter((insight) => !dismissedIds.has(insight.id))

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-premium flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <div>
                <CardTitle className="text-base">AI Insights</CardTitle>
                <CardDescription className="text-xs">
                  Powered by GPT-4 & Claude
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[320px]">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Analyzing your data...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-premium flex items-center justify-center shrink-0">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <div className="min-w-0">
              <CardTitle className="text-sm sm:text-base">AI Insights</CardTitle>
              <CardDescription className="text-[10px] sm:text-xs">
                Powered by GPT-4 & Claude
              </CardDescription>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="h-8 w-8 shrink-0"
          >
            {isRefreshing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0 flex-1 min-h-0">
        <ScrollArea className="h-[280px] sm:h-[320px]">
          <div className="space-y-3 px-4 sm:px-6 pb-4 sm:pb-6">
            {visibleInsights.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Sparkles className="h-10 w-10 text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">No insights available</p>
                <Button variant="link" size="sm" onClick={handleRefresh} className="mt-2">
                  Refresh insights
                </Button>
              </div>
            ) : (
              visibleInsights.map((insight) => (
                <div
                  key={insight.id}
                  className="p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start gap-2 sm:gap-3">
                    <div className="mt-0.5 shrink-0">{getInsightIcon(insight.type)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-1 sm:gap-2 mb-1">
                        <p className="text-xs sm:text-sm font-medium truncate">{insight.title}</p>
                        {getInsightBadge(insight.type)}
                      </div>
                      <p className="text-[10px] sm:text-xs text-muted-foreground mb-2 line-clamp-2">
                        {insight.description}
                      </p>
                      {insight.impact && (
                        <p className="text-[10px] sm:text-xs font-medium text-primary mb-1">
                          {insight.impact}
                        </p>
                      )}
                      {insight.action && (
                        <div className="flex items-center gap-2">
                          {insight.actionLink ? (
                            <Button variant="link" size="sm" className="h-auto p-0 text-[10px] sm:text-xs" asChild>
                              <Link href={insight.actionLink} className="flex items-center gap-1">
                                {insight.action}
                                <ChevronRight className="h-3 w-3" />
                              </Link>
                            </Button>
                          ) : (
                            <Button
                              variant="link"
                              size="sm"
                              className="h-auto p-0 text-[10px] sm:text-xs"
                              onClick={() => handleAction(insight)}
                            >
                              {insight.action} <ChevronRight className="h-3 w-3 ml-0.5" />
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
      <div className="p-3 sm:p-4 border-t mt-auto">
        <Button variant="outline" size="sm" className="w-full text-xs sm:text-sm" asChild>
          <Link href="/ai-assistant" className="flex items-center justify-center gap-2">
            <Sparkles className="h-3 w-3 sm:h-4 sm:w-4" />
            Open AI Assistant
            <ExternalLink className="h-3 w-3" />
          </Link>
        </Button>
      </div>
    </Card>
  )
}
