"use client";

import { useActionState } from "react";
import { Button, Field, Input, Textarea } from "@/components/ui";
import { updateClub, type ActionState } from "@/lib/clubs-actions";
import { FormNotice, FieldError } from "@/components/clubs/form-notice";

export function ClubSettingsForm({
  club,
}: {
  club: { id: string; slug: string; name: string; tagline: string | null; description: string };
}) {
  const [state, action, pending] = useActionState<ActionState, FormData>(updateClub, null);
  const fe = state?.fieldErrors ?? {};

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="clubId" value={club.id} />
      <input type="hidden" name="slug" value={club.slug} />
      <FormNotice state={state} />
      <Field label="Club name">
        <Input name="name" defaultValue={club.name} required maxLength={80} aria-invalid={!!fe.name} />
        <FieldError message={fe.name} />
      </Field>
      <Field label="Tagline" hint="One sentence shown under the club name.">
        <Input name="tagline" defaultValue={club.tagline ?? ""} maxLength={140} aria-invalid={!!fe.tagline} />
        <FieldError message={fe.tagline} />
      </Field>
      <Field label="Description">
        <Textarea name="description" defaultValue={club.description} rows={6} required aria-invalid={!!fe.description} />
        <FieldError message={fe.description} />
      </Field>
      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save details"}
        </Button>
      </div>
    </form>
  );
}
