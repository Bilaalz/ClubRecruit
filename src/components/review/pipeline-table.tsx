import Link from "next/link";
import { Avatar, Badge, ButtonLink, EmptyState } from "@/components/ui";
import { cn } from "@/lib/cn";
import { formatRelative, labelFor, recommendationTone, statusTone, type PipelineRow } from "@/lib/review";
import { ScoreBar } from "./score-bar";

export function PipelineTable({ rows, basePath }: { rows: PipelineRow[]; basePath: string }) {
  if (rows.length === 0) {
    return (
      <EmptyState
        title="No applications match"
        description="Try a different posting or status filter, or clear the filters to see the whole pipeline."
        action={
          <ButtonLink href={basePath} variant="secondary" size="sm">
            Clear filters
          </ButtonLink>
        }
      />
    );
  }

  return (
    <div className="overflow-x-auto rounded-md border border-line bg-cream-2">
      <table className="w-full min-w-[840px] text-sm">
        <thead>
          <tr className="border-b border-line text-left">
            <Th>Applicant</Th>
            <Th>Posting</Th>
            <Th>Status</Th>
            <Th>AI score</Th>
            <Th>Recommendation</Th>
            <Th>Submitted</Th>
            <Th className="text-right">
              <span className="sr-only">Action</span>
            </Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const href = `${basePath}/${row.id}`;
            const meta = [row.applicant.program, row.applicant.year ? `Year ${row.applicant.year}` : null]
              .filter(Boolean)
              .join(" · ");
            return (
              <tr key={row.id} className="border-b border-line-soft last:border-b-0 hover:bg-cream-3/50">
                <Td>
                  <Link href={href} className="flex items-center gap-3">
                    <Avatar name={row.applicant.name} />
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{row.applicant.name}</span>
                      {meta && <span className="block truncate text-xs text-ink-4">{meta}</span>}
                    </span>
                  </Link>
                </Td>
                <Td>
                  <span className="block">{row.posting.title}</span>
                  {row.posting.subteam && (
                    <span className="mt-0.5 inline-flex items-center gap-1.5 text-xs text-ink-4">
                      <span className="inline-block h-2 w-2 rounded-full" style={{ background: row.posting.subteam.color }} aria-hidden />
                      {row.posting.subteam.name}
                    </span>
                  )}
                </Td>
                <Td>
                  <Badge tone={statusTone[row.status]}>{labelFor(row.status)}</Badge>
                </Td>
                <Td>
                  <ScoreBar score={row.evaluation?.overallScore} />
                </Td>
                <Td>
                  {row.evaluation ? (
                    <Badge tone={recommendationTone[row.evaluation.recommendation]}>{labelFor(row.evaluation.recommendation)}</Badge>
                  ) : (
                    <span className="text-ink-4">—</span>
                  )}
                </Td>
                <Td>
                  <time dateTime={row.createdAt.toISOString()} title={row.createdAt.toLocaleString("en-CA")} className="text-ink-3">
                    {formatRelative(row.createdAt)}
                  </time>
                </Td>
                <Td className="text-right">
                  <ButtonLink href={href} variant="secondary" size="sm">
                    Review
                  </ButtonLink>
                </Td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function Th({ className, children }: { className?: string; children?: React.ReactNode }) {
  return <th className={cn("eyebrow px-4 py-3 font-medium", className)}>{children}</th>;
}

function Td({ className, children }: { className?: string; children?: React.ReactNode }) {
  return <td className={cn("px-4 py-3 align-middle", className)}>{children}</td>;
}
