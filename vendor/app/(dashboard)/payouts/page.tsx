'use client'

import * as React from 'react'
import { Wallet, ArrowUpRight, Clock, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
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

interface Payout {
  id: string
  amount: number
  status: string
  created_at: string
  processed_at?: string
}

export default function VendorPayoutsPage() {
  const { convertAndFormat } = useCurrencyStore()
  const [payouts, setPayouts] = React.useState<Payout[]>([])
  const [balance, setBalance] = React.useState<any>(null)
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const [payoutsRes, balanceRes] = await Promise.allSettled([
          vendorPayoutsAPI.list({ limit: 20 }),
          vendorPayoutsAPI.getBalance(),
        ])

        if (payoutsRes.status === 'fulfilled') {
          setPayouts(payoutsRes.value.data?.results || payoutsRes.value.data || [])
        }
        if (balanceRes.status === 'fulfilled') {
          setBalance(balanceRes.value.data)
        }
      } catch (error) {
        console.error('Failed to fetch payouts:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleRequestPayout = async () => {
    try {
      await vendorPayoutsAPI.requestPayout()
      // Refresh data
      const balanceRes = await vendorPayoutsAPI.getBalance()
      setBalance(balanceRes.data)
    } catch (error) {
      console.error('Failed to request payout:', error)
    }
  }

  const getStatusBadge = (status: string) => {
    const configs: Record<string, { icon: React.ReactNode; variant: 'default' | 'secondary' | 'outline' }> = {
      pending: { icon: <Clock className="h-3 w-3" />, variant: 'outline' },
      processing: { icon: <Clock className="h-3 w-3" />, variant: 'secondary' },
      completed: { icon: <CheckCircle className="h-3 w-3" />, variant: 'default' },
    }
    const config = configs[status] || configs.pending
    return (
      <Badge variant={config.variant} className="gap-1">
        {config.icon}
        {status}
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
                  {convertAndFormat(balance?.available || 0)}
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
                  {convertAndFormat(balance?.pending || 0)}
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
              <Button onClick={handleRequestPayout} disabled={!balance?.available || balance.available <= 0}>
                Request Payout
              </Button>
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
