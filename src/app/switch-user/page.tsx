import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { switchUser } from "@/lib/auth-actions";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "Switch persona" };

export default async function SwitchUserPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const [users, current] = await Promise.all([
    db.user.findMany({
      include: { memberships: { include: { club: true } } },
      orderBy: { createdAt: "asc" },
    }),
    getCurrentUser(),
  ]);

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <PageHeader
        eyebrow="Demo"
        title="Switch persona"
        description="This demo uses a persona switcher instead of a login screen. Pick who you want to be; real university-email login arrives in Stage 7."
      />
      <ul className="mt-8 divide-y divide-line-soft border-y border-line">
        {users.map((u) => (
          <li key={u.id} className="flex items-center justify-between gap-4 py-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium">{u.name}</span>
                {current?.id === u.id && <Badge tone="ink">Current</Badge>}
              </div>
              <div className="text-sm text-ink-3">{u.email}</div>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {u.memberships.length === 0 ? (
                  <Badge>Student · no clubs</Badge>
                ) : (
                  u.memberships.map((m) => (
                    <Badge key={m.id}>
                      {m.club.name} · {m.role.toLowerCase()}
                    </Badge>
                  ))
                )}
              </div>
            </div>
            <form action={switchUser}>
              <input type="hidden" name="userId" value={u.id} />
              <input type="hidden" name="next" value={next ?? "/dashboard"} />
              <Button type="submit" variant={current?.id === u.id ? "secondary" : "primary"} size="sm">
                {current?.id === u.id ? "Selected" : "Use"}
              </Button>
            </form>
          </li>
        ))}
      </ul>
    </div>
  );
}
