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

  React.useEffect(() => {
    // No insights available until AI backend is connected
    setInsights([])
    setIsLoading(false)
  }, [])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    // TODO: Fetch real AI insights from backend
    await new Promise((resolve) => setTimeout(resolve, 500))
    setInsights([])
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
      <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-6 pt-3 sm:pt-6">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-gradient-premium flex items-center justify-center shrink-0">
              <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />
            </div>
            <div className="min-w-0">
              <CardTitle className="text-xs sm:text-sm md:text-base truncate">AI Insights</CardTitle>
              <CardDescription className="text-[9px] sm:text-[10px] md:text-xs truncate">
                Powered by GPT-4 & Claude
              </CardDescription>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="h-7 w-7 sm:h-8 sm:w-8 shrink-0"
          >
            {isRefreshing ? (
              <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0 flex-1 min-h-0">
        <ScrollArea className="h-[240px] sm:h-[280px] md:h-[320px]">
          <div className="space-y-2 sm:space-y-3 px-3 sm:px-4 md:px-6 pb-3 sm:pb-4 md:pb-6">
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
                  className="p-2 sm:p-2.5 md:p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start gap-2 sm:gap-2.5 md:gap-3">
                    <div className="mt-0.5 shrink-0 scale-90 sm:scale-100">{getInsightIcon(insight.type)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-1 sm:gap-1.5 md:gap-2 mb-0.5 sm:mb-1">
                        <p className="text-[11px] sm:text-xs md:text-sm font-medium truncate">{insight.title}</p>
                        {getInsightBadge(insight.type)}
                      </div>
                      <p className="text-[10px] sm:text-[11px] md:text-xs text-muted-foreground mb-1.5 sm:mb-2 line-clamp-2 sm:line-clamp-none">
                        {insight.description}
                      </p>
                      {insight.impact && (
                        <p className="text-[10px] sm:text-[11px] md:text-xs font-medium text-primary mb-1">
                          {insight.impact}
                        </p>
                      )}
                      {insight.action && (
                        <div className="flex items-center gap-2">
                          {insight.actionLink ? (
                            <Button variant="link" size="sm" className="h-auto p-0 text-[10px] sm:text-[11px] md:text-xs" asChild>
                              <Link href={insight.actionLink} className="flex items-center gap-0.5 sm:gap-1">
                                {insight.action}
                                <ChevronRight className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                              </Link>
                            </Button>
                          ) : (
                            <Button
                              variant="link"
                              size="sm"
                              className="h-auto p-0 text-[10px] sm:text-[11px] md:text-xs"
                              onClick={() => handleAction(insight)}
                            >
                              {insight.action} <ChevronRight className="h-2.5 w-2.5 sm:h-3 sm:w-3 ml-0.5" />
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
      <div className="p-2 sm:p-3 md:p-4 border-t mt-auto">
        <Button variant="outline" size="sm" className="w-full text-[11px] sm:text-xs md:text-sm h-8 sm:h-9" asChild>
          <Link href="/ai-assistant" className="flex items-center justify-center gap-1.5 sm:gap-2">
            <Sparkles className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4" />
            <span className="hidden sm:inline">Open AI Assistant</span>
            <span className="sm:hidden">AI Assistant</span>
            <ExternalLink className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
          </Link>
        </Button>
      </div>
    </Card>
  )
}
