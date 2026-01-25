'use client'

import * as React from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Send, Phone, Video, MoreVertical, Store, ImageIcon, Paperclip, Smile, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { chatAPI } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'

interface Message {
  id: string
  chat_id: string
  sender_id: string
  content: string
  message_type: string
  file_url?: string
  is_read: boolean
  created_at: string
  sender_name?: string
  is_customer: boolean
}

interface Chat {
  id: string
  customer_id: string
  vendor_id: string
  vendor_business_name?: string
  subject?: string
  status: string
}

export default function ChatPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const chatId = params.chatId as string

  const [chat, setChat] = React.useState<Chat | null>(null)
  const [messages, setMessages] = React.useState<Message[]>([])
  const [loading, setLoading] = React.useState(true)
  const [sending, setSending] = React.useState(false)
  const [messageText, setMessageText] = React.useState('')
  const scrollRef = React.useRef<HTMLDivElement>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    if (chatId) {
      fetchChatData()
    }
  }, [chatId])

  React.useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const fetchChatData = async () => {
    setLoading(true)
    try {
      const [chatData, messagesData] = await Promise.all([
        chatAPI.getChat(chatId),
        chatAPI.getMessages(chatId, { limit: 100 })
      ])
      setChat(chatData)
      setMessages(messagesData)
    } catch (error: any) {
      console.error('Failed to fetch chat:', error)
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to load chat',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!messageText.trim() || sending) return

    const tempMessage: Message = {
      id: `temp-${Date.now()}`,
      chat_id: chatId,
      sender_id: 'current-user',
      content: messageText,
      message_type: 'text',
      is_read: false,
      created_at: new Date().toISOString(),
      is_customer: true
    }

    setMessages(prev => [...prev, tempMessage])
    const text = messageText
    setMessageText('')
    setSending(true)

    try {
      const newMessage = await chatAPI.sendMessage(chatId, {
        content: text,
        message_type: 'text'
      })

      setMessages(prev => prev.map(msg =>
        msg.id === tempMessage.id ? newMessage : msg
      ))
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to send message',
        variant: 'destructive'
      })
      setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id))
      setMessageText(text)
    } finally {
      setSending(false)
    }
  }

  const handleVoiceCall = () => {
    toast({
      title: 'Voice Call',
      description: 'Voice calling feature coming soon!',
    })
  }

  const handleVideoCall = () => {
    toast({
      title: 'Video Call',
      description: 'Video calling feature coming soon!',
    })
  }

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const formatDateDivider = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return 'Today'
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday'
    } else {
      return date.toLocaleDateString()
    }
  }

  const groupedMessages = React.useMemo(() => {
    const groups: { [key: string]: Message[] } = {}
    messages.forEach(msg => {
      const date = new Date(msg.created_at).toDateString()
      if (!groups[date]) groups[date] = []
      groups[date].push(msg)
    })
    return groups
  }, [messages])

  if (loading) {
    return (
      <div className="flex flex-col h-[calc(100vh-200px)]">
        <div className="border-b p-4">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        </div>
        <div className="flex-1 p-4 space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className={cn('flex', i % 2 === 0 ? 'justify-end' : 'justify-start')}>
              <Skeleton className="h-16 w-64 rounded-2xl" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!chat) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Chat not found</h2>
          <Button onClick={() => router.push('/account/messages')}>
            Go back to messages
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] max-w-5xl mx-auto border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="border-b bg-card p-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/account/messages')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>

          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-primary/10 text-primary">
              <Store className="h-5 w-5" />
            </AvatarFallback>
          </Avatar>

          <div className="flex-1">
            <h2 className="font-semibold">{chat.vendor_business_name || 'Vendor'}</h2>
            {chat.subject && (
              <p className="text-sm text-muted-foreground">{chat.subject}</p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleVoiceCall}
              className="hover:bg-primary/10 hover:text-primary"
            >
              <Phone className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleVideoCall}
              className="hover:bg-primary/10 hover:text-primary"
            >
              <Video className="h-5 w-5" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>View vendor profile</DropdownMenuItem>
                <DropdownMenuItem>View order</DropdownMenuItem>
                <DropdownMenuItem>Mark as resolved</DropdownMenuItem>
                <DropdownMenuItem className="text-destructive">Close chat</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea ref={scrollRef} className="flex-1 p-4">
        <div className="space-y-4">
          {Object.entries(groupedMessages).map(([date, msgs]) => (
            <div key={date}>
              {/* Date divider */}
              <div className="flex items-center justify-center my-4">
                <div className="bg-muted px-3 py-1 rounded-full text-xs text-muted-foreground">
                  {formatDateDivider(msgs[0].created_at)}
                </div>
              </div>

              {/* Messages for this date */}
              {msgs.map((message, index) => {
                const isOwnMessage = message.is_customer
                const showAvatar = index === 0 || msgs[index - 1]?.is_customer !== message.is_customer

                return (
                  <div
                    key={message.id}
                    className={cn(
                      'flex items-end gap-2 mb-2',
                      isOwnMessage ? 'flex-row-reverse' : 'flex-row'
                    )}
                  >
                    {showAvatar ? (
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className={isOwnMessage ? 'bg-primary text-primary-foreground' : 'bg-muted'}>
                          {isOwnMessage ? 'Y' : 'V'}
                        </AvatarFallback>
                      </Avatar>
                    ) : (
                      <div className="h-8 w-8" />
                    )}

                    <div className={cn(
                      'flex flex-col max-w-[70%]',
                      isOwnMessage && 'items-end'
                    )}>
                      <div className={cn(
                        'rounded-2xl px-4 py-2',
                        isOwnMessage
                          ? 'bg-primary text-primary-foreground rounded-br-sm'
                          : 'bg-muted rounded-bl-sm'
                      )}>
                        <p className="text-sm whitespace-pre-wrap break-words">
                          {message.content}
                        </p>
                      </div>
                      <span className="text-[10px] text-muted-foreground mt-1 px-1">
                        {formatMessageTime(message.created_at)}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="border-t bg-card p-4">
        <form onSubmit={handleSendMessage} className="flex gap-2 items-end">
          <div className="flex gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="hover:bg-primary/10 hover:text-primary"
            >
              <Paperclip className="h-5 w-5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="hover:bg-primary/10 hover:text-primary"
            >
              <ImageIcon className="h-5 w-5" />
            </Button>
          </div>

          <Input
            ref={inputRef}
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder="Type your message..."
            className="flex-1"
            disabled={sending}
          />

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="hover:bg-primary/10 hover:text-primary"
          >
            <Smile className="h-5 w-5" />
          </Button>

          <Button
            type="submit"
            size="icon"
            disabled={!messageText.trim() || sending}
            className="bg-primary hover:bg-primary/90"
          >
            {sending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </Button>
        </form>
      </div>
    </div>
  )
}
