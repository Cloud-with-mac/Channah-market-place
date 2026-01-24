'use client'

import * as React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  X,
  Send,
  Bot,
  User,
  Loader2,
  Package,
  Sparkles,
  ShoppingCart,
  Minimize2,
  Maximize2,
  RotateCcw,
  TrendingUp,
  Search,
  Heart,
  Zap
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { aiAPI, productsAPI } from '@/lib/api'
import { formatPrice } from '@/lib/utils'
import { useCartStore } from '@/store'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  suggestedProducts?: SuggestedProduct[]
  timestamp: Date
}

interface SuggestedProduct {
  id: string
  name: string
  slug?: string
  price: number
  image?: string
  primary_image?: string
  images?: { url: string }[]
  rating: number
  compare_at_price?: number
}

interface AIChatDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const quickActions = [
  { icon: TrendingUp, label: 'Trending', prompt: "What's trending right now?", color: 'from-cyan-500 to-teal-500' },
  { icon: Zap, label: 'Flash Deals', prompt: "Show me today's best flash deals", color: 'from-cyan-400 to-blue-500' },
  { icon: Search, label: 'Smart Find', prompt: 'Help me find exactly what I need', color: 'from-teal-500 to-cyan-500' },
  { icon: Heart, label: 'Gift Guide', prompt: 'Suggest perfect gift ideas for my budget', color: 'from-cyan-300 to-cyan-600' },
]

const quickPrompts = [
  'Compare similar products',
  'What are the best sellers?',
  'Find products under £50',
  'Recommend quality electronics',
  'Track my order',
  'Return policy',
]

export function AIChatDrawer({ open, onOpenChange }: AIChatDrawerProps) {
  const [messages, setMessages] = React.useState<Message[]>([])
  const [input, setInput] = React.useState('')
  const [isLoading, setIsLoading] = React.useState(false)
  const [conversationId, setConversationId] = React.useState<string | null>(null)
  const [isExpanded, setIsExpanded] = React.useState(false)
  const scrollRef = React.useRef<HTMLDivElement>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const { addItem: addToCart, openCart } = useCartStore()

  // Auto-scroll to bottom on new messages
  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  // Focus input when drawer opens
  React.useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [open])

  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    const lowerContent = content.toLowerCase()

    try {
      const response = await aiAPI.chat(content.trim(), conversationId || undefined)
      const data = response.data

      if (!conversationId && data.conversation_id) {
        setConversationId(data.conversation_id)
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.message,
        suggestedProducts: data.suggested_products,
        timestamp: new Date(),
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      // Fallback with smart responses when API fails
      let fallbackContent = "I'd be happy to help you find what you're looking for!"
      let fallbackProducts: SuggestedProduct[] = []

      try {
        if (lowerContent.includes('trending') || lowerContent.includes('popular')) {
          fallbackContent = "Here are some trending products that customers love!"
          const res = await productsAPI.getFeatured(3)
          fallbackProducts = res.data?.results || res.data || []
        } else if (lowerContent.includes('deal') || lowerContent.includes('sale') || lowerContent.includes('discount')) {
          fallbackContent = "Check out these amazing deals!"
          const res = await productsAPI.getAll({ limit: 3 })
          fallbackProducts = res.data?.results || res.data || []
        } else if (lowerContent.includes('gift')) {
          fallbackContent = "Here are some great gift ideas!"
          const res = await productsAPI.getFeatured(3)
          fallbackProducts = res.data?.results || res.data || []
        } else if (lowerContent.includes('track') || lowerContent.includes('order')) {
          fallbackContent = "To track your order, go to your account dashboard and click on 'Orders'. You can also check your email for tracking updates."
        } else if (lowerContent.includes('help')) {
          fallbackContent = "I can help you with:\n• Finding products\n• Checking deals\n• Order tracking\n• Product recommendations\n\nWhat would you like to explore?"
        } else {
          fallbackContent = "Let me show you some products you might like!"
          const res = await productsAPI.getFeatured(3)
          fallbackProducts = res.data?.results || res.data || []
        }
      } catch {
        fallbackContent = "I'm having trouble connecting right now. Please try again or browse our products directly."
      }

      const fallbackMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: fallbackContent,
        suggestedProducts: fallbackProducts,
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, fallbackMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddToCart = (product: SuggestedProduct) => {
    addToCart({
      id: product.id,
      name: product.name,
      price: typeof product.price === 'number' ? product.price : parseFloat(product.price),
      image: product.primary_image || product.images?.[0]?.url || product.image || '',
      quantity: 1,
    })
    openCart()
  }

  const clearChat = () => {
    setMessages([])
    setConversationId(null)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendMessage(input)
  }

  const handleQuickPrompt = (prompt: string) => {
    sendMessage(prompt)
  }

  if (!open) return null

  return (
    <div className={cn(
      'fixed z-50 transition-all duration-300 ease-out',
      isExpanded
        ? 'inset-4 md:inset-auto md:bottom-6 md:right-6 md:w-[500px] md:h-[700px]'
        : 'inset-0 md:inset-auto md:bottom-24 md:right-6 md:w-[400px] md:h-[600px]'
    )}>
      {/* Backdrop for mobile */}
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-sm md:hidden"
        onClick={() => onOpenChange(false)}
      />

      {/* Chat Container */}
      <div className="relative h-full w-full md:rounded-2xl bg-background border shadow-2xl flex flex-col overflow-hidden">
        {/* Header - SophieX Dark Theme */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-cyan/20 bg-gradient-to-r from-cyan-dark via-primary to-cyan text-primary-foreground">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="p-2.5 rounded-xl bg-navy/50 backdrop-blur-sm border border-cyan/30">
                <Bot className="h-5 w-5 text-cyan" />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-green-400 border-2 border-navy animate-pulse" />
            </div>
            <div>
              <h3 className="font-semibold flex items-center gap-2">
                Chat with Channah
                <Badge variant="secondary" className="text-[10px] bg-navy/50 text-cyan border border-cyan/30 h-5 font-semibold">
                  <Sparkles className="h-2.5 w-2.5 mr-1" />
                  AI
                </Badge>
              </h3>
              <p className="text-xs text-white/80">Your personal shopping assistant</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-navy/50 h-8 w-8"
              onClick={clearChat}
              title="New conversation"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-navy/50 h-8 w-8 hidden md:flex"
              onClick={() => setIsExpanded(!isExpanded)}
              title={isExpanded ? 'Minimize' : 'Expand'}
            >
              {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-navy/50 h-8 w-8"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Messages Area */}
        <ScrollArea ref={scrollRef} className="flex-1 p-4">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center px-4">
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-gradient-to-br from-cyan to-cyan-light rounded-2xl blur-2xl opacity-30 animate-pulse" />
                <div className="relative p-6 rounded-2xl bg-gradient-to-br from-cyan/10 to-cyan-light/10 border border-cyan/20">
                  <Bot className="h-14 w-14 text-cyan" />
                  <Sparkles className="absolute top-2 right-2 h-4 w-4 text-cyan-light animate-pulse" />
                </div>
              </div>
              <h4 className="font-bold text-xl mb-2 text-gradient-premium">Hi! I'm Channah, your AI assistant</h4>
              <p className="text-sm text-muted-foreground mb-6 max-w-[300px]">
                I can help you find products, discover deals, compare prices, track orders, and answer any questions.
              </p>

              {/* Quick Actions Grid */}
              <div className="grid grid-cols-2 gap-3 w-full max-w-[340px] mb-4">
                {quickActions.map((action) => (
                  <button
                    key={action.label}
                    onClick={() => handleQuickPrompt(action.prompt)}
                    className="flex items-center gap-3 p-3.5 rounded-2xl border border-border bg-card hover:bg-gradient-to-br hover:from-cyan/5 hover:to-cyan-light/5 hover:border-cyan/30 transition-all duration-300 group hover:shadow-lg hover:shadow-cyan/10 hover:-translate-y-0.5"
                  >
                    <div className="p-2.5 rounded-xl bg-gradient-to-br from-cyan/10 to-cyan-light/10 group-hover:from-cyan/20 group-hover:to-cyan-light/20 transition-colors">
                      <action.icon className="h-4 w-4 text-cyan" />
                    </div>
                    <span className="text-sm font-semibold">{action.label}</span>
                  </button>
                ))}
              </div>

              {/* Quick Prompts */}
              <div className="flex flex-wrap gap-2 justify-center">
                {quickPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => handleQuickPrompt(prompt)}
                    className="text-xs px-3 py-1.5 rounded-full bg-navy-light hover:bg-cyan/10 hover:text-cyan transition-colors border border-border"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    'flex gap-3',
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  )}
                >
                  {message.role === 'assistant' && (
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-cyan/10 flex items-center justify-center border border-cyan/20">
                      <Bot className="h-4 w-4 text-cyan" />
                    </div>
                  )}

                  <div
                    className={cn(
                      'max-w-[80%] rounded-2xl px-4 py-2',
                      message.role === 'user'
                        ? 'bg-gradient-to-r from-cyan to-cyan-light text-navy rounded-br-md'
                        : 'bg-card border border-border rounded-bl-md'
                    )}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>

                    {/* Suggested Products */}
                    {message.suggestedProducts && message.suggestedProducts.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {message.suggestedProducts.map((product) => {
                          const productImage = product.primary_image || product.images?.[0]?.url || product.image
                          const productSlug = product.slug || product.id
                          const hasDiscount = product.compare_at_price && parseFloat(String(product.compare_at_price)) > parseFloat(String(product.price))

                          return (
                            <Card key={product.id} className="overflow-hidden hover:shadow-md transition-all duration-200 group">
                              <CardContent className="p-0">
                                <div className="flex items-stretch">
                                  <Link
                                    href={`/product/${productSlug}`}
                                    onClick={() => onOpenChange(false)}
                                    className="flex items-center gap-3 p-2 flex-1 min-w-0"
                                  >
                                    <div className="relative h-14 w-14 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                                      {productImage && !productImage.includes('undefined') ? (
                                        <Image
                                          src={productImage}
                                          alt={product.name}
                                          fill
                                          className="object-cover group-hover:scale-110 transition-transform duration-300"
                                        />
                                      ) : (
                                        <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-primary/5 to-gold/5">
                                          <Package className="h-6 w-6 text-muted-foreground/50" />
                                        </div>
                                      )}
                                      {hasDiscount && (
                                        <Badge className="absolute -top-1 -left-1 text-[8px] h-4 px-1 bg-red-500 text-white border-0">
                                          SALE
                                        </Badge>
                                      )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium line-clamp-1 group-hover:text-cyan transition-colors">
                                        {product.name}
                                      </p>
                                      <div className="flex items-center gap-2 mt-0.5">
                                        <span className="text-sm font-bold text-cyan">
                                          {formatPrice(typeof product.price === 'number' ? product.price : parseFloat(product.price))}
                                        </span>
                                        {hasDiscount && (
                                          <span className="text-[10px] text-muted-foreground line-through">
                                            {formatPrice(parseFloat(String(product.compare_at_price)))}
                                          </span>
                                        )}
                                      </div>
                                      {product.rating > 0 && (
                                        <div className="flex items-center gap-1 mt-0.5">
                                          <span className="text-yellow-500">★</span>
                                          <span className="text-[10px] text-muted-foreground">
                                            {product.rating.toFixed(1)}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  </Link>
                                  <button
                                    onClick={(e) => {
                                      e.preventDefault()
                                      handleAddToCart(product)
                                    }}
                                    className="flex items-center justify-center w-12 bg-cyan/5 hover:bg-cyan hover:text-navy transition-colors border-l border-border"
                                    title="Add to cart"
                                  >
                                    <ShoppingCart className="h-4 w-4" />
                                  </button>
                                </div>
                              </CardContent>
                            </Card>
                          )
                        })}
                      </div>
                    )}
                  </div>

                  {message.role === 'user' && (
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-r from-cyan to-cyan-light flex items-center justify-center">
                      <User className="h-4 w-4 text-navy" />
                    </div>
                  )}
                </div>
              ))}

              {isLoading && (
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-cyan/10 flex items-center justify-center border border-cyan/20">
                    <Bot className="h-4 w-4 text-cyan" />
                  </div>
                  <div className="bg-card border border-border rounded-2xl rounded-bl-md px-4 py-2">
                    <div className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-cyan animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 rounded-full bg-cyan animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 rounded-full bg-cyan animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        {/* Input Area */}
        <div className="p-4 border-t border-border bg-gradient-to-t from-navy-dark to-background">
          <form onSubmit={handleSubmit} className="flex gap-3">
            <div className="relative flex-1">
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask me anything..."
                disabled={isLoading}
                className="pr-4 h-12 rounded-2xl border-2 border-border focus:border-cyan focus:shadow-lg focus:shadow-cyan/10 transition-all bg-card"
              />
            </div>
            <Button
              type="submit"
              size="icon"
              disabled={isLoading || !input.trim()}
              className="h-12 w-12 rounded-2xl bg-gradient-to-r from-cyan to-cyan-light text-navy hover:opacity-95 transition-all shadow-lg shadow-cyan/20 hover:shadow-xl hover:shadow-cyan/30 hover:scale-105"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </Button>
          </form>
          <p className="text-[10px] text-center text-muted-foreground mt-3 flex items-center justify-center gap-1">
            <Sparkles className="h-3 w-3 text-cyan" />
            Powered by Channah AI - Your smart shopping companion
          </p>
        </div>
      </div>
    </div>
  )
}
