import type { WorkstreamStatus } from "@/generated/prisma/enums";
import { StatusBadge } from "./chips";
import { STATUS_ORDER } from "./shared";

const STATUS_HINT: Record<WorkstreamStatus, string> = {
  PLANNED: "not started",
  ACTIVE: "in progress",
  BLOCKED: "waiting on a dependency",
  DONE: "complete",
};

export function Legend({ subteams }: { subteams: Array<{ id: string; name: string; color: string }> }) {
  return (
    <div className="grid gap-6 border-y border-line-soft py-5 text-sm sm:grid-cols-3">
      <div>
        <div className="eyebrow mb-2">Subteams</div>
        <ul className="flex flex-wrap gap-x-4 gap-y-1.5">
          {subteams.map((s) => (
            <li key={s.id} className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ background: s.color }} aria-hidden />
              <span>{s.name}</span>
            </li>
          ))}
          {subteams.length === 0 && <li className="text-ink-4">No subteams yet</li>}
        </ul>
      </div>
      <div>
        <div className="eyebrow mb-2">Status</div>
        <ul className="flex flex-wrap gap-x-4 gap-y-1.5">
          {STATUS_ORDER.map((s) => (
            <li key={s} className="flex items-center gap-2">
              <StatusBadge status={s} />
              <span className="text-xs text-ink-4">{STATUS_HINT[s]}</span>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <div className="eyebrow mb-2">Connectors</div>
        <ul className="space-y-1.5">
          <li className="flex items-center gap-2">
            <ConnectorSample />
            <span className="text-xs text-ink-4">depends on → feeds into</span>
          </li>
          <li className="flex items-center gap-2">
            <ConnectorSample dashed />
            <span className="text-xs text-ink-4">leads into blocked work</span>
          </li>
        </ul>
      </div>
    </div>
  );
}

function ConnectorSample({ dashed = false }: { dashed?: boolean }) {
  return (
    <svg width="44" height="12" viewBox="0 0 44 12" className="shrink-0 text-ink" aria-hidden>
      <path d="M 1 6 H 36" stroke="currentColor" strokeWidth="1.25" strokeDasharray={dashed ? "5 4" : undefined} strokeLinecap="round" fill="none" />
      <path d="M 35 2 L 43 6 L 35 10 z" fill="currentColor" />
    </svg>
  );
}
