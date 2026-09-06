import Link from "next/link";
import { Button, Label, Select } from "@/components/ui";
import { STATUS_ORDER, type PipelineSort } from "@/lib/review";
import { labelFor } from "@/lib/status";
import type { ApplicationStatus } from "@/generated/prisma/enums";

type PostingOption = { id: string; title: string; status: string };

/** GET form so filters live in the URL and survive reloads / sharing. */
export function PipelineFilters({
  basePath,
  postings,
  postingId,
  status,
  sort,
}: {
  basePath: string;
  postings: PostingOption[];
  postingId?: string;
  status?: ApplicationStatus;
  sort: PipelineSort;
}) {
  const hasFilters = !!postingId || !!status || sort !== "score";
  return (
    <form method="get" action={basePath} className="flex flex-wrap items-end gap-3">
      <div className="min-w-56">
        <Label htmlFor="posting">Posting</Label>
        <Select id="posting" name="posting" defaultValue={postingId ?? ""}>
          <option value="">All postings</option>
          {postings.map((p) => (
            <option key={p.id} value={p.id}>
              {p.title}
              {p.status !== "OPEN" ? ` (${p.status.toLowerCase()})` : ""}
            </option>
          ))}
        </Select>
      </div>
      <div className="min-w-44">
        <Label htmlFor="status">Status</Label>
        <Select id="status" name="status" defaultValue={status ?? ""}>
          <option value="">All statuses</option>
          {STATUS_ORDER.map((s) => (
            <option key={s} value={s}>
              {labelFor(s)}
            </option>
          ))}
        </Select>
      </div>
      <div className="min-w-36">
        <Label htmlFor="sort">Sort</Label>
        <Select id="sort" name="sort" defaultValue={sort}>
          <option value="score">AI score</option>
          <option value="newest">Newest</option>
        </Select>
      </div>
      <div className="flex items-center gap-2">
        <Button type="submit" variant="secondary">
          Apply
        </Button>
        {hasFilters && (
          <Link href={basePath} className="text-sm text-ink-3 underline underline-offset-4 hover:text-ink">
            Clear
          </Link>
        )}
      </div>
    </form>
  );
}
