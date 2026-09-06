/**
 * Client-safe constants and DTO types shared by the board page, the board
 * client components and the query/action modules. No server imports here.
 */
import type { TaskPriority, TaskStatus } from "@/generated/prisma/enums";

export const TASK_COLUMNS: ReadonlyArray<{ status: TaskStatus; label: string; empty: string }> = [
  { status: "BACKLOG", label: "Backlog", empty: "Nothing parked here." },
  { status: "TODO", label: "To do", empty: "No tasks queued." },
  { status: "IN_PROGRESS", label: "In progress", empty: "Nothing in flight." },
  { status: "IN_REVIEW", label: "In review", empty: "Nothing waiting on review." },
  { status: "DONE", label: "Done", empty: "Nothing finished yet." },
];

export const TASK_STATUSES = TASK_COLUMNS.map((c) => c.status) as [TaskStatus, ...TaskStatus[]];
export const TASK_PRIORITIES: ReadonlyArray<{ value: TaskPriority; label: string }> = [
  { value: "LOW", label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH", label: "High" },
];

export function columnLabel(status: TaskStatus) {
  return TASK_COLUMNS.find((c) => c.status === status)?.label ?? status;
}

/** Flat, serialisable task shape used by the board UI. Dates are ISO strings. */
export type BoardTask = {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  order: number;
  dueDate: string | null;
  workstream: { id: string; name: string; subteam: { id: string; name: string; color: string } | null } | null;
  assignee: { id: string; name: string } | null;
};

export type BoardColumn = { status: TaskStatus; label: string; empty: string; tasks: BoardTask[] };

export type BoardWorkstream = {
  id: string;
  name: string;
  phase: { id: string; name: string; order: number } | null;
  subteam: { id: string; name: string; color: string } | null;
  done: number;
  total: number;
};

export type BoardSubteam = { id: string; name: string; color: string };

export type BoardMember = {
  id: string; // membership id (what Task.assigneeId points at)
  name: string;
  title: string | null;
  subteam: { id: string; name: string } | null;
};

export type BoardMeta = {
  projectName: string | null;
  workstreams: BoardWorkstream[];
  subteams: BoardSubteam[];
  members: BoardMember[];
};

/** `2026-09-05` for a date input, or "" when unset. */
export function toDateInput(iso: string | null | undefined) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Short human date, e.g. "Sep 12". Adds the year when it is not the current one. */
export function formatDue(iso: string) {
  const d = new Date(iso);
  const base = `${MONTHS[d.getMonth()]} ${d.getDate()}`;
  return d.getFullYear() === new Date().getFullYear() ? base : `${base} ${d.getFullYear()}`;
}

export function isOverdue(task: Pick<BoardTask, "dueDate" | "status">, now = Date.now()) {
  return !!task.dueDate && task.status !== "DONE" && new Date(task.dueDate).getTime() < now;
}
