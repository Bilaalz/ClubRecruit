import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { findApplication, getPostingForApply } from "@/lib/applications";
import { sampleAnswerFor, type SampleAnswerKey } from "@/lib/ai/samples";
import { ApplyContext, ApplySteps } from "@/components/apply/steps";
import { InterviewRecorder } from "@/components/apply/interview-recorder";

export const metadata = { title: "Interview" };

/** Pick a sample-answer theme by the applicant's program so the demo feels varied. */
function themeFor(program: string | null, subteamName: string | null | undefined): SampleAnswerKey {
  const p = (program ?? "").toLowerCase();
  const s = (subteamName ?? "").toLowerCase();
  if (!p) return "medium";
  if (s === "technology" && /computer|software|engineering science/.test(p)) return "strong";
  if (s === "operations" && /kinesiology|physical|industrial|management/.test(p)) return "strong";
  if (s === "media" && /cinema|media|communication|art/.test(p)) return "strong";
  if (s === "partnerships" && /commerce|business|management|communication|economics/.test(p)) return "strong";
  if (/engineering|computer|science|commerce|management/.test(p)) return "medium";
  return "weak";
}

export default async function InterviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const posting = await getPostingForApply(id);
  if (!posting) notFound();

  const application = await findApplication(posting.id, user.id);
  if (!application) redirect(`/postings/${posting.id}/apply`);
  if (application.interview) redirect(`/applications/${application.id}`);

  const questions = posting.interviewQuestions.length
    ? posting.interviewQuestions
    : ["Tell us about yourself and why you're interested in this role."];
  const theme = themeFor(user.program, posting.subteam?.name);
  const sampleAnswers = questions.map((_, i) => sampleAnswerFor(theme, i));

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <div className="flex flex-wrap items-end justify-between gap-6 border-b border-line pb-6">
        <ApplyContext title={posting.title} clubName={posting.club.name} subteamName={posting.subteam?.name} />
        <ApplySteps current={1} />
      </div>
      <p className="mt-6 text-sm text-ink-3">
        Answer each question out loud. We transcribe as you speak; you can tidy the transcript before moving on. Questions can be
        answered in any order.
      </p>
      <div className="mt-8">
        <InterviewRecorder applicationId={application.id} questions={questions} sampleAnswers={sampleAnswers} />
      </div>
    </div>
  );
}
