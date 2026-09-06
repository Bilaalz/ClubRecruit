"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button, Field, Input, Select, Textarea } from "@/components/ui";
import { createTask, deleteTask, updateTask } from "@/lib/tasks-actions";
import type { TaskPriority, TaskStatus } from "@/generated/prisma/enums";
import { TASK_COLUMNS, TASK_PRIORITIES, toDateInput, type BoardMeta, type BoardTask } from "./shared";

export type PanelState =
  | { mode: "edit"; task: BoardTask }
  | { mode: "create"; status: TaskStatus; workstreamId: string | null; assigneeId: string | null };

type FormState = {
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  workstreamId: string;
  assigneeId: string;
  dueDate: string;
};

function initialForm(state: PanelState): FormState {
  if (state.mode === "edit") {
    const t = state.task;
    return {
      title: t.title,
      description: t.description ?? "",
      status: t.status,
      priority: t.priority,
      workstreamId: t.workstream?.id ?? "",
      assigneeId: t.assignee?.id ?? "",
      dueDate: toDateInput(t.dueDate),
    };
  }
  return {
    title: "",
    description: "",
    status: state.status,
    priority: "MEDIUM",
    workstreamId: state.workstreamId ?? "",
    assigneeId: state.assigneeId ?? "",
    dueDate: "",
  };
}

/** Workstreams grouped by phase name (unphased ones last) for the select. */
function groupByPhase(workstreams: BoardMeta["workstreams"]) {
  const groups = new Map<string, BoardMeta["workstreams"]>();
  for (const w of workstreams) {
    const key = w.phase?.name ?? "No phase";
    groups.set(key, [...(groups.get(key) ?? []), w]);
  }
  return [...groups.entries()];
}

export function TaskPanel({
  clubId,
  state,
  meta,
  onClose,
}: {
  clubId: string;
  state: PanelState;
  meta: BoardMeta;
  onClose: () => void;
}) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(() => initialForm(state));
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const isEdit = state.mode === "edit";

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((f) => ({ ...f, [key]: value }));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const payload = {
        title: form.title,
        description: form.description,
        status: form.status,
        priority: form.priority,
        workstreamId: form.workstreamId || null,
        assigneeId: form.assigneeId || null,
        dueDate: form.dueDate || null,
      };
      const res = isEdit ? await updateTask({ taskId: state.task.id, ...payload }) : await createTask({ clubId, ...payload });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      router.refresh();
      onClose();
    });
  }

  function remove() {
    if (!isEdit) return;
    if (!window.confirm(`Delete "${state.task.title}"? This cannot be undone.`)) return;
    setError(null);
    startTransition(async () => {
      const res = await deleteTask({ taskId: state.task.id });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      router.refresh();
      onClose();
    });
  }

  return (
    <>
      <div className="fixed inset-0 z-40 bg-ink/20" onClick={onClose} aria-hidden />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="task-panel-title"
        className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-line bg-cream-2"
      >
        <header className="flex items-start justify-between gap-4 border-b border-line px-6 py-5">
          <div>
            <div className="eyebrow">{isEdit ? "Edit task" : "New task"}</div>
            <h2 id="task-panel-title" className="mt-1 font-serif text-xl leading-tight">
              {isEdit ? state.task.title : "Add a task"}
            </h2>
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={onClose} aria-label="Close panel">
            Close
          </Button>
        </header>

        <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
            <Field label="Title">
              <Input value={form.title} onChange={(e) => set("title", e.target.value)} required autoFocus placeholder="What needs doing?" />
            </Field>
            <Field label="Description">
              <Textarea value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Context, links, acceptance criteria…" />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Status">
                <Select value={form.status} onChange={(e) => set("status", e.target.value as TaskStatus)}>
                  {TASK_COLUMNS.map((c) => (
                    <option key={c.status} value={c.status}>
                      {c.label}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Priority">
                <Select value={form.priority} onChange={(e) => set("priority", e.target.value as TaskPriority)}>
                  {TASK_PRIORITIES.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
            <Field label="Workstream">
              <Select value={form.workstreamId} onChange={(e) => set("workstreamId", e.target.value)}>
                <option value="">No workstream</option>
                {groupByPhase(meta.workstreams).map(([phase, items]) => (
                  <optgroup key={phase} label={phase}>
                    {items.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name}
                        {w.subteam ? ` · ${w.subteam.name}` : ""}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </Select>
            </Field>
            <Field label="Assignee">
              <Select value={form.assigneeId} onChange={(e) => set("assigneeId", e.target.value)}>
                <option value="">Unassigned</option>
                {meta.members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                    {m.subteam ? ` · ${m.subteam.name}` : ""}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Due date">
              <Input type="date" value={form.dueDate} onChange={(e) => set("dueDate", e.target.value)} />
            </Field>
            {error && (
              <p role="alert" className="text-sm text-bad">
                {error}
              </p>
            )}
          </div>

          <footer className="flex items-center justify-between gap-3 border-t border-line px-6 py-4">
            {isEdit ? (
              <Button type="button" variant="danger" size="sm" onClick={remove} disabled={pending}>
                Delete
              </Button>
            ) : (
              <span />
            )}
            <div className="flex items-center gap-2">
              <Button type="button" variant="secondary" size="sm" onClick={onClose} disabled={pending}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={pending}>
                {pending ? "Saving…" : isEdit ? "Save changes" : "Create task"}
              </Button>
            </div>
          </footer>
        </form>
      </aside>
    </>
  );
}
