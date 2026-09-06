import { db } from "@/lib/db";
import { ApplicationStatus } from "@/generated/prisma/enums";

/*
 * Stage 5 — review pipeline queries and presentation helpers.
 * Badge tones and labels live in src/lib/status.ts; Json guards in src/lib/transcript.ts.
 */

// ───────────────────────── Status order ─────────────────────────

export const STATUS_ORDER: ApplicationStatus[] = [
  "SUBMITTED",
  "INTERVIEW_COMPLETE",
  "UNDER_REVIEW",
  "ACCEPTED",
  "REJECTED",
];

export function isApplicationStatus(value: unknown): value is ApplicationStatus {
  return typeof value === "string" && value in ApplicationStatus;
}

// ───────────────────────── Formatting ─────────────────────────

export function formatRelative(date: Date, now = new Date()) {
  const diffSec = Math.round((now.getTime() - date.getTime()) / 1000);
  const abs = Math.abs(diffSec);
  const future = diffSec < 0;
  const units: Array<[label: string, secs: number]> = [
    ["year", 31_536_000],
    ["month", 2_592_000],
    ["week", 604_800],
    ["day", 86_400],
    ["hour", 3_600],
    ["minute", 60],
  ];
  for (const [label, secs] of units) {
    if (abs >= secs) {
      const n = Math.floor(abs / secs);
      const word = `${n} ${label}${n === 1 ? "" : "s"}`;
      return future ? `in ${word}` : `${word} ago`;
    }
  }
  return "just now";
}

export function formatDate(d: Date | null | undefined) {
  if (!d) return "—";
  return d.toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric" });
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** 125 → `2:05` */
export function formatClock(totalSec: number) {
  const m = Math.floor(totalSec / 60);
  const s = Math.max(0, Math.round(totalSec - m * 60));
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// ───────────────────────── Queries ─────────────────────────

export type PipelineSort = "score" | "newest";

export type PipelineFilters = {
  postingId?: string;
  status?: ApplicationStatus;
  sort?: PipelineSort;
};

/** Applications across the club's postings, filtered and sorted for the pipeline table. */
export async function listPipeline(clubId: string, filters: PipelineFilters = {}) {
  const apps = await db.application.findMany({
    where: {
      posting: { clubId, ...(filters.postingId ? { id: filters.postingId } : {}) },
      ...(filters.status ? { status: filters.status } : {}),
    },
    include: {
      applicant: { select: { id: true, name: true, email: true, program: true, year: true } },
      posting: { select: { id: true, title: true, subteam: { select: { id: true, name: true, color: true } } } },
      evaluation: { select: { overallScore: true, recommendation: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  if (filters.sort === "newest") return apps; // already newest first

  // Default: AI score desc (unscored last), then newest.
  return [...apps].sort((a, b) => {
    const sa = a.evaluation?.overallScore ?? -1;
    const sb = b.evaluation?.overallScore ?? -1;
    if (sb !== sa) return sb - sa;
    return b.createdAt.getTime() - a.createdAt.getTime();
  });
}

export type PipelineRow = Awaited<ReturnType<typeof listPipeline>>[number];

/** Count per status (respecting the posting filter only). Missing statuses are 0. */
export async function pipelineCounts(clubId: string, postingId?: string) {
  const grouped = await db.application.groupBy({
    by: ["status"],
    where: { posting: { clubId, ...(postingId ? { id: postingId } : {}) } },
    _count: { _all: true },
  });
  const counts = Object.fromEntries(STATUS_ORDER.map((s) => [s, 0])) as Record<ApplicationStatus, number>;
  for (const g of grouped) counts[g.status] = g._count._all;
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  return { counts, total };
}

/** Posting options for the pipeline filter, newest first. */
export async function listPostingOptions(clubId: string) {
  return db.posting.findMany({
    where: { clubId },
    orderBy: { createdAt: "desc" },
    select: { id: true, title: true, status: true },
  });
}

/** Subteam options for the accept form. */
export async function listSubteamOptions(clubId: string) {
  return db.subteam.findMany({
    where: { clubId },
    orderBy: { order: "asc" },
    select: { id: true, name: true, color: true },
  });
}

/** Full application for the review page. Returns null when it does not belong to the club. */
export async function getReviewApplication(clubId: string, id: string) {
  const app = await db.application.findUnique({
    where: { id },
    include: {
      applicant: { select: { id: true, name: true, email: true, program: true, year: true, bio: true } },
      posting: {
        select: {
          id: true,
          clubId: true,
          title: true,
          status: true,
          subteamId: true,
          subteam: { select: { id: true, name: true, color: true } },
        },
      },
      resume: true,
      interview: true,
      evaluation: true,
    },
  });
  if (!app || app.posting.clubId !== clubId) return null;
  return app;
}

export type ReviewApplication = NonNullable<Awaited<ReturnType<typeof getReviewApplication>>>;

/** Existing membership for the applicant in this club (so Accept can say "already a member"). */
export async function getApplicantMembership(userId: string, clubId: string) {
  return db.membership.findUnique({
    where: { userId_clubId: { userId, clubId } },
    select: { id: true, role: true, title: true, subteam: { select: { id: true, name: true } } },
  });
}
