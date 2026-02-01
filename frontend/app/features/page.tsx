'use client'

import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  FileSpreadsheet, FileText, DollarSign, Search, FolderOpen, ShieldCheck,
  ClipboardCheck, Scale, Lock, Sparkles, Video, Users, Building2, CreditCard,
  FileCheck, Globe, Calculator, Warehouse, Truck, FileQuestion, Code, Tag,
  Gift, TrendingUp, BarChart3, Languages, Leaf, FileSignature, UsersRound,
  Smartphone, CheckCircle2, ArrowRight
} from 'lucide-react'

interface Feature {
  id: string
  title: string
  description: string
  icon: any
  href: string
  status: 'live' | 'beta'
  category: 'core' | 'finance' | 'logistics' | 'analytics' | 'tools'
}

const features: Feature[] = [
  // Core B2B
  { id: '1', title: 'Bulk Order Import/Export', description: 'CSV upload for mass ordering', icon: FileSpreadsheet, href: '/bulk-order', status: 'live', category: 'core' },
  { id: '2', title: 'Purchase Order Management', description: 'Create and track POs', icon: FileText, href: '/purchase-orders', status: 'live', category: 'core' },
  { id: '3', title: 'Document Management', description: 'Invoices, certificates, contracts', icon: FolderOpen, href: '/documents', status: 'live', category: 'core' },
  { id: '4', title: 'Advanced Bulk Pricing', description: 'Tiered pricing builder', icon: DollarSign, href: '/vendor/pricing', status: 'live', category: 'core' },
  { id: '5', title: 'Product Sourcing Requests', description: 'Buyers post requirements', icon: Search, href: '/sourcing', status: 'live', category: 'core' },

  // Trust & Verification
  { id: '6', title: 'Supplier Verification', description: 'Third-party verification', icon: ShieldCheck, href: '/verification', status: 'live', category: 'core' },
  { id: '7', title: 'Quality Inspection', description: 'Book QC services', icon: ClipboardCheck, href: '/quality-inspection', status: 'live', category: 'core' },
  { id: '8', title: 'Dispute Resolution', description: 'Mediation system', icon: Scale, href: '/disputes', status: 'live', category: 'core' },
  { id: '9', title: 'Escrow Payment', description: 'Secure payment holding', icon: Lock, href: '/escrow', status: 'live', category: 'finance' },

  // Discovery
  { id: '10', title: 'Smart Recommendations', description: 'AI-powered matching', icon: Sparkles, href: '/recommendations', status: 'live', category: 'tools' },
  { id: '11', title: 'Virtual Trade Shows', description: 'Online exhibitions', icon: Video, href: '/trade-shows', status: 'live', category: 'core' },
  { id: '12', title: 'Live Video Chat', description: 'Supplier video calls', icon: Video, href: '/video-chat', status: 'beta', category: 'tools' },
  { id: '13', title: 'Supplier Directory', description: 'Advanced search', icon: Building2, href: '/vendors', status: 'live', category: 'core' },

  // Financial
  { id: '14', title: 'Trade Finance', description: 'Payment plans & credit', icon: CreditCard, href: '/trade-finance', status: 'live', category: 'finance' },
  { id: '15', title: 'Letter of Credit', description: 'L/C management', icon: FileCheck, href: '/letter-of-credit', status: 'live', category: 'finance' },
  { id: '16', title: 'Multi-Currency', description: 'Real-time exchange', icon: Globe, href: '/currency', status: 'live', category: 'finance' },
  { id: '17', title: 'Tax & Duty Calculator', description: 'Import duty estimation', icon: Calculator, href: '/tools/tax-calculator', status: 'live', category: 'logistics' },

  // Logistics
  { id: '18', title: 'Warehouse Management', description: 'Inventory storage', icon: Warehouse, href: '/warehouse', status: 'live', category: 'logistics' },
  { id: '19', title: 'Freight Forwarding', description: 'Shipping integration', icon: Truck, href: '/freight', status: 'live', category: 'logistics' },
  { id: '20', title: 'Customs Clearance', description: 'Document helper', icon: FileQuestion, href: '/customs', status: 'live', category: 'logistics' },

  // Advanced
  { id: '21', title: 'API & Developer Tools', description: 'REST API access', icon: Code, href: '/developer', status: 'beta', category: 'tools' },
  { id: '22', title: 'White-Label/OEM', description: 'Custom branding', icon: Tag, href: '/oem-services', status: 'live', category: 'core' },
  { id: '23', title: 'Loyalty & Rewards', description: 'Points system', icon: Gift, href: '/rewards', status: 'live', category: 'tools' },
  { id: '24', title: 'Affiliate Program', description: 'Referral tracking', icon: Users, href: '/affiliate', status: 'live', category: 'tools' },
  { id: '25', title: 'Advanced Analytics', description: 'Business intelligence', icon: BarChart3, href: '/analytics', status: 'live', category: 'analytics' },
  { id: '26', title: 'Multi-language', description: 'Global support', icon: Languages, href: '/settings/language', status: 'live', category: 'tools' },
  { id: '27', title: 'Sustainability Center', description: 'Eco-friendly focus', icon: Leaf, href: '/sustainability', status: 'live', category: 'core' },
  { id: '28', title: 'Contract Templates', description: 'E-signatures', icon: FileSignature, href: '/contracts', status: 'live', category: 'core' },
  { id: '29', title: 'Team Collaboration', description: 'Shared accounts', icon: UsersRound, href: '/team', status: 'live', category: 'tools' },
  { id: '30', title: 'Mobile App', description: 'iOS & Android', icon: Smartphone, href: '/mobile', status: 'beta', category: 'tools' },
]

export default function FeaturesPage() {
  const categories = {
    core: features.filter(f => f.category === 'core'),
    finance: features.filter(f => f.category === 'finance'),
    logistics: features.filter(f => f.category === 'logistics'),
    analytics: features.filter(f => f.category === 'analytics'),
    tools: features.filter(f => f.category === 'tools'),
  }

  const liveCount = features.filter(f => f.status === 'live').length
  const betaCount = features.filter(f => f.status === 'beta').length

  return (
    <div className="container py-8">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold font-display mb-4">
          All 30 B2B Features
        </h1>
        <p className="text-lg text-muted-foreground mb-6">
          Complete enterprise marketplace functionality
        </p>
        <div className="flex items-center justify-center gap-4">
          <Badge className="bg-green-600 text-lg py-2 px-4">
            <CheckCircle2 className="h-5 w-5 mr-2" />
            {liveCount} Features Live
          </Badge>
          {betaCount > 0 && (
            <Badge variant="outline" className="text-lg py-2 px-4">
              {betaCount} in Beta
            </Badge>
          )}
        </div>
      </div>

      {/* Categories */}
      <div className="space-y-12">
        {/* Core B2B */}
        <section>
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Building2 className="h-6 w-6 text-primary" />
            Core B2B Features
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.core.map((feature) => (
              <FeatureCard key={feature.id} feature={feature} />
            ))}
          </div>
        </section>

        {/* Financial */}
        <section>
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <CreditCard className="h-6 w-6 text-primary" />
            Financial Services
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.finance.map((feature) => (
              <FeatureCard key={feature.id} feature={feature} />
            ))}
          </div>
        </section>

        {/* Logistics */}
        <section>
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Truck className="h-6 w-6 text-primary" />
            Logistics & Shipping
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.logistics.map((feature) => (
              <FeatureCard key={feature.id} feature={feature} />
            ))}
          </div>
        </section>

        {/* Analytics */}
        <section>
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" />
            Analytics & Insights
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.analytics.map((feature) => (
              <FeatureCard key={feature.id} feature={feature} />
            ))}
          </div>
        </section>

        {/* Tools */}
        <section>
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-primary" />
            Tools & Integrations
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.tools.map((feature) => (
              <FeatureCard key={feature.id} feature={feature} />
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}

function FeatureCard({ feature }: { feature: Feature }) {
  const Icon = feature.icon

  return (
    <Card className="p-6 hover:border-primary/50 transition-all hover:shadow-lg group">
      <div className="flex items-start justify-between mb-4">
        <div className="p-3 bg-primary/10 rounded-lg">
          <Icon className="h-6 w-6 text-primary" />
        </div>
        <Badge className={feature.status === 'live' ? 'bg-green-600' : 'bg-blue-600'}>
          {feature.status}
        </Badge>
      </div>

      <h3 className="font-bold text-lg mb-2">{feature.title}</h3>
      <p className="text-sm text-muted-foreground mb-4">{feature.description}</p>

      <Button asChild variant="outline" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
        <Link href={feature.href}>
          Access Feature
          <ArrowRight className="h-4 w-4 ml-2" />
        </Link>
      </Button>
    </Card>
  )
}
