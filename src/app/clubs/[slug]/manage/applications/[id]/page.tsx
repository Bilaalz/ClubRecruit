import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getClubContext } from "@/lib/auth";
import { Avatar, Badge } from "@/components/ui";
import {
  formatDate,
  formatRelative,
  getApplicantMembership,
  getReviewApplication,
  labelFor,
  listSubteamOptions,
  statusTone,
} from "@/lib/review";
import { DecisionBar } from "@/components/review/decision-bar";
import { ResumePanel } from "@/components/review/resume-panel";
import { InterviewPanel } from "@/components/review/interview-panel";
import { EvaluationPanel } from "@/components/review/evaluation-panel";

export default async function ReviewApplicationPage({ params }: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = await params;
  // Same guard as the other manage pages: unknown club → 404, non-admin → back to the club page.
  const ctx = await getClubContext(slug);
  if (!ctx) notFound();
  if (!ctx.isAdmin) redirect(`/clubs/${slug}`);
  const club = ctx.club;

  const application = await getReviewApplication(club.id, id);
  if (!application) notFound();

  const [subteams, existingMembership] = await Promise.all([
    listSubteamOptions(club.id),
    getApplicantMembership(application.applicant.id, club.id),
  ]);

  const { applicant, posting } = application;
  const meta = [applicant.program, applicant.year ? `Year ${applicant.year}` : null].filter(Boolean).join(" · ");
  const pipelinePath = `/clubs/${slug}/manage/applications`;

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <Link href={pipelinePath} className="text-sm text-ink-3 underline-offset-4 hover:text-ink hover:underline">
        ← Pipeline
      </Link>

      <header className="mt-4 flex flex-wrap items-start justify-between gap-6 border-b border-line pb-6">
        <div className="flex min-w-0 items-start gap-4">
          <Avatar name={applicant.name} size="lg" />
          <div className="min-w-0">
            <div className="eyebrow">Applicant</div>
            <h1 className="mt-1 font-serif text-3xl leading-tight sm:text-4xl">{applicant.name}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-3">
              <a href={`mailto:${applicant.email}`} className="underline-offset-4 hover:text-ink hover:underline">
                {applicant.email}
              </a>
              {meta && (
                <>
                  <span aria-hidden>·</span>
                  <span>{meta}</span>
                </>
              )}
            </div>
          </div>
        </div>

        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm sm:min-w-72">
          <dt className="eyebrow self-center">Posting</dt>
          <dd>
            <Link href={`/postings/${posting.id}`} className="underline-offset-4 hover:underline">
              {posting.title}
            </Link>
            {posting.subteam && <span className="text-ink-4"> · {posting.subteam.name}</span>}
          </dd>
          <dt className="eyebrow self-center">Status</dt>
          <dd>
            <Badge tone={statusTone[application.status]}>{labelFor(application.status)}</Badge>
          </dd>
          <dt className="eyebrow self-center">Applied</dt>
          <dd>
            <time dateTime={application.createdAt.toISOString()}>{formatDate(application.createdAt)}</time>
            <span className="text-ink-4"> · {formatRelative(application.createdAt)}</span>
          </dd>
        </dl>
      </header>

      <div className="mt-6">
        <DecisionBar application={application} subteams={subteams} existingMembership={existingMembership} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <ResumePanel application={application} />
        <InterviewPanel application={application} />
        <EvaluationPanel application={application} />
      </div>
    </div>
  );
}
