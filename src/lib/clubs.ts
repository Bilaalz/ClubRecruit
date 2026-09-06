import { db } from "@/lib/db";
import type { CurrentUser } from "@/lib/auth";

/** Muted palette for subteam colors. Stays legible on cream. */
export const SUBTEAM_COLORS = [
  "#3B5B7C", // slate blue
  "#7C5A3B", // umber
  "#5F7C3B", // moss
  "#7C3B5F", // plum
  "#3B7C74", // teal
  "#7C6E3B", // ochre
  "#5B3B7C", // violet
  "#6B6B6B", // grey
] as const;

/** Club header + counts, used by the club layout. */
export async function getClubHeader(slug: string) {
  return db.club.findUnique({
    where: { slug },
    include: {
      university: { select: { id: true, name: true } },
      _count: { select: { memberships: true } },
    },
  });
}

/** Public overview: description, subteams with member counts, open postings. */
export async function getClubOverview(clubId: string) {
  const [subteams, openPostings] = await Promise.all([
    db.subteam.findMany({
      where: { clubId },
      orderBy: { order: "asc" },
      include: { _count: { select: { memberships: true } } },
    }),
    db.posting.findMany({
      where: { clubId, status: "OPEN" },
      orderBy: [{ closesAt: "asc" }, { createdAt: "desc" }],
      include: { subteam: true, _count: { select: { applications: true } } },
    }),
  ]);
  return { subteams, openPostings };
}

/** Roster grouped by subteam (order), with a trailing "No subteam" bucket. */
export async function getClubRoster(clubId: string) {
  const [subteams, memberships] = await Promise.all([
    db.subteam.findMany({ where: { clubId }, orderBy: { order: "asc" } }),
    db.membership.findMany({
      where: { clubId },
      include: { user: { select: { id: true, name: true, email: true, program: true, year: true } } },
      orderBy: [{ role: "asc" }, { joinedAt: "asc" }],
    }),
  ]);
  const groups = subteams.map((s) => ({
    subteam: s,
    members: memberships.filter((m) => m.subteamId === s.id),
  }));
  const unassigned = memberships.filter((m) => !m.subteamId);
  return { groups, unassigned, total: memberships.length };
}

/** Admin dashboard: stats + newest applicants. */
export async function getClubManageSummary(clubId: string) {
  const [openPostings, pipeline, members, tasksInProgress, recentApplicants] = await Promise.all([
    db.posting.count({ where: { clubId, status: "OPEN" } }),
    db.application.count({
      where: { posting: { clubId }, status: { notIn: ["ACCEPTED", "REJECTED"] } },
    }),
    db.membership.count({ where: { clubId } }),
    db.task.count({ where: { clubId, status: "IN_PROGRESS" } }),
    db.application.findMany({
      where: { posting: { clubId } },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        applicant: { select: { id: true, name: true } },
        posting: { select: { id: true, title: true } },
        evaluation: { select: { overallScore: true, recommendation: true } },
      },
    }),
  ]);
  return { stats: { openPostings, pipeline, members, tasksInProgress }, recentApplicants };
}

/** Club + subteams for the settings form. */
export async function getClubSettings(clubId: string) {
  return db.club.findUnique({
    where: { id: clubId },
    include: {
      subteams: {
        orderBy: { order: "asc" },
        include: { _count: { select: { memberships: true, postings: true, workstreams: true } } },
      },
    },
  });
}

/** Everything the student dashboard needs for the current user. */
export async function getDashboardData(user: CurrentUser) {
  const [clubs, applications, openPostings] = await Promise.all([
    db.membership.findMany({
      where: { userId: user.id },
      orderBy: { joinedAt: "asc" },
      include: {
        subteam: { select: { id: true, name: true, color: true } },
        club: {
          select: {
            id: true,
            slug: true,
            name: true,
            tagline: true,
            _count: { select: { memberships: true, postings: { where: { status: "OPEN" } } } },
          },
        },
      },
    }),
    db.application.findMany({
      where: { applicantId: user.id },
      select: { id: true, status: true },
    }),
    db.posting.findMany({
      where: { status: "OPEN", club: { universityId: user.universityId } },
      orderBy: [{ closesAt: "asc" }, { createdAt: "desc" }],
      include: {
        club: { select: { id: true, slug: true, name: true } },
        subteam: { select: { id: true, name: true, color: true } },
      },
    }),
  ]);

  const byStatus = applications.reduce<Record<string, number>>((acc, a) => {
    acc[a.status] = (acc[a.status] ?? 0) + 1;
    return acc;
  }, {});

  return { clubs, applications: { total: applications.length, byStatus }, openPostings };
}
