'use client'

import * as React from 'react'
import DOMPurify from 'dompurify'
import {
  Sparkles,
  Send,
  Bot,
  User,
  Copy,
  ThumbsUp,
  ThumbsDown,
  RefreshCw,
  Loader2,
  Lightbulb,
  TrendingUp,
  Users,
  ShoppingCart,
  DollarSign,
  AlertTriangle,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { useStatsStore } from '@/store'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  isLoading?: boolean
}

interface SuggestedQuery {
  icon: React.ComponentType<{ className?: string }>
  title: string
  query: string
}

const suggestedQueries: SuggestedQuery[] = [
  {
    icon: TrendingUp,
    title: 'Revenue Analysis',
    query: 'What is the revenue trend for the last 30 days?',
  },
  {
    icon: Users,
    title: 'User Growth',
    query: 'How many new users registered this week compared to last week?',
  },
  {
    icon: ShoppingCart,
    title: 'Order Insights',
    query: 'What are the most common reasons for order cancellations?',
  },
  {
    icon: DollarSign,
    title: 'Top Products',
    query: 'What are the top 5 selling products this month?',
  },
  {
    icon: AlertTriangle,
    title: 'Fraud Detection',
    query: 'Are there any suspicious order patterns I should be aware of?',
  },
  {
    icon: Lightbulb,
    title: 'Recommendations',
    query: 'What actions should I prioritize to increase sales?',
  },
]

function getAIResponse(query: string, stats: { totalRevenue: number; activeUsers: number; ordersToday: number; avgOrderValue: number }): string {
  return `Based on your query: "${query}"

### Current Marketplace Stats:
- Total active users: ${stats.activeUsers.toLocaleString('en-GB')}
- Monthly revenue: £${stats.totalRevenue.toLocaleString('en-GB')}
- Average order value: £${stats.avgOrderValue.toFixed(2)}
- Orders today: ${stats.ordersToday}

AI-powered detailed analysis will be available once the AI backend is connected. For now, you can view detailed data in the respective dashboard sections.`
}

export default function AIAssistantPage() {
  const { toast } = useToast()
  const { stats, fetchStats } = useStatsStore()
  const [messages, setMessages] = React.useState<Message[]>([])
  const [input, setInput] = React.useState('')
  const [isLoading, setIsLoading] = React.useState(false)
  const scrollRef = React.useRef<HTMLDivElement>(null)

  // Fetch stats on mount
  React.useEffect(() => {
    fetchStats()
  }, [fetchStats])

  // Scroll to bottom when new messages arrive
  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSend = async (query?: string) => {
    const messageText = query || input.trim()
    if (!messageText || isLoading) return

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    // Add loading message
    const loadingMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isLoading: true,
    }
    setMessages((prev) => [...prev, loadingMessage])

    // Simulate AI response delay
    await new Promise((resolve) => setTimeout(resolve, 1500))

    // Replace loading message with actual response
    const response = getAIResponse(messageText, stats)
    setMessages((prev) =>
      prev.map((msg) =>
        msg.isLoading
          ? { ...msg, content: response, isLoading: false }
          : msg
      )
    )
    setIsLoading(false)
  }

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content)
    toast({
      title: 'Copied',
      description: 'Response copied to clipboard',
    })
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl bg-gradient-premium flex items-center justify-center shrink-0">
            <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold font-display truncate">AI Assistant</h1>
            <p className="text-muted-foreground text-xs sm:text-sm truncate">
              Powered by GPT-4 & Claude • Ask anything about your marketplace
            </p>
          </div>
        </div>
        <Badge variant="outline" className="gap-1 w-fit shrink-0">
          <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
          Online
        </Badge>
      </div>

      {/* Quick Stats - Mobile/Tablet */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-4 xl:hidden">
        <Card className="p-3">
          <p className="text-[10px] sm:text-xs text-muted-foreground mb-1">Total Revenue</p>
          <p className="text-sm sm:text-base font-semibold">
            £{stats.totalRevenue.toLocaleString('en-GB')}
          </p>
        </Card>
        <Card className="p-3">
          <p className="text-[10px] sm:text-xs text-muted-foreground mb-1">Active Users</p>
          <p className="text-sm sm:text-base font-semibold">
            {stats.activeUsers.toLocaleString('en-GB')}
          </p>
        </Card>
        <Card className="p-3">
          <p className="text-[10px] sm:text-xs text-muted-foreground mb-1">Orders Today</p>
          <p className="text-sm sm:text-base font-semibold">
            {stats.ordersToday.toLocaleString('en-GB')}
          </p>
        </Card>
        <Card className="p-3">
          <p className="text-[10px] sm:text-xs text-muted-foreground mb-1">Avg. Order Value</p>
          <p className="text-sm sm:text-base font-semibold">
            £{stats.avgOrderValue.toFixed(2)}
          </p>
        </Card>
      </div>

      <div className="flex-1 flex flex-col xl:flex-row gap-4 xl:gap-6 min-h-0">
        {/* Chat Area */}
        <Card className="flex-1 flex flex-col min-h-0">
          {messages.length === 0 ? (
            // Empty state with suggestions
            <div className="flex-1 flex flex-col items-center justify-center p-3 sm:p-4 md:p-6">
              <div className="h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 rounded-full bg-gradient-premium-light flex items-center justify-center mb-3 sm:mb-4">
                <Bot className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-primary" />
              </div>
              <h2 className="text-base sm:text-lg md:text-xl font-semibold mb-1 sm:mb-2 text-center">How can I help you today?</h2>
              <p className="text-muted-foreground text-center text-xs sm:text-sm mb-4 sm:mb-6 max-w-md px-2">
                I can analyze your marketplace data, provide insights, detect patterns,
                and help you make data-driven decisions.
              </p>
              <div className="grid gap-2 sm:gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 w-full max-w-3xl">
                {suggestedQueries.map((suggestion) => (
                  <button
                    key={suggestion.title}
                    onClick={() => handleSend(suggestion.query)}
                    className="flex items-start gap-2 sm:gap-3 p-3 sm:p-4 rounded-lg border bg-muted/30 hover:bg-muted/50 hover:border-primary/50 transition-colors text-left"
                    disabled={isLoading}
                  >
                    <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <suggestion.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-medium truncate">{suggestion.title}</p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground line-clamp-2">
                        {suggestion.query}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            // Chat messages
            <div className="flex-1 overflow-y-auto p-2 sm:p-3 md:p-4" ref={scrollRef}>
              <div className="space-y-3 sm:space-y-4 md:space-y-6">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      'flex gap-2 sm:gap-3',
                      message.role === 'user' && 'justify-end'
                    )}
                  >
                    {message.role === 'assistant' && (
                      <Avatar className="h-7 w-7 sm:h-8 sm:w-8 shrink-0">
                        <AvatarFallback className="bg-gradient-premium text-white">
                          <Bot className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div
                      className={cn(
                        'rounded-lg p-3 sm:p-4 max-w-[85%] sm:max-w-[80%]',
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      )}
                    >
                      {message.isLoading ? (
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
                          <span className="text-xs sm:text-sm">Analyzing...</span>
                        </div>
                      ) : (
                        <>
                          <div className="prose prose-xs sm:prose-sm dark:prose-invert max-w-none">
                            <div
                              className="text-xs sm:text-sm"
                              dangerouslySetInnerHTML={{
                                __html: DOMPurify.sanitize(
                                  message.content
                                    .replace(/^### (.*$)/gim, '<h3 class="text-sm sm:text-base font-semibold mt-2 mb-1">$1</h3>')
                                    .replace(/^## (.*$)/gim, '<h2 class="text-base sm:text-lg font-bold mt-3 mb-2">$1</h2>')
                                    .replace(/^\*\*(.*)\*\*/gim, '<strong>$1</strong>')
                                    .replace(/^\* (.*$)/gim, '<li class="ml-4">$1</li>')
                                    .replace(/\n/g, '<br />'),
                                  { ALLOWED_TAGS: ['h2', 'h3', 'strong', 'em', 'li', 'ul', 'ol', 'br', 'p', 'a', 'span'], ALLOWED_ATTR: ['class', 'href'] }
                                ),
                              }}
                            />
                          </div>
                          {message.role === 'assistant' && (
                            <div className="flex flex-wrap items-center gap-1 sm:gap-2 mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-border/50">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleCopy(message.content)}
                                className="h-7 sm:h-8 text-xs"
                              >
                                <Copy className="h-3 w-3 mr-1" />
                                <span className="hidden sm:inline">Copy</span>
                              </Button>
                              <Button variant="ghost" size="sm" className="h-7 sm:h-8 text-xs">
                                <ThumbsUp className="h-3 w-3 sm:mr-1" />
                                <span className="hidden sm:inline">Helpful</span>
                              </Button>
                              <Button variant="ghost" size="sm" className="h-7 sm:h-8 text-xs">
                                <ThumbsDown className="h-3 w-3 sm:mr-1" />
                                <span className="hidden sm:inline">Not helpful</span>
                              </Button>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                    {message.role === 'user' && (
                      <Avatar className="h-7 w-7 sm:h-8 sm:w-8 shrink-0">
                        <AvatarFallback className="bg-secondary">
                          <User className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="p-2 sm:p-3 md:p-4 border-t">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about revenue, users, orders..."
                disabled={isLoading}
                className="flex-1 text-xs sm:text-sm"
              />
              <Button onClick={() => handleSend()} disabled={!input.trim() || isLoading} className="shrink-0">
                {isLoading ? (
                  <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
                ) : (
                  <Send className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                )}
              </Button>
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-1.5 sm:mt-2 text-center">
              AI responses are generated based on your marketplace data.
              Always verify important decisions.
            </p>
          </div>
        </Card>

        {/* Sidebar with quick stats - Desktop only */}
        <div className="hidden xl:flex xl:flex-col w-80 space-y-4 shrink-0">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total Revenue</span>
                <span className="font-semibold">£{stats.totalRevenue.toLocaleString('en-GB')}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Active Users</span>
                <span className="font-semibold">{stats.activeUsers.toLocaleString('en-GB')}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Orders Today</span>
                <span className="font-semibold">{stats.ordersToday.toLocaleString('en-GB')}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Avg. Order Value</span>
                <span className="font-semibold">£{stats.avgOrderValue.toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Capabilities</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                  Analyze sales & revenue data
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                  Track user behavior & growth
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                  Detect fraud & anomalies
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                  Generate reports & insights
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                  Predict trends & patterns
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
