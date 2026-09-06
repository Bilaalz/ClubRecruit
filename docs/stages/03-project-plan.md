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
