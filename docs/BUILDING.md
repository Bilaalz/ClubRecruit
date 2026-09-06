# Building a stage — notes for builders (human or agent)

Read first: `docs/stages/00-overview.md`, `docs/stages/01-foundation.md`, then your stage doc.

## Ground rules

1. **Only touch the files your stage doc lists under "Files owned."** Other stages are being built in parallel in the same working tree. If you truly need a shared change (schema, `src/lib/auth.ts`, `src/components/ui/*`), write it down in a `## Requests` section at the bottom of your stage doc instead of editing the file.
2. **Do not edit `prisma/schema.prisma` or run any `prisma db push` / `db:reset` / `db:seed`.** The database is already pushed and seeded. Read `prisma/seed.ts` to learn what data exists (club slug `utra`, personas, postings, applicants).
3. **Do not run git commands.** Commits happen per stage after review.
4. **Verify with `npm run typecheck`** and by curling pages on the already-running dev server at `http://localhost:3000` (e.g. `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/dashboard`, and `curl -s http://localhost:3000/dashboard | grep -i "error\|exception"` to catch rendered errors). Do not use the browser tools; the pane is shared.
5. Finish with a short summary: routes built, files created, anything left in `## Requests`.

## Stack facts

- Next.js 16 App Router. `params` and `searchParams` are **Promises**: `const { slug } = await params`. Middleware is `proxy.ts` (not needed for stages 2–6). See `node_modules/next/dist/docs/01-app/` when unsure.
- Prisma 7 with the `prisma-client` generator. Import the client from `@/lib/db` (`import { db } from "@/lib/db"`), model types from `@/generated/prisma/client` (`import type { Posting, Prisma } from "@/generated/prisma/client"`), enums (as values or types) from `@/generated/prisma/enums`.
- Auth helpers in `src/lib/auth.ts`: `getCurrentUser()`, `requireUser()`, `requireClubMember(clubId)`, `requireClubAdmin(clubId)`, `getClubContext(slug)` (returns `{ club, user, membership, isMember, isAdmin }` or null), `isClubAdmin(user, clubId)`, `membershipFor(user, clubId)`. Persona switcher at `/switch-user` sets the cookie; default persona is Priya (club owner of `utra`).
- Server actions: put them in `src/lib/<domain>-actions.ts` with `"use server"` at the top; validate with `zod`; call the auth helper; `revalidatePath` afterwards; `redirect` when appropriate.
- Tailwind v4 with tokens: colors `cream`, `cream-2`, `cream-3`, `ink`, `ink-2`, `ink-3`, `ink-4`, `line`, `line-soft`, `ok`, `warn`, `bad`; fonts `font-sans`, `font-serif`; helper classes `.eyebrow`, `.hairline`. No dark mode.
- UI primitives in `src/components/ui` (import from `@/components/ui`): `Button`, `ButtonLink`, `buttonClasses`, `Card`, `CardHeader`, `CardTitle`, `CardBody`, `Badge` (tones: neutral | ink | ok | warn | bad | outline), `Input`, `Textarea`, `Select`, `Label`, `Field`, `PageHeader` (eyebrow/title/description/actions), `EmptyState`, `Stat`, `Avatar`, `initials`. `cn()` from `@/lib/cn`.
- Page container convention: `<div className="mx-auto max-w-7xl px-6 py-10">` (use `max-w-3xl`/`max-w-5xl` for forms and reading pages).
- Style: editorial cream & black, hairline 1px rules, small-caps eyebrows, serif headings, no shadows. Keep it calm; Stage 8 polishes.
- Status color map helper: create `src/lib/status.ts` **only if you are Stage 2**; other stages define local badge tones and Stage 8 will consolidate.
