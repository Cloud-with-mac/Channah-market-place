'use client'

import { useState, useMemo } from 'react'
import { useVideoChatStore } from '@/store/video-chat-store'
import type { Contact, ScheduledCall } from '@/store/video-chat-store'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Video,
  VideoOff,
  Phone,
  PhoneOff,
  Plus,
  Clock,
  Users,
  History,
  Settings,
  Search,
  Star,
  X,
  Copy,
  Check,
  Calendar,
  MapPin,
  FileText,
  PlayCircle,
  SkipForward,
  Share2,
  Zap,
} from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { formatDistanceToNow, format } from 'date-fns'

export default function VideoChatPage() {
  const {
    contacts,
    scheduledCalls,
    callHistory,
    currentCall,
    getContacts,
    getUpcomingCalls,
    getCallHistory,
    scheduleCall,
    startCall,
    completeCall,
    initiateQuickCall,
    endQuickCall,
    removeContact,
    toggleFavorite,
    addContact,
    cancelCall,
    generateMeetingLink,
    copyMeetingLink,
    updateScheduledCall,
    addCallHistory,
  } = useVideoChatStore()

  const [activeTab, setActiveTab] = useState('upcoming')
  const [searchQuery, setSearchQuery] = useState('')
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false)
  const [isContactDialogOpen, setIsContactDialogOpen] = useState(false)
  const [isCallDialogOpen, setIsCallDialogOpen] = useState(false)
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [isCopied, setIsCopied] = useState(false)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [cancellingCallId, setCancellingCallId] = useState<string | null>(null)
  const [cancelReason, setCancelReason] = useState('')

  const [scheduleForm, setScheduleForm] = useState({
    title: '',
    participantId: '',
    scheduledTime: '',
    duration: '60',
    description: '',
    notes: '',
    timezone: 'EST',
  })

  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    company: '',
  })

  const upcomingCalls = getUpcomingCalls(10)
  const recentHistory = getCallHistory(20)
  const onlineContacts = getContacts('online')
  const favoriteContacts = getContacts('favorites')

  // Filter contacts based on search
  const filteredContacts = useMemo(() => {
    const lowerSearch = searchQuery.toLowerCase()
    return contacts.filter(
      (c) =>
        c.name.toLowerCase().includes(lowerSearch) ||
        c.email.toLowerCase().includes(lowerSearch) ||
        c.company?.toLowerCase().includes(lowerSearch)
    )
  }, [contacts, searchQuery])

  const handleScheduleCall = () => {
    if (
      !scheduleForm.title ||
      !scheduleForm.participantId ||
      !scheduleForm.scheduledTime ||
      !scheduleForm.duration
    ) {
      toast({
        title: 'Missing information',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      })
      return
    }

    try {
      const callId = scheduleCall(
        scheduleForm.title,
        scheduleForm.participantId,
        scheduleForm.scheduledTime,
        parseInt(scheduleForm.duration),
        'video',
        scheduleForm.description,
        scheduleForm.notes,
        scheduleForm.timezone
      )

      toast({
        title: 'Call scheduled',
        description: `Video call scheduled successfully`,
      })

      setScheduleForm({
        title: '',
        participantId: '',
        scheduledTime: '',
        duration: '60',
        description: '',
        notes: '',
        timezone: 'EST',
      })
      setIsScheduleDialogOpen(false)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to schedule call',
        variant: 'destructive',
      })
    }
  }

  const handleAddContact = () => {
    if (!contactForm.name || !contactForm.email) {
      toast({
        title: 'Missing information',
        description: 'Name and email are required',
        variant: 'destructive',
      })
      return
    }

    try {
      addContact({
        name: contactForm.name,
        email: contactForm.email,
        company: contactForm.company,
        status: 'offline',
        isFavorite: false,
      })

      toast({
        title: 'Contact added',
        description: `${contactForm.name} has been added to your contacts`,
      })

      setContactForm({ name: '', email: '', company: '' })
      setIsContactDialogOpen(false)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to add contact',
        variant: 'destructive',
      })
    }
  }

  const handleQuickCall = (contact: Contact) => {
    try {
      initiateQuickCall(contact.id)
      setSelectedContact(contact)
      setIsCallDialogOpen(true)

      toast({
        title: 'Call initiated',
        description: `Calling ${contact.name}...`,
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to initiate call',
        variant: 'destructive',
      })
    }
  }

  const handleCopyMeetingLink = (callId: string) => {
    copyMeetingLink(callId)
    setIsCopied(true)
    setTimeout(() => setIsCopied(false), 2000)

    toast({
      title: 'Meeting link copied',
      description: 'Link copied to clipboard',
    })
  }

  const handleStartCall = (callId: string) => {
    startCall(callId)
    const call = scheduledCalls.find((c) => c.id === callId)
    if (call) {
      setSelectedContact({
        id: call.participantId,
        name: call.participantName,
        email: call.participantEmail,
        status: 'online',
        isFavorite: false,
      })
      setIsCallDialogOpen(true)
    }
  }

  const handleEndCall = () => {
    if (currentCall) {
      endQuickCall()
      setIsCallDialogOpen(false)
      setSelectedContact(null)
      toast({
        title: 'Call ended',
        description: 'Call has been ended',
      })
    }
  }

  const handleCancelCall = () => {
    if (cancellingCallId) {
      cancelCall(cancellingCallId, cancelReason)
      toast({
        title: 'Call cancelled',
        description: 'The call has been cancelled',
      })
      setShowCancelConfirm(false)
      setCancellingCallId(null)
      setCancelReason('')
    }
  }

  return (
    <div className="container py-8 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold font-display mb-2">Video Chat & Calls</h1>
          <p className="text-muted-foreground">
            Schedule and manage professional video calls with your business contacts
          </p>
        </div>

        <div className="flex gap-2">
          <Dialog open={isContactDialogOpen} onOpenChange={setIsContactDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Users className="h-5 w-5 mr-2" />
                Add Contact
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Contact</DialogTitle>
                <DialogDescription>
                  Add a contact to your call list for easy scheduling
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={contactForm.name}
                    onChange={(e) =>
                      setContactForm({ ...contactForm, name: e.target.value })
                    }
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={contactForm.email}
                    onChange={(e) =>
                      setContactForm({ ...contactForm, email: e.target.value })
                    }
                    placeholder="john@company.com"
                  />
                </div>

                <div>
                  <Label htmlFor="company">Company</Label>
                  <Input
                    id="company"
                    value={contactForm.company}
                    onChange={(e) =>
                      setContactForm({ ...contactForm, company: e.target.value })
                    }
                    placeholder="Acme Corp"
                  />
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsContactDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleAddContact}>Add Contact</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={isScheduleDialogOpen} onOpenChange={setIsScheduleDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Calendar className="h-5 w-5 mr-2" />
                Schedule Call
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Schedule Video Call</DialogTitle>
                <DialogDescription>
                  Schedule a video call with a contact at a specific time
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="call-title">Call Title</Label>
                  <Input
                    id="call-title"
                    value={scheduleForm.title}
                    onChange={(e) =>
                      setScheduleForm({ ...scheduleForm, title: e.target.value })
                    }
                    placeholder="Q1 Product Review"
                  />
                </div>

                <div>
                  <Label htmlFor="participant">Participant</Label>
                  <Select
                    value={scheduleForm.participantId}
                    onValueChange={(value) =>
                      setScheduleForm({ ...scheduleForm, participantId: value })
                    }
                  >
                    <SelectTrigger id="participant">
                      <SelectValue placeholder="Select a contact" />
                    </SelectTrigger>
                    <SelectContent>
                      {contacts.map((contact) => (
                        <SelectItem key={contact.id} value={contact.id}>
                          <div>
                            <p>{contact.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {contact.email}
                            </p>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="scheduled-time">Date & Time</Label>
                  <Input
                    id="scheduled-time"
                    type="datetime-local"
                    value={scheduleForm.scheduledTime}
                    onChange={(e) =>
                      setScheduleForm({
                        ...scheduleForm,
                        scheduledTime: e.target.value,
                      })
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="duration">Duration (minutes)</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={scheduleForm.duration}
                    onChange={(e) =>
                      setScheduleForm({ ...scheduleForm, duration: e.target.value })
                    }
                    min="15"
                    max="480"
                    step="15"
                  />
                </div>

                <div>
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select
                    value={scheduleForm.timezone}
                    onValueChange={(value) =>
                      setScheduleForm({ ...scheduleForm, timezone: value })
                    }
                  >
                    <SelectTrigger id="timezone">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EST">EST</SelectItem>
                      <SelectItem value="CST">CST</SelectItem>
                      <SelectItem value="MST">MST</SelectItem>
                      <SelectItem value="PST">PST</SelectItem>
                      <SelectItem value="GMT">GMT</SelectItem>
                      <SelectItem value="CET">CET</SelectItem>
                      <SelectItem value="IST">IST</SelectItem>
                      <SelectItem value="SGT">SGT</SelectItem>
                      <SelectItem value="JST">JST</SelectItem>
                      <SelectItem value="AEST">AEST</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="description">Description (optional)</Label>
                  <Textarea
                    id="description"
                    value={scheduleForm.description}
                    onChange={(e) =>
                      setScheduleForm({
                        ...scheduleForm,
                        description: e.target.value,
                      })
                    }
                    placeholder="Add details about the call topic"
                    rows={2}
                  />
                </div>

                <div>
                  <Label htmlFor="notes">Notes (optional)</Label>
                  <Textarea
                    id="notes"
                    value={scheduleForm.notes}
                    onChange={(e) =>
                      setScheduleForm({ ...scheduleForm, notes: e.target.value })
                    }
                    placeholder="Add any notes or agenda items"
                    rows={2}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsScheduleDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleScheduleCall}>Schedule Call</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Active Call Modal */}
      {isCallDialogOpen && selectedContact && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl mx-4">
            <div className="aspect-video bg-gradient-to-br from-slate-900 to-slate-700 flex flex-col items-center justify-center rounded-t-lg relative overflow-hidden">
              {/* Video placeholder */}
              <div className="absolute inset-0 flex items-center justify-center">
                <Video className="h-24 w-24 text-muted-foreground opacity-30" />
              </div>

              {/* Participant info */}
              <div className="relative z-10 text-center text-white">
                <Avatar className="h-20 w-20 mx-auto mb-4 border-4 border-white">
                  <AvatarFallback className="bg-primary text-lg">
                    {selectedContact.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <h2 className="text-2xl font-bold mb-2">{selectedContact.name}</h2>
                <p className="text-sm text-gray-300 mb-4">{selectedContact.company}</p>
                <p className="text-sm text-gray-400">
                  {currentCall?.status === 'ongoing' ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      Call in progress
                    </span>
                  ) : (
                    'Calling...'
                  )}
                </p>
              </div>
            </div>

            {/* Call controls */}
            <div className="p-6 border-t">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-semibold mb-1">{currentCall?.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {currentCall?.description}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setIsCallDialogOpen(false)
                  }}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <div className="flex gap-3 justify-center">
                <Button size="lg" variant="outline" className="rounded-full">
                  <Video className="h-5 w-5 mr-2" />
                  Camera
                </Button>
                <Button size="lg" variant="outline" className="rounded-full">
                  <Phone className="h-5 w-5 mr-2" />
                  Mute
                </Button>
                <Button size="lg" variant="outline" className="rounded-full">
                  <Share2 className="h-5 w-5 mr-2" />
                  Share Screen
                </Button>
                <Button
                  size="lg"
                  variant="destructive"
                  className="rounded-full"
                  onClick={handleEndCall}
                >
                  <PhoneOff className="h-5 w-5 mr-2" />
                  End Call
                </Button>
              </div>

              {currentCall?.meetingLink && (
                <div className="mt-6 p-4 bg-muted rounded-lg flex items-center justify-between">
                  <div className="flex-1 mr-3">
                    <p className="text-xs text-muted-foreground mb-1">Meeting Link</p>
                    <p className="text-sm font-mono truncate">
                      {currentCall.meetingLink}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleCopyMeetingLink(currentCall.id)}
                  >
                    {isCopied ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="upcoming">
            <Clock className="h-4 w-4 mr-2" />
            Upcoming
          </TabsTrigger>
          <TabsTrigger value="history">
            <History className="h-4 w-4 mr-2" />
            History
          </TabsTrigger>
          <TabsTrigger value="contacts">
            <Users className="h-4 w-4 mr-2" />
            Contacts
          </TabsTrigger>
          <TabsTrigger value="quick-call">
            <Zap className="h-4 w-4 mr-2" />
            Quick Call
          </TabsTrigger>
        </TabsList>

        {/* Upcoming Calls Tab */}
        <TabsContent value="upcoming" className="space-y-4">
          {upcomingCalls.length === 0 ? (
            <Card className="p-12 text-center">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold mb-2">No upcoming calls</h3>
              <p className="text-muted-foreground mb-6">
                Schedule a video call with your contacts to get started
              </p>
              <Button onClick={() => setIsScheduleDialogOpen(true)}>
                <Calendar className="h-4 w-4 mr-2" />
                Schedule Your First Call
              </Button>
            </Card>
          ) : (
            <div className="space-y-3">
              {upcomingCalls.map((call) => (
                <Card key={call.id} className="p-5 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-primary text-primary-foreground">
                            {call.participantName.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <h4 className="font-semibold">{call.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            {call.participantName}
                          </p>
                        </div>
                      </div>

                      {call.description && (
                        <p className="text-sm text-muted-foreground mb-3">
                          {call.description}
                        </p>
                      )}

                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {format(new Date(call.scheduledTime), 'MMM dd, yyyy HH:mm')}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {call.duration} min
                        </div>
                        {call.timezone && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {call.timezone}
                          </div>
                        )}
                      </div>

                      {call.notes && (
                        <div className="mt-3 p-2 bg-muted rounded text-xs">
                          <p className="flex items-center gap-1 text-muted-foreground mb-1">
                            <FileText className="h-3 w-3" />
                            Notes:
                          </p>
                          <p>{call.notes}</p>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2">
                      <Button
                        onClick={() => handleStartCall(call.id)}
                        className="whitespace-nowrap"
                      >
                        <PlayCircle className="h-4 w-4 mr-2" />
                        Start Call
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCopyMeetingLink(call.id)}
                      >
                        {isCopied ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4 mr-2" />
                        )}
                        {isCopied ? 'Copied' : 'Copy Link'}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setCancellingCallId(call.id)
                          setShowCancelConfirm(true)
                        }}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Call History Tab */}
        <TabsContent value="history" className="space-y-4">
          {recentHistory.length === 0 ? (
            <Card className="p-12 text-center">
              <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold mb-2">No call history</h3>
              <p className="text-muted-foreground">
                Your completed video calls will appear here
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              {recentHistory.map((history) => {
                const durationMinutes = Math.floor(history.duration / 60)
                const durationSeconds = history.duration % 60

                return (
                  <Card key={history.id} className="p-5 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-primary text-primary-foreground">
                              {history.participantName.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <h4 className="font-semibold">
                              {history.participantName}
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              {history.participantEmail}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-3">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {format(new Date(history.startTime), 'MMM dd, yyyy HH:mm')}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {durationMinutes}m {durationSeconds}s
                          </div>
                          <Badge
                            variant={
                              history.status === 'completed'
                                ? 'default'
                                : 'destructive'
                            }
                          >
                            {history.status.charAt(0).toUpperCase() +
                              history.status.slice(1)}
                          </Badge>
                        </div>

                        {history.notes && (
                          <div className="p-2 bg-muted rounded text-xs">
                            <p className="text-muted-foreground">{history.notes}</p>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col gap-2">
                        {history.recordingLink && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              window.open(history.recordingLink, '_blank')
                            }}
                          >
                            <Video className="h-4 w-4 mr-2" />
                            View Recording
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            // Schedule follow-up call
                            const contact = contacts.find(
                              (c) => c.id === history.participantId
                            )
                            if (contact) {
                              setScheduleForm({
                                ...scheduleForm,
                                participantId: contact.id,
                                title: `Follow-up: ${contact.name}`,
                              })
                              setIsScheduleDialogOpen(true)
                            }
                          }}
                        >
                          <Calendar className="h-4 w-4 mr-2" />
                          Schedule Follow-up
                        </Button>
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>

        {/* Contacts Tab */}
        <TabsContent value="contacts" className="space-y-4">
          <div className="flex gap-2 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search contacts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {filteredContacts.length === 0 ? (
            <Card className="p-12 text-center">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold mb-2">No contacts found</h3>
              <p className="text-muted-foreground mb-6">
                {searchQuery
                  ? 'Try a different search'
                  : 'Add contacts to get started with scheduling calls'}
              </p>
              {!searchQuery && (
                <Button onClick={() => setIsContactDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Contact
                </Button>
              )}
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredContacts.map((contact) => (
                <Card key={contact.id} className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {contact.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold">{contact.name}</h4>
                          <Badge
                            variant={
                              contact.status === 'online' ? 'default' : 'secondary'
                            }
                            className="text-xs"
                          >
                            {contact.status.charAt(0).toUpperCase() +
                              contact.status.slice(1)}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {contact.email}
                        </p>
                        {contact.company && (
                          <p className="text-sm text-muted-foreground">
                            {contact.company}
                          </p>
                        )}
                        {contact.lastSeen && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Last seen {formatDistanceToNow(new Date(contact.lastSeen))} ago
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2 flex-col">
                      <Button
                        size="sm"
                        onClick={() => handleQuickCall(contact)}
                      >
                        <Phone className="h-4 w-4 mr-2" />
                        Quick Call
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setScheduleForm({
                            ...scheduleForm,
                            participantId: contact.id,
                          })
                          setIsScheduleDialogOpen(true)
                        }}
                      >
                        <Calendar className="h-4 w-4 mr-2" />
                        Schedule
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => toggleFavorite(contact.id)}
                      >
                        <Star
                          className={`h-4 w-4 ${
                            contact.isFavorite ? 'fill-yellow-400 text-yellow-400' : ''
                          }`}
                        />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeContact(contact.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Quick Call Tab */}
        <TabsContent value="quick-call" className="space-y-4">
          {onlineContacts.length === 0 ? (
            <Card className="p-12 text-center">
              <Zap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold mb-2">No online contacts</h3>
              <p className="text-muted-foreground">
                None of your contacts are currently online. Try calling a scheduled contact
                or add more contacts.
              </p>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {onlineContacts.map((contact) => (
                <Card
                  key={contact.id}
                  className="p-4 text-center hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => handleQuickCall(contact)}
                >
                  <Avatar className="h-16 w-16 mx-auto mb-3">
                    <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                      {contact.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <h4 className="font-semibold mb-1">{contact.name}</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    {contact.company}
                  </p>
                  <Badge className="mb-4 inline-block">
                    <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-1" />
                    Online
                  </Badge>
                  <div>
                    <Button className="w-full">
                      <Phone className="h-4 w-4 mr-2" />
                      Quick Call
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Favorite Contacts Section */}
          {favoriteContacts.length > 0 && (
            <div className="mt-8">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                Favorite Contacts
              </h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {favoriteContacts.map((contact) => (
                  <Card
                    key={contact.id}
                    className="p-4 border-2 border-yellow-200 hover:shadow-md transition-shadow"
                  >
                    <Avatar className="h-12 w-12 mx-auto mb-2">
                      <AvatarFallback className="bg-yellow-100 text-yellow-900">
                        {contact.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <h4 className="font-semibold text-center mb-1">
                      {contact.name}
                    </h4>
                    <p className="text-sm text-muted-foreground text-center mb-3">
                      {contact.company}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={() => handleQuickCall(contact)}
                      >
                        <Phone className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                          setScheduleForm({
                            ...scheduleForm,
                            participantId: contact.id,
                          })
                          setIsScheduleDialogOpen(true)
                        }}
                      >
                        <Calendar className="h-4 w-4" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Cancel Call Confirmation */}
      <AlertDialog open={showCancelConfirm} onOpenChange={setShowCancelConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Video Call?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this scheduled call? The participant will be
              notified.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label htmlFor="cancel-reason">Reason (optional)</Label>
            <Textarea
              id="cancel-reason"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Let the participant know why you're cancelling..."
              rows={3}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Call</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelCall}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Cancel Call
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
