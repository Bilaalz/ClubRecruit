"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { logout } from "@/lib/auth-actions";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/cn";

export function UserMenu({ user }: { user: { name: string; email: string } | null }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!user) {
    return (
      <div className="flex items-center gap-4 text-sm">
        <Link href="/login" className="hover:underline">
          Log in
        </Link>
        <Link href="/signup" className="rounded-sm border border-ink bg-ink px-3 py-1.5 text-cream hover:bg-ink-2">
          Sign up
        </Link>
      </div>
    );
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className={cn("flex items-center gap-2 rounded-sm px-2 py-1 text-sm hover:bg-cream-3", open && "bg-cream-3")}
      >
        <Avatar name={user.name} size="sm" />
        <span className="hidden sm:inline">{user.name}</span>
        <span aria-hidden className="hidden text-ink-4 sm:inline">
          ▾
        </span>
      </button>
      {open && (
        <div role="menu" className="absolute right-0 mt-2 w-64 rounded-md border border-line bg-cream-2 p-1 text-sm">
          <div className="px-3 py-2">
            <div className="text-xs text-ink-4">Signed in as</div>
            <div className="truncate">{user.email}</div>
          </div>
          <div className="my-1 border-t border-line-soft" />
          <form action={logout}>
            <button type="submit" role="menuitem" className="w-full rounded-sm px-3 py-2 text-left hover:bg-cream-3">
              Log out
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
