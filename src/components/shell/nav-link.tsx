"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

export function NavLink({ href, children, exact = false }: { href: string; children: React.ReactNode; exact?: boolean }) {
  const pathname = usePathname();
  const active = exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");
  return (
    <Link
      href={href}
      className={cn(
        "rounded-sm px-3 py-1.5 text-sm transition-colors",
        active ? "bg-ink text-cream" : "text-ink-2 hover:bg-cream-3",
      )}
    >
      {children}
    </Link>
  );
}
