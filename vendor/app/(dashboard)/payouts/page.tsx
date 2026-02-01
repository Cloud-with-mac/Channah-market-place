'use client'

import * as React from 'react'
import { Wallet, ArrowUpRight, Clock, CheckCircle, XCircle, Loader2 } from 'lucide-react'
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

interface Payout {
  id: string
  amount: number
  currency: string
  status: string
  payment_method: string
  created_at: string
  processed_at?: string
}

interface BalanceInfo {
  available_balance: number
  pending_balance: number
  total_paid: number
  total_earnings: number
}

export default function VendorPayoutsPage() {
  const { convertAndFormat } = useCurrencyStore()
  const [payouts, setPayouts] = React.useState<Payout[]>([])
  const [balance, setBalance] = React.useState<BalanceInfo | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [isRequesting, setIsRequesting] = React.useState(false)
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [payoutAmount, setPayoutAmount] = React.useState('')
  const [paymentMethod, setPaymentMethod] = React.useState('')

  const fetchData = async () => {
    try {
      const [payoutsRes, balanceRes] = await Promise.allSettled([
        vendorPayoutsAPI.list({ limit: 20 }),
        vendorPayoutsAPI.getBalance(),
      ])

      if (payoutsRes.status === 'fulfilled') {
        const data = payoutsRes.value
        setPayouts(Array.isArray(data) ? data : data?.results || [])
      }
      if (balanceRes.status === 'fulfilled') {
        setBalance(balanceRes.value)
      }
    } catch (error) {
      console.error('Failed to fetch payouts:', error)
    } finally {
      setIsLoading(false)
    }
  }

  React.useEffect(() => {
    fetchData()
  }, [])

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
    if (balance && amount > balance.available_balance) {
      toast.error('Amount exceeds available balance')
      return
    }

    setIsRequesting(true)
    try {
      await vendorPayoutsAPI.requestPayout(amount, paymentMethod)
      toast.success('Payout request submitted successfully')
      setDialogOpen(false)
      setPayoutAmount('')
      setPaymentMethod('')
      await fetchData()
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || 'Failed to request payout')
    } finally {
      setIsRequesting(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const configs: Record<string, { icon: React.ReactNode; className: string }> = {
      pending: { icon: <Clock className="h-3 w-3" />, className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
      processing: { icon: <Loader2 className="h-3 w-3 animate-spin" />, className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
      completed: { icon: <CheckCircle className="h-3 w-3" />, className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
      failed: { icon: <XCircle className="h-3 w-3" />, className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
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
      <div>
        <h1 className="text-2xl font-bold font-display">Payouts</h1>
        <p className="text-muted-foreground">Manage your earnings and payouts</p>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Available Balance</CardTitle>
                <Wallet className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">
                  {convertAndFormat(balance?.available_balance || 0)}
                </div>
                <p className="text-xs text-muted-foreground">Ready for payout</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Balance</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {convertAndFormat(balance?.pending_balance || 0)}
                </div>
                <p className="text-xs text-muted-foreground">Processing</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {convertAndFormat(balance?.total_paid || 0)}
                </div>
                <p className="text-xs text-muted-foreground">All time</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Payout History</CardTitle>
                <CardDescription>Your recent payout requests</CardDescription>
              </div>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button disabled={!balance?.available_balance || balance.available_balance <= 0}>
                    Request Payout
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Request Payout</DialogTitle>
                    <DialogDescription>
                      Available balance: {convertAndFormat(balance?.available_balance || 0)}. Minimum payout is $50.
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
                        max={balance?.available_balance || 0}
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
                      <TableHead>Processed</TableHead>
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
                          {payout.processed_at ? formatDateTime(payout.processed_at) : '-'}
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
