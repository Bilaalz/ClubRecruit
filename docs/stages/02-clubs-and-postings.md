# Stage 2 — Clubs & Postings

**Goal:** a club owner can see their club, manage it, and publish open positions. Students can browse clubs and postings.

## User stories

- As a student I open `/dashboard` and see my clubs, my applications summary, and open postings at my university.
- As anyone I open `/clubs/[slug]` and see the club's description, subteams (with member counts), and open postings.
- As anyone I open `/postings/[id]` and see the role description, requirements, responsibilities, subteam, openings, and an **Apply** button (links to `/postings/[id]/apply`, built in Stage 4).
- As a club admin I open `/clubs/[slug]/manage` and see stats (open postings, applicants in pipeline, members, tasks in progress), the newest applicants, and quick links.
- As a club admin I open `/clubs/[slug]/manage/postings` and see all postings with status and applicant counts; I can create a posting (`/new`), edit it (`/[id]/edit`), publish a draft, close it, or reopen it.
- As a club admin I can edit the club's name, description and subteams from `/clubs/[slug]/manage/settings`.
- As a member I open `/clubs/[slug]/members` and see the roster grouped by subteam with roles and titles.

## Files owned

- `src/lib/clubs.ts`, `src/lib/clubs-actions.ts`
- `src/lib/postings.ts`, `src/lib/postings-actions.ts`
- `src/app/dashboard/**`
- `src/app/clubs/[slug]/page.tsx`, `src/app/clubs/[slug]/layout.tsx` (club sub-nav: Overview · Project · Board · Members · Manage)
- `src/app/clubs/[slug]/manage/page.tsx`, `src/app/clubs/[slug]/manage/postings/**`, `src/app/clubs/[slug]/manage/settings/**`
- `src/app/clubs/[slug]/members/**`
- `src/app/postings/[id]/page.tsx`
- `src/components/postings/**`, `src/components/clubs/**`

## Posting fields

title, subteam (optional), description (markdown-ish plain text), requirements (one per line), responsibilities (one per line), openings (int), interview questions (one per line, used by Stage 4), status DRAFT/OPEN/CLOSED, closesAt (optional).

## Notes

- The club layout renders a sub-nav; only show **Manage** to OWNER/ADMIN.
- Applicant counts come from `application` relation counts; do not build review UI here (Stage 5).
