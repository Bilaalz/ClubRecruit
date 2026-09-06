import { NextResponse, type NextRequest } from "next/server";
import { safeNext } from "@/lib/auth";
import { destroySession } from "@/lib/session";

/**
 * GET /logout?next=… — clears the session cookie (and row) and lands on /login.
 * Used by `requireUser()` to recover from a stale cookie; the user menu uses the `logout` server action.
 */
export async function GET(req: NextRequest) {
  await destroySession();
  const next = safeNext(req.nextUrl.searchParams.get("next"));
  const url = new URL("/login", req.url);
  if (next !== "/dashboard") url.searchParams.set("next", next);
  return NextResponse.redirect(url);
}
