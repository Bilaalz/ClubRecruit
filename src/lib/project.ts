import { db } from "@/lib/db";
import type { WorkstreamStatus } from "@/generated/prisma/enums";

/**
 * Stage 3 — project plan queries.
 *
 * Everything returned here is plain, serialisable data so it can be handed
 * straight to the client-side FlowCanvas. Types are exported for
 * `import type` use in client components (type imports are erased, so they
 * do not drag Prisma into the browser bundle).
 */

export type PlanSubteam = { id: string; name: string; color: string };

export type PlanWorkstream = {
  id: string;
  name: string;
  description: string | null;
  status: WorkstreamStatus;
  order: number;
  phaseId: string | null;
  subteam: PlanSubteam | null;
  /** ids of workstreams this one depends on */
  dependsOn: string[];
  /** ids of workstreams that depend on this one (reverse of dependsOn) */
  blockedBy: string[];
  taskTotal: number;
  taskDone: number;
};

export type PlanPhase = {
  id: string;
  name: string;
  description: string | null;
  order: number;
  startDate: Date | null;
  endDate: Date | null;
  workstreams: PlanWorkstream[];
};

export type ProjectPlan = {
  id: string;
  clubId: string;
  name: string;
  summary: string;
  goals: string[];
  targetDate: Date | null;
  phases: PlanPhase[];
  /** workstreams with no phase (phase deleted, or never assigned) */
  unphased: PlanWorkstream[];
  /** every workstream, in phase order then card order */
  workstreams: PlanWorkstream[];
  taskTotal: number;
  taskDone: number;
};

export async function getProjectForClub(clubId: string): Promise<ProjectPlan | null> {
  const project = await db.project.findUnique({
    where: { clubId },
    include: {
      phases: { orderBy: [{ order: "asc" }, { name: "asc" }] },
      workstreams: {
        orderBy: [{ order: "asc" }, { name: "asc" }],
        include: {
          subteam: { select: { id: true, name: true, color: true } },
          _count: { select: { tasks: true } },
        },
      },
    },
  });
  if (!project) return null;

  const wsIds = project.workstreams.map((w) => w.id);
  const doneRows = wsIds.length
    ? await db.task.groupBy({
        by: ["workstreamId"],
        where: { workstreamId: { in: wsIds }, status: "DONE" },
        _count: { _all: true },
      })
    : [];
  const doneByWs = new Map<string, number>();
  for (const row of doneRows) if (row.workstreamId) doneByWs.set(row.workstreamId, row._count._all);

  // Reverse dependency index. Only keep references to workstreams that exist.
  const known = new Set(wsIds);
  const blockedBy = new Map<string, string[]>();
  for (const w of project.workstreams) {
    for (const dep of w.dependsOn) {
      if (!known.has(dep)) continue;
      const list = blockedBy.get(dep) ?? [];
      list.push(w.id);
      blockedBy.set(dep, list);
    }
  }

  const shaped: PlanWorkstream[] = project.workstreams.map((w) => ({
    id: w.id,
    name: w.name,
    description: w.description,
    status: w.status,
    order: w.order,
    phaseId: w.phaseId,
    subteam: w.subteam,
    dependsOn: w.dependsOn.filter((d) => known.has(d)),
    blockedBy: blockedBy.get(w.id) ?? [],
    taskTotal: w._count.tasks,
    taskDone: doneByWs.get(w.id) ?? 0,
  }));

  const byPhase = new Map<string, PlanWorkstream[]>();
  const unphased: PlanWorkstream[] = [];
  for (const w of shaped) {
    if (w.phaseId && project.phases.some((p) => p.id === w.phaseId)) {
      const list = byPhase.get(w.phaseId) ?? [];
      list.push(w);
      byPhase.set(w.phaseId, list);
    } else {
      unphased.push(w);
    }
  }

  const phases: PlanPhase[] = project.phases.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    order: p.order,
    startDate: p.startDate,
    endDate: p.endDate,
    workstreams: byPhase.get(p.id) ?? [],
  }));

  const ordered = [...phases.flatMap((p) => p.workstreams), ...topoLayout(unphased)];

  return {
    id: project.id,
    clubId: project.clubId,
    name: project.name,
    summary: project.summary,
    goals: project.goals,
    targetDate: project.targetDate,
    phases,
    unphased: topoLayout(unphased),
    workstreams: ordered,
    taskTotal: ordered.reduce((n, w) => n + w.taskTotal, 0),
    taskDone: ordered.reduce((n, w) => n + w.taskDone, 0),
  };
}

/**
 * Stable topological ordering of a set of workstreams: dependencies come
 * before dependents; ties fall back to `order` then name. Used for the
 * "Unscheduled" column, where there is no phase to impose an order. Cycles
 * (which the actions refuse to save) simply fall through in input order.
 */
export function topoLayout(items: PlanWorkstream[]): PlanWorkstream[] {
  const ids = new Set(items.map((w) => w.id));
  const indeg = new Map<string, number>();
  const out = new Map<string, string[]>();
  for (const w of items) {
    const deps = w.dependsOn.filter((d) => ids.has(d));
    indeg.set(w.id, deps.length);
    for (const d of deps) out.set(d, [...(out.get(d) ?? []), w.id]);
  }
  const byId = new Map(items.map((w) => [w.id, w]));
  const cmp = (a: PlanWorkstream, b: PlanWorkstream) => a.order - b.order || a.name.localeCompare(b.name);
  let ready = items.filter((w) => indeg.get(w.id) === 0).sort(cmp);
  const result: PlanWorkstream[] = [];
  const seen = new Set<string>();
  while (ready.length) {
    const w = ready.shift()!;
    result.push(w);
    seen.add(w.id);
    for (const next of out.get(w.id) ?? []) {
      indeg.set(next, (indeg.get(next) ?? 1) - 1);
      if (indeg.get(next) === 0) ready = [...ready, byId.get(next)!].sort(cmp);
    }
  }
  for (const w of items) if (!seen.has(w.id)) result.push(w);
  return result;
}

/** Subteams of a club with their members and the workstreams they own. */
export async function getSubteamsWithMembers(clubId: string) {
  return db.subteam.findMany({
    where: { clubId },
    orderBy: [{ order: "asc" }, { name: "asc" }],
    include: {
      memberships: {
        orderBy: [{ role: "asc" }, { joinedAt: "asc" }],
        include: { user: { select: { id: true, name: true } } },
      },
      workstreams: {
        orderBy: [{ order: "asc" }, { name: "asc" }],
        select: { id: true, name: true, status: true, phaseId: true },
      },
    },
  });
}

export type SubteamWithMembers = Awaited<ReturnType<typeof getSubteamsWithMembers>>[number];

/** Lightweight subteam list for select inputs. */
export async function getSubteamOptions(clubId: string): Promise<PlanSubteam[]> {
  return db.subteam.findMany({
    where: { clubId },
    orderBy: [{ order: "asc" }, { name: "asc" }],
    select: { id: true, name: true, color: true },
  });
}
