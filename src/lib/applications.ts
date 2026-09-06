import { db } from "@/lib/db";
import type { ApplicationStatus } from "@/generated/prisma/enums";
import { parseTranscript, type TranscriptTurn } from "@/lib/transcript";

export type { TranscriptTurn };

// Status badge tones and labels live in src/lib/status.ts.

/** Timeline steps shown to the applicant. */
export const APPLICATION_STEPS = [
  { key: "submitted", label: "Submitted" },
  { key: "interview", label: "Interview" },
  { key: "review", label: "Under review" },
  { key: "decision", label: "Decision" },
] as const;

/** Index (0..3) of the furthest completed step for a status. */
export function applicationStepIndex(status: ApplicationStatus): number {
  switch (status) {
    case "SUBMITTED":
      return 0;
    case "INTERVIEW_COMPLETE":
      return 1;
    case "UNDER_REVIEW":
      return 2;
    case "ACCEPTED":
    case "REJECTED":
      return 3;
  }
}

// ── Queries ───────────────────────────────────────────────────

export async function getPostingForApply(postingId: string) {
  return db.posting.findUnique({
    where: { id: postingId },
    include: { club: { select: { id: true, slug: true, name: true } }, subteam: { select: { id: true, name: true } } },
  });
}

export async function findApplication(postingId: string, applicantId: string) {
  return db.application.findUnique({
    where: { postingId_applicantId: { postingId, applicantId } },
    include: { resume: { select: { id: true } }, interview: { select: { id: true } } },
  });
}

export async function listMyApplications(userId: string) {
  return db.application.findMany({
    where: { applicantId: userId },
    include: {
      posting: { select: { id: true, title: true, club: { select: { slug: true, name: true } }, subteam: { select: { name: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export type MyApplication = Awaited<ReturnType<typeof listMyApplications>>[number];

/** Full application for the applicant's own view. Never includes the evaluation. */
export async function getMyApplication(applicationId: string, userId: string) {
  const app = await db.application.findUnique({
    where: { id: applicationId },
    include: {
      posting: {
        select: {
          id: true,
          title: true,
          interviewQuestions: true,
          club: { select: { id: true, slug: true, name: true } },
          subteam: { select: { name: true } },
        },
      },
      resume: true,
      interview: true,
    },
  });
  if (!app || app.applicantId !== userId) return null;

  // If accepted, look up the membership so we can show the assigned role/subteam.
  const membership =
    app.status === "ACCEPTED"
      ? await db.membership.findUnique({
          where: { userId_clubId: { userId, clubId: app.posting.club.id } },
          include: { subteam: { select: { name: true } } },
        })
      : null;

  return {
    ...app,
    transcript: app.interview ? parseTranscript(app.interview.transcript) : [],
    membership,
  };
}

export type MyApplicationDetail = NonNullable<Awaited<ReturnType<typeof getMyApplication>>>;

// ── Formatting helpers ───────────────────────────────────────

export function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatDuration(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function formatDate(d: Date) {
  return d.toLocaleDateString("en-CA", { year: "numeric", month: "short", day: "numeric" });
}
