import { PageHeaderSkeleton, Skeleton } from "@/components/ui";

export default function PipelineLoading() {
  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <PageHeaderSkeleton />
      <div className="mt-6 flex flex-wrap gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-32" />
        ))}
      </div>
      <div className="mt-6 flex flex-wrap gap-3 border-t border-line-soft pt-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-10 w-40" />
      </div>
      <div className="mt-6">
        <Skeleton className="mb-2 h-3 w-40" />
        <div className="divide-y divide-line-soft border-y border-line">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 py-4">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-4 w-40" />
              <Skeleton className="hidden h-4 w-48 sm:block" />
              <Skeleton className="ml-auto h-5 w-20" />
              <Skeleton className="h-4 w-10" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
