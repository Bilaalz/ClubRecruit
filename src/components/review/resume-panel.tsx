import { Button, Card, CardBody, CardHeader, CardTitle, EmptyState } from "@/components/ui";
import { formatBytes, type ReviewApplication } from "@/lib/review";

export function ResumePanel({ application }: { application: ReviewApplication }) {
  const resume = application.resume;
  const ext = resume?.fileName.split(".").pop()?.toUpperCase() ?? "FILE";

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div>
          <div className="eyebrow">Resume</div>
          <CardTitle className="mt-1">Background</CardTitle>
        </div>
      </CardHeader>
      <CardBody className="flex flex-1 flex-col gap-5">
        {!resume ? (
          <EmptyState title="No resume on file" description="The applicant has not uploaded a resume." />
        ) : (
          <>
            <div className="flex items-center gap-3 rounded-sm border border-line-soft bg-cream px-3 py-2.5">
              <FileIcon />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{resume.fileName}</div>
                <div className="text-xs text-ink-4">
                  {ext} · {formatBytes(resume.sizeBytes)}
                </div>
              </div>
              <Button type="button" variant="secondary" size="sm" disabled title="Demo: file not stored">
                View
              </Button>
            </div>

            {application.coverNote && (
              <div>
                <div className="eyebrow mb-1.5">Cover note</div>
                <blockquote className="border-l-2 border-line pl-3 text-sm leading-relaxed text-ink-2">{application.coverNote}</blockquote>
              </div>
            )}

            <div>
              <div className="eyebrow mb-1.5">Extracted text</div>
              <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-ink-2">{resume.extractedText}</pre>
            </div>
          </>
        )}
      </CardBody>
    </Card>
  );
}

function FileIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="shrink-0 text-ink" aria-hidden>
      <path d="M14 3H7a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V8l-4-5Z" />
      <path d="M14 3v5h4" />
      <path d="M9 13h6M9 17h6" />
    </svg>
  );
}
