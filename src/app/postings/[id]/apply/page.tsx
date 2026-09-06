import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { findApplication, getPostingForApply } from "@/lib/applications";
import { personaliseResume, sampleResumeForSubteam } from "@/lib/ai/samples";
import { ApplyContext, ApplySteps } from "@/components/apply/steps";
import { ResumeForm } from "@/components/apply/resume-form";
import { ButtonLink, EmptyState } from "@/components/ui";

export const metadata = { title: "Apply" };

export default async function ApplyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const posting = await getPostingForApply(id);
  if (!posting) notFound();

  const existing = await findApplication(posting.id, user.id);
  if (existing) {
    redirect(existing.interview ? `/applications/${existing.id}` : `/postings/${posting.id}/apply/interview`);
  }

  if (posting.status !== "OPEN") {
    return (
      <div className="mx-auto max-w-3xl px-6 py-10">
        <ApplyContext title={posting.title} clubName={posting.club.name} subteamName={posting.subteam?.name} />
        <div className="mt-8">
          <EmptyState
            title={posting.status === "CLOSED" ? "This posting has closed" : "This posting isn't open yet"}
            description="Applications aren't being accepted right now. Check the club page for other open roles."
            action={
              <ButtonLink href={`/clubs/${posting.club.slug}`} variant="secondary">
                Back to {posting.club.name}
              </ButtonLink>
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <div className="flex flex-wrap items-end justify-between gap-6 border-b border-line pb-6">
        <ApplyContext title={posting.title} clubName={posting.club.name} subteamName={posting.subteam?.name} />
        <ApplySteps current={0} />
      </div>

      <div className="mt-8 grid gap-10 md:grid-cols-[1fr_220px]">
        <ResumeForm postingId={posting.id} sampleResume={personaliseResume(sampleResumeForSubteam(posting.subteam?.name), user)} applicantName={user.name} />
        <aside className="space-y-6 text-sm">
          <div>
            <div className="eyebrow">Applying as</div>
            <div className="mt-1 font-medium">{user.name}</div>
            <div className="text-ink-3">{user.email}</div>
          </div>
          {posting.requirements.length > 0 && (
            <div>
              <div className="eyebrow">Requirements</div>
              <ul className="mt-2 space-y-1.5 text-ink-2">
                {posting.requirements.map((r) => (
                  <li key={r} className="border-l border-line-soft pl-3">
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div>
            <div className="eyebrow">What happens next</div>
            <ol className="mt-2 list-decimal space-y-1 pl-4 text-ink-2">
              <li>Record short answers to {posting.interviewQuestions.length} questions.</li>
              <li>Your interview is transcribed and evaluated.</li>
              <li>The club reviews and gets back to you.</li>
            </ol>
          </div>
        </aside>
      </div>
    </div>
  );
}
