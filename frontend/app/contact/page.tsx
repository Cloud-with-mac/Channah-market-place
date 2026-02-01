'use client'

import * as React from 'react'
import { Metadata } from 'next'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  Send,
  Loader2,
  MessageSquare,
  HelpCircle,
  ShoppingBag,
  Store,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { contactAPI } from '@/lib/api'

const contactSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email'),
  subject: z.string().min(1, 'Please select a subject'),
  order_number: z.string().optional(),
  message: z.string().min(10, 'Message must be at least 10 characters'),
})

type ContactFormData = z.infer<typeof contactSchema>

const subjects = [
  { value: 'general', label: 'General Inquiry', icon: MessageSquare },
  { value: 'order', label: 'Order Support', icon: ShoppingBag },
  { value: 'vendor', label: 'Vendor Support', icon: Store },
  { value: 'technical', label: 'Technical Issue', icon: HelpCircle },
]

const contactInfo = [
  {
    icon: Mail,
    title: 'Email Us',
    content: 'support@channah-market.com',
    link: 'mailto:support@channah-market.com',
  },
  {
    icon: Phone,
    title: 'Call Us',
    content: '+1 (555) 123-4567',
    link: 'tel:+15551234567',
  },
  {
    icon: MapPin,
    title: 'Visit Us',
    content: '123 Market Street, Lagos, Nigeria',
    link: null,
  },
  {
    icon: Clock,
    title: 'Business Hours',
    content: 'Mon - Fri: 9AM - 6PM WAT',
    link: null,
  },
]

export default function ContactPage() {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
  })

  const selectedSubject = watch('subject')

  const onSubmit = async (data: ContactFormData) => {
    setIsSubmitting(true)
    try {
      await contactAPI.submit(data)
      toast({
        title: 'Message Sent!',
        description: "We'll get back to you as soon as possible.",
      })
      reset()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send message. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container py-8 md:py-12">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto mb-12">
        <h1 className="text-4xl font-bold font-display mb-4">Contact Us</h1>
        <p className="text-muted-foreground">
          Have a question or need assistance? We&apos;re here to help! Fill out the
          form below or reach out to us directly.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Contact Form */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Send us a Message</CardTitle>
            <CardDescription>
              Fill out the form and we&apos;ll get back to you within 24 hours.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    placeholder="John Doe"
                    {...register('name')}
                  />
                  {errors.name && (
                    <p className="text-sm text-destructive">{errors.name.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="john@example.com"
                    {...register('email')}
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive">{errors.email.message}</p>
                  )}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject *</Label>
                  <Select
                    value={selectedSubject}
                    onValueChange={(value) => setValue('subject', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map((subject) => (
                        <SelectItem key={subject.value} value={subject.value}>
                          <div className="flex items-center gap-2">
                            <subject.icon className="h-4 w-4" />
                            {subject.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.subject && (
                    <p className="text-sm text-destructive">{errors.subject.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="order_number">Order Number (if applicable)</Label>
                  <Input
                    id="order_number"
                    placeholder="ORD-2024-XXXXX"
                    {...register('order_number')}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Message *</Label>
                <Textarea
                  id="message"
                  placeholder="How can we help you?"
                  rows={6}
                  {...register('message')}
                />
                {errors.message && (
                  <p className="text-sm text-destructive">{errors.message.message}</p>
                )}
              </div>

              <Button type="submit" className="w-full md:w-auto" disabled={isSubmitting}>
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                Send Message
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Contact Info */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Get in Touch</CardTitle>
              <CardDescription>
                Prefer to reach out directly? Here&apos;s how you can contact us.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {contactInfo.map((info) => (
                <div key={info.title} className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <info.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{info.title}</p>
                    {info.link ? (
                      <a
                        href={info.link}
                        className="text-sm text-muted-foreground hover:text-primary"
                      >
                        {info.content}
                      </a>
                    ) : (
                      <p className="text-sm text-muted-foreground">{info.content}</p>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* FAQ Link */}
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-6">
              <HelpCircle className="h-8 w-8 text-primary mb-3" />
              <h3 className="font-semibold mb-2">Looking for Quick Answers?</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Check out our FAQ section for answers to common questions.
              </p>
              <Button variant="outline" asChild>
                <a href="/help">Visit Help Center</a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
