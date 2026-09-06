# Stage 5 — Review / Accept / Assign Role

**Goal:** club admins see applicants, read the resume and interview transcript alongside the AI's opinion, and accept (assigning a role and subteam) or reject.

## User stories

- As an admin I open `/clubs/[slug]/manage/applications` and see a pipeline: filter by posting and status; table with applicant, posting, status, AI score, recommendation, submitted date; sort by score.
- As an admin I open `/clubs/[slug]/manage/applications/[id]` and see three panels:
  - **Resume** — file card (name, "PDF", size, a View button that is visually a link but is a no-op for the demo) and the extracted text.
  - **Interview** — transcript as a conversation (interviewer questions, candidate answers, timestamps), duration, a disabled audio player placeholder labelled "Recording".
  - **AI evaluation** — overall score ring, recommendation badge, summary, strengths, concerns, rubric table. Label it clearly as AI opinion.
- Decision bar: **Accept** opens a small form (role title, subteam, membership role default MEMBER) → creates `Membership`, sets application `ACCEPTED`, records `decisionNote`. **Reject** sets `REJECTED` with optional note. Both revalidate the pipeline.
- Accepted applicants appear on `/clubs/[slug]/members` immediately.
- Admin can also "Re-run AI evaluation" (calls Stage 4's `evaluateApplication`).

## Files owned

- `src/lib/review.ts`, `src/lib/review-actions.ts`
- `src/app/clubs/[slug]/manage/applications/**`
- `src/components/review/**`

## Notes

- `evaluateApplication` is imported from `src/lib/ai/evaluate.ts` (Stage 4). If it is not there yet when you start, write against the signature `evaluateApplication(applicationId: string): Promise<void>`.
- Authorization: `requireClubAdmin(clubId)` in every action.

## Built

- `/clubs/[slug]/manage/applications` — pipeline with per-status count chips, posting/status/sort filters (GET form, state in the URL), table sorted by AI score then newest (`?sort=newest` alternative), empty state.
- `/clubs/[slug]/manage/applications/[id]` — header (applicant, posting, status, applied), decision bar (Accept dialog with title/subteam/role/note, Reject dialog with note, Reopen decision), and the Resume / Interview / AI evaluation panels.
- `src/lib/review.ts` (queries, local tone maps, formatting, Json parsers), `src/lib/review-actions.ts` (`acceptApplication`, `rejectApplication`, `reopenApplication`, `rerunEvaluation` — all go through `requireClubAdmin` on the club that owns the posting), `src/components/review/*`.
- Pages use the same guard as the other manage pages (`getClubContext` → 404 / redirect to `/clubs/[slug]`); the actions are where `requireClubAdmin` is enforced.

## Requests

- **Stage 8 / `src/lib/status.ts`:** `src/lib/review.ts` carries a local `statusTone`, `recommendationTone` and `labelFor`. Please move `recommendationTone` (STRONG_YES/YES → ok, MAYBE → warn, NO → bad) into `status.ts` and switch `review.ts` and `src/components/review/*` to import from there.
- **Stage 4 / `src/lib/ai/evaluate.ts`:** both `evaluate.ts` and `review.ts` define a `parseTranscript(json)` guard for the Interview `transcript` Json (plus `parseRubric` in `review.ts`). Worth a single shared module (e.g. `src/lib/interview-json.ts`) so the shape is validated in one place.
- **UI primitives:** `AcceptDialog` and `RejectDialog` each hand-roll a `<dialog>` (cream-2 panel, `backdrop:bg-ink/40`, click-outside to close). If another stage needs a modal, a `Dialog` primitive in `src/components/ui` would remove the duplication; `SubmitButton` (pending label via `useFormStatus`) in `src/components/review/submit-button.tsx` is likewise generic.
- **Accept semantics to confirm:** accepting an applicant who is already an OWNER/ADMIN of the club updates their title/subteam but never demotes them; choosing "Lead" only promotes an existing MEMBER. Reopening a decision keeps the membership (the UI says so). If the product wants reopen-after-accept to remove the membership, that is a one-line change in `reopenApplication`.
