'use client'

import * as React from 'react'
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  CreditCard,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  RefreshCw,
  Calendar,
  CheckCircle,
  Clock,
  XCircle,
  Search,
  Filter,
  Eye,
  Plus,
  Trash2,
  Star,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
// Dropdown imports removed - using inline buttons instead
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { formatPrice, formatNumber, formatRelativeTime } from '@/lib/utils'
import { dashboardAPI, financeAPI } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from 'recharts'

interface Payout {
  id: string
  vendor_name: string
  amount: number
  status: 'pending' | 'processing' | 'completed' | 'failed'
  method: string
  requested_at: string
  processed_at?: string
}

interface Transaction {
  id: string
  type: 'order' | 'refund' | 'payout' | 'commission'
  description: string
  amount: number
  status: string
  date: string
}

interface SellerPlan {
  id: string
  name: string
  description: string
  commission_rate: number
  features: string[]
  is_popular: boolean
}

function SellerPlansManager() {
  const { toast } = useToast()
  const [plans, setPlans] = React.useState<SellerPlan[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [isSaving, setIsSaving] = React.useState(false)
  const [newFeature, setNewFeature] = React.useState<Record<string, string>>({})

  React.useEffect(() => {
    const fetch = async () => {
      try {
        const data = await financeAPI.getSellerPlans()
        if (Array.isArray(data)) setPlans(data)
      } catch {
        // defaults
      } finally {
        setIsLoading(false)
      }
    }
    fetch()
  }, [])

  const updatePlan = (index: number, field: keyof SellerPlan, value: any) => {
    setPlans(prev => prev.map((p, i) => i === index ? { ...p, [field]: value } : p))
  }

  const addFeature = (planIndex: number) => {
    const text = newFeature[planIndex] || ''
    if (!text.trim()) return
    setPlans(prev => prev.map((p, i) => i === planIndex ? { ...p, features: [...p.features, text.trim()] } : p))
    setNewFeature(prev => ({ ...prev, [planIndex]: '' }))
  }

  const removeFeature = (planIndex: number, featureIndex: number) => {
    setPlans(prev => prev.map((p, i) => i === planIndex ? { ...p, features: p.features.filter((_, fi) => fi !== featureIndex) } : p))
  }

  const setPopular = (planIndex: number) => {
    setPlans(prev => prev.map((p, i) => ({ ...p, is_popular: i === planIndex })))
  }

  const addPlan = () => {
    const id = `plan_${Date.now()}`
    setPlans(prev => [...prev, { id, name: 'New Plan', description: '', commission_rate: 10, features: [], is_popular: false }])
  }

  const removePlan = (index: number) => {
    setPlans(prev => prev.filter((_, i) => i !== index))
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await financeAPI.updateSellerPlans(plans)
      toast({ title: 'Saved', description: 'Seller plans updated successfully' })
    } catch {
      toast({ title: 'Error', description: 'Failed to save seller plans', variant: 'destructive' })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return <Card><CardContent className="p-6"><Skeleton className="h-60 w-full" /></CardContent></Card>
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Seller Plans</CardTitle>
            <CardDescription>Manage the plans displayed on the &quot;Sell on Channah&quot; page</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={addPlan}>
              <Plus className="h-4 w-4 mr-2" /> Add Plan
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save All Plans'}
            </Button>
          </div>
        </CardHeader>
      </Card>

      {plans.map((plan, planIndex) => (
        <Card key={plan.id} className={plan.is_popular ? 'border-primary/50 border-2' : ''}>
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div className="flex-1 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Plan Name</Label>
                  <Input
                    value={plan.name}
                    onChange={(e) => updatePlan(planIndex, 'name', e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Commission Rate (%)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    value={plan.commission_rate}
                    onChange={(e) => updatePlan(planIndex, 'commission_rate', parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Description</Label>
                <Input
                  value={plan.description}
                  onChange={(e) => updatePlan(planIndex, 'description', e.target.value)}
                />
              </div>
            </div>
            <div className="flex flex-col gap-2 items-end">
              <Button
                variant={plan.is_popular ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPopular(planIndex)}
              >
                <Star className={`h-4 w-4 mr-1 ${plan.is_popular ? 'fill-current' : ''}`} />
                {plan.is_popular ? 'Popular' : 'Set Popular'}
              </Button>
              {plans.length > 1 && (
                <Button variant="ghost" size="sm" className="text-destructive" onClick={() => removePlan(planIndex)}>
                  <Trash2 className="h-4 w-4 mr-1" /> Remove
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <Label className="text-xs text-muted-foreground mb-2 block">Features</Label>
            <div className="space-y-2">
              {plan.features.map((feature, fi) => (
                <div key={fi} className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                  <span className="flex-1 text-sm">{feature}</span>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeFeature(planIndex, fi)}>
                    <XCircle className="h-3 w-3 text-muted-foreground" />
                  </Button>
                </div>
              ))}
              <div className="flex gap-2 mt-2">
                <Input
                  placeholder="Add a feature..."
                  value={newFeature[planIndex] || ''}
                  onChange={(e) => setNewFeature(prev => ({ ...prev, [planIndex]: e.target.value }))}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addFeature(planIndex) } }}
                  className="text-sm"
                />
                <Button variant="outline" size="sm" onClick={() => addFeature(planIndex)}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function CommissionSettings() {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = React.useState(true)
  const [isSaving, setIsSaving] = React.useState(false)
  const [commissionRate, setCommissionRate] = React.useState('10')
  const [minPayout, setMinPayout] = React.useState('10')
  const [payoutSchedule, setPayoutSchedule] = React.useState('weekly')

  React.useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await financeAPI.getCommissionSettings()
        setCommissionRate(String(data.commission_rate ?? 10))
        setMinPayout(String(data.min_payout_amount ?? 10))
        setPayoutSchedule(data.payout_schedule ?? 'weekly')
      } catch {
        // defaults are fine
      } finally {
        setIsLoading(false)
      }
    }
    fetchSettings()
  }, [])

  const handleSave = async () => {
    const rate = parseFloat(commissionRate)
    if (isNaN(rate) || rate < 0 || rate > 100) {
      toast({ title: 'Error', description: 'Commission rate must be between 0 and 100', variant: 'destructive' })
      return
    }
    setIsSaving(true)
    try {
      await financeAPI.updateCommissionSettings({
        commission_rate: rate,
        min_payout_amount: parseFloat(minPayout) || 10,
        payout_schedule: payoutSchedule,
      })
      toast({ title: 'Saved', description: 'Commission settings updated successfully' })
    } catch {
      toast({ title: 'Error', description: 'Failed to save settings', variant: 'destructive' })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return <Card><CardContent className="p-6"><Skeleton className="h-40 w-full" /></CardContent></Card>
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Commission Settings</CardTitle>
        <CardDescription>Configure the platform commission rate applied to all sales</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6 max-w-md">
          <div className="space-y-2">
            <Label htmlFor="commission-rate">Default Commission Rate (%)</Label>
            <div className="flex items-center gap-2">
              <Input
                id="commission-rate"
                type="number"
                min="0"
                max="100"
                step="0.5"
                value={commissionRate}
                onChange={(e) => setCommissionRate(e.target.value)}
                className="w-32"
              />
              <span className="text-muted-foreground">%</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Applied to new vendors. Existing vendors keep their current rate unless changed individually.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="min-payout">Minimum Payout Amount ($)</Label>
            <div className="flex items-center gap-2">
              <Input
                id="min-payout"
                type="number"
                min="1"
                step="1"
                value={minPayout}
                onChange={(e) => setMinPayout(e.target.value)}
                className="w-32"
              />
              <span className="text-muted-foreground">USD</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="payout-schedule">Payout Schedule</Label>
            <Select value={payoutSchedule} onValueChange={setPayoutSchedule}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="biweekly">Bi-weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default function FinancePage() {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = React.useState(true)
  const [period, setPeriod] = React.useState('30d')
  const [payoutStatus, setPayoutStatus] = React.useState('all')
  const [searchQuery, setSearchQuery] = React.useState('')
  const [stats, setStats] = React.useState<any>(null)
  const [revenueData, setRevenueData] = React.useState<any[]>([])

  const [payouts, setPayouts] = React.useState<Payout[]>([])
  const [transactions, setTransactions] = React.useState<Transaction[]>([])
  const [selectedPayout, setSelectedPayout] = React.useState<Payout | null>(null)
  const [detailDialogOpen, setDetailDialogOpen] = React.useState(false)
  const [rejectDialogOpen, setRejectDialogOpen] = React.useState(false)
  const [rejectReason, setRejectReason] = React.useState('')
  const [isProcessing, setIsProcessing] = React.useState(false)

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const days = period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : 365
        const [statsRes, revenueRes, payoutsRes, transactionsRes] = await Promise.allSettled([
          dashboardAPI.getKPIs(),
          dashboardAPI.getRevenueChart(days),
          financeAPI.getPayouts(),
          financeAPI.getTransactions(),
        ])

        if (statsRes.status === 'fulfilled') {
          setStats(statsRes.value)
        }
        if (revenueRes.status === 'fulfilled') {
          const chartData = Array.isArray(revenueRes.value) ? revenueRes.value : revenueRes.value?.data || []
          setRevenueData(chartData)
        }
        if (payoutsRes.status === 'fulfilled') {
          const payoutList = Array.isArray(payoutsRes.value) ? payoutsRes.value : payoutsRes.value?.payouts || payoutsRes.value?.items || []
          setPayouts(payoutList)
        }
        if (transactionsRes.status === 'fulfilled') {
          const txList = Array.isArray(transactionsRes.value) ? transactionsRes.value : transactionsRes.value?.transactions || transactionsRes.value?.items || []
          setTransactions(txList)
        }
      } catch (error) {
        console.error('Failed to fetch finance data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [period])

  const getPayoutStatusBadge = (status: Payout['status']) => {
    switch (status) {
      case 'pending':
        return <Badge variant="warning"><Clock className="mr-1 h-3 w-3" />Pending</Badge>
      case 'processing':
        return <Badge variant="info"><RefreshCw className="mr-1 h-3 w-3" />Processing</Badge>
      case 'completed':
        return <Badge variant="success"><CheckCircle className="mr-1 h-3 w-3" />Completed</Badge>
      case 'failed':
        return <Badge variant="destructive"><XCircle className="mr-1 h-3 w-3" />Failed</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  const handleProcessPayout = async (payout: Payout) => {
    setIsProcessing(true)
    try {
      await financeAPI.processPayout(payout.id)
      setPayouts(prev => prev.map(p => p.id === payout.id ? { ...p, status: 'completed' as const } : p))
      toast({ title: 'Payout processed', description: `${formatPrice(payout.amount, 'USD')} to ${payout.vendor_name}` })
    } catch (error: any) {
      toast({ title: 'Error', description: error?.response?.data?.detail || 'Failed to process payout', variant: 'destructive' })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleRejectPayout = async () => {
    if (!selectedPayout) return
    setIsProcessing(true)
    try {
      await financeAPI.rejectPayout(selectedPayout.id, rejectReason || 'Rejected by admin')
      setPayouts(prev => prev.map(p => p.id === selectedPayout.id ? { ...p, status: 'failed' as const } : p))
      toast({ title: 'Payout rejected', description: `Balance refunded to ${selectedPayout.vendor_name}` })
      setRejectDialogOpen(false)
      setRejectReason('')
      setSelectedPayout(null)
    } catch (error: any) {
      toast({ title: 'Error', description: error?.response?.data?.detail || 'Failed to reject payout', variant: 'destructive' })
    } finally {
      setIsProcessing(false)
    }
  }

  const filteredPayouts = payouts.filter(p => {
    if (payoutStatus !== 'all' && p.status !== payoutStatus) return false
    if (searchQuery && !p.vendor_name.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-[400px] rounded-xl" />
      </div>
    )
  }

  const financeMetrics = [
    {
      title: 'Total Revenue',
      value: formatPrice(stats?.total_revenue || 0, 'USD'),
      change: 12.5,
      trend: 'up',
      icon: DollarSign,
      color: 'text-success',
    },
    {
      title: 'Platform Commission',
      value: formatPrice((stats?.total_revenue || 0) * 0.1, 'USD'),
      change: 8.3,
      trend: 'up',
      icon: TrendingUp,
      color: 'text-primary',
    },
    {
      title: 'Pending Payouts',
      value: formatPrice(payouts.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0), 'USD'),
      change: -5.2,
      trend: 'down',
      icon: Wallet,
      color: 'text-warning',
    },
    {
      title: 'Processed This Month',
      value: formatPrice(payouts.filter(p => p.status === 'completed').reduce((sum, p) => sum + p.amount, 0), 'USD'),
      change: 15.8,
      trend: 'up',
      icon: CreditCard,
      color: 'text-info',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display">Finance</h1>
          <p className="text-muted-foreground">
            Revenue, payouts, and financial management
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[140px]">
              <Calendar className="mr-2 h-4 w-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {financeMetrics.map((metric) => (
          <Card key={metric.title} className="card-hover">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {metric.title}
              </CardTitle>
              <div className={`h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center ${metric.color}`}>
                <metric.icon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value}</div>
              <div className="flex items-center gap-1 mt-1">
                {metric.trend === 'up' ? (
                  <ArrowUpRight className="h-4 w-4 text-success" />
                ) : (
                  <ArrowDownRight className="h-4 w-4 text-destructive" />
                )}
                <span
                  className={`text-sm font-medium ${
                    metric.trend === 'up' ? 'text-success' : 'text-destructive'
                  }`}
                >
                  {metric.change > 0 ? '+' : ''}
                  {metric.change}%
                </span>
                <span className="text-sm text-muted-foreground">vs last period</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="payouts">Payouts</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="commissions">Commissions</TabsTrigger>
          <TabsTrigger value="seller-plans">Seller Plans</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Revenue vs Commission</CardTitle>
                <CardDescription>Platform earnings breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={revenueData.slice(-14)}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis
                        dataKey="date"
                        tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { day: 'numeric' })}
                        className="text-xs"
                      />
                      <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} className="text-xs" />
                      <Tooltip
                        formatter={(value: number, name: string) => [formatPrice(value, 'USD'), name === 'revenue' ? 'Revenue' : 'Commission']}
                        labelFormatter={(label) => new Date(label).toLocaleDateString()}
                      />
                      <Legend />
                      <Bar dataKey="revenue" name="Revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
                      <Bar dataKey={(d: any) => d.revenue * 0.1} name="Commission" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Payout Status</CardTitle>
                <CardDescription>Current payout queue status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {[
                    { status: 'Pending', count: payouts.filter(p => p.status === 'pending').length, amount: payouts.filter(p => p.status === 'pending').reduce((s, p) => s + p.amount, 0), color: 'bg-warning' },
                    { status: 'Processing', count: payouts.filter(p => p.status === 'processing').length, amount: payouts.filter(p => p.status === 'processing').reduce((s, p) => s + p.amount, 0), color: 'bg-info' },
                    { status: 'Completed', count: payouts.filter(p => p.status === 'completed').length, amount: payouts.filter(p => p.status === 'completed').reduce((s, p) => s + p.amount, 0), color: 'bg-success' },
                    { status: 'Failed', count: payouts.filter(p => p.status === 'failed').length, amount: payouts.filter(p => p.status === 'failed').reduce((s, p) => s + p.amount, 0), color: 'bg-destructive' },
                  ].map((item) => (
                    <div key={item.status} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`h-3 w-3 rounded-full ${item.color}`} />
                        <div>
                          <p className="font-medium">{item.status}</p>
                          <p className="text-sm text-muted-foreground">{item.count} payouts</p>
                        </div>
                      </div>
                      <p className="font-bold">{formatPrice(item.amount, 'USD')}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="payouts">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle>Vendor Payouts</CardTitle>
                  <CardDescription>Manage vendor payout requests</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search vendors..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 w-[200px]"
                    />
                  </div>
                  <Select value={payoutStatus} onValueChange={setPayoutStatus}>
                    <SelectTrigger className="w-[140px]">
                      <Filter className="mr-2 h-4 w-4" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="processing">Processing</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Requested</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayouts.map((payout) => (
                    <TableRow key={payout.id}>
                      <TableCell className="font-medium">{payout.vendor_name}</TableCell>
                      <TableCell className="font-bold">{formatPrice(payout.amount, 'USD')}</TableCell>
                      <TableCell>{payout.method}</TableCell>
                      <TableCell>{getPayoutStatusBadge(payout.status)}</TableCell>
                      <TableCell>{formatRelativeTime(payout.requested_at)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => { setSelectedPayout(payout); setDetailDialogOpen(true) }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {payout.status === 'pending' && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                onClick={() => handleProcessPayout(payout)}
                                disabled={isProcessing}
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={() => { setSelectedPayout(payout); setRejectDialogOpen(true) }}
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions">
          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>All financial transactions on the platform</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell>
                        <Badge variant={tx.type === 'refund' || tx.type === 'payout' ? 'destructive' : 'success'}>
                          {tx.type}
                        </Badge>
                      </TableCell>
                      <TableCell>{tx.description}</TableCell>
                      <TableCell className={`font-bold ${tx.amount < 0 ? 'text-destructive' : 'text-success'}`}>
                        {tx.amount < 0 ? '-' : '+'}{formatPrice(Math.abs(tx.amount), 'USD')}
                      </TableCell>
                      <TableCell>
                        <Badge variant={tx.status === 'completed' ? 'success' : 'warning'}>
                          {tx.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatRelativeTime(tx.date)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="commissions">
          <CommissionSettings />
        </TabsContent>

        <TabsContent value="seller-plans">
          <SellerPlansManager />
        </TabsContent>
      </Tabs>

      {/* View Details Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Payout Details</DialogTitle>
            <DialogDescription>Payout request information</DialogDescription>
          </DialogHeader>
          {selectedPayout && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground text-xs">Vendor</Label>
                  <p className="font-medium">{selectedPayout.vendor_name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Amount</Label>
                  <p className="font-bold text-lg">{formatPrice(selectedPayout.amount, 'USD')}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Payment Method</Label>
                  <p className="font-medium capitalize">{selectedPayout.method?.replace('_', ' ')}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Status</Label>
                  <div className="mt-1">{getPayoutStatusBadge(selectedPayout.status)}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Requested</Label>
                  <p className="font-medium">{formatRelativeTime(selectedPayout.requested_at)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Processed</Label>
                  <p className="font-medium">{selectedPayout.processed_at ? formatRelativeTime(selectedPayout.processed_at) : '-'}</p>
                </div>
              </div>
              {selectedPayout.status === 'pending' && (
                <DialogFooter>
                  <Button variant="outline" onClick={() => { setDetailDialogOpen(false); setSelectedPayout(selectedPayout); setRejectDialogOpen(true) }}>
                    Reject
                  </Button>
                  <Button onClick={() => { setDetailDialogOpen(false); handleProcessPayout(selectedPayout) }} disabled={isProcessing}>
                    Process Payout
                  </Button>
                </DialogFooter>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={(open) => { setRejectDialogOpen(open); if (!open) { setRejectReason(''); setSelectedPayout(null) } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Payout</DialogTitle>
            <DialogDescription>
              Reject payout of {selectedPayout ? formatPrice(selectedPayout.amount, 'USD') : ''} to {selectedPayout?.vendor_name}. The amount will be refunded to the vendor&apos;s balance.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-4">
            <Label htmlFor="reason">Reason for rejection</Label>
            <Textarea
              id="reason"
              placeholder="Enter reason for rejection (optional)"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleRejectPayout} disabled={isProcessing}>
              {isProcessing ? 'Rejecting...' : 'Reject Payout'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
