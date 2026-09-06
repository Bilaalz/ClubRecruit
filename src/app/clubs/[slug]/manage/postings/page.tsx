import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getClubContext } from "@/lib/auth";
import { formatDate, listClubPostings } from "@/lib/postings";
import { Badge, EmptyState, buttonClasses } from "@/components/ui";
import { SubteamChip } from "@/components/clubs/subteam-chip";
import { PostingStatusActions } from "@/components/postings/posting-status-actions";
import { labelFor, postingStatusTone } from "@/lib/status";

export const metadata = { title: "Postings" };

export default async function ManagePostingsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const ctx = await getClubContext(slug);
  if (!ctx) notFound();
  if (!ctx.isAdmin) redirect(`/clubs/${slug}`);

  const postings = await listClubPostings(ctx.club.id);
  const club = { id: ctx.club.id, slug };
  const newHref = `/clubs/${slug}/manage/postings/new`;

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-line pb-4">
        <div>
          <div className="eyebrow mb-1">
            <Link href={`/clubs/${slug}/manage`} className="hover:underline">
              Manage
            </Link>
          </div>
          <h2 className="font-serif text-2xl">Postings</h2>
        </div>
        <Link href={newHref} className={buttonClasses({ size: "sm" })}>
          New posting
        </Link>
      </div>

      {postings.length === 0 ? (
        <EmptyState
          title="No postings yet"
          description="Create your first role. It starts as a draft so you can publish when ready."
          action={
            <Link href={newHref} className={buttonClasses({ size: "sm" })}>
              New posting
            </Link>
          }
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-line text-left">
                <th className="eyebrow py-2 pr-4 font-normal">Title</th>
                <th className="eyebrow py-2 pr-4 font-normal">Subteam</th>
                <th className="eyebrow py-2 pr-4 font-normal">Status</th>
                <th className="eyebrow py-2 pr-4 text-right font-normal">Openings</th>
                <th className="eyebrow py-2 pr-4 text-right font-normal">Applicants</th>
                <th className="eyebrow py-2 pr-4 font-normal">Closes</th>
                <th className="py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line-soft">
              {postings.map((p) => (
                <tr key={p.id} className="align-middle">
                  <td className="py-3 pr-4">
                    <Link href={`/postings/${p.id}`} className="font-medium hover:underline">
                      {p.title}
                    </Link>
                    <div className="text-xs text-ink-4">Created {formatDate(p.createdAt)}</div>
                  </td>
                  <td className="py-3 pr-4">
                    <SubteamChip subteam={p.subteam} />
                  </td>
                  <td className="py-3 pr-4">
                    <Badge tone={postingStatusTone[p.status]}>{labelFor(p.status)}</Badge>
                  </td>
                  <td className="py-3 pr-4 text-right tabular-nums">{p.openings}</td>
                  <td className="py-3 pr-4 text-right tabular-nums">{p._count.applications}</td>
                  <td className="py-3 pr-4 text-ink-3">{p.closesAt ? formatDate(p.closesAt) : "Rolling"}</td>
                  <td className="py-3">
                    <PostingStatusActions club={club} posting={p} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
