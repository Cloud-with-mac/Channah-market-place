'use client'

import * as React from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { formatPrice } from '@/lib/utils'
import { dashboardAPI } from '@/lib/api'
import { BarChart3, Loader2 } from 'lucide-react'

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border rounded-lg shadow-lg p-3">
        <p className="text-sm font-medium mb-2">{label}</p>
        <div className="space-y-1">
          <p className="text-sm text-primary">
            Revenue: {formatPrice(payload[0].value, 'GBP')}
          </p>
          <p className="text-sm text-cyan-light">Orders: {payload[1].value}</p>
        </div>
      </div>
    )
  }
  return null
}

export function RevenueChart() {
  const [data, setData] = React.useState<any[]>([])
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    async function fetchData() {
      try {
        const result = await dashboardAPI.getRevenueChart()
        if (Array.isArray(result) && result.length > 0) {
          setData(result)
        } else {
          setData([])
        }
      } catch {
        setData([])
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [])

  if (isLoading) {
    return (
      <div className="h-[300px] w-full flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="h-[300px] w-full flex flex-col items-center justify-center text-muted-foreground">
        <BarChart3 className="h-12 w-12 mb-3 opacity-50" />
        <p className="text-sm">No revenue data yet</p>
        <p className="text-xs mt-1">Revenue chart will appear once orders are placed</p>
      </div>
    )
  }

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(187, 100%, 50%)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(187, 100%, 50%)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(187, 90%, 65%)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(187, 90%, 65%)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(217, 33%, 20%)" />
          <XAxis
            dataKey="date"
            stroke="hsl(215, 20%, 65%)"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="hsl(215, 20%, 65%)"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `${value / 1000}k`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="circle"
          />
          <Area
            type="monotone"
            dataKey="revenue"
            name="Revenue"
            stroke="hsl(187, 100%, 50%)"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorRevenue)"
          />
          <Area
            type="monotone"
            dataKey="orders"
            name="Orders"
            stroke="hsl(187, 90%, 65%)"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorOrders)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
