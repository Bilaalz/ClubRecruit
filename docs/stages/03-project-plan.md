# Stage 3 — Project Plan & Flow

**Goal:** each club has one project plan: a visual flow of the work to be done, which subteam owns each piece, and how the pieces depend on each other.

## Concepts

- **Project** — one per club (name, summary, goals, target date).
- **Phase** — ordered stages of the project (e.g. Design → Build → Integrate → Compete). Rendered as columns left to right.
- **Workstream** — a chunk of work inside a phase, owned by a Subteam, with status PLANNED / ACTIVE / BLOCKED / DONE and a list of `dependsOn` workstream ids. Rendered as a card in its phase column; dependencies drawn as connector lines between cards.
- Tasks (Stage 6) hang off workstreams; this stage shows a task progress count per workstream (done / total).

## User stories

- As a member I open `/clubs/[slug]/project` and see the plan: header (name, summary, goals, target date), a phase-column flow diagram with workstream cards and dependency connectors, a legend of subteam colors.
- Clicking a workstream card opens a detail panel: description, owner subteam, status, dependencies, blocked-by, task progress, link to board filtered to that workstream (`/clubs/[slug]/board?workstream=ID`).
- As an admin I can add/edit/delete phases and workstreams, reorder them, set dependencies, change status, all from inline forms or `/clubs/[slug]/project/edit`.
- A "Subteams" section lists each subteam with the workstreams it owns and its members' names.

## Files owned

- `src/lib/project.ts`, `src/lib/project-actions.ts`
- `src/app/clubs/[slug]/project/**`
- `src/components/project/**` (FlowCanvas as a client component; measure card positions with refs and draw SVG connectors)

## Notes

- Keep the diagram server-rendered where possible; only the canvas with connectors needs `'use client'`.
- Subteam colors come from `Subteam.color` (hex). Stay muted so it sits well on cream.

## Built

- Routes: `/clubs/[slug]/project` (plan header, FlowCanvas with SVG dependency connectors, detail panel, legend, subteams section; "Create project plan" form for admins when no project exists) and `/clubs/[slug]/project/edit` (full-page editor: project details, phases, workstreams with dependency checkboxes; `?ws=ID#ws-ID` / `?phase=ID` deep-link and pre-open a form).
- `src/lib/project.ts`: `getProjectForClub`, `topoLayout`, `getSubteamsWithMembers`, `getSubteamOptions`. `src/lib/project-actions.ts`: create/update project, create/update/delete phase, create/update/delete workstream, `setWorkstreamStatus` (inline from the detail panel). Deleting a workstream also strips it from other workstreams' `dependsOn`; saving dependencies rejects cycles.
- `src/components/project/`: `flow-canvas.tsx` + `detail-panel.tsx` + `confirm-button.tsx` (client); `chips.tsx`, `legend.tsx`, `subteams-section.tsx`, `project-header.tsx`, `forms.tsx`, `shared.ts` (server-safe).

## Requests

- **Stage 2 (club layout):** the project page assumes the club layout renders the club header and a sub-nav with a **Project** link to `/clubs/[slug]/project`. The page uses `mx-auto max-w-7xl px-6 py-8` for its own container; if the layout adds top padding, drop `py-8` to `pb-8`.
- **Stage 6 (board):** the detail panel and editor link to `/clubs/[slug]/board?workstream=ID`; please honour that filter (already in the Stage 6 doc). Task counts here use `Task.status === DONE` per workstream, so the board's "done / total" header should match.
- **Stage 8 (polish):** consolidate the local `WorkstreamStatus` badge tones (`src/components/project/shared.ts`: PLANNED outline · ACTIVE ink · BLOCKED warn · DONE ok) into `src/lib/status.ts`. Server-action validation errors currently `throw` (dev overlay); a shared `useActionState` form pattern with inline error text would be a good polish pass across stages.
