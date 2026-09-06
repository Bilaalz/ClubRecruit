import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getClubContext } from "@/lib/auth";
import { PageHeader } from "@/components/ui";
import { cn } from "@/lib/cn";
import {
  isApplicationStatus,
  labelFor,
  listPipeline,
  listPostingOptions,
  pipelineCounts,
  STATUS_ORDER,
  type PipelineSort,
} from "@/lib/review";
import { PipelineFilters } from "@/components/review/pipeline-filters";
import { PipelineTable } from "@/components/review/pipeline-table";

type SearchParams = { posting?: string; status?: string; sort?: string };

export default async function PipelinePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  // Same guard as the other manage pages: unknown club → 404, non-admin → back to the club page.
  const ctx = await getClubContext(slug);
  if (!ctx) notFound();
  if (!ctx.isAdmin) redirect(`/clubs/${slug}`);
  const club = ctx.club;

  const postingId = sp.posting?.trim() || undefined;
  const status = isApplicationStatus(sp.status) ? sp.status : undefined;
  const sort: PipelineSort = sp.sort === "newest" ? "newest" : "score";
  const basePath = `/clubs/${slug}/manage/applications`;

  const [rows, { counts, total }, postings] = await Promise.all([
    listPipeline(club.id, { postingId, status, sort }),
    pipelineCounts(club.id, postingId),
    listPostingOptions(club.id),
  ]);

  const hrefFor = (s?: string) => {
    const q = new URLSearchParams();
    if (postingId) q.set("posting", postingId);
    if (s) q.set("status", s);
    if (sort !== "score") q.set("sort", sort);
    const qs = q.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <PageHeader
        eyebrow="Applications"
        title="Pipeline"
        description="Every application across the club's postings. Sorted by AI score by default; the score is an opinion, the decision is yours."
      />

      <nav aria-label="Status summary" className="mt-6 flex flex-wrap gap-2">
        <CountChip href={hrefFor()} label="All" count={total} active={!status} />
        {STATUS_ORDER.map((s) => (
          <CountChip key={s} href={hrefFor(s)} label={labelFor(s)} count={counts[s]} active={status === s} />
        ))}
      </nav>

      <div className="mt-6 border-t border-line-soft pt-6">
        <PipelineFilters basePath={basePath} postings={postings} postingId={postingId} status={status} sort={sort} />
      </div>

      <div className="mt-6">
        <div className="mb-2 text-xs text-ink-4">
          {rows.length} {rows.length === 1 ? "application" : "applications"}
          {sort === "score" ? " · by AI score, then newest" : " · newest first"}
        </div>
        <PipelineTable rows={rows} basePath={basePath} />
      </div>
    </div>
  );
}

function CountChip({ href, label, count, active }: { href: string; label: string; count: number; active: boolean }) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-2 rounded-sm border px-3 py-1.5 text-sm transition-colors",
        active ? "border-ink bg-ink text-cream" : "border-line-soft bg-cream-2 text-ink hover:border-ink",
      )}
      aria-current={active ? "page" : undefined}
    >
      <span>{label}</span>
      <span className={cn("font-serif text-base leading-none", active ? "text-cream" : "text-ink-3")}>{count}</span>
    </Link>
  );
}
