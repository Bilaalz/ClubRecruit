"use client";

import { useRef } from "react";
import { Button, Field, Textarea } from "@/components/ui";
import { rejectApplication } from "@/lib/review-actions";
import { SubmitButton } from "./submit-button";

export function RejectDialog({ applicationId, applicantName }: { applicationId: string; applicantName: string }) {
  const ref = useRef<HTMLDialogElement>(null);

  return (
    <>
      <Button type="button" variant="danger" onClick={() => ref.current?.showModal()}>
        Reject
      </Button>
      <dialog
        ref={ref}
        className="m-auto w-full max-w-md rounded-md border border-line bg-cream-2 p-0 text-ink backdrop:bg-ink/40"
        onClick={(e) => {
          if (e.target === ref.current) ref.current?.close();
        }}
      >
        <form action={rejectApplication} className="flex flex-col gap-4 p-6" onClick={(e) => e.stopPropagation()}>
          <input type="hidden" name="applicationId" value={applicationId} />
          <div>
            <div className="eyebrow">Reject applicant</div>
            <h3 className="mt-1 font-serif text-2xl leading-tight">{applicantName}</h3>
            <p className="mt-2 text-sm text-ink-3">You can reopen the decision later if the committee changes its mind.</p>
          </div>

          <Field label="Decision note (optional)" hint="Internal. Not shown to the applicant.">
            <Textarea name="note" placeholder="Reason, or what would make a future application stronger." maxLength={2000} autoFocus />
          </Field>

          <div className="flex items-center justify-end gap-2 border-t border-line-soft pt-4">
            <Button type="button" variant="ghost" onClick={() => ref.current?.close()}>
              Cancel
            </Button>
            <SubmitButton variant="danger" pendingLabel="Rejecting…">
              Reject application
            </SubmitButton>
          </div>
        </form>
      </dialog>
    </>
  );
}
