import Link from "next/link";
import { notFound } from "next/navigation";
import { getClubContext } from "@/lib/auth";
import { getProjectForClub, getSubteamOptions } from "@/lib/project";
import type { PlanWorkstream } from "@/lib/project";
import { ButtonLink, Card, CardBody, CardHeader, CardTitle, EmptyState, PageHeader } from "@/components/ui";
import { StatusBadge, SubteamChip } from "@/components/project/chips";
import {
  CreateProjectForm,
  DeletePhaseForm,
  DeleteWorkstreamForm,
  PhaseForm,
  ProjectDetailsForm,
  WorkstreamForm,
} from "@/components/project/forms";
import { formatDateRange } from "@/components/project/shared";

type Params = Promise<{ slug: string }>;
type Search = Promise<{ ws?: string; phase?: string }>;

export const metadata = { title: "Edit project plan" };

export default async function EditProjectPage({ params, searchParams }: { params: Params; searchParams: Search }) {
  const [{ slug }, { ws: focusWs, phase: focusPhase }] = await Promise.all([params, searchParams]);
  const ctx = await getClubContext(slug);
  if (!ctx) notFound();

  if (!ctx.isAdmin) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-8">
        <EmptyState
          title="Admins only"
          description="Only club owners and admins can edit the project plan."
          action={
            <ButtonLink href={`/clubs/${slug}/project`} variant="secondary" size="sm">
              View project plan
            </ButtonLink>
          }
        />
      </div>
    );
  }

  const [plan, subteams] = await Promise.all([getProjectForClub(ctx.club.id), getSubteamOptions(ctx.club.id)]);

  if (!plan) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-8">
        <PageHeader eyebrow="Project plan" title="Create the plan" description="Start with the big picture; you can add phases and workstreams right after." className="mb-8" />
        <CreateProjectForm clubId={ctx.club.id} clubName={ctx.club.name} />
      </div>
    );
  }

  const groups: Array<{ key: string; title: string; subtitle: string | null; phaseId: string | null; items: PlanWorkstream[] }> = [
    ...plan.phases.map((p) => ({ key: p.id, title: p.name, subtitle: formatDateRange(p.startDate, p.endDate), phaseId: p.id, items: p.workstreams })),
    ...(plan.unphased.length ? [{ key: "__none", title: "Unscheduled", subtitle: "Not in any phase", phaseId: null, items: plan.unphased }] : []),
  ];

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <PageHeader
        eyebrow="Project plan"
        title={`Edit · ${plan.name}`}
        description="Changes save immediately and show up on the flow diagram. Order numbers control left-to-right (phases) and top-to-bottom (workstreams) placement."
        actions={
          <ButtonLink href={`/clubs/${slug}/project`} variant="secondary" size="sm">
            View plan
          </ButtonLink>
        }
      />

      <nav className="mt-6 flex flex-wrap gap-x-5 gap-y-1 text-sm" aria-label="Sections">
        <a href="#details" className="underline-offset-4 hover:underline">Project details</a>
        <a href="#phases" className="underline-offset-4 hover:underline">Phases ({plan.phases.length})</a>
        <a href="#workstreams" className="underline-offset-4 hover:underline">Workstreams ({plan.workstreams.length})</a>
      </nav>

      {/* ── Project details ───────────────────────── */}
      <section id="details" className="mt-10 scroll-mt-24">
        <SectionHeading eyebrow="01" title="Project details" />
        <Card className="max-w-3xl">
          <CardBody>
            <ProjectDetailsForm plan={plan} />
          </CardBody>
        </Card>
      </section>

      {/* ── Phases ────────────────────────────────── */}
      <section id="phases" className="mt-14 scroll-mt-24">
        <SectionHeading eyebrow="02" title="Phases" hint="Columns of the flow diagram, left to right." />
        <div className="grid gap-5 lg:grid-cols-[1fr_22rem] lg:items-start">
          <div className="space-y-3">
            {plan.phases.length === 0 && <p className="text-sm text-ink-4">No phases yet. Add your first one on the right.</p>}
            {plan.phases.map((p, i) => (
              <details key={p.id} id={`phase-${p.id}`} open={focusPhase === p.id} className="group rounded-md border border-line bg-cream-2 scroll-mt-24">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-3 [&::-webkit-details-marker]:hidden">
                  <span className="flex min-w-0 items-baseline gap-3">
                    <span className="font-serif text-ink-4 tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                    <span className="truncate font-medium">{p.name}</span>
                    <span className="hidden text-xs text-ink-4 sm:inline">{formatDateRange(p.startDate, p.endDate) ?? "No dates"}</span>
                  </span>
                  <span className="flex shrink-0 items-center gap-3 text-xs text-ink-4">
                    {p.workstreams.length} ws
                    <span className="transition-transform group-open:rotate-180" aria-hidden>▾</span>
                  </span>
                </summary>
                <div className="space-y-4 border-t border-line-soft px-5 py-4">
                  <PhaseForm projectId={plan.id} phase={p} />
                  <div className="flex justify-between border-t border-line-soft pt-4">
                    <Link href={`/clubs/${slug}/project/edit?phase=${p.id}#new-workstream`} className="text-xs underline-offset-4 hover:underline">
                      Add a workstream to this phase
                    </Link>
                    <DeletePhaseForm phase={p} />
                  </div>
                </div>
              </details>
            ))}
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Add a phase</CardTitle>
            </CardHeader>
            <CardBody>
              <PhaseForm projectId={plan.id} />
            </CardBody>
          </Card>
        </div>
      </section>

      {/* ── Workstreams ───────────────────────────── */}
      <section id="workstreams" className="mt-14 scroll-mt-24">
        <SectionHeading eyebrow="03" title="Workstreams" hint="Cards in the flow diagram. Set the phase, owning subteam, status and dependencies." />
        <div className="grid gap-5 lg:grid-cols-[1fr_24rem] lg:items-start">
          <div className="space-y-8">
            {plan.workstreams.length === 0 && <p className="text-sm text-ink-4">No workstreams yet. Add your first one on the right.</p>}
            {groups.map((g) => (
              <div key={g.key}>
                <div className="mb-2 flex items-baseline justify-between border-b border-line-soft pb-1.5">
                  <h3 className="font-serif text-lg">{g.title}</h3>
                  <span className="text-xs text-ink-4">{g.subtitle ?? ""}</span>
                </div>
                <div className="space-y-3">
                  {g.items.length === 0 && <p className="text-xs text-ink-4">No workstreams in this phase.</p>}
                  {g.items.map((w) => (
                    <details key={w.id} id={`ws-${w.id}`} open={focusWs === w.id} className="group rounded-md border border-line bg-cream-2 scroll-mt-24" style={{ borderLeftWidth: 3, borderLeftColor: w.subteam?.color ?? "#8a867e" }}>
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-3 [&::-webkit-details-marker]:hidden">
                        <span className="flex min-w-0 flex-wrap items-center gap-2">
                          <span className="font-medium">{w.name}</span>
                          <SubteamChip subteam={w.subteam} />
                          <StatusBadge status={w.status} />
                        </span>
                        <span className="flex shrink-0 items-center gap-3 text-xs tabular-nums text-ink-4">
                          {w.taskDone} / {w.taskTotal}
                          <span className="transition-transform group-open:rotate-180" aria-hidden>▾</span>
                        </span>
                      </summary>
                      <div className="space-y-4 border-t border-line-soft px-5 py-4">
                        <WorkstreamForm projectId={plan.id} ws={w} phases={plan.phases} subteams={subteams} all={plan.workstreams} />
                        <div className="flex items-center justify-between border-t border-line-soft pt-4">
                          <Link href={`/clubs/${slug}/board?workstream=${w.id}`} className="text-xs underline-offset-4 hover:underline">
                            View tasks on board
                          </Link>
                          <DeleteWorkstreamForm ws={w} />
                        </div>
                      </div>
                    </details>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <Card id="new-workstream" className="scroll-mt-24 lg:sticky lg:top-20">
            <CardHeader>
              <CardTitle>Add a workstream</CardTitle>
            </CardHeader>
            <CardBody>
              <WorkstreamForm projectId={plan.id} phases={plan.phases} subteams={subteams} all={plan.workstreams} defaultPhaseId={focusPhase ?? plan.phases[0]?.id ?? null} />
            </CardBody>
          </Card>
        </div>
      </section>
    </div>
  );
}

function SectionHeading({ eyebrow, title, hint }: { eyebrow: string; title: string; hint?: string }) {
  return (
    <div className="mb-5 flex items-end justify-between border-b border-line pb-3">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h2 className="mt-1 font-serif text-2xl leading-tight">{title}</h2>
      </div>
      {hint && <span className="hidden max-w-sm text-right text-xs text-ink-4 sm:block">{hint}</span>}
    </div>
  );
}
