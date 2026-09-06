import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getClubContext } from "@/lib/auth";
import { getClubManageSummary } from "@/lib/clubs";
import { Badge, Card, CardBody, CardHeader, CardTitle, Stat } from "@/components/ui";
import { applicationStatusTone, labelFor } from "@/lib/status";
import { formatDate } from "@/lib/postings";

export const metadata = { title: "Manage" };

export default async function ManagePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const ctx = await getClubContext(slug);
  if (!ctx) notFound();
  if (!ctx.isAdmin) redirect(`/clubs/${slug}`);

  const { stats, recentApplicants } = await getClubManageSummary(ctx.club.id);
  const base = `/clubs/${slug}/manage`;

  const links = [
    { href: `${base}/postings`, label: "Postings", hint: "Create, publish and close roles" },
    { href: `${base}/applications`, label: "Applications", hint: "Review the applicant pipeline" },
    { href: `/clubs/${slug}/project`, label: "Project plan", hint: "Phases, workstreams and dependencies" },
    { href: `/clubs/${slug}/board`, label: "Task board", hint: "What everyone is working on" },
    { href: `${base}/settings`, label: "Settings", hint: "Club details and subteams" },
  ];

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <div className="mb-8 flex items-end justify-between border-b border-line pb-4">
        <h2 className="font-serif text-2xl">Club dashboard</h2>
        <span className="text-xs text-ink-4">Admin view</span>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Open postings" value={stats.openPostings} />
        <Stat label="In pipeline" value={stats.pipeline} hint="Applicants awaiting a decision" />
        <Stat label="Members" value={stats.members} />
        <Stat label="Tasks in progress" value={stats.tasksInProgress} />
      </div>

      <div className="mt-12 grid gap-10 lg:grid-cols-[3fr_2fr]">
        <section>
          <div className="mb-4 flex items-end justify-between">
            <h3 className="font-serif text-xl">Newest applicants</h3>
            <Link href={`${base}/applications`} className="text-xs text-ink underline-offset-2 hover:underline">
              View pipeline →
            </Link>
          </div>
          {recentApplicants.length === 0 ? (
            <p className="text-sm text-ink-3">No applications yet.</p>
          ) : (
            <ul className="divide-y divide-line-soft border-y border-line">
              {recentApplicants.map((a) => (
                <li key={a.id} className="py-3">
                  <Link href={`${base}/applications/${a.id}`} className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 group">
                    <div className="min-w-0">
                      <div className="font-medium group-hover:underline">{a.applicant.name}</div>
                      <div className="mt-0.5 text-xs text-ink-3">
                        {a.posting.title} · {formatDate(a.createdAt)}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {a.evaluation ? (
                        <span className="text-xs text-ink-3" title={labelFor(a.evaluation.recommendation)}>
                          AI <span className="font-serif text-base text-ink">{a.evaluation.overallScore}</span>
                          <span className="text-ink-4">/100</span>
                        </span>
                      ) : (
                        <span className="text-xs text-ink-4">No evaluation</span>
                      )}
                      <Badge tone={applicationStatusTone[a.status]}>{labelFor(a.status)}</Badge>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <aside>
          <Card>
            <CardHeader>
              <CardTitle>Quick links</CardTitle>
            </CardHeader>
            <CardBody className="p-0">
              <ul className="divide-y divide-line-soft">
                {links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="flex items-center justify-between gap-4 px-5 py-3 hover:bg-cream-3">
                      <div>
                        <div className="text-sm font-medium">{l.label}</div>
                        <div className="text-xs text-ink-4">{l.hint}</div>
                      </div>
                      <span className="text-ink-4">→</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </CardBody>
          </Card>
        </aside>
      </div>
    </div>
  );
}
