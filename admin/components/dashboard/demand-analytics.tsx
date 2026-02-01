'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  TrendingUp,
  TrendingDown,
  Eye,
  ShoppingCart,
  Heart,
  Search,
  Package,
} from 'lucide-react'

export function DemandAnalytics() {
  const trendingProducts: { id: string; name: string; category: string; views: number; orders: number; conversionRate: number; trend: string; trending: string }[] = []

  const categoryDemand: { category: string; demand: number; growth: string; orders: number }[] = []

  const searchTrends: { keyword: string; searches: number; growth: string }[] = []

  const insights = {
    totalViews: 0,
    totalSearches: 0,
    avgConversionRate: 0,
    topGrowthCategory: 'N/A',
    emergingTrend: 'N/A',
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold mb-2">Demand Analytics</h2>
        <p className="text-muted-foreground">
          Market trends, popular products, and buyer behavior insights
        </p>
      </div>

      {/* Overview Stats */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {insights.totalViews.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Searches</CardTitle>
            <Search className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {insights.totalSearches.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Unique queries</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Conversion</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{insights.avgConversionRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">View to order rate</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Growth</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{insights.topGrowthCategory}</div>
            <p className="text-xs text-muted-foreground mt-1">Fastest growing</p>
          </CardContent>
        </Card>
      </div>

      {/* Trending Products */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Trending Products
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {trendingProducts.map((product, index) => (
              <div
                key={product.id}
                className="flex items-center gap-4 p-4 border rounded-lg hover:border-primary/50 transition-colors"
              >
                {/* Rank Badge */}
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${
                    index === 0
                      ? 'bg-amber-100 text-amber-600 dark:bg-amber-950/30'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  #{index + 1}
                </div>

                {/* Product Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold truncate">{product.name}</h4>
                    <Badge variant="outline" className="text-xs">
                      {product.category}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-xs">
                    <div>
                      <p className="text-muted-foreground">Views</p>
                      <p className="font-semibold">{product.views.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Orders</p>
                      <p className="font-semibold">{product.orders}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Conv. Rate</p>
                      <p className="font-semibold">{product.conversionRate}%</p>
                    </div>
                  </div>
                </div>

                {/* Trend */}
                <div className="text-right">
                  {product.trending === 'up' ? (
                    <div className="flex items-center gap-1 text-sm font-semibold text-green-600">
                      <TrendingUp className="h-4 w-4" />
                      {product.trend}
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-sm font-semibold text-red-600">
                      <TrendingDown className="h-4 w-4" />
                      {product.trend}
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">vs last month</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Category Demand */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Category Demand
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {categoryDemand.map((cat, index) => (
                <div key={index}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">{cat.category}</span>
                    <div className="flex items-center gap-2 text-xs">
                      <Badge variant="outline">{cat.orders} orders</Badge>
                      <span className="text-green-600 font-semibold">{cat.growth}</span>
                    </div>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{
                        width: `${(cat.demand / categoryDemand[0].demand) * 100}%`,
                      }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {cat.demand.toLocaleString()} impressions
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Search Trends */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Top Search Terms
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {searchTrends.map((trend, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                        index === 0
                          ? 'bg-amber-100 text-amber-600 dark:bg-amber-950/30'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{trend.keyword}</p>
                      <p className="text-xs text-muted-foreground">
                        {trend.searches.toLocaleString()} searches
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-sm font-semibold text-green-600">
                    <TrendingUp className="h-4 w-4" />
                    {trend.growth}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Market Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Market Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border border-green-200 dark:border-green-800 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <h4 className="font-semibold">Emerging Trend</h4>
              </div>
              <p className="text-2xl font-bold mb-1">{insights.emergingTrend}</p>
              <p className="text-sm text-muted-foreground">
                No data available
              </p>
            </div>

            <div className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Heart className="h-5 w-5 text-blue-600" />
                <h4 className="font-semibold">Buyer Preference</h4>
              </div>
              <p className="text-2xl font-bold mb-1">Verified Suppliers</p>
              <p className="text-sm text-muted-foreground">
                No data available
              </p>
            </div>

            <div className="p-4 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/20 dark:to-indigo-950/20 border border-purple-200 dark:border-purple-800 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <ShoppingCart className="h-5 w-5 text-purple-600" />
                <h4 className="font-semibold">Order Behavior</h4>
              </div>
              <p className="text-2xl font-bold mb-1">Bulk Ordering</p>
              <p className="text-sm text-muted-foreground">
                No data available
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
