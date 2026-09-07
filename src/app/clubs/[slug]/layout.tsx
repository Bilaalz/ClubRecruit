import { notFound } from "next/navigation";
import { getClubContext } from "@/lib/auth";
import { getClubHeader } from "@/lib/clubs";
import { ClubNav, type ClubNavItem } from "@/components/clubs/club-nav";
import { Badge } from "@/components/ui";
import { labelFor } from "@/lib/status";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const club = await getClubHeader(slug);
  // Pages inside the club get "Board · UofT World Cup Club"; the overview keeps the root template.
  const name = club ? club.name : "Club";
  return { title: { default: name, template: `%s · ${name}` } };
}

export default async function ClubLayout({ params, children }: { params: Promise<{ slug: string }>; children: React.ReactNode }) {
  const { slug } = await params;
  const [ctx, club] = await Promise.all([getClubContext(slug), getClubHeader(slug)]);
  if (!ctx || !club) notFound();

  const base = `/clubs/${slug}`;
  const items: ClubNavItem[] = [{ href: base, label: "Overview", exact: true }];
  if (ctx.isMember) {
    items.push({ href: `${base}/project`, label: "Project" }, { href: `${base}/board`, label: "Board" }, { href: `${base}/members`, label: "Members" });
  }
  if (ctx.isAdmin) items.push({ href: `${base}/manage`, label: "Manage" });

  const members = club._count.memberships;

  return (
    <div>
      <div className="border-b border-line bg-cream-2">
        <div className="mx-auto max-w-7xl px-6 pt-10">
          <div className="flex flex-wrap items-end justify-between gap-6 pb-6">
            <div className="max-w-2xl">
              <div className="eyebrow mb-2">{club.university.name}</div>
              <h1 className="font-serif text-3xl leading-tight sm:text-4xl">{club.name}</h1>
              {club.tagline && <p className="mt-3 text-sm leading-relaxed text-ink-3 sm:text-base">{club.tagline}</p>}
            </div>
            <div className="flex items-center gap-3 text-sm text-ink-3">
              <span>
                {members} member{members === 1 ? "" : "s"}
              </span>
              {ctx.membership ? (
                <Badge tone={ctx.isAdmin ? "ink" : "neutral"}>{labelFor(ctx.membership.role)}</Badge>
              ) : (
                <Badge tone="outline">Not a member</Badge>
              )}
            </div>
          </div>
          <ClubNav items={items} />
        </div>
      </div>
      {children}
    </div>
  );
}
