import { NextResponse, type NextRequest } from "next/server";

/**
 * Optimistic auth gate: checks only for the presence of the session cookie (no DB here).
 * `requireUser()` in pages does the real check and handles stale cookies via `/logout`.
 */
const SESSION_COOKIE = "cr_session";

const PUBLIC_PATHS = [
  /^\/$/,
  /^\/login$/,
  /^\/signup$/,
  /^\/logout$/,
  /^\/clubs\/[^/]+$/, // club overview only; /project, /board, /manage… stay private
  /^\/postings\/[^/]+$/, // posting detail only; /apply stays private
];

export function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const signedIn = !!req.cookies.get(SESSION_COOKIE)?.value;
  const isAuthPage = pathname === "/login" || pathname === "/signup";

  if (signedIn && isAuthPage) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  if (!signedIn && !PUBLIC_PATHS.some((re) => re.test(pathname))) {
    const url = new URL("/login", req.url);
    url.searchParams.set("next", pathname + search);
    return NextResponse.redirect(url);
  }

  // Let server code know where it is, so `requireUser()` can build a `next` param.
  const headers = new Headers(req.headers);
  headers.set("x-pathname", pathname + search);
  return NextResponse.next({ request: { headers } });
}

export const config = {
  // Everything except Next internals, the favicon, and files with an extension.
  matcher: ["/((?!_next/|favicon\\.ico|.*\\..*).*)"],
};
