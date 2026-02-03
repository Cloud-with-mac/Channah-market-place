import { cn } from '@/lib/utils'

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-muted', className)}
      {...props}
    />
  )
}

/**
 * Table row skeleton loader for admin tables
 */
function TableRowSkeleton({ columns = 5 }: { columns?: number }) {
  return (
    <tr className="border-b">
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="p-4">
          <Skeleton className="h-4 w-full" />
        </td>
      ))}
    </tr>
  )
}

/**
 * Dashboard stats card skeleton
 */
function StatsCardSkeleton() {
  return (
    <div className="rounded-lg border bg-card p-6 space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-10 w-10 rounded-full" />
      </div>
      <Skeleton className="h-9 w-36" />
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
  )
}

/**
 * Product list item skeleton
 */
function ProductListSkeleton() {
  return (
    <div className="flex items-center gap-4 p-4 rounded-lg border bg-card">
      <Skeleton className="h-16 w-16 rounded-md" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-5 w-1/2" />
        <Skeleton className="h-4 w-1/3" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-16" />
      </div>
    </div>
  )
}

/**
 * Order list item skeleton
 */
function OrderListSkeleton() {
  return (
    <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
      <div className="flex-1 space-y-2">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-4 w-24" />
      </div>
      <div className="text-right space-y-2">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
    </div>
  )
}

/**
 * Chart skeleton loader
 */
function ChartSkeleton() {
  return (
    <div className="rounded-lg border bg-card p-6">
      <div className="space-y-2 mb-6">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-32" />
      </div>
      <Skeleton className="h-64 w-full" />
    </div>
  )
}

/**
 * Form skeleton loader for admin forms
 */
function FormSkeleton({ fields = 5 }: { fields?: number }) {
  return (
    <div className="space-y-6">
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-10 w-full rounded-md" />
        </div>
      ))}
      <div className="flex gap-4">
        <Skeleton className="h-10 w-24 rounded-md" />
        <Skeleton className="h-10 w-24 rounded-md" />
      </div>
    </div>
  )
}

/**
 * Analytics grid skeleton
 */
function AnalyticsGridSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {[1, 2, 3, 4].map((i) => (
        <StatsCardSkeleton key={i} />
      ))}
    </div>
  )
}

export {
  Skeleton,
  TableRowSkeleton,
  StatsCardSkeleton,
  ProductListSkeleton,
  OrderListSkeleton,
  ChartSkeleton,
  FormSkeleton,
  AnalyticsGridSkeleton,
}
