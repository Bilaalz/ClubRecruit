import type { BadgeTone } from "@/components/ui/badge";
import type { ApplicationStatus, PostingStatus, TaskStatus, WorkstreamStatus } from "@/generated/prisma/enums";

/**
 * Shared status → badge tone maps and a label helper.
 * Keep this file small and dependency-free; every stage imports it.
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

export const taskStatusTone: Record<TaskStatus, BadgeTone> = {
  BACKLOG: "outline",
  TODO: "neutral",
  IN_PROGRESS: "ink",
  IN_REVIEW: "warn",
  DONE: "ok",
};

export const workstreamStatusTone: Record<WorkstreamStatus, BadgeTone> = {
  PLANNED: "neutral",
  ACTIVE: "ink",
  BLOCKED: "bad",
  DONE: "ok",
};

/** `UNDER_REVIEW` → `Under review`. Works for any SCREAMING_SNAKE enum value. */
export function labelFor(status: string) {
  const words = status.toLowerCase().split("_");
  return words.map((w, i) => (i === 0 ? w.charAt(0).toUpperCase() + w.slice(1) : w)).join(" ");
}
