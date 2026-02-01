'use client'

import * as React from 'react'
import {
  MessageSquare,
  Search,
  Send,
  User,
  Clock,
  CheckCircle,
  XCircle,
  Sparkles,
  Bot,
  MoreHorizontal,
  RefreshCw,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { supportAPI } from '@/lib/api'
import { useMessagesStore, useNotificationStore } from '@/store'

interface SupportChat {
  id: string
  customer_id: string
  admin_id: string | null
  status: string
  subject: string
  created_at: string
  updated_at: string
  customer_name: string | null
  customer_email: string | null
  admin_name: string | null
  last_message: string | null
  unread_count: number
}

interface ChatMessage {
  id: string
  chat_id: string
  sender_id: string
  sender_role: string
  sender_name: string | null
  content: string
  is_read: boolean
  created_at: string
}

function getStatusBadge(status: string) {
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

function getInitials(name: string | null) {
  if (!name) return '?'
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

function formatTime(dateStr: string) {
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export default function SupportPage() {
  const { toast } = useToast()
  const { setUnreadMessagesCount } = useMessagesStore()
  const { markAsRead, notifications } = useNotificationStore()
  const [isLoading, setIsLoading] = React.useState(true)
  const [chats, setChats] = React.useState<SupportChat[]>([])
  const [selectedChat, setSelectedChat] = React.useState<SupportChat | null>(null)
  const [messages, setMessages] = React.useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = React.useState('')
  const [isSending, setIsSending] = React.useState(false)
  const [activeTab, setActiveTab] = React.useState('all')
  const [searchQuery, setSearchQuery] = React.useState('')
  const scrollRef = React.useRef<HTMLDivElement>(null)
  const wsRef = React.useRef<WebSocket | null>(null)

  // Fetch chats
  const fetchChats = React.useCallback(async () => {
    try {
      setIsLoading(true)
      const data = await supportAPI.getTickets()
      const chatList = Array.isArray(data) ? data : []
      setChats(chatList)
    } catch (error) {
      console.error('Failed to fetch support chats:', error)
      setChats([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchChats()
    // Poll for new chats every 10 seconds
    const interval = setInterval(fetchChats, 10000)
    return () => clearInterval(interval)
  }, [fetchChats])

  // When on support page and chats load, recalculate unread based on actual unread_count
  React.useEffect(() => {
    if (chats.length > 0) {
      const totalUnread = chats.filter(c => (c.status === 'open' || c.status === 'active') && c.unread_count > 0).length
      setUnreadMessagesCount(totalUnread)
    }
  }, [chats, setUnreadMessagesCount])

  // Auto-scroll
  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  // WebSocket connection
  React.useEffect(() => {
    if (!selectedChat) return

    const wsUrl = supportAPI.getWebSocketUrl(selectedChat.id)
    const ws = new WebSocket(wsUrl)
    wsRef.current = ws

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      if (data.type === 'new_message') {
        setMessages(prev => prev.some(m => m.id === data.message.id) ? prev : [...prev, data.message])
        // Update chat list
        setChats(prev => prev.map(c =>
          c.id === selectedChat.id
            ? { ...c, last_message: data.message.content, updated_at: data.message.created_at }
            : c
        ))
      }
    }

    ws.onerror = () => console.error('WebSocket error')

    return () => {
      ws.close()
      wsRef.current = null
    }
  }, [selectedChat?.id])

  const fetchMessages = async (chatId: string) => {
    try {
      const data = await supportAPI.getMessages(chatId)
      setMessages(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Failed to fetch messages:', error)
      setMessages([])
    }
  }

  const handleSelectChat = (chat: SupportChat) => {
    setSelectedChat(chat)
    fetchMessages(chat.id)
    // Reset unread for this chat
    setChats(prev => prev.map(c => c.id === chat.id ? { ...c, unread_count: 0 } : c))
    // Mark related notification as read
    const notifId = `chat-${chat.id}`
    const notif = notifications.find(n => n.id === notifId)
    if (notif && !notif.read) {
      markAsRead(notifId)
    }
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedChat || isSending) return

    setIsSending(true)
    try {
      const msg = await supportAPI.sendMessage(selectedChat.id, newMessage.trim())
      setMessages(prev => prev.some(m => m.id === msg.id) ? prev : [...prev, msg])
      setNewMessage('')
      // Update chat list
      setChats(prev => prev.map(c =>
        c.id === selectedChat.id
          ? { ...c, last_message: newMessage.trim(), updated_at: new Date().toISOString(), status: 'active' }
          : c
      ))
    } catch (error) {
      console.error('Failed to send message:', error)
      toast({ title: 'Error', description: 'Failed to send message', variant: 'destructive' })
    } finally {
      setIsSending(false)
    }
  }

  const handleCloseChat = async () => {
    if (!selectedChat) return
    try {
      await supportAPI.closeChat(selectedChat.id)
      setChats(prev => prev.map(c => c.id === selectedChat.id ? { ...c, status: 'closed' } : c))
      setSelectedChat(prev => prev ? { ...prev, status: 'closed' } : null)
      toast({ title: 'Chat closed', description: 'The support chat has been closed.' })
    } catch (error) {
      console.error('Failed to close chat:', error)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
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

  if (isLoading) {
    return (
      <div className="h-[calc(100vh-8rem)] flex gap-6">
        <div className="w-80 space-y-4">
          <Skeleton className="h-10" />
          <Skeleton className="h-10" />
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
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
          <h1 className="text-2xl font-bold font-display">Customer Support</h1>
          <p className="text-muted-foreground">
            Live chat with customers in real-time
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={fetchChats} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Badge variant="outline" className="gap-1">
            <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            {chats.filter(c => c.status === 'open').length} Open
          </Badge>
          <Badge variant="outline" className="gap-1">
            <span className="h-2 w-2 rounded-full bg-blue-500" />
            {chats.filter(c => c.status === 'active').length} Active
          </Badge>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-4 lg:gap-6 min-h-0">
        {/* Chat List */}
        <div className="w-full lg:w-80 flex flex-col">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search chats..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-4">
            <TabsList className="w-full">
              <TabsTrigger value="all" className="flex-1">All</TabsTrigger>
              <TabsTrigger value="open" className="flex-1">Open</TabsTrigger>
              <TabsTrigger value="active" className="flex-1">Active</TabsTrigger>
              <TabsTrigger value="closed" className="flex-1">Closed</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {filteredChats.length === 0 ? (
              <div className="text-center py-12">
                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-sm font-medium">No chats found</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Customer support chats will appear here
                </p>
              </div>
            ) : (
              filteredChats.map((chat) => (
                <Card
                  key={chat.id}
                  className={cn(
                    'cursor-pointer transition-colors',
                    selectedChat?.id === chat.id
                      ? 'border-primary bg-primary/5'
                      : 'hover:bg-muted/50'
                  )}
                  onClick={() => handleSelectChat(chat)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback>{getInitials(chat.customer_name)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium truncate">
                            {chat.customer_name || chat.customer_email || 'Customer'}
                          </p>
                          <span className="text-xs text-muted-foreground">
                            {formatTime(chat.updated_at)}
                          </span>
                        </div>
                        <p className="text-xs font-medium text-muted-foreground truncate mt-0.5">
                          {chat.subject}
                        </p>
                        {chat.last_message && (
                          <p className="text-xs text-muted-foreground truncate mt-0.5">
                            {chat.last_message}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          {getStatusBadge(chat.status)}
                          {chat.unread_count > 0 && (
                            <Badge variant="destructive" className="h-5 min-w-[20px] p-0 justify-center text-[10px]">
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
        </div>

        {/* Chat Area */}
        {selectedChat ? (
          <div className="flex-1 flex flex-col xl:flex-row gap-4 lg:gap-6 min-h-0">
            <Card className="flex-1 flex flex-col min-h-0">
              {/* Chat Header */}
              <div className="p-4 border-b flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>{getInitials(selectedChat.customer_name)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">
                        {selectedChat.customer_name || selectedChat.customer_email || 'Customer'}
                      </p>
                      {getStatusBadge(selectedChat.status)}
                    </div>
                    <p className="text-sm text-muted-foreground">{selectedChat.subject}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {selectedChat.status !== 'closed' && (
                    <Button variant="outline" size="sm" onClick={handleCloseChat} className="gap-1">
                      <XCircle className="h-4 w-4" />
                      Close Chat
                    </Button>
                  )}
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4" ref={scrollRef}>
                <div className="space-y-4">
                  {messages.length === 0 ? (
                    <div className="text-center py-12">
                      <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-sm font-medium">No messages yet</h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        Start the conversation by sending a message
                      </p>
                    </div>
                  ) : (
                    messages.map((message) => (
                      <div
                        key={message.id}
                        className={cn(
                          'flex gap-3',
                          message.sender_role === 'admin' && 'justify-end'
                        )}
                      >
                        {message.sender_role !== 'admin' && (
                          <Avatar className="h-8 w-8 shrink-0">
                            <AvatarFallback>{getInitials(message.sender_name)}</AvatarFallback>
                          </Avatar>
                        )}
                        <div
                          className={cn(
                            'rounded-lg p-3 max-w-[70%]',
                            message.sender_role === 'admin'
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted'
                          )}
                        >
                          <p className="text-xs font-medium mb-1 opacity-80">
                            {message.sender_name || (message.sender_role === 'admin' ? 'Admin' : 'Customer')}
                          </p>
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                          <p className="text-xs opacity-60 mt-1">
                            {formatTime(message.created_at)}
                          </p>
                        </div>
                        {message.sender_role === 'admin' && (
                          <Avatar className="h-8 w-8 shrink-0">
                            <AvatarFallback className="bg-primary/10 text-primary">
                              <User className="h-4 w-4" />
                            </AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Input Area */}
              {selectedChat.status !== 'closed' ? (
                <div className="p-4 border-t">
                  <div className="flex gap-2">
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Type your response..."
                      className="flex-1"
                      disabled={isSending}
                    />
                    <Button onClick={handleSendMessage} disabled={!newMessage.trim() || isSending}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="p-4 border-t text-center text-sm text-muted-foreground">
                  This chat has been closed.
                </div>
              )}
            </Card>

            {/* Customer Info Sidebar */}
            <Card className="w-full xl:w-64">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Customer Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Name</p>
                  <p className="text-sm font-medium">{selectedChat.customer_name || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Email</p>
                  <p className="text-sm text-primary break-all">{selectedChat.customer_email || '-'}</p>
                </div>
                <Separator />
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Subject</p>
                  <p className="text-sm">{selectedChat.subject}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Status</p>
                  {getStatusBadge(selectedChat.status)}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Created</p>
                  <p className="text-sm">{new Date(selectedChat.created_at).toLocaleString()}</p>
                </div>
                {selectedChat.admin_name && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Assigned To</p>
                    <p className="text-sm">{selectedChat.admin_name}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium">Select a chat</h3>
              <p className="text-sm text-muted-foreground">
                Choose a chat from the list to view the conversation
              </p>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
