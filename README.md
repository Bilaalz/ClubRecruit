# ClubRecruit

ClubRecruit is a recruiting and team-operations platform for university clubs. A club posts roles per subteam, students apply with a resume and a short recorded interview, Claude scores the interview against a rubric, and club admins review, accept and assign applicants — who then land on a kanban board wired to the club's project plan. It is a demo: real database, real data flow, typed end to end, with uploads and recordings simulated.

## Stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router, Server Components, Server Actions), TypeScript |
| Styling | Tailwind CSS v4 with cream-and-black design tokens (`src/app/globals.css`) |
| Database | PostgreSQL 16 via Docker Compose, Prisma 7 |
| AI | `@anthropic-ai/sdk` structured output when `ANTHROPIC_API_KEY` is set; deterministic mock scorer otherwise |
| Auth | Session cookie; sign-up restricted to a university's email domain |

## Demo accounts

Password for every account is `clubrecruit`. All four belong to the University of Toronto; the seeded club is the UofT Robotics Association (`/clubs/utra`).

| Name | Role | Email |
| --- | --- | --- |
| Priya Sharma | Club owner — reviews the pipeline, accepts applicants, edits the plan | `priya@utoronto.ca` |
| Marcus Lee | Software lead — works the board and project flow | `marcus@utoronto.ca` |
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

The app was built in eight stages, each with its own spec in [`docs/stages/`](docs/stages/): foundation (schema, seed, shell, UI primitives), then five independent feature stages built in parallel against distinct file sets (clubs and postings, project plan and flow, applications and AI evaluation, review flow, task board), then real authentication and a final UI-polish pass. [`docs/stages/00-overview.md`](docs/stages/00-overview.md) has the data model and conventions; [`docs/BUILDING.md`](docs/BUILDING.md) has the ground rules each stage followed. Each stage doc ends with a `## Requests` section — the notes one stage left for another.
