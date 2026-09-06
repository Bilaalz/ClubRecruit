# Stage 4 — Applications, Interview, AI Evaluation

**Goal:** a student applies to a posting: submits a resume, completes a recorded interview that gets transcribed, and an AI evaluates the interview and resume against the posting. This is a demo, so upload and recording are simulated but the data flow is real.

## Flow (`/postings/[id]/apply`)

1. **Resume step** — form with cover note textarea and a resume "upload" control. For the demo, the control accepts a file name and stores a `Resume` row with `fileName`, `fileUrl` (`/demo/resumes/<slug>.pdf`, not served) and `extractedText` (paste box pre-filled with a sample resume the user can edit). Creates the `Application` with status `SUBMITTED`.
2. **Interview step** (`/postings/[id]/apply/interview`) — shows the posting's interview questions one at a time with a "recording" UI (timer, waveform placeholder, Record/Stop buttons). Each answer is captured as text in a textarea labelled "Live transcript" (simulating speech-to-text; pre-filled with a plausible sample answer for the demo, editable). On finish, create `Interview` with `transcript` as `[{ speaker: "Interviewer" | "Candidate", question?: string, text, atSec }]`, `durationSec`, and set status `INTERVIEW_COMPLETE`.
3. **Evaluate** — run `evaluateApplication(applicationId)` from `src/lib/ai/evaluate.ts`, store `Evaluation`, set status `UNDER_REVIEW`.
4. **Done** — confirmation page, link to `/applications`.

## AI evaluation (`src/lib/ai/`)

- `evaluate.ts` — builds a prompt from posting (title, description, requirements), resume text, transcript; asks for JSON `{ overallScore 0-100, recommendation STRONG_YES|YES|MAYBE|NO, summary, strengths[], concerns[], rubric: [{criterion, score 1-5, note}] }`. Rubric criteria: Relevant experience, Technical/skill depth, Communication, Motivation & fit, Collaboration.
- If `ANTHROPIC_API_KEY` is set, call Claude via `@anthropic-ai/sdk` (read the `claude-api` skill before writing this file to pick the current model id and structured output approach). Otherwise use `mock.ts`: a deterministic scorer that keyword-matches requirements against resume/transcript and produces the same JSON shape, with `model: "mock-v1"`.
- Store the model name on `Evaluation.model`.

## Student view (`/applications`)

- List of my applications with posting, club, status badge, submitted date. Clicking opens `/applications/[id]` showing my resume summary, my transcript, and status (do **not** show the AI evaluation to the applicant).

## Files owned

- `src/lib/applications.ts`, `src/lib/applications-actions.ts`
- `src/lib/ai/**`
- `src/app/postings/[id]/apply/**`
- `src/app/applications/**`
- `src/components/apply/**`
- Sample content: `prisma/seed/sample-resume.ts` and `prisma/seed/sample-answers.ts` may be imported for defaults.

## Notes

- One application per (posting, applicant) — surface a friendly message if already applied.
- Status transitions: SUBMITTED → INTERVIEW_COMPLETE → UNDER_REVIEW → (Stage 5) ACCEPTED / REJECTED.

## Requests

- **Stage 2:** the Apply button on `/postings/[id]` should link to `/postings/[id]/apply` (the flow handles "already applied" and non-OPEN postings itself, so no extra checks are needed there).
- **Stage 8:** consolidate `applicationStatusTone` / `applicationStatusLabel` from `src/lib/applications.ts` into `src/lib/status.ts`.
- **Stage 1 (docs only):** sample content lives in `prisma/seed/sample-content.ts` (not `sample-resume.ts` / `sample-answers.ts` as this doc said). The app does not import from `prisma/`; a copy is kept in `src/lib/ai/samples.ts` — keep the two in sync if either changes.
- No changes to `prisma/schema.prisma`, `src/lib/auth.ts` or `src/components/ui/*` were needed.
