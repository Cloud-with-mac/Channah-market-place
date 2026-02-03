'use client'

import * as React from 'react'
import {
  Wallet,
  TrendingUp,
  Clock,
  DollarSign,
  Calendar,
  Download,
  CheckCircle,
  XCircle,
  Loader2,
  ArrowUpRight,
  Package,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { vendorPayoutsAPI } from '@/lib/api'
import { useCurrencyStore } from '@/store'
import { formatDateTime } from '@/lib/utils'
import { toast } from 'sonner'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

interface Payout {
  id: string
  amount: number
  currency: string
  status: string
  payment_method: string
  created_at: string
  paid_date?: string
}

interface Earnings {
  current_balance: number
  pending_balance: number
  lifetime_earnings: number
  this_month_earnings: number
  pending_orders_count: number
  pending_orders_value: number
}

export default function VendorEarningsPage() {
  const { convertAndFormat } = useCurrencyStore()
  const [payouts, setPayouts] = React.useState<Payout[]>([])
  const [earnings, setEarnings] = React.useState<Earnings | null>(null)
  const [earningsChart, setEarningsChart] = React.useState<any[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [isRequesting, setIsRequesting] = React.useState(false)
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [payoutAmount, setPayoutAmount] = React.useState('')
  const [paymentMethod, setPaymentMethod] = React.useState('bank_transfer')
  const [period, setPeriod] = React.useState('30')

  const fetchData = async () => {
    try {
      const [payoutsRes, earningsRes] = await Promise.allSettled([
        vendorPayoutsAPI.list({ limit: 20 }),
        vendorPayoutsAPI.getEarnings(),
      ])

      if (payoutsRes.status === 'fulfilled') {
        const data = payoutsRes.value
        setPayouts(Array.isArray(data) ? data : data?.results || [])
      }
      if (earningsRes.status === 'fulfilled') {
        setEarnings(earningsRes.value)
      }
    } catch (error) {
      console.error('Failed to fetch earnings data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  React.useEffect(() => {
    fetchData()
  }, [])

  React.useEffect(() => {
    // Generate mock chart data based on period
    const days = parseInt(period)
    const mockData = Array.from({ length: days }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - (days - i - 1))
      return {
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        earnings: Math.floor(Math.random() * 500) + 200,
      }
    })
    setEarningsChart(mockData)
  }, [period])

  const handleRequestPayout = async () => {
    const amount = parseFloat(payoutAmount)
    if (!amount || amount <= 0 || !paymentMethod) {
      toast.error('Please enter a valid amount and select a payment method')
      return
    }
    if (amount < 10) {
      toast.error('Minimum payout amount is $10')
      return
    }
    if (earnings && amount > earnings.current_balance) {
      toast.error('Amount exceeds available balance')
      return
    }

    setIsRequesting(true)
    try {
      await vendorPayoutsAPI.requestPayout(amount, paymentMethod)
      toast.success('Payout request submitted successfully')
      setDialogOpen(false)
      setPayoutAmount('')
      setPaymentMethod('bank_transfer')
      await fetchData()
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || 'Failed to request payout')
    } finally {
      setIsRequesting(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const configs: Record<string, { icon: React.ReactNode; className: string }> = {
      pending: {
        icon: <Clock className="h-3 w-3" />,
        className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      },
      processing: {
        icon: <Loader2 className="h-3 w-3 animate-spin" />,
        className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      },
      paid: {
        icon: <CheckCircle className="h-3 w-3" />,
        className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      },
      failed: {
        icon: <XCircle className="h-3 w-3" />,
        className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      },
    }
    const config = configs[status] || configs.pending
    return (
      <Badge variant="secondary" className={`gap-1 ${config.className}`}>
        {config.icon}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display">Earnings</h1>
          <p className="text-muted-foreground">Track your earnings and request payouts</p>
        </div>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export Report
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Available Balance</CardTitle>
                <Wallet className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">
                  {convertAndFormat(earnings?.current_balance || 0)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Ready for payout</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Balance</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{convertAndFormat(earnings?.pending_balance || 0)}</div>
                <p className="text-xs text-muted-foreground mt-1">Processing payouts</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">This Month</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {convertAndFormat(earnings?.this_month_earnings || 0)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  <span className="text-green-600 font-medium">+12.5%</span> from last month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Lifetime Earnings</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {convertAndFormat(earnings?.lifetime_earnings || 0)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">All time</p>
              </CardContent>
            </Card>
          </div>

          {/* Pending Orders Alert */}
          {earnings && earnings.pending_orders_count > 0 && (
            <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-900">
              <CardContent className="flex items-center gap-4 pt-6">
                <Package className="h-8 w-8 text-blue-600" />
                <div className="flex-1">
                  <p className="font-semibold">Pending Orders</p>
                  <p className="text-sm text-muted-foreground">
                    You have {earnings.pending_orders_count} delivered orders worth{' '}
                    {convertAndFormat(earnings.pending_orders_value)} waiting to be added to your
                    balance.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Earnings Chart */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Earnings Overview</CardTitle>
                  <CardDescription>Your earnings trend over time</CardDescription>
                </div>
                <Select value={period} onValueChange={setPeriod}>
                  <SelectTrigger className="w-[140px]">
                    <Calendar className="mr-2 h-4 w-4" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">Last 7 days</SelectItem>
                    <SelectItem value="30">Last 30 days</SelectItem>
                    <SelectItem value="90">Last 90 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={earningsChart}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip
                      formatter={(value: number) => [`$${value.toFixed(2)}`, 'Earnings']}
                      contentStyle={{
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="earnings"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={{ fill: 'hsl(var(--primary))' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Payout History */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Payout History</CardTitle>
                <CardDescription>Your recent payout requests</CardDescription>
              </div>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    disabled={!earnings?.current_balance || earnings.current_balance <= 0}
                  >
                    <ArrowUpRight className="h-4 w-4 mr-2" />
                    Request Payout
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Request Payout</DialogTitle>
                    <DialogDescription>
                      Available balance: {convertAndFormat(earnings?.current_balance || 0)}.
                      Minimum payout is $10.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="amount">Amount</Label>
                      <Input
                        id="amount"
                        type="number"
                        min="10"
                        step="0.01"
                        max={earnings?.current_balance || 0}
                        placeholder="Enter amount"
                        value={payoutAmount}
                        onChange={(e) => setPayoutAmount(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="method">Payment Method</Label>
                      <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select payment method" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                          <SelectItem value="paypal">PayPal</SelectItem>
                          <SelectItem value="stripe">Stripe</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleRequestPayout} disabled={isRequesting}>
                      {isRequesting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        'Submit Request'
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {payouts.length === 0 ? (
                <div className="text-center py-12">
                  <Wallet className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">No payouts yet</h3>
                  <p className="text-muted-foreground text-sm">
                    Request a payout when you have available balance
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Amount</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Requested</TableHead>
                      <TableHead>Paid</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payouts.map((payout) => (
                      <TableRow key={payout.id}>
                        <TableCell className="font-medium">
                          {convertAndFormat(payout.amount)}
                        </TableCell>
                        <TableCell className="capitalize">
                          {payout.payment_method?.replace('_', ' ') || '-'}
                        </TableCell>
                        <TableCell>{getStatusBadge(payout.status)}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDateTime(payout.created_at)}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {payout.paid_date ? formatDateTime(payout.paid_date) : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
