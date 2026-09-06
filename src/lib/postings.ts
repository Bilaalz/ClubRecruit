import { db } from "@/lib/db";

/** Full posting detail for the public page. */
export async function getPosting(id: string) {
  return db.posting.findUnique({
    where: { id },
    include: {
      club: {
        select: {
          id: true,
          slug: true,
          name: true,
          tagline: true,
          university: { select: { name: true } },
        },
      },
      subteam: true,
      _count: { select: { applications: true } },
    },
  });
}

/** The current user's application to a posting, if any. */
export async function getMyApplication(postingId: string, userId: string) {
  return db.application.findUnique({
    where: { postingId_applicantId: { postingId, applicantId: userId } },
    select: { id: true, status: true, createdAt: true },
  });
}

/** All postings for a club, newest first, with applicant counts. */
export async function listClubPostings(clubId: string) {
  return db.posting.findMany({
    where: { clubId },
    orderBy: [{ createdAt: "desc" }],
    include: { subteam: true, _count: { select: { applications: true } } },
  });
}

/** A posting scoped to a club (for edit forms) — null if it belongs elsewhere. */
export async function getClubPosting(clubId: string, id: string) {
  return db.posting.findFirst({ where: { id, clubId } });
}

/** Subteam options for posting forms. */
export async function listSubteamOptions(clubId: string) {
  return db.subteam.findMany({
    where: { clubId },
    orderBy: { order: "asc" },
    select: { id: true, name: true, color: true },
  });
}

/** Short date for "closes" columns. */
export function formatDate(d: Date | null | undefined) {
  if (!d) return "—";
  return d.toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric" });
}

/** `yyyy-mm-dd` for `<input type="date">`. */
export function toDateInput(d: Date | null | undefined) {
  if (!d) return "";
  return d.toISOString().slice(0, 10);
}
