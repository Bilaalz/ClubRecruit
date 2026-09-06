import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getClubContext } from "@/lib/auth";
import { listSubteamOptions } from "@/lib/postings";
import { PostingForm } from "@/components/postings/posting-form";

export const metadata = { title: "New posting" };

export default async function NewPostingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const ctx = await getClubContext(slug);
  if (!ctx) notFound();
  if (!ctx.isAdmin) redirect(`/clubs/${slug}`);

  const subteams = await listSubteamOptions(ctx.club.id);

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <div className="mb-8 border-b border-line pb-4">
        <div className="eyebrow mb-1">
          <Link href={`/clubs/${slug}/manage/postings`} className="hover:underline">
            Postings
          </Link>
        </div>
        <h2 className="font-serif text-2xl">New posting</h2>
        <p className="mt-2 text-sm text-ink-3">Drafts are private to admins. Publish when you&rsquo;re ready to accept applications.</p>
      </div>
      <PostingForm club={{ id: ctx.club.id, slug }} subteams={subteams} />
    </div>
  );
}
