# ClubRecruit — Project Overview

ClubRecruit is a platform for university clubs to recruit students and run their work with a clear workflow. A club posts roles, students apply with a resume and a recorded interview, an AI evaluates the interview, club admins review and accept applicants, and accepted members get tasks on a kanban board that is tied to the club's project plan.

**Scope:** demo quality. Built properly (real DB, real data flow, typed end to end) but not hardened for production. Resume files and interview recordings are represented by stored metadata plus sample content; the "upload" and "record" steps are simulated.

## Visual identity

- Palette: **cream white** (`#F6F1E7` background, `#FBF8F1` surfaces) and **black** (`#111111` text, `#000000` primary). Accents stay within warm greys; one muted ink accent (`#2B2B2B`) for hover states.
- Typography: a serif display face for headings (Fraunces via `next/font`), a clean sans for body (Inter).
- Feel: editorial, high contrast, generous whitespace, thin 1px black rules, no drop shadows heavier than a hairline.
- Design tokens live in `src/app/globals.css` under `@theme`. UI primitives live in `src/components/ui/`.

## Tech stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router, Server Components, Server Actions), TypeScript |
| Styling | Tailwind CSS v4 with custom tokens |
| Database | PostgreSQL 16 via Docker Compose |
| ORM | Prisma |
| AI | `@anthropic-ai/sdk` when `ANTHROPIC_API_KEY` is set; deterministic mock scorer otherwise |
| Auth | Session cookie with domain-restricted university email login (Stage 7). Stages 1–6 were built against a demo persona switcher. |

## Conventions

- Data access and mutations live in `src/lib/<domain>.ts` (queries) and `src/lib/<domain>-actions.ts` (`'use server'` actions). Pages stay thin.
- Every server action re-checks authorization with `requireClubAdmin(clubId)` / `requireUser()` from `src/lib/auth.ts`.
- Route params are Promises in this Next.js version: `const { slug } = await params`.
- After a mutation call `revalidatePath` for the affected pages.
- Prefer server components. Use `'use client'` only for interactivity (drag and drop, forms with local state, the flow diagram).
- Demo content (sample resumes, transcripts) lives in `prisma/seed/`.

## Route map

| Route | Who | Purpose |
| --- | --- | --- |
| `/` | everyone | Landing page: hero, Recruit · Evaluate · Build, demo accounts |
| `/dashboard` | student | My clubs, my applications, open postings at my university |
| `/login`, `/signup` | everyone | University-email login and sign-up (Stage 7) |
| `/clubs/[slug]` | everyone | Club public page: about, subteams, open postings |
| `/postings/[id]` | everyone | Posting detail + Apply button |
| `/postings/[id]/apply` | student | Apply: resume → interview → done |
| `/applications` | student | My applications and their status |
| `/applications/[id]` | student | One application: timeline, resume, transcript, decision |
| `/clubs/[slug]/manage` | club admin | Club dashboard: stats, recent applicants, quick links |
| `/clubs/[slug]/manage/postings` | club admin | Postings list + create/edit/close |
| `/clubs/[slug]/manage/applications` | club admin | Applicant pipeline across postings |
| `/clubs/[slug]/manage/applications/[id]` | club admin | Resume, transcript, AI evaluation, accept/reject/assign |
| `/clubs/[slug]/manage/settings` | club admin | Club details and subteams |
| `/clubs/[slug]/members` | members | Roster grouped by subteam |
| `/clubs/[slug]/project` | members | Project plan: phases, workstreams, subteams, dependency flow |
| `/clubs/[slug]/board` | members | Kanban board of tasks, filterable by workstream/subteam |

## Data model (summary)

See `prisma/schema.prisma` for the source of truth.

- **University** → has Users and Clubs; `domain` drives signup restriction.
- **User** ↔ **Club** through **Membership** (role: OWNER / ADMIN / LEAD / MEMBER, optional Subteam and title).
- **Club** has **Subteams**, **Postings**, one **Project**.
- **Posting** has **Applications**. Each Application has one **Resume**, one **Interview** (transcript), one **Evaluation** (AI).
- **Project** has **Phases** and **Workstreams**. A Workstream belongs to a Subteam and may depend on other Workstreams (this is the visual flow).
- **Task** belongs to a Club, optionally a Workstream, optionally an assignee (Membership). Tasks are what the kanban board shows.

## Stages

| # | Stage | Doc | Depends on | Status |
| --- | --- | --- | --- | --- |
| 1 | Foundation: scaffold, DB, schema, seed, shell, demo auth | [01-foundation.md](01-foundation.md) | — | Complete |
| 2 | Clubs & postings | [02-clubs-and-postings.md](02-clubs-and-postings.md) | 1 | Complete |
| 3 | Project plan & flow | [03-project-plan.md](03-project-plan.md) | 1 | Complete |
| 4 | Applications, interview, AI evaluation | [04-applications.md](04-applications.md) | 1 | Complete |
| 5 | Review / accept / assign role | [05-review-flow.md](05-review-flow.md) | 1 (reads 4's tables) | Complete |
| 6 | Task board | [06-task-board.md](06-task-board.md) | 1 | Complete |
| 7 | Auth: university email login | [07-auth.md](07-auth.md) | 1–6 | Complete |
| 8 | UI polish | [08-ui-polish.md](08-ui-polish.md) | 1–7 | Complete |

Stages 2–6 are independent of each other and are built in parallel, each owning distinct files (listed in each stage doc). Stage 1 must be complete first because it defines the schema, seed, auth helpers and UI primitives everyone shares.
