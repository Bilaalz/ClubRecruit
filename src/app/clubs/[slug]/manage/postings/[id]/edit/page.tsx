import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getClubContext } from "@/lib/auth";
import { getClubPosting, listSubteamOptions, toDateInput } from "@/lib/postings";
import { PostingForm } from "@/components/postings/posting-form";
import { Badge } from "@/components/ui";
import { labelFor, postingStatusTone } from "@/lib/status";

export const metadata = { title: "Edit posting" };

export default async function EditPostingPage({ params }: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = await params;
  const ctx = await getClubContext(slug);
  if (!ctx) notFound();
  if (!ctx.isAdmin) redirect(`/clubs/${slug}`);

  const [posting, subteams] = await Promise.all([getClubPosting(ctx.club.id, id), listSubteamOptions(ctx.club.id)]);
  if (!posting) notFound();

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <div className="mb-8 border-b border-line pb-4">
        <div className="eyebrow mb-1">
          <Link href={`/clubs/${slug}/manage/postings`} className="hover:underline">
            Postings
          </Link>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="font-serif text-2xl">Edit posting</h2>
          <Badge tone={postingStatusTone[posting.status]}>{labelFor(posting.status)}</Badge>
        </div>
        <p className="mt-2 text-sm text-ink-3">
          <Link href={`/postings/${posting.id}`} className="underline-offset-2 hover:underline">
            View the public page →
          </Link>
        </p>
      </div>
      <PostingForm
        club={{ id: ctx.club.id, slug }}
        subteams={subteams}
        initial={{
          id: posting.id,
          title: posting.title,
          subteamId: posting.subteamId,
          description: posting.description,
          requirements: posting.requirements,
          responsibilities: posting.responsibilities,
          interviewQuestions: posting.interviewQuestions,
          openings: posting.openings,
          closesAt: toDateInput(posting.closesAt),
          status: posting.status,
        }}
      />
    </div>
  );
}
