"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import type { PlanWorkstream } from "@/lib/project";
import { setWorkstreamStatus } from "@/lib/project-actions";
import { Select, buttonClasses } from "@/components/ui";
import { ProgressBar, StatusBadge, SubteamChip } from "./chips";
import { STATUS_LABEL, STATUS_ORDER, percent } from "./shared";

export function DetailPanel({
  ws,
  byId,
  slug,
  isAdmin,
  onSelect,
  onClose,
}: {
  ws: PlanWorkstream;
  byId: Map<string, PlanWorkstream>;
  slug: string;
  isAdmin: boolean;
  onSelect: (id: string) => void;
  onClose: () => void;
}) {
  const deps = ws.dependsOn.map((id) => byId.get(id)).filter((w): w is PlanWorkstream => !!w);
  const dependents = ws.blockedBy.map((id) => byId.get(id)).filter((w): w is PlanWorkstream => !!w);
  const boardHref = `/clubs/${slug}/board?workstream=${encodeURIComponent(ws.id)}`;
  const editHref = `/clubs/${slug}/project/edit?ws=${encodeURIComponent(ws.id)}#ws-${ws.id}`;

  return (
    <div className="rounded-md border border-line bg-cream-2" style={{ borderTopWidth: 3, borderTopColor: ws.subteam?.color ?? "#8a867e" }}>
      <div className="flex items-start justify-between gap-3 border-b border-line-soft px-5 py-4">
        <div className="min-w-0">
          <div className="eyebrow">Workstream</div>
          <h3 className="mt-1 font-serif text-xl leading-tight">{ws.name}</h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="-mr-2 -mt-1 rounded-sm px-2 py-1 text-xs text-ink-3 hover:bg-cream-3 hover:text-ink"
          aria-label="Close details"
        >
          Close
        </button>
      </div>

      <div className="space-y-5 px-5 py-4 text-sm">
        <div className="flex flex-wrap items-center gap-2">
          <SubteamChip subteam={ws.subteam} />
          <StatusBadge status={ws.status} />
        </div>

        {isAdmin && <InlineStatus ws={ws} />}

        {ws.description ? (
          <p className="leading-relaxed text-ink-2">{ws.description}</p>
        ) : (
          <p className="text-ink-4">No description yet.</p>
        )}

        <Section label="Depends on" empty="Nothing — this can start right away.">
          {deps.map((d) => (
            <RelatedRow key={d.id} ws={d} onSelect={onSelect} />
          ))}
        </Section>

        <Section label="Blocks" empty="Nothing depends on this yet.">
          {dependents.map((d) => (
            <RelatedRow key={d.id} ws={d} onSelect={onSelect} />
          ))}
        </Section>

        <div>
          <div className="eyebrow mb-2">Tasks</div>
          <div className="flex items-baseline justify-between">
            <span className="font-serif text-2xl leading-none tabular-nums">
              {ws.taskDone} <span className="text-base text-ink-4">/ {ws.taskTotal}</span>
            </span>
            <span className="text-xs text-ink-4">{percent(ws.taskDone, ws.taskTotal)}% done</span>
          </div>
          <ProgressBar done={ws.taskDone} total={ws.taskTotal} className="mt-2" />
          <Link href={boardHref} className={buttonClasses({ variant: "secondary", size: "sm", className: "mt-3 w-full" })}>
            Open on board
          </Link>
        </div>

        {isAdmin && (
          <div className="border-t border-line-soft pt-4">
            <Link href={editHref} className={buttonClasses({ variant: "ghost", size: "sm", className: "w-full border-line-soft" })}>
              Edit details, phase or dependencies
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

function Section({ label, empty, children }: { label: string; empty: string; children: React.ReactNode[] }) {
  return (
    <div>
      <div className="eyebrow mb-2">{label}</div>
      {children.length ? <ul className="divide-y divide-line-soft border-y border-line-soft">{children}</ul> : <p className="text-xs text-ink-4">{empty}</p>}
    </div>
  );
}

function RelatedRow({ ws, onSelect }: { ws: PlanWorkstream; onSelect: (id: string) => void }) {
  return (
    <li>
      <button
        type="button"
        onClick={() => onSelect(ws.id)}
        className="flex w-full items-center justify-between gap-2 py-2 text-left hover:bg-cream-3"
      >
        <span className="flex min-w-0 items-center gap-2">
          <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: ws.subteam?.color ?? "#8a867e" }} aria-hidden />
          <span className="truncate">{ws.name}</span>
        </span>
        <StatusBadge status={ws.status} className="shrink-0" />
      </button>
    </li>
  );
}

function InlineStatus({ ws }: { ws: PlanWorkstream }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink-3" htmlFor={`status-${ws.id}`}>
        Change status
      </label>
      <div className="flex items-center gap-2">
        <Select
          id={`status-${ws.id}`}
          value={ws.status}
          disabled={pending}
          className="h-9"
          onChange={(e) => {
            const status = e.target.value;
            setError(null);
            startTransition(async () => {
              try {
                await setWorkstreamStatus({ workstreamId: ws.id, status });
              } catch (err) {
                setError(err instanceof Error ? err.message : "Could not update status.");
              }
            });
          }}
        >
          {STATUS_ORDER.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABEL[s]}
            </option>
          ))}
        </Select>
        {pending && <span className="shrink-0 text-xs text-ink-4">Saving…</span>}
      </div>
      {error && <p className="mt-1 text-xs text-bad">{error}</p>}
    </div>
  );
}
