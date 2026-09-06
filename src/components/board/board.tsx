"use client";

import { useCallback, useState, type DragEvent } from "react";
import { useRouter } from "next/navigation";
import { Button, EmptyState } from "@/components/ui";
import { cn } from "@/lib/cn";
import { moveTask } from "@/lib/tasks-actions";
import type { TaskStatus } from "@/generated/prisma/enums";
import { TaskCard } from "./task-card";
import { TaskPanel, type PanelState } from "./task-panel";
import type { BoardColumn, BoardMeta } from "./shared";

type DropTarget = { status: TaskStatus; index: number };

/** Move a task id to `status` at visible position `index`, returning new columns. */
function applyMove(columns: BoardColumn[], taskId: string, status: TaskStatus, index: number): BoardColumn[] {
  const source = columns.find((c) => c.tasks.some((t) => t.id === taskId));
  const task = source?.tasks.find((t) => t.id === taskId);
  if (!source || !task) return columns;
  return columns.map((col) => {
    const rest = col.tasks.filter((t) => t.id !== taskId);
    if (col.status !== status) return col.status === source.status ? { ...col, tasks: rest } : col;
    let at = index;
    if (source.status === status && source.tasks.findIndex((t) => t.id === taskId) < index) at -= 1;
    at = Math.max(0, Math.min(at, rest.length));
    return { ...col, tasks: [...rest.slice(0, at), { ...task, status }, ...rest.slice(at)] };
  });
}

export function Board({
  clubId,
  columns: serverColumns,
  meta,
  hasFilters,
  defaultWorkstreamId,
  defaultAssigneeId,
}: {
  clubId: string;
  columns: BoardColumn[];
  meta: BoardMeta;
  hasFilters: boolean;
  defaultWorkstreamId: string | null;
  defaultAssigneeId: string | null;
}) {
  const router = useRouter();

  // Local copy of the columns for optimistic moves; resets whenever the server sends new data.
  const [snapshot, setSnapshot] = useState({ source: serverColumns, columns: serverColumns });
  if (snapshot.source !== serverColumns) setSnapshot({ source: serverColumns, columns: serverColumns });
  const columns = snapshot.columns;
  const setColumns = (next: BoardColumn[]) => setSnapshot((s) => ({ ...s, columns: next }));

  const [dragId, setDragId] = useState<string | null>(null);
  const [over, setOver] = useState<DropTarget | null>(null);
  const [panel, setPanel] = useState<PanelState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const closePanel = useCallback(() => setPanel(null), []);

  const total = columns.reduce((n, c) => n + c.tasks.length, 0);

  function onDragStart(e: DragEvent<HTMLDivElement>, taskId: string) {
    e.dataTransfer.setData("text/plain", taskId);
    e.dataTransfer.effectAllowed = "move";
    setDragId(taskId);
  }

  function onDragEnd() {
    setDragId(null);
    setOver(null);
  }

  function hover(e: DragEvent<HTMLElement>, target: DropTarget) {
    if (!dragId) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (!over || over.status !== target.status || over.index !== target.index) setOver(target);
  }

  async function drop(e: DragEvent<HTMLElement>, target: DropTarget) {
    e.preventDefault();
    e.stopPropagation();
    const taskId = dragId ?? e.dataTransfer.getData("text/plain");
    setDragId(null);
    setOver(null);
    if (!taskId) return;

    const source = columns.find((c) => c.tasks.some((t) => t.id === taskId));
    if (!source) return;
    const fromIndex = source.tasks.findIndex((t) => t.id === taskId);
    const sameSpot = source.status === target.status && (target.index === fromIndex || target.index === fromIndex + 1);
    if (sameSpot) return;

    // Server "order" = order of the card we land in front of; append if none.
    const targetCol = columns.find((c) => c.status === target.status)!;
    const rest = targetCol.tasks.filter((t) => t.id !== taskId);
    let at = target.index;
    if (source.status === target.status && fromIndex < target.index) at -= 1;
    const before = rest[at];
    const order = before ? before.order : rest.length ? rest[rest.length - 1].order + 1 : 0;

    const previous = columns;
    setColumns(applyMove(columns, taskId, target.status, target.index));
    setError(null);

    const res = await moveTask({ taskId, status: target.status, order });
    if (!res.ok) {
      setColumns(previous);
      setError(res.error);
      return;
    }
    router.refresh();
  }

  return (
    <div className="mt-6">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-ink-4">
          {total === 0 ? "No tasks match the current filters." : `${total} task${total === 1 ? "" : "s"} · drag cards between columns to update status`}
        </p>
        <div className="flex items-center gap-3">
          {error && (
            <span role="alert" className="text-xs text-bad">
              {error}
            </span>
          )}
          <Button
            size="sm"
            onClick={() => setPanel({ mode: "create", status: "TODO", workstreamId: defaultWorkstreamId, assigneeId: defaultAssigneeId })}
          >
            New task
          </Button>
        </div>
      </div>

      {total === 0 && !hasFilters ? (
        <EmptyState
          title="No tasks yet"
          description="Create the first task and it will appear on the board. Tasks can be linked to workstreams from the project plan."
          action={
            <Button size="sm" onClick={() => setPanel({ mode: "create", status: "TODO", workstreamId: null, assigneeId: null })}>
              New task
            </Button>
          }
        />
      ) : (
        <div className="-mx-6 overflow-x-auto px-6 pb-4">
          <div className="flex items-start gap-4">
            {columns.map((col) => {
              const isTarget = over?.status === col.status && dragId !== null;
              return (
                <section
                  key={col.status}
                  className={cn(
                    "flex w-[280px] min-w-[260px] shrink-0 flex-col rounded-md border border-line-soft transition-colors",
                    isTarget && "bg-cream-3",
                  )}
                  onDragOver={(e) => hover(e, { status: col.status, index: col.tasks.length })}
                  onDrop={(e) => drop(e, { status: col.status, index: col.tasks.length })}
                >
                  <header className="flex items-center justify-between gap-2 border-b border-line-soft px-3 py-2.5">
                    <h2 className="flex items-baseline gap-2 font-serif text-sm">
                      {col.label}
                      <span className="font-sans text-xs text-ink-4">{col.tasks.length}</span>
                    </h2>
                    <button
                      type="button"
                      aria-label={`Add task to ${col.label}`}
                      title={`Add task to ${col.label}`}
                      onClick={() =>
                        setPanel({ mode: "create", status: col.status, workstreamId: defaultWorkstreamId, assigneeId: defaultAssigneeId })
                      }
                      className="flex h-6 w-6 items-center justify-center rounded-sm border border-transparent text-base leading-none text-ink-3 hover:border-line hover:text-ink"
                    >
                      +
                    </button>
                  </header>

                  <div className="flex min-h-[160px] flex-1 flex-col p-2">
                    {col.tasks.length === 0 && (
                      <p className={cn("px-1 py-6 text-center text-xs text-ink-4", isTarget && "invisible")}>{col.empty}</p>
                    )}
                    {col.tasks.map((task, i) => (
                      <div
                        key={task.id}
                        className="py-1"
                        onDragOver={(e) => {
                          e.stopPropagation();
                          const rect = e.currentTarget.getBoundingClientRect();
                          const before = e.clientY < rect.top + rect.height / 2;
                          hover(e, { status: col.status, index: before ? i : i + 1 });
                        }}
                        onDrop={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          const before = e.clientY < rect.top + rect.height / 2;
                          void drop(e, { status: col.status, index: before ? i : i + 1 });
                        }}
                      >
                        <DropLine show={isTarget && over?.index === i} />
                        <TaskCard
                          task={task}
                          dragging={dragId === task.id}
                          onOpen={() => setPanel({ mode: "edit", task })}
                          onDragStart={(e) => onDragStart(e, task.id)}
                          onDragEnd={onDragEnd}
                        />
                      </div>
                    ))}
                    <DropLine show={isTarget && over?.index === col.tasks.length && col.tasks.length > 0} />
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      )}

      {panel && <TaskPanel clubId={clubId} state={panel} meta={meta} onClose={closePanel} />}
    </div>
  );
}

function DropLine({ show }: { show: boolean }) {
  return <div className={cn("h-0.5 rounded-full bg-ink transition-opacity", show ? "opacity-100" : "opacity-0")} aria-hidden />;
}
