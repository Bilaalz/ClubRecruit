import { cn } from "@/lib/cn";

/** Muted palette for subteam colors. Stays legible on cream. Dependency-free so it can ship to the client. */
export const SUBTEAM_COLORS = [
  "#3B5B7C", // slate blue
  "#7C5A3B", // umber
  "#5F7C3B", // moss
  "#7C3B5F", // plum
  "#3B7C74", // teal
  "#7C6E3B", // ochre
  "#5B3B7C", // violet
  "#6B6B6B", // grey
] as const;

/** Radio-group palette; works without JS. `name` defaults to "color". */
export function ColorPalette({ name = "color", value, idPrefix }: { name?: string; value?: string; idPrefix: string }) {
  const selected = (value ?? SUBTEAM_COLORS[0]).toUpperCase();
  return (
    <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Subteam color">
      {SUBTEAM_COLORS.map((hex) => {
        const id = `${idPrefix}-${hex.slice(1)}`;
        return (
          <label key={hex} htmlFor={id} className="cursor-pointer" title={hex}>
            <input type="radio" id={id} name={name} value={hex} defaultChecked={hex === selected} className="peer sr-only" />
            <span
              className={cn(
                "block h-6 w-6 rounded-full border-2 border-transparent ring-1 ring-line-soft transition-transform peer-checked:border-cream peer-checked:ring-2 peer-checked:ring-ink peer-focus-visible:ring-2 peer-focus-visible:ring-ink/60",
              )}
              style={{ backgroundColor: hex }}
            />
          </label>
        );
      })}
    </div>
  );
}
