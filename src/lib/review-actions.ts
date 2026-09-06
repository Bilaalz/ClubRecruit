"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireClubAdmin } from "@/lib/auth";
import { evaluateApplication } from "@/lib/ai/evaluate";

/*
 * Stage 5 — review decisions. Every action re-checks `requireClubAdmin` against the
 * club that owns the application's posting (never trusting the slug alone).
 */

const idSchema = z.string().min(1).max(64);

/** Load the application + owning club, then assert the caller is an admin of that club. */
async function authorize(applicationId: string) {
  const app = await db.application.findUnique({
    where: { id: applicationId },
    select: {
      id: true,
      status: true,
      applicantId: true,
      posting: {
        select: {
          id: true,
          title: true,
          subteamId: true,
          club: { select: { id: true, slug: true } },
        },
      },
    },
  });
  if (!app) throw new Error("Application not found.");
  await requireClubAdmin(app.posting.club.id);
  return app;
}

function revalidateReviewPaths(slug: string, applicationId: string) {
  revalidatePath(`/clubs/${slug}/manage/applications/${applicationId}`);
  revalidatePath(`/clubs/${slug}/manage/applications`);
  revalidatePath(`/clubs/${slug}/manage`);
  revalidatePath(`/clubs/${slug}/members`);
}

function reviewPath(slug: string, applicationId: string) {
  return `/clubs/${slug}/manage/applications/${applicationId}`;
}

// ───────────────────────── Accept ─────────────────────────

const acceptSchema = z.object({
  applicationId: idSchema,
  title: z.string().trim().min(1, "Role title is required.").max(80),
  subteamId: z.string().trim().max(64).optional().transform((v) => (v ? v : null)),
  role: z.enum(["MEMBER", "LEAD"]),
  note: z.string().trim().max(2000).optional().transform((v) => (v ? v : null)),
});

export async function acceptApplication(formData: FormData) {
  const parsed = acceptSchema.safeParse({
    applicationId: formData.get("applicationId"),
    title: formData.get("title"),
    subteamId: formData.get("subteamId") ?? undefined,
    role: formData.get("role") ?? "MEMBER",
    note: formData.get("note") ?? undefined,
  });
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Invalid form.");
  const input = parsed.data;

  const app = await authorize(input.applicationId);
  const clubId = app.posting.club.id;
  if (app.status === "ACCEPTED" || app.status === "REJECTED") {
    throw new Error("This application has already been decided. Reopen it first.");
  }

  // Subteam must belong to this club (ignore anything else).
  let subteamId: string | null = null;
  if (input.subteamId) {
    const st = await db.subteam.findFirst({ where: { id: input.subteamId, clubId }, select: { id: true } });
    subteamId = st?.id ?? null;
  }

  const now = new Date();
  await db.$transaction(async (tx) => {
    await tx.membership.upsert({
      where: { userId_clubId: { userId: app.applicantId, clubId } },
      create: { userId: app.applicantId, clubId, role: input.role, title: input.title, subteamId },
      // Never demote an existing owner/admin by accepting them for a posting.
      update: { title: input.title, subteamId },
    });
    await tx.application.update({
      where: { id: app.id },
      data: { status: "ACCEPTED", decisionNote: input.note, decidedAt: now },
    });
  });

  // Promote MEMBER → LEAD when asked, without touching OWNER/ADMIN.
  if (input.role === "LEAD") {
    await db.membership.updateMany({
      where: { userId: app.applicantId, clubId, role: "MEMBER" },
      data: { role: "LEAD" },
    });
  }

  revalidateReviewPaths(app.posting.club.slug, app.id);
  redirect(reviewPath(app.posting.club.slug, app.id));
}

// ───────────────────────── Reject ─────────────────────────

const rejectSchema = z.object({
  applicationId: idSchema,
  note: z.string().trim().max(2000).optional().transform((v) => (v ? v : null)),
});

export async function rejectApplication(formData: FormData) {
  const parsed = rejectSchema.safeParse({
    applicationId: formData.get("applicationId"),
    note: formData.get("note") ?? undefined,
  });
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Invalid form.");
  const input = parsed.data;

  const app = await authorize(input.applicationId);
  if (app.status === "ACCEPTED" || app.status === "REJECTED") {
    throw new Error("This application has already been decided. Reopen it first.");
  }

  await db.application.update({
    where: { id: app.id },
    data: { status: "REJECTED", decisionNote: input.note, decidedAt: new Date() },
  });

  revalidateReviewPaths(app.posting.club.slug, app.id);
  redirect(reviewPath(app.posting.club.slug, app.id));
}

// ───────────────────────── Reopen ─────────────────────────

const reopenSchema = z.object({ applicationId: idSchema });

/** Puts a decided application back under review. Existing memberships are left as they are. */
export async function reopenApplication(formData: FormData) {
  const parsed = reopenSchema.safeParse({ applicationId: formData.get("applicationId") });
  if (!parsed.success) throw new Error("Invalid form.");

  const app = await authorize(parsed.data.applicationId);
  if (app.status !== "ACCEPTED" && app.status !== "REJECTED") {
    throw new Error("Only decided applications can be reopened.");
  }

  await db.application.update({
    where: { id: app.id },
    data: { status: "UNDER_REVIEW", decisionNote: null, decidedAt: null },
  });

  revalidateReviewPaths(app.posting.club.slug, app.id);
  redirect(reviewPath(app.posting.club.slug, app.id));
}

// ───────────────────────── AI evaluation ─────────────────────────

const rerunSchema = z.object({ applicationId: idSchema });

/** Runs (or re-runs) Stage 4's evaluator for one application. */
export async function rerunEvaluation(formData: FormData) {
  const parsed = rerunSchema.safeParse({ applicationId: formData.get("applicationId") });
  if (!parsed.success) throw new Error("Invalid form.");

  const app = await authorize(parsed.data.applicationId);
  await evaluateApplication(app.id);

  revalidateReviewPaths(app.posting.club.slug, app.id);
}
