'use client'

import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ClipboardCheck,
  Calendar,
  MapPin,
  Shield,
  FileCheck,
  TrendingUp,
  Search,
  Filter,
  Download,
  Upload,
  Eye,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Star,
  Award,
  Globe,
  Package,
  Factory,
  ShieldCheck,
  FileText,
  Camera,
  BarChart3,
  Users,
  Briefcase,
  Plus,
  ArrowRight,
  X,
  ChevronDown,
  Info,
  Building2,
  Phone,
  Mail,
  Languages,
  CheckSquare,
  AlertCircle,
  Zap,
  DollarSign,
  MessageSquare
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
import { useInspectionStore, InspectionBooking, Inspector, InspectionReport } from '@/store/inspection-store'
import { format, addDays, isAfter } from 'date-fns'

const QualityInspectionPage = () => {
  const {
    bookings,
    inspectors,
    createBooking,
    updateBooking,
    confirmBooking,
    assignInspector,
    getStats,
    getUpcomingInspections,
    getCompletedInspections,
    searchBookings
  } = useInspectionStore()

  const [activeTab, setActiveTab] = useState('overview')
  const [showBookingDialog, setShowBookingDialog] = useState(false)
  const [showInspectorDialog, setShowInspectorDialog] = useState(false)
  const [showReportDialog, setShowReportDialog] = useState(false)
  const [selectedBooking, setSelectedBooking] = useState<InspectionBooking | null>(null)
  const [selectedReport, setSelectedReport] = useState<InspectionReport | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')

  // Booking Form State
  const [bookingStep, setBookingStep] = useState(1)
  const [bookingForm, setBookingForm] = useState<Partial<InspectionBooking>>({
    inspectionType: 'pre-shipment',
    inspectionStandard: 'ISO 2859-1',
    aqlLevel: 'AQL 2.5',
    pricing: {
      inspectionFee: 0,
      travelCost: 0,
      total: 0,
      currency: 'USD'
    },
    inspectionLocation: {
      address: '',
      city: '',
      country: 'China',
      contactPerson: '',
      contactPhone: ''
    }
  })

  const stats = getStats()
  const upcomingInspections = getUpcomingInspections()
  const completedInspections = getCompletedInspections()

  // Filter bookings
  const filteredBookings = useMemo(() => {
    let result = bookings

    if (searchQuery) {
      result = searchBookings(searchQuery)
    }

    if (filterStatus !== 'all') {
      result = result.filter(b => b.status === filterStatus)
    }

    return result.sort((a, b) =>
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    )
  }, [bookings, searchQuery, filterStatus, searchBookings])

  const handleCreateBooking = () => {
    if (bookingStep < 4) {
      setBookingStep(bookingStep + 1)
      return
    }

    const id = createBooking(bookingForm as any)
    setShowBookingDialog(false)
    setBookingStep(1)
    setBookingForm({
      inspectionType: 'pre-shipment',
      inspectionStandard: 'ISO 2859-1',
      aqlLevel: 'AQL 2.5',
      pricing: {
        inspectionFee: 0,
        travelCost: 0,
        total: 0,
        currency: 'USD'
      },
      inspectionLocation: {
        address: '',
        city: '',
        country: 'China',
        contactPerson: '',
        contactPhone: ''
      }
    })
  }

  const calculatePricing = () => {
    const baseFee = 250
    const travelCost = 100
    const testingFee = bookingForm.testingRequired ? 150 : 0
    const rushFee = 0 // Could add rush fee logic

    const total = baseFee + travelCost + testingFee + rushFee

    setBookingForm({
      ...bookingForm,
      pricing: {
        inspectionFee: baseFee,
        travelCost,
        testingFee,
        rushFee,
        total,
        currency: 'USD'
      }
    })
  }

  const getStatusColor = (status: InspectionBooking['status']) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-800 border-gray-200',
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      confirmed: 'bg-blue-100 text-blue-800 border-blue-200',
      'in-progress': 'bg-purple-100 text-purple-800 border-purple-200',
      completed: 'bg-green-100 text-green-800 border-green-200',
      cancelled: 'bg-red-100 text-red-800 border-red-200',
      'report-ready': 'bg-teal-100 text-teal-800 border-teal-200'
    }
    return colors[status] || colors.draft
  }

  const getResultColor = (result: 'passed' | 'failed' | 'conditional') => {
    const colors = {
      passed: 'text-green-600',
      failed: 'text-red-600',
      conditional: 'text-yellow-600'
    }
    return colors[result]
  }

  const inspectionTypes = [
    {
      id: 'pre-shipment',
      name: 'Pre-Shipment Inspection',
      description: 'Conducted when 100% of products are ready',
      icon: Package,
      color: 'text-blue-600'
    },
    {
      id: 'during-production',
      name: 'During Production Inspection',
      description: 'Check quality during manufacturing',
      icon: Factory,
      color: 'text-purple-600'
    },
    {
      id: 'final',
      name: 'Final Random Inspection',
      description: 'Final check before shipment',
      icon: ShieldCheck,
      color: 'text-green-600'
    },
    {
      id: 'container-loading',
      name: 'Container Loading Check',
      description: 'Verify loading process and count',
      icon: FileCheck,
      color: 'text-orange-600'
    },
    {
      id: 'pre-production',
      name: 'Pre-Production Inspection',
      description: 'Check materials and setup before production',
      icon: CheckSquare,
      color: 'text-teal-600'
    }
  ]

  const aqlLevels = [
    { value: 'AQL 0.65', description: 'Strictest - Medical devices, safety items' },
    { value: 'AQL 1.0', description: 'Very strict - High-value electronics' },
    { value: 'AQL 1.5', description: 'Strict - Consumer electronics' },
    { value: 'AQL 2.5', description: 'Standard - General consumer goods' },
    { value: 'AQL 4.0', description: 'Lenient - Low-risk products' },
    { value: 'custom', description: 'Custom AQL levels' }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40 backdrop-blur-lg bg-white/80">
        <div className="container mx-auto px-4 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center shadow-lg">
                <ClipboardCheck className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Quality Inspection Services</h1>
                <p className="text-sm text-gray-600">Professional third-party quality control</p>
              </div>
            </div>

            <Button
              onClick={() => setShowBookingDialog(true)}
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Book Inspection
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-white border border-gray-200 p-1">
            <TabsTrigger value="overview" className="gap-2">
              <BarChart3 className="w-4 h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="book" className="gap-2">
              <Calendar className="w-4 h-4" />
              Book Inspection
            </TabsTrigger>
            <TabsTrigger value="inspectors" className="gap-2">
              <Users className="w-4 h-4" />
              Inspectors
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <FileText className="w-4 h-4" />
              History
            </TabsTrigger>
            <TabsTrigger value="reports" className="gap-2">
              <FileCheck className="w-4 h-4" />
              Reports
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-cyan-50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Inspections</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total}</p>
                      <p className="text-xs text-gray-500 mt-1">All time</p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center">
                      <ClipboardCheck className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-gradient-to-br from-yellow-50 to-orange-50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Pending</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">{stats.pending}</p>
                      <p className="text-xs text-gray-500 mt-1">Awaiting confirmation</p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-yellow-600 flex items-center justify-center">
                      <Clock className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Completed</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">{stats.completed}</p>
                      <p className="text-xs text-gray-500 mt-1">Inspections done</p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-green-600 flex items-center justify-center">
                      <CheckCircle2 className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-pink-50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Pass Rate</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">{stats.passRate.toFixed(1)}%</p>
                      <p className="text-xs text-gray-500 mt-1">Quality score</p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-purple-600 flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Upcoming Inspections */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  Upcoming Inspections
                </CardTitle>
                <CardDescription>Scheduled quality inspections</CardDescription>
              </CardHeader>
              <CardContent>
                {upcomingInspections.length === 0 ? (
                  <div className="text-center py-12">
                    <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No upcoming inspections</p>
                    <Button
                      onClick={() => setShowBookingDialog(true)}
                      variant="outline"
                      className="mt-4"
                    >
                      Book Your First Inspection
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {upcomingInspections.slice(0, 5).map((booking) => (
                      <div
                        key={booking.id}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                        onClick={() => {
                          setSelectedBooking(booking)
                          setShowBookingDialog(true)
                        }}
                      >
                        <div className="flex items-center gap-4 flex-1">
                          <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                            <Package className="w-6 h-6 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900">{booking.productName}</h4>
                            <p className="text-sm text-gray-600">{booking.vendorName}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-gray-900">
                              {format(new Date(booking.preferredDate), 'MMM dd, yyyy')}
                            </p>
                            <Badge className={getStatusColor(booking.status)}>
                              {booking.status}
                            </Badge>
                          </div>
                        </div>
                        <ArrowRight className="w-5 h-5 text-gray-400 ml-4" />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Inspection Types */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Inspection Services</CardTitle>
                <CardDescription>Professional quality control for every stage</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {inspectionTypes.map((type) => (
                    <Card key={type.id} className="border-2 hover:border-blue-500 transition-colors cursor-pointer">
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <div className={`w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center ${type.color}`}>
                            <type.icon className="w-6 h-6" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 mb-1">{type.name}</h4>
                            <p className="text-sm text-gray-600">{type.description}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Book Inspection Tab */}
          <TabsContent value="book" className="space-y-6">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Book Quality Inspection</CardTitle>
                <CardDescription>Schedule a professional third-party inspection</CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => setShowBookingDialog(true)}
                  size="lg"
                  className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Start New Booking
                </Button>

                <Separator className="my-8" />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-4">Why Quality Inspection?</h3>
                    <ul className="space-y-3">
                      <li className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                        <div>
                          <p className="font-medium text-gray-900">Ensure Product Quality</p>
                          <p className="text-sm text-gray-600">Verify products meet your specifications</p>
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                        <div>
                          <p className="font-medium text-gray-900">Reduce Risk</p>
                          <p className="text-sm text-gray-600">Identify issues before shipment</p>
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                        <div>
                          <p className="font-medium text-gray-900">Save Money</p>
                          <p className="text-sm text-gray-600">Avoid costly returns and rework</p>
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                        <div>
                          <p className="font-medium text-gray-900">Professional Reports</p>
                          <p className="text-sm text-gray-600">Detailed documentation with photos</p>
                        </div>
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 mb-4">Inspection Standards</h3>
                    <div className="space-y-3">
                      {aqlLevels.map((level) => (
                        <div key={level.value} className="p-3 bg-gray-50 rounded-lg">
                          <p className="font-medium text-gray-900">{level.value}</p>
                          <p className="text-sm text-gray-600">{level.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Inspectors Tab */}
          <TabsContent value="inspectors" className="space-y-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Certified Inspectors</h2>
                <p className="text-sm text-gray-600">Professional quality control experts</p>
              </div>
              <div className="flex items-center gap-3">
                <Select defaultValue="all">
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by location" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Locations</SelectItem>
                    <SelectItem value="china">China</SelectItem>
                    <SelectItem value="vietnam">Vietnam</SelectItem>
                    <SelectItem value="india">India</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {inspectors.map((inspector) => (
                <Card key={inspector.id} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <Avatar className="w-16 h-16 border-2 border-blue-100">
                        <AvatarImage src={inspector.avatar} />
                        <AvatarFallback>{inspector.name.charAt(0)}</AvatarFallback>
                      </Avatar>

                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-bold text-gray-900">{inspector.name}</h3>
                            <p className="text-sm text-gray-600">{inspector.company}</p>
                          </div>
                          <Badge
                            className={
                              inspector.availability === 'available'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }
                          >
                            {inspector.availability}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-2 mb-3">
                          <div className="flex items-center">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            <span className="text-sm font-semibold ml-1">{inspector.rating}</span>
                          </div>
                          <span className="text-sm text-gray-500">({inspector.reviewCount} reviews)</span>
                          <span className="text-sm text-gray-400">•</span>
                          <span className="text-sm text-gray-600">{inspector.completedInspections} inspections</span>
                        </div>

                        <div className="space-y-2 mb-4">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Award className="w-4 h-4" />
                            <span>{inspector.experience} experience</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <MapPin className="w-4 h-4" />
                            <span>{inspector.location}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Languages className="w-4 h-4" />
                            <span>{inspector.languages.join(', ')}</span>
                          </div>
                        </div>

                        <div className="mb-4">
                          <p className="text-xs font-medium text-gray-500 mb-2">Certifications</p>
                          <div className="flex flex-wrap gap-1">
                            {inspector.certification.map((cert) => (
                              <Badge key={cert} variant="outline" className="text-xs">
                                {cert}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <div className="mb-4">
                          <p className="text-xs font-medium text-gray-500 mb-2">Specialization</p>
                          <div className="flex flex-wrap gap-1">
                            {inspector.specialization.map((spec) => (
                              <Badge key={spec} className="bg-blue-100 text-blue-800 text-xs">
                                {spec}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t">
                          <div>
                            <p className="text-xs text-gray-500">Hourly Rate</p>
                            <p className="text-lg font-bold text-gray-900">${inspector.hourlyRate}/hr</p>
                          </div>
                          <Button
                            onClick={() => {
                              setShowBookingDialog(true)
                              setBookingForm({ ...bookingForm, inspectorId: inspector.id, inspector })
                            }}
                            disabled={inspector.availability !== 'available'}
                          >
                            <Calendar className="w-4 h-4 mr-2" />
                            Book Now
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-6">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Inspection History</CardTitle>
                    <CardDescription>All your quality inspections</CardDescription>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <Input
                        placeholder="Search inspections..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 w-64"
                      />
                    </div>
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                      <SelectTrigger className="w-[150px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="confirmed">Confirmed</SelectItem>
                        <SelectItem value="in-progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="report-ready">Report Ready</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {filteredBookings.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No inspections found</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredBookings.map((booking) => (
                      <div
                        key={booking.id}
                        className="p-6 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                        onClick={() => {
                          setSelectedBooking(booking)
                          setShowBookingDialog(true)
                        }}
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-bold text-gray-900">{booking.productName}</h3>
                              <Badge className={getStatusColor(booking.status)}>
                                {booking.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600">{booking.vendorName}</p>
                          </div>
                          <p className="text-sm font-mono text-gray-500">{booking.id}</p>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Inspection Type</p>
                            <p className="text-sm font-medium text-gray-900">
                              {booking.inspectionType.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-1">AQL Level</p>
                            <p className="text-sm font-medium text-gray-900">{booking.aqlLevel}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Scheduled Date</p>
                            <p className="text-sm font-medium text-gray-900">
                              {booking.preferredDate ? format(new Date(booking.preferredDate), 'MMM dd, yyyy') : 'TBD'}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Total Cost</p>
                            <p className="text-sm font-medium text-gray-900">
                              ${booking.pricing?.total || 0}
                            </p>
                          </div>
                        </div>

                        {booking.inspector && (
                          <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
                            <Avatar className="w-10 h-10">
                              <AvatarImage src={booking.inspector.avatar} />
                              <AvatarFallback>{booking.inspector.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">{booking.inspector.name}</p>
                              <p className="text-xs text-gray-600">{booking.inspector.company}</p>
                            </div>
                            {booking.status === 'report-ready' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setSelectedReport(booking.report || null)
                                  setShowReportDialog(true)
                                }}
                              >
                                <FileCheck className="w-4 h-4 mr-2" />
                                View Report
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports" className="space-y-6">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Inspection Reports</CardTitle>
                <CardDescription>Detailed quality control documentation</CardDescription>
              </CardHeader>
              <CardContent>
                {completedInspections.length === 0 ? (
                  <div className="text-center py-12">
                    <FileCheck className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No inspection reports available</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {completedInspections.map((booking) => (
                      <Card key={booking.id} className="border-2 hover:border-blue-500 transition-colors">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <h3 className="font-bold text-gray-900 mb-1">{booking.productName}</h3>
                              <p className="text-sm text-gray-600">{booking.vendorName}</p>
                            </div>
                            {booking.report && (
                              <Badge className={getResultColor(booking.report.overallResult)}>
                                {booking.report.overallResult}
                              </Badge>
                            )}
                          </div>

                          {booking.report && (
                            <div className="space-y-3 mb-4">
                              <div className="grid grid-cols-2 gap-3">
                                <div className="p-3 bg-red-50 rounded-lg">
                                  <p className="text-xs text-gray-600 mb-1">Critical Defects</p>
                                  <p className="text-2xl font-bold text-red-600">
                                    {booking.report.aqlResult.criticalDefects}
                                  </p>
                                </div>
                                <div className="p-3 bg-yellow-50 rounded-lg">
                                  <p className="text-xs text-gray-600 mb-1">Major Defects</p>
                                  <p className="text-2xl font-bold text-yellow-600">
                                    {booking.report.aqlResult.majorDefects}
                                  </p>
                                </div>
                              </div>

                              <div className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-gray-600">Sample Size</span>
                                  <span className="font-medium">{booking.report.aqlResult.sampleSize}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-gray-600">Defects Found</span>
                                  <span className="font-medium">{booking.report.aqlResult.defectsFound}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-gray-600">Inspector</span>
                                  <span className="font-medium">{booking.report.inspectorName}</span>
                                </div>
                              </div>
                            </div>
                          )}

                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              className="flex-1"
                              onClick={() => {
                                setSelectedReport(booking.report || null)
                                setShowReportDialog(true)
                              }}
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              View Report
                            </Button>
                            <Button variant="outline" size="icon">
                              <Download className="w-4 h-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Booking Dialog */}
      <Dialog open={showBookingDialog} onOpenChange={setShowBookingDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Book Quality Inspection</DialogTitle>
            <DialogDescription>
              Schedule a professional third-party quality control inspection
            </DialogDescription>
          </DialogHeader>

          {/* Progress Steps */}
          <div className="flex items-center justify-between mb-6">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
                    bookingStep >= step
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {step}
                </div>
                {step < 4 && (
                  <div
                    className={`w-16 h-1 ${
                      bookingStep > step ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Step 1: Product & Inspection Details */}
          {bookingStep === 1 && (
            <div className="space-y-4">
              <div>
                <Label>Product Name *</Label>
                <Input
                  value={bookingForm.productName || ''}
                  onChange={(e) => setBookingForm({ ...bookingForm, productName: e.target.value })}
                  placeholder="Enter product name"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Vendor Name *</Label>
                  <Input
                    value={bookingForm.vendorName || ''}
                    onChange={(e) => setBookingForm({ ...bookingForm, vendorName: e.target.value })}
                    placeholder="Vendor/Supplier name"
                  />
                </div>
                <div>
                  <Label>Product Category *</Label>
                  <Input
                    value={bookingForm.productCategory || ''}
                    onChange={(e) => setBookingForm({ ...bookingForm, productCategory: e.target.value })}
                    placeholder="e.g., Electronics, Textiles"
                  />
                </div>
              </div>

              <div>
                <Label>Inspection Type *</Label>
                <RadioGroup
                  value={bookingForm.inspectionType}
                  onValueChange={(value: any) => setBookingForm({ ...bookingForm, inspectionType: value })}
                  className="grid grid-cols-2 gap-4 mt-2"
                >
                  {inspectionTypes.map((type) => (
                    <div key={type.id} className="relative">
                      <RadioGroupItem
                        value={type.id}
                        id={type.id}
                        className="peer sr-only"
                      />
                      <Label
                        htmlFor={type.id}
                        className="flex flex-col items-start p-4 border-2 rounded-lg cursor-pointer peer-checked:border-blue-600 peer-checked:bg-blue-50 hover:bg-gray-50 transition-all"
                      >
                        <type.icon className={`w-5 h-5 mb-2 ${type.color}`} />
                        <span className="font-medium text-sm">{type.name}</span>
                        <span className="text-xs text-gray-600 mt-1">{type.description}</span>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Quantity *</Label>
                  <Input
                    type="number"
                    value={bookingForm.quantity || ''}
                    onChange={(e) => setBookingForm({ ...bookingForm, quantity: parseInt(e.target.value) })}
                    placeholder="Total quantity"
                  />
                </div>
                <div>
                  <Label>SKU (Optional)</Label>
                  <Input
                    value={bookingForm.sku || ''}
                    onChange={(e) => setBookingForm({ ...bookingForm, sku: e.target.value })}
                    placeholder="Product SKU"
                  />
                </div>
              </div>

              <div>
                <Label>Product Specifications (Optional)</Label>
                <Textarea
                  value={bookingForm.specifications || ''}
                  onChange={(e) => setBookingForm({ ...bookingForm, specifications: e.target.value })}
                  placeholder="Describe product specifications, features, requirements..."
                  rows={4}
                />
              </div>
            </div>
          )}

          {/* Step 2: Standards & Requirements */}
          {bookingStep === 2 && (
            <div className="space-y-4">
              <div>
                <Label>Inspection Standard *</Label>
                <Select
                  value={bookingForm.inspectionStandard}
                  onValueChange={(value) => setBookingForm({ ...bookingForm, inspectionStandard: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ISO 2859-1">ISO 2859-1 (Sampling Procedures)</SelectItem>
                    <SelectItem value="ANSI/ASQ Z1.4">ANSI/ASQ Z1.4</SelectItem>
                    <SelectItem value="GB/T 2828">GB/T 2828 (Chinese Standard)</SelectItem>
                    <SelectItem value="MIL-STD-105E">MIL-STD-105E</SelectItem>
                    <SelectItem value="custom">Custom Standard</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>AQL (Acceptable Quality Level) *</Label>
                <RadioGroup
                  value={bookingForm.aqlLevel}
                  onValueChange={(value: any) => setBookingForm({ ...bookingForm, aqlLevel: value })}
                  className="space-y-3 mt-2"
                >
                  {aqlLevels.map((level) => (
                    <div key={level.value} className="flex items-start space-x-3">
                      <RadioGroupItem value={level.value} id={level.value} />
                      <Label htmlFor={level.value} className="flex-1 cursor-pointer">
                        <span className="font-medium">{level.value}</span>
                        <p className="text-sm text-gray-600">{level.description}</p>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              {bookingForm.aqlLevel === 'custom' && (
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="p-4">
                    <Label className="text-sm font-medium mb-3 block">Custom AQL Levels</Label>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <Label className="text-xs">Critical</Label>
                        <Input
                          type="number"
                          step="0.1"
                          placeholder="0.0"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Major</Label>
                        <Input
                          type="number"
                          step="0.1"
                          placeholder="2.5"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Minor</Label>
                        <Input
                          type="number"
                          step="0.1"
                          placeholder="4.0"
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div>
                <Label>Special Requirements (Optional)</Label>
                <Textarea
                  placeholder="Any special inspection requirements, focus areas, or concerns..."
                  rows={3}
                />
              </div>

              <div className="space-y-3">
                <Label>Additional Testing Required</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="test-functional" />
                    <Label htmlFor="test-functional" className="font-normal cursor-pointer">
                      Functional Testing
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="test-safety" />
                    <Label htmlFor="test-safety" className="font-normal cursor-pointer">
                      Safety Testing
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="test-lab" />
                    <Label htmlFor="test-lab" className="font-normal cursor-pointer">
                      Lab Testing ($150 additional)
                    </Label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Location & Scheduling */}
          {bookingStep === 3 && (
            <div className="space-y-4">
              <div>
                <Label>Inspection Location *</Label>
                <Input
                  value={bookingForm.inspectionLocation?.address || ''}
                  onChange={(e) => setBookingForm({
                    ...bookingForm,
                    inspectionLocation: { ...bookingForm.inspectionLocation!, address: e.target.value }
                  })}
                  placeholder="Factory/Warehouse address"
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>City *</Label>
                  <Input
                    value={bookingForm.inspectionLocation?.city || ''}
                    onChange={(e) => setBookingForm({
                      ...bookingForm,
                      inspectionLocation: { ...bookingForm.inspectionLocation!, city: e.target.value }
                    })}
                    placeholder="City"
                  />
                </div>
                <div>
                  <Label>Country *</Label>
                  <Select
                    value={bookingForm.inspectionLocation?.country}
                    onValueChange={(value) => setBookingForm({
                      ...bookingForm,
                      inspectionLocation: { ...bookingForm.inspectionLocation!, country: value }
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="China">China</SelectItem>
                      <SelectItem value="Vietnam">Vietnam</SelectItem>
                      <SelectItem value="India">India</SelectItem>
                      <SelectItem value="Thailand">Thailand</SelectItem>
                      <SelectItem value="Bangladesh">Bangladesh</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Postal Code</Label>
                  <Input
                    value={bookingForm.inspectionLocation?.postalCode || ''}
                    onChange={(e) => setBookingForm({
                      ...bookingForm,
                      inspectionLocation: { ...bookingForm.inspectionLocation!, postalCode: e.target.value }
                    })}
                    placeholder="Postal code"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Contact Person *</Label>
                  <Input
                    value={bookingForm.inspectionLocation?.contactPerson || ''}
                    onChange={(e) => setBookingForm({
                      ...bookingForm,
                      inspectionLocation: { ...bookingForm.inspectionLocation!, contactPerson: e.target.value }
                    })}
                    placeholder="On-site contact name"
                  />
                </div>
                <div>
                  <Label>Contact Phone *</Label>
                  <Input
                    value={bookingForm.inspectionLocation?.contactPhone || ''}
                    onChange={(e) => setBookingForm({
                      ...bookingForm,
                      inspectionLocation: { ...bookingForm.inspectionLocation!, contactPhone: e.target.value }
                    })}
                    placeholder="+86 XXX XXXX XXXX"
                  />
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Preferred Date *</Label>
                  <Input
                    type="date"
                    value={bookingForm.preferredDate || ''}
                    onChange={(e) => setBookingForm({ ...bookingForm, preferredDate: e.target.value })}
                    min={format(addDays(new Date(), 3), 'yyyy-MM-dd')}
                  />
                  <p className="text-xs text-gray-500 mt-1">Minimum 3 days notice required</p>
                </div>
                <div>
                  <Label>Preferred Time</Label>
                  <Select
                    value={bookingForm.preferredTime}
                    onValueChange={(value) => setBookingForm({ ...bookingForm, preferredTime: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select time" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="morning">Morning (8:00 - 12:00)</SelectItem>
                      <SelectItem value="afternoon">Afternoon (13:00 - 17:00)</SelectItem>
                      <SelectItem value="flexible">Flexible</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Alternative Date (Optional)</Label>
                <Input
                  type="date"
                  value={bookingForm.alternativeDate || ''}
                  onChange={(e) => setBookingForm({ ...bookingForm, alternativeDate: e.target.value })}
                  min={format(addDays(new Date(), 3), 'yyyy-MM-dd')}
                />
              </div>

              <div>
                <Label>Estimated Duration</Label>
                <Select
                  value={bookingForm.estimatedDuration?.toString()}
                  onValueChange={(value) => setBookingForm({ ...bookingForm, estimatedDuration: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select duration" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2">2 hours</SelectItem>
                    <SelectItem value="4">4 hours (Half day)</SelectItem>
                    <SelectItem value="8">8 hours (Full day)</SelectItem>
                    <SelectItem value="16">2 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Step 4: Review & Confirm */}
          {bookingStep === 4 && (
            <div className="space-y-6">
              <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-0">
                <CardContent className="p-6">
                  <h3 className="font-bold text-gray-900 mb-4">Booking Summary</h3>

                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Product:</span>
                      <span className="font-medium">{bookingForm.productName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Vendor:</span>
                      <span className="font-medium">{bookingForm.vendorName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Inspection Type:</span>
                      <span className="font-medium">
                        {bookingForm.inspectionType?.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">AQL Level:</span>
                      <span className="font-medium">{bookingForm.aqlLevel}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Date:</span>
                      <span className="font-medium">
                        {bookingForm.preferredDate ? format(new Date(bookingForm.preferredDate), 'MMM dd, yyyy') : 'Not set'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Location:</span>
                      <span className="font-medium">{bookingForm.inspectionLocation?.city}, {bookingForm.inspectionLocation?.country}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 border-blue-200">
                <CardContent className="p-6">
                  <h3 className="font-bold text-gray-900 mb-4">Pricing Breakdown</h3>

                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Inspection Fee</span>
                      <span className="font-medium">$250.00</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Travel Cost</span>
                      <span className="font-medium">$100.00</span>
                    </div>
                    {bookingForm.testingRequired && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Lab Testing</span>
                        <span className="font-medium">$150.00</span>
                      </div>
                    )}
                  </div>

                  <Separator className="my-4" />

                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-gray-900">Total</span>
                    <span className="text-2xl font-bold text-blue-600">
                      $350.00
                    </span>
                  </div>
                </CardContent>
              </Card>

              <div className="flex items-start space-x-2">
                <Checkbox id="terms" />
                <Label htmlFor="terms" className="text-sm font-normal leading-relaxed">
                  I agree to the inspection terms and conditions. I understand that payment is due upon completion of the inspection.
                </Label>
              </div>
            </div>
          )}

          <div className="flex justify-between pt-4">
            <Button
              variant="outline"
              onClick={() => {
                if (bookingStep === 1) {
                  setShowBookingDialog(false)
                  setBookingStep(1)
                } else {
                  setBookingStep(bookingStep - 1)
                }
              }}
            >
              {bookingStep === 1 ? 'Cancel' : 'Back'}
            </Button>
            <Button
              onClick={handleCreateBooking}
              className="bg-gradient-to-r from-blue-600 to-cyan-600"
            >
              {bookingStep < 4 ? 'Continue' : 'Confirm Booking'}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Report Dialog */}
      <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Inspection Report</DialogTitle>
            <DialogDescription>Detailed quality control findings</DialogDescription>
          </DialogHeader>

          {selectedReport && (
            <div className="space-y-6">
              {/* Overall Result */}
              <Card className={`border-2 ${
                selectedReport.overallResult === 'passed' ? 'border-green-200 bg-green-50' :
                selectedReport.overallResult === 'failed' ? 'border-red-200 bg-red-50' :
                'border-yellow-200 bg-yellow-50'
              }`}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-2xl font-bold mb-2">
                        {selectedReport.overallResult.toUpperCase()}
                      </h3>
                      <p className="text-gray-600">Overall Inspection Result</p>
                    </div>
                    {selectedReport.overallResult === 'passed' ? (
                      <CheckCircle2 className="w-16 h-16 text-green-600" />
                    ) : selectedReport.overallResult === 'failed' ? (
                      <XCircle className="w-16 h-16 text-red-600" />
                    ) : (
                      <AlertTriangle className="w-16 h-16 text-yellow-600" />
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Inspector Info */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                      <Shield className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{selectedReport.inspectorName}</p>
                      <p className="text-sm text-gray-600">{selectedReport.inspectorCertification}</p>
                    </div>
                    <p className="text-sm text-gray-500">
                      {format(new Date(selectedReport.generatedAt), 'MMM dd, yyyy')}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* AQL Results */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">AQL Results</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-4 bg-red-50 rounded-lg text-center">
                      <p className="text-sm text-gray-600 mb-1">Critical</p>
                      <p className="text-3xl font-bold text-red-600">
                        {selectedReport.aqlResult.criticalDefects}
                      </p>
                    </div>
                    <div className="p-4 bg-yellow-50 rounded-lg text-center">
                      <p className="text-sm text-gray-600 mb-1">Major</p>
                      <p className="text-3xl font-bold text-yellow-600">
                        {selectedReport.aqlResult.majorDefects}
                      </p>
                    </div>
                    <div className="p-4 bg-blue-50 rounded-lg text-center">
                      <p className="text-sm text-gray-600 mb-1">Minor</p>
                      <p className="text-3xl font-bold text-blue-600">
                        {selectedReport.aqlResult.minorDefects}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Sample Size:</span>
                      <span className="font-medium">{selectedReport.aqlResult.sampleSize}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Defects:</span>
                      <span className="font-medium">{selectedReport.aqlResult.defectsFound}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">AQL Level:</span>
                      <span className="font-medium">{selectedReport.aqlResult.acceptanceLevel}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Quantity Inspected:</span>
                      <span className="font-medium">{selectedReport.productDetails.samplesInspected}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quality Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Quality Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(selectedReport.qualityMetrics).map(([key, value]) => (
                      <div key={key}>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm font-medium capitalize">
                            {key.replace(/([A-Z])/g, ' $1').trim()}
                          </span>
                          <span className="text-sm font-bold">{value}/10</span>
                        </div>
                        <Progress value={value * 10} className="h-2" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 leading-relaxed">{selectedReport.summary}</p>
                </CardContent>
              </Card>

              {/* Actions */}
              <div className="flex gap-3">
                <Button className="flex-1" variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Download PDF
                </Button>
                <Button className="flex-1" variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Download Certificate
                </Button>
                <Button className="flex-1">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Contact Inspector
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default QualityInspectionPage
