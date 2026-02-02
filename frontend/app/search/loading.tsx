import { Skeleton } from '@/components/ui/skeleton'

export default function SearchLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Skeleton className="h-9 w-72 mb-2" />
      <Skeleton className="h-4 w-32 mb-8" />
      <div className="flex gap-6">
        <aside className="hidden lg:block w-72 flex-shrink-0">
          <Skeleton className="h-96 w-full rounded-lg" />
        </aside>
        <div className="flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="aspect-square w-full rounded-lg" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-5 w-1/3" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
