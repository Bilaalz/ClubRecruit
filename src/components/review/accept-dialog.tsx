"use client";

import { useRef } from "react";
import { Button, Field, Input, Select, Textarea } from "@/components/ui";
import { acceptApplication } from "@/lib/review-actions";
import { SubmitButton } from "./submit-button";

type Subteam = { id: string; name: string };

export function AcceptDialog({
  applicationId,
  applicantName,
  defaultTitle,
  defaultSubteamId,
  subteams,
  existingMembership,
}: {
  applicationId: string;
  applicantName: string;
  defaultTitle: string;
  defaultSubteamId: string | null;
  subteams: Subteam[];
  existingMembership: { role: string; title: string | null; subteam: { name: string } | null } | null;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  return (
    <>
      <Button type="button" onClick={() => ref.current?.showModal()}>
        Accept
      </Button>
      <dialog
        ref={ref}
        className="m-auto w-full max-w-md rounded-md border border-line bg-cream-2 p-0 text-ink backdrop:bg-ink/40"
        onClick={(e) => {
          if (e.target === ref.current) ref.current?.close();
        }}
      >
        <form action={acceptApplication} className="flex flex-col gap-4 p-6" onClick={(e) => e.stopPropagation()}>
          <input type="hidden" name="applicationId" value={applicationId} />
          <div>
            <div className="eyebrow">Accept applicant</div>
            <h3 className="mt-1 font-serif text-2xl leading-tight">{applicantName}</h3>
            <p className="mt-2 text-sm text-ink-3">
              {existingMembership
                ? `Already a ${existingMembership.role.toLowerCase()} of this club${existingMembership.subteam ? ` (${existingMembership.subteam.name})` : ""}. Accepting updates their title and subteam.`
                : "This creates a membership so they show up on the roster right away."}
            </p>
          </div>

          <Field label="Role title">
            <Input name="title" defaultValue={defaultTitle} required maxLength={80} autoFocus />
          </Field>

          <Field label="Subteam">
            <Select name="subteamId" defaultValue={defaultSubteamId ?? ""}>
              <option value="">No subteam</option>
              {subteams.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Membership role" hint="Leads can be promoted later from the roster.">
            <Select name="role" defaultValue="MEMBER">
              <option value="MEMBER">Member</option>
              <option value="LEAD">Lead</option>
            </Select>
          </Field>

          <Field label="Decision note" hint="Internal. Not shown to the applicant.">
            <Textarea name="note" placeholder="Why this candidate, and anything the lead should know." maxLength={2000} />
          </Field>

          <div className="flex items-center justify-end gap-2 border-t border-line-soft pt-4">
            <Button type="button" variant="ghost" onClick={() => ref.current?.close()}>
              Cancel
            </Button>
            <SubmitButton pendingLabel="Accepting…">Accept &amp; add to roster</SubmitButton>
          </div>
        </form>
      </dialog>
    </>
  );
}
