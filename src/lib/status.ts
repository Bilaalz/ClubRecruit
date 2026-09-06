import type { BadgeTone } from "@/components/ui/badge";
import type {
  ApplicationStatus,
  PostingStatus,
  Recommendation,
  TaskStatus,
  WorkstreamStatus,
} from "@/generated/prisma/enums";

/**
 * Shared status → badge tone maps and a label helper.
 * Keep this file small and dependency-free (types only); every stage imports it,
 * including "use client" components.
 */

export const postingStatusTone: Record<PostingStatus, BadgeTone> = {
  DRAFT: "neutral",
  OPEN: "ok",
  CLOSED: "outline",
};

export const applicationStatusTone: Record<ApplicationStatus, BadgeTone> = {
  SUBMITTED: "neutral",
  INTERVIEW_COMPLETE: "warn",
  UNDER_REVIEW: "ink",
  ACCEPTED: "ok",
  REJECTED: "bad",
};

export const recommendationTone: Record<Recommendation, BadgeTone> = {
  STRONG_YES: "ok",
  YES: "ok",
  MAYBE: "warn",
  NO: "bad",
};

export const taskStatusTone: Record<TaskStatus, BadgeTone> = {
  BACKLOG: "outline",
  TODO: "neutral",
  IN_PROGRESS: "ink",
  IN_REVIEW: "warn",
  DONE: "ok",
};

export const workstreamStatusTone: Record<WorkstreamStatus, BadgeTone> = {
  PLANNED: "outline",
  ACTIVE: "ink",
  BLOCKED: "warn",
  DONE: "ok",
};

/** `UNDER_REVIEW` → `Under review`. Works for any SCREAMING_SNAKE enum value. */
export function labelFor(status: string) {
  const words = status.toLowerCase().split("_");
  return words.map((w, i) => (i === 0 ? w.charAt(0).toUpperCase() + w.slice(1) : w)).join(" ");
}
