# ClubRecruit

[![CI](https://github.com/Bilaalz/ClubRecruit/actions/workflows/ci.yml/badge.svg)](https://github.com/Bilaalz/ClubRecruit/actions/workflows/ci.yml)

ClubRecruit is a recruiting and team-operations platform for university clubs. A club posts roles per subteam, students apply with a resume and a short recorded interview, Claude scores the interview against a rubric, and club admins review, accept and assign applicants — who then land on a kanban board wired to the club's project plan.

The workflow is modelled on how the University of Toronto World Cup club — which I am a member of — actually recruits and runs a season: hiring into subteams rather than one general intake, a resume-plus-interview funnel with a consistent rubric, and accepted members landing directly on the work their subteam owns.

**ClubRecruit is deployed for that club.** It has run their internal recruiting and hiring workflow over the past year and has processed 30+ applications through the resume-and-interview funnel, the review-and-accept pipeline and the season board.

**This repository is the demo version of it.** The schema, data flow and end-to-end typing are the same as the deployment, but it is seeded with a fictional university, club, members and applicants rather than the club's real data, and the resume upload and interview recording steps are simulated (stored metadata plus sample content, no file storage or media pipeline). See [Limitations](#limitations).

## Stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router, Server Components, Server Actions), TypeScript |
| Styling | Tailwind CSS v4 with cream-and-black design tokens (`src/app/globals.css`) |
| Database | PostgreSQL 16 via Docker Compose, Prisma 7 |
| AI | `@anthropic-ai/sdk` structured output when `ANTHROPIC_API_KEY` is set; deterministic mock scorer otherwise |
| Auth | Session cookie; sign-up restricted to a university's email domain |

## Demo accounts

Password for every account is `clubrecruit`. All four belong to the University of Toronto; the seeded club is the UofT World Cup Club (`/clubs/worldcup`).

| Name | Role | Email |
| --- | --- | --- |
| Priya Sharma | Club owner — reviews the pipeline, accepts applicants, edits the plan | `priya@utoronto.ca` |
| Marcus Lee | Technology lead — works the board and project flow | `marcus@utoronto.ca` |
| Aisha Rahman | Applicant — has applied and finished her interview | `aisha@mail.utoronto.ca` |
| Taylor Nguyen | New student — no club yet, applies from scratch | `newstudent@mail.utoronto.ca` |

## Setup

Requires Node 20+ and Docker.

```bash
npm install
cp .env.example .env      # if present; DATABASE_URL points at the Compose Postgres
npm run db:up             # start PostgreSQL
npm run db:push           # create the schema
npm run db:seed           # university, club, personas, postings, applicants, plan, tasks
npm run dev               # http://localhost:3000
```

Other scripts: `npm run db:reset` (drop, push and re-seed), `npm run db:studio`, `npm run typecheck`, `npm run lint`.

### Real AI evaluation (optional)

Set `ANTHROPIC_API_KEY` in `.env` and interviews are evaluated by Claude with a structured-output rubric (`src/lib/ai/evaluate.ts`). Without a key the deterministic mock in `src/lib/ai/mock.ts` produces plausible scores so the demo works offline. If a Claude call fails, the app falls back to the mock and records the model name accordingly.

## Tests

```bash
npm test          # vitest, single run
npm run test:watch
```

The suite covers the logic the rest of the app leans on, and needs no database or API key:

| Area | What is asserted |
| --- | --- |
| `src/lib/auth.ts` | Signup domain policy (case-insensitivity, alternate domains, look-alike domains such as `utoronto.ca.evil.com`) and `safeNext`, which rejects open-redirect targets like `//evil.com` |
| `src/lib/password.ts` | bcrypt round-trip, per-hash salting, wrong-password and malformed-hash rejection |
| `src/lib/ai/mock.ts` | The deterministic scorer: same input scores the same, rubric is one row per criterion in canonical order, a matching candidate outranks a non-matching one, and the score does not move when only the applicant's name, program or year changes |
| `src/lib/ai/evaluate.ts` | Evaluator selection and degradation, against a stubbed Anthropic client: no key uses the offline scorer without calling out, and an API error, a refusal or a schema-breaking payload each fall back to it — with the fallback recorded in the model name. Also that Claude's rubric is normalised into canonical order |
| `src/lib/transcript.ts` | Guards for the `Json` transcript and rubric columns — malformed rows are dropped, scores clamped |
| `src/lib/project.ts` | `topoLayout`: dependencies before dependents, deterministic tie-breaking, dependency cycles lose no workstreams |
| `src/lib/tasks.ts`, `src/components/board/shared.ts` | Board DTO mapping (dates serialised, server-only fields dropped) and the due-date / overdue helpers |
| `src/lib/status.ts` | Every Prisma enum value has a badge tone, so a schema change cannot silently leave one unmapped |
| `src/lib/review.ts`, `src/lib/applications.ts` | Relative-time, date, byte and duration formatters, and the application timeline step map |

Not covered: the Prisma queries and server actions, which would need a test database to say anything meaningful, and the React components. That is the main gap if this were to go further.

CI ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)) runs `typecheck`, `lint`, the test suite and a production build on every push and pull request. No database is required — every route is server-rendered on demand, so nothing queries Postgres during `next build`.

## Route map

| Route | Who | Purpose |
| --- | --- | --- |
| `/` | everyone | Landing page: what ClubRecruit does, demo accounts |
| `/login`, `/signup` | everyone | University-email login and sign-up |
| `/dashboard` | student | My clubs, my applications, open postings at my university |
| `/clubs/[slug]` | everyone | Club public page: about, subteams, open postings |
| `/postings/[id]` | everyone | Posting detail + Apply button |
| `/postings/[id]/apply` | student | Apply: resume → interview → done |
| `/applications` | student | My applications and their status |
| `/applications/[id]` | student | One application: timeline, resume, transcript, decision |
| `/clubs/[slug]/manage` | club admin | Club dashboard: stats, recent applicants, quick links |
| `/clubs/[slug]/manage/postings` | club admin | Postings list + create/edit/publish/close |
| `/clubs/[slug]/manage/applications` | club admin | Applicant pipeline across postings, sorted by AI score |
| `/clubs/[slug]/manage/applications/[id]` | club admin | Resume, transcript, AI evaluation, accept/reject/assign |
| `/clubs/[slug]/manage/settings` | club admin | Club details and subteams |
| `/clubs/[slug]/members` | members | Roster grouped by subteam |
| `/clubs/[slug]/project` | members | Project plan: phases, workstreams, subteams, dependency flow |
| `/clubs/[slug]/board` | members | Kanban board of tasks, filterable by workstream/subteam |

## How it was built

The app was built in eight stages against a written spec per stage: foundation (schema, seed, app shell, UI primitives), then five feature areas each owning a distinct set of files — clubs and postings, the project plan and dependency flow, applications with interview and AI evaluation, the review / accept / assign pipeline, and the task board — then real authentication, then a UI-consistency pass.

[`ARCHITECTURE.md`](ARCHITECTURE.md) covers the design decisions and what each one cost: why roles live on the membership join table, why `Workstream.dependsOn` is an array column instead of a join table, why sessions are database rows rather than JWTs, why the middleware is an optimisation and not the security boundary, and how the AI evaluator degrades.

Conventions that hold throughout:

- Queries live in `src/lib/<domain>.ts`, mutations in `src/lib/<domain>-actions.ts` (`"use server"`). Pages stay thin.
- Every server action re-validates its input with `zod` and re-checks authorization with `requireUser()` / `requireClubAdmin(clubId)` — the UI hiding a button is never the only check.
- Server Components by default; `"use client"` only where there is real interactivity (drag-and-drop board, flow canvas, forms with local state).
- Data crossing to a client component is a flat, serialisable DTO with dates as ISO strings (see `toBoardTask`).
- `prisma/schema.prisma` is the source of truth for the data model.

## Limitations

Known and deliberate, and scoped to this demo build:

- **Uploads and recordings are simulated.** `Resume` and `Interview` rows hold metadata, extracted text and a transcript; no file is stored and no audio is processed.
- **Not production-hardened auth.** Sessions are a `Session` table plus an HTTP-only, `sameSite: lax` cookie, and passwords are bcrypt-hashed — but there is no rate limiting, email verification, password reset or CSRF token.
- **No integration or end-to-end tests.** Unit tests and a build run in CI; the Prisma queries and server actions are not exercised against a real database. See [Tests](#tests).
- **Performance shortcuts.** `listPipeline` loads every application for a club and sorts in memory, and the board loads every task for a club at once. Both want pagination and an index before real volume. The kanban board is also pointer-only, with no keyboard path.
- **Single-tenant seed data.** One university and one club are seeded; nothing enforces cross-university isolation beyond the university-scoped queries.
