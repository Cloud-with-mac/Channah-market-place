import { Skeleton } from '@/components/ui/skeleton'

export default function HomeLoading() {
  return (
    <div className="flex flex-col bg-muted/30">
      <section className="border-b bg-background">
        <div className="container py-4">
          <div className="flex gap-4 h-[360px]">
            <div className="hidden lg:flex flex-col w-[240px] shrink-0">
              <Skeleton className="h-full w-full rounded-xl" />
            </div>
            <Skeleton className="flex-1 rounded-xl" />
          </div>
        </div>
      </section>
      <section className="py-8">
        <div className="container">
          <Skeleton className="h-7 w-48 mb-5" />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {Array.from({ length: 18 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="aspect-square w-full rounded-lg" />
                <Skeleton className="h-3 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-4 w-1/3" />
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
