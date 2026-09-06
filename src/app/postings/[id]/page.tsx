import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { formatDate, getMyApplication, getPosting } from "@/lib/postings";
import { Badge, ButtonLink, Card, CardBody, CardHeader, CardTitle } from "@/components/ui";
import { SubteamChip } from "@/components/clubs/subteam-chip";
import { applicationStatusTone, labelFor, postingStatusTone } from "@/lib/status";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const posting = await getPosting(id);
  return { title: posting ? posting.title : "Posting" };
}

function List({ items }: { items: string[] }) {
  if (items.length === 0) return <p className="text-sm text-ink-4">Not specified.</p>;
  return (
    <ul className="space-y-2">
      {items.map((it, i) => (
        <li key={i} className="flex gap-3 text-sm leading-relaxed text-ink-2">
          <span className="mt-[9px] h-1 w-1 shrink-0 rounded-full bg-ink" aria-hidden />
          <span>{it}</span>
        </li>
      ))}
    </ul>
  );
}

export default async function PostingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [posting, user] = await Promise.all([getPosting(id), getCurrentUser()]);
  if (!posting) notFound();

  const mine = user ? await getMyApplication(posting.id, user.id) : null;
  const isOpen = posting.status === "OPEN";
  const pastClose = !!posting.closesAt && posting.closesAt < new Date();

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <header className="border-b border-line pb-6">
        <div className="eyebrow mb-2">
          <Link href={`/clubs/${posting.club.slug}`} className="hover:underline">
            {posting.club.name}
          </Link>
          <span className="mx-2">·</span>
          {posting.club.university.name}
        </div>
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-2xl">
            <h1 className="font-serif text-3xl leading-tight sm:text-4xl">{posting.title}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-ink-3">
              <Badge tone={postingStatusTone[posting.status]}>{labelFor(posting.status)}</Badge>
              <SubteamChip subteam={posting.subteam} />
              <span>
                {posting.openings} opening{posting.openings === 1 ? "" : "s"}
              </span>
              <span>{posting.closesAt ? `Closes ${formatDate(posting.closesAt)}` : "Rolling applications"}</span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            {mine ? (
              <>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-ink-3">Your application:</span>
                  <Badge tone={applicationStatusTone[mine.status]}>{labelFor(mine.status)}</Badge>
                </div>
                <Link href="/applications" className="text-xs text-ink underline-offset-2 hover:underline">
                  View my applications →
                </Link>
              </>
            ) : isOpen ? (
              <>
                <ButtonLink href={`/postings/${posting.id}/apply`} size="lg">
                  Apply
                </ButtonLink>
                {pastClose && <span className="text-xs text-warn">Past the listed close date — apply soon.</span>}
              </>
            ) : (
              <p className="max-w-xs text-right text-sm text-ink-3">
                {posting.status === "CLOSED" ? "This posting is closed and no longer accepting applications." : "This posting hasn't been published yet."}
              </p>
            )}
          </div>
        </div>
      </header>

      <div className="mt-10 grid gap-12 lg:grid-cols-[3fr_2fr]">
        <div className="space-y-10">
          <section>
            <div className="eyebrow mb-3">About the role</div>
            <div className="space-y-4 text-base leading-relaxed text-ink-2">
              {posting.description.split(/\n{2,}/).map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          </section>
          <section>
            <div className="eyebrow mb-3">Responsibilities</div>
            <List items={posting.responsibilities} />
          </section>
          <section>
            <div className="eyebrow mb-3">Requirements</div>
            <List items={posting.requirements} />
          </section>
          {posting.interviewQuestions.length > 0 && (
            <section>
              <div className="eyebrow mb-3">What to expect</div>
              <p className="text-sm leading-relaxed text-ink-3">
                After uploading your resume you&rsquo;ll record a short interview with {posting.interviewQuestions.length} question
                {posting.interviewQuestions.length === 1 ? "" : "s"}. The club reviews it alongside your resume.
              </p>
            </section>
          )}
        </div>

        <aside className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{posting.club.name}</CardTitle>
            </CardHeader>
            <CardBody className="space-y-3 text-sm">
              {posting.club.tagline && <p className="text-ink-3">{posting.club.tagline}</p>}
              <dl className="grid grid-cols-2 gap-y-2 text-sm">
                <dt className="text-ink-4">Subteam</dt>
                <dd>{posting.subteam?.name ?? "—"}</dd>
                <dt className="text-ink-4">Openings</dt>
                <dd>{posting.openings}</dd>
                <dt className="text-ink-4">Applicants</dt>
                <dd>{posting._count.applications}</dd>
                <dt className="text-ink-4">Posted</dt>
                <dd>{formatDate(posting.createdAt)}</dd>
                <dt className="text-ink-4">Closes</dt>
                <dd>{posting.closesAt ? formatDate(posting.closesAt) : "Rolling"}</dd>
              </dl>
              <Link href={`/clubs/${posting.club.slug}`} className="inline-block text-ink underline-offset-2 hover:underline">
                About the club →
              </Link>
            </CardBody>
          </Card>
        </aside>
      </div>
    </div>
  );
}
