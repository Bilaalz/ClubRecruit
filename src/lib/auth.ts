import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSessionUser, SESSION_COOKIE } from "@/lib/session";
import type { MembershipRole } from "@/generated/prisma/enums";

/**
 * Auth helpers. Backed by the `Session` table + `cr_session` cookie (see `session.ts`).
 * Signed out means `null`; there is no default persona.
 */
export type CurrentUser = NonNullable<Awaited<ReturnType<typeof getSessionUser>>>;

/** Current user or null. Memoised per request. */
export const getCurrentUser = getSessionUser;

/** Path of the current request, as stamped by `proxy.ts`. Falls back to `/dashboard`. */
async function currentPath() {
  const h = await headers();
  const p = h.get("x-pathname");
  return p && p.startsWith("/") ? p : "/dashboard";
}

/** Signed-in user, or redirect to `/login?next=<here>`. A stale cookie is cleared via `/logout` first. */
export async function requireUser() {
  const user = await getCurrentUser();
  if (user) return user;
  const next = encodeURIComponent(await currentPath());
  const jar = await cookies();
  if (jar.get(SESSION_COOKIE)) redirect(`/logout?next=${next}`);
  redirect(`/login?next=${next}`);
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

// ───────────────────────── Signup domain policy (pure) ─────────────────────────

export type UniversityDomains = { domain: string; altDomains: string[] };

/** The university whose `domain` or `altDomains` matches the email's domain, or null. Case-insensitive. */
export function universityForEmail<U extends UniversityDomains>(email: string, universities: U[]): U | null {
  const at = email.lastIndexOf("@");
  if (at < 1 || at === email.length - 1) return null;
  const domain = email.slice(at + 1).trim().toLowerCase();
  return universities.find((u) => u.domain.toLowerCase() === domain || u.altDomains.some((d) => d.toLowerCase() === domain)) ?? null;
}

export function isAllowedEmail(email: string, universities: UniversityDomains[]) {
  return universityForEmail(email, universities) !== null;
}

/** Only allow same-origin relative paths as post-login destinations. */
export function safeNext(next: unknown, fallback = "/dashboard") {
  if (typeof next !== "string") return fallback;
  if (!next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return fallback;
  if (next === "/login" || next === "/signup" || next.startsWith("/login?") || next.startsWith("/signup?") || next.startsWith("/logout")) return fallback;
  return next;
}
