import { notFound } from "next/navigation";
import { getClubContext } from "@/lib/auth";
import { getProjectForClub, getSubteamsWithMembers } from "@/lib/project";
import { ButtonLink, EmptyState } from "@/components/ui";
import { FlowCanvas } from "@/components/project/flow-canvas";
import { Legend } from "@/components/project/legend";
import { ProjectHeader } from "@/components/project/project-header";
import { SubteamsSection } from "@/components/project/subteams-section";
import { CreateProjectForm } from "@/components/project/forms";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }) {
  const { slug } = await params;
  const ctx = await getClubContext(slug);
  return { title: ctx ? `${ctx.club.name} · Project plan` : "Project plan" };
}

export default async function ProjectPage({ params }: { params: Params }) {
  const { slug } = await params;
  const ctx = await getClubContext(slug);
  if (!ctx) notFound();

  if (!ctx.isMember) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-8">
        <EmptyState
          title="Members only"
          description={`The project plan is visible to members of ${ctx.club.name}. Apply to an open posting to join.`}
          action={
            <ButtonLink href={`/clubs/${slug}`} variant="secondary" size="sm">
              Back to club
            </ButtonLink>
          }
        />
      </div>
    );
  }

  const [plan, subteams] = await Promise.all([getProjectForClub(ctx.club.id), getSubteamsWithMembers(ctx.club.id)]);

  if (!plan) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-8">
          <div className="eyebrow mb-2">Project plan</div>
          <h1 className="font-serif text-3xl leading-tight sm:text-4xl">No plan yet</h1>
        </div>
        {ctx.isAdmin ? (
          <CreateProjectForm clubId={ctx.club.id} clubName={ctx.club.name} />
        ) : (
          <EmptyState title="Nothing planned yet" description="A club admin needs to create the project plan before it shows up here." />
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <ProjectHeader plan={plan} slug={slug} isAdmin={ctx.isAdmin} />

      <section className="mt-8">
        <div className="mb-4 flex items-end justify-between">
          <div>
            <div className="eyebrow">Flow</div>
            <h2 className="mt-1 font-serif text-2xl leading-tight">Phases, workstreams and dependencies</h2>
          </div>
          {ctx.isAdmin && (
            <ButtonLink href={`/clubs/${slug}/project/edit`} variant="ghost" size="sm" className="hidden sm:inline-flex">
              Edit phases &amp; workstreams
            </ButtonLink>
          )}
        </div>
        <FlowCanvas plan={plan} slug={slug} isAdmin={ctx.isAdmin} />
      </section>

      <div className="mt-8">
        <Legend subteams={subteams} />
      </div>

      <div className="mt-12">
        <SubteamsSection subteams={subteams} />
      </div>
    </div>
  );
}
