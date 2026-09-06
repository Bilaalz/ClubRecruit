import { cn } from "@/lib/cn";

const STEPS = ["Resume", "Interview", "Done"] as const;

/** Three-step progress rail shown across the apply flow. `current` is 0-based. */
export function ApplySteps({ current }: { current: 0 | 1 | 2 }) {
  return (
    <ol className="flex items-center gap-3 text-xs">
      {STEPS.map((label, i) => {
        const state = i < current ? "done" : i === current ? "current" : "todo";
        return (
          <li key={label} className="flex items-center gap-3">
            <span
              className={cn(
                "inline-flex h-6 w-6 items-center justify-center rounded-full border text-[11px] font-medium",
                state === "current" && "border-ink bg-ink text-cream",
                state === "done" && "border-ink bg-transparent text-ink",
                state === "todo" && "border-line-soft text-ink-4",
              )}
            >
              {state === "done" ? "✓" : i + 1}
            </span>
            <span className={cn("uppercase tracking-wide", state === "todo" ? "text-ink-4" : "text-ink")}>{label}</span>
            {i < STEPS.length - 1 && <span className="h-px w-8 bg-line-soft" aria-hidden />}
          </li>
        );
      })}
    </ol>
  );
}

/** Small posting/club header reused across the apply steps. */
export function ApplyContext({ title, clubName, subteamName }: { title: string; clubName: string; subteamName?: string | null }) {
  return (
    <div>
      <div className="eyebrow">
        {clubName}
        {subteamName ? ` · ${subteamName}` : ""}
      </div>
      <h1 className="mt-1 font-serif text-3xl leading-tight sm:text-4xl">{title}</h1>
    </div>
  );
}
