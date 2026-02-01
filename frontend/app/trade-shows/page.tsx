'use client'

import React, { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  Calendar,
  MapPin,
  Users,
  Search,
  Filter,
  Grid3X3,
  List,
  ChevronRight,
  Star,
  Eye,
  MessageSquare,
  Share2,
  Bookmark,
  Clock,
  Building2,
  Globe,
  Zap,
  CheckCircle,
  AlertCircle,
  Award,
  TrendingUp,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useTradeShowsStore } from '@/store/trade-shows-store'
import { cn } from '@/lib/utils'

// ============================================================================
// Event Card Component
// ============================================================================

interface EventCardProps {
  event: any
  onSelect: (eventId: string) => void
  viewMode: 'grid' | 'list'
}

function EventCard({ event, onSelect, viewMode }: EventCardProps) {
  const isUpcoming = event.status === 'upcoming'
  const isLive = event.status === 'live'
  const daysUntilStart = Math.ceil(
    (new Date(event.startDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  )

  if (viewMode === 'list') {
    return (
      <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => onSelect(event.id)}>
        <CardContent className="p-6">
          <div className="flex gap-6">
            <div className="flex-shrink-0 w-32 h-24 rounded-lg overflow-hidden bg-muted">
              <img
                src={event.image}
                alt={event.title}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4 mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-semibold truncate">{event.title}</h3>
                    {isLive && (
                      <Badge className="bg-red-500 animate-pulse flex items-center gap-1">
                        <Zap className="w-3 h-3" />
                        LIVE
                      </Badge>
                    )}
                    {isUpcoming && daysUntilStart <= 7 && (
                      <Badge variant="secondary">Starts in {daysUntilStart} days</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground truncate">{event.description}</p>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4 mb-4 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(event.startDate).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  <span>{event.city}, {event.country}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Building2 className="w-4 h-4" />
                  <span>{event.exhibitorCount} Exhibitors</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="w-4 h-4" />
                  <span>{event.currentAttendees} / {event.expectedAttendees}</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex gap-2 flex-wrap">
                  {event.category.map((cat: string) => (
                    <Badge key={cat} variant="outline" className="text-xs">
                      {cat}
                    </Badge>
                  ))}
                </div>
                <Button variant="ghost" size="sm" onClick={() => onSelect(event.id)}>
                  View Details
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card
      className="overflow-hidden hover:shadow-lg transition-all cursor-pointer group"
      onClick={() => onSelect(event.id)}
    >
      <div className="relative h-40 bg-muted overflow-hidden">
        <img
          src={event.image}
          alt={event.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
        />
        <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-colors" />
        <div className="absolute top-2 right-2 flex gap-2">
          {isLive && (
            <Badge className="bg-red-500 animate-pulse flex items-center gap-1">
              <Zap className="w-3 h-3" />
              LIVE
            </Badge>
          )}
          {event.type === 'virtual' && (
            <Badge variant="secondary" className="bg-blue-500/80 text-white">
              <Globe className="w-3 h-3 mr-1" />
              Virtual
            </Badge>
          )}
        </div>
        {isUpcoming && daysUntilStart <= 7 && (
          <div className="absolute top-2 left-2">
            <Badge variant="outline" className="bg-orange-500/90 text-white border-0">
              In {daysUntilStart} days
            </Badge>
          </div>
        )}
      </div>

      <CardContent className="p-4">
        <h3 className="font-semibold text-base mb-1 line-clamp-2">{event.title}</h3>
        <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{event.description}</p>

        <div className="space-y-2 mb-4 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span>{new Date(event.startDate).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="w-4 h-4" />
            <span className="truncate">
              {event.city}, {event.country}
            </span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Building2 className="w-4 h-4" />
            <span>{event.exhibitorCount} Exhibitors</span>
          </div>
        </div>

        <div className="mb-3 flex gap-1 flex-wrap">
          {event.category.slice(0, 2).map((cat: string) => (
            <Badge key={cat} variant="secondary" className="text-xs">
              {cat}
            </Badge>
          ))}
          {event.category.length > 2 && (
            <Badge variant="secondary" className="text-xs">
              +{event.category.length - 2}
            </Badge>
          )}
        </div>

        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              {event.currentAttendees}/{event.expectedAttendees}
            </span>
          </div>
          <Button variant="ghost" size="sm" className="h-8">
            Learn More
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// ============================================================================
// Booth Card Component
// ============================================================================

interface BoothCardProps {
  booth: any
  eventId: string
}

function BoothCard({ booth, eventId }: BoothCardProps) {
  const { visitBooth } = useTradeShowsStore()
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false)
  const [userRating, setUserRating] = useState(5)
  const [userComment, setUserComment] = useState('')

  const handleVisitBooth = () => {
    visitBooth('current-user-id', eventId, booth.id)
  }

  const handleSubmitReview = () => {
    // In a real app, we'd get the actual user ID
    setReviewDialogOpen(false)
    setUserRating(5)
    setUserComment('')
  }

  return (
    <>
      <Card className="overflow-hidden hover:shadow-lg transition-shadow group">
        <div className="relative h-32 bg-muted overflow-hidden">
          {booth.images?.[0] ? (
            <img
              src={booth.images[0]}
              alt={booth.vendorName}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Building2 className="w-12 h-12 text-white/50" />
            </div>
          )}
          <div className="absolute top-2 right-2">
            <Badge variant="secondary" className="bg-white/90">
              Booth {booth.boothNumber}
            </Badge>
          </div>
          {booth.isLive && (
            <div className="absolute bottom-2 left-2">
              <Badge className="bg-green-500 flex items-center gap-1">
                <Zap className="w-3 h-3" />
                Live
              </Badge>
            </div>
          )}
        </div>

        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <h4 className="font-semibold text-sm mb-1">{booth.vendorName}</h4>
              {booth.vendorLogo && (
                <img src={booth.vendorLogo} alt={booth.vendorName} className="w-6 h-6 rounded" />
              )}
            </div>
            <Badge
              variant={booth.boothSize === 'premium' ? 'default' : 'outline'}
              className="text-xs"
            >
              {booth.boothSize}
            </Badge>
          </div>

          <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
            {booth.description}
          </p>

          <div className="flex items-center justify-between mb-4 text-xs">
            <div className="flex items-center gap-1">
              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
              <span className="font-medium">{booth.rating.toFixed(1)}</span>
              <span className="text-muted-foreground">({booth.reviews.length})</span>
            </div>
            <div className="flex items-center gap-1">
              <Eye className="w-3 h-3 text-muted-foreground" />
              <span className="text-muted-foreground">{booth.visitorCount} visits</span>
            </div>
          </div>

          <div className="flex gap-2 flex-col">
            <Button size="sm" className="w-full" onClick={handleVisitBooth}>
              Visit Booth
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="w-full"
              onClick={() => setReviewDialogOpen(true)}
            >
              <MessageSquare className="w-3 h-3 mr-1" />
              Review
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Review {booth.vendorName}</DialogTitle>
            <DialogDescription>
              Share your experience with this booth
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Rating</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    onClick={() => setUserRating(rating)}
                    className="focus:outline-none"
                  >
                    <Star
                      className={cn(
                        'w-6 h-6 transition-colors',
                        userRating >= rating
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-muted-foreground'
                      )}
                    />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Comment</label>
              <textarea
                value={userComment}
                onChange={(e) => setUserComment(e.target.value)}
                placeholder="Share your thoughts..."
                className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                rows={3}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setReviewDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmitReview}>Submit Review</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

// ============================================================================
// Session Card Component
// ============================================================================

interface SessionCardProps {
  session: any
  eventId: string
}

function SessionCard({ session, eventId }: SessionCardProps) {
  const { attendSession } = useTradeShowsStore()
  const isLive = session.isLive

  const handleAttendSession = () => {
    attendSession('current-user-id', eventId, session.id)
  }

  const sessionTypeColors: Record<string, string> = {
    keynote: 'bg-blue-100 text-blue-900',
    workshop: 'bg-green-100 text-green-900',
    panel: 'bg-purple-100 text-purple-900',
    demo: 'bg-orange-100 text-orange-900',
    networking: 'bg-pink-100 text-pink-900',
  }

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h4 className="font-semibold text-sm mb-1">{session.title}</h4>
            <Badge className={cn(sessionTypeColors[session.type] || 'bg-gray-100')}>
              {session.type.charAt(0).toUpperCase() + session.type.slice(1)}
            </Badge>
          </div>
          {isLive && (
            <Badge className="bg-red-500 animate-pulse">
              <Zap className="w-3 h-3 mr-1" />
              LIVE
            </Badge>
          )}
        </div>

        <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
          {session.description}
        </p>

        <div className="space-y-2 mb-4 text-xs">
          {session.startTime && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="w-3 h-3" />
              <span>{new Date(session.startTime).toLocaleTimeString()}</span>
            </div>
          )}
          {session.room && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="w-3 h-3" />
              <span>{session.room}</span>
            </div>
          )}
          {session.maxAttendees && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="w-3 h-3" />
              <span>
                {session.currentAttendees}/{session.maxAttendees} attendees
              </span>
            </div>
          )}
        </div>

        <Button size="sm" className="w-full" onClick={handleAttendSession}>
          {session.currentAttendees > 0 ? 'Attending' : 'Join Session'}
        </Button>
      </CardContent>
    </Card>
  )
}

// ============================================================================
// Event Details Modal Component
// ============================================================================

interface EventDetailsModalProps {
  eventId: string | null
  onClose: () => void
}

function EventDetailsModal({ eventId, onClose }: EventDetailsModalProps) {
  const { events, getEvent, registerForEvent, isUserRegisteredForEvent, getEventBooths, getEventSessions } =
    useTradeShowsStore()
  const event = eventId ? getEvent(eventId) : null

  if (!event) return null

  const booths = getEventBooths(event.id)
  const sessions = getEventSessions(event.id)
  const isRegistered = isUserRegisteredForEvent('current-user-id', event.id)

  const handleRegister = () => {
    registerForEvent('current-user-id', 'Current User', 'user@example.com', event.id, {
      company: 'Example Company',
      designation: 'Business Development',
    })
  }

  return (
    <Dialog open={!!eventId} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="pr-4">
          <DialogHeader>
            <div className="relative mb-4 -mx-6 -mt-6">
              <img
                src={event.banner || event.image}
                alt={event.title}
                className="w-full h-48 object-cover rounded-t-lg"
              />
              <div className="absolute inset-0 bg-black/40 rounded-t-lg" />
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <h2 className="text-2xl font-bold text-white mb-2">{event.title}</h2>
                <div className="flex gap-2">
                  {event.status === 'live' && (
                    <Badge className="bg-red-500 animate-pulse flex items-center gap-1">
                      <Zap className="w-3 h-3" />
                      LIVE NOW
                    </Badge>
                  )}
                  {event.category.map((cat: string) => (
                    <Badge key={cat} variant="secondary" className="bg-white/90">
                      {cat}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            <DialogTitle className="hidden" />
            <DialogDescription className="hidden" />
          </DialogHeader>

          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="booths">Booths ({booths.length})</TabsTrigger>
              <TabsTrigger value="schedule">Schedule ({sessions.length})</TabsTrigger>
              <TabsTrigger value="details">Details</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-4 mt-4">
              <p className="text-sm text-muted-foreground">{event.description}</p>

              {!isRegistered && (
                <Button className="w-full" onClick={handleRegister}>
                  Register for Event
                </Button>
              )}
              {isRegistered && (
                <Button variant="outline" className="w-full" disabled>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  You're Registered
                </Button>
              )}

              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Start Date
                  </div>
                  <p className="font-semibold text-sm">
                    {new Date(event.startDate).toLocaleDateString()}
                  </p>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    End Date
                  </div>
                  <p className="font-semibold text-sm">
                    {new Date(event.endDate).toLocaleDateString()}
                  </p>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    Location
                  </div>
                  <p className="font-semibold text-sm">
                    {event.city}, {event.country}
                  </p>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <Building2 className="w-3 h-3" />
                    Type
                  </div>
                  <p className="font-semibold text-sm capitalize">{event.type}</p>
                </div>
              </div>

              <div className="bg-muted p-4 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Attendees</span>
                  </div>
                  <span className="font-semibold">
                    {event.currentAttendees}/{event.expectedAttendees}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Exhibitors</span>
                  </div>
                  <span className="font-semibold">{event.exhibitorCount}</span>
                </div>
              </div>
            </TabsContent>

            {/* Booths Tab */}
            <TabsContent value="booths" className="space-y-4 mt-4">
              {booths.length > 0 ? (
                <div className="grid grid-cols-2 gap-4">
                  {booths.map((booth) => (
                    <BoothCard key={booth.id} booth={booth} eventId={event.id} />
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <Building2 className="w-12 h-12 text-muted-foreground/50 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No booths registered yet</p>
                </div>
              )}
            </TabsContent>

            {/* Schedule Tab */}
            <TabsContent value="schedule" className="space-y-4 mt-4">
              {sessions.length > 0 ? (
                <div className="space-y-3">
                  {sessions.map((session) => (
                    <SessionCard key={session.id} session={session} eventId={event.id} />
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <Calendar className="w-12 h-12 text-muted-foreground/50 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Schedule coming soon</p>
                </div>
              )}
            </TabsContent>

            {/* Details Tab */}
            <TabsContent value="details" className="space-y-4 mt-4">
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-sm mb-2">Event Features</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(event.features).map(([feature, enabled]) => (
                      <div key={feature} className="flex items-center gap-2 text-sm">
                        {enabled ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-muted-foreground" />
                        )}
                        <span className="capitalize">{feature.replace(/([A-Z])/g, ' $1')}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-semibold text-sm mb-2">Organizer</h4>
                  <div className="space-y-1 text-sm">
                    <p className="font-medium">{event.organizer.name}</p>
                    <p className="text-muted-foreground">{event.organizer.email}</p>
                    {event.organizer.phone && (
                      <p className="text-muted-foreground">{event.organizer.phone}</p>
                    )}
                    {event.organizer.website && (
                      <p className="text-blue-500">
                        <a href={event.organizer.website} target="_blank" rel="noopener noreferrer">
                          {event.organizer.website}
                        </a>
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ============================================================================
// Main Trade Shows Page
// ============================================================================

export default function TradeShowsPage() {
  const {
    events,
    filterCategory,
    filterStatus,
    searchQuery,
    setFilterCategory,
    setFilterStatus,
    setSearchQuery,
    getFilteredEvents,
    getLiveEvents,
    getUpcomingEvents,
  } = useTradeShowsStore()

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null)

  const filteredEvents = getFilteredEvents()
  const liveEvents = getLiveEvents()
  const upcomingEvents = getUpcomingEvents()

  // Get all unique categories
  const allCategories = Array.from(
    new Set(events.flatMap((event) => event.category))
  ).sort()

  // Calculate statistics
  const stats = useMemo(
    () => ({
      totalEvents: events.length,
      liveEvents: liveEvents.length,
      upcomingEvents: upcomingEvents.length,
      totalExhibitors: events.reduce((sum, event) => sum + event.exhibitorCount, 0),
      totalAttendees: events.reduce((sum, event) => sum + event.currentAttendees, 0),
    }),
    [events, liveEvents, upcomingEvents]
  )

  return (
    <div className="min-h-screen bg-background">
      {/* Header Section */}
      <div className="border-b bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10">
        <div className="container mx-auto px-4 py-12">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2 flex items-center gap-2">
              <Award className="w-8 h-8" />
              Virtual Trade Shows & Events
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl">
              Discover premium B2B trade shows, connect with exhibitors, and expand your business
              network
            </p>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{stats.totalEvents}</div>
                  <div className="text-xs text-muted-foreground">Total Events</div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-red-50 border-red-200">
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-2xl font-bold text-red-600 mb-1">
                    <Zap className="w-5 h-5" />
                    {stats.liveEvents}
                  </div>
                  <div className="text-xs text-red-600/70">Live Now</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{stats.upcomingEvents}</div>
                  <div className="text-xs text-muted-foreground">Coming Soon</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{stats.totalExhibitors}</div>
                  <div className="text-xs text-muted-foreground">Exhibitors</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{stats.totalAttendees}</div>
                  <div className="text-xs text-muted-foreground">Attendees</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Search and Filter Section */}
        <Card className="mb-6 border-0 shadow-sm bg-muted/30">
          <CardContent className="p-6">
            <div className="space-y-4">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search events by name, city, or category..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Filters Row */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Select
                  value={filterStatus}
                  onValueChange={(value: any) => setFilterStatus(value)}
                >
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Event Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Events</SelectItem>
                    <SelectItem value="live">Live Now</SelectItem>
                    <SelectItem value="upcoming">Upcoming</SelectItem>
                    <SelectItem value="ended">Past Events</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={filterCategory || 'all'}
                  onValueChange={(value) =>
                    setFilterCategory(value === 'all' ? null : value)
                  }
                >
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {allCategories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="flex gap-2 ml-auto">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'outline'}
                    size="icon"
                    onClick={() => setViewMode('grid')}
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'outline'}
                    size="icon"
                    onClick={() => setViewMode('list')}
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Events Display */}
        {filteredEvents.length > 0 ? (
          <>
            <div className="mb-4">
              <p className="text-sm text-muted-foreground">
                Showing <span className="font-semibold text-foreground">{filteredEvents.length}</span> event
                {filteredEvents.length !== 1 ? 's' : ''}
              </p>
            </div>

            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {filteredEvents.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    onSelect={setSelectedEventId}
                    viewMode="grid"
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-4 mb-8">
                {filteredEvents.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    onSelect={setSelectedEventId}
                    viewMode="list"
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <TrendingUp className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-1">No events found</h3>
              <p className="text-muted-foreground mb-6">
                Try adjusting your filters or search terms
              </p>
              <Button variant="outline" onClick={() => setSearchQuery('')}>
                Clear Filters
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Event Details Modal */}
      <EventDetailsModal
        eventId={selectedEventId}
        onClose={() => setSelectedEventId(null)}
      />
    </div>
  )
}
