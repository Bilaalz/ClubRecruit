"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Button, Field, Input, Select, Textarea, buttonClasses } from "@/components/ui";
import { createPosting, updatePosting, type ActionState } from "@/lib/postings-actions";
import { PostingStatus } from "@/generated/prisma/enums";
import { FormNotice, FieldError } from "@/components/clubs/form-notice";
import { labelFor } from "@/lib/status";

export type PostingFormValues = {
  id?: string;
  title: string;
  subteamId: string | null;
  description: string;
  requirements: string[];
  responsibilities: string[];
  interviewQuestions: string[];
  openings: number;
  closesAt: string; // yyyy-mm-dd or ""
  status: PostingStatus;
};

const EMPTY: PostingFormValues = {
  title: "",
  subteamId: null,
  description: "",
  requirements: [],
  responsibilities: [],
  interviewQuestions: [],
  openings: 1,
  closesAt: "",
  status: "DRAFT",
};

export function PostingForm({
  club,
  subteams,
  initial,
}: {
  club: { id: string; slug: string };
  subteams: { id: string; name: string }[];
  initial?: PostingFormValues;
}) {
  const values = initial ?? EMPTY;
  const editing = !!values.id;
  const [state, action, pending] = useActionState<ActionState, FormData>(editing ? updatePosting : createPosting, null);
  const fe = state?.fieldErrors ?? {};
  const backHref = `/clubs/${club.slug}/manage/postings`;

  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="clubId" value={club.id} />
      <input type="hidden" name="slug" value={club.slug} />
      {values.id && <input type="hidden" name="id" value={values.id} />}
      <FormNotice state={state} />

      <Field label="Title">
        <Input name="title" defaultValue={values.title} placeholder="e.g. Web Developer — Fixtures & Standings" required maxLength={120} aria-invalid={!!fe.title} />
        <FieldError message={fe.title} />
      </Field>

      <div className="grid gap-5 sm:grid-cols-3">
        <Field label="Subteam" className="sm:col-span-1">
          <Select name="subteamId" defaultValue={values.subteamId ?? ""} aria-invalid={!!fe.subteamId}>
            <option value="">No subteam</option>
            {subteams.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
          <FieldError message={fe.subteamId} />
        </Field>
        <Field label="Openings">
          <Input name="openings" type="number" min={1} max={99} defaultValue={values.openings} required aria-invalid={!!fe.openings} />
          <FieldError message={fe.openings} />
        </Field>
        <Field label="Closes on" hint="Leave blank for rolling applications.">
          <Input name="closesAt" type="date" defaultValue={values.closesAt} aria-invalid={!!fe.closesAt} />
          <FieldError message={fe.closesAt} />
        </Field>
      </div>

      <Field label="Description" hint="Plain text. Blank lines start a new paragraph.">
        <Textarea name="description" defaultValue={values.description} rows={7} required aria-invalid={!!fe.description} />
        <FieldError message={fe.description} />
      </Field>

      <div className="grid gap-5 md:grid-cols-2">
        <Field label="Requirements" hint="One per line.">
          <Textarea name="requirements" defaultValue={values.requirements.join("\n")} rows={5} placeholder={"Comfortable in JavaScript or TypeScript\nAvailable ~8 hours/week"} />
          <FieldError message={fe.requirements} />
        </Field>
        <Field label="Responsibilities" hint="One per line.">
          <Textarea name="responsibilities" defaultValue={values.responsibilities.join("\n")} rows={5} placeholder={"Own one part of the platform\nJoin weekly syncs"} />
          <FieldError message={fe.responsibilities} />
        </Field>
      </div>

      <Field label="Interview questions" hint="One per line. Applicants answer these in the recorded interview.">
        <Textarea name="interviewQuestions" defaultValue={values.interviewQuestions.join("\n")} rows={5} placeholder={"Tell us about a project you're proud of.\nWhy this role?"} />
        <FieldError message={fe.interviewQuestions} />
      </Field>

      <div className="grid gap-5 sm:grid-cols-3">
        <Field label="Status" hint="Only open postings accept applications.">
          <Select name="status" defaultValue={values.status} aria-invalid={!!fe.status}>
            {Object.values(PostingStatus).map((s) => (
              <option key={s} value={s}>
                {labelFor(s)}
              </option>
            ))}
          </Select>
          <FieldError message={fe.status} />
        </Field>
      </div>

      <div className="flex items-center justify-end gap-2 border-t border-line pt-6">
        <Link href={backHref} className={buttonClasses({ variant: "ghost" })}>
          Cancel
        </Link>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : editing ? "Save changes" : "Create posting"}
        </Button>
      </div>
    </form>
  );
}
