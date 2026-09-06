import { Avatar } from "@/components/ui";
import type { SubteamWithMembers } from "@/lib/project";
import { StatusBadge } from "./chips";

export function SubteamsSection({ subteams }: { subteams: SubteamWithMembers[] }) {
  return (
    <section>
      <div className="mb-5 flex items-end justify-between border-b border-line pb-3">
        <div>
          <div className="eyebrow">Subteams</div>
          <h2 className="mt-1 font-serif text-2xl leading-tight">Who owns what</h2>
        </div>
        <span className="text-xs text-ink-4">
          {subteams.length} {subteams.length === 1 ? "subteam" : "subteams"}
        </span>
      </div>
      {subteams.length === 0 ? (
        <p className="text-sm text-ink-3">This club has no subteams yet.</p>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {subteams.map((s) => (
            <article key={s.id} className="rounded-md border border-line bg-cream-2" style={{ borderLeftWidth: 3, borderLeftColor: s.color }}>
              <header className="border-b border-line-soft px-5 py-4">
                <h3 className="font-serif text-lg leading-tight">{s.name}</h3>
                {s.description && <p className="mt-1 text-sm text-ink-3">{s.description}</p>}
              </header>
              <div className="grid gap-5 px-5 py-4 sm:grid-cols-2">
                <div>
                  <div className="eyebrow mb-2">Workstreams · {s.workstreams.length}</div>
                  {s.workstreams.length === 0 ? (
                    <p className="text-xs text-ink-4">None assigned yet.</p>
                  ) : (
                    <ul className="space-y-1.5 text-sm">
                      {s.workstreams.map((w) => (
                        <li key={w.id} className="flex items-start justify-between gap-2">
                          <span className="leading-snug">{w.name}</span>
                          <StatusBadge status={w.status} className="shrink-0" />
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div>
                  <div className="eyebrow mb-2">Members · {s.memberships.length}</div>
                  {s.memberships.length === 0 ? (
                    <p className="text-xs text-ink-4">No members yet.</p>
                  ) : (
                    <ul className="space-y-2 text-sm">
                      {s.memberships.map((m) => (
                        <li key={m.id} className="flex items-center gap-2">
                          <Avatar name={m.user.name} size="sm" />
                          <span className="min-w-0">
                            <span className="block truncate leading-tight">{m.user.name}</span>
                            <span className="block truncate text-xs text-ink-4">{m.title ?? roleLabel(m.role)}</span>
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function roleLabel(role: string) {
  return role.charAt(0) + role.slice(1).toLowerCase();
}
