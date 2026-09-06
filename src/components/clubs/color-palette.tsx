import { SUBTEAM_COLORS } from "@/lib/clubs";
import { cn } from "@/lib/cn";

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
