"use client";

import { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { PlanPhase, PlanWorkstream, ProjectPlan } from "@/lib/project";
import { cn } from "@/lib/cn";
import { ProgressBar, StatusBadge, SubteamChip } from "./chips";
import { DetailPanel } from "./detail-panel";
import { FALLBACK_SUBTEAM_COLOR, formatDateRange } from "./shared";

type Box = { x: number; y: number; w: number; h: number };
type Edge = { from: string; to: string; dashed: boolean };
type Column = { id: string; eyebrow: string; title: string; subtitle: string | null; workstreams: PlanWorkstream[] };

const ARROW_ID = "ws-arrowhead";

export function FlowCanvas({ plan, slug, isAdmin }: { plan: ProjectPlan; slug: string; isAdmin: boolean }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const byId = useMemo(() => new Map(plan.workstreams.map((w) => [w.id, w])), [plan.workstreams]);
  const selected = selectedId ? (byId.get(selectedId) ?? null) : null;

  const columns = useMemo<Column[]>(() => {
    const cols: Column[] = plan.phases.map((p: PlanPhase, i) => ({
      id: p.id,
      eyebrow: `Phase ${i + 1}`,
      title: p.name,
      subtitle: formatDateRange(p.startDate, p.endDate),
      workstreams: p.workstreams,
    }));
    if (plan.unphased.length) {
      cols.push({ id: "__unphased", eyebrow: "No phase", title: "Unscheduled", subtitle: "Not yet placed in a phase", workstreams: plan.unphased });
    }
    return cols;
  }, [plan.phases, plan.unphased]);

  const edges = useMemo<Edge[]>(
    () => plan.workstreams.flatMap((w) => w.dependsOn.map((from) => ({ from, to: w.id, dashed: w.status === "BLOCKED" }))),
    [plan.workstreams],
  );

  // Ids visually related to the selection: its dependencies and its dependents.
  const related = useMemo(() => {
    if (!selected) return new Set<string>();
    return new Set([...selected.dependsOn, ...selected.blockedBy]);
  }, [selected]);

  // ── measurement ────────────────────────────────────────────
  const innerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef(new Map<string, HTMLElement>());
  const [boxes, setBoxes] = useState<Map<string, Box>>(() => new Map());

  const measure = useCallback(() => {
    const inner = innerRef.current;
    if (!inner) return;
    const base = inner.getBoundingClientRect();
    const next = new Map<string, Box>();
    cardRefs.current.forEach((el, id) => {
      const r = el.getBoundingClientRect();
      next.set(id, { x: r.left - base.left, y: r.top - base.top, w: r.width, h: r.height });
    });
    setBoxes((prev) => (sameBoxes(prev, next) ? prev : next));
  }, []);

  useLayoutEffect(() => {
    measure();
    const inner = innerRef.current;
    if (!inner || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => measure());
    ro.observe(inner);
    cardRefs.current.forEach((el) => ro.observe(el));
    window.addEventListener("resize", measure);
    // Fonts swapping in after hydration change card heights.
    document.fonts?.ready.then(measure).catch(() => {});
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [measure, plan]);

  // Cards register their DOM node here from their ref callback (commit phase), never during render.
  const register = useCallback((id: string, el: HTMLElement | null) => {
    if (el) cardRefs.current.set(id, el);
    else cardRefs.current.delete(id);
  }, []);

  const select = useCallback((id: string | null) => setSelectedId((cur) => (cur === id ? null : id)), []);

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
      {/* Canvas */}
      <div className="min-w-0 flex-1">
        <div className="overflow-x-auto rounded-md border border-line bg-cream-2/60 [scrollbar-width:thin]">
          <div ref={innerRef} className="relative flex min-w-max gap-10 px-6 py-6">
            {columns.length === 0 && (
              <p className="text-sm text-ink-3">No phases yet. Add phases and workstreams from the editor.</p>
            )}
            {columns.map((col) => (
              <section key={col.id} className="flex w-64 shrink-0 flex-col" aria-label={col.title}>
                <header className="mb-3 border-b border-line pb-2">
                  <div className="eyebrow">{col.eyebrow}</div>
                  <h3 className="mt-0.5 font-serif text-lg leading-tight">{col.title}</h3>
                  <div className="mt-1 text-xs text-ink-4">
                    {col.subtitle ?? "No dates"} · {col.workstreams.length} {col.workstreams.length === 1 ? "workstream" : "workstreams"}
                  </div>
                </header>
                <div className="flex flex-col gap-3">
                  {col.workstreams.length === 0 && (
                    <div className="rounded-md border border-dashed border-line-soft px-3 py-4 text-center text-xs text-ink-4">
                      Nothing here yet
                    </div>
                  )}
                  {col.workstreams.map((w) => (
                    <WorkstreamCard
                      key={w.id}
                      ws={w}
                      register={register}
                      isSelected={selectedId === w.id}
                      isRelated={related.has(w.id)}
                      dimmed={!!selected && selectedId !== w.id && !related.has(w.id)}
                      onSelect={() => select(w.id)}
                    />
                  ))}
                </div>
              </section>
            ))}

            {/* Connector overlay */}
            <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible" aria-hidden>
              <defs>
                <marker id={ARROW_ID} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor" />
                </marker>
              </defs>
              {edges.map((e) => {
                const a = boxes.get(e.from);
                const b = boxes.get(e.to);
                if (!a || !b) return null;
                const active = !!selected && (e.from === selectedId || e.to === selectedId);
                return (
                  <path
                    key={`${e.from}->${e.to}`}
                    d={curve(a, b)}
                    fill="none"
                    stroke="currentColor"
                    className={cn("text-ink transition-opacity", selected && !active && "opacity-25")}
                    strokeWidth={active ? 2 : 1.25}
                    strokeDasharray={e.dashed ? "5 4" : undefined}
                    strokeLinecap="round"
                    markerEnd={`url(#${ARROW_ID})`}
                  />
                );
              })}
            </svg>
          </div>
        </div>
        <p className="mt-2 text-xs text-ink-4">
          Arrows point from a workstream to the work that depends on it. Dashed arrows lead into blocked work. Click a card for details.
        </p>
      </div>

      {/* Detail panel: right on desktop, below on mobile */}
      <aside className={cn("w-full shrink-0 lg:sticky lg:top-20 lg:w-80", !selected && "hidden lg:block")}>
        {selected ? (
          <DetailPanel ws={selected} byId={byId} slug={slug} isAdmin={isAdmin} onSelect={(id) => setSelectedId(id)} onClose={() => setSelectedId(null)} />
        ) : (
          <div className="rounded-md border border-dashed border-line-soft px-5 py-10 text-center text-sm text-ink-4">
            Select a workstream to see its details, dependencies and tasks.
          </div>
        )}
      </aside>
    </div>
  );
}

// ───────────────────────── card ─────────────────────────

function WorkstreamCard({
  ws,
  register,
  isSelected,
  isRelated,
  dimmed,
  onSelect,
}: {
  ws: PlanWorkstream;
  register: (id: string, el: HTMLElement | null) => void;
  isSelected: boolean;
  isRelated: boolean;
  dimmed: boolean;
  onSelect: () => void;
}) {
  const color = ws.subteam?.color ?? FALLBACK_SUBTEAM_COLOR;
  return (
    <button
      type="button"
      ref={(el) => register(ws.id, el)}
      onClick={onSelect}
      aria-pressed={isSelected}
      className={cn(
        "relative w-full rounded-md border border-line bg-cream-2 p-3 text-left transition-[background-color,opacity] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/40",
        isSelected ? "bg-cream-3 ring-2 ring-ink ring-offset-2 ring-offset-cream" : "hover:bg-cream-3",
        isRelated && !isSelected && "bg-cream-3",
        dimmed && "opacity-60",
      )}
      style={{ borderLeftWidth: 3, borderLeftColor: color }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="text-sm font-medium leading-snug">{ws.name}</div>
        <StatusBadge status={ws.status} className="shrink-0" />
      </div>
      <div className="mt-2.5 flex items-center justify-between gap-2">
        <SubteamChip subteam={ws.subteam} />
        <span className="shrink-0 text-xs tabular-nums text-ink-3" title="Tasks done / total">
          {ws.taskDone} / {ws.taskTotal}
        </span>
      </div>
      <ProgressBar done={ws.taskDone} total={ws.taskTotal} className="mt-2" />
    </button>
  );
}

// ───────────────────────── geometry ─────────────────────────

/** Cubic bezier from the right edge of `a` to the left edge of `b`. */
function curve(a: Box, b: Box) {
  const x1 = a.x + a.w;
  const y1 = a.y + a.h / 2;
  const x2 = b.x;
  const y2 = b.y + b.h / 2;
  const dx = Math.max(32, Math.abs(x2 - x1) / 2);
  return `M ${r(x1)} ${r(y1)} C ${r(x1 + dx)} ${r(y1)}, ${r(x2 - dx)} ${r(y2)}, ${r(x2)} ${r(y2)}`;
}

const r = (n: number) => Math.round(n * 10) / 10;

function sameBoxes(a: Map<string, Box>, b: Map<string, Box>) {
  if (a.size !== b.size) return false;
  for (const [id, box] of b) {
    const p = a.get(id);
    if (!p || p.x !== box.x || p.y !== box.y || p.w !== box.w || p.h !== box.h) return false;
  }
  return true;
}
