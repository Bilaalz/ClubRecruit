import { PageHeaderSkeleton, Skeleton } from "@/components/ui";

export default function BoardLoading() {
  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <PageHeaderSkeleton />
      <div className="mt-6 flex flex-wrap gap-2">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-10 w-24" />
      </div>
      <div className="mt-5 flex gap-3 overflow-hidden">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-56 shrink-0" />
        ))}
      </div>
      <div className="mt-6 grid grid-cols-[repeat(5,minmax(240px,1fr))] gap-3 overflow-hidden">
        {Array.from({ length: 5 }).map((_, col) => (
          <div key={col} className="space-y-3">
            <Skeleton className="h-5 w-28" />
            {Array.from({ length: col === 4 ? 1 : 3 - (col % 2) }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
