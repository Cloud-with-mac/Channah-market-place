'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Star,
  TrendingUp,
  Package,
  Clock,
  DollarSign,
  Award,
  AlertCircle,
} from 'lucide-react'

export function SupplierPerformance() {
  const topSuppliers: { id: string; name: string; logo: string; rating: number; totalOrders: number; totalRevenue: number; onTimeDelivery: number; responseTime: string; defectRate: number; trend: string; badges: string[] }[] = []

  const metrics = {
    avgRating: 0,
    avgResponseTime: 'N/A',
    avgOnTimeDelivery: 0,
    activeSuppliers: 0,
    goldSuppliers: 0,
    verifiedSuppliers: 0,
  }

  const performanceIssues: { supplier: string; issue: string; count: number; severity: string }[] = []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold mb-2">Supplier Performance</h2>
        <p className="text-muted-foreground">
          Track and monitor supplier quality and reliability metrics
        </p>
      </div>

      {/* Overview Stats */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Suppliers</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.activeSuppliers}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {metrics.verifiedSuppliers} verified
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Rating</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-1">
              {metrics.avgRating}
              <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">Platform average</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">On-Time Delivery</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.avgOnTimeDelivery}%</div>
            <p className="text-xs text-muted-foreground mt-1">Average rate</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Response Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.avgResponseTime}</div>
            <p className="text-xs text-muted-foreground mt-1">To RFQs</p>
          </CardContent>
        </Card>
      </div>

      {/* Top Performers */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-amber-500" />
            Top Performing Suppliers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topSuppliers.map((supplier, index) => (
              <div
                key={supplier.id}
                className="flex items-center gap-4 p-4 border rounded-lg hover:border-primary/50 transition-colors"
              >
                {/* Rank */}
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 font-bold text-primary">
                  #{index + 1}
                </div>

                {/* Logo */}
                <Avatar className="h-12 w-12">
                  <AvatarImage src={supplier.logo} />
                  <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white font-semibold">
                    {supplier.name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold truncate">{supplier.name}</h4>
                    {supplier.badges.includes('gold') && (
                      <Badge className="bg-amber-500">
                        <Award className="h-3 w-3 mr-1" />
                        Gold
                      </Badge>
                    )}
                    {supplier.badges.includes('verified') && (
                      <Badge variant="outline">Verified</Badge>
                    )}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
                    <div>
                      <p className="text-muted-foreground">Rating</p>
                      <p className="font-semibold flex items-center gap-1">
                        {supplier.rating}
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Orders</p>
                      <p className="font-semibold">{supplier.totalOrders}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Revenue</p>
                      <p className="font-semibold">
                        ${(supplier.totalRevenue / 1000).toFixed(0)}K
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">On-Time</p>
                      <p className="font-semibold text-green-600">
                        {supplier.onTimeDelivery}%
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Response</p>
                      <p className="font-semibold">{supplier.responseTime}</p>
                    </div>
                  </div>
                </div>

                {/* Trend */}
                <div className="text-right">
                  <div className="flex items-center gap-1 text-sm font-semibold text-green-600">
                    <TrendingUp className="h-4 w-4" />
                    {supplier.trend}
                  </div>
                  <p className="text-xs text-muted-foreground">this month</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Performance Issues */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-500" />
            Performance Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          {performanceIssues.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <AlertCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No performance issues reported</p>
            </div>
          ) : (
            <div className="space-y-3">
              {performanceIssues.map((issue, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        issue.severity === 'high'
                          ? 'bg-red-500'
                          : issue.severity === 'medium'
                          ? 'bg-amber-500'
                          : 'bg-blue-500'
                      }`}
                    />
                    <div>
                      <p className="font-semibold text-sm">{issue.supplier}</p>
                      <p className="text-xs text-muted-foreground">{issue.issue}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge
                      variant="outline"
                      className={
                        issue.severity === 'high'
                          ? 'border-red-200 text-red-600'
                          : issue.severity === 'medium'
                          ? 'border-amber-200 text-amber-600'
                          : 'border-blue-200 text-blue-600'
                      }
                    >
                      {issue.count} incidents
                    </Badge>
                    <Badge variant="outline">{issue.severity}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quality Metrics */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Quality Standards</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Defect Rate</span>
                  <span className="font-semibold text-muted-foreground">N/A</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: '0%' }} />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  No data available
                </p>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Customer Satisfaction</span>
                  <span className="font-semibold text-muted-foreground">N/A</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: '0%' }} />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  No data available
                </p>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Compliance Rate</span>
                  <span className="font-semibold text-muted-foreground">N/A</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: '0%' }} />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  No data available
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Supplier Tiers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gradient-to-r from-amber-50 to-amber-100 dark:from-amber-950/20 dark:to-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                <div className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-amber-500" />
                  <div>
                    <p className="font-semibold text-sm">Gold Suppliers</p>
                    <p className="text-xs text-muted-foreground">Premium tier</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">{metrics.goldSuppliers}</p>
                  <p className="text-xs text-muted-foreground">
                    {metrics.activeSuppliers > 0 ? ((metrics.goldSuppliers / metrics.activeSuppliers) * 100).toFixed(0) : 0}%
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-semibold text-sm">Verified Suppliers</p>
                    <p className="text-xs text-muted-foreground">Standard tier</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">{metrics.verifiedSuppliers}</p>
                  <p className="text-xs text-muted-foreground">
                    {metrics.activeSuppliers > 0 ? ((metrics.verifiedSuppliers / metrics.activeSuppliers) * 100).toFixed(0) : 0}%
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-semibold text-sm">Basic Suppliers</p>
                    <p className="text-xs text-muted-foreground">Entry tier</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">
                    {metrics.activeSuppliers - metrics.verifiedSuppliers}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {metrics.activeSuppliers > 0 ? (
                      ((metrics.activeSuppliers - metrics.verifiedSuppliers) /
                        metrics.activeSuppliers) *
                      100
                    ).toFixed(0) : 0}
                    %
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
