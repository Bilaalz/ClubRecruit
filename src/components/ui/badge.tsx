import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

export type BadgeTone = "neutral" | "ink" | "ok" | "warn" | "bad" | "outline";

const tones: Record<BadgeTone, string> = {
  neutral: "bg-cream-3 text-ink-2 border-transparent",
  ink: "bg-ink text-cream border-ink",
  ok: "bg-[#e3eee3] text-ok border-transparent",
  warn: "bg-[#f3e8d2] text-warn border-transparent",
  bad: "bg-[#f1dede] text-bad border-transparent",
  outline: "bg-transparent text-ink border-line",
};

export function Badge({
  tone = "neutral",
  className,
  style,
  ...props
}: ComponentProps<"span"> & { tone?: BadgeTone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-sm border px-1.5 py-0.5 text-[11px] font-medium uppercase tracking-wide",
        tones[tone],
        className,
      )}
      style={style}
      {...props}
    />
  );
}
