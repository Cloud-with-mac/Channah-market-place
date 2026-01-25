'use client'

import * as React from 'react'
import { AlertTriangle, Shield, TrendingUp, Eye, CheckCircle, XCircle, Clock, DollarSign } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/hooks/use-toast'

interface FraudAlert {
  id: string
  order_id: string
  customer_name: string
  customer_email: string
  amount: number
  fraud_score: number
  risk_level: 'low' | 'medium' | 'high' | 'critical'
  flags: string[]
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
  ai_reasoning?: string
}

interface FraudStats {
  total_alerts: number
  critical_alerts: number
  prevented_losses: number
  accuracy_rate: number
  false_positive_rate: number
}

export function AIFraudDetection() {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = React.useState(true)
  const [alerts, setAlerts] = React.useState<FraudAlert[]>([])
  const [stats, setStats] = React.useState<FraudStats>({
    total_alerts: 0,
    critical_alerts: 0,
    prevented_losses: 0,
    accuracy_rate: 0,
    false_positive_rate: 0,
  })
  const [filter, setFilter] = React.useState<'all' | 'pending' | 'critical'>('pending')

  // Simulated data - replace with real API call
  React.useEffect(() => {
    const fetchFraudData = async () => {
      setIsLoading(true)
      try {
        // TODO: Replace with actual API call
        // const response = await adminAPI.getFraudAlerts()

        // Mock data for demonstration
        const mockAlerts: FraudAlert[] = [
          {
            id: '1',
            order_id: 'ORD-2024-001',
            customer_name: 'John Doe',
            customer_email: 'john.suspicious@example.com',
            amount: 1250.00,
            fraud_score: 0.89,
            risk_level: 'critical',
            flags: ['High value order', 'New account', 'Unusual shipping address', 'VPN detected'],
            status: 'pending',
            created_at: '2024-01-25T10:30:00Z',
            ai_reasoning: 'Customer account created 2 hours ago with immediate high-value purchase. Shipping address differs significantly from billing. Multiple failed payment attempts detected.',
          },
          {
            id: '2',
            order_id: 'ORD-2024-002',
            customer_name: 'Jane Smith',
            customer_email: 'jane.smith@email.com',
            amount: 450.00,
            fraud_score: 0.65,
            risk_level: 'high',
            flags: ['Billing/shipping mismatch', 'Rush delivery requested'],
            status: 'pending',
            created_at: '2024-01-25T09:15:00Z',
            ai_reasoning: 'Billing and shipping addresses in different countries. Express shipping selected for high-value electronics.',
          },
          {
            id: '3',
            order_id: 'ORD-2024-003',
            customer_name: 'Bob Johnson',
            customer_email: 'bob@company.com',
            amount: 3200.00,
            fraud_score: 0.42,
            risk_level: 'medium',
            flags: ['Large order quantity', 'First-time buyer'],
            status: 'pending',
            created_at: '2024-01-25T08:45:00Z',
            ai_reasoning: 'Large quantity order from new customer. However, business email domain verified and payment method reliable.',
          },
        ]

        const mockStats: FraudStats = {
          total_alerts: 127,
          critical_alerts: 12,
          prevented_losses: 45000,
          accuracy_rate: 94.5,
          false_positive_rate: 5.5,
        }

        setAlerts(mockAlerts)
        setStats(mockStats)
      } catch (error) {
        console.error('Failed to fetch fraud alerts:', error)
        toast({
          title: 'Error',
          description: 'Failed to load fraud detection data',
          variant: 'destructive',
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchFraudData()
  }, [toast])

  const handleApprove = async (alertId: string) => {
    toast({
      title: 'Order approved',
      description: 'The order has been approved and will proceed to fulfillment.',
    })
    setAlerts((prev) => prev.map((alert) => (alert.id === alertId ? { ...alert, status: 'approved' } : alert)))
  }

  const handleReject = async (alertId: string) => {
    toast({
      title: 'Order rejected',
      description: 'The order has been flagged as fraudulent and cancelled.',
      variant: 'destructive',
    })
    setAlerts((prev) => prev.map((alert) => (alert.id === alertId ? { ...alert, status: 'rejected' } : alert)))
  }

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'critical':
        return 'text-red-500 bg-red-500/10'
      case 'high':
        return 'text-orange-500 bg-orange-500/10'
      case 'medium':
        return 'text-yellow-500 bg-yellow-500/10'
      default:
        return 'text-blue-500 bg-blue-500/10'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-orange-500" />
    }
  }

  const filteredAlerts = alerts.filter((alert) => {
    if (filter === 'all') return true
    if (filter === 'pending') return alert.status === 'pending'
    if (filter === 'critical') return alert.risk_level === 'critical'
    return true
  })

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            AI Fraud Detection
          </h2>
          <p className="text-muted-foreground">Advanced machine learning fraud prevention system</p>
        </div>
        <Select value={filter} onValueChange={(value: any) => setFilter(value)}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Alerts</SelectItem>
            <SelectItem value="pending">Pending Only</SelectItem>
            <SelectItem value="critical">Critical Only</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_alerts}</div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{stats.critical_alerts}</div>
            <p className="text-xs text-muted-foreground">Require immediate action</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Prevented Losses</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">£{stats.prevented_losses.toLocaleString('en-GB')}</div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Accuracy Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.accuracy_rate}%</div>
            <Progress value={stats.accuracy_rate} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Alerts Table */}
      <Card>
        <CardHeader>
          <CardTitle>Fraud Alerts ({filteredAlerts.length})</CardTitle>
          <CardDescription>AI-detected suspicious transactions requiring review</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredAlerts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No alerts matching the selected filter</p>
            </div>
          ) : (
            <ScrollArea className="h-[500px]">
              <div className="space-y-4">
                {filteredAlerts.map((alert) => (
                  <Card key={alert.id} className="border-l-4" style={{ borderLeftColor: alert.risk_level === 'critical' ? '#ef4444' : alert.risk_level === 'high' ? '#f97316' : '#eab308' }}>
                    <CardContent className="pt-6">
                      <div className="space-y-4">
                        {/* Header */}
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold">Order {alert.order_id}</h4>
                              <Badge className={getRiskColor(alert.risk_level)}>
                                {alert.risk_level} risk
                              </Badge>
                              <div className="flex items-center gap-1">
                                {getStatusIcon(alert.status)}
                                <span className="text-xs text-muted-foreground capitalize">{alert.status}</span>
                              </div>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {alert.customer_name} ({alert.customer_email})
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-primary">£{alert.amount.toFixed(2)}</p>
                            <p className="text-xs text-muted-foreground">
                              Fraud Score: {(alert.fraud_score * 100).toFixed(0)}%
                            </p>
                          </div>
                        </div>

                        {/* AI Reasoning */}
                        {alert.ai_reasoning && (
                          <div className="bg-muted p-3 rounded-lg">
                            <div className="flex items-start gap-2">
                              <Eye className="h-4 w-4 text-primary mt-0.5" />
                              <div>
                                <p className="text-xs font-medium mb-1">AI Analysis:</p>
                                <p className="text-sm text-muted-foreground">{alert.ai_reasoning}</p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Flags */}
                        <div className="flex flex-wrap gap-2">
                          {alert.flags.map((flag, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              {flag}
                            </Badge>
                          ))}
                        </div>

                        {/* Actions */}
                        {alert.status === 'pending' && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleApprove(alert.id)}
                              className="flex-1"
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Approve Order
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleReject(alert.id)}
                              className="flex-1"
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Block & Refund
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
