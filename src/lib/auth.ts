import { cookies } from "next/headers";
import { cache } from "react";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import type { MembershipRole } from "@/generated/prisma/enums";

/**
 * Demo auth (Stage 1–6). A cookie holds the current persona's user id.
 * Stage 7 swaps the internals for real sessions; keep these exports stable.
 */
export const DEMO_COOKIE = "cr_demo_user";
export const DEFAULT_DEMO_EMAIL = "priya@utoronto.ca";

export type CurrentUser = NonNullable<Awaited<ReturnType<typeof loadUser>>>;

async function loadUser(userId: string | undefined) {
  const where = userId ? { id: userId } : { email: DEFAULT_DEMO_EMAIL };
  return db.user.findUnique({
    where,
    include: {
      university: true,
      memberships: {
        include: { club: { select: { id: true, slug: true, name: true } }, subteam: true },
        orderBy: { joinedAt: "asc" },
      },
    },
  });
}

/** Current user or null. Memoised per request. */
export const getCurrentUser = cache(async () => {
  const jar = await cookies();
  const id = jar.get(DEMO_COOKIE)?.value;
  const user = await loadUser(id);
  if (!user && id) return loadUser(undefined); // stale cookie → fall back to default persona
  return user;
});

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/switch-user");
  return user;
}

export function membershipFor(user: CurrentUser, clubId: string) {
  return user.memberships.find((m) => m.clubId === clubId) ?? null;
}

export const ADMIN_ROLES: MembershipRole[] = ["OWNER", "ADMIN"];

export function isClubAdmin(user: CurrentUser, clubId: string) {
  const m = membershipFor(user, clubId);
  return !!m && ADMIN_ROLES.includes(m.role);
}

export async function requireClubMember(clubId: string) {
  const user = await requireUser();
  const membership = membershipFor(user, clubId);
  if (!membership) throw new Error("You are not a member of this club.");
  return { user, membership };
}

export async function requireClubAdmin(clubId: string) {
  const user = await requireUser();
  const membership = membershipFor(user, clubId);
  if (!membership || !ADMIN_ROLES.includes(membership.role)) {
    throw new Error("You need to be a club admin to do that.");
  }
  return { user, membership };
}

/** Resolve a club by slug and the current user's relationship to it. */
export async function getClubContext(slug: string) {
  const club = await db.club.findUnique({ where: { slug } });
  if (!club) return null;
  const user = await getCurrentUser();
  const membership = user ? membershipFor(user, club.id) : null;
  return {
    club,
    user,
    membership,
    isMember: !!membership,
    isAdmin: !!membership && ADMIN_ROLES.includes(membership.role),
  };
}
