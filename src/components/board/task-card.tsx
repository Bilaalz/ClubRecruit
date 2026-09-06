"use client";

import type { DragEvent } from "react";
import { Avatar } from "@/components/ui";
import { cn } from "@/lib/cn";
import { formatDue, isOverdue, type BoardTask } from "./shared";
import type { TaskPriority } from "@/generated/prisma/enums";

export function PriorityMarker({ priority }: { priority: TaskPriority }) {
  const label = { HIGH: "High priority", MEDIUM: "Medium priority", LOW: "Low priority" }[priority];
  return (
    <span
      title={label}
      aria-label={label}
      className={cn(
        "inline-block h-2.5 w-2.5 shrink-0 border border-ink",
        priority === "HIGH" && "bg-ink",
        priority === "MEDIUM" && "bg-[linear-gradient(to_right,var(--ink)_50%,transparent_50%)]",
      )}
    />
  );
}

export function WorkstreamChip({ workstream, className }: { workstream: NonNullable<BoardTask["workstream"]>; className?: string }) {
  return (
    <span className={cn("inline-flex min-w-0 items-center gap-1.5 text-xs text-ink-3", className)}>
      <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: workstream.subteam?.color ?? "var(--ink-4)" }} />
      <span className="truncate">{workstream.name}</span>
    </span>
  );
}

export function TaskCard({
  task,
  dragging,
  onOpen,
  onDragStart,
  onDragEnd,
}: {
  task: BoardTask;
  dragging: boolean;
  onOpen: () => void;
  onDragStart: (e: DragEvent<HTMLDivElement>) => void;
  onDragEnd: () => void;
}) {
  const overdue = isOverdue(task);
  return (
    <div
      role="button"
      tabIndex={0}
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen();
        }
      }}
      className={cn(
        "cursor-grab select-none rounded-sm border border-line bg-cream-2 p-3 text-left transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/40 active:cursor-grabbing",
        dragging && "opacity-60",
      )}
    >
      <div className="text-sm font-medium leading-snug">{task.title}</div>
      {task.workstream && <WorkstreamChip workstream={task.workstream} className="mt-2 max-w-full" />}
      <div className="mt-3 flex items-center gap-2">
        <PriorityMarker priority={task.priority} />
        {task.dueDate && (
          <span className={cn("text-xs", overdue ? "font-medium text-bad" : "text-ink-4")} title={overdue ? "Overdue" : "Due date"}>
            {formatDue(task.dueDate)}
          </span>
        )}
        <span className="ml-auto">
          {task.assignee ? (
            <Avatar name={task.assignee.name} size="sm" />
          ) : (
            <span title="Unassigned" className="inline-block h-6 w-6 rounded-full border border-dashed border-ink-4" />
          )}
        </span>
      </div>
    </div>
  );
}
