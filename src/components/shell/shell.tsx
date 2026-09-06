import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { NavLink } from "./nav-link";
import { UserMenu } from "./user-menu";

export async function Shell({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  const clubs = user?.memberships.map((m) => m.club) ?? [];

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-line bg-cream/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-6 px-6">
          <div className="flex items-center gap-8">
            <Link href="/" className="font-serif text-xl tracking-tight">
              Club<span className="italic">Recruit</span>
            </Link>
            <nav className="hidden items-center gap-1 md:flex">
              <NavLink href="/dashboard">Dashboard</NavLink>
              <NavLink href="/applications">My applications</NavLink>
              {clubs.map((c) => (
                <NavLink key={c.id} href={`/clubs/${c.slug}`}>
                  {c.name}
                </NavLink>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <UserMenu user={user ? { name: user.name, email: user.email } : null} />
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t border-line-soft">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 text-xs text-ink-4">
          <span>ClubRecruit · demo</span>
          <span>{user?.university.name}</span>
        </div>
      </footer>
    </div>
  );
}
