import { ButtonLink, Stat } from "@/components/ui";
import type { ProjectPlan } from "@/lib/project";
import { ProgressBar } from "./chips";
import { formatDate, percent } from "./shared";

export function ProjectHeader({ plan, slug, isAdmin }: { plan: ProjectPlan; slug: string; isAdmin: boolean }) {
  const pct = percent(plan.taskDone, plan.taskTotal);
  return (
    <header className="border-b border-line pb-8">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div className="max-w-2xl">
          <div className="eyebrow mb-2">Project plan</div>
          <h1 className="font-serif text-3xl leading-tight sm:text-4xl">{plan.name}</h1>
          <p className="mt-3 text-sm leading-relaxed text-ink-3 sm:text-base">{plan.summary}</p>
        </div>
        {isAdmin && (
          <div className="flex flex-wrap items-center gap-2">
            <ButtonLink href={`/clubs/${slug}/project/edit`} variant="secondary" size="sm">
              Edit plan
            </ButtonLink>
          </div>
        )}
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_auto] lg:items-start">
        <div>
          <div className="eyebrow mb-2">Goals</div>
          {plan.goals.length ? (
            <ol className="grid gap-x-8 gap-y-1.5 text-sm sm:grid-cols-2">
              {plan.goals.map((g, i) => (
                <li key={i} className="flex gap-3 leading-snug">
                  <span className="font-serif text-ink-4 tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                  <span>{g}</span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-sm text-ink-4">No goals set yet.</p>
          )}
        </div>
        <div className="flex flex-wrap gap-8">
          <Stat label="Target date" value={formatDate(plan.targetDate) ?? "—"} />
          <div className="border-l border-line pl-4">
            <div className="eyebrow">Progress</div>
            <div className="mt-1 font-serif text-3xl leading-none">{pct}%</div>
            <div className="mt-1 text-xs text-ink-4">
              {plan.taskDone} / {plan.taskTotal} tasks done
            </div>
            <ProgressBar done={plan.taskDone} total={plan.taskTotal} className="mt-2 w-32" />
          </div>
          <Stat label="Phases" value={plan.phases.length} />
          <Stat label="Workstreams" value={plan.workstreams.length} />
        </div>
      </div>
    </header>
  );
}
