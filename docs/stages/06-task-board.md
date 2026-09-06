# Stage 6 — Task Board

**Goal:** once in the club, members get tasks on a kanban board tied to the project plan's workstreams.

## User stories

- As a member I open `/clubs/[slug]/board` and see columns BACKLOG · TODO · IN PROGRESS · IN REVIEW · DONE with task cards (title, workstream chip in subteam color, assignee avatar initials, priority, due date).
- Filters: by workstream (`?workstream=ID`), by subteam, "assigned to me".
- Drag a card between columns (client component, HTML5 drag and drop or pointer events; no heavy library). Persist with a server action `moveTask(taskId, status, order)`.
- Click a card → side panel: edit title, description, status, priority, assignee (club members), workstream, due date; delete.
- "New task" button creates a task in a column.
- Header shows per-workstream progress (done / total) matching Stage 3.

## Files owned

- `src/lib/tasks.ts`, `src/lib/tasks-actions.ts`
- `src/app/clubs/[slug]/board/**`
- `src/components/board/**`

## Notes

- Tasks reference `Workstream` (optional) and `Membership` as assignee (optional).
- Keep ordering with an integer `order` per column; renumber on move.
