import { db } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";
import { TASK_COLUMNS, type BoardColumn, type BoardMeta, type BoardTask } from "@/components/board/shared";

export type { BoardColumn, BoardMeta, BoardTask } from "@/components/board/shared";
export { TASK_COLUMNS } from "@/components/board/shared";

export type BoardFilters = {
  workstreamId?: string;
  subteamId?: string;
  assigneeId?: string;
};

const taskInclude = {
  workstream: { select: { id: true, name: true, subteam: { select: { id: true, name: true, color: true } } } },
  assignee: { select: { id: true, user: { select: { name: true } } } },
} satisfies Prisma.TaskInclude;

type TaskRow = Prisma.TaskGetPayload<{ include: typeof taskInclude }>;

export function toBoardTask(t: TaskRow): BoardTask {
  return {
    id: t.id,
    title: t.title,
    description: t.description,
    status: t.status,
    priority: t.priority,
    order: t.order,
    dueDate: t.dueDate ? t.dueDate.toISOString() : null,
    workstream: t.workstream,
    assignee: t.assignee ? { id: t.assignee.id, name: t.assignee.user.name } : null,
  };
}

/** Tasks for a club, filtered, grouped into columns in board order and sorted by `order`. */
export async function getBoard(clubId: string, filters: BoardFilters = {}) {
  const where: Prisma.TaskWhereInput = { clubId };
  if (filters.workstreamId) where.workstreamId = filters.workstreamId;
  if (filters.subteamId) where.workstream = { subteamId: filters.subteamId };
  if (filters.assigneeId) where.assigneeId = filters.assigneeId;

  const rows = await db.task.findMany({
    where,
    include: taskInclude,
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  });
  const tasks = rows.map(toBoardTask);
  const columns: BoardColumn[] = TASK_COLUMNS.map((c) => ({ ...c, tasks: tasks.filter((t) => t.status === c.status) }));
  return { tasks, columns };
}

/** Workstreams (with progress), subteams and members for the filter bar and task editor. */
export async function getBoardMeta(clubId: string): Promise<BoardMeta> {
  const [project, subteams, memberships] = await Promise.all([
    db.project.findUnique({
      where: { clubId },
      select: {
        name: true,
        workstreams: {
          orderBy: [{ phase: { order: "asc" } }, { order: "asc" }],
          select: {
            id: true,
            name: true,
            phase: { select: { id: true, name: true, order: true } },
            subteam: { select: { id: true, name: true, color: true } },
            tasks: { select: { status: true } },
          },
        },
      },
    }),
    db.subteam.findMany({
      where: { clubId },
      orderBy: { order: "asc" },
      select: { id: true, name: true, color: true },
    }),
    db.membership.findMany({
      where: { clubId },
      orderBy: { user: { name: "asc" } },
      select: { id: true, title: true, user: { select: { name: true } }, subteam: { select: { id: true, name: true } } },
    }),
  ]);

  return {
    projectName: project?.name ?? null,
    workstreams: (project?.workstreams ?? []).map((w) => ({
      id: w.id,
      name: w.name,
      phase: w.phase,
      subteam: w.subteam,
      done: w.tasks.filter((t) => t.status === "DONE").length,
      total: w.tasks.length,
    })),
    subteams,
    members: memberships.map((m) => ({ id: m.id, name: m.user.name, title: m.title, subteam: m.subteam })),
  };
}
