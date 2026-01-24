'use client'

import * as React from 'react'
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
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

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

// Simulated AI responses
const aiResponses: Record<string, string> = {
  'revenue': `## Revenue Analysis (Last 30 Days)

Based on my analysis of your marketplace data:

**Total Revenue:** £124,567.89
**Growth:** +12.5% compared to previous 30 days

### Key Insights:
1. **Weekend Performance:** Weekends generate 35% more revenue than weekdays
2. **Peak Hours:** Most orders occur between 6-9 PM
3. **Top Categories:** Electronics (42%), Fashion (28%), Home (18%)

### Recommendations:
- Launch targeted promotions on Friday evenings
- Consider flash sales during peak hours
- Expand electronics vendor partnerships`,

  'users': `## User Growth Report

### This Week vs Last Week:
- **New Registrations:** 487 (+23%)
- **Active Users:** 12,450 (+8%)
- **Returning Customers:** 3,210 (+15%)

### User Behavior:
- Average session duration: 8.5 minutes
- Pages per session: 4.2
- Conversion rate: 3.8%

### Growth Opportunities:
1. Cart abandonment recovery emails could recover ~£15,000/week
2. Referral program could increase new users by 20%`,

  'orders': `## Order Cancellation Analysis

### Top Reasons for Cancellations:
1. **Changed Mind (32%)** - Consider a wishlist reminder feature
2. **Found Better Price (24%)** - Price matching could help
3. **Shipping Time Too Long (21%)** - Promote express shipping
4. **Payment Issues (15%)** - Review checkout flow
5. **Wrong Item Ordered (8%)** - Improve product descriptions

### Recommendations:
- Implement cart abandonment emails
- Add real-time inventory updates
- Offer price match guarantee`,

  'products': `## Top 5 Selling Products (This Month)

| Rank | Product | Units Sold | Revenue |
|------|---------|------------|---------|
| 1 | iPhone 15 Pro | 234 | £245,700 |
| 2 | Samsung 65" 4K TV | 156 | £124,800 |
| 3 | Nike Air Max 2024 | 312 | £46,800 |
| 4 | MacBook Pro M3 | 89 | £177,111 |
| 5 | Sony PS5 Bundle | 145 | £72,500 |

### Insights:
- Electronics dominate top sales
- Bundle products perform 40% better
- Consider promoting complementary products`,

  'fraud': `## Fraud Alert Summary

### Active Alerts: 3
### This Week's Suspicious Activity:

1. **High-Risk Order (ORD-5847)**
   - Risk Score: 92%
   - Amount: £1,250
   - Flags: New account, mismatched addresses

2. **Unusual Pattern Detected**
   - Multiple orders from same IP with different cards
   - Recommend: Block and investigate

### Prevention Recommendations:
- Enable 3D Secure for orders >£500
- Add phone verification for new accounts
- Review orders with VPN usage`,

  'recommendations': `## Priority Actions to Increase Sales

### Immediate Actions (This Week):
1. **Send Cart Abandonment Emails**
   - Potential recovery: £12,000
   - 68% of carts are abandoned

2. **Enable Flash Sales**
   - Schedule weekend promotions
   - Expected uplift: +15% weekend revenue

3. **Optimize Checkout**
   - Reduce steps from 5 to 3
   - Expected conversion increase: +0.5%

### Medium-term (This Month):
1. Launch referral program
2. Implement product recommendations
3. Add customer reviews widget

### Estimated Total Impact: +£35,000/month`,
}

function getAIResponse(query: string): string {
  const lowerQuery = query.toLowerCase()

  if (lowerQuery.includes('revenue') || lowerQuery.includes('trend')) {
    return aiResponses['revenue']
  }
  if (lowerQuery.includes('user') || lowerQuery.includes('registration') || lowerQuery.includes('growth')) {
    return aiResponses['users']
  }
  if (lowerQuery.includes('order') || lowerQuery.includes('cancellation')) {
    return aiResponses['orders']
  }
  if (lowerQuery.includes('product') || lowerQuery.includes('selling') || lowerQuery.includes('top')) {
    return aiResponses['products']
  }
  if (lowerQuery.includes('fraud') || lowerQuery.includes('suspicious')) {
    return aiResponses['fraud']
  }
  if (lowerQuery.includes('recommendation') || lowerQuery.includes('action') || lowerQuery.includes('increase')) {
    return aiResponses['recommendations']
  }

  return `I've analyzed your query: "${query}"

Based on the current marketplace data, here are my findings:

### Summary
Your marketplace is performing well with steady growth across all key metrics.

### Key Points:
- Total active users: 24,567
- Monthly revenue: £124,567
- Average order value: £85.50
- Customer satisfaction: 4.6/5

Would you like me to dive deeper into any specific area? You can ask about:
- Revenue and sales trends
- User behavior and growth
- Order patterns and issues
- Product performance
- Fraud detection alerts`
}

export default function AIAssistantPage() {
  const { toast } = useToast()
  const [messages, setMessages] = React.useState<Message[]>([])
  const [input, setInput] = React.useState('')
  const [isLoading, setIsLoading] = React.useState(false)
  const scrollRef = React.useRef<HTMLDivElement>(null)

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
    const response = getAIResponse(messageText)
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
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-premium flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold font-display">AI Assistant</h1>
            <p className="text-muted-foreground text-sm">
              Powered by GPT-4 & Claude • Ask anything about your marketplace
            </p>
          </div>
        </div>
        <Badge variant="outline" className="gap-1">
          <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
          Online
        </Badge>
      </div>

      <div className="flex-1 flex gap-6 min-h-0">
        {/* Chat Area */}
        <Card className="flex-1 flex flex-col">
          {messages.length === 0 ? (
            // Empty state with suggestions
            <div className="flex-1 flex flex-col items-center justify-center p-6">
              <div className="h-16 w-16 rounded-full bg-gradient-premium-light flex items-center justify-center mb-4">
                <Bot className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-xl font-semibold mb-2">How can I help you today?</h2>
              <p className="text-muted-foreground text-center mb-6 max-w-md">
                I can analyze your marketplace data, provide insights, detect patterns,
                and help you make data-driven decisions.
              </p>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 w-full max-w-3xl">
                {suggestedQueries.map((suggestion) => (
                  <button
                    key={suggestion.title}
                    onClick={() => handleSend(suggestion.query)}
                    className="flex items-start gap-3 p-4 rounded-lg border bg-muted/30 hover:bg-muted/50 hover:border-primary/50 transition-colors text-left"
                  >
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <suggestion.icon className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{suggestion.title}</p>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {suggestion.query}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            // Chat messages
            <ScrollArea className="flex-1 p-4" ref={scrollRef}>
              <div className="space-y-6">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      'flex gap-3',
                      message.role === 'user' && 'justify-end'
                    )}
                  >
                    {message.role === 'assistant' && (
                      <Avatar className="h-8 w-8 shrink-0">
                        <AvatarFallback className="bg-gradient-premium text-white">
                          <Bot className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div
                      className={cn(
                        'rounded-lg p-4 max-w-[80%]',
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      )}
                    >
                      {message.isLoading ? (
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="text-sm">Analyzing...</span>
                        </div>
                      ) : (
                        <>
                          <div className="prose prose-sm dark:prose-invert max-w-none">
                            <div
                              dangerouslySetInnerHTML={{
                                __html: message.content
                                  .replace(/^### (.*$)/gim, '<h3>$1</h3>')
                                  .replace(/^## (.*$)/gim, '<h2>$1</h2>')
                                  .replace(/^\*\*(.*)\*\*/gim, '<strong>$1</strong>')
                                  .replace(/^\* (.*$)/gim, '<li>$1</li>')
                                  .replace(/\n/g, '<br />'),
                              }}
                            />
                          </div>
                          {message.role === 'assistant' && (
                            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/50">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleCopy(message.content)}
                              >
                                <Copy className="h-3 w-3 mr-1" />
                                Copy
                              </Button>
                              <Button variant="ghost" size="sm">
                                <ThumbsUp className="h-3 w-3 mr-1" />
                                Helpful
                              </Button>
                              <Button variant="ghost" size="sm">
                                <ThumbsDown className="h-3 w-3 mr-1" />
                                Not helpful
                              </Button>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                    {message.role === 'user' && (
                      <Avatar className="h-8 w-8 shrink-0">
                        <AvatarFallback className="bg-secondary">
                          <User className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}

          {/* Input Area */}
          <div className="p-4 border-t">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about revenue, users, orders, products, or anything else..."
                disabled={isLoading}
                className="flex-1"
              />
              <Button onClick={() => handleSend()} disabled={!input.trim() || isLoading}>
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              AI responses are generated based on your marketplace data.
              Always verify important decisions.
            </p>
          </div>
        </Card>

        {/* Sidebar with quick stats */}
        <div className="hidden xl:block w-80 space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total Revenue</span>
                <span className="font-semibold">£124,567</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Active Users</span>
                <span className="font-semibold">24,567</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Orders Today</span>
                <span className="font-semibold">156</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Avg. Order Value</span>
                <span className="font-semibold">£85.50</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Capabilities</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  Analyze sales & revenue data
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  Track user behavior & growth
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  Detect fraud & anomalies
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  Generate reports & insights
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
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
