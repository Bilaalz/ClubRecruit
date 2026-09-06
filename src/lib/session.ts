import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { cache } from "react";
import { db } from "@/lib/db";

export const SESSION_COOKIE = "cr_session";
const SESSION_DAYS = 30;

/** Everything pages need about the signed-in user, loaded once per request. */
export const userInclude = {
  university: true,
  memberships: {
    include: { club: { select: { id: true, slug: true, name: true } }, subteam: true },
    orderBy: { joinedAt: "asc" as const },
  },
} as const;

function cookieOptions(expires: Date) {
  return {
    path: "/",
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    expires,
  };
}

/** Create a DB-backed session for a user and set the cookie. Call from a server action or route handler only. */
export async function createSession(userId: string) {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86_400_000);
  await db.session.create({ data: { token, userId, expiresAt } });
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, cookieOptions(expiresAt));
  return token;
}

/** The user behind the session cookie, or null. Memoised per request. Expired sessions are deleted on sight. */
export const getSessionUser = cache(async () => {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = await db.session.findUnique({
    where: { token },
    include: { user: { include: userInclude } },
  });
  if (!session) return null;
  if (session.expiresAt < new Date()) {
    await db.session.delete({ where: { id: session.id } }).catch(() => {});
    return null;
  }
  return session.user;
});

/** Delete the current session row (if any) and clear the cookie. Call from a server action or route handler only. */
export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await db.session.deleteMany({ where: { token } });
  jar.delete(SESSION_COOKIE);
}
