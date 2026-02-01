'use client'

import * as React from 'react'
import {
  MessageSquare,
  Search,
  Send,
  Loader2,
  User,
  Clock,
  CheckCircle,
  XCircle,
  Headphones,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { supportChatAPI } from '@/lib/api'

interface SupportChat {
  id: string
  customer_id: string
  admin_id?: string
  status: string
  subject: string
  created_at: string
  updated_at: string
  customer_name?: string
  customer_email?: string
  admin_name?: string
  last_message?: string
  unread_count: number
}

interface ChatMessage {
  id: string
  chat_id: string
  sender_id: string
  sender_role: 'customer' | 'admin'
  sender_name?: string
  content: string
  is_read: boolean
  created_at: string
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 1) return 'now'
  if (diffMins < 60) return `${diffMins}m ago`
  const diffHrs = Math.floor(diffMins / 60)
  if (diffHrs < 24) return `${diffHrs}h ago`
  return date.toLocaleDateString()
}

function statusBadge(status: string) {
  switch (status) {
    case 'open':
      return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">Open</Badge>
    case 'active':
      return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Active</Badge>
    case 'closed':
      return <Badge variant="secondary">Closed</Badge>
    default:
      return <Badge variant="secondary">{status}</Badge>
  }
}

export default function SupportChatPage() {
  const [isLoading, setIsLoading] = React.useState(true)
  const [chats, setChats] = React.useState<SupportChat[]>([])
  const [selectedChat, setSelectedChat] = React.useState<SupportChat | null>(null)
  const [messages, setMessages] = React.useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = React.useState('')
  const [isSending, setIsSending] = React.useState(false)
  const [activeTab, setActiveTab] = React.useState('all')
  const [searchQuery, setSearchQuery] = React.useState('')
  const [typingIndicator, setTypingIndicator] = React.useState(false)
  const scrollRef = React.useRef<HTMLDivElement>(null)
  const wsRef = React.useRef<WebSocket | null>(null)
  const pollRef = React.useRef<NodeJS.Timeout | null>(null)

  // Load chats
  React.useEffect(() => {
    loadChats()
    // Poll for new chats every 10 seconds
    pollRef.current = setInterval(loadChats, 10000)
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
      wsRef.current?.close()
    }
  }, [])

  // Auto-scroll
  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, typingIndicator])

  const loadChats = async () => {
    try {
      const data = await supportChatAPI.getChats()
      setChats(Array.isArray(data) ? data : [])
    } catch {
      // silent
    } finally {
      setIsLoading(false)
    }
  }

  const selectChat = async (chat: SupportChat) => {
    setSelectedChat(chat)
    try {
      const msgs = await supportChatAPI.getMessages(chat.id)
      setMessages(Array.isArray(msgs) ? msgs : [])
    } catch {
      setMessages([])
    }
    connectWebSocket(chat.id)
    // Update unread in local state
    setChats(prev => prev.map(c => c.id === chat.id ? { ...c, unread_count: 0 } : c))
  }

  const connectWebSocket = (chatId: string) => {
    wsRef.current?.close()
    const token = localStorage.getItem('admin_access_token')
    if (!token) return

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'
    const wsBase = apiUrl.replace(/^http/, 'ws').replace(/\/api\/v1$/, '')
    const ws = new WebSocket(`${wsBase}/api/v1/support-chat/ws/${chatId}`)

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'auth', token }))
    }

    ws.onmessage = (event) => {
      let data: any
      try { data = JSON.parse(event.data) } catch { return }
      if (data.type === 'new_message') {
        setMessages(prev => [...prev, data.message])
        setTypingIndicator(false)
      } else if (data.type === 'typing') {
        setTypingIndicator(true)
        setTimeout(() => setTypingIndicator(false), 3000)
      } else if (data.type === 'chat_closed') {
        setSelectedChat(prev => prev ? { ...prev, status: 'closed' } : null)
      }
    }

    wsRef.current = ws
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedChat || isSending) return
    const content = newMessage.trim()
    setNewMessage('')
    setIsSending(true)
    try {
      const msg = await supportChatAPI.sendMessage(selectedChat.id, content)
      setMessages(prev => {
        if (prev.find(m => m.id === msg.id)) return prev
        return [...prev, msg]
      })
      // Update chat status locally
      if (selectedChat.status === 'open') {
        setSelectedChat(prev => prev ? { ...prev, status: 'active' } : null)
        setChats(prev => prev.map(c => c.id === selectedChat.id ? { ...c, status: 'active', last_message: content } : c))
      } else {
        setChats(prev => prev.map(c => c.id === selectedChat.id ? { ...c, last_message: content } : c))
      }
    } catch {
      setNewMessage(content)
    } finally {
      setIsSending(false)
    }
  }

  const handleCloseChat = async () => {
    if (!selectedChat) return
    try {
      await supportChatAPI.closeChat(selectedChat.id)
      setSelectedChat(prev => prev ? { ...prev, status: 'closed' } : null)
      setChats(prev => prev.map(c => c.id === selectedChat.id ? { ...c, status: 'closed' } : c))
    } catch {
      // error handled by interceptor
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const sendTyping = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'typing' }))
    }
  }

  const filteredChats = chats.filter(chat => {
    if (activeTab !== 'all' && chat.status !== activeTab) return false
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      return (
        chat.subject.toLowerCase().includes(q) ||
        (chat.customer_name || '').toLowerCase().includes(q) ||
        (chat.customer_email || '').toLowerCase().includes(q)
      )
    }
    return true
  })

  const totalUnread = chats.reduce((sum, c) => sum + c.unread_count, 0)

  if (isLoading) {
    return (
      <div className="h-[calc(100vh-8rem)] flex gap-6">
        <div className="w-80 space-y-4">
          <Skeleton className="h-10" />
          <Skeleton className="h-10" />
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
        <Skeleton className="flex-1" />
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold font-display">Live Chat</h1>
          <p className="text-muted-foreground">Real-time customer support conversations</p>
        </div>
        <div className="flex items-center gap-3">
          {totalUnread > 0 && (
            <Badge variant="destructive" className="gap-1">
              {totalUnread} unread
            </Badge>
          )}
          <Badge variant="outline" className="gap-1">
            <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            {chats.filter(c => c.status === 'open' || c.status === 'active').length} Active
          </Badge>
        </div>
      </div>

      <div className="flex-1 flex gap-4 min-h-0">
        {/* Chat List */}
        <div className="w-80 flex flex-col min-h-0">
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search chats..."
              className="pl-9"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-3">
            <TabsList className="w-full">
              <TabsTrigger value="all" className="flex-1">All</TabsTrigger>
              <TabsTrigger value="open" className="flex-1">Open</TabsTrigger>
              <TabsTrigger value="active" className="flex-1">Active</TabsTrigger>
              <TabsTrigger value="closed" className="flex-1">Closed</TabsTrigger>
            </TabsList>
          </Tabs>

          <ScrollArea className="flex-1">
            <div className="space-y-1 pr-2">
              {filteredChats.length === 0 ? (
                <div className="text-center py-12">
                  <MessageSquare className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <h3 className="text-sm font-medium">No chats found</h3>
                  <p className="text-xs text-muted-foreground mt-1">Customer chats will appear here</p>
                </div>
              ) : (
                filteredChats.map(chat => (
                  <Card
                    key={chat.id}
                    className={cn(
                      'cursor-pointer transition-colors',
                      selectedChat?.id === chat.id
                        ? 'border-primary bg-primary/5'
                        : 'hover:bg-muted/50'
                    )}
                    onClick={() => selectChat(chat)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback className="text-xs">
                            {getInitials(chat.customer_name || 'U')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium truncate">{chat.customer_name || 'Customer'}</p>
                            <span className="text-[10px] text-muted-foreground ml-2 whitespace-nowrap">
                              {formatTime(chat.updated_at)}
                            </span>
                          </div>
                          <p className="text-xs font-medium text-muted-foreground truncate">{chat.subject}</p>
                          {chat.last_message && (
                            <p className="text-xs text-muted-foreground truncate mt-0.5">{chat.last_message}</p>
                          )}
                          <div className="flex items-center gap-2 mt-1">
                            {statusBadge(chat.status)}
                            {chat.unread_count > 0 && (
                              <Badge variant="destructive" className="h-5 min-w-[20px] px-1 justify-center text-[10px]">
                                {chat.unread_count}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Chat Area */}
        {selectedChat ? (
          <Card className="flex-1 flex flex-col min-h-0">
            {/* Header */}
            <div className="p-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback>{getInitials(selectedChat.customer_name || 'U')}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{selectedChat.customer_name || 'Customer'}</p>
                    {statusBadge(selectedChat.status)}
                  </div>
                  <p className="text-sm text-muted-foreground">{selectedChat.subject}</p>
                  {selectedChat.customer_email && (
                    <p className="text-xs text-muted-foreground">{selectedChat.customer_email}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {selectedChat.status !== 'closed' && (
                  <Button variant="outline" size="sm" onClick={handleCloseChat}>
                    <XCircle className="h-4 w-4 mr-1" />
                    Close Chat
                  </Button>
                )}
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4" ref={scrollRef}>
              <div className="space-y-3">
                {messages.length === 0 ? (
                  <div className="text-center py-12">
                    <MessageSquare className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                    <h3 className="text-sm font-medium">No messages yet</h3>
                  </div>
                ) : (
                  messages.map(msg => (
                    <div
                      key={msg.id}
                      className={cn('flex gap-2', msg.sender_role === 'admin' ? 'justify-end' : 'justify-start')}
                    >
                      {msg.sender_role === 'customer' && (
                        <Avatar className="h-7 w-7 flex-shrink-0">
                          <AvatarFallback className="text-[10px]">
                            {getInitials(selectedChat.customer_name || 'U')}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <div className={cn(
                        'max-w-[70%] rounded-lg p-3',
                        msg.sender_role === 'admin'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      )}>
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                        <div className="flex items-center gap-1 mt-1">
                          <p className="text-[10px] opacity-70">
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                          {msg.sender_role === 'admin' && msg.is_read && (
                            <CheckCircle className="h-3 w-3 opacity-70" />
                          )}
                        </div>
                      </div>
                      {msg.sender_role === 'admin' && (
                        <Avatar className="h-7 w-7 flex-shrink-0">
                          <AvatarFallback className="text-[10px] bg-primary/10">
                            <Headphones className="h-3.5 w-3.5" />
                          </AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  ))
                )}
                {typingIndicator && (
                  <div className="flex gap-2">
                    <Avatar className="h-7 w-7 flex-shrink-0">
                      <AvatarFallback className="text-[10px]">
                        {getInitials(selectedChat.customer_name || 'U')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="bg-muted rounded-lg p-3">
                      <div className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Input */}
            {selectedChat.status !== 'closed' ? (
              <div className="p-4 border-t">
                <div className="flex gap-2">
                  <Input
                    value={newMessage}
                    onChange={e => { setNewMessage(e.target.value); sendTyping() }}
                    onKeyDown={handleKeyDown}
                    placeholder="Type your reply..."
                    disabled={isSending}
                    className="flex-1"
                  />
                  <Button onClick={handleSendMessage} disabled={!newMessage.trim() || isSending}>
                    {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="p-4 border-t text-center">
                <p className="text-sm text-muted-foreground">This chat has been closed.</p>
              </div>
            )}
          </Card>
        ) : (
          <Card className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Headphones className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium">Select a conversation</h3>
              <p className="text-sm text-muted-foreground">Choose a chat from the list to start replying</p>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
