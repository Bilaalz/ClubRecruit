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
