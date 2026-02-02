import { Skeleton } from '@/components/ui/skeleton'

export default function ProductLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-2 mb-6">
        <Skeleton className="h-4 w-12" />
        <Skeleton className="h-4 w-2" />
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-2" />
        <Skeleton className="h-4 w-24" />
      </div>
      <div className="grid lg:grid-cols-12 gap-6 lg:gap-8">
        <div className="lg:col-span-5 space-y-4">
          <Skeleton className="aspect-square w-full rounded-lg" />
          <div className="flex gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="w-20 h-20 rounded-md" />
            ))}
          </div>
        </div>
        <div className="lg:col-span-4 space-y-6">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-12 w-full" />
        </div>
        <div className="lg:col-span-3 space-y-6">
          <Skeleton className="h-48 w-full rounded-lg" />
          <Skeleton className="h-64 w-full rounded-lg" />
        </div>
      </div>
    </div>
  )
}
