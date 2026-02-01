'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  FileText,
  TrendingUp,
  MessageSquare,
  Award,
  DollarSign,
  BarChart3,
} from 'lucide-react'

export function RFQAnalytics() {
  const stats = {
    totalRFQs: 0,
    openRFQs: 0,
    quotedRFQs: 0,
    awardedRFQs: 0,
    conversionRate: 0,
    avgQuotesPerRFQ: 0,
    avgTimeToQuote: 'N/A',
    totalRFQValue: 0,
    trends: {
      rfqs: '-',
      conversion: '-',
      value: '-',
    },
  }

  const categoryBreakdown: { category: string; rfqs: number; value: number; conversion: number }[] = []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold mb-2">RFQ Analytics</h2>
        <p className="text-muted-foreground">
          Request for Quotation performance and conversion metrics
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total RFQs */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total RFQs</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRFQs}</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <TrendingUp className="h-3 w-3 text-green-600" />
              <span className="text-green-600">{stats.trends.rfqs}</span> from last month
            </p>
          </CardContent>
        </Card>

        {/* Conversion Rate */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.conversionRate}%</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <TrendingUp className="h-3 w-3 text-green-600" />
              <span className="text-green-600">{stats.trends.conversion}</span> from last month
            </p>
          </CardContent>
        </Card>

        {/* Avg Quotes/RFQ */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Quotes/RFQ</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgQuotesPerRFQ}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Supplier engagement rate
            </p>
          </CardContent>
        </Card>

        {/* Total RFQ Value */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${(stats.totalRFQValue / 1000000).toFixed(2)}M
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <TrendingUp className="h-3 w-3 text-green-600" />
              <span className="text-green-600">{stats.trends.value}</span> from last month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Status Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>RFQ Status Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-blue-500 rounded-full" />
                <span className="text-sm font-medium">Open</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-32 bg-muted rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full"
                    style={{
                      width: `${stats.totalRFQs > 0 ? (stats.openRFQs / stats.totalRFQs) * 100 : 0}%`,
                    }}
                  />
                </div>
                <span className="text-sm font-semibold w-12 text-right">
                  {stats.openRFQs}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-purple-500 rounded-full" />
                <span className="text-sm font-medium">Quoted</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-32 bg-muted rounded-full h-2">
                  <div
                    className="bg-purple-500 h-2 rounded-full"
                    style={{
                      width: `${stats.totalRFQs > 0 ? (stats.quotedRFQs / stats.totalRFQs) * 100 : 0}%`,
                    }}
                  />
                </div>
                <span className="text-sm font-semibold w-12 text-right">
                  {stats.quotedRFQs}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-500 rounded-full" />
                <span className="text-sm font-medium">Awarded</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-32 bg-muted rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full"
                    style={{
                      width: `${stats.totalRFQs > 0 ? (stats.awardedRFQs / stats.totalRFQs) * 100 : 0}%`,
                    }}
                  />
                </div>
                <span className="text-sm font-semibold w-12 text-right">
                  {stats.awardedRFQs}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Category Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Category Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {categoryBreakdown.map((cat) => (
              <div key={cat.category} className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm">{cat.category}</span>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>{cat.rfqs} RFQs</span>
                      <span>${(cat.value / 1000).toFixed(0)}K</span>
                      <Badge variant="outline" className="text-xs">
                        {cat.conversion}% conv.
                      </Badge>
                    </div>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{ width: `${cat.conversion}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Response Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-2">{stats.avgTimeToQuote}</div>
            <p className="text-sm text-muted-foreground">
              Average time for first supplier quote
            </p>
            <div className="mt-4 p-3 bg-muted rounded-lg">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">Fast response goal</span>
                <span className="font-medium">{'<'} 24 hours</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Target conversion</span>
                <span className="font-medium">{'>'} 60%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div>
                  <p className="text-sm font-medium">Highest Conversion</p>
                  <p className="text-xs text-muted-foreground">No data</p>
                </div>
                <Award className="h-5 w-5 text-amber-500" />
              </div>
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div>
                  <p className="text-sm font-medium">Most Active</p>
                  <p className="text-xs text-muted-foreground">No data</p>
                </div>
                <TrendingUp className="h-5 w-5 text-green-500" />
              </div>
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div>
                  <p className="text-sm font-medium">Highest Value</p>
                  <p className="text-xs text-muted-foreground">No data</p>
                </div>
                <DollarSign className="h-5 w-5 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
