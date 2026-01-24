'use client'

import * as React from 'react'
import {
  TrendingUp,
  TrendingDown,
  Users,
  ShoppingCart,
  DollarSign,
  Package,
  BarChart3,
  PieChart,
  Calendar,
  Download,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { formatPrice, formatNumber } from '@/lib/utils'
import { dashboardAPI } from '@/lib/api'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart as RePieChart,
  Pie,
  Cell,
} from 'recharts'

interface AnalyticsData {
  revenueData: { date: string; revenue: number; orders: number }[]
  categoryData: { name: string; value: number; color: string }[]
  userGrowth: { date: string; users: number; vendors: number }[]
  conversionData: { date: string; visitors: number; conversions: number }[]
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

export default function AnalyticsPage() {
  const [isLoading, setIsLoading] = React.useState(true)
  const [period, setPeriod] = React.useState('30d')
  const [stats, setStats] = React.useState<any>(null)
  const [revenueData, setRevenueData] = React.useState<any[]>([])

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const days = period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : 365
        const [statsRes, revenueRes] = await Promise.allSettled([
          dashboardAPI.getKPIs(),
          dashboardAPI.getRevenueChart(days),
        ])

        if (statsRes.status === 'fulfilled') {
          setStats(statsRes.value.data)
        }
        if (revenueRes.status === 'fulfilled') {
          setRevenueData(revenueRes.value.data || [])
        }
      } catch (error) {
        console.error('Failed to fetch analytics:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [period])

  // Sample category data for pie chart
  const categoryData = [
    { name: 'Electronics', value: 35, color: COLORS[0] },
    { name: 'Fashion', value: 25, color: COLORS[1] },
    { name: 'Home & Garden', value: 20, color: COLORS[2] },
    { name: 'Sports', value: 12, color: COLORS[3] },
    { name: 'Other', value: 8, color: COLORS[4] },
  ]

  // Sample metrics
  const metrics = stats ? [
    {
      title: 'Total Revenue',
      value: formatPrice(stats.total_revenue || 0, 'USD'),
      change: 12.5,
      trend: 'up',
      icon: DollarSign,
    },
    {
      title: 'Total Orders',
      value: formatNumber(stats.total_orders || 0),
      change: 8.2,
      trend: 'up',
      icon: ShoppingCart,
    },
    {
      title: 'Active Users',
      value: formatNumber(stats.total_users || 0),
      change: 15.3,
      trend: 'up',
      icon: Users,
    },
    {
      title: 'Products Sold',
      value: formatNumber(stats.active_products || 0),
      change: -2.4,
      trend: 'down',
      icon: Package,
    },
  ] : []

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-[400px] rounded-xl" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display">Analytics</h1>
          <p className="text-muted-foreground">
            Detailed insights and performance metrics
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[140px]">
              <Calendar className="mr-2 h-4 w-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon">
            <Download className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric) => (
          <Card key={metric.title} className="card-hover">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {metric.title}
              </CardTitle>
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <metric.icon className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value}</div>
              <div className="flex items-center gap-1 mt-1">
                {metric.trend === 'up' ? (
                  <ArrowUpRight className="h-4 w-4 text-success" />
                ) : (
                  <ArrowDownRight className="h-4 w-4 text-destructive" />
                )}
                <span
                  className={`text-sm font-medium ${
                    metric.trend === 'up' ? 'text-success' : 'text-destructive'
                  }`}
                >
                  {metric.change > 0 ? '+' : ''}
                  {metric.change}%
                </span>
                <span className="text-sm text-muted-foreground">vs last period</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <Tabs defaultValue="revenue" className="space-y-4">
        <TabsList>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="users">User Growth</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Trend</CardTitle>
              <CardDescription>Daily revenue over the selected period</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueData}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      className="text-xs"
                    />
                    <YAxis
                      tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                      className="text-xs"
                    />
                    <Tooltip
                      formatter={(value: number) => [formatPrice(value, 'USD'), 'Revenue']}
                      labelFormatter={(label) => new Date(label).toLocaleDateString()}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="#10b981"
                      strokeWidth={2}
                      fill="url(#colorRevenue)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders">
          <Card>
            <CardHeader>
              <CardTitle>Orders Trend</CardTitle>
              <CardDescription>Daily orders over the selected period</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      className="text-xs"
                    />
                    <YAxis className="text-xs" />
                    <Tooltip
                      formatter={(value: number) => [value, 'Orders']}
                      labelFormatter={(label) => new Date(label).toLocaleDateString()}
                    />
                    <Bar dataKey="orders" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories">
          <Card>
            <CardHeader>
              <CardTitle>Sales by Category</CardTitle>
              <CardDescription>Distribution of sales across product categories</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px] flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <RePieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={80}
                      outerRadius={140}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => [`${value}%`, 'Share']} />
                    <Legend />
                  </RePieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>User Growth</CardTitle>
              <CardDescription>New users and vendors over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={revenueData.map(d => ({ ...d, users: Math.floor(Math.random() * 50) + 10, vendors: Math.floor(Math.random() * 10) + 1 }))}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      className="text-xs"
                    />
                    <YAxis className="text-xs" />
                    <Tooltip labelFormatter={(label) => new Date(label).toLocaleDateString()} />
                    <Legend />
                    <Line type="monotone" dataKey="users" stroke="#10b981" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="vendors" stroke="#3b82f6" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Additional Stats */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top Performing Products</CardTitle>
            <CardDescription>Products with highest sales this period</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { name: 'Wireless Headphones', sales: 245, revenue: 24500 },
                { name: 'Smart Watch Pro', sales: 189, revenue: 37800 },
                { name: 'Laptop Stand', sales: 156, revenue: 7800 },
                { name: 'USB-C Hub', sales: 134, revenue: 5360 },
                { name: 'Mechanical Keyboard', sales: 98, revenue: 9800 },
              ].map((product, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{product.name}</p>
                      <p className="text-xs text-muted-foreground">{product.sales} units sold</p>
                    </div>
                  </div>
                  <p className="font-bold text-sm">{formatPrice(product.revenue, 'USD')}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Conversion Metrics</CardTitle>
            <CardDescription>Key conversion statistics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {[
                { label: 'Cart Abandonment Rate', value: 68, target: 60 },
                { label: 'Checkout Completion', value: 32, target: 40 },
                { label: 'Return Customer Rate', value: 24, target: 30 },
                { label: 'Product View to Cart', value: 12, target: 15 },
              ].map((metric, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{metric.label}</span>
                    <span className="font-medium">{metric.value}%</span>
                  </div>
                  <div className="relative h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`absolute h-full rounded-full ${
                        metric.value >= metric.target ? 'bg-success' : 'bg-warning'
                      }`}
                      style={{ width: `${metric.value}%` }}
                    />
                    <div
                      className="absolute h-full w-0.5 bg-foreground/50"
                      style={{ left: `${metric.target}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">Target: {metric.target}%</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
