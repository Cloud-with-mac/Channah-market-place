'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { MessageSquare, Search, Plus, Clock, CheckCheck, User, Store } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { chatAPI } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'

interface Chat {
  id: string
  customer_id: string
  vendor_id: string
  vendor_business_name?: string
  subject?: string
  last_message?: string
  last_message_at?: string
  unread_by_customer: boolean
  status: string
}

interface Vendor {
  id: string
  business_name: string
  slug: string
  logo_url?: string
  rating: number
  order_count: number
}

export default function MessagesPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [chats, setChats] = React.useState<Chat[]>([])
  const [vendors, setVendors] = React.useState<Vendor[]>([])
  const [loading, setLoading] = React.useState(true)
  const [searchQuery, setSearchQuery] = React.useState('')
  const [showNewChatDialog, setShowNewChatDialog] = React.useState(false)
  const [newChatVendorId, setNewChatVendorId] = React.useState('')
  const [newChatSubject, setNewChatSubject] = React.useState('')
  const [newChatMessage, setNewChatMessage] = React.useState('')
  const [creatingChat, setCreatingChat] = React.useState(false)

  React.useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [chatsData, vendorsData] = await Promise.all([
        chatAPI.getChats(),
        chatAPI.getContactedVendors()
      ])
      setChats(chatsData)
      setVendors(vendorsData)
    } catch (error) {
      console.error('Failed to fetch data:', error)
      toast({
        title: 'Error',
        description: 'Failed to load messages',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateChat = async () => {
    if (!newChatVendorId || !newChatMessage.trim()) {
      toast({
        title: 'Error',
        description: 'Please select a vendor and enter a message',
        variant: 'destructive'
      })
      return
    }

    setCreatingChat(true)
    try {
      const chat = await chatAPI.createChat({
        vendor_id: newChatVendorId,
        subject: newChatSubject || 'Customer inquiry',
        initial_message: newChatMessage
      })

      toast({
        title: 'Success',
        description: 'Chat started with vendor'
      })

      setShowNewChatDialog(false)
      setNewChatVendorId('')
      setNewChatSubject('')
      setNewChatMessage('')

      router.push(`/account/messages/${chat.id}`)
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to create chat',
        variant: 'destructive'
      })
    } finally {
      setCreatingChat(false)
    }
  }

  const filteredChats = chats.filter(chat =>
    chat.vendor_business_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chat.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chat.last_message?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const formatTime = (dateString?: string) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  return (
    <div className="container max-w-6xl py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Messages</h1>
          <p className="text-muted-foreground">Contact vendors about your orders</p>
        </div>

        <Dialog open={showNewChatDialog} onOpenChange={setShowNewChatDialog}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              New Message
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Start New Conversation</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Select Vendor</label>
                <Select value={newChatVendorId} onValueChange={setNewChatVendorId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a vendor you've ordered from" />
                  </SelectTrigger>
                  <SelectContent>
                    {vendors.map((vendor) => (
                      <SelectItem key={vendor.id} value={vendor.id}>
                        <div className="flex items-center gap-2">
                          <Store className="h-4 w-4" />
                          {vendor.business_name}
                          <span className="text-xs text-muted-foreground">({vendor.order_count} orders)</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Subject (optional)</label>
                <Input
                  placeholder="e.g., Question about my order"
                  value={newChatSubject}
                  onChange={(e) => setNewChatSubject(e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Message</label>
                <Textarea
                  placeholder="Type your message here..."
                  rows={4}
                  value={newChatMessage}
                  onChange={(e) => setNewChatMessage(e.target.value)}
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowNewChatDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateChat} disabled={creatingChat}>
                  {creatingChat ? 'Sending...' : 'Send Message'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search conversations..."
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Conversations List */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                  <Skeleton className="h-3 w-16" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredChats.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <MessageSquare className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No conversations yet</h3>
            <p className="text-muted-foreground text-center mb-6">
              {searchQuery
                ? 'No conversations match your search'
                : 'Start a conversation with a vendor about your orders'}
            </p>
            {!searchQuery && (
              <Button onClick={() => setShowNewChatDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Start New Conversation
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredChats.map((chat) => (
            <Link key={chat.id} href={`/account/messages/${chat.id}`}>
              <Card className={cn(
                'hover:shadow-md transition-shadow cursor-pointer',
                chat.unread_by_customer && 'border-l-4 border-l-primary'
              )}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-primary/10 text-primary">
                        <Store className="h-6 w-6" />
                      </AvatarFallback>
                    </Avatar>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold truncate">
                          {chat.vendor_business_name || 'Vendor'}
                        </h3>
                        {chat.unread_by_customer && (
                          <Badge variant="default" className="h-5 px-2">New</Badge>
                        )}
                        {chat.status === 'resolved' && (
                          <Badge variant="outline" className="h-5 px-2">
                            <CheckCheck className="h-3 w-3 mr-1" />
                            Resolved
                          </Badge>
                        )}
                      </div>
                      {chat.subject && (
                        <p className="text-sm text-muted-foreground mb-1 truncate">
                          {chat.subject}
                        </p>
                      )}
                      <p className="text-sm text-muted-foreground truncate">
                        {chat.last_message || 'No messages yet'}
                      </p>
                    </div>

                    {/* Time */}
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatTime(chat.last_message_at)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
