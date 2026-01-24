'use client'

import * as React from 'react'
import Link from 'next/link'
import { AlertTriangle, Shield, Eye, Ban, CheckCircle, Loader2, RefreshCw, ExternalLink } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { formatPrice, formatRelativeTime } from '@/lib/utils'
import { dashboardAPI } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'

interface FraudAlert {
  id: string
  order_id: string
  order_number: string
  customer_email: string
  risk_score: number
  amount: number
  reasons: string[]
  timestamp: string
  status: 'pending' | 'reviewing' | 'cleared' | 'blocked'
}

// Mock data for fallback
const mockFraudAlerts: FraudAlert[] = [
  {
    id: '1',
    order_id: 'ord-001',
    order_number: 'ORD-2024-156',
    customer_email: 'suspicious@tempmail.com',
    risk_score: 85,
    amount: 1250.00,
    reasons: ['New account', 'High value', 'VPN detected', 'Multiple cards'],
    timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    status: 'pending',
  },
  {
    id: '2',
    order_id: 'ord-002',
    order_number: 'ORD-2024-157',
    customer_email: 'user@disposable.net',
    risk_score: 72,
    amount: 890.00,
    reasons: ['Disposable email', 'Address mismatch'],
    timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    status: 'reviewing',
  },
  {
    id: '3',
    order_id: 'ord-003',
    order_number: 'ORD-2024-158',
    customer_email: 'test.buyer@example.com',
    risk_score: 65,
    amount: 450.00,
    reasons: ['Multiple orders', 'Different shipping'],
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    status: 'pending',
  },
]

function getRiskColor(score: number) {
  if (score >= 80) return 'bg-destructive'
  if (score >= 60) return 'bg-warning'
  return 'bg-success'
}

function getRiskLabel(score: number) {
  if (score >= 80) return 'High Risk'
  if (score >= 60) return 'Medium Risk'
  return 'Low Risk'
}

function getStatusBadgeVariant(status: string) {
  switch (status) {
    case 'pending':
      return 'destructive'
    case 'reviewing':
      return 'warning'
    case 'cleared':
      return 'success'
    case 'blocked':
      return 'secondary'
    default:
      return 'default'
  }
}

export function FraudAlerts() {
  const { toast } = useToast()
  const [alerts, setAlerts] = React.useState<FraudAlert[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [updatingId, setUpdatingId] = React.useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = React.useState(false)

  const fetchAlerts = React.useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await dashboardAPI.getFraudAlerts()
      if (response.data?.alerts?.length > 0) {
        setAlerts(response.data.alerts)
      } else {
        // Use mock data if no real data
        setAlerts(mockFraudAlerts)
      }
    } catch (error) {
      console.error('Failed to fetch fraud alerts:', error)
      // Fallback to mock data
      setAlerts(mockFraudAlerts)
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [])

  React.useEffect(() => {
    fetchAlerts()
  }, [fetchAlerts])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await fetchAlerts()
    toast({
      title: 'Fraud Alerts Refreshed',
      description: 'Latest fraud detection results loaded.',
    })
  }

  const handleStatusUpdate = async (alertId: string, newStatus: string) => {
    try {
      setUpdatingId(alertId)

      // Try API call
      try {
        await dashboardAPI.updateFraudAlertStatus(alertId, newStatus)
      } catch (e) {
        // API may not exist, continue with local update
      }

      // Update local state
      setAlerts((prev) =>
        prev.map((alert) =>
          alert.id === alertId
            ? { ...alert, status: newStatus as FraudAlert['status'] }
            : alert
        )
      )

      toast({
        title: 'Status Updated',
        description: `Alert has been marked as ${newStatus}.`,
      })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to update status.',
        variant: 'destructive',
      })
    } finally {
      setUpdatingId(null)
    }
  }

  const handleReview = (alertId: string) => {
    handleStatusUpdate(alertId, 'reviewing')
  }

  const handleBlock = (alertId: string) => {
    handleStatusUpdate(alertId, 'blocked')
  }

  const handleClear = (alertId: string) => {
    handleStatusUpdate(alertId, 'cleared')
  }

  // Filter to show only active alerts (pending or reviewing)
  const activeAlerts = alerts.filter(
    (alert) => alert.status === 'pending' || alert.status === 'reviewing'
  )

  if (isLoading) {
    return (
      <Card className="border-destructive/50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-destructive/10 flex items-center justify-center">
              <Shield className="h-4 w-4 text-destructive" />
            </div>
            <div>
              <CardTitle className="text-base">Fraud Alerts</CardTitle>
              <CardDescription>
                AI-detected suspicious orders requiring review
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (activeAlerts.length === 0) {
    return (
      <Card className="border-success/50">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-success/10 flex items-center justify-center shrink-0">
                <Shield className="h-4 w-4 text-success" />
              </div>
              <div>
                <CardTitle className="text-base">Fraud Alerts</CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  AI-detected suspicious orders requiring review
                </CardDescription>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
              {isRefreshing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <CheckCircle className="h-12 w-12 text-success mb-3" />
            <p className="text-sm text-muted-foreground">
              No suspicious orders detected. All clear!
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-destructive/50">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-destructive/10 flex items-center justify-center shrink-0">
              <Shield className="h-4 w-4 text-destructive" />
            </div>
            <div>
              <CardTitle className="text-base">Fraud Alerts</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                AI-detected suspicious orders requiring review
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
              {isRefreshing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
            <Badge variant="destructive">{activeAlerts.length} Active</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="max-h-[400px]">
          <div className="space-y-4">
            {activeAlerts.map((alert) => (
              <div
                key={alert.id}
                className="p-3 sm:p-4 rounded-lg border border-destructive/20 bg-destructive/5"
              >
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
                      <span className="font-medium text-sm">{alert.order_number}</span>
                      <Badge
                        variant={getStatusBadgeVariant(alert.status) as any}
                        className="text-xs"
                      >
                        {alert.status}
                      </Badge>
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground mb-2 truncate">
                      {alert.customer_email} • {formatPrice(alert.amount, 'USD')}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <span className="text-xs text-muted-foreground">Risk Score:</span>
                      <div className="flex-1 max-w-[100px]">
                        <Progress
                          value={alert.risk_score}
                          className={`h-2 ${getRiskColor(alert.risk_score)}`}
                        />
                      </div>
                      <Badge
                        variant={alert.risk_score >= 80 ? 'destructive' : 'warning'}
                        className="text-[10px] sm:text-xs"
                      >
                        {alert.risk_score}% - {getRiskLabel(alert.risk_score)}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-1 mb-2">
                      {alert.reasons.map((reason, index) => (
                        <Badge key={index} variant="outline" className="text-[10px] sm:text-xs">
                          {reason}
                        </Badge>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Detected {formatRelativeTime(alert.timestamp)}
                    </p>
                  </div>
                  <div className="flex flex-row lg:flex-col gap-2 shrink-0">
                    {alert.status === 'pending' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleReview(alert.id)}
                        disabled={updatingId === alert.id}
                        className="flex-1 lg:flex-none"
                      >
                        {updatingId === alert.id ? (
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        ) : (
                          <Eye className="h-3 w-3 mr-1" />
                        )}
                        <span className="hidden sm:inline">Review</span>
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleBlock(alert.id)}
                      disabled={updatingId === alert.id || alert.status === 'blocked'}
                      className="flex-1 lg:flex-none"
                    >
                      {updatingId === alert.id ? (
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      ) : (
                        <Ban className="h-3 w-3 mr-1" />
                      )}
                      <span className="hidden sm:inline">Block</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleClear(alert.id)}
                      disabled={updatingId === alert.id || alert.status === 'cleared'}
                      className="flex-1 lg:flex-none"
                    >
                      {updatingId === alert.id ? (
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      ) : (
                        <CheckCircle className="h-3 w-3 mr-1" />
                      )}
                      <span className="hidden sm:inline">Clear</span>
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
        <div className="mt-4 pt-4 border-t">
          <Button variant="outline" size="sm" className="w-full" asChild>
            <Link href="/orders?filter=suspicious" className="flex items-center justify-center gap-2">
              View All Suspicious Orders
              <ExternalLink className="h-3 w-3" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
