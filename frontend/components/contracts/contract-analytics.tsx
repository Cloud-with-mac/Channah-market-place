'use client'

import * as React from 'react'
import {
  FileText,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  BarChart3,
  PieChart,
  Calendar,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import type { Contract } from '@/store/contract-store'

interface ContractAnalyticsProps {
  contracts: Contract[]
}

export function ContractAnalytics({ contracts }: ContractAnalyticsProps) {
  // Calculate analytics
  const analytics = React.useMemo(() => {
    const total = contracts.length
    const byStatus = contracts.reduce((acc, c) => {
      acc[c.status] = (acc[c.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const byTemplate = contracts.reduce((acc, c) => {
      acc[c.templateName] = (acc[c.templateName] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const avgSignatureTime = contracts
      .filter(c => c.audit.fullySignedAt && c.audit.createdAt)
      .map(c => {
        const created = new Date(c.audit.createdAt).getTime()
        const signed = new Date(c.audit.fullySignedAt!).getTime()
        return (signed - created) / (1000 * 60 * 60 * 24) // days
      })
      .reduce((acc, days, _, arr) => acc + days / arr.length, 0)

    const signatureRate =
      total > 0 ? (byStatus.fully_signed || 0) / total * 100 : 0

    const pendingCount =
      (byStatus.pending_signatures || 0) + (byStatus.partially_signed || 0)

    return {
      total,
      byStatus,
      byTemplate,
      avgSignatureTime: Math.round(avgSignatureTime * 10) / 10,
      signatureRate: Math.round(signatureRate),
      pendingCount,
      mostUsedTemplate: Object.entries(byTemplate).sort(([, a], [, b]) => b - a)[0]?.[0] || 'N/A',
    }
  }, [contracts])

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-slate-200 bg-white/80 backdrop-blur">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Total Contracts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{analytics.total}</div>
            <p className="text-xs text-slate-600 mt-1">All time</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white/80 backdrop-blur">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Signature Rate
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{analytics.signatureRate}%</div>
            <Progress value={analytics.signatureRate} className="mt-2 h-1" />
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white/80 backdrop-blur">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Avg. Signature Time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {analytics.avgSignatureTime || 0}
              <span className="text-lg font-normal text-slate-600"> days</span>
            </div>
            <p className="text-xs text-slate-600 mt-1">From creation to fully signed</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white/80 backdrop-blur">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Pending Action
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">{analytics.pendingCount}</div>
            <p className="text-xs text-slate-600 mt-1">Awaiting signatures</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <Card className="border-slate-200 bg-white/80 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <PieChart className="w-5 h-5 text-blue-600" />
              Status Distribution
            </CardTitle>
            <CardDescription>Contracts by current status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(analytics.byStatus)
                .sort(([, a], [, b]) => b - a)
                .map(([status, count]) => {
                  const percentage = (count / analytics.total) * 100
                  const statusColors: Record<string, string> = {
                    draft: 'bg-gray-500',
                    pending_signatures: 'bg-yellow-500',
                    partially_signed: 'bg-blue-500',
                    fully_signed: 'bg-green-500',
                    declined: 'bg-red-500',
                    expired: 'bg-orange-500',
                    cancelled: 'bg-gray-400',
                  }
                  return (
                    <div key={status} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-700 capitalize">
                          {status.replace(/_/g, ' ')}
                        </span>
                        <span className="font-medium text-slate-900">
                          {count} ({Math.round(percentage)}%)
                        </span>
                      </div>
                      <Progress
                        value={percentage}
                        className="h-2"
                      />
                    </div>
                  )
                })}
            </div>
          </CardContent>
        </Card>

        {/* Template Usage */}
        <Card className="border-slate-200 bg-white/80 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              Template Usage
            </CardTitle>
            <CardDescription>Most frequently used templates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(analytics.byTemplate)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 5)
                .map(([template, count]) => {
                  const percentage = (count / analytics.total) * 100
                  return (
                    <div key={template} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-700 truncate max-w-[200px]">
                          {template}
                        </span>
                        <span className="font-medium text-slate-900">
                          {count} ({Math.round(percentage)}%)
                        </span>
                      </div>
                      <Progress value={percentage} className="h-2" />
                    </div>
                  )
                })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Insights */}
      <Card className="border-slate-200 bg-white/80 backdrop-blur">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            Key Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg">
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-blue-900">Most Used Template</p>
                <p className="text-xs text-blue-700 mt-1">{analytics.mostUsedTemplate}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg">
              <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-green-900">Success Rate</p>
                <p className="text-xs text-green-700 mt-1">
                  {analytics.signatureRate}% of contracts are fully signed
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-yellow-50 rounded-lg">
              <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-yellow-900">Processing Time</p>
                <p className="text-xs text-yellow-700 mt-1">
                  Average {analytics.avgSignatureTime || 0} days to complete
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
