import { Badge } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { WorkstreamStatus } from "@/generated/prisma/enums";
import { FALLBACK_SUBTEAM_COLOR, STATUS_LABEL, STATUS_TONE, percent } from "./shared";

/** Small outline chip in the subteam's colour. Hook-free, so usable on server and client. */
export function SubteamChip({
  subteam,
  className,
}: {
  subteam: { name: string; color: string } | null;
  className?: string;
}) {
  const color = subteam?.color ?? FALLBACK_SUBTEAM_COLOR;
  return (
    <span
      className={cn("inline-flex max-w-full items-center gap-1.5 rounded-sm border px-1.5 py-0.5 text-[11px] font-medium leading-none", className)}
      style={{ color, borderColor: color }}
      title={subteam ? `${subteam.name} subteam` : "No subteam assigned"}
    >
      <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: color }} aria-hidden />
      <span className="truncate">{subteam?.name ?? "Unassigned"}</span>
    </span>
  );
}

export function StatusBadge({ status, className }: { status: WorkstreamStatus; className?: string }) {
  return (
    <Badge tone={STATUS_TONE[status]} className={className}>
      {STATUS_LABEL[status]}
    </Badge>
  );
}

/** Hairline progress bar; ink fill on a cream-3 track. */
export function ProgressBar({ done, total, className }: { done: number; total: number; className?: string }) {
  const pct = percent(done, total);
  return (
    <div
      className={cn("h-1 w-full overflow-hidden rounded-sm bg-cream-3", className)}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={pct}
      aria-label={`${done} of ${total} tasks done`}
    >
      <div className="h-full bg-ink transition-[width]" style={{ width: `${pct}%` }} />
    </div>
  );
}
