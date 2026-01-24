'use client'

import { useState } from 'react'
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, BarChart3, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'

interface RevenueDataPoint {
  date: string
  revenue: number
  orders: number
}

interface RevenueChartProps {
  data: RevenueDataPoint[]
  formatPrice: (price: number) => string
}

const CustomTooltip = ({ active, payload, label, formatPrice }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-popover border rounded-lg shadow-lg p-4">
        <p className="font-medium text-sm mb-2">{label}</p>
        <div className="space-y-1">
          <p className="text-sm text-emerald-600 dark:text-emerald-400">
            Revenue: {formatPrice(payload[0]?.value || 0)}
          </p>
          {payload[1] && (
            <p className="text-sm text-blue-600 dark:text-blue-400">
              Orders: {payload[1]?.value || 0}
            </p>
          )}
        </div>
      </div>
    )
  }
  return null
}

export function RevenueChart({ data, formatPrice }: RevenueChartProps) {
  const [chartType, setChartType] = useState<'area' | 'bar'>('area')
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d')

  // Filter data based on time range
  const filteredData = data.slice(
    timeRange === '7d' ? -7 : timeRange === '30d' ? -30 : -90
  )

  // Calculate totals
  const totalRevenue = filteredData.reduce((sum, d) => sum + d.revenue, 0)
  const totalOrders = filteredData.reduce((sum, d) => sum + d.orders, 0)
  const avgRevenue = filteredData.length > 0 ? totalRevenue / filteredData.length : 0

  return (
    <Card className="col-span-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-xl font-semibold flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-emerald-500" />
            Revenue Analytics
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Track your store's financial performance
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Time Range Selector */}
          <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
            {(['7d', '30d', '90d'] as const).map((range) => (
              <Button
                key={range}
                variant="ghost"
                size="sm"
                className={cn(
                  "h-7 px-3 text-xs",
                  timeRange === range && "bg-background shadow-sm"
                )}
                onClick={() => setTimeRange(range)}
              >
                {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : '90 Days'}
              </Button>
            ))}
          </div>
          {/* Chart Type Selector */}
          <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
            <Button
              variant="ghost"
              size="sm"
              className={cn("h-7 w-7 p-0", chartType === 'area' && "bg-background shadow-sm")}
              onClick={() => setChartType('area')}
            >
              <TrendingUp className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={cn("h-7 w-7 p-0", chartType === 'bar' && "bg-background shadow-sm")}
              onClick={() => setChartType('bar')}
            >
              <BarChart3 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-emerald-50 dark:bg-emerald-950/30 rounded-xl p-4 border border-emerald-200 dark:border-emerald-800">
            <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 mb-1">Total Revenue</p>
            <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{formatPrice(totalRevenue)}</p>
          </div>
          <div className="bg-blue-50 dark:bg-blue-950/30 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
            <p className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-1">Total Orders</p>
            <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{totalOrders}</p>
          </div>
          <div className="bg-purple-50 dark:bg-purple-950/30 rounded-xl p-4 border border-purple-200 dark:border-purple-800">
            <p className="text-xs font-medium text-purple-600 dark:text-purple-400 mb-1">Avg. Daily Revenue</p>
            <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">{formatPrice(avgRevenue)}</p>
          </div>
        </div>

        {/* Chart */}
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'area' ? (
              <AreaChart data={filteredData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  className="text-muted-foreground"
                />
                <YAxis
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `£${value}`}
                  className="text-muted-foreground"
                />
                <Tooltip content={<CustomTooltip formatPrice={formatPrice} />} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#10b981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                />
              </AreaChart>
            ) : (
              <BarChart data={filteredData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  className="text-muted-foreground"
                />
                <YAxis
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `£${value}`}
                  className="text-muted-foreground"
                />
                <Tooltip content={<CustomTooltip formatPrice={formatPrice} />} />
                <Legend />
                <Bar dataKey="revenue" name="Revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="orders" name="Orders" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
