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
  RotateCcw,
  Headphones,
  ArrowLeft,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { aiAPI, productsAPI, supportChatAPI } from '@/lib/api'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  products?: any[]
  suggestions?: string[]
  sender_name?: string
}

type ChatMode = 'ai' | 'support'

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
  const [chatMode, setChatMode] = React.useState<ChatMode>('ai')
  const [supportChatId, setSupportChatId] = React.useState<string | null>(null)
  const [supportSubject, setSupportSubject] = React.useState('')
  const [showSubjectInput, setShowSubjectInput] = React.useState(false)
  const scrollRef = React.useRef<HTMLDivElement>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const wsRef = React.useRef<WebSocket | null>(null)

  // Auto-scroll to bottom when new messages arrive
  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, isTyping])

  // Welcome message for AI mode
  React.useEffect(() => {
    if (chatMode === 'ai') {
      const welcomeMessage: Message = {
        id: 'welcome',
        role: 'assistant',
        content: "Hello! I'm your Vendora AI shopping assistant. I can help you find products, answer questions, track orders, and provide personalized recommendations. How can I help you today?",
        timestamp: new Date(),
        suggestions: suggestedPrompts.slice(0, 4),
      }
      setMessages([welcomeMessage])
    }
  }, [])

  // WebSocket + polling for support mode
  const supportPollRef = React.useRef<ReturnType<typeof setInterval> | null>(null)

  React.useEffect(() => {
    if (chatMode !== 'support' || !supportChatId) return

    const token = localStorage.getItem('access_token')
    if (!token) return

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'
    const wsBase = apiUrl.replace(/^http/, 'ws').replace(/\/api\/v1$/, '')
    const ws = new WebSocket(`${wsBase}/api/v1/support-chat/ws/${supportChatId}`)
    wsRef.current = ws

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'auth', token }))
    }

    ws.onmessage = (event) => {
      let data: any
      try { data = JSON.parse(event.data) } catch { return }
      if (data.type === 'new_message' && data.message.sender_role === 'admin') {
        setMessages(prev => {
          if (prev.some(m => m.id === data.message.id)) return prev
          return [...prev, {
            id: data.message.id,
            role: 'assistant',
            content: data.message.content,
            timestamp: new Date(data.message.created_at),
            sender_name: data.message.sender_name || 'Support Agent',
          }]
        })
      } else if (data.type === 'typing') {
        setIsTyping(true)
        setTimeout(() => setIsTyping(false), 2000)
      }
    }

    // Polling fallback for messages
    const chatId = supportChatId
    supportPollRef.current = setInterval(async () => {
      try {
        const msgs = await supportChatAPI.getMessages(chatId)
        const msgList = Array.isArray(msgs) ? msgs : []
        const adminMsgs = msgList.filter((m: any) => m.sender_role === 'admin')
        setMessages(prev => {
          const currentAdminCount = prev.filter(m => m.role === 'assistant' && m.id !== 'support-welcome').length
          if (adminMsgs.length > currentAdminCount) {
            // Rebuild messages from API data
            return msgList.map((m: any) => ({
              id: m.id,
              role: m.sender_role === 'customer' ? 'user' as const : 'assistant' as const,
              content: m.content,
              timestamp: new Date(m.created_at),
              sender_name: m.sender_name,
            }))
          }
          return prev
        })
      } catch {
        // ignore polling errors
      }
    }, 5000)

    return () => {
      ws.close()
      wsRef.current = null
      if (supportPollRef.current) {
        clearInterval(supportPollRef.current)
        supportPollRef.current = null
      }
    }
  }, [chatMode, supportChatId])

  const generateResponse = async (userMessage: string): Promise<Message> => {
    const lowerMessage = userMessage.toLowerCase()

    let responseContent = ''
    let products: any[] = []
    let suggestions: string[] = []

    try {
      const aiResponse = await aiAPI.chat(userMessage).catch(() => null)

      if (aiResponse?.message) {
        responseContent = aiResponse.message
        products = aiResponse.products || []
        suggestions = aiResponse.suggestions || []
      } else {
        if (lowerMessage.includes('trending') || lowerMessage.includes('popular')) {
          responseContent = "Here are some trending products that customers are loving right now!"
          const trendingData = await productsAPI.getFeatured(4).catch(() => [])
          products = trendingData?.results || trendingData || []
          suggestions = ["Show me more trending items", "What's new this week?", "Best sellers in electronics"]
        } else if (lowerMessage.includes('sale') || lowerMessage.includes('discount') || lowerMessage.includes('deal')) {
          responseContent = "Great news! We have amazing deals available. Check out these products with special discounts!"
          const saleData = await productsAPI.getAll({ limit: 4 }).catch(() => [])
          products = saleData?.results || saleData || []
          suggestions = ["Show me flash deals", "When do new sales start?", "Best discounts today"]
        } else if (lowerMessage.includes('track') || lowerMessage.includes('order')) {
          responseContent = "To track your order, please go to your account dashboard and click on 'Orders'. You can also enter your order number on our order tracking page."
          suggestions = ["Go to my orders", "How long does shipping take?", "Talk to support"]
        } else if (lowerMessage.includes('support') || lowerMessage.includes('human') || lowerMessage.includes('agent') || lowerMessage.includes('talk to')) {
          responseContent = "I'd be happy to connect you with our support team! Click the 'Talk to Support' button below to start a live chat with a support agent."
          suggestions = ["Talk to support"]
        } else if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
          responseContent = "Hello! How can I assist you with your shopping today?"
          suggestions = ["What's on sale?", "New arrivals", "Popular products", "Talk to support"]
        } else {
          responseContent = "I'd be happy to help you with that! Feel free to ask me anything about our products, deals, or services."
          const defaultData = await productsAPI.getFeatured(4).catch(() => [])
          products = defaultData?.results || defaultData || []
          suggestions = ["Tell me more", "Show different products", "Talk to support"]
        }
      }
    } catch (error) {
      responseContent = "I apologize, but I'm having trouble connecting right now. You can try talking to our support team instead."
      suggestions = ["Talk to support", "Browse products"]
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
    const currentInput = input.trim()
    setInput('')
    setIsLoading(true)

    if (chatMode === 'support' && supportChatId) {
      // Send to support backend
      try {
        await supportChatAPI.sendMessage(supportChatId, currentInput)
      } catch (error) {
        console.error('Failed to send message:', error)
      }
      setIsLoading(false)
    } else {
      // AI mode
      setIsTyping(true)
      await new Promise(resolve => setTimeout(resolve, 1000))
      const assistantMessage = await generateResponse(currentInput)
      setIsTyping(false)
      setMessages(prev => [...prev, assistantMessage])
      setIsLoading(false)
    }
  }

  const handleStartSupport = () => {
    const token = localStorage.getItem('access_token')
    if (!token) {
      window.location.href = '/login?redirect=' + encodeURIComponent('/chat') + '&reason=support'
      return
    }
    setShowSubjectInput(true)
  }

  const handleCreateSupportChat = async () => {
    if (!supportSubject.trim()) return

    setIsLoading(true)
    try {
      const chat = await supportChatAPI.createChat({
        subject: supportSubject.trim(),
        message: `Hi, I need help with: ${supportSubject.trim()}`,
      })

      setSupportChatId(chat.id)
      setChatMode('support')
      setShowSubjectInput(false)
      setSupportSubject('')

      setMessages([
        {
          id: 'support-welcome',
          role: 'assistant',
          content: `You're now connected to our support team. A support agent will respond shortly.\n\nSubject: ${supportSubject.trim()}\n\nPlease describe your issue and we'll help you as soon as possible.`,
          timestamp: new Date(),
          sender_name: 'Support System',
        },
        {
          id: 'first-msg',
          role: 'user',
          content: `Hi, I need help with: ${supportSubject.trim()}`,
          timestamp: new Date(),
        },
      ])

      // Load existing messages
      try {
        const msgs = await supportChatAPI.getMessages(chat.id)
        if (Array.isArray(msgs) && msgs.length > 0) {
          setMessages(msgs.map((m: any) => ({
            id: m.id,
            role: m.sender_role === 'customer' ? 'user' as const : 'assistant' as const,
            content: m.content,
            timestamp: new Date(m.created_at),
            sender_name: m.sender_name,
          })))
        }
      } catch (e) {
        // Use the default messages set above
      }
    } catch (error) {
      console.error('Failed to create support chat:', error)
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: 'Sorry, I could not connect you to support. Please try again later.',
        timestamp: new Date(),
      }])
    } finally {
      setIsLoading(false)
    }
  }

  const handleBackToAI = () => {
    setChatMode('ai')
    setSupportChatId(null)
    setShowSubjectInput(false)
    wsRef.current?.close()
    wsRef.current = null
    const welcomeMessage: Message = {
      id: 'welcome-back',
      role: 'assistant',
      content: "You're back with the AI assistant. How can I help you?",
      timestamp: new Date(),
      suggestions: suggestedPrompts.slice(0, 4),
    }
    setMessages([welcomeMessage])
  }

  const handleSuggestionClick = (suggestion: string) => {
    if (suggestion.toLowerCase() === 'talk to support') {
      handleStartSupport()
      return
    }
    setInput(suggestion)
    inputRef.current?.focus()
  }

  const handleQuickAction = (prompt: string) => {
    setInput(prompt)
    inputRef.current?.focus()
  }

  const clearChat = () => {
    if (chatMode === 'support') {
      handleBackToAI()
      return
    }
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
          {chatMode === 'support' && (
            <Button variant="ghost" size="icon" onClick={handleBackToAI} className="mr-1">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          <div className="relative">
            <div className={cn(
              "h-12 w-12 rounded-full flex items-center justify-center",
              chatMode === 'ai'
                ? "bg-gradient-to-br from-primary to-gold"
                : "bg-gradient-to-br from-green-500 to-emerald-600"
            )}>
              {chatMode === 'ai' ? (
                <Bot className="h-6 w-6 text-white" />
              ) : (
                <Headphones className="h-6 w-6 text-white" />
              )}
            </div>
            <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-background" />
          </div>
          <div>
            <h1 className="font-bold text-lg flex items-center gap-2">
              {chatMode === 'ai' ? 'Vendora AI Assistant' : 'Live Support'}
              <Badge variant="secondary" className="text-xs">
                {chatMode === 'ai' ? (
                  <><Sparkles className="h-3 w-3 mr-1" /> AI Powered</>
                ) : (
                  <><Headphones className="h-3 w-3 mr-1" /> Live Agent</>
                )}
              </Badge>
            </h1>
            <p className="text-sm text-muted-foreground">
              {chatMode === 'ai' ? 'Always here to help you shop smarter' : 'Connected to support team'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {chatMode === 'ai' && (
            <Button variant="outline" size="sm" onClick={handleStartSupport} className="gap-2">
              <Headphones className="h-4 w-4" />
              Talk to Support
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={clearChat}>
            <RotateCcw className="h-4 w-4 mr-2" />
            {chatMode === 'support' ? 'Back to AI' : 'New Chat'}
          </Button>
        </div>
      </div>

      {/* Subject Input for Support */}
      {showSubjectInput && (
        <div className="p-4 border-b bg-green-50 dark:bg-green-950/30">
          <p className="text-sm font-medium mb-2">What do you need help with?</p>
          <div className="flex gap-2">
            <Input
              value={supportSubject}
              onChange={(e) => setSupportSubject(e.target.value)}
              placeholder="e.g., Order issue, Payment problem, Product question..."
              className="flex-1"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateSupportChat()
              }}
              autoFocus
            />
            <Button onClick={handleCreateSupportChat} disabled={!supportSubject.trim() || isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Start Chat'}
            </Button>
            <Button variant="ghost" onClick={() => setShowSubjectInput(false)}>Cancel</Button>
          </div>
        </div>
      )}

      {/* Quick Actions - AI mode only */}
      {chatMode === 'ai' && messages.length <= 1 && !showSubjectInput && (
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
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4">
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
                message.role === 'assistant' && chatMode === 'ai' && 'bg-gradient-to-br from-primary to-gold',
                message.role === 'assistant' && chatMode === 'support' && 'bg-gradient-to-br from-green-500 to-emerald-600',
              )}>
                {message.role === 'assistant' ? (
                  <AvatarFallback className="bg-transparent">
                    {chatMode === 'ai' ? (
                      <Bot className="h-4 w-4 text-white" />
                    ) : (
                      <Headphones className="h-4 w-4 text-white" />
                    )}
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
                {message.sender_name && message.role === 'assistant' && chatMode === 'support' && (
                  <span className="text-xs text-muted-foreground">{message.sender_name}</span>
                )}
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
                        className={cn(
                          "text-xs h-7",
                          suggestion.toLowerCase() === 'talk to support'
                            ? "hover:bg-green-500/10 hover:border-green-500 text-green-600"
                            : "hover:bg-primary/10 hover:border-primary"
                        )}
                        onClick={() => handleSuggestionClick(suggestion)}
                      >
                        {suggestion.toLowerCase() === 'talk to support' && (
                          <Headphones className="h-3 w-3 mr-1" />
                        )}
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
              <Avatar className={cn(
                "h-8 w-8",
                chatMode === 'ai'
                  ? "bg-gradient-to-br from-primary to-gold"
                  : "bg-gradient-to-br from-green-500 to-emerald-600"
              )}>
                <AvatarFallback className="bg-transparent">
                  {chatMode === 'ai' ? (
                    <Bot className="h-4 w-4 text-white" />
                  ) : (
                    <Headphones className="h-4 w-4 text-white" />
                  )}
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
      </div>

      {/* Input */}
      <div className="p-4 border-t bg-background">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={chatMode === 'ai'
                ? "Ask me anything about products, deals, or orders..."
                : "Type your message to support..."
              }
              className="pr-10 h-12 text-base rounded-full border-2 focus:border-primary"
              disabled={isLoading || showSubjectInput}
            />
          </div>
          <Button
            type="submit"
            size="icon"
            className={cn(
              "h-12 w-12 rounded-full hover:opacity-90",
              chatMode === 'ai'
                ? "bg-gradient-to-r from-primary to-gold"
                : "bg-gradient-to-r from-green-500 to-emerald-600"
            )}
            disabled={isLoading || !input.trim() || showSubjectInput}
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </Button>
        </form>
        <p className="text-[10px] text-center text-muted-foreground mt-2">
          {chatMode === 'ai'
            ? 'Vendora AI may make mistakes. Always verify important information.'
            : 'You are chatting with our support team. Messages are delivered in real-time.'
          }
        </p>
      </div>
    </div>
  )
}
