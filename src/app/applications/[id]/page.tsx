import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import {
  APPLICATION_STEPS,
  applicationStatusLabel,
  applicationStatusTone,
  applicationStepIndex,
  formatBytes,
  formatDate,
  formatDuration,
  getMyApplication,
} from "@/lib/applications";
import { Badge, Button, ButtonLink, Card, CardBody, CardHeader, CardTitle } from "@/components/ui";
import { cn } from "@/lib/cn";

export const metadata = { title: "Application" };

export default async function ApplicationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const app = await getMyApplication(id, user.id);
  if (!app) notFound();

  const step = applicationStepIndex(app.status);
  const decided = app.status === "ACCEPTED" || app.status === "REJECTED";

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <div className="text-xs text-ink-4">
        <Link href="/applications" className="hover:underline">
          My applications
        </Link>{" "}
        / {app.posting.title}
      </div>

      <header className="mt-3 flex flex-wrap items-end justify-between gap-6 border-b border-line pb-6">
        <div className="max-w-2xl">
          <div className="eyebrow">
            {app.posting.club.name}
            {app.posting.subteam ? ` · ${app.posting.subteam.name}` : ""}
          </div>
          <h1 className="mt-1 font-serif text-3xl leading-tight sm:text-4xl">{app.posting.title}</h1>
          <p className="mt-2 text-sm text-ink-3">Submitted {formatDate(app.createdAt)}</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge tone={applicationStatusTone(app.status)}>{applicationStatusLabel(app.status)}</Badge>
          <ButtonLink href={`/postings/${app.posting.id}`} variant="secondary" size="sm">
            View posting
          </ButtonLink>
        </div>
      </header>

      {/* Timeline */}
      <ol className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {APPLICATION_STEPS.map((s, i) => {
          const done = i <= step;
          const current = i === step && !decided;
          return (
            <li key={s.key} className={cn("border-t-2 pt-3", done ? "border-ink" : "border-line-soft")}>
              <div className={cn("text-xs uppercase tracking-wide", done ? "text-ink" : "text-ink-4")}>
                {i + 1}. {s.label}
              </div>
              <div className="mt-1 text-xs text-ink-4">
                {i === 0 && formatDate(app.createdAt)}
                {i === 1 && (app.interview ? formatDate(app.interview.completedAt) : "Not started")}
                {i === 2 && (step >= 2 ? (current ? "In progress" : "Complete") : "Pending")}
                {i === 3 && (decided ? (app.decidedAt ? formatDate(app.decidedAt) : "Decided") : "Pending")}
              </div>
            </li>
          );
        })}
      </ol>

      {/* Decision */}
      {decided && (
        <div className={cn("mt-8 rounded-md border p-5", app.status === "ACCEPTED" ? "border-ok" : "border-line-soft")}>
          <div className="eyebrow">Decision</div>
          {app.status === "ACCEPTED" ? (
            <>
              <h2 className="mt-1 font-serif text-2xl text-ok">Accepted</h2>
              <p className="mt-2 text-sm text-ink-2">
                Welcome to {app.posting.club.name}
                {app.membership ? (
                  <>
                    {" "}
                    as <span className="font-medium">{app.membership.title ?? app.membership.role.toLowerCase()}</span>
                    {app.membership.subteam ? (
                      <>
                        {" "}
                        on the <span className="font-medium">{app.membership.subteam.name}</span> subteam
                      </>
                    ) : null}
                  </>
                ) : null}
                .
              </p>
              {app.decisionNote && <p className="mt-2 text-sm text-ink-3">{app.decisionNote}</p>}
              <div className="mt-4">
                <ButtonLink href={`/clubs/${app.posting.club.slug}`} size="sm">
                  Go to the club
                </ButtonLink>
              </div>
            </>
          ) : (
            <>
              <h2 className="mt-1 font-serif text-2xl">Not selected this time</h2>
              <p className="mt-2 text-sm text-ink-2">
                {app.posting.club.name} has decided not to move forward with this application.
              </p>
              {app.decisionNote && <p className="mt-2 text-sm text-ink-3">{app.decisionNote}</p>}
            </>
          )}
        </div>
      )}

      {!decided && app.status === "SUBMITTED" && (
        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-md border border-line bg-cream-2 p-5">
          <div>
            <div className="font-medium">Your interview isn&apos;t done yet</div>
            <div className="text-sm text-ink-3">Finish the recorded interview to complete your application.</div>
          </div>
          <ButtonLink href={`/postings/${app.posting.id}/apply/interview`} size="sm">
            Continue interview
          </ButtonLink>
        </div>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        {/* Resume */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Resume</CardTitle>
                {app.resume && (
                  <p className="mt-1 text-xs text-ink-4">
                    {app.resume.fileName} · {formatBytes(app.resume.sizeBytes)}
                  </p>
                )}
              </div>
              <Button variant="secondary" size="sm" disabled title="Demo: files are not stored">
                View PDF
              </Button>
            </CardHeader>
            <CardBody>
              {app.resume ? (
                <pre className="max-h-[420px] overflow-auto whitespace-pre-wrap font-mono text-xs leading-relaxed text-ink-2">{app.resume.extractedText}</pre>
              ) : (
                <p className="text-sm text-ink-3">No resume on file.</p>
              )}
            </CardBody>
          </Card>

          {app.coverNote && (
            <Card>
              <CardHeader>
                <CardTitle>Cover note</CardTitle>
              </CardHeader>
              <CardBody>
                <p className="text-sm leading-relaxed text-ink-2">{app.coverNote}</p>
              </CardBody>
            </Card>
          )}
        </div>

        {/* Transcript */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Interview transcript</CardTitle>
              {app.interview && (
                <p className="mt-1 text-xs text-ink-4">
                  {formatDuration(app.interview.durationSec)} · recorded {formatDate(app.interview.completedAt)}
                </p>
              )}
            </div>
            {app.interview && (
              <Button variant="secondary" size="sm" disabled title="Demo: recordings are not stored">
                Play recording
              </Button>
            )}
          </CardHeader>
          <CardBody>
            {app.transcript.length === 0 ? (
              <p className="text-sm text-ink-3">The interview hasn&apos;t been recorded yet.</p>
            ) : (
              <ol className="space-y-4">
                {app.transcript.map((turn, i) => {
                  const me = turn.speaker === "Candidate";
                  return (
                    <li key={i} className={cn("flex gap-3", me && "flex-row-reverse")}>
                      <div className={cn("max-w-[85%] rounded-md border px-3.5 py-2.5 text-sm leading-relaxed", me ? "border-ink bg-ink text-cream" : "border-line-soft bg-cream")}>
                        <div className={cn("mb-1 text-[10px] uppercase tracking-wide", me ? "text-cream/70" : "text-ink-4")}>
                          {me ? "You" : "Interviewer"} · {formatDuration(turn.atSec)}
                        </div>
                        {turn.text}
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
