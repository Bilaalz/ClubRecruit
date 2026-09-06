import { cn } from "@/lib/cn";

/** Compact score readout for tables: number + thin progress rule. */
export function ScoreBar({ score, className }: { score: number | null | undefined; className?: string }) {
  if (score == null) return <span className="text-ink-4">—</span>;
  const pct = Math.min(100, Math.max(0, score));
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span className="w-6 text-right tabular-nums">{pct}</span>
      <span className="h-1 w-16 overflow-hidden rounded-full bg-cream-3" aria-hidden>
        <span className="block h-full bg-ink" style={{ width: `${pct}%` }} />
      </span>
    </span>
  );
}
