"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Select } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { BoardMeta } from "./shared";

/** Workstream / subteam / "mine" filters, stored in the URL query string. */
export function FilterBar({ meta }: { meta: BoardMeta }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const workstream = params.get("workstream") ?? "";
  const subteam = params.get("subteam") ?? "";
  const mine = params.get("mine") === "1";
  const active = !!workstream || !!subteam || mine;

  function update(patch: Record<string, string | null>) {
    const next = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    const qs = next.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  const phases = new Map<string, BoardMeta["workstreams"]>();
  for (const w of meta.workstreams) {
    const key = w.phase?.name ?? "No phase";
    phases.set(key, [...(phases.get(key) ?? []), w]);
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="eyebrow">Filter</span>
      <Select
        aria-label="Workstream"
        value={workstream}
        onChange={(e) => update({ workstream: e.target.value, subteam: null })}
        className="h-9 w-auto min-w-[200px] text-xs"
      >
        <option value="">All workstreams</option>
        {[...phases.entries()].map(([phase, items]) => (
          <optgroup key={phase} label={phase}>
            {items.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </optgroup>
        ))}
      </Select>
      <Select
        aria-label="Subteam"
        value={subteam}
        onChange={(e) => update({ subteam: e.target.value, workstream: null })}
        className="h-9 w-auto min-w-[150px] text-xs"
      >
        <option value="">All subteams</option>
        {meta.subteams.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </Select>
      <button
        type="button"
        aria-pressed={mine}
        onClick={() => update({ mine: mine ? null : "1" })}
        className={cn(
          "h-9 rounded-sm border px-3 text-xs font-medium transition-colors",
          mine ? "border-ink bg-ink text-cream" : "border-line bg-transparent text-ink hover:bg-cream-3",
        )}
      >
        Assigned to me
      </button>
      {active && (
        <Link href={pathname} scroll={false} className="text-xs text-ink-3 underline underline-offset-2 hover:text-ink">
          Clear
        </Link>
      )}
    </div>
  );
}
