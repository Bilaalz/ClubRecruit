# Stage 1 — Foundation

**Goal:** everything the parallel stages need to exist before they start.

## Deliverables

- [x] Next.js 16 + TypeScript + Tailwind v4 scaffold (`src/` dir, `@/*` alias)
- [x] `docker-compose.yml` with PostgreSQL 16 on port 5433 (5432 left free for any local Postgres)
- [x] `.env` with `DATABASE_URL`, `.env.example` committed
- [x] Prisma schema covering all domains (`prisma/schema.prisma`)
- [x] Prisma client singleton `src/lib/db.ts`
- [x] Seed script `prisma/seed.ts` with realistic demo data:
  - University of Toronto (`utoronto.ca`)
  - Club: **UofT Robotics Association** with subteams Software, Mechanical, Electrical, Outreach
  - 4 postings (2 open, 1 draft, 1 closed)
  - ~8 applicants at different stages, each with resume text, interview transcript and AI evaluation
  - A project ("Mars Rover 2027") with 4 phases, ~9 workstreams with dependencies
  - ~20 tasks across statuses, assigned to members
  - A second small club (UofT Debate Society) so the dashboard shows more than one
  - Demo personas: `priya@utoronto.ca` (club owner), `marcus@utoronto.ca` (member/lead), `aisha@mail.utoronto.ca` (student, has applied), `newstudent@mail.utoronto.ca` (student, no applications)
- [x] Demo auth `src/lib/auth.ts`: `getCurrentUser()`, `requireUser()`, `requireClubMember(clubId)`, `requireClubAdmin(clubId)`, cookie `cr_demo_user`, `/switch-user` page
- [x] App shell: top nav (logo, Dashboard, My applications, club switcher, persona menu), `src/components/ui/` primitives (Button, Card, Badge, Input, Textarea, Select, PageHeader, EmptyState, Stat)
- [x] Design tokens in `globals.css` (cream/black), fonts via `next/font`
- [x] npm scripts: `db:up`, `db:push`, `db:seed`, `db:reset`, `dev`

## Commands

```bash
npm run db:up        # start postgres
npm run db:push      # push schema
npm run db:seed      # load demo data
npm run dev          # http://localhost:3000
```

## File ownership

Stage 1 owns: `prisma/**`, `src/lib/db.ts`, `src/lib/auth.ts`, `src/lib/auth-actions.ts`, `src/components/ui/**`, `src/components/shell/**`, `src/app/layout.tsx`, `src/app/globals.css`, `src/app/page.tsx`, `src/app/switch-user/**`.

Later stages must not edit `prisma/schema.prisma` without noting it in their stage doc; they may append to `prisma/seed.ts` only in the block marked for their stage.
