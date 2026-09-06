"use client";

import { useActionState, useId, useState } from "react";
import { Button, Field, Textarea } from "@/components/ui";
import { createApplication, type ActionState } from "@/lib/applications-actions";
import { cn } from "@/lib/cn";

const DEFAULT_FILE = "resume.pdf";

export function ResumeForm({ postingId, sampleResume, applicantName }: { postingId: string; sampleResume: string; applicantName: string }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(createApplication, undefined);
  const [file, setFile] = useState<{ name: string; size: number } | null>(null);
  const [dragging, setDragging] = useState(false);
  const inputId = useId();

  const fileName = file?.name ?? DEFAULT_FILE;
  const sizeBytes = file?.size ?? 0;

  return (
    <form action={action} className="space-y-8">
      <input type="hidden" name="postingId" value={postingId} />
      <input type="hidden" name="fileName" value={fileName} />
      <input type="hidden" name="sizeBytes" value={sizeBytes} />

      <Field label="Cover note" hint="Optional. One or two sentences on why this role.">
        <Textarea
          name="coverNote"
          placeholder={`Hi, I'm ${applicantName.split(" ")[0]} and I'd like to join because…`}
          maxLength={2000}
        />
      </Field>

      <div>
        <div className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink-3">Resume (PDF)</div>
        <label
          htmlFor={inputId}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            const f = e.dataTransfer.files?.[0];
            if (f) setFile({ name: f.name, size: f.size });
          }}
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center rounded-md border border-dashed px-6 py-10 text-center transition-colors",
            dragging ? "border-ink bg-cream-3" : "border-line-soft bg-cream-2 hover:border-ink",
          )}
        >
          <span className="font-serif text-lg">{file ? file.name : "Drop your resume here"}</span>
          <span className="mt-1 text-xs text-ink-4">
            {file ? `${Math.max(1, Math.round(file.size / 1024))} KB · click to change` : "or click to choose a PDF"}
          </span>
          <input
            id={inputId}
            type="file"
            accept=".pdf,application/pdf"
            className="sr-only"
            onChange={(e) => {
              const f = e.target.files?.[0];
              setFile(f ? { name: f.name, size: f.size } : null);
            }}
          />
        </label>
        <p className="mt-1 text-xs text-ink-4">
          Demo: the file is not uploaded. We record its name and size and use the text below as the extracted content
          {file ? "" : ` (defaults to ${DEFAULT_FILE})`}.
        </p>
      </div>

      <Field label="Extracted text (demo: paste or edit)" hint="This is what the club and the AI evaluator will read.">
        <Textarea name="extractedText" defaultValue={sampleResume} className="min-h-[320px] font-mono text-xs" required />
      </Field>

      {state?.error && (
        <p role="alert" className="rounded-sm border border-bad px-3 py-2 text-sm text-bad">
          {state.error}
        </p>
      )}

      <div className="flex items-center justify-between gap-4 border-t border-line pt-6">
        <span className="text-xs text-ink-4">Next: a short recorded interview.</span>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Continue to interview"}
        </Button>
      </div>
    </form>
  );
}
