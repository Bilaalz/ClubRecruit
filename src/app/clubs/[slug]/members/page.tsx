import { notFound, redirect } from "next/navigation";
import { getClubContext } from "@/lib/auth";
import { getClubRoster } from "@/lib/clubs";
import { Avatar, Badge } from "@/components/ui";
import { formatDate } from "@/lib/postings";
import { labelFor } from "@/lib/status";
import type { MembershipRole } from "@/generated/prisma/enums";

export const metadata = { title: "Members" };

const roleTone: Record<MembershipRole, "ink" | "neutral" | "outline"> = {
  OWNER: "ink",
  ADMIN: "ink",
  LEAD: "neutral",
  MEMBER: "outline",
};

type Row = {
  id: string;
  role: MembershipRole;
  title: string | null;
  joinedAt: Date;
  user: { name: string; program: string | null; year: number | null };
};

function MemberRow({ m }: { m: Row }) {
  return (
    <li className="flex items-center gap-4 py-3">
      <Avatar name={m.user.name} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium">{m.user.name}</span>
          <Badge tone={roleTone[m.role]}>{labelFor(m.role)}</Badge>
        </div>
        <div className="mt-0.5 text-xs text-ink-3">
          {m.title ?? "Member"}
          {m.user.program && <span className="text-ink-4"> · {m.user.program}{m.user.year ? `, year ${m.user.year}` : ""}</span>}
        </div>
      </div>
      <span className="hidden text-xs text-ink-4 sm:block">Joined {formatDate(m.joinedAt)}</span>
    </li>
  );
}

export default async function MembersPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const ctx = await getClubContext(slug);
  if (!ctx) notFound();
  if (!ctx.isMember) redirect(`/clubs/${slug}`);

  const { groups, unassigned, total } = await getClubRoster(ctx.club.id);

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <div className="mb-8 flex items-end justify-between border-b border-line pb-4">
        <h2 className="font-serif text-2xl">Members</h2>
        <span className="text-xs text-ink-4">{total} total</span>
      </div>

      <div className="space-y-10">
        {groups.map(({ subteam, members }) => (
          <section key={subteam.id}>
            <div className="mb-2 flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: subteam.color }} aria-hidden />
              <h3 className="font-serif text-lg">{subteam.name}</h3>
              <span className="text-xs text-ink-4">· {members.length}</span>
            </div>
            {members.length === 0 ? (
              <p className="py-2 text-sm text-ink-4">No members yet.</p>
            ) : (
              <ul className="divide-y divide-line-soft border-y border-line-soft">
                {members.map((m) => (
                  <MemberRow key={m.id} m={m} />
                ))}
              </ul>
            )}
          </section>
        ))}

        {unassigned.length > 0 && (
          <section>
            <div className="mb-2 flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full border border-line-soft" aria-hidden />
              <h3 className="font-serif text-lg">No subteam</h3>
              <span className="text-xs text-ink-4">· {unassigned.length}</span>
            </div>
            <ul className="divide-y divide-line-soft border-y border-line-soft">
              {unassigned.map((m) => (
                <MemberRow key={m.id} m={m} />
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
