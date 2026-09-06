import { notFound } from "next/navigation";
import { getClubContext } from "@/lib/auth";
import { getClubOverview } from "@/lib/clubs";
import { EmptyState } from "@/components/ui";
import { PostingListItem } from "@/components/postings/posting-list-item";

export default async function ClubOverviewPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const ctx = await getClubContext(slug);
  if (!ctx) notFound();
  const { subteams, openPostings } = await getClubOverview(ctx.club.id);

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <div className="grid gap-12 lg:grid-cols-[3fr_2fr]">
        <div className="space-y-12">
          <section>
            <div className="eyebrow mb-3">About</div>
            <div className="space-y-4 text-base leading-relaxed text-ink-2">
              {ctx.club.description.split(/\n{2,}/).map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          </section>

          <section>
            <div className="mb-4 flex items-end justify-between">
              <h2 className="font-serif text-2xl">Open roles</h2>
              <span className="text-xs text-ink-4">{openPostings.length} open</span>
            </div>
            {openPostings.length === 0 ? (
              <EmptyState title="No open roles" description="This club isn't recruiting right now." />
            ) : (
              <ul className="divide-y divide-line-soft border-y border-line">
                {openPostings.map((p) => (
                  <PostingListItem key={p.id} posting={p} />
                ))}
              </ul>
            )}
          </section>
        </div>

        <aside>
          <div className="eyebrow mb-3">Subteams</div>
          {subteams.length === 0 ? (
            <p className="text-sm text-ink-3">No subteams yet.</p>
          ) : (
            <ul className="divide-y divide-line-soft border-y border-line">
              {subteams.map((s) => (
                <li key={s.id} className="flex items-start gap-3 py-4">
                  <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: s.color }} aria-hidden />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="font-medium">{s.name}</span>
                      <span className="text-xs text-ink-4">
                        {s._count.memberships} member{s._count.memberships === 1 ? "" : "s"}
                      </span>
                    </div>
                    {s.description && <p className="mt-0.5 text-sm text-ink-3">{s.description}</p>}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>
    </div>
  );
}
