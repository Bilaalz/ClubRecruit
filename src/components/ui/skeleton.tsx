import { cn } from "@/lib/cn";

/** Pulsing cream block for loading states. Give it a width/height via className. */
export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn("animate-pulse rounded-sm bg-cream-3", className)} />;
}

/** Eyebrow + title + description shaped like PageHeader. */
export function PageHeaderSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("border-b border-line pb-6", className)}>
      <Skeleton className="h-3 w-24" />
      <Skeleton className="mt-3 h-9 w-72 max-w-full" />
      <Skeleton className="mt-4 h-4 w-96 max-w-full" />
    </div>
  );
}
