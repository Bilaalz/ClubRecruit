import Link from "next/link";
import { cn } from "@/lib/cn";
import type { BoardWorkstream } from "./shared";

/**
 * Per-workstream progress chips ("Autonomy 2/5"). Clicking a chip sets (or clears) the
 * workstream filter while keeping the "mine" filter. Server component: hrefs are computed here.
 */
export function ProgressStrip({
  workstreams,
  basePath,
  activeWorkstreamId,
  mine,
}: {
  workstreams: BoardWorkstream[];
  basePath: string;
  activeWorkstreamId: string | null;
  mine: boolean;
}) {
  if (workstreams.length === 0) return null;

  const href = (id: string) => {
    const q = new URLSearchParams();
    if (id !== activeWorkstreamId) q.set("workstream", id);
    if (mine) q.set("mine", "1");
    const qs = q.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };

  return (
    <div className="flex flex-wrap gap-2">
      {workstreams.map((w) => {
        const active = w.id === activeWorkstreamId;
        const color = w.subteam?.color ?? "var(--ink-4)";
        const pct = w.total === 0 ? 0 : Math.round((w.done / w.total) * 100);
        return (
          <Link
            key={w.id}
            href={href(w.id)}
            scroll={false}
            title={`${w.name}${w.subteam ? ` · ${w.subteam.name}` : ""} — ${w.done} of ${w.total} done`}
            className={cn(
              "group inline-flex items-center gap-2 rounded-sm border px-2 py-1 text-xs transition-colors",
              active ? "border-ink bg-ink text-cream" : "border-line-soft bg-cream-2 text-ink-2 hover:border-ink",
            )}
          >
            <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: color }} />
            <span className="max-w-[180px] truncate">{w.name}</span>
            <span className={cn("tabular-nums", active ? "text-cream/80" : "text-ink-4")}>
              {w.done}/{w.total}
            </span>
            <span className={cn("h-1 w-8 overflow-hidden rounded-full", active ? "bg-cream/30" : "bg-cream-3")} aria-hidden>
              <span className="block h-full" style={{ width: `${pct}%`, background: active ? "var(--cream)" : color }} />
            </span>
          </Link>
        );
      })}
    </div>
  );
}
