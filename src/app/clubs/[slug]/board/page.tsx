import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getClubContext } from "@/lib/auth";
import { getBoard, getBoardMeta } from "@/lib/tasks";
import { EmptyState, PageHeader } from "@/components/ui";
import { Board } from "@/components/board/board";
import { FilterBar } from "@/components/board/filter-bar";
import { ProgressStrip } from "@/components/board/progress-strip";

export const metadata = { title: "Task board" };

type SearchParams = { workstream?: string; subteam?: string; mine?: string };

export default async function BoardPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  const ctx = await getClubContext(slug);
  if (!ctx) notFound();

  if (!ctx.isMember || !ctx.membership) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-8">
        <EmptyState
          title="Members only"
          description={`The task board is visible to members of ${ctx.club.name}. Apply to an open posting to join.`}
        />
      </div>
    );
  }

  const workstreamId = sp.workstream || undefined;
  const subteamId = sp.subteam || undefined;
  const mine = sp.mine === "1";
  const clubId = ctx.club.id;

  const [board, meta] = await Promise.all([
    getBoard(clubId, { workstreamId, subteamId, assigneeId: mine ? ctx.membership.id : undefined }),
    getBoardMeta(clubId),
  ]);

  const hasFilters = !!workstreamId || !!subteamId || mine;
  const done = board.tasks.filter((t) => t.status === "DONE").length;
  const activeWorkstream = workstreamId ? meta.workstreams.find((w) => w.id === workstreamId) : undefined;
  const description = hasFilters
    ? `${board.tasks.length} task${board.tasks.length === 1 ? "" : "s"} match${board.tasks.length === 1 ? "es" : ""} the current filters${
        activeWorkstream ? ` · ${activeWorkstream.name}` : ""
      }.`
    : meta.workstreams.length > 0
      ? `${board.tasks.length} tasks across ${meta.workstreams.length} workstreams · ${done} done.`
      : `${board.tasks.length} tasks · ${done} done.`;

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <PageHeader eyebrow="Task board" title={meta.projectName ?? "Board"} description={description} />

      <div className="mt-6 space-y-5">
        <Suspense fallback={null}>
          <FilterBar meta={meta} />
        </Suspense>
        <ProgressStrip workstreams={meta.workstreams} basePath={`/clubs/${slug}/board`} activeWorkstreamId={workstreamId ?? null} mine={mine} />
      </div>

      <Board
        clubId={clubId}
        columns={board.columns}
        meta={meta}
        hasFilters={hasFilters}
        defaultWorkstreamId={workstreamId ?? null}
        defaultAssigneeId={mine ? ctx.membership.id : null}
      />
    </div>
  );
}
