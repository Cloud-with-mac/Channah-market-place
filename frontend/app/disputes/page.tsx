'use client'

import * as React from 'react'
import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileText,
  Filter,
  Image as ImageIcon,
  MessageSquare,
  Package,
  Plus,
  Search,
  Send,
  TrendingUp,
  Upload,
  X,
  ChevronDown,
  ChevronRight,
  Scale,
  Ban,
  CreditCard,
  AlertOctagon,
  Eye,
  Download,
  Paperclip,
  ExternalLink,
} from 'lucide-react'
import { format } from 'date-fns'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import {
  useDisputeStore,
  type Dispute,
  type DisputeType,
  type DisputeStatus,
  type DisputePriority,
  type EvidenceType,
  type ResolutionType,
  type DisputeEvidence,
} from '@/store/dispute-store'
import { useAuthStore } from '@/store'

// Dispute type metadata
const disputeTypeMeta = {
  quality: {
    label: 'Product Quality',
    icon: Package,
    color: 'text-orange-600 bg-orange-50 border-orange-200',
  },
  shipping: {
    label: 'Shipping Issue',
    icon: AlertTriangle,
    color: 'text-blue-600 bg-blue-50 border-blue-200',
  },
  payment: {
    label: 'Payment Dispute',
    icon: CreditCard,
    color: 'text-purple-600 bg-purple-50 border-purple-200',
  },
  description_mismatch: {
    label: 'Description Mismatch',
    icon: FileText,
    color: 'text-red-600 bg-red-50 border-red-200',
  },
}

// Status metadata
const statusMeta = {
  open: {
    label: 'Open',
    icon: AlertCircle,
    color: 'bg-blue-100 text-blue-800 border-blue-200',
  },
  under_review: {
    label: 'Under Review',
    icon: Clock,
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  },
  escalated: {
    label: 'Escalated',
    icon: AlertOctagon,
    color: 'bg-red-100 text-red-800 border-red-200',
  },
  resolved: {
    label: 'Resolved',
    icon: CheckCircle2,
    color: 'bg-green-100 text-green-800 border-green-200',
  },
  closed: {
    label: 'Closed',
    icon: Ban,
    color: 'bg-gray-100 text-gray-800 border-gray-200',
  },
}

// Priority metadata
const priorityMeta = {
  low: { label: 'Low', color: 'bg-gray-100 text-gray-700' },
  medium: { label: 'Medium', color: 'bg-blue-100 text-blue-700' },
  high: { label: 'High', color: 'bg-orange-100 text-orange-700' },
  critical: { label: 'Critical', color: 'bg-red-100 text-red-700' },
}

export default function DisputesPage() {
  const { user } = useAuthStore()
  const {
    disputes,
    currentDispute,
    filters,
    stats,
    isLoading,
    isMediationChatOpen,
    createDispute,
    setCurrentDispute,
    addEvidence,
    sendMessage,
    createProposal,
    updateStatus,
    resolveDispute,
    setFilters,
    getFilteredDisputes,
    toggleMediationChat,
  } = useDisputeStore()

  const [isNewDisputeOpen, setIsNewDisputeOpen] = useState(false)
  const [selectedTab, setSelectedTab] = useState('all')
  const [messageInput, setMessageInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  const filteredDisputes = getFilteredDisputes()

  // Filter disputes by tab
  const tabDisputes = React.useMemo(() => {
    if (selectedTab === 'all') return filteredDisputes
    return filteredDisputes.filter(d => d.status === selectedTab)
  }, [selectedTab, filteredDisputes])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="container max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Dispute Resolution Center
              </h1>
              <p className="text-gray-600">
                Manage and resolve order disputes with our professional mediation system
              </p>
            </div>

            <Dialog open={isNewDisputeOpen} onOpenChange={setIsNewDisputeOpen}>
              <DialogTrigger asChild>
                <Button size="lg" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                  <Plus className="h-5 w-5 mr-2" />
                  File New Dispute
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <NewDisputeForm onClose={() => setIsNewDisputeOpen(false)} />
              </DialogContent>
            </Dialog>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatsCard
              title="Total Disputes"
              value={stats.total}
              icon={FileText}
              color="blue"
            />
            <StatsCard
              title="Open Cases"
              value={stats.open + stats.underReview}
              icon={Clock}
              color="yellow"
            />
            <StatsCard
              title="Avg Resolution Time"
              value={`${Math.round(stats.avgResolutionTime)}h`}
              icon={TrendingUp}
              color="green"
            />
            <StatsCard
              title="Success Rate"
              value={`${Math.round(stats.customerWinRate + stats.vendorWinRate)}%`}
              icon={CheckCircle2}
              color="purple"
            />
          </div>

          {/* Search and Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by dispute number, customer, or vendor..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value)
                      setFilters({ search: e.target.value })
                    }}
                  />
                </div>

                <Select
                  value={filters.sortBy || 'createdAt'}
                  onValueChange={(value: any) => setFilters({ sortBy: value })}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="createdAt">Sort by Date</SelectItem>
                    <SelectItem value="priority">Sort by Priority</SelectItem>
                    <SelectItem value="updatedAt">Sort by Updated</SelectItem>
                  </SelectContent>
                </Select>

                <Button variant="outline">
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Disputes List */}
          <div className="lg:col-span-1">
            <Card className="h-[calc(100vh-24rem)]">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Cases</CardTitle>
              </CardHeader>
              <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
                <TabsList className="w-full grid grid-cols-3 mx-4 mb-2" style={{ width: 'calc(100% - 2rem)' }}>
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="open">Open</TabsTrigger>
                  <TabsTrigger value="resolved">Resolved</TabsTrigger>
                </TabsList>

                <ScrollArea className="h-[calc(100vh-32rem)]">
                  <div className="px-4 pb-4 space-y-2">
                    {tabDisputes.length === 0 ? (
                      <div className="text-center py-12 text-gray-500">
                        <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p>No disputes found</p>
                      </div>
                    ) : (
                      tabDisputes.map((dispute) => (
                        <DisputeCard
                          key={dispute.id}
                          dispute={dispute}
                          isSelected={currentDispute?.id === dispute.id}
                          onClick={() => setCurrentDispute(dispute)}
                        />
                      ))
                    )}
                  </div>
                </ScrollArea>
              </Tabs>
            </Card>
          </div>

          {/* Dispute Details */}
          <div className="lg:col-span-2">
            {currentDispute ? (
              <DisputeDetails dispute={currentDispute} />
            ) : (
              <Card className="h-[calc(100vh-24rem)] flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <Scale className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">No Dispute Selected</p>
                  <p className="text-sm">Select a dispute from the list to view details</p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Stats Card Component
function StatsCard({
  title,
  value,
  icon: Icon,
  color,
}: {
  title: string
  value: string | number
  icon: any
  color: string
}) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
          </div>
          <div className={`p-3 rounded-lg ${colorClasses[color as keyof typeof colorClasses]}`}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Dispute Card Component
function DisputeCard({
  dispute,
  isSelected,
  onClick,
}: {
  dispute: Dispute
  isSelected: boolean
  onClick: () => void
}) {
  const TypeIcon = disputeTypeMeta[dispute.type].icon
  const StatusIcon = statusMeta[dispute.status].icon

  return (
    <Card
      className={`cursor-pointer transition-all hover:shadow-md ${
        isSelected ? 'ring-2 ring-blue-600 shadow-md' : ''
      }`}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded ${disputeTypeMeta[dispute.type].color}`}>
              <TypeIcon className="h-3.5 w-3.5" />
            </div>
            <span className="font-semibold text-sm">{dispute.disputeNumber}</span>
          </div>
          <Badge className={`${priorityMeta[dispute.priority].color} text-xs`}>
            {priorityMeta[dispute.priority].label}
          </Badge>
        </div>

        <h4 className="font-medium text-sm mb-2 line-clamp-1">{dispute.subject}</h4>

        <div className="flex items-center gap-4 text-xs text-gray-600 mb-3">
          <span>Order #{dispute.orderNumber}</span>
          <span>£{dispute.disputedAmount.toFixed(2)}</span>
        </div>

        <div className="flex items-center justify-between">
          <Badge className={`${statusMeta[dispute.status].color} text-xs`}>
            {statusMeta[dispute.status].label}
          </Badge>
          <span className="text-xs text-gray-500">
            {format(new Date(dispute.createdAt), 'MMM d')}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}

// Dispute Details Component
function DisputeDetails({ dispute }: { dispute: Dispute }) {
  const [activeTab, setActiveTab] = useState('overview')

  return (
    <Card className="h-[calc(100vh-24rem)]">
      <CardHeader className="pb-3 border-b">
        <div className="flex items-start justify-between mb-2">
          <div>
            <CardTitle className="text-xl mb-1">{dispute.subject}</CardTitle>
            <CardDescription>Dispute #{dispute.disputeNumber}</CardDescription>
          </div>
          <Badge className={`${statusMeta[dispute.status].color}`}>
            {statusMeta[dispute.status].label}
          </Badge>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-sm">
          <div>
            <p className="text-gray-600 mb-1">Customer</p>
            <p className="font-medium">{dispute.customerName}</p>
          </div>
          <div>
            <p className="text-gray-600 mb-1">Vendor</p>
            <p className="font-medium">{dispute.vendorName}</p>
          </div>
          <div>
            <p className="text-gray-600 mb-1">Order Amount</p>
            <p className="font-medium">£{dispute.orderAmount.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-gray-600 mb-1">Disputed</p>
            <p className="font-medium text-red-600">£{dispute.disputedAmount.toFixed(2)}</p>
          </div>
        </div>
      </CardHeader>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-[calc(100%-10rem)]">
        <TabsList className="mx-6 mt-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="evidence">Evidence</TabsTrigger>
          <TabsTrigger value="messages">Messages</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="resolution">Resolution</TabsTrigger>
        </TabsList>

        <ScrollArea className="flex-1 px-6">
          <TabsContent value="overview" className="mt-4">
            <OverviewTab dispute={dispute} />
          </TabsContent>

          <TabsContent value="evidence" className="mt-4">
            <EvidenceTab dispute={dispute} />
          </TabsContent>

          <TabsContent value="messages" className="mt-4">
            <MessagesTab dispute={dispute} />
          </TabsContent>

          <TabsContent value="timeline" className="mt-4">
            <TimelineTab dispute={dispute} />
          </TabsContent>

          <TabsContent value="resolution" className="mt-4">
            <ResolutionTab dispute={dispute} />
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </Card>
  )
}

// Overview Tab
function OverviewTab({ dispute }: { dispute: Dispute }) {
  const TypeIcon = disputeTypeMeta[dispute.type].icon

  return (
    <div className="space-y-6 pb-6">
      <div>
        <h3 className="font-semibold mb-2 flex items-center gap-2">
          <TypeIcon className="h-5 w-5" />
          Dispute Type: {disputeTypeMeta[dispute.type].label}
        </h3>
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Description</AlertTitle>
          <AlertDescription className="mt-2">
            {dispute.description}
          </AlertDescription>
        </Alert>
      </div>

      <div>
        <h3 className="font-semibold mb-3">Dispute Details</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Priority</p>
            <Badge className={priorityMeta[dispute.priority].color}>
              {priorityMeta[dispute.priority].label}
            </Badge>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Created</p>
            <p className="font-medium">{format(new Date(dispute.createdAt), 'PPp')}</p>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Last Updated</p>
            <p className="font-medium">{format(new Date(dispute.updatedAt), 'PPp')}</p>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Order Number</p>
            <p className="font-medium">{dispute.orderNumber}</p>
          </div>
        </div>
      </div>

      <div>
        <h3 className="font-semibold mb-3">Contact Information</h3>
        <div className="space-y-3">
          <div className="p-4 border rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <p className="font-medium">Customer</p>
              <Badge variant="outline">Claimant</Badge>
            </div>
            <p className="text-sm text-gray-600">{dispute.customerName}</p>
            <p className="text-sm text-gray-600">{dispute.customerEmail}</p>
          </div>
          <div className="p-4 border rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <p className="font-medium">Vendor</p>
              <Badge variant="outline">Respondent</Badge>
            </div>
            <p className="text-sm text-gray-600">{dispute.vendorName}</p>
            <p className="text-sm text-gray-600">{dispute.vendorEmail}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

// Evidence Tab
function EvidenceTab({ dispute }: { dispute: Dispute }) {
  const { addEvidence } = useDisputeStore()
  const [uploading, setUploading] = useState(false)
  const [evidenceDescription, setEvidenceDescription] = useState('')

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setUploading(true)
    try {
      for (const file of acceptedFiles) {
        // In production, upload to cloud storage
        const url = URL.createObjectURL(file)
        const type: EvidenceType = file.type.startsWith('image/') ? 'photo' :
                                      file.type.startsWith('video/') ? 'video' : 'document'

        await addEvidence(dispute.id, {
          type,
          url,
          filename: file.name,
          description: evidenceDescription,
          uploadedBy: 'customer',
        })
      }
      setEvidenceDescription('')
    } finally {
      setUploading(false)
    }
  }, [dispute.id, addEvidence, evidenceDescription])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop })

  const evidenceByType = {
    customer: dispute.evidence.filter(e => e.uploadedBy === 'customer'),
    vendor: dispute.evidence.filter(e => e.uploadedBy === 'vendor'),
    admin: dispute.evidence.filter(e => e.uploadedBy === 'admin'),
  }

  return (
    <div className="space-y-6 pb-6">
      {/* Upload Section */}
      <div>
        <h3 className="font-semibold mb-3">Upload Evidence</h3>
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          <input {...getInputProps()} />
          <Upload className="h-12 w-12 mx-auto mb-3 text-gray-400" />
          <p className="text-sm font-medium mb-1">
            {isDragActive ? 'Drop files here' : 'Drag & drop files here'}
          </p>
          <p className="text-xs text-gray-500 mb-3">or click to browse</p>
          <p className="text-xs text-gray-400">
            Supports: Images, Videos, PDF, Word documents
          </p>
        </div>

        <div className="mt-3">
          <Label htmlFor="evidence-desc">Evidence Description (Optional)</Label>
          <Textarea
            id="evidence-desc"
            placeholder="Describe what this evidence shows..."
            value={evidenceDescription}
            onChange={(e) => setEvidenceDescription(e.target.value)}
            className="mt-1"
          />
        </div>
      </div>

      {/* Evidence Gallery */}
      <div>
        <h3 className="font-semibold mb-3">Submitted Evidence ({dispute.evidence.length})</h3>

        {['customer', 'vendor', 'admin'].map((role) => {
          const items = evidenceByType[role as keyof typeof evidenceByType]
          if (items.length === 0) return null

          return (
            <div key={role} className="mb-6">
              <h4 className="text-sm font-medium text-gray-700 mb-3 capitalize">
                {role} Evidence ({items.length})
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {items.map((evidence) => (
                  <EvidenceCard key={evidence.id} evidence={evidence} />
                ))}
              </div>
            </div>
          )
        })}

        {dispute.evidence.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <ImageIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No evidence uploaded yet</p>
          </div>
        )}
      </div>
    </div>
  )
}

function EvidenceCard({ evidence }: { evidence: DisputeEvidence }) {
  const getIcon = () => {
    switch (evidence.type) {
      case 'photo': return ImageIcon
      case 'video': return FileText
      case 'document': return FileText
      default: return Paperclip
    }
  }

  const Icon = getIcon()

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <CardContent className="p-0">
        {evidence.type === 'photo' ? (
          <div className="aspect-square bg-gray-100 relative">
            <img
              src={evidence.url}
              alt={evidence.filename}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="aspect-square bg-gray-50 flex items-center justify-center">
            <Icon className="h-12 w-12 text-gray-400" />
          </div>
        )}
        <div className="p-3">
          <p className="text-xs font-medium truncate mb-1">{evidence.filename}</p>
          <p className="text-xs text-gray-500 capitalize">{evidence.uploadedBy}</p>
          {evidence.description && (
            <p className="text-xs text-gray-600 mt-2 line-clamp-2">{evidence.description}</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// Messages Tab
function MessagesTab({ dispute }: { dispute: Dispute }) {
  const { user } = useAuthStore()
  const { sendMessage } = useDisputeStore()
  const [messageInput, setMessageInput] = useState('')
  const messagesEndRef = React.useRef<HTMLDivElement>(null)

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !user) return

    await sendMessage(dispute.id, {
      disputeId: dispute.id,
      senderId: user.id,
      senderName: user.first_name + ' ' + user.last_name,
      senderRole: 'customer',
      content: messageInput,
    })

    setMessageInput('')
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="flex flex-col h-[500px]">
      <div className="flex-1 overflow-y-auto space-y-4 pb-4">
        {dispute.messages.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No messages yet</p>
            <p className="text-sm">Start the conversation to resolve this dispute</p>
          </div>
        ) : (
          dispute.messages.map((message) => (
            <MessageBubble key={message.id} message={message} isOwn={message.senderId === user?.id} />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t pt-4 mt-4">
        <div className="flex gap-2">
          <Input
            placeholder="Type your message..."
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          />
          <Button onClick={handleSendMessage} disabled={!messageInput.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

function MessageBubble({ message, isOwn }: { message: any; isOwn: boolean }) {
  const roleColors: Record<string, string> = {
    customer: 'bg-blue-600',
    vendor: 'bg-purple-600',
    admin: 'bg-red-600',
    mediator: 'bg-green-600',
  }

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[70%] ${isOwn ? 'order-2' : 'order-1'}`}>
        <div className="flex items-center gap-2 mb-1">
          <div className={`w-6 h-6 rounded-full ${roleColors[message.senderRole]} flex items-center justify-center text-white text-xs font-bold`}>
            {message.senderName[0]}
          </div>
          <span className="text-xs font-medium">{message.senderName}</span>
          <span className="text-xs text-gray-500">
            {format(new Date(message.createdAt), 'HH:mm')}
          </span>
        </div>
        <div className={`p-3 rounded-lg ${isOwn ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>
          <p className="text-sm">{message.content}</p>
        </div>
      </div>
    </div>
  )
}

// Timeline Tab
function TimelineTab({ dispute }: { dispute: Dispute }) {
  return (
    <div className="space-y-4 pb-6">
      {dispute.timeline.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>No timeline events</p>
        </div>
      ) : (
        dispute.timeline.map((event, index) => (
          <div key={event.id} className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <Clock className="h-5 w-5 text-blue-600" />
              </div>
              {index < dispute.timeline.length - 1 && (
                <div className="w-0.5 h-full bg-gray-200 mt-2" />
              )}
            </div>
            <div className="flex-1 pb-6">
              <div className="flex items-start justify-between mb-1">
                <h4 className="font-medium">{event.event}</h4>
                <span className="text-xs text-gray-500">
                  {format(new Date(event.createdAt), 'MMM d, HH:mm')}
                </span>
              </div>
              <p className="text-sm text-gray-600">{event.description}</p>
              {event.actor && (
                <p className="text-xs text-gray-500 mt-1">
                  By {event.actor} ({event.actorRole})
                </p>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  )
}

// Resolution Tab
function ResolutionTab({ dispute }: { dispute: Dispute }) {
  const { createProposal, resolveDispute } = useDisputeStore()
  const { user } = useAuthStore()
  const [proposalType, setProposalType] = useState<ResolutionType>('refund')
  const [proposalAmount, setProposalAmount] = useState('')
  const [proposalDescription, setProposalDescription] = useState('')

  const handleSubmitProposal = async () => {
    if (!user || !proposalDescription) return

    await createProposal(dispute.id, {
      disputeId: dispute.id,
      proposedBy: 'customer',
      proposerName: user.first_name + ' ' + user.last_name,
      type: proposalType,
      amount: proposalAmount ? parseFloat(proposalAmount) : undefined,
      description: proposalDescription,
    })

    setProposalDescription('')
    setProposalAmount('')
  }

  if (dispute.resolution) {
    return (
      <div className="space-y-6 pb-6">
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-900">Dispute Resolved</AlertTitle>
          <AlertDescription className="text-green-800 mt-2">
            This dispute was resolved on {format(new Date(dispute.resolution.resolvedAt), 'PPP')}
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle>Resolution Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Resolution Type</Label>
              <p className="font-medium capitalize mt-1">{dispute.resolution.type.replace('_', ' ')}</p>
            </div>
            {dispute.resolution.amount && (
              <div>
                <Label>Amount</Label>
                <p className="font-medium mt-1">£{dispute.resolution.amount.toFixed(2)}</p>
              </div>
            )}
            <div>
              <Label>Description</Label>
              <p className="text-sm text-gray-600 mt-1">{dispute.resolution.description}</p>
            </div>
            <div>
              <Label>Resolved By</Label>
              <p className="text-sm mt-1">
                {dispute.resolution.resolvedBy} ({dispute.resolution.resolvedByRole})
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-6">
      {/* Submit Proposal */}
      <Card>
        <CardHeader>
          <CardTitle>Submit Resolution Proposal</CardTitle>
          <CardDescription>
            Propose a solution to resolve this dispute
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Resolution Type</Label>
            <Select value={proposalType} onValueChange={(v: ResolutionType) => setProposalType(v)}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="refund">Full Refund</SelectItem>
                <SelectItem value="partial_refund">Partial Refund</SelectItem>
                <SelectItem value="replacement">Replacement</SelectItem>
                <SelectItem value="store_credit">Store Credit</SelectItem>
                <SelectItem value="no_action">No Action</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {(proposalType === 'refund' || proposalType === 'partial_refund' || proposalType === 'store_credit') && (
            <div>
              <Label>Amount</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={proposalAmount}
                onChange={(e) => setProposalAmount(e.target.value)}
                className="mt-1"
              />
            </div>
          )}

          <div>
            <Label>Description</Label>
            <Textarea
              placeholder="Explain your proposed resolution..."
              value={proposalDescription}
              onChange={(e) => setProposalDescription(e.target.value)}
              className="mt-1"
              rows={4}
            />
          </div>

          <Button onClick={handleSubmitProposal} className="w-full">
            Submit Proposal
          </Button>
        </CardContent>
      </Card>

      {/* Existing Proposals */}
      <div>
        <h3 className="font-semibold mb-3">Resolution Proposals ({dispute.proposals.length})</h3>
        {dispute.proposals.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-gray-500">
              <Scale className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No proposals submitted yet</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {dispute.proposals.map((proposal) => (
              <ProposalCard key={proposal.id} proposal={proposal} dispute={dispute} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function ProposalCard({ proposal, dispute }: { proposal: any; dispute: Dispute }) {
  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    accepted: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    counter: 'bg-blue-100 text-blue-800',
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="font-medium capitalize">{proposal.type.replace('_', ' ')}</p>
            <p className="text-sm text-gray-600">
              Proposed by {proposal.proposerName} ({proposal.proposedBy})
            </p>
          </div>
          <Badge className={statusColors[proposal.status]}>
            {proposal.status}
          </Badge>
        </div>

        {proposal.amount && (
          <p className="text-lg font-bold mb-2">£{proposal.amount.toFixed(2)}</p>
        )}

        <p className="text-sm text-gray-600 mb-3">{proposal.description}</p>

        <p className="text-xs text-gray-500">
          {format(new Date(proposal.createdAt), 'PPp')}
        </p>
      </CardContent>
    </Card>
  )
}

// New Dispute Form
function NewDisputeForm({ onClose }: { onClose: () => void }) {
  const { user } = useAuthStore()
  const { createDispute } = useDisputeStore()

  const [formData, setFormData] = useState({
    orderId: '',
    orderNumber: '',
    type: 'quality' as DisputeType,
    priority: 'medium' as DisputePriority,
    subject: '',
    description: '',
    orderAmount: '',
    disputedAmount: '',
    vendorName: '',
    vendorEmail: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    await createDispute({
      ...formData,
      customerId: user?.id || '',
      customerName: user ? `${user.first_name} ${user.last_name}` : '',
      customerEmail: user?.email || '',
      orderAmount: parseFloat(formData.orderAmount),
      disputedAmount: parseFloat(formData.disputedAmount),
    })

    onClose()
  }

  return (
    <form onSubmit={handleSubmit}>
      <DialogHeader>
        <DialogTitle>File New Dispute</DialogTitle>
        <DialogDescription>
          Submit a dispute for order-related issues. Our mediation team will review and assist.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4 py-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Order ID</Label>
            <Input
              required
              value={formData.orderId}
              onChange={(e) => setFormData({ ...formData, orderId: e.target.value })}
              placeholder="ORD-123456"
            />
          </div>
          <div>
            <Label>Order Number</Label>
            <Input
              required
              value={formData.orderNumber}
              onChange={(e) => setFormData({ ...formData, orderNumber: e.target.value })}
              placeholder="#123456"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Dispute Type</Label>
            <Select
              value={formData.type}
              onValueChange={(v: DisputeType) => setFormData({ ...formData, type: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(disputeTypeMeta).map(([value, { label }]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Priority</Label>
            <Select
              value={formData.priority}
              onValueChange={(v: DisputePriority) => setFormData({ ...formData, priority: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(priorityMeta).map(([value, { label }]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label>Subject</Label>
          <Input
            required
            value={formData.subject}
            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
            placeholder="Brief description of the issue"
          />
        </div>

        <div>
          <Label>Detailed Description</Label>
          <Textarea
            required
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Provide detailed information about your dispute..."
            rows={4}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Order Amount (£)</Label>
            <Input
              required
              type="number"
              step="0.01"
              value={formData.orderAmount}
              onChange={(e) => setFormData({ ...formData, orderAmount: e.target.value })}
              placeholder="0.00"
            />
          </div>
          <div>
            <Label>Disputed Amount (£)</Label>
            <Input
              required
              type="number"
              step="0.01"
              value={formData.disputedAmount}
              onChange={(e) => setFormData({ ...formData, disputedAmount: e.target.value })}
              placeholder="0.00"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Vendor Name</Label>
            <Input
              required
              value={formData.vendorName}
              onChange={(e) => setFormData({ ...formData, vendorName: e.target.value })}
              placeholder="Vendor name"
            />
          </div>
          <div>
            <Label>Vendor Email</Label>
            <Input
              required
              type="email"
              value={formData.vendorEmail}
              onChange={(e) => setFormData({ ...formData, vendorEmail: e.target.value })}
              placeholder="vendor@example.com"
            />
          </div>
        </div>
      </div>

      <div className="flex gap-3 justify-end">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit">
          Submit Dispute
        </Button>
      </div>
    </form>
  )
}
