import { Badge, Button } from "@/components/ui";
import { formatDate, formatRelative, type ReviewApplication } from "@/lib/review";
import { applicationStatusTone, labelFor } from "@/lib/status";
import { reopenApplication } from "@/lib/review-actions";
import { AcceptDialog } from "./accept-dialog";
import { RejectDialog } from "./reject-dialog";
import { SubmitButton } from "./submit-button";

type Subteam = { id: string; name: string };
type ExistingMembership = { role: string; title: string | null; subteam: { name: string } | null } | null;

export function DecisionBar({
  application,
  subteams,
  existingMembership,
}: {
  application: ReviewApplication;
  subteams: Subteam[];
  existingMembership: ExistingMembership;
}) {
  const decided = application.status === "ACCEPTED" || application.status === "REJECTED";

  if (decided) {
    const verb = application.status === "ACCEPTED" ? "Accepted" : "Rejected";
    return (
      <section className="rounded-md border border-line bg-cream-2 px-5 py-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={applicationStatusTone[application.status]}>{labelFor(application.status)}</Badge>
              {application.decidedAt && (
                <span className="text-sm text-ink-3">
                  {verb} {formatDate(application.decidedAt)} · {formatRelative(application.decidedAt)}
                </span>
              )}
            </div>
            {application.decisionNote ? (
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-2">{application.decisionNote}</p>
            ) : (
              <p className="mt-2 text-sm text-ink-4">No decision note.</p>
            )}
            {application.status === "ACCEPTED" && existingMembership && (
              <p className="mt-1 text-xs text-ink-4">
                On the roster as {existingMembership.title ?? labelFor(existingMembership.role)}
                {existingMembership.subteam ? ` · ${existingMembership.subteam.name}` : ""}.
              </p>
            )}
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-2">
              <Button type="button" disabled title="Already decided. Reopen to change the decision.">
                Accept
              </Button>
              <Button type="button" variant="danger" disabled title="Already decided. Reopen to change the decision.">
                Reject
              </Button>
              <form action={reopenApplication}>
                <input type="hidden" name="applicationId" value={application.id} />
                <SubmitButton variant="ghost" pendingLabel="Reopening…">
                  Reopen decision
                </SubmitButton>
              </form>
            </div>
            <p className="max-w-xs text-right text-xs text-ink-4">
              Reopening sets the status back to under review and clears the note. An existing membership is kept.
            </p>
          </div>
        </div>
      </section>
    );
  }

  const waiting = application.status === "SUBMITTED" || application.status === "INTERVIEW_COMPLETE";

  return (
    <section className="rounded-md border border-line bg-cream-2 px-5 py-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="eyebrow">Decision</div>
          <p className="mt-1 text-sm text-ink-3">
            {waiting
              ? application.status === "SUBMITTED"
                ? "Interview not completed yet. You can still decide, but most committees wait for the transcript."
                : "Interview is in; AI evaluation pending. You can decide now or run the evaluation first."
              : "Accept to assign a role and add them to the roster, or reject with an optional note."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <AcceptDialog
            applicationId={application.id}
            applicantName={application.applicant.name}
            defaultTitle={application.posting.title}
            defaultSubteamId={application.posting.subteamId}
            subteams={subteams}
            existingMembership={existingMembership}
          />
          <RejectDialog applicationId={application.id} applicantName={application.applicant.name} />
        </div>
      </div>
    </section>
  );
}
