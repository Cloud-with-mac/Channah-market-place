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
  MoreVertical,
  Eye,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { formatPrice, formatNumber, formatRelativeTime } from '@/lib/utils'
import { dashboardAPI } from '@/lib/api'
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

export default function FinancePage() {
  const [isLoading, setIsLoading] = React.useState(true)
  const [period, setPeriod] = React.useState('30d')
  const [payoutStatus, setPayoutStatus] = React.useState('all')
  const [searchQuery, setSearchQuery] = React.useState('')
  const [stats, setStats] = React.useState<any>(null)
  const [revenueData, setRevenueData] = React.useState<any[]>([])

  // Sample payouts data
  const [payouts] = React.useState<Payout[]>([
    { id: '1', vendor_name: 'TechStore Pro', amount: 2450.00, status: 'pending', method: 'Bank Transfer', requested_at: new Date().toISOString() },
    { id: '2', vendor_name: 'Fashion Hub', amount: 1890.50, status: 'processing', method: 'PayPal', requested_at: new Date(Date.now() - 86400000).toISOString() },
    { id: '3', vendor_name: 'Home Essentials', amount: 3200.00, status: 'completed', method: 'Bank Transfer', requested_at: new Date(Date.now() - 172800000).toISOString(), processed_at: new Date().toISOString() },
    { id: '4', vendor_name: 'Sports Zone', amount: 780.25, status: 'failed', method: 'Bank Transfer', requested_at: new Date(Date.now() - 259200000).toISOString() },
    { id: '5', vendor_name: 'Beauty Haven', amount: 1560.00, status: 'pending', method: 'Stripe', requested_at: new Date(Date.now() - 345600000).toISOString() },
  ])

  // Sample transactions
  const [transactions] = React.useState<Transaction[]>([
    { id: '1', type: 'order', description: 'Order #ORD-2024-0089', amount: 245.00, status: 'completed', date: new Date().toISOString() },
    { id: '2', type: 'commission', description: 'Commission from TechStore Pro', amount: 24.50, status: 'completed', date: new Date().toISOString() },
    { id: '3', type: 'refund', description: 'Refund for Order #ORD-2024-0078', amount: -89.99, status: 'completed', date: new Date(Date.now() - 86400000).toISOString() },
    { id: '4', type: 'payout', description: 'Payout to Fashion Hub', amount: -1890.50, status: 'processing', date: new Date(Date.now() - 172800000).toISOString() },
    { id: '5', type: 'order', description: 'Order #ORD-2024-0088', amount: 567.00, status: 'completed', date: new Date(Date.now() - 259200000).toISOString() },
  ])

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const days = period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : 365
        const [statsRes, revenueRes] = await Promise.allSettled([
          dashboardAPI.getKPIs(),
          dashboardAPI.getRevenueChart(days),
        ])

        if (statsRes.status === 'fulfilled') {
          setStats(statsRes.value.data)
        }
        if (revenueRes.status === 'fulfilled') {
          setRevenueData(revenueRes.value.data || [])
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
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            {payout.status === 'pending' && (
                              <>
                                <DropdownMenuItem>
                                  <CheckCircle className="mr-2 h-4 w-4" />
                                  Process Payout
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-destructive">
                                  <XCircle className="mr-2 h-4 w-4" />
                                  Reject
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
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
          <Card>
            <CardHeader>
              <CardTitle>Commission Settings</CardTitle>
              <CardDescription>Platform commission rates by vendor tier</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {[
                  { tier: 'Standard', rate: 10, description: 'Default rate for new vendors' },
                  { tier: 'Silver', rate: 8, description: 'Vendors with $5,000+ monthly sales' },
                  { tier: 'Gold', rate: 6, description: 'Vendors with $20,000+ monthly sales' },
                  { tier: 'Platinum', rate: 4, description: 'Vendors with $50,000+ monthly sales' },
                ].map((tier) => (
                  <div key={tier.tier} className="flex items-center justify-between p-4 rounded-lg border">
                    <div>
                      <p className="font-bold">{tier.tier}</p>
                      <p className="text-sm text-muted-foreground">{tier.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-primary">{tier.rate}%</p>
                      <p className="text-xs text-muted-foreground">commission</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
