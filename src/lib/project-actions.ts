"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireClubAdmin } from "@/lib/auth";
import { WorkstreamStatus } from "@/generated/prisma/enums";

/**
 * Stage 3 — project plan mutations. Every action re-checks that the current
 * persona is an OWNER/ADMIN of the club that owns the record being edited.
 */

// ───────────────────────── helpers ─────────────────────────

const optionalText = z
  .string()
  .trim()
  .transform((s) => (s.length ? s : null));

/** "" → null, "YYYY-MM-DD" → Date (UTC midnight). */
const optionalDate = z
  .string()
  .trim()
  .transform((s, ctx) => {
    if (!s) return null;
    const d = new Date(`${s}T00:00:00.000Z`);
    if (Number.isNaN(d.getTime())) {
      ctx.addIssue({ code: "custom", message: "Invalid date" });
      return z.NEVER;
    }
    return d;
  });

const orderField = z.coerce.number().int().min(0).max(9999).default(0);

const statusField = z.enum(WorkstreamStatus);

function fields(formData: FormData) {
  const out: Record<string, string> = {};
  for (const [k, v] of formData.entries()) if (typeof v === "string" && !(k in out)) out[k] = v;
  return out;
}

function fail(result: { success: false; error: z.ZodError }): never {
  const issue = result.error.issues[0];
  throw new Error(issue ? `${issue.path.join(".") || "form"}: ${issue.message}` : "Invalid input");
}

function revalidateProject(slug: string) {
  revalidatePath(`/clubs/${slug}/project`);
  revalidatePath(`/clubs/${slug}/project/edit`);
  revalidatePath(`/clubs/${slug}`);
  revalidatePath(`/clubs/${slug}/board`);
}

async function adminForClub(clubId: string) {
  const club = await db.club.findUnique({ where: { id: clubId }, select: { id: true, slug: true } });
  if (!club) throw new Error("Club not found.");
  await requireClubAdmin(club.id);
  return club;
}

async function adminForProject(projectId: string) {
  const project = await db.project.findUnique({
    where: { id: projectId },
    select: { id: true, clubId: true, club: { select: { slug: true } } },
  });
  if (!project) throw new Error("Project not found.");
  await requireClubAdmin(project.clubId);
  return { projectId: project.id, clubId: project.clubId, slug: project.club.slug };
}

async function adminForPhase(phaseId: string) {
  const phase = await db.phase.findUnique({
    where: { id: phaseId },
    select: { id: true, projectId: true, project: { select: { clubId: true, club: { select: { slug: true } } } } },
  });
  if (!phase) throw new Error("Phase not found.");
  await requireClubAdmin(phase.project.clubId);
  return { phaseId: phase.id, projectId: phase.projectId, clubId: phase.project.clubId, slug: phase.project.club.slug };
}

async function adminForWorkstream(workstreamId: string) {
  const ws = await db.workstream.findUnique({
    where: { id: workstreamId },
    select: { id: true, projectId: true, project: { select: { clubId: true, club: { select: { slug: true } } } } },
  });
  if (!ws) throw new Error("Workstream not found.");
  await requireClubAdmin(ws.project.clubId);
  return { workstreamId: ws.id, projectId: ws.projectId, clubId: ws.project.clubId, slug: ws.project.club.slug };
}

/** Would adding `deps` to `selfId` create a cycle in the project's dependency graph? */
function createsCycle(selfId: string, deps: string[], graph: Map<string, string[]>) {
  // Walk from each dependency along *its* dependencies; if we reach selfId, it's a cycle.
  const stack = [...deps];
  const seen = new Set<string>();
  while (stack.length) {
    const cur = stack.pop()!;
    if (cur === selfId) return true;
    if (seen.has(cur)) continue;
    seen.add(cur);
    for (const next of graph.get(cur) ?? []) stack.push(next);
  }
  return false;
}

async function resolveDependsOn(projectId: string, selfId: string | null, raw: string[]) {
  const others = await db.workstream.findMany({
    where: { projectId },
    select: { id: true, dependsOn: true },
  });
  const known = new Set(others.map((w) => w.id));
  const deps = Array.from(new Set(raw)).filter((id) => known.has(id) && id !== selfId);
  if (selfId) {
    const graph = new Map(others.map((w) => [w.id, w.dependsOn]));
    if (createsCycle(selfId, deps, graph)) throw new Error("Those dependencies would form a cycle.");
  }
  return deps;
}

async function nextOrder(where: { projectId: string; phaseId?: string | null }, model: "phase" | "workstream") {
  const agg =
    model === "phase"
      ? await db.phase.aggregate({ where: { projectId: where.projectId }, _max: { order: true } })
      : await db.workstream.aggregate({ where: { projectId: where.projectId, phaseId: where.phaseId ?? null }, _max: { order: true } });
  return (agg._max.order ?? -1) + 1;
}

// ───────────────────────── project ─────────────────────────

const projectSchema = z.object({
  name: z.string().trim().min(2, "Give the project a name").max(120),
  summary: z.string().trim().min(1, "Add a one-paragraph summary").max(2000),
  goals: z
    .string()
    .transform((s) =>
      s
        .split(/\r?\n/)
        .map((g) => g.replace(/^[-•*]\s*/, "").trim())
        .filter(Boolean)
        .slice(0, 20),
    ),
  targetDate: optionalDate,
});

export async function createProject(formData: FormData) {
  const f = fields(formData);
  const club = await adminForClub(f.clubId ?? "");
  const parsed = projectSchema.safeParse(f);
  if (!parsed.success) fail(parsed);
  const existing = await db.project.findUnique({ where: { clubId: club.id }, select: { id: true } });
  if (existing) throw new Error("This club already has a project plan.");
  await db.project.create({ data: { clubId: club.id, ...parsed.data } });
  revalidateProject(club.slug);
  redirect(`/clubs/${club.slug}/project`);
}

export async function updateProject(formData: FormData) {
  const f = fields(formData);
  const ctx = await adminForProject(f.projectId ?? "");
  const parsed = projectSchema.safeParse(f);
  if (!parsed.success) fail(parsed);
  await db.project.update({ where: { id: ctx.projectId }, data: parsed.data });
  revalidateProject(ctx.slug);
}

// ───────────────────────── phases ─────────────────────────

const phaseSchema = z.object({
  name: z.string().trim().min(1, "Phase needs a name").max(80),
  description: optionalText,
  startDate: optionalDate,
  endDate: optionalDate,
});

export async function createPhase(formData: FormData) {
  const f = fields(formData);
  const ctx = await adminForProject(f.projectId ?? "");
  const parsed = phaseSchema.safeParse(f);
  if (!parsed.success) fail(parsed);
  const order = await nextOrder({ projectId: ctx.projectId }, "phase");
  await db.phase.create({ data: { projectId: ctx.projectId, order, ...parsed.data } });
  revalidateProject(ctx.slug);
}

export async function updatePhase(formData: FormData) {
  const f = fields(formData);
  const ctx = await adminForPhase(f.phaseId ?? "");
  const parsed = phaseSchema.extend({ order: orderField }).safeParse(f);
  if (!parsed.success) fail(parsed);
  await db.phase.update({ where: { id: ctx.phaseId }, data: parsed.data });
  revalidateProject(ctx.slug);
}

export async function deletePhase(formData: FormData) {
  const f = fields(formData);
  const ctx = await adminForPhase(f.phaseId ?? "");
  // Workstreams keep existing (phaseId → null via onDelete: SetNull) and show up as "Unscheduled".
  await db.phase.delete({ where: { id: ctx.phaseId } });
  revalidateProject(ctx.slug);
}

// ───────────────────────── workstreams ─────────────────────────

const workstreamSchema = z.object({
  name: z.string().trim().min(1, "Workstream needs a name").max(120),
  description: optionalText,
  phaseId: optionalText,
  subteamId: optionalText,
  status: statusField.default("PLANNED"),
  order: orderField,
});

async function checkPhaseAndSubteam(projectId: string, clubId: string, phaseId: string | null, subteamId: string | null) {
  if (phaseId) {
    const phase = await db.phase.findFirst({ where: { id: phaseId, projectId }, select: { id: true } });
    if (!phase) throw new Error("That phase does not belong to this project.");
  }
  if (subteamId) {
    const subteam = await db.subteam.findFirst({ where: { id: subteamId, clubId }, select: { id: true } });
    if (!subteam) throw new Error("That subteam does not belong to this club.");
  }
}

export async function createWorkstream(formData: FormData) {
  const f = fields(formData);
  const ctx = await adminForProject(f.projectId ?? "");
  const parsed = workstreamSchema.safeParse(f);
  if (!parsed.success) fail(parsed);
  const { phaseId, subteamId } = parsed.data;
  await checkPhaseAndSubteam(ctx.projectId, ctx.clubId, phaseId, subteamId);
  const dependsOn = await resolveDependsOn(ctx.projectId, null, formData.getAll("dependsOn").map(String));
  const order = f.order?.trim() ? parsed.data.order : await nextOrder({ projectId: ctx.projectId, phaseId }, "workstream");
  await db.workstream.create({
    data: { projectId: ctx.projectId, ...parsed.data, order, dependsOn },
  });
  revalidateProject(ctx.slug);
}

export async function updateWorkstream(formData: FormData) {
  const f = fields(formData);
  const ctx = await adminForWorkstream(f.workstreamId ?? "");
  const parsed = workstreamSchema.safeParse(f);
  if (!parsed.success) fail(parsed);
  const { phaseId, subteamId } = parsed.data;
  await checkPhaseAndSubteam(ctx.projectId, ctx.clubId, phaseId, subteamId);
  const dependsOn = await resolveDependsOn(ctx.projectId, ctx.workstreamId, formData.getAll("dependsOn").map(String));
  await db.workstream.update({ where: { id: ctx.workstreamId }, data: { ...parsed.data, dependsOn } });
  revalidateProject(ctx.slug);
}

export async function deleteWorkstream(formData: FormData) {
  const f = fields(formData);
  const ctx = await adminForWorkstream(f.workstreamId ?? "");
  const dependents = await db.workstream.findMany({
    where: { projectId: ctx.projectId, dependsOn: { has: ctx.workstreamId } },
    select: { id: true, dependsOn: true },
  });
  await db.$transaction([
    ...dependents.map((d) =>
      db.workstream.update({
        where: { id: d.id },
        data: { dependsOn: d.dependsOn.filter((id) => id !== ctx.workstreamId) },
      }),
    ),
    // Tasks keep existing (workstreamId → null via onDelete: SetNull).
    db.workstream.delete({ where: { id: ctx.workstreamId } }),
  ]);
  revalidateProject(ctx.slug);
}

/** Inline status change from the detail panel. Plain-argument action so client code can call it directly. */
export async function setWorkstreamStatus(input: { workstreamId: string; status: string }) {
  const parsed = z.object({ workstreamId: z.string().min(1), status: statusField }).safeParse(input);
  if (!parsed.success) fail(parsed);
  const ctx = await adminForWorkstream(parsed.data.workstreamId);
  await db.workstream.update({ where: { id: ctx.workstreamId }, data: { status: parsed.data.status } });
  revalidateProject(ctx.slug);
}
