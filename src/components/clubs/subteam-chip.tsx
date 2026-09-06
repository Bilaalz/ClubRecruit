import { cn } from "@/lib/cn";

/** Small chip with the subteam's color dot. Pass `null` for "No subteam". */
export function SubteamChip({
  subteam,
  className,
}: {
  subteam: { name: string; color: string } | null | undefined;
  className?: string;
}) {
  if (!subteam) {
    return <span className={cn("inline-flex items-center gap-1.5 text-xs text-ink-4", className)}>No subteam</span>;
  }
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-sm border border-line-soft bg-cream-2 px-1.5 py-0.5 text-xs text-ink-2", className)}>
      <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: subteam.color }} aria-hidden />
      {subteam.name}
    </span>
  );
}
