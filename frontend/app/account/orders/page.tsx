'use client'

import * as React from 'react'
import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { OrderList } from '@/components/account/order-list'
import { ordersAPI } from '@/lib/api'

interface Order {
  id: string
  order_number: string
  status: string
  total_amount: number
  created_at: string
  items: any[]
}

function OrdersContent() {
  const searchParams = useSearchParams()
  const [orders, setOrders] = React.useState<Order[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [statusFilter, setStatusFilter] = React.useState<string>('all')
  const [page, setPage] = React.useState(1)
  const [hasMore, setHasMore] = React.useState(false)
  const [isLoadingMore, setIsLoadingMore] = React.useState(false)

  const fetchOrders = React.useCallback(async (pageNum: number, append = false) => {
    if (append) {
      setIsLoadingMore(true)
    } else {
      setIsLoading(true)
      setError(null)
    }

    try {
      const params: Record<string, any> = {
        page: pageNum,
        page_size: 10,
      }

      if (statusFilter !== 'all') {
        params.status = statusFilter
      }

      const response = await ordersAPI.list(params)
      const newOrders = response.data.results || response.data || []

      if (append) {
        setOrders(prev => [...prev, ...newOrders])
      } else {
        setOrders(Array.isArray(newOrders) ? newOrders : [])
      }

      setHasMore(!!response.data.next)
    } catch (error: any) {
      console.error('Failed to fetch orders:', error)
      if (!append) {
        if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
          setError('Connection timed out. Please check your internet connection and try again.')
        } else if (error.response?.status === 401) {
          setError('Your session has expired. Please log in again.')
        } else {
          setError(error.response?.data?.detail || 'Failed to load orders. Please try again.')
        }
        setOrders([])
      }
    } finally {
      setIsLoading(false)
      setIsLoadingMore(false)
    }
  }, [statusFilter])

  React.useEffect(() => {
    setPage(1)
    fetchOrders(1)
  }, [statusFilter, fetchOrders])

  const handleLoadMore = () => {
    const nextPage = page + 1
    setPage(nextPage)
    fetchOrders(nextPage, true)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display">My Orders</h1>
          <p className="text-muted-foreground mt-1">
            View and track your order history.
          </p>
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Orders</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="processing">Processing</SelectItem>
            <SelectItem value="shipped">Shipped</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Error Message */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription className="mt-2">
            <p>{error}</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => fetchOrders(1)}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-6 w-24" />
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex -space-x-2">
                    {[...Array(3)].map((_, j) => (
                      <Skeleton key={j} className="h-16 w-16 rounded-md" />
                    ))}
                  </div>
                  <div className="flex-1">
                    <Skeleton className="h-4 w-20 mb-2" />
                    <Skeleton className="h-5 w-24" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : !error && (
        <>
          <OrderList orders={orders} />

          {hasMore && (
            <div className="flex justify-center pt-4">
              <Button
                variant="outline"
                onClick={handleLoadMore}
                disabled={isLoadingMore}
              >
                {isLoadingMore && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Load More Orders
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default function OrdersPage() {
  return (
    <Suspense fallback={
      <div className="space-y-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    }>
      <OrdersContent />
    </Suspense>
  )
}
