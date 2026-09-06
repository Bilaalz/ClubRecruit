import { PageHeaderSkeleton, Skeleton } from "@/components/ui";

export default function ProjectLoading() {
  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <PageHeaderSkeleton />
      <div className="mt-8">
        <Skeleton className="h-3 w-12" />
        <Skeleton className="mt-2 h-7 w-80 max-w-full" />
      </div>
      <Skeleton className="mt-4 h-[420px] w-full" />
      <div className="mt-8 flex flex-wrap gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-6 w-24" />
        ))}
      </div>
      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-40 w-full" />
        ))}
      </div>
    </div>
  );
}
