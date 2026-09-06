# Stage 7 — Auth: University Email Login

**Goal:** replace the demo persona switcher with real, domain-restricted signup and login.

**Status:** built and verified.

## Design

- Email + password. Hashes are bcrypt (`bcryptjs`, 10 rounds) via `src/lib/password.ts` (`hashPassword`, `verifyPassword`).
- Signup restricted to configured university domains: the part after `@` (lower-cased) must equal `University.domain` or appear in `University.altDomains` (`utoronto.ca`, `mail.utoronto.ca`). Other domains get: *"Sign up with your university email (e.g. @utoronto.ca or @mail.utoronto.ca)"*. The new user is attached to the matching university. The check is a pure function, `universityForEmail` / `isAllowedEmail` in `src/lib/auth.ts`.
- Session: a `Session` table (random 32-byte hex `token`, 30-day `expiresAt`) plus an HTTP-only `cr_session` cookie (`sameSite: lax`, `secure` in production). `src/lib/session.ts` exports `createSession(userId)`, `getSessionUser()` (memoised per request; deletes expired rows on sight) and `destroySession()`.
- `src/lib/auth.ts` keeps every Stage 1 export and signature (`getCurrentUser`, `requireUser`, `requireClubMember`, `requireClubAdmin`, `getClubContext`, `isClubAdmin`, `membershipFor`, `ADMIN_ROLES`, `CurrentUser`) and backs them with the session. Signed out is `null` — there is no default persona any more. `DEMO_COOKIE` and `DEFAULT_DEMO_EMAIL` are gone.
- `requireUser()` redirects to `/login?next=<current path>` (the path comes from an `x-pathname` request header stamped by the proxy). If a cookie is present but its session is invalid, it goes via `GET /logout?next=…` first so the stale cookie is cleared and the proxy cannot bounce the user back to `/dashboard`.
- `src/proxy.ts` is an optimistic, cookie-only gate (no DB): signed-out requests are redirected to `/login?next=…` for everything except `/`, `/login`, `/signup`, `/logout`, `/clubs/[slug]` (overview only) and `/postings/[id]` (detail only), Next internals, the favicon and files with an extension. Signed-in users hitting `/login` or `/signup` are sent to `/dashboard`.
- Server actions in `src/lib/auth-actions.ts`: `signup(prev, formData)`, `login(prev, formData)` (both shaped for `useActionState`, returning `{ error?, fieldErrors? }`) and `logout()`. Login errors are deliberately generic ("Email or password is incorrect."). Both redirect to a validated relative `next` (`safeNext`) or `/dashboard`.
- Pages: `/login` and `/signup` (route group `src/app/(auth)/`), centered `max-w-md` cards with client forms and pending states. The login page lists the demo accounts with a "Use" button that fills the form. `GET /logout` is a route handler (stale-cookie recovery); the header uses the `logout` action.
- Header: `src/components/shell/user-menu.tsx` replaces the persona link — avatar + name opens a small menu with "Signed in as <email>" and a Log out button; signed-out shows Log in / Sign up.

## Demo accounts

Password for every seeded account: **`clubrecruit`** (seed hashes it once and reuses the hash; `npm run db:seed` prints this list).

| Email | Who |
| --- | --- |
| `priya@utoronto.ca` | club owner, UofT Robotics Association |
| `marcus@utoronto.ca` | software lead |
| `aisha@mail.utoronto.ca` | applicant |
| `newstudent@mail.utoronto.ca` | new student, no clubs |

## Files owned / touched

- `prisma/schema.prisma` — added `model Session` and `User.sessions` (additive; pushed with `prisma db push`, client regenerated with `prisma generate`).
- `prisma/seed.ts` — `passwordHash` on every user; clears sessions on reset; prints demo accounts.
- `src/lib/password.ts`, `src/lib/session.ts`, `src/lib/auth.ts`, `src/lib/auth-actions.ts`, `src/proxy.ts`
- `src/app/(auth)/login/{page,login-form}.tsx`, `src/app/(auth)/signup/{page,signup-form}.tsx`, `src/app/(auth)/logout/route.ts`
- `src/components/shell/shell.tsx` (persona link → `<UserMenu>`), `src/components/shell/user-menu.tsx`
- `.env.example` (note only; sessions need no secret), `package.json` (`bcryptjs`, which ships its own types)
- **Removed:** `src/app/switch-user/` — the `/switch-user` route no longer exists. `docs/stages/00-overview.md` (owned by Stage 8) still lists it in the route map and should drop that row and swap it for `/login`, `/signup`, `/logout`.

## Verification

- `npm run typecheck` clean.
- Signed out: `/dashboard` → 307 `/login?next=%2Fdashboard`; `/clubs/utra/board` → 307; `/clubs/utra` → 200; `/login`, `/signup` → 200.
- Signed in (cookie for a real `Session` row): `/dashboard` → 200 and renders Priya; `/login` → 307 `/dashboard`.
- Expired / unknown cookie: `/dashboard` redirects to `/logout?next=%2Fdashboard`, which answers 307 to `/login` with `Set-Cookie: cr_session=; Expires=1970`; the expired row is deleted. Note: because `dashboard/loading.tsx` wraps the page in Suspense, that first hop streams as an RSC `NEXT_REDIRECT` + `<meta http-equiv="refresh">` with HTTP 200 (browsers follow it immediately; plain `curl` shows 200). The proxy still answers a real 307 for the ordinary signed-out case.
- `isAllowedEmail` / `universityForEmail` / `safeNext` unit-checked with `tsx` (case-insensitivity, look-alike domains such as `utoronto.ca.evil.com`, protocol-relative `//evil.com`).

## Requests

- `docs/stages/00-overview.md`: remove the `/switch-user` row from the route map, add `/login`, `/signup`, `/logout`, and update the Auth row of the tech-stack table to "Stage 7: domain-restricted university email login (bcrypt + Session table)".
- `docs/BUILDING.md` still says "Persona switcher at `/switch-user` sets the cookie; default persona is Priya". Signed-out is now `null`; to test as a persona, log in at `/login` (all seeded accounts use the password `clubrecruit`).
- The dev server caches the Prisma client on `globalThis` (`src/lib/db.ts`); after any schema change plus `prisma generate`, the dev server has to be restarted or `db.<newModel>` is undefined in-process.
