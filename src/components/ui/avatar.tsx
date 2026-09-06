import { cn } from "@/lib/cn";

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

export function Avatar({ name, size = "md", className }: { name: string; size?: "sm" | "md" | "lg"; className?: string }) {
  const s = { sm: "h-6 w-6 text-[10px]", md: "h-8 w-8 text-xs", lg: "h-12 w-12 text-base" }[size];
  return (
    <span
      title={name}
      className={cn("inline-flex shrink-0 items-center justify-center rounded-full border border-line bg-cream-3 font-medium text-ink", s, className)}
    >
      {initials(name)}
    </span>
  );
}
