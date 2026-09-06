import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getDashboardData } from "@/lib/clubs";
import { Badge, Card, CardBody, CardHeader, CardTitle, EmptyState, buttonClasses } from "@/components/ui";
import { PostingListItem } from "@/components/postings/posting-list-item";
import { SubteamChip } from "@/components/clubs/subteam-chip";
import { applicationStatusTone, labelFor } from "@/lib/status";
import { ApplicationStatus } from "@/generated/prisma/enums";
import { cn } from "@/lib/cn";

export const metadata = { title: "Dashboard" };

function greeting(date: Date) {
  const h = date.getHours();
  if (h < 5) return "Up late";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default async function DashboardPage() {
  const user = await requireUser();
  const { clubs, applications, openPostings } = await getDashboardData(user);
  const firstName = user.name.split(/\s+/)[0];

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <header className="border-b border-line pb-6">
        <div className="eyebrow mb-2">{user.university.name}</div>
        <h1 className="font-serif text-3xl leading-tight sm:text-4xl">
          {greeting(new Date())}, {firstName}
        </h1>
        <p className="mt-3 text-sm text-ink-3">
          {clubs.length === 0
            ? "You're not in any clubs yet — browse the open roles below."
            : `You're in ${clubs.length} club${clubs.length === 1 ? "" : "s"}. Here's what's happening.`}
        </p>
      </header>

      <div className="mt-10 grid gap-10 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-10">
          {/* My clubs */}
          <section>
            <div className="mb-4 flex items-end justify-between">
              <h2 className="font-serif text-2xl">My clubs</h2>
            </div>
            {clubs.length === 0 ? (
              <EmptyState title="No clubs yet" description="Apply to an open posting and you'll show up here once you're accepted." />
            ) : (
              <ul className="grid gap-4 sm:grid-cols-2">
                {clubs.map((m) => {
                  const admin = m.role === "OWNER" || m.role === "ADMIN";
                  return (
                    <li key={m.id}>
                      <Card className="flex h-full flex-col">
                        <CardHeader>
                          <div className="min-w-0">
                            <CardTitle>
                              <Link href={`/clubs/${m.club.slug}`} className="hover:underline">
                                {m.club.name}
                              </Link>
                            </CardTitle>
                            {m.club.tagline && <p className="mt-1 line-clamp-2 text-xs text-ink-3">{m.club.tagline}</p>}
                          </div>
                          <Badge tone={admin ? "ink" : "neutral"}>{labelFor(m.role)}</Badge>
                        </CardHeader>
                        <CardBody className="flex flex-1 flex-col justify-between gap-4">
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-3">
                            {m.title && <span className="text-ink-2">{m.title}</span>}
                            <SubteamChip subteam={m.subteam} />
                          </div>
                          <div className="flex items-center justify-between text-xs text-ink-3">
                            <span>
                              {m.club._count.memberships} member{m.club._count.memberships === 1 ? "" : "s"} · {m.club._count.postings} open role
                              {m.club._count.postings === 1 ? "" : "s"}
                            </span>
                            {admin ? (
                              <Link href={`/clubs/${m.club.slug}/manage`} className={buttonClasses({ variant: "secondary", size: "sm" })}>
                                Manage
                              </Link>
                            ) : (
                              <Link href={`/clubs/${m.club.slug}`} className="text-ink underline-offset-2 hover:underline">
                                Open →
                              </Link>
                            )}
                          </div>
                        </CardBody>
                      </Card>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {/* Open postings */}
          <section>
            <div className="mb-4 flex items-end justify-between">
              <h2 className="font-serif text-2xl">Open roles at {user.university.name}</h2>
              <span className="text-xs text-ink-4">{openPostings.length} open</span>
            </div>
            {openPostings.length === 0 ? (
              <EmptyState title="Nothing open right now" description="Clubs post new roles at the start of each term. Check back soon." />
            ) : (
              <ul className="divide-y divide-line-soft border-y border-line">
                {openPostings.map((p) => (
                  <PostingListItem key={p.id} posting={p} showClub />
                ))}
              </ul>
            )}
          </section>
        </div>

        {/* Applications summary */}
        <aside>
          <Card>
            <CardHeader>
              <CardTitle>My applications</CardTitle>
              <span className="font-serif text-2xl leading-none">{applications.total}</span>
            </CardHeader>
            <CardBody>
              {applications.total === 0 ? (
                <p className="text-sm text-ink-3">You haven&rsquo;t applied anywhere yet.</p>
              ) : (
                <ul className="space-y-2">
                  {Object.values(ApplicationStatus)
                    .filter((s) => applications.byStatus[s])
                    .map((s) => (
                      <li key={s} className="flex items-center justify-between text-sm">
                        <Badge tone={applicationStatusTone[s]}>{labelFor(s)}</Badge>
                        <span className="tabular-nums text-ink-2">{applications.byStatus[s]}</span>
                      </li>
                    ))}
                </ul>
              )}
              <Link href="/applications" className={cn(buttonClasses({ variant: "secondary", size: "sm" }), "mt-5 w-full")}>
                View all applications
              </Link>
            </CardBody>
          </Card>
        </aside>
      </div>
    </div>
  );
}
