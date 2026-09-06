"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireClubMember } from "@/lib/auth";
import { TASK_STATUSES } from "@/components/board/shared";
import type { TaskStatus } from "@/generated/prisma/enums";
import type { Prisma } from "@/generated/prisma/client";

export type ActionResult = { ok: true; id?: string } | { ok: false; error: string };

// ── Schemas ─────────────────────────────────────────────────────────

const statusSchema = z.enum(TASK_STATUSES);
const prioritySchema = z.enum(["LOW", "MEDIUM", "HIGH"]);
const optionalId = z.preprocess((v) => (v === "" || v === undefined ? null : v), z.string().min(1).nullable());
const dueDateSchema = z.preprocess(
  (v) => (v === "" || v === undefined ? null : v),
  z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD").nullable(),
);

const taskFields = z.object({
  title: z.string().trim().min(1, "Give the task a title.").max(200, "Keep the title under 200 characters."),
  description: z.preprocess((v) => (typeof v === "string" && v.trim() === "" ? null : v), z.string().trim().max(4000).nullable()),
  status: statusSchema,
  priority: prioritySchema,
  workstreamId: optionalId,
  assigneeId: optionalId,
  dueDate: dueDateSchema,
});

const createSchema = taskFields.extend({ clubId: z.string().min(1) });
const updateSchema = taskFields.extend({ taskId: z.string().min(1) });
const moveSchema = z.object({ taskId: z.string().min(1), status: statusSchema, order: z.number().int().min(0) });
const deleteSchema = z.object({ taskId: z.string().min(1) });

export type TaskFieldsInput = z.input<typeof taskFields>;

// ── Helpers ─────────────────────────────────────────────────────────

function isRedirect(e: unknown) {
  return typeof e === "object" && e !== null && "digest" in e && String((e as { digest?: unknown }).digest).startsWith("NEXT_REDIRECT");
}

/** Run an action body, turning thrown errors into `{ ok: false }` (but let Next redirects through). */
async function guard(fn: () => Promise<ActionResult>): Promise<ActionResult> {
  try {
    return await fn();
  } catch (e) {
    if (isRedirect(e)) throw e;
    return { ok: false, error: e instanceof Error ? e.message : "Something went wrong." };
  }
}

function firstIssue(err: z.ZodError) {
  return err.issues[0]?.message ?? "Invalid input.";
}

function revalidateBoard(slug: string) {
  revalidatePath(`/clubs/${slug}/board`);
  revalidatePath(`/clubs/${slug}/project`);
}

async function loadTask(taskId: string) {
  const task = await db.task.findUnique({ where: { id: taskId }, include: { club: { select: { slug: true } } } });
  if (!task) throw new Error("That task no longer exists.");
  return task;
}

/** Ensure the workstream / assignee belong to this club before linking them. */
async function assertRefs(clubId: string, workstreamId: string | null, assigneeId: string | null) {
  if (workstreamId) {
    const ws = await db.workstream.findFirst({ where: { id: workstreamId, project: { clubId } }, select: { id: true } });
    if (!ws) throw new Error("That workstream does not belong to this club.");
  }
  if (assigneeId) {
    const m = await db.membership.findFirst({ where: { id: assigneeId, clubId }, select: { id: true } });
    if (!m) throw new Error("That assignee is not a member of this club.");
  }
}

function parseDue(d: string | null) {
  return d ? new Date(`${d}T12:00:00.000Z`) : null; // noon UTC keeps the calendar day stable across time zones
}

/** Rewrite `order` to 0..n-1 for one column. */
async function renumberColumn(tx: Prisma.TransactionClient, clubId: string, status: TaskStatus) {
  const rows = await tx.task.findMany({
    where: { clubId, status },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    select: { id: true, order: true },
  });
  const updates = rows.flatMap((r, i) => (r.order === i ? [] : [tx.task.update({ where: { id: r.id }, data: { order: i } })]));
  await Promise.all(updates);
}

// ── Actions ─────────────────────────────────────────────────────────

/**
 * Move a task to a column at a position. `order` is interpreted as "insert before the first
 * task in the target column whose order is >= order", so callers can pass the `order` of the
 * card they dropped in front of (or a large number to append). Both affected columns are renumbered.
 */
export async function moveTask(input: { taskId: string; status: TaskStatus; order: number }): Promise<ActionResult> {
  return guard(async () => {
    const parsed = moveSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };
    const { taskId, status, order } = parsed.data;

    const task = await loadTask(taskId);
    await requireClubMember(task.clubId);
    const fromStatus = task.status;

    await db.$transaction(async (tx) => {
      const others = await tx.task.findMany({
        where: { clubId: task.clubId, status, id: { not: taskId } },
        orderBy: [{ order: "asc" }, { createdAt: "asc" }],
        select: { id: true, order: true },
      });
      let idx = others.findIndex((t) => t.order >= order);
      if (idx === -1) idx = others.length;
      const ids = [...others.slice(0, idx).map((t) => t.id), taskId, ...others.slice(idx).map((t) => t.id)];
      await Promise.all(
        ids.map((id, i) => tx.task.update({ where: { id }, data: id === taskId ? { status, order: i } : { order: i } })),
      );
      if (fromStatus !== status) await renumberColumn(tx, task.clubId, fromStatus);
    });

    revalidateBoard(task.club.slug);
    return { ok: true, id: taskId };
  });
}

export async function createTask(input: z.input<typeof createSchema>): Promise<ActionResult> {
  return guard(async () => {
    const parsed = createSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };
    const { clubId, workstreamId, assigneeId, dueDate, ...rest } = parsed.data;

    await requireClubMember(clubId);
    const club = await db.club.findUnique({ where: { id: clubId }, select: { slug: true } });
    if (!club) return { ok: false, error: "Club not found." };
    await assertRefs(clubId, workstreamId, assigneeId);

    const last = await db.task.findFirst({ where: { clubId, status: rest.status }, orderBy: { order: "desc" }, select: { order: true } });
    const created = await db.task.create({
      data: { clubId, workstreamId, assigneeId, dueDate: parseDue(dueDate), order: (last?.order ?? -1) + 1, ...rest },
      select: { id: true },
    });

    revalidateBoard(club.slug);
    return { ok: true, id: created.id };
  });
}

export async function updateTask(input: z.input<typeof updateSchema>): Promise<ActionResult> {
  return guard(async () => {
    const parsed = updateSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };
    const { taskId, workstreamId, assigneeId, dueDate, ...rest } = parsed.data;

    const task = await loadTask(taskId);
    await requireClubMember(task.clubId);
    await assertRefs(task.clubId, workstreamId, assigneeId);

    const statusChanged = rest.status !== task.status;
    await db.$transaction(async (tx) => {
      let order = task.order;
      if (statusChanged) {
        const last = await tx.task.findFirst({ where: { clubId: task.clubId, status: rest.status }, orderBy: { order: "desc" }, select: { order: true } });
        order = (last?.order ?? -1) + 1;
      }
      await tx.task.update({ where: { id: taskId }, data: { workstreamId, assigneeId, dueDate: parseDue(dueDate), order, ...rest } });
      if (statusChanged) await renumberColumn(tx, task.clubId, task.status);
    });

    revalidateBoard(task.club.slug);
    return { ok: true, id: taskId };
  });
}

export async function deleteTask(input: { taskId: string }): Promise<ActionResult> {
  return guard(async () => {
    const parsed = deleteSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };

    const task = await loadTask(parsed.data.taskId);
    await requireClubMember(task.clubId);

    await db.$transaction(async (tx) => {
      await tx.task.delete({ where: { id: task.id } });
      await renumberColumn(tx, task.clubId, task.status);
    });

    revalidateBoard(task.club.slug);
    return { ok: true, id: task.id };
  });
}
