'use client'

import * as React from 'react'
import { TrendingUp, TrendingDown, Calendar, DollarSign, Package, AlertTriangle, Loader2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { aiAPI } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface ForecastData {
  period: string
  predicted_sales: number
  confidence_interval_low: number
  confidence_interval_high: number
  trend: 'up' | 'down' | 'stable'
}

interface RecommendationItem {
  type: 'opportunity' | 'warning' | 'tip'
  title: string
  description: string
  impact: 'high' | 'medium' | 'low'
  action?: string
}

export function AISalesForecast() {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = React.useState(false)
  const [timeframe, setTimeframe] = React.useState('30d')
  const [forecastData, setForecastData] = React.useState<ForecastData[]>([])
  const [recommendations, setRecommendations] = React.useState<RecommendationItem[]>([])
  const [totalForecast, setTotalForecast] = React.useState(0)
  const [growthRate, setGrowthRate] = React.useState(0)

  const fetchForecast = async () => {
    setIsLoading(true)
    try {
      const response = await aiAPI.getSalesForecast(timeframe)

      setForecastData(response.forecast_data || [])
      setRecommendations(response.recommendations || [])
      setTotalForecast(response.total_forecast || 0)
      setGrowthRate(response.growth_rate || 0)
    } catch (error: any) {
      console.error('Failed to fetch sales forecast:', error)
      toast({
        title: 'Forecast unavailable',
        description: error.response?.data?.detail || 'Could not generate forecast. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  React.useEffect(() => {
    fetchForecast()
  }, [timeframe])

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high':
        return 'bg-red-500/10 text-red-500'
      case 'medium':
        return 'bg-orange-500/10 text-orange-500'
      case 'low':
        return 'bg-blue-500/10 text-blue-500'
      default:
        return 'bg-gray-500/10 text-gray-500'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'opportunity':
        return <TrendingUp className="h-4 w-4" />
      case 'warning':
        return <AlertTriangle className="h-4 w-4" />
      default:
        return <Package className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">AI Sales Forecast</h2>
          <p className="text-muted-foreground">Machine learning-powered sales predictions</p>
        </div>
        <Select value={timeframe} onValueChange={setTimeframe}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Next 7 days</SelectItem>
            <SelectItem value="30d">Next 30 days</SelectItem>
            <SelectItem value="90d">Next 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Predicted Sales</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">£{totalForecast.toLocaleString('en-GB')}</div>
                <p className="text-xs text-muted-foreground">
                  For next {timeframe === '7d' ? '7 days' : timeframe === '30d' ? '30 days' : '90 days'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Growth Rate</CardTitle>
                {growthRate >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500" />
                )}
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${growthRate >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {growthRate >= 0 ? '+' : ''}{growthRate.toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground">Compared to previous period</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Confidence Level</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">High</div>
                <p className="text-xs text-muted-foreground">Based on historical data</p>
              </CardContent>
            </Card>
          </div>

          {/* Tabs for different views */}
          <Tabs defaultValue="forecast" className="space-y-4">
            <TabsList>
              <TabsTrigger value="forecast">Forecast Chart</TabsTrigger>
              <TabsTrigger value="recommendations">AI Recommendations</TabsTrigger>
            </TabsList>

            {/* Forecast Chart Tab */}
            <TabsContent value="forecast" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Sales Forecast</CardTitle>
                  <CardDescription>
                    Predicted sales with confidence intervals
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {forecastData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={forecastData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="period" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="confidence_interval_low"
                          stroke="#94a3b8"
                          strokeDasharray="3 3"
                          name="Lower Bound"
                        />
                        <Line
                          type="monotone"
                          dataKey="predicted_sales"
                          stroke="#0ea5e9"
                          strokeWidth={2}
                          name="Predicted Sales"
                        />
                        <Line
                          type="monotone"
                          dataKey="confidence_interval_high"
                          stroke="#94a3b8"
                          strokeDasharray="3 3"
                          name="Upper Bound"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      No forecast data available. Add more sales history for accurate predictions.
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Recommendations Tab */}
            <TabsContent value="recommendations" className="space-y-4">
              {recommendations.length > 0 ? (
                <div className="grid gap-4">
                  {recommendations.map((rec, idx) => (
                    <Card key={idx}>
                      <CardContent className="pt-6">
                        <div className="flex items-start gap-4">
                          <div className={`p-2 rounded-lg ${getImpactColor(rec.impact)}`}>
                            {getTypeIcon(rec.type)}
                          </div>
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center justify-between">
                              <h4 className="font-semibold">{rec.title}</h4>
                              <Badge variant="outline" className={getImpactColor(rec.impact)}>
                                {rec.impact} impact
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{rec.description}</p>
                            {rec.action && (
                              <Button size="sm" variant="outline">
                                {rec.action}
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="py-12 text-center text-muted-foreground">
                    No recommendations available at this time
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  )
}
