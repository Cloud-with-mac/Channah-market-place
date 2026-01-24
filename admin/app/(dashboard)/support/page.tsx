'use client'

import * as React from 'react'
import {
  MessageSquare,
  Search,
  Send,
  User,
  Clock,
  CheckCircle,
  AlertCircle,
  Sparkles,
  Bot,
  Phone,
  Mail,
  MoreHorizontal,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { formatRelativeTime, getInitials } from '@/lib/utils'

interface Ticket {
  id: string
  customer: {
    name: string
    email: string
    avatar?: string
  }
  subject: string
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  created_at: string
  last_message: string
  unread_count: number
}

interface Message {
  id: string
  sender: 'customer' | 'admin' | 'ai'
  content: string
  timestamp: string
}

// Mock tickets
const mockTickets: Ticket[] = [
  {
    id: '1',
    customer: { name: 'John Smith', email: 'john@example.com' },
    subject: 'Order not delivered',
    status: 'open',
    priority: 'high',
    created_at: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    last_message: 'My order has not arrived yet and it\'s been 2 weeks.',
    unread_count: 2,
  },
  {
    id: '2',
    customer: { name: 'Sarah Johnson', email: 'sarah@example.com' },
    subject: 'Refund request',
    status: 'in_progress',
    priority: 'medium',
    created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    last_message: 'I\'d like to request a refund for my recent purchase.',
    unread_count: 0,
  },
  {
    id: '3',
    customer: { name: 'Mike Williams', email: 'mike@example.com' },
    subject: 'Product inquiry',
    status: 'open',
    priority: 'low',
    created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    last_message: 'Is this product available in blue color?',
    unread_count: 1,
  },
  {
    id: '4',
    customer: { name: 'Emily Brown', email: 'emily@example.com' },
    subject: 'Payment issue',
    status: 'in_progress',
    priority: 'urgent',
    created_at: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    last_message: 'I was charged twice for my order!',
    unread_count: 3,
  },
]

// Mock messages for selected ticket
const mockMessages: Message[] = [
  {
    id: '1',
    sender: 'customer',
    content: 'Hi, I placed an order 2 weeks ago (Order #ORD-5823) and it still hasn\'t arrived. The tracking shows it\'s been stuck in transit for over a week now.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
  },
  {
    id: '2',
    sender: 'ai',
    content: '**AI Analysis:** Based on the order details, this shipment appears to be delayed due to carrier issues. The estimated delivery was 3 days ago. **Suggested action:** Offer expedited reshipping or full refund.',
    timestamp: new Date(Date.now() - 1000 * 60 * 55).toISOString(),
  },
  {
    id: '3',
    sender: 'customer',
    content: 'This is really frustrating. I needed this for a gift and now it\'s too late.',
    timestamp: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
  },
]

function getPriorityBadge(priority: string) {
  switch (priority) {
    case 'urgent':
      return <Badge variant="destructive">Urgent</Badge>
    case 'high':
      return <Badge className="bg-orange-500/10 text-orange-500">High</Badge>
    case 'medium':
      return <Badge variant="warning">Medium</Badge>
    default:
      return <Badge variant="secondary">Low</Badge>
  }
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'open':
      return <Badge variant="info">Open</Badge>
    case 'in_progress':
      return <Badge variant="warning">In Progress</Badge>
    case 'resolved':
      return <Badge variant="success">Resolved</Badge>
    case 'closed':
      return <Badge variant="secondary">Closed</Badge>
    default:
      return <Badge variant="secondary">{status}</Badge>
  }
}

export default function SupportPage() {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = React.useState(true)
  const [tickets] = React.useState<Ticket[]>(mockTickets)
  const [selectedTicket, setSelectedTicket] = React.useState<Ticket | null>(null)
  const [messages, setMessages] = React.useState<Message[]>(mockMessages)
  const [newMessage, setNewMessage] = React.useState('')
  const [isGeneratingAI, setIsGeneratingAI] = React.useState(false)
  const [activeTab, setActiveTab] = React.useState('all')
  const scrollRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    setTimeout(() => setIsLoading(false), 1000)
  }, [])

  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const filteredTickets = tickets.filter((ticket) => {
    if (activeTab === 'all') return true
    return ticket.status === activeTab
  })

  const handleSendMessage = () => {
    if (!newMessage.trim()) return

    const message: Message = {
      id: Date.now().toString(),
      sender: 'admin',
      content: newMessage,
      timestamp: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, message])
    setNewMessage('')
    toast({
      title: 'Message sent',
      description: 'Your response has been sent to the customer.',
    })
  }

  const handleGenerateAISuggestion = async () => {
    setIsGeneratingAI(true)
    await new Promise((resolve) => setTimeout(resolve, 1500))

    const suggestion = `I sincerely apologize for the inconvenience caused by the delayed delivery. I understand how frustrating this must be, especially when you needed it for a gift.

I've looked into your order #ORD-5823 and can confirm the shipment is currently delayed with the carrier. To make this right, I'd like to offer you:

1. **Full refund** for your order
2. **Express reshipping** with priority handling (delivery within 2-3 days)
3. **20% discount code** for your next purchase

Please let me know which option works best for you, and I'll process it immediately.`

    setNewMessage(suggestion)
    setIsGeneratingAI(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

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
            Manage support tickets with AI-powered suggestions
          </p>
        </div>
        <Badge variant="outline" className="gap-1">
          <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
          {tickets.filter((t) => t.status === 'open').length} Open Tickets
        </Badge>
      </div>

      <div className="flex-1 flex gap-6 min-h-0">
        {/* Tickets List */}
        <div className="w-80 flex flex-col">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search tickets..." className="pl-9" />
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-4">
            <TabsList className="w-full">
              <TabsTrigger value="all" className="flex-1">All</TabsTrigger>
              <TabsTrigger value="open" className="flex-1">Open</TabsTrigger>
              <TabsTrigger value="in_progress" className="flex-1">Active</TabsTrigger>
            </TabsList>
          </Tabs>

          <ScrollArea className="flex-1">
            <div className="space-y-2 pr-4">
              {filteredTickets.map((ticket) => (
                <Card
                  key={ticket.id}
                  className={cn(
                    'cursor-pointer transition-colors',
                    selectedTicket?.id === ticket.id
                      ? 'border-primary bg-primary/5'
                      : 'hover:bg-muted/50'
                  )}
                  onClick={() => setSelectedTicket(ticket)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={ticket.customer.avatar} />
                        <AvatarFallback>
                          {getInitials(ticket.customer.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium truncate">
                            {ticket.customer.name}
                          </p>
                          <span className="text-xs text-muted-foreground">
                            {formatRelativeTime(ticket.created_at)}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {ticket.subject}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          {getPriorityBadge(ticket.priority)}
                          {ticket.unread_count > 0 && (
                            <Badge variant="destructive" className="h-5 w-5 p-0 justify-center">
                              {ticket.unread_count}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Chat Area */}
        {selectedTicket ? (
          <Card className="flex-1 flex flex-col">
            {/* Chat Header */}
            <div className="p-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={selectedTicket.customer.avatar} />
                  <AvatarFallback>
                    {getInitials(selectedTicket.customer.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{selectedTicket.customer.name}</p>
                    {getStatusBadge(selectedTicket.status)}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {selectedTicket.subject}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon">
                  <Phone className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon">
                  <Mail className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4" ref={scrollRef}>
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      'flex gap-3',
                      message.sender === 'admin' && 'justify-end'
                    )}
                  >
                    {message.sender !== 'admin' && (
                      <Avatar className="h-8 w-8 shrink-0">
                        {message.sender === 'ai' ? (
                          <AvatarFallback className="bg-gradient-premium text-white">
                            <Bot className="h-4 w-4" />
                          </AvatarFallback>
                        ) : (
                          <AvatarFallback>
                            {getInitials(selectedTicket.customer.name)}
                          </AvatarFallback>
                        )}
                      </Avatar>
                    )}
                    <div
                      className={cn(
                        'rounded-lg p-3 max-w-[70%]',
                        message.sender === 'admin'
                          ? 'bg-primary text-primary-foreground'
                          : message.sender === 'ai'
                          ? 'bg-gradient-premium-light border border-primary/20'
                          : 'bg-muted'
                      )}
                    >
                      {message.sender === 'ai' && (
                        <div className="flex items-center gap-1 text-xs text-primary mb-2">
                          <Sparkles className="h-3 w-3" />
                          AI Suggestion
                        </div>
                      )}
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {formatRelativeTime(message.timestamp)}
                      </p>
                    </div>
                    {message.sender === 'admin' && (
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

            {/* Input Area */}
            <div className="p-4 border-t space-y-3">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleGenerateAISuggestion}
                  disabled={isGeneratingAI}
                >
                  <Sparkles className={cn('h-4 w-4 mr-2', isGeneratingAI && 'animate-spin')} />
                  {isGeneratingAI ? 'Generating...' : 'AI Suggest'}
                </Button>
                <Button variant="outline" size="sm">
                  Mark Resolved
                </Button>
              </div>
              <div className="flex gap-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type your response..."
                  className="flex-1"
                />
                <Button onClick={handleSendMessage} disabled={!newMessage.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        ) : (
          <Card className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium">Select a ticket</h3>
              <p className="text-sm text-muted-foreground">
                Choose a ticket from the list to view the conversation
              </p>
            </div>
          </Card>
        )}

        {/* Customer Info Sidebar */}
        {selectedTicket && (
          <Card className="w-64 hidden xl:block">
            <CardHeader>
              <CardTitle className="text-sm">Customer Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="text-sm">{selectedTicket.customer.email}</p>
              </div>
              <Separator />
              <div>
                <p className="text-xs text-muted-foreground">Total Orders</p>
                <p className="text-sm font-medium">12</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Customer Since</p>
                <p className="text-sm">Jan 2024</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Spent</p>
                <p className="text-sm font-medium">£1,250.00</p>
              </div>
              <Separator />
              <div>
                <p className="text-xs text-muted-foreground mb-2">Recent Orders</p>
                <div className="space-y-2">
                  <div className="text-xs p-2 bg-muted rounded">
                    <p className="font-medium">#ORD-5823</p>
                    <p className="text-muted-foreground">£89.99 • In Transit</p>
                  </div>
                  <div className="text-xs p-2 bg-muted rounded">
                    <p className="font-medium">#ORD-5701</p>
                    <p className="text-muted-foreground">£145.00 • Delivered</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
