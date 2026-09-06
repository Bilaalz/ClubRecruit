import type { BadgeTone } from "@/components/ui";
import type { WorkstreamStatus } from "@/generated/prisma/enums";

/**
 * Pure helpers shared by the server-rendered sections and the client canvas.
 * No database imports here — this file is safe to import from "use client" code.
 */

export const STATUS_ORDER: WorkstreamStatus[] = ["PLANNED", "ACTIVE", "BLOCKED", "DONE"];

export const STATUS_LABEL: Record<WorkstreamStatus, string> = {
  PLANNED: "Planned",
  ACTIVE: "Active",
  BLOCKED: "Blocked",
  DONE: "Done",
};

/** Local badge tones for workstream status; Stage 8 consolidates into src/lib/status.ts. */
export const STATUS_TONE: Record<WorkstreamStatus, BadgeTone> = {
  PLANNED: "outline",
  ACTIVE: "ink",
  BLOCKED: "warn",
  DONE: "ok",
};

export const FALLBACK_SUBTEAM_COLOR = "#8a867e";

const dateFmt = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
const shortFmt = new Intl.DateTimeFormat("en-US", { month: "short", year: "numeric", timeZone: "UTC" });

export function formatDate(d: Date | string | null | undefined) {
  if (!d) return null;
  return dateFmt.format(typeof d === "string" ? new Date(d) : d);
}

/** "Sep 2026 – Oct 2026", "from Sep 2026", "until Oct 2026" or null. */
export function formatDateRange(start: Date | string | null | undefined, end: Date | string | null | undefined) {
  const s = start ? shortFmt.format(typeof start === "string" ? new Date(start) : start) : null;
  const e = end ? shortFmt.format(typeof end === "string" ? new Date(end) : end) : null;
  if (s && e) return s === e ? s : `${s} – ${e}`;
  if (s) return `from ${s}`;
  if (e) return `until ${e}`;
  return null;
}

/** "YYYY-MM-DD" for <input type="date"> defaults. */
export function toDateInput(d: Date | null | undefined) {
  return d ? d.toISOString().slice(0, 10) : "";
}

export function percent(done: number, total: number) {
  return total === 0 ? 0 : Math.round((done / total) * 100);
}
