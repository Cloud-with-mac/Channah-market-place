'use client'

import * as React from 'react'
import {
  X,
  Send,
  Loader2,
  Headphones,
  ArrowLeft,
  Plus,
  MessageSquare,
  Clock,
  CheckCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { supportChatAPI } from '@/lib/api'

interface SupportMessage {
  id: string
  chat_id: string
  sender_id: string
  sender_role: 'customer' | 'admin'
  sender_name?: string
  content: string
  is_read: boolean
  created_at: string
}

interface SupportChat {
  id: string
  customer_id: string
  admin_id?: string
  status: string
  subject: string
  created_at: string
  updated_at: string
  customer_name?: string
  admin_name?: string
  last_message?: string
  unread_count: number
}

interface SupportChatWidgetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

type View = 'list' | 'chat' | 'new'

export function SupportChatWidget({ open, onOpenChange }: SupportChatWidgetProps) {
  const [view, setView] = React.useState<View>('list')
  const [chats, setChats] = React.useState<SupportChat[]>([])
  const [selectedChat, setSelectedChat] = React.useState<SupportChat | null>(null)
  const [messages, setMessages] = React.useState<SupportMessage[]>([])
  const [input, setInput] = React.useState('')
  const [subject, setSubject] = React.useState('')
  const [firstMessage, setFirstMessage] = React.useState('')
  const [isLoading, setIsLoading] = React.useState(false)
  const [isSending, setIsSending] = React.useState(false)
  const [typingIndicator, setTypingIndicator] = React.useState(false)
  const [isLoggedIn, setIsLoggedIn] = React.useState(false)
  const scrollRef = React.useRef<HTMLDivElement>(null)
  const wsRef = React.useRef<WebSocket | null>(null)

  // Check auth on open
  React.useEffect(() => {
    if (open) {
      const token = localStorage.getItem('access_token')
      setIsLoggedIn(!!token)
      if (token) {
        loadChats()
      }
    }
    return () => {
      wsRef.current?.close()
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
        pollIntervalRef.current = null
      }
    }
  }, [open])

  // Auto-scroll
  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, typingIndicator])

  const loadChats = async () => {
    try {
      setIsLoading(true)
      const data = await supportChatAPI.getChats()
      setChats(Array.isArray(data) ? data : [])
    } catch {
      setChats([])
    } finally {
      setIsLoading(false)
    }
  }

  const openChat = async (chat: SupportChat) => {
    setSelectedChat(chat)
    setView('chat')
    try {
      const msgs = await supportChatAPI.getMessages(chat.id)
      setMessages(Array.isArray(msgs) ? msgs : [])
    } catch {
      setMessages([])
    }
    connectWebSocket(chat.id)
  }

  const pollIntervalRef = React.useRef<ReturnType<typeof setInterval> | null>(null)

  const connectWebSocket = (chatId: string) => {
    wsRef.current?.close()
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current)
      pollIntervalRef.current = null
    }
    const token = localStorage.getItem('access_token')
    if (!token) return

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'
    const wsBase = apiUrl.replace(/^http/, 'ws').replace(/\/api\/v1$/, '')
    const ws = new WebSocket(`${wsBase}/api/v1/support-chat/ws/${chatId}`)

    let wsConnected = false

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'auth', token }))
      wsConnected = true
      // Clear polling if WS connected
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
        pollIntervalRef.current = null
      }
    }

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      if (data.type === 'new_message') {
        setMessages(prev => prev.some(m => m.id === data.message.id) ? prev : [...prev, data.message])
        setTypingIndicator(false)
      } else if (data.type === 'typing') {
        setTypingIndicator(true)
        setTimeout(() => setTypingIndicator(false), 3000)
      } else if (data.type === 'chat_closed') {
        setSelectedChat(prev => prev ? { ...prev, status: 'closed' } : null)
      }
    }

    ws.onerror = () => {
      // Fallback to polling if WebSocket fails
      if (!pollIntervalRef.current) {
        startPolling(chatId)
      }
    }

    ws.onclose = () => {
      // Fallback to polling if WebSocket closes unexpectedly
      if (!pollIntervalRef.current && view === 'chat') {
        startPolling(chatId)
      }
    }

    wsRef.current = ws

    // Also start polling as backup (WebSocket may silently fail)
    startPolling(chatId)
  }

  const startPolling = (chatId: string) => {
    if (pollIntervalRef.current) return
    pollIntervalRef.current = setInterval(async () => {
      try {
        const msgs = await supportChatAPI.getMessages(chatId)
        const msgList = Array.isArray(msgs) ? msgs : []
        setMessages(prev => {
          if (msgList.length > prev.length) return msgList
          return prev
        })
      } catch {
        // ignore polling errors
      }
    }, 5000)
  }

  const sendTyping = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'typing' }))
    }
  }

  const handleCreateChat = async () => {
    if (!subject.trim() || !firstMessage.trim()) return
    setIsSending(true)
    try {
      const chat = await supportChatAPI.createChat({ subject: subject.trim(), message: firstMessage.trim() })
      setSubject('')
      setFirstMessage('')
      await loadChats()
      openChat(chat)
    } catch {
      // error handled by interceptor
    } finally {
      setIsSending(false)
    }
  }

  const handleSendMessage = async () => {
    if (!input.trim() || !selectedChat || isSending) return
    const content = input.trim()
    setInput('')
    setIsSending(true)
    try {
      const msg = await supportChatAPI.sendMessage(selectedChat.id, content)
      // Only add if not already received via WS
      setMessages(prev => {
        if (prev.find(m => m.id === msg.id)) return prev
        return [...prev, msg]
      })
    } catch {
      // restore input on error
      setInput(content)
    } finally {
      setIsSending(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (view === 'new') handleCreateChat()
      else handleSendMessage()
    }
  }

  const goBack = () => {
    wsRef.current?.close()
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current)
      pollIntervalRef.current = null
    }
    setSelectedChat(null)
    setMessages([])
    setView('list')
    loadChats()
  }

  if (!open) return null

  return (
    <div className="fixed z-50 inset-0 sm:inset-auto sm:bottom-24 sm:right-6 sm:w-[380px] sm:h-[520px] sm:max-h-[calc(100vh-120px)]">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm sm:hidden" onClick={() => onOpenChange(false)} />

      <div className="relative h-full w-full sm:rounded-2xl bg-background border shadow-2xl flex flex-col overflow-hidden sm:max-h-[520px]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-600 text-white">
          <div className="flex items-center gap-3">
            {view !== 'list' && (
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 h-8 w-8" onClick={goBack}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <div className="p-2 rounded-xl bg-white/10 backdrop-blur-sm">
              <Headphones className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">
                {view === 'new' ? 'New Conversation' : view === 'chat' ? (selectedChat?.subject || 'Support Chat') : 'Support Chat'}
              </h3>
              <p className="text-xs text-white/80">
                {view === 'chat' && selectedChat
                  ? selectedChat.status === 'closed' ? 'Closed' : 'Connected to support'
                  : 'We are here to help'}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 h-8 w-8" onClick={() => onOpenChange(false)}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Login Required */}
        {!isLoggedIn && (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <div className="p-4 rounded-full bg-emerald-100 dark:bg-emerald-900/30 mb-4">
              <Headphones className="h-8 w-8 text-emerald-600" />
            </div>
            <h4 className="text-base font-semibold mb-2">Login Required</h4>
            <p className="text-sm text-muted-foreground mb-6">
              Please log in to your account to chat with our support team.
            </p>
            <Button
              onClick={() => {
                window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname) + '&reason=support'
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-6"
            >
              Log In to Continue
            </Button>
            <button
              onClick={() => onOpenChange(false)}
              className="mt-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Maybe later
            </button>
          </div>
        )}

        {/* Body */}
        {isLoggedIn && view === 'list' && (
          <div className="flex-1 flex flex-col min-h-0">
            <div className="p-3 border-b">
              <Button onClick={() => setView('new')} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
                <Plus className="h-4 w-4 mr-2" />
                Start New Conversation
              </Button>
            </div>
            <ScrollArea className="flex-1">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : chats.length === 0 ? (
                <div className="text-center py-12 px-4">
                  <MessageSquare className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <h4 className="text-sm font-medium mb-1">No conversations yet</h4>
                  <p className="text-xs text-muted-foreground">Start a new conversation with our support team.</p>
                </div>
              ) : (
                <div className="space-y-1 p-2">
                  {chats.map(chat => (
                    <button
                      key={chat.id}
                      onClick={() => openChat(chat)}
                      className="w-full text-left p-3 rounded-lg hover:bg-muted/50 transition-colors border border-transparent hover:border-border"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium truncate flex-1">{chat.subject}</span>
                        <div className="flex items-center gap-1.5 ml-2">
                          {chat.unread_count > 0 && (
                            <Badge variant="destructive" className="h-5 min-w-[20px] px-1 justify-center text-[10px]">
                              {chat.unread_count}
                            </Badge>
                          )}
                          {chat.status === 'closed' ? (
                            <CheckCircle className="h-3.5 w-3.5 text-muted-foreground" />
                          ) : (
                            <Clock className="h-3.5 w-3.5 text-emerald-500" />
                          )}
                        </div>
                      </div>
                      {chat.last_message && (
                        <p className="text-xs text-muted-foreground truncate">{chat.last_message}</p>
                      )}
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {new Date(chat.updated_at).toLocaleDateString()}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        )}

        {isLoggedIn && view === 'new' && (
          <div className="flex-1 flex flex-col p-4 gap-3 overflow-y-auto">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Subject</label>
              <Input
                value={subject}
                onChange={e => setSubject(e.target.value)}
                placeholder="What do you need help with?"
                className="h-10"
              />
            </div>
            <div className="flex flex-col min-h-0">
              <label className="text-sm font-medium mb-1.5 block">Message</label>
              <textarea
                value={firstMessage}
                onChange={e => setFirstMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Describe your issue..."
                className="w-full h-32 min-h-[80px] max-h-[200px] rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <Button
              onClick={handleCreateChat}
              disabled={!subject.trim() || !firstMessage.trim() || isSending}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {isSending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
              Send
            </Button>
          </div>
        )}

        {isLoggedIn && view === 'chat' && (
          <>
            <ScrollArea ref={scrollRef} className="flex-1 p-4">
              <div className="space-y-3">
                {messages.map(msg => (
                  <div key={msg.id} className={cn('flex gap-2', msg.sender_role === 'customer' ? 'justify-end' : 'justify-start')}>
                    {msg.sender_role === 'admin' && (
                      <div className="flex-shrink-0 w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                        <Headphones className="h-3.5 w-3.5 text-emerald-600" />
                      </div>
                    )}
                    <div className={cn(
                      'max-w-[75%] rounded-2xl px-3 py-2',
                      msg.sender_role === 'customer'
                        ? 'bg-emerald-600 text-white rounded-br-md'
                        : 'bg-muted rounded-bl-md'
                    )}>
                      {msg.sender_role === 'admin' && msg.sender_name && (
                        <p className="text-[10px] font-medium mb-0.5 text-emerald-600">{msg.sender_name}</p>
                      )}
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      <p className={cn('text-[10px] mt-1', msg.sender_role === 'customer' ? 'text-white/70' : 'text-muted-foreground')}>
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
                {typingIndicator && (
                  <div className="flex gap-2">
                    <div className="flex-shrink-0 w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                      <Headphones className="h-3.5 w-3.5 text-emerald-600" />
                    </div>
                    <div className="bg-muted rounded-2xl rounded-bl-md px-3 py-2">
                      <div className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {selectedChat?.status !== 'closed' ? (
              <div className="p-3 border-t">
                <form onSubmit={e => { e.preventDefault(); handleSendMessage() }} className="flex gap-2">
                  <Input
                    value={input}
                    onChange={e => { setInput(e.target.value); sendTyping() }}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a message..."
                    disabled={isSending}
                    className="flex-1 h-10 rounded-xl"
                  />
                  <Button
                    type="submit"
                    size="icon"
                    disabled={!input.trim() || isSending}
                    className="h-10 w-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </form>
              </div>
            ) : (
              <div className="p-3 border-t text-center">
                <p className="text-sm text-muted-foreground">This conversation has been closed.</p>
                <Button variant="outline" size="sm" className="mt-2" onClick={() => setView('new')}>
                  Start New Conversation
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
