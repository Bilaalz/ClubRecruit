import { Card, CardBody, CardHeader, CardTitle, EmptyState } from "@/components/ui";
import { cn } from "@/lib/cn";
import { formatClock, formatDate, type ReviewApplication } from "@/lib/review";
import { parseTranscript } from "@/lib/transcript";

export function InterviewPanel({ application }: { application: ReviewApplication }) {
  const interview = application.interview;

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div>
          <div className="eyebrow">Interview</div>
          <CardTitle className="mt-1">Transcript</CardTitle>
        </div>
        {interview && (
          <div className="text-right text-xs text-ink-4">
            <div>{formatClock(interview.durationSec)} long</div>
            <div>Completed {formatDate(interview.completedAt)}</div>
          </div>
        )}
      </CardHeader>
      <CardBody className="flex flex-1 flex-col gap-5">
        {!interview ? (
          <EmptyState title="Interview not completed yet" description="The applicant has not recorded their interview. The transcript will appear here when they do." />
        ) : (
          <>
            <FakePlayer durationSec={interview.durationSec} />
            <ol className="flex flex-col gap-3">
              {parseTranscript(interview.transcript).map((turn, i) => (
                <li key={i} className={cn(turn.speaker === "Candidate" ? "border-l-2 border-line pl-3 text-ink" : "text-ink-3 italic")}>
                  <div className="mb-0.5 flex items-center gap-2 text-[11px] not-italic tracking-wide text-ink-4">
                    <span className="uppercase">{turn.speaker}</span>
                    <span aria-hidden>·</span>
                    <span className="tabular-nums">{formatClock(turn.atSec)}</span>
                  </div>
                  <p className="text-sm leading-relaxed">{turn.text}</p>
                </li>
              ))}
            </ol>
          </>
        )}
      </CardBody>
    </Card>
  );
}

/** Disabled stand-in for the recording; the demo does not store audio. */
function FakePlayer({ durationSec }: { durationSec: number }) {
  return (
    <div className="rounded-sm border border-line-soft bg-cream px-3 py-2.5" aria-label="Recording (demo)">
      <div className="mb-1.5 flex items-center justify-between text-[11px] uppercase tracking-wide text-ink-4">
        <span>Recording (demo)</span>
        <span>not stored</span>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          disabled
          title="Demo: recording not stored"
          className="inline-flex h-8 w-8 shrink-0 cursor-not-allowed items-center justify-center rounded-full border border-line text-ink opacity-50"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden>
            <path d="M3 1.5v9l7-4.5-7-4.5Z" fill="currentColor" />
          </svg>
          <span className="sr-only">Play</span>
        </button>
        <div className="h-px flex-1 bg-line-soft" aria-hidden>
          <div className="h-px w-0 bg-ink" />
        </div>
        <span className="text-xs tabular-nums text-ink-3">
          0:00 / {formatClock(durationSec)}
        </span>
      </div>
    </div>
  );
}
