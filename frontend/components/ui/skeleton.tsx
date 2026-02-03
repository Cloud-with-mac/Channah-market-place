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
 * Product card skeleton loader
 */
function ProductCardSkeleton() {
  return (
    <div className="rounded-lg border bg-card p-4 space-y-4">
      <Skeleton className="w-full aspect-square" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-6 w-1/3" />
      </div>
    </div>
  )
}

/**
 * Order item skeleton loader
 */
function OrderItemSkeleton() {
  return (
    <div className="flex items-center gap-4 p-4 rounded-lg border bg-card">
      <Skeleton className="h-20 w-20 rounded-md" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-4 w-1/3" />
      </div>
    </div>
  )
}

/**
 * Table row skeleton loader
 */
function TableRowSkeleton({ columns = 4 }: { columns?: number }) {
  return (
    <tr>
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="p-4">
          <Skeleton className="h-4 w-full" />
        </td>
      ))}
    </tr>
  )
}

/**
 * Dashboard stats card skeleton loader
 */
function StatsCardSkeleton() {
  return (
    <div className="rounded-lg border bg-card p-6 space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
      <Skeleton className="h-8 w-32" />
      <Skeleton className="h-3 w-20" />
    </div>
  )
}

/**
 * Product detail skeleton loader
 */
function ProductDetailSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {/* Image */}
      <div className="space-y-4">
        <Skeleton className="w-full aspect-square rounded-lg" />
        <div className="grid grid-cols-4 gap-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="aspect-square rounded-md" />
          ))}
        </div>
      </div>

      {/* Details */}
      <div className="space-y-6">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-6 w-1/4" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
        <Skeleton className="h-12 w-full rounded-md" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-12 w-full rounded-md" />
          <Skeleton className="h-12 w-full rounded-md" />
        </div>
      </div>
    </div>
  )
}

/**
 * User avatar skeleton loader
 */
function AvatarSkeleton() {
  return <Skeleton className="h-10 w-10 rounded-full" />
}

/**
 * Form skeleton loader
 */
function FormSkeleton({ fields = 4 }: { fields?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full rounded-md" />
        </div>
      ))}
      <Skeleton className="h-10 w-32 rounded-md" />
    </div>
  )
}

export {
  Skeleton,
  ProductCardSkeleton,
  OrderItemSkeleton,
  TableRowSkeleton,
  StatsCardSkeleton,
  ProductDetailSkeleton,
  AvatarSkeleton,
  FormSkeleton,
}
