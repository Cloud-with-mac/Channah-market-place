'use client'

import * as React from 'react'
import {
  Server,
  Database,
  Cpu,
  HardDrive,
  Activity,
  Wifi,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  RefreshCw,
  Zap,
  MemoryStick,
  Globe,
  Shield,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatRelativeTime } from '@/lib/utils'
import { systemAPI } from '@/lib/api'
import { Skeleton } from '@/components/ui/skeleton'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts'

interface ServiceStatus {
  name: string
  status: 'healthy' | 'degraded' | 'down'
  latency: number
  uptime: number
  last_check: string
  icon: React.ComponentType<{ className?: string }>
}

interface SystemMetric {
  timestamp: string
  cpu: number
  memory: number
  disk: number
  network: number
}

export default function SystemHealthPage() {
  const [isLoading, setIsLoading] = React.useState(true)
  const [isRefreshing, setIsRefreshing] = React.useState(false)
  const [lastUpdated, setLastUpdated] = React.useState(new Date())

  const defaultServices: ServiceStatus[] = [
    { name: 'API Server', status: 'healthy', latency: 45, uptime: 99.98, last_check: new Date().toISOString(), icon: Server },
    { name: 'Database', status: 'healthy', latency: 12, uptime: 99.99, last_check: new Date().toISOString(), icon: Database },
    { name: 'Redis Cache', status: 'healthy', latency: 2, uptime: 99.95, last_check: new Date().toISOString(), icon: Zap },
    { name: 'Payment Gateway', status: 'healthy', latency: 180, uptime: 99.90, last_check: new Date().toISOString(), icon: Shield },
    { name: 'Email Service', status: 'degraded', latency: 450, uptime: 98.50, last_check: new Date().toISOString(), icon: Globe },
    { name: 'CDN', status: 'healthy', latency: 25, uptime: 99.99, last_check: new Date().toISOString(), icon: Wifi },
  ]

  const defaultMetrics: SystemMetric[] = Array.from({ length: 24 }, (_, i) => ({
    timestamp: new Date(Date.now() - (23 - i) * 3600000).toISOString(),
    cpu: Math.floor(Math.random() * 30) + 20,
    memory: Math.floor(Math.random() * 20) + 45,
    disk: Math.floor(Math.random() * 5) + 60,
    network: Math.floor(Math.random() * 50) + 10,
  }))

  const [services, setServices] = React.useState<ServiceStatus[]>(defaultServices)
  const [metricsData, setMetricsData] = React.useState<SystemMetric[]>(defaultMetrics)
  const [currentStats, setCurrentStats] = React.useState({
    cpu: 35,
    memory: 62,
    disk: 65,
    activeConnections: 1247,
    requestsPerSec: 856,
    avgResponseTime: 48,
  })

  const fetchHealthData = async () => {
    try {
      setIsLoading(true)
      const data = await systemAPI.getSystemHealth()
      if (data) {
        if (data.services) setServices(data.services)
        if (data.metrics) setMetricsData(data.metrics)
        if (data.current) setCurrentStats(data.current)
      }
    } catch (error) {
      console.error('Failed to fetch system health:', error)
      // Keep default values on error
    } finally {
      setIsLoading(false)
      setLastUpdated(new Date())
    }
  }

  React.useEffect(() => {
    fetchHealthData()
  }, [])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await fetchHealthData()
    setIsRefreshing(false)
  }

  const getStatusIcon = (status: ServiceStatus['status']) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-5 w-5 text-success" />
      case 'degraded':
        return <AlertTriangle className="h-5 w-5 text-warning" />
      case 'down':
        return <XCircle className="h-5 w-5 text-destructive" />
    }
  }

  const getStatusBadge = (status: ServiceStatus['status']) => {
    switch (status) {
      case 'healthy':
        return <Badge variant="success">Healthy</Badge>
      case 'degraded':
        return <Badge variant="warning">Degraded</Badge>
      case 'down':
        return <Badge variant="destructive">Down</Badge>
    }
  }

  const overallStatus = services.every(s => s.status === 'healthy')
    ? 'healthy'
    : services.some(s => s.status === 'down')
    ? 'down'
    : 'degraded'

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 rounded-xl" />
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
          <h1 className="text-2xl font-bold font-display">System Health</h1>
          <p className="text-muted-foreground">
            Monitor system performance and service status
          </p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">
            Last updated: {formatRelativeTime(lastUpdated.toISOString())}
          </span>
          <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Overall Status */}
      <Card className={`border-2 ${
        overallStatus === 'healthy' ? 'border-success/50 bg-success/5' :
        overallStatus === 'degraded' ? 'border-warning/50 bg-warning/5' :
        'border-destructive/50 bg-destructive/5'
      }`}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {getStatusIcon({ status: overallStatus } as any)}
              <div>
                <h2 className="text-xl font-bold">
                  {overallStatus === 'healthy' ? 'All Systems Operational' :
                   overallStatus === 'degraded' ? 'Partial System Degradation' :
                   'System Outage Detected'}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {services.filter(s => s.status === 'healthy').length} of {services.length} services operational
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-success">
                {(services.reduce((sum, s) => sum + s.uptime, 0) / services.length).toFixed(2)}%
              </p>
              <p className="text-sm text-muted-foreground">Overall Uptime</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Cpu className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">CPU Usage</p>
                  <p className="text-2xl font-bold">{currentStats.cpu}%</p>
                </div>
              </div>
            </div>
            <Progress value={currentStats.cpu} className="mt-3" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <MemoryStick className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Memory Usage</p>
                  <p className="text-2xl font-bold">{currentStats.memory}%</p>
                </div>
              </div>
            </div>
            <Progress value={currentStats.memory} className="mt-3" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                  <HardDrive className="h-5 w-5 text-orange-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Disk Usage</p>
                  <p className="text-2xl font-bold">{currentStats.disk}%</p>
                </div>
              </div>
            </div>
            <Progress value={currentStats.disk} className="mt-3" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <Activity className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Avg Response</p>
                  <p className="text-2xl font-bold">{currentStats.avgResponseTime}ms</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Service Status */}
      <Card>
        <CardHeader>
          <CardTitle>Service Status</CardTitle>
          <CardDescription>Real-time status of all platform services</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => (
              <div
                key={service.name}
                className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                    <service.icon className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium">{service.name}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{service.latency}ms</span>
                      <span className="text-muted-foreground/50">|</span>
                      <span>{service.uptime}% uptime</span>
                    </div>
                  </div>
                </div>
                {getStatusBadge(service.status)}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Performance Charts */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="cpu">CPU</TabsTrigger>
          <TabsTrigger value="memory">Memory</TabsTrigger>
          <TabsTrigger value="network">Network</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>System Metrics (24h)</CardTitle>
              <CardDescription>Resource usage over the last 24 hours</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={metricsData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis
                      dataKey="timestamp"
                      tickFormatter={(value) => new Date(value).toLocaleTimeString('en-US', { hour: '2-digit' })}
                      className="text-xs"
                    />
                    <YAxis className="text-xs" domain={[0, 100]} />
                    <Tooltip
                      labelFormatter={(label) => new Date(label).toLocaleString()}
                      formatter={(value: number, name: string) => [`${value}%`, name.toUpperCase()]}
                    />
                    <Line type="monotone" dataKey="cpu" stroke="#3b82f6" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="memory" stroke="#10b981" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="disk" stroke="#f59e0b" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="flex items-center justify-center gap-6 mt-4">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-blue-500" />
                  <span className="text-sm">CPU</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-green-500" />
                  <span className="text-sm">Memory</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-orange-500" />
                  <span className="text-sm">Disk</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cpu">
          <Card>
            <CardHeader>
              <CardTitle>CPU Usage</CardTitle>
              <CardDescription>Detailed CPU utilization metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={metricsData}>
                    <defs>
                      <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis
                      dataKey="timestamp"
                      tickFormatter={(value) => new Date(value).toLocaleTimeString('en-US', { hour: '2-digit' })}
                      className="text-xs"
                    />
                    <YAxis className="text-xs" domain={[0, 100]} />
                    <Tooltip
                      labelFormatter={(label) => new Date(label).toLocaleString()}
                      formatter={(value: number) => [`${value}%`, 'CPU']}
                    />
                    <Area type="monotone" dataKey="cpu" stroke="#3b82f6" fill="url(#colorCpu)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="memory">
          <Card>
            <CardHeader>
              <CardTitle>Memory Usage</CardTitle>
              <CardDescription>Detailed memory utilization metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={metricsData}>
                    <defs>
                      <linearGradient id="colorMemory" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis
                      dataKey="timestamp"
                      tickFormatter={(value) => new Date(value).toLocaleTimeString('en-US', { hour: '2-digit' })}
                      className="text-xs"
                    />
                    <YAxis className="text-xs" domain={[0, 100]} />
                    <Tooltip
                      labelFormatter={(label) => new Date(label).toLocaleString()}
                      formatter={(value: number) => [`${value}%`, 'Memory']}
                    />
                    <Area type="monotone" dataKey="memory" stroke="#10b981" fill="url(#colorMemory)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="network">
          <Card>
            <CardHeader>
              <CardTitle>Network Activity</CardTitle>
              <CardDescription>Network I/O and request metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={metricsData}>
                    <defs>
                      <linearGradient id="colorNetwork" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis
                      dataKey="timestamp"
                      tickFormatter={(value) => new Date(value).toLocaleTimeString('en-US', { hour: '2-digit' })}
                      className="text-xs"
                    />
                    <YAxis className="text-xs" />
                    <Tooltip
                      labelFormatter={(label) => new Date(label).toLocaleString()}
                      formatter={(value: number) => [`${value} MB/s`, 'Network']}
                    />
                    <Area type="monotone" dataKey="network" stroke="#8b5cf6" fill="url(#colorNetwork)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Additional Info */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Active Connections</CardTitle>
            <CardDescription>Current active user connections</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-6">
              <p className="text-5xl font-bold text-primary">{currentStats.activeConnections.toLocaleString()}</p>
              <p className="text-muted-foreground mt-2">Active connections</p>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t">
              <div className="text-center">
                <p className="text-2xl font-bold">{currentStats.requestsPerSec}</p>
                <p className="text-sm text-muted-foreground">Requests/sec</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{currentStats.avgResponseTime}ms</p>
                <p className="text-sm text-muted-foreground">Avg response</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Incidents</CardTitle>
            <CardDescription>System incidents in the last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { date: '2024-01-15', title: 'Email service degradation', duration: '45 min', severity: 'warning' },
                { date: '2024-01-10', title: 'Database connection timeout', duration: '12 min', severity: 'error' },
                { date: '2024-01-05', title: 'CDN cache purge', duration: '5 min', severity: 'info' },
              ].map((incident, index) => (
                <div key={index} className="flex items-start justify-between p-3 rounded-lg bg-muted/50">
                  <div>
                    <p className="font-medium text-sm">{incident.title}</p>
                    <p className="text-xs text-muted-foreground">{incident.date} - Duration: {incident.duration}</p>
                  </div>
                  <Badge variant={incident.severity === 'error' ? 'destructive' : incident.severity === 'warning' ? 'warning' : 'info'}>
                    {incident.severity}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
