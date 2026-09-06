import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { findApplication, getPostingForApply } from "@/lib/applications";
import { ApplyContext, ApplySteps } from "@/components/apply/steps";
import { ButtonLink } from "@/components/ui";

export const metadata = { title: "Application submitted" };

export default async function DonePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const posting = await getPostingForApply(id);
  if (!posting) notFound();

  const application = await findApplication(posting.id, user.id);
  if (!application) redirect(`/postings/${posting.id}/apply`);
  if (!application.interview) redirect(`/postings/${posting.id}/apply/interview`);

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <div className="flex flex-wrap items-end justify-between gap-6 border-b border-line pb-6">
        <ApplyContext title={posting.title} clubName={posting.club.name} subteamName={posting.subteam?.name} />
        <ApplySteps current={2} />
      </div>

      <div className="mt-10 max-w-xl">
        <div className="eyebrow">Application submitted</div>
        <h2 className="mt-2 font-serif text-3xl leading-tight">Thanks, {user.name.split(" ")[0]}. You&apos;re all set.</h2>
        <p className="mt-4 text-sm leading-relaxed text-ink-3">
          Your resume and interview are with {posting.club.name}. Here&apos;s what happens next:
        </p>
        <ol className="mt-6 space-y-4 border-l border-line pl-5 text-sm">
          <li>
            <div className="font-medium">Interview evaluated</div>
            <div className="text-ink-3">Your recorded answers were transcribed and scored against the posting.</div>
          </li>
          <li>
            <div className="font-medium">Club review</div>
            <div className="text-ink-3">The {posting.subteam?.name ? `${posting.subteam.name} lead` : "club"} reads your application and the summary.</div>
          </li>
          <li>
            <div className="font-medium">Decision</div>
            <div className="text-ink-3">You&apos;ll see the outcome on your applications page, including your role and subteam if accepted.</div>
          </li>
        </ol>
        <div className="mt-8 flex flex-wrap gap-3">
          <ButtonLink href={`/applications/${application.id}`}>View my application</ButtonLink>
          <ButtonLink href="/applications" variant="secondary">
            All applications
          </ButtonLink>
        </div>
      </div>
    </div>
  );
}
