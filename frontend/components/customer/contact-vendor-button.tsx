'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { MessageSquare, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { chatAPI } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'

interface ContactVendorButtonProps {
  vendorId: string
  vendorName: string
  orderId?: string
  orderNumber?: string
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  className?: string
}

export function ContactVendorButton({
  vendorId,
  vendorName,
  orderId,
  orderNumber,
  variant = 'outline',
  size = 'default',
  className,
}: ContactVendorButtonProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [open, setOpen] = React.useState(false)
  const [subject, setSubject] = React.useState('')
  const [message, setMessage] = React.useState('')
  const [loading, setLoading] = React.useState(false)

  React.useEffect(() => {
    if (open && orderNumber) {
      setSubject(`Question about Order #${orderNumber}`)
    }
  }, [open, orderNumber])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a message',
        variant: 'destructive'
      })
      return
    }

    setLoading(true)
    try {
      const chat = await chatAPI.createChat({
        vendor_id: vendorId,
        order_id: orderId,
        subject: subject || `Message to ${vendorName}`,
        initial_message: message
      })

      toast({
        title: 'Success',
        description: 'Message sent to vendor'
      })

      setOpen(false)
      setSubject('')
      setMessage('')

      // Navigate to the chat
      router.push(`/account/messages/${chat.id}`)
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to send message',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} size={size} className={className}>
          <MessageSquare className="h-4 w-4 mr-2" />
          Contact Vendor
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Contact {vendorName}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div>
            <label className="text-sm font-medium mb-2 block">
              Subject {orderNumber && `(Order #${orderNumber})`}
            </label>
            <Input
              placeholder="e.g., Question about my order"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Message *</label>
            <Textarea
              placeholder="Type your message here..."
              rows={5}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !message.trim()}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                'Send Message'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
