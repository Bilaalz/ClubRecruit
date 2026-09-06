# Architecture

Why the code looks the way it does, and what each decision cost. `prisma/schema.prisma` is the source of truth for the data model; this document is the source of truth for the reasoning.

## Shape of a request

Everything is a Server Component by default. A page resolves its route params, asks a query module in `src/lib/<domain>.ts` for exactly the data it renders, and passes plain objects down. Mutations are Server Actions in `src/lib/<domain>-actions.ts`: parse with `zod`, re-check authorization, write, `revalidatePath`, then `redirect` if the user should land somewhere else.

`src/proxy.ts` (Next.js middleware) runs first, but it is deliberately not the security boundary — see [Authentication](#authentication).

## Data model

**Roles live on the join table, not the user.** `Membership` carries `role`, `title` and `subteamId`, so the same person can own one club, lead a subteam in another and be an applicant to a third. Putting a role on `User` would have forced a single global identity and made the whole product single-club.

**`@@unique` constraints encode the rules that matter.** `@@unique([postingId, applicantId])` makes duplicate applications impossible at the database level rather than in a check that a race can slip past; `@@unique([userId, clubId])` guarantees one membership per club, which is what lets `acceptApplication` use an `upsert` instead of a read-then-write.

**Deletes cascade from the tenant and null out elsewhere.** Removing a club removes its postings, applications and tasks (`onDelete: Cascade`), but removing a *subteam* only clears the pointer (`onDelete: SetNull`) — reorganising subteams should never delete people or their work.

**`Workstream.dependsOn` is a `String[]`, not a join table.** The dependency graph is small (tens of nodes per club), always read whole, and always written whole from one editor screen, so an array column avoids a join table and a second round-trip. The cost is no referential integrity: the database will happily hold an id that no longer exists. Both readers compensate — `getProjectForClub` filters `dependsOn` against the set of live workstreams before returning, and `topoLayout` treats unknown ids as absent. Cycles are rejected on write (`createsCycle` in `project-actions.ts`) and tolerated on read: `topoLayout` emits everything it can order, then appends whatever is left, so a bad row degrades the layout instead of hiding a workstream.

**Transcripts and rubrics are `Json`.** Neither is ever queried by shape — they are read whole and rendered — so a `Json` column beats four more tables. Since Postgres won't validate them, `src/lib/transcript.ts` is the single boundary that does: `parseTranscript` and `parseRubric` drop malformed rows and clamp scores, and every consumer goes through them.

## Authentication

**Opaque session tokens in a `Session` table, not JWTs.** A stateless token would mean a signature secret to rotate and no way to revoke a session before it expires. A row lets logout, expiry and revocation be a `DELETE`, and at this scale the extra read per request is free. The trade-off is a database round-trip on every authenticated request; `getSessionUser` is wrapped in React's `cache` so it happens once per request, not once per component that asks.

**Two layers, and only one of them is a security boundary.** `proxy.ts` checks whether a session cookie is *present* — no database, no validation — purely so signed-out users get bounced to `/login` before rendering. The real check is `requireUser()` / `requireClubAdmin()` inside every page and action. Middleware runs on inputs an attacker controls and cannot safely do a database lookup, so treating it as the gate would be a mistake; treating it as an optimisation is not. A cookie that is present but invalid is handled by routing through `/logout` first, so a stale cookie can't trap a user in a redirect loop between the proxy and the page.

**Authorization is re-derived from the resource, never from the URL.** `review-actions.ts` loads the application, walks to `application.posting.club.id`, and asks `requireClubAdmin` about *that* club. Trusting the `[slug]` in the path would let an admin of one club act on another club's application by editing the URL. The same instinct applies inside the action: an accepted applicant's `subteamId` is only honoured after checking the subteam belongs to that club.

**The pure parts of auth are pure on purpose.** `universityForEmail`, `isAllowedEmail` and `safeNext` take their inputs as arguments and return values, with no database or request access, so the domain policy and the open-redirect guard are unit-testable without a running app. That is most of `src/lib/auth.test.ts`.

**Known gaps.** No rate limiting on login or signup. `login` also skips the password comparison entirely when the email is unknown, which leaks account existence through response timing — the message is generic, but the clock is not. A constant-time dummy hash would fix it.

## Server / client boundary

Client components get flat, serialisable DTOs, never Prisma rows. `toBoardTask` is the pattern: dates become ISO strings and server-only columns (`clubId`, `createdAt`, `assigneeId`) are dropped, so the payload is exactly what the UI renders and nothing that leaks schema detail into the browser.

Constants and types that both sides need live in client-safe modules — `src/components/board/shared.ts` holds the column definitions and DTO types because `src/lib/tasks.ts` imports Prisma and cannot be bundled. Model types are imported with `import type` so they erase at compile time.

`"use client"` is reserved for real interactivity: the drag-and-drop board, the flow canvas, and forms with local pending state.

## AI evaluation

**One schema is the contract.** `EvaluationResultSchema` defines the result shape, and both evaluators satisfy it: Claude via structured output (`zodOutputFormat`), and the offline scorer by construction. Because the shape is fixed, the review UI never needs to know which one ran.

**Every failure degrades to a score, never to a blank.** No API key, a network error, a refusal, or a payload that fails validation all fall through to the deterministic scorer. The path taken is recorded in `Evaluation.model` (`claude-opus-5`, `mock-v1`, or `mock-v1 (fallback)`) so a score is always attributable — silently mixing model output with mock output would make the pipeline untrustworthy. `src/lib/ai/evaluate.test.ts` drives all four paths against a stubbed client.

**The offline scorer is deterministic by design.** No randomness and no clock, which is what makes the demo reproducible and the behaviour testable: `src/lib/ai/mock.test.ts` asserts it ranks a matching candidate above a non-matching one, and that the score does not move when only the applicant's name, program or year changes.

**Claude's rubric is normalised before storage.** `normaliseRubric` maps the returned rows onto the canonical five criteria in order, so a renamed or reordered criterion cannot break the review UI or make two evaluations incomparable.

**Gaps.** No evaluation against human-labelled decisions, so there is no measure of whether the scores are *good* — only that they are well-formed and stable. Prompts are not versioned, and cost and latency are not recorded.

## Testing strategy

The unit suite covers logic where a wrong answer is silent: authorization policy, the Json guards, graph ordering, the AI contract and fallback behaviour, and the formatters. These are pure functions or functions with one stubbed dependency, so they run in under a second with no database and no API key — which is the reason they get run.

Deliberately not covered: Prisma queries and Server Actions, which need a real database to say anything meaningful, and React components. The highest-value addition would be an integration suite that drives the actions against a throwaway Postgres and asserts the cross-tenant rules described above, since those are exactly the invariants that a refactor can quietly break.

## Known limitations

See [Limitations](README.md#limitations) in the README for the product-level list. The performance ones worth naming here:

- `listPipeline` loads every application for a club and sorts in memory. Fine for a real club's volume, wrong in principle — it wants pagination and an index on `Application(postingId, status)`.
- The board loads every task for a club in one query and filters client-side.
- The kanban board is pointer-only; there is no keyboard path for moving a task between columns.
