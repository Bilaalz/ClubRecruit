import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { applicationStatusLabel, applicationStatusTone, formatDate, listMyApplications } from "@/lib/applications";
import { Badge, ButtonLink, EmptyState, PageHeader } from "@/components/ui";

export const metadata = { title: "My applications" };

export default async function ApplicationsPage() {
  const user = await requireUser();
  const applications = await listMyApplications(user.id);

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <PageHeader
        eyebrow="Student"
        title="My applications"
        description="Every role you've applied to, where it is in the process, and the outcome once the club decides."
        actions={
          <ButtonLink href="/dashboard" variant="secondary" size="sm">
            Find open postings
          </ButtonLink>
        }
      />

      {applications.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            title="No applications yet"
            description="Open postings from clubs at your university are listed on your dashboard."
            action={<ButtonLink href="/dashboard">Browse postings</ButtonLink>}
          />
        </div>
      ) : (
        <ul className="mt-8 divide-y divide-line-soft border-y border-line">
          {applications.map((a) => (
            <li key={a.id}>
              <Link href={`/applications/${a.id}`} className="group flex items-center justify-between gap-6 py-5 transition-colors hover:bg-cream-2">
                <div className="min-w-0">
                  <div className="eyebrow">
                    {a.posting.club.name}
                    {a.posting.subteam ? ` · ${a.posting.subteam.name}` : ""}
                  </div>
                  <div className="mt-1 truncate font-serif text-xl group-hover:underline">{a.posting.title}</div>
                  <div className="mt-1 text-xs text-ink-4">Submitted {formatDate(a.createdAt)}</div>
                </div>
                <div className="flex shrink-0 items-center gap-4">
                  <Badge tone={applicationStatusTone(a.status)}>{applicationStatusLabel(a.status)}</Badge>
                  <span className="text-ink-4 transition-transform group-hover:translate-x-0.5" aria-hidden>
                    →
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
