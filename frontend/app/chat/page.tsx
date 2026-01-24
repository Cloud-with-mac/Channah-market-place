'use client'

import * as React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  Send,
  Bot,
  User,
  Sparkles,
  ShoppingCart,
  Search,
  TrendingUp,
  Package,
  Heart,
  MessageSquare,
  Loader2,
  ArrowRight,
  Mic,
  ImageIcon,
  RotateCcw
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { aiAPI, productsAPI } from '@/lib/api'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  products?: any[]
  suggestions?: string[]
}

const quickActions = [
  { icon: Search, label: 'Find Products', prompt: 'Help me find products' },
  { icon: TrendingUp, label: 'Trending Now', prompt: 'What are the trending products right now?' },
  { icon: Package, label: 'Track Order', prompt: 'Help me track my order' },
  { icon: Heart, label: 'Gift Ideas', prompt: 'Suggest some gift ideas' },
]

const suggestedPrompts = [
  "What's on sale today?",
  "Show me the best electronics under $100",
  "I need a birthday gift for my mom",
  "What are the top-rated products?",
  "Help me find fashion items",
  "Compare products for me",
]

export default function ChatPage() {
  const [messages, setMessages] = React.useState<Message[]>([])
  const [input, setInput] = React.useState('')
  const [isLoading, setIsLoading] = React.useState(false)
  const [isTyping, setIsTyping] = React.useState(false)
  const scrollRef = React.useRef<HTMLDivElement>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)

  // Auto-scroll to bottom when new messages arrive
  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, isTyping])

  // Welcome message
  React.useEffect(() => {
    const welcomeMessage: Message = {
      id: 'welcome',
      role: 'assistant',
      content: "Hello! I'm your Channah-Market AI shopping assistant. I can help you find products, answer questions, track orders, and provide personalized recommendations. How can I help you today?",
      timestamp: new Date(),
      suggestions: suggestedPrompts.slice(0, 4),
    }
    setMessages([welcomeMessage])
  }, [])

  const generateResponse = async (userMessage: string): Promise<Message> => {
    // Simulate AI response with relevant content
    const lowerMessage = userMessage.toLowerCase()

    let responseContent = ''
    let products: any[] = []
    let suggestions: string[] = []

    try {
      // Try to get AI response from backend
      const aiResponse = await aiAPI.chat(userMessage).catch(() => null)

      if (aiResponse?.data?.message) {
        responseContent = aiResponse.data.message
        products = aiResponse.data.products || []
        suggestions = aiResponse.data.suggestions || []
      } else {
        // Fallback responses based on keywords
        if (lowerMessage.includes('trending') || lowerMessage.includes('popular')) {
          responseContent = "Here are some trending products that customers are loving right now! These items have received excellent reviews and are selling fast."
          const response = await productsAPI.getFeatured(4).catch(() => ({ data: [] }))
          products = response.data?.results || response.data || []
          suggestions = ["Show me more trending items", "What's new this week?", "Best sellers in electronics"]
        } else if (lowerMessage.includes('sale') || lowerMessage.includes('discount') || lowerMessage.includes('deal')) {
          responseContent = "Great news! We have amazing deals available. Check out these products with special discounts!"
          const response = await productsAPI.getAll({ limit: 4 }).catch(() => ({ data: [] }))
          products = response.data?.results || response.data || []
          suggestions = ["Show me flash deals", "When do new sales start?", "Best discounts today"]
        } else if (lowerMessage.includes('gift')) {
          responseContent = "I'd love to help you find the perfect gift! Here are some popular gift choices that customers recommend:"
          const response = await productsAPI.getFeatured(4).catch(() => ({ data: [] }))
          products = response.data?.results || response.data || []
          suggestions = ["Gifts under $50", "Gifts for her", "Gifts for him", "Unique gift ideas"]
        } else if (lowerMessage.includes('electronics') || lowerMessage.includes('tech')) {
          responseContent = "Here are some top electronics picks for you. We have a wide range of gadgets and tech products!"
          const response = await productsAPI.getAll({ category: 'electronics', limit: 4 }).catch(() => ({ data: [] }))
          products = response.data?.results || response.data || []
          suggestions = ["Show smartphones", "Best laptops", "Smart home devices"]
        } else if (lowerMessage.includes('fashion') || lowerMessage.includes('clothes') || lowerMessage.includes('wear')) {
          responseContent = "Let me show you some fashionable items! We have the latest trends in clothing and accessories."
          const response = await productsAPI.getAll({ category: 'fashion', limit: 4 }).catch(() => ({ data: [] }))
          products = response.data?.results || response.data || []
          suggestions = ["Women's fashion", "Men's fashion", "Accessories", "New arrivals in fashion"]
        } else if (lowerMessage.includes('track') || lowerMessage.includes('order')) {
          responseContent = "To track your order, please go to your account dashboard and click on 'Orders'. You can also enter your order number on our order tracking page. Would you like me to help you with anything else?"
          suggestions = ["Go to my orders", "How long does shipping take?", "Return policy"]
        } else if (lowerMessage.includes('help') || lowerMessage.includes('support')) {
          responseContent = "I'm here to help! I can assist you with:\n\n• Finding products\n• Checking prices and availability\n• Order tracking\n• Product recommendations\n• Answering questions about our services\n\nWhat would you like help with?"
          suggestions = ["Find products", "Track my order", "Contact support", "Return policy"]
        } else if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
          responseContent = "Hello! Great to see you! How can I assist you with your shopping today? I can help you find products, check deals, or answer any questions you have."
          suggestions = ["What's on sale?", "New arrivals", "Popular products", "Help me find something"]
        } else {
          // Default response with product recommendations
          responseContent = "I'd be happy to help you with that! Let me show you some products that might interest you. Feel free to ask me anything about our products, deals, or services."
          const response = await productsAPI.getFeatured(4).catch(() => ({ data: [] }))
          products = response.data?.results || response.data || []
          suggestions = ["Tell me more", "Show different products", "What are your best sellers?"]
        }
      }
    } catch (error) {
      responseContent = "I apologize, but I'm having trouble connecting right now. Please try again in a moment, or feel free to browse our products directly."
      suggestions = ["Browse products", "View categories", "Contact support"]
    }

    return {
      id: Date.now().toString(),
      role: 'assistant',
      content: responseContent,
      timestamp: new Date(),
      products: products.slice(0, 4),
      suggestions,
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)
    setIsTyping(true)

    // Simulate typing delay
    await new Promise(resolve => setTimeout(resolve, 1000))

    const assistantMessage = await generateResponse(userMessage.content)

    setIsTyping(false)
    setMessages(prev => [...prev, assistantMessage])
    setIsLoading(false)
  }

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion)
    inputRef.current?.focus()
  }

  const handleQuickAction = (prompt: string) => {
    setInput(prompt)
    inputRef.current?.focus()
  }

  const clearChat = () => {
    const welcomeMessage: Message = {
      id: 'welcome-new',
      role: 'assistant',
      content: "Chat cleared! How can I help you today?",
      timestamp: new Date(),
      suggestions: suggestedPrompts.slice(0, 4),
    }
    setMessages([welcomeMessage])
  }

  return (
    <div className="flex flex-col h-[calc(100vh-200px)] max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-primary/5 to-gold/5">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary to-gold flex items-center justify-center">
              <Bot className="h-6 w-6 text-white" />
            </div>
            <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-background" />
          </div>
          <div>
            <h1 className="font-bold text-lg flex items-center gap-2">
              Channah AI Assistant
              <Badge variant="secondary" className="text-xs">
                <Sparkles className="h-3 w-3 mr-1" />
                AI Powered
              </Badge>
            </h1>
            <p className="text-sm text-muted-foreground">Always here to help you shop smarter</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={clearChat}>
          <RotateCcw className="h-4 w-4 mr-2" />
          New Chat
        </Button>
      </div>

      {/* Quick Actions */}
      {messages.length <= 1 && (
        <div className="p-4 border-b bg-muted/30">
          <p className="text-sm font-medium mb-3">Quick Actions</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {quickActions.map((action) => (
              <Button
                key={action.label}
                variant="outline"
                className="h-auto py-3 flex flex-col items-center gap-2 hover:bg-primary/5 hover:border-primary"
                onClick={() => handleQuickAction(action.prompt)}
              >
                <action.icon className="h-5 w-5 text-primary" />
                <span className="text-xs">{action.label}</span>
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      <ScrollArea ref={scrollRef} className="flex-1 p-4">
        <div className="space-y-6">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                'flex gap-3',
                message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
              )}
            >
              <Avatar className={cn(
                'h-8 w-8 shrink-0',
                message.role === 'assistant' && 'bg-gradient-to-br from-primary to-gold'
              )}>
                {message.role === 'assistant' ? (
                  <AvatarFallback className="bg-transparent">
                    <Bot className="h-4 w-4 text-white" />
                  </AvatarFallback>
                ) : (
                  <AvatarFallback>
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                )}
              </Avatar>

              <div className={cn(
                'flex flex-col gap-2 max-w-[80%]',
                message.role === 'user' && 'items-end'
              )}>
                <div className={cn(
                  'rounded-2xl px-4 py-3',
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground rounded-tr-sm'
                    : 'bg-muted rounded-tl-sm'
                )}>
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                </div>

                {/* Product Cards */}
                {message.products && message.products.length > 0 && (
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {message.products.map((product: any) => (
                      <Link
                        key={product.id}
                        href={`/product/${product.slug}`}
                        className="group"
                      >
                        <Card className="overflow-hidden hover:shadow-md transition-shadow">
                          <div className="aspect-square relative bg-muted">
                            {(product.primary_image || product.images?.[0]?.url) ? (
                              <Image
                                src={product.primary_image || product.images?.[0]?.url}
                                alt={product.name}
                                fill
                                className="object-cover group-hover:scale-105 transition-transform"
                              />
                            ) : (
                              <div className="flex items-center justify-center h-full">
                                <Package className="h-8 w-8 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          <CardContent className="p-2">
                            <p className="text-xs font-medium line-clamp-1">{product.name}</p>
                            <p className="text-sm font-bold text-primary">
                              ${parseFloat(product.price).toFixed(2)}
                            </p>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>
                )}

                {/* Suggestions */}
                {message.suggestions && message.suggestions.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {message.suggestions.map((suggestion, idx) => (
                      <Button
                        key={idx}
                        variant="outline"
                        size="sm"
                        className="text-xs h-7 hover:bg-primary/10 hover:border-primary"
                        onClick={() => handleSuggestionClick(suggestion)}
                      >
                        {suggestion}
                      </Button>
                    ))}
                  </div>
                )}

                <span className="text-[10px] text-muted-foreground">
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex gap-3">
              <Avatar className="h-8 w-8 bg-gradient-to-br from-primary to-gold">
                <AvatarFallback className="bg-transparent">
                  <Bot className="h-4 w-4 text-white" />
                </AvatarFallback>
              </Avatar>
              <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3">
                <div className="flex gap-1">
                  <span className="h-2 w-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="h-2 w-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="h-2 w-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t bg-background">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me anything about products, deals, or orders..."
              className="pr-20 h-12 text-base rounded-full border-2 focus:border-primary"
              disabled={isLoading}
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full hover:bg-primary/10"
              >
                <Mic className="h-4 w-4 text-muted-foreground" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full hover:bg-primary/10"
              >
                <ImageIcon className="h-4 w-4 text-muted-foreground" />
              </Button>
            </div>
          </div>
          <Button
            type="submit"
            size="icon"
            className="h-12 w-12 rounded-full bg-gradient-to-r from-primary to-gold hover:opacity-90"
            disabled={isLoading || !input.trim()}
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </Button>
        </form>
        <p className="text-[10px] text-center text-muted-foreground mt-2">
          Channah AI may make mistakes. Always verify important information.
        </p>
      </div>
    </div>
  )
}
