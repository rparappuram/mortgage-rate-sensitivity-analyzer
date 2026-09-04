import { Skeleton } from '../../../components/ui/Skeleton'

export function ResultsSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading analysis">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="rounded-2xl border border-line bg-surface p-5">
          <Skeleton className="h-2.5 w-32" />
          <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, metric) => (
              <div key={metric}>
                <Skeleton className="h-2 w-16" />
                <Skeleton className="mt-2 h-6 w-24" />
              </div>
            ))}
          </div>
        </div>
      ))}
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-[280px] rounded-2xl" />
        <Skeleton className="h-[280px] rounded-2xl" />
      </div>
    </div>
  )
}
