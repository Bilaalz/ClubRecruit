import { Badge, Button, Card, CardBody, CardHeader, CardTitle, EmptyState } from "@/components/ui";
import { cn } from "@/lib/cn";
import { formatDate, labelFor, parseRubric, recommendationTone, type ReviewApplication } from "@/lib/review";
import { rerunEvaluation } from "@/lib/review-actions";
import { ScoreRing } from "./score-ring";

export function EvaluationPanel({ application }: { application: ReviewApplication }) {
  const evaluation = application.evaluation;
  const canEvaluate = !!application.interview;

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-start">
        <div>
          <div className="eyebrow">AI evaluation</div>
          <CardTitle className="mt-1">Assessment</CardTitle>
          <p className="mt-1 text-xs text-ink-4">AI opinion — a starting point for the committee, not a decision.</p>
        </div>
        {evaluation && (
          <form action={rerunEvaluation}>
            <input type="hidden" name="applicationId" value={application.id} />
            <Button type="submit" variant="ghost" size="sm" disabled={!canEvaluate} title={canEvaluate ? "Re-run the AI evaluation" : "Needs a completed interview"}>
              Re-run
            </Button>
          </form>
        )}
      </CardHeader>
      <CardBody className="flex flex-1 flex-col gap-5">
        {!evaluation ? (
          <EmptyState
            title="Not evaluated yet"
            description={canEvaluate ? "Run the AI evaluation to get a score, recommendation and rubric for this interview." : "The AI evaluation runs once the applicant has completed their interview."}
            action={
              <form action={rerunEvaluation}>
                <input type="hidden" name="applicationId" value={application.id} />
                <Button type="submit" variant="secondary" size="sm" disabled={!canEvaluate}>
                  Run AI evaluation
                </Button>
              </form>
            }
          />
        ) : (
          <>
            <div className="flex items-center gap-5">
              <ScoreRing score={evaluation.overallScore} />
              <div className="flex flex-col gap-1.5">
                <div className="eyebrow">Overall</div>
                <Badge tone={recommendationTone[evaluation.recommendation]} className="w-fit">
                  {labelFor(evaluation.recommendation)}
                </Badge>
                <div className="text-xs text-ink-4">
                  {evaluation.model} · {formatDate(evaluation.createdAt)}
                </div>
              </div>
            </div>

            <p className="text-sm leading-relaxed text-ink-2">{evaluation.summary}</p>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              <ListBlock label="Strengths" items={evaluation.strengths} mark="✓" markClass="text-ok" />
              <ListBlock label="Concerns" items={evaluation.concerns} mark="!" markClass="text-warn" />
            </div>

            <RubricTable rubric={parseRubric(evaluation.rubric)} />
          </>
        )}
      </CardBody>
    </Card>
  );
}

function ListBlock({ label, items, mark, markClass }: { label: string; items: string[]; mark: string; markClass: string }) {
  return (
    <div>
      <div className="eyebrow mb-1.5">{label}</div>
      {items.length === 0 ? (
        <p className="text-sm text-ink-4">None noted.</p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {items.map((item, i) => (
            <li key={i} className="flex gap-2 text-sm leading-relaxed">
              <span className={cn("w-3 shrink-0 font-medium", markClass)} aria-hidden>
                {mark}
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function RubricTable({ rubric }: { rubric: ReturnType<typeof parseRubric> }) {
  if (rubric.length === 0) return null;
  return (
    <div>
      <div className="eyebrow mb-1.5">Rubric</div>
      <table className="w-full text-sm">
        <tbody>
          {rubric.map((row) => (
            <tr key={row.criterion} className="border-t border-line-soft align-top">
              <td className="py-2 pr-3 font-medium">{row.criterion}</td>
              <td className="py-2 pr-3">
                <span className="inline-flex gap-1" role="img" aria-label={`${row.score} out of 5`}>
                  {Array.from({ length: 5 }, (_, i) => (
                    <span key={i} className={cn("inline-block h-2.5 w-2.5 border border-ink", i < row.score ? "bg-ink" : "bg-transparent")} />
                  ))}
                </span>
              </td>
              <td className="py-2 text-ink-3">{row.note}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
