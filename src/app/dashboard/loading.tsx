import { PageHeaderSkeleton, Skeleton } from "@/components/ui";

export default function DashboardLoading() {
  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <PageHeaderSkeleton />
      <div className="mt-10 grid gap-10 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-10">
          <div>
            <Skeleton className="mb-4 h-7 w-32" />
            <div className="grid gap-4 sm:grid-cols-2">
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-40 w-full" />
            </div>
          </div>
          <div>
            <Skeleton className="mb-4 h-7 w-72 max-w-full" />
            <div className="divide-y divide-line-soft border-y border-line">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-2 py-5">
                  <Skeleton className="h-3 w-32" />
                  <Skeleton className="h-6 w-80 max-w-full" />
                  <Skeleton className="h-3 w-48" />
                </div>
              ))}
            </div>
          </div>
        </div>
        <Skeleton className="h-56 w-full" />
      </div>
    </div>
  );
}
