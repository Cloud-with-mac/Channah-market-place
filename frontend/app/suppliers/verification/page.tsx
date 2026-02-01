'use client'

import { useState, useMemo } from 'react'
import { useVerificationStore, type BadgeLevel, type VerificationStatus } from '@/store/verification-store'

// ============================================================
// Supplier Verification Page
// Features: verification levels comparison, apply form,
// status dashboard, badge display, verified supplier directory
// ============================================================

// Verified suppliers - populated from API
const mockSuppliers: Array<{
  id: string
  companyName: string
  country: string
  businessType: string
  yearsInOperation: number
  badge: BadgeLevel | undefined
  verificationScore: number
  overallStatus: VerificationStatus
  certifications: string[]
  specialties: string[]
  lastAuditDate: string
  documentsVerified: number
  totalOrders: number
  responseTime: number
}> = []

// Badge tier definitions
const badgeTiers = [
  {
    level: 'bronze' as BadgeLevel,
    name: 'Bronze Verified',
    color: 'bg-orange-100 text-orange-800 border-orange-300',
    iconBg: 'bg-orange-500',
    headerBg: 'bg-gradient-to-r from-orange-500 to-orange-600',
    minVerifications: 10,
    minComplianceScore: 70,
    minAuditsPassed: 1,
    minDocumentsVerified: 5,
    benefits: [
      'Verified badge on profile',
      'Priority in search results',
      'Basic buyer trust signals',
      'Access to standard RFQs',
    ],
    price: 'Free',
  },
  {
    level: 'silver' as BadgeLevel,
    name: 'Silver Verified',
    color: 'bg-gray-100 text-gray-800 border-gray-300',
    iconBg: 'bg-gray-400',
    headerBg: 'bg-gradient-to-r from-gray-400 to-gray-500',
    minVerifications: 50,
    minComplianceScore: 85,
    minAuditsPassed: 3,
    minDocumentsVerified: 7,
    benefits: [
      'All Bronze benefits',
      'Enhanced profile visibility',
      'Access to premium RFQs',
      'Dedicated account support',
      'Trade show invitations',
    ],
    price: '$299/year',
  },
  {
    level: 'gold' as BadgeLevel,
    name: 'Gold Verified',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    iconBg: 'bg-yellow-500',
    headerBg: 'bg-gradient-to-r from-yellow-500 to-yellow-600',
    minVerifications: 100,
    minComplianceScore: 95,
    minAuditsPassed: 5,
    minDocumentsVerified: 10,
    benefits: [
      'All Silver benefits',
      'Top placement in search',
      'Featured supplier status',
      'Priority buyer matching',
      'Exclusive trade finance rates',
      'Annual on-site audit included',
      'Premium marketing materials',
    ],
    price: '$799/year',
  },
]

const documentTypes = [
  { value: 'business_license', label: 'Business License' },
  { value: 'tax_certificate', label: 'Tax Certificate' },
  { value: 'incorporation', label: 'Certificate of Incorporation' },
  { value: 'id_proof', label: 'ID Proof (Director/Owner)' },
  { value: 'address_proof', label: 'Address Proof' },
  { value: 'bank_statement', label: 'Bank Statement' },
]

const certificationTypes = [
  { value: 'ISO_9001', label: 'ISO 9001 - Quality Management' },
  { value: 'ISO_14001', label: 'ISO 14001 - Environmental Management' },
  { value: 'ISO_45001', label: 'ISO 45001 - Occupational Health & Safety' },
  { value: 'CE', label: 'CE Marking' },
  { value: 'FDA', label: 'FDA Certification' },
  { value: 'UL', label: 'UL Certification' },
  { value: 'RoHS', label: 'RoHS Compliance' },
  { value: 'REACH', label: 'REACH Compliance' },
  { value: 'B_CORP', label: 'B Corp Certification' },
  { value: 'FAIR_TRADE', label: 'Fair Trade Certification' },
]

type Tab = 'levels' | 'apply' | 'status' | 'directory'

export default function SupplierVerificationPage() {
  const store = useVerificationStore()
  const [activeTab, setActiveTab] = useState<Tab>('levels')

  // Apply form state
  const [applyForm, setApplyForm] = useState({
    companyName: '',
    email: '',
    phone: '',
    address: '',
    country: '',
    businessType: '',
    yearsInOperation: '',
    website: '',
    description: '',
    targetBadge: 'bronze' as BadgeLevel,
  })
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([])
  const [selectedCertifications, setSelectedCertifications] = useState<string[]>([])
  const [applySubmitted, setApplySubmitted] = useState(false)

  // Directory filters
  const [dirBadgeFilter, setDirBadgeFilter] = useState<string>('all')
  const [dirCountryFilter, setDirCountryFilter] = useState<string>('all')
  const [dirSearch, setDirSearch] = useState('')
  const [dirSort, setDirSort] = useState<'score' | 'name' | 'orders'>('score')

  // Status tab state
  const [statusSupplierId, setStatusSupplierId] = useState('')

  const stats = store.getVerificationStats()

  // Filtered directory
  const filteredSuppliers = useMemo(() => {
    let list = [...mockSuppliers]
    if (dirBadgeFilter !== 'all') {
      if (dirBadgeFilter === 'none') {
        list = list.filter((s) => !s.badge)
      } else {
        list = list.filter((s) => s.badge === dirBadgeFilter)
      }
    }
    if (dirCountryFilter !== 'all') {
      list = list.filter((s) => s.country === dirCountryFilter)
    }
    if (dirSearch) {
      const q = dirSearch.toLowerCase()
      list = list.filter(
        (s) =>
          s.companyName.toLowerCase().includes(q) ||
          s.specialties.some((sp) => sp.toLowerCase().includes(q)) ||
          s.country.toLowerCase().includes(q)
      )
    }
    if (dirSort === 'score') list.sort((a, b) => b.verificationScore - a.verificationScore)
    else if (dirSort === 'name') list.sort((a, b) => a.companyName.localeCompare(b.companyName))
    else if (dirSort === 'orders') list.sort((a, b) => b.totalOrders - a.totalOrders)
    return list
  }, [dirBadgeFilter, dirCountryFilter, dirSearch, dirSort])

  const uniqueCountries = [...new Set(mockSuppliers.map((s) => s.country))].sort()

  const handleApplySubmit = () => {
    if (!applyForm.companyName || !applyForm.email || !applyForm.country) return
    store.addSupplier({
      supplierId: `sup-${Date.now()}`,
      companyName: applyForm.companyName,
      email: applyForm.email,
      phone: applyForm.phone,
      address: applyForm.address,
      country: applyForm.country,
      businessType: applyForm.businessType,
      yearsInOperation: parseInt(applyForm.yearsInOperation) || 0,
      website: applyForm.website,
      description: applyForm.description,
      overallStatus: 'pending',
      verificationScore: 0,
      badges: [],
      documents: [],
      documentsVerified: 0,
      factoryAudits: [],
      certifications: [],
      metrics: {
        totalVerifications: 0,
        successfulVerifications: 0,
        documentCompleteness: 0,
        auditPassRate: 0,
        complianceScore: 0,
        responseTime: 0,
      },
    })
    setApplySubmitted(true)
  }

  const toggleDocument = (docType: string) => {
    setSelectedDocuments((prev) =>
      prev.includes(docType) ? prev.filter((d) => d !== docType) : [...prev, docType]
    )
  }

  const toggleCertification = (certType: string) => {
    setSelectedCertifications((prev) =>
      prev.includes(certType) ? prev.filter((c) => c !== certType) : [...prev, certType]
    )
  }

  const getBadgeDisplay = (badge?: BadgeLevel) => {
    if (!badge) return { label: 'Unverified', color: 'bg-gray-100 text-gray-600', icon: '--' }
    if (badge === 'gold') return { label: 'Gold', color: 'bg-yellow-100 text-yellow-800', icon: '\u2605\u2605\u2605' }
    if (badge === 'silver') return { label: 'Silver', color: 'bg-gray-100 text-gray-700', icon: '\u2605\u2605' }
    return { label: 'Bronze', color: 'bg-orange-100 text-orange-800', icon: '\u2605' }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      case 'expired': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-600'
    }
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'levels', label: 'Verification Levels' },
    { key: 'apply', label: 'Apply for Verification' },
    { key: 'status', label: 'Verification Status' },
    { key: 'directory', label: 'Verified Directory' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-gray-900">Supplier Verification</h1>
          <p className="mt-2 text-gray-600">
            Build trust with buyers through our comprehensive supplier verification program.
            Get verified to unlock premium features and increase your visibility.
          </p>

          {/* Summary Stats */}
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            {[
              { label: 'Total Suppliers', value: stats.totalSuppliers || mockSuppliers.length },
              { label: 'Verified', value: stats.verifiedSuppliers || mockSuppliers.filter((s) => s.overallStatus === 'verified').length },
              { label: 'Pending', value: stats.pendingVerifications || mockSuppliers.filter((s) => s.overallStatus === 'pending').length },
              { label: 'Rejected', value: stats.rejectedSuppliers || 0 },
              { label: 'Gold Badges', value: stats.goldBadges || mockSuppliers.filter((s) => s.badge === 'gold').length },
              { label: 'Silver Badges', value: stats.silverBadges || mockSuppliers.filter((s) => s.badge === 'silver').length },
              { label: 'Bronze Badges', value: stats.bronzeBadges || mockSuppliers.filter((s) => s.badge === 'bronze').length },
            ].map((stat) => (
              <div key={stat.label} className="bg-gray-50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                <div className="text-xs text-gray-500">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-1 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === tab.key
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* ==================== VERIFICATION LEVELS ==================== */}
        {activeTab === 'levels' && (
          <div className="space-y-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900">Choose Your Verification Level</h2>
              <p className="mt-2 text-gray-600">
                Higher verification levels unlock more features and build greater buyer confidence.
              </p>
            </div>

            {/* Tier Comparison Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {badgeTiers.map((tier) => (
                <div
                  key={tier.level}
                  className={`bg-white rounded-xl shadow-sm border overflow-hidden ${
                    tier.level === 'gold' ? 'ring-2 ring-yellow-400' : ''
                  }`}
                >
                  <div className={`${tier.headerBg} text-white p-6 text-center`}>
                    <div className="text-4xl mb-2">
                      {tier.level === 'gold' ? '\u2605\u2605\u2605' : tier.level === 'silver' ? '\u2605\u2605' : '\u2605'}
                    </div>
                    <h3 className="text-xl font-bold">{tier.name}</h3>
                    <div className="mt-2 text-2xl font-bold">{tier.price}</div>
                  </div>
                  <div className="p-6">
                    <h4 className="font-semibold text-gray-900 mb-3">Requirements</h4>
                    <ul className="space-y-2 text-sm text-gray-600 mb-6">
                      <li className="flex items-center gap-2">
                        <span className="text-blue-500">&#10003;</span>
                        {tier.minVerifications}+ successful verifications
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-blue-500">&#10003;</span>
                        {tier.minComplianceScore}%+ compliance score
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-blue-500">&#10003;</span>
                        {tier.minAuditsPassed}+ audits passed
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-blue-500">&#10003;</span>
                        {tier.minDocumentsVerified}+ documents verified
                      </li>
                    </ul>

                    <h4 className="font-semibold text-gray-900 mb-3">Benefits</h4>
                    <ul className="space-y-2 text-sm text-gray-600 mb-6">
                      {tier.benefits.map((benefit) => (
                        <li key={benefit} className="flex items-start gap-2">
                          <span className="text-green-500 mt-0.5">&#10003;</span>
                          {benefit}
                        </li>
                      ))}
                    </ul>

                    <button
                      onClick={() => {
                        setApplyForm((f) => ({ ...f, targetBadge: tier.level }))
                        setActiveTab('apply')
                      }}
                      className={`w-full py-2.5 rounded-lg font-medium text-sm transition-colors ${
                        tier.level === 'gold'
                          ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                          : tier.level === 'silver'
                          ? 'bg-gray-500 text-white hover:bg-gray-600'
                          : 'bg-orange-500 text-white hover:bg-orange-600'
                      }`}
                    >
                      Apply for {tier.name}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Detailed Comparison Table */}
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <div className="px-6 py-4 border-b">
                <h3 className="text-lg font-semibold text-gray-900">Detailed Feature Comparison</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Feature</th>
                      <th className="text-center px-6 py-3 text-sm font-medium text-orange-600">Bronze</th>
                      <th className="text-center px-6 py-3 text-sm font-medium text-gray-600">Silver</th>
                      <th className="text-center px-6 py-3 text-sm font-medium text-yellow-600">Gold</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {[
                      { feature: 'Profile Badge', bronze: true, silver: true, gold: true },
                      { feature: 'Search Boost', bronze: '+10%', silver: '+25%', gold: '+50%' },
                      { feature: 'RFQ Access', bronze: 'Standard', silver: 'Premium', gold: 'Exclusive' },
                      { feature: 'Account Manager', bronze: false, silver: true, gold: true },
                      { feature: 'Trade Show Invitations', bronze: false, silver: true, gold: true },
                      { feature: 'Featured Placement', bronze: false, silver: false, gold: true },
                      { feature: 'Priority Matching', bronze: false, silver: false, gold: true },
                      { feature: 'On-site Audit Included', bronze: false, silver: false, gold: true },
                      { feature: 'Marketing Materials', bronze: 'Basic', silver: 'Standard', gold: 'Premium' },
                      { feature: 'Trade Finance Rate', bronze: 'Standard', silver: '-0.5%', gold: '-1.0%' },
                      { feature: 'Support Response', bronze: '48h', silver: '24h', gold: '4h' },
                      { feature: 'Analytics Dashboard', bronze: 'Basic', silver: 'Advanced', gold: 'Full Suite' },
                    ].map((row) => (
                      <tr key={row.feature} className="hover:bg-gray-50">
                        <td className="px-6 py-3 text-sm text-gray-900">{row.feature}</td>
                        {(['bronze', 'silver', 'gold'] as const).map((level) => {
                          const val = row[level]
                          return (
                            <td key={level} className="px-6 py-3 text-center text-sm">
                              {val === true ? (
                                <span className="text-green-500 font-bold">&#10003;</span>
                              ) : val === false ? (
                                <span className="text-gray-300">&#10007;</span>
                              ) : (
                                <span className="text-gray-700">{val}</span>
                              )}
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Trust & Credibility Section */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Why Get Verified?</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  {
                    title: 'Increased Trust',
                    description: 'Verified suppliers receive 3x more inquiries from buyers. Our verification badge signals reliability and professionalism.',
                    stat: '3x more inquiries',
                  },
                  {
                    title: 'Higher Conversion',
                    description: 'Products from verified suppliers convert 45% better. Buyers prefer verified suppliers for large orders.',
                    stat: '45% higher conversion',
                  },
                  {
                    title: 'Premium Access',
                    description: 'Get access to exclusive RFQs, trade finance with better rates, and priority buyer matching.',
                    stat: '$2M+ in exclusive RFQs monthly',
                  },
                ].map((item) => (
                  <div key={item.title} className="text-center">
                    <div className="text-2xl font-bold text-blue-600 mb-2">{item.stat}</div>
                    <h4 className="font-semibold text-gray-900 mb-1">{item.title}</h4>
                    <p className="text-sm text-gray-600">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ==================== APPLY FOR VERIFICATION ==================== */}
        {activeTab === 'apply' && (
          <div className="space-y-6">
            {applySubmitted ? (
              <div className="bg-white rounded-xl shadow-sm border p-8 text-center">
                <div className="text-5xl mb-4">&#10003;</div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Application Submitted!</h2>
                <p className="text-gray-600 mb-6">
                  Your verification application for <strong>{applyForm.companyName}</strong> has been submitted.
                  Our team will review your documents and get back to you within 3-5 business days.
                </p>
                <div className="flex justify-center gap-4">
                  <button
                    onClick={() => { setApplySubmitted(false); setActiveTab('status') }}
                    className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm"
                  >
                    Check Status
                  </button>
                  <button
                    onClick={() => {
                      setApplySubmitted(false)
                      setApplyForm({
                        companyName: '', email: '', phone: '', address: '', country: '',
                        businessType: '', yearsInOperation: '', website: '', description: '',
                        targetBadge: 'bronze',
                      })
                      setSelectedDocuments([])
                      setSelectedCertifications([])
                    }}
                    className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium text-sm"
                  >
                    Submit Another
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Target Badge Selection */}
                <div className="bg-white rounded-xl shadow-sm border p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Target Verification Level</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {badgeTiers.map((tier) => (
                      <button
                        key={tier.level}
                        onClick={() => setApplyForm((f) => ({ ...f, targetBadge: tier.level }))}
                        className={`p-4 rounded-lg border-2 text-left transition-colors ${
                          applyForm.targetBadge === tier.level
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${tier.color}`}>
                            {tier.name}
                          </span>
                          <span className="text-sm font-medium text-gray-500">{tier.price}</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Requires {tier.minComplianceScore}%+ compliance, {tier.minAuditsPassed}+ audits
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Company Information */}
                <div className="bg-white rounded-xl shadow-sm border p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Company Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Company Name *</label>
                      <input
                        type="text"
                        value={applyForm.companyName}
                        onChange={(e) => setApplyForm((f) => ({ ...f, companyName: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        placeholder="Your Company Name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Business Email *</label>
                      <input
                        type="email"
                        value={applyForm.email}
                        onChange={(e) => setApplyForm((f) => ({ ...f, email: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        placeholder="contact@company.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                      <input
                        type="tel"
                        value={applyForm.phone}
                        onChange={(e) => setApplyForm((f) => ({ ...f, phone: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        placeholder="+1 234 567 8900"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Country *</label>
                      <select
                        value={applyForm.country}
                        onChange={(e) => setApplyForm((f) => ({ ...f, country: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      >
                        <option value="">Select country</option>
                        {['China', 'India', 'USA', 'Germany', 'Turkey', 'Brazil', 'Thailand', 'Vietnam', 'Kenya', 'Japan', 'South Korea', 'Mexico', 'Indonesia', 'UK', 'Italy'].map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Business Type</label>
                      <select
                        value={applyForm.businessType}
                        onChange={(e) => setApplyForm((f) => ({ ...f, businessType: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      >
                        <option value="">Select type</option>
                        <option value="Manufacturer">Manufacturer</option>
                        <option value="Trading Company">Trading Company</option>
                        <option value="Manufacturer & Trading">Manufacturer & Trading</option>
                        <option value="Agent">Agent</option>
                        <option value="Distributor">Distributor</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Years in Operation</label>
                      <input
                        type="number"
                        value={applyForm.yearsInOperation}
                        onChange={(e) => setApplyForm((f) => ({ ...f, yearsInOperation: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        placeholder="e.g. 10"
                        min="0"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Business Address</label>
                      <input
                        type="text"
                        value={applyForm.address}
                        onChange={(e) => setApplyForm((f) => ({ ...f, address: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        placeholder="Full business address"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                      <input
                        type="url"
                        value={applyForm.website}
                        onChange={(e) => setApplyForm((f) => ({ ...f, website: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        placeholder="https://www.yourcompany.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Company Description</label>
                      <textarea
                        value={applyForm.description}
                        onChange={(e) => setApplyForm((f) => ({ ...f, description: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        rows={3}
                        placeholder="Brief description of your business..."
                      />
                    </div>
                  </div>
                </div>

                {/* Documents to Submit */}
                <div className="bg-white rounded-xl shadow-sm border p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Required Documents</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Select which documents you can provide. More documents improve your verification score.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {documentTypes.map((doc) => (
                      <label
                        key={doc.value}
                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedDocuments.includes(doc.value)
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedDocuments.includes(doc.value)}
                          onChange={() => toggleDocument(doc.value)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">{doc.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Certifications */}
                <div className="bg-white rounded-xl shadow-sm border p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Certifications</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Select certifications your company holds. These will be verified during the process.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {certificationTypes.map((cert) => (
                      <label
                        key={cert.value}
                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedCertifications.includes(cert.value)
                            ? 'border-green-500 bg-green-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedCertifications.includes(cert.value)}
                          onChange={() => toggleCertification(cert.value)}
                          className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                        />
                        <span className="text-sm text-gray-700">{cert.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Submit */}
                <div className="flex justify-end gap-4">
                  <button
                    onClick={() => setActiveTab('levels')}
                    className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium text-sm"
                  >
                    Back to Levels
                  </button>
                  <button
                    onClick={handleApplySubmit}
                    disabled={!applyForm.companyName || !applyForm.email || !applyForm.country}
                    className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm"
                  >
                    Submit Application
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* ==================== VERIFICATION STATUS ==================== */}
        {activeTab === 'status' && (
          <div className="space-y-6">
            {/* Lookup */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Check Verification Status</h3>
              <div className="flex gap-4">
                <input
                  type="text"
                  value={statusSupplierId}
                  onChange={(e) => setStatusSupplierId(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  placeholder="Enter Supplier ID or Company Name"
                />
                <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
                  Look Up
                </button>
              </div>
            </div>

            {/* Verification Process Timeline */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Verification Process</h3>
              <div className="relative">
                <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200" />
                {[
                  { step: 1, title: 'Application Submitted', description: 'Your application and company details have been received.', status: 'completed', time: '~1 day' },
                  { step: 2, title: 'Document Review', description: 'Our team verifies all submitted business documents and certifications.', status: 'completed', time: '2-3 days' },
                  { step: 3, title: 'Background Check', description: 'Company registration, financial standing, and legal compliance are checked.', status: 'in_progress', time: '3-5 days' },
                  { step: 4, title: 'Factory Audit', description: 'On-site or virtual audit of manufacturing facilities and quality systems.', status: 'pending', time: '5-10 days' },
                  { step: 5, title: 'Final Review', description: 'Compliance team reviews all findings and makes a verification decision.', status: 'pending', time: '1-2 days' },
                  { step: 6, title: 'Badge Assigned', description: 'Verification badge is assigned based on overall score and compliance level.', status: 'pending', time: 'Same day' },
                ].map((step) => (
                  <div key={step.step} className="relative flex items-start gap-4 pb-8 last:pb-0">
                    <div className={`relative z-10 w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold ${
                      step.status === 'completed'
                        ? 'bg-green-500 text-white'
                        : step.status === 'in_progress'
                        ? 'bg-blue-500 text-white animate-pulse'
                        : 'bg-gray-200 text-gray-500'
                    }`}>
                      {step.status === 'completed' ? '\u2713' : step.step}
                    </div>
                    <div className="flex-1 pt-1">
                      <div className="flex items-center gap-3">
                        <h4 className="font-medium text-gray-900">{step.title}</h4>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          step.status === 'completed' ? 'bg-green-100 text-green-700' :
                          step.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-500'
                        }`}>
                          {step.status === 'completed' ? 'Completed' : step.status === 'in_progress' ? 'In Progress' : 'Pending'}
                        </span>
                        <span className="text-xs text-gray-400">{step.time}</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Current Badge Display */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Current Badge</h3>
              <div className="flex items-center gap-6">
                <div className="w-24 h-24 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center text-white text-4xl shadow-lg">
                  {'\u2605\u2605\u2605'}
                </div>
                <div>
                  <h4 className="text-xl font-bold text-gray-900">Gold Verified</h4>
                  <p className="text-gray-600">Highest verification tier - Premium supplier status</p>
                  <div className="mt-2 flex gap-2">
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">Active</span>
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">Expires: Dec 2026</span>
                  </div>
                </div>
              </div>

              {/* Score Breakdown */}
              <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                  { label: 'Overall Score', value: 97, color: 'bg-green-500' },
                  { label: 'Document Score', value: 100, color: 'bg-blue-500' },
                  { label: 'Audit Score', value: 95, color: 'bg-purple-500' },
                  { label: 'Compliance', value: 98, color: 'bg-teal-500' },
                ].map((item) => (
                  <div key={item.label} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-600">{item.label}</span>
                      <span className="text-sm font-bold text-gray-900">{item.value}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className={`${item.color} h-2 rounded-full`} style={{ width: `${item.value}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Verification Activity */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
              <div className="space-y-3">
                {[
                  { date: '2026-01-28', event: 'Annual recertification audit scheduled', type: 'info' },
                  { date: '2026-01-20', event: 'ISO 14001 certification renewed', type: 'success' },
                  { date: '2026-01-15', event: 'Bank statement document verified', type: 'success' },
                  { date: '2026-01-10', event: 'Compliance score updated: 98%', type: 'info' },
                  { date: '2025-12-20', event: 'Gold badge renewed for 2026', type: 'success' },
                  { date: '2025-12-15', event: 'Factory audit completed - Score: 95/100', type: 'success' },
                  { date: '2025-12-01', event: 'New tax certificate uploaded', type: 'info' },
                ].map((activity, idx) => (
                  <div key={idx} className="flex items-center gap-3 py-2 border-b last:border-0">
                    <span className={`w-2 h-2 rounded-full ${
                      activity.type === 'success' ? 'bg-green-500' : 'bg-blue-500'
                    }`} />
                    <span className="text-xs text-gray-400 w-24">{activity.date}</span>
                    <span className="text-sm text-gray-700">{activity.event}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ==================== VERIFIED SUPPLIER DIRECTORY ==================== */}
        {activeTab === 'directory' && (
          <div className="space-y-6">
            {/* Filters */}
            <div className="bg-white rounded-xl shadow-sm border p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <input
                    type="text"
                    value={dirSearch}
                    onChange={(e) => setDirSearch(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    placeholder="Search suppliers by name, specialty, or country..."
                  />
                </div>
                <select
                  value={dirBadgeFilter}
                  onChange={(e) => setDirBadgeFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="all">All Badges</option>
                  <option value="gold">Gold</option>
                  <option value="silver">Silver</option>
                  <option value="bronze">Bronze</option>
                  <option value="none">Unverified</option>
                </select>
                <select
                  value={dirCountryFilter}
                  onChange={(e) => setDirCountryFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="all">All Countries</option>
                  {uniqueCountries.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <select
                  value={dirSort}
                  onChange={(e) => setDirSort(e.target.value as typeof dirSort)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="score">Sort by Score</option>
                  <option value="name">Sort by Name</option>
                  <option value="orders">Sort by Orders</option>
                </select>
              </div>
            </div>

            {/* Results Count */}
            <div className="text-sm text-gray-500">
              Showing {filteredSuppliers.length} of {mockSuppliers.length} suppliers
            </div>

            {/* Supplier Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredSuppliers.map((supplier) => {
                const badge = getBadgeDisplay(supplier.badge)
                return (
                  <div
                    key={supplier.id}
                    className="bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900">{supplier.companyName}</h3>
                        <p className="text-sm text-gray-500">
                          {supplier.country} &middot; {supplier.businessType} &middot; {supplier.yearsInOperation} yrs
                        </p>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${badge.color}`}>
                        {badge.icon} {badge.label}
                      </span>
                    </div>

                    {/* Score Bar */}
                    <div className="mb-3">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-gray-500">Verification Score</span>
                        <span className="text-xs font-bold text-gray-900">{supplier.verificationScore}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            supplier.verificationScore >= 90
                              ? 'bg-green-500'
                              : supplier.verificationScore >= 75
                              ? 'bg-blue-500'
                              : supplier.verificationScore >= 60
                              ? 'bg-yellow-500'
                              : 'bg-red-500'
                          }`}
                          style={{ width: `${supplier.verificationScore}%` }}
                        />
                      </div>
                    </div>

                    {/* Specialties */}
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {supplier.specialties.map((s) => (
                        <span key={s} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                          {s}
                        </span>
                      ))}
                    </div>

                    {/* Certifications */}
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {supplier.certifications.map((c) => (
                        <span key={c} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-medium">
                          {c}
                        </span>
                      ))}
                    </div>

                    {/* Metrics */}
                    <div className="grid grid-cols-4 gap-2 pt-3 border-t">
                      <div className="text-center">
                        <div className="text-sm font-bold text-gray-900">{supplier.documentsVerified}</div>
                        <div className="text-xs text-gray-500">Docs</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-bold text-gray-900">{supplier.totalOrders.toLocaleString()}</div>
                        <div className="text-xs text-gray-500">Orders</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-bold text-gray-900">{supplier.responseTime}d</div>
                        <div className="text-xs text-gray-500">Response</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-bold text-gray-900">
                          <span className={`${getStatusColor(supplier.overallStatus)} px-1.5 py-0.5 rounded text-xs`}>
                            {supplier.overallStatus}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500">Status</div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 mt-4">
                      <button className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
                        Contact Supplier
                      </button>
                      <button className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm">
                        View Profile
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>

            {filteredSuppliers.length === 0 && (
              <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
                <p className="text-gray-500">No suppliers found matching your criteria.</p>
                <button
                  onClick={() => { setDirSearch(''); setDirBadgeFilter('all'); setDirCountryFilter('all') }}
                  className="mt-4 text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
