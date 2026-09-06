"use client";

import { useActionState } from "react";
import { Button, Field, Input } from "@/components/ui";
import { createSubteam, deleteSubteam, updateSubteam, type ActionState } from "@/lib/clubs-actions";
import { ColorPalette } from "@/components/clubs/color-palette";
import { FormNotice, FieldError } from "@/components/clubs/form-notice";

type SubteamRow = {
  id: string;
  name: string;
  description: string | null;
  color: string;
  _count: { memberships: number; postings: number; workstreams: number };
};

type ClubRef = { id: string; slug: string };

function HiddenClub({ club }: { club: ClubRef }) {
  return (
    <>
      <input type="hidden" name="clubId" value={club.id} />
      <input type="hidden" name="slug" value={club.slug} />
    </>
  );
}

function SubteamRowForm({ club, subteam }: { club: ClubRef; subteam: SubteamRow }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(updateSubteam, null);
  const fe = state?.fieldErrors ?? {};
  const inUse = subteam._count.memberships + subteam._count.postings + subteam._count.workstreams;

  return (
    <li className="py-5">
      <form action={action} className="grid gap-4 sm:grid-cols-[1fr_1fr_auto]">
        <HiddenClub club={club} />
        <input type="hidden" name="id" value={subteam.id} />
        <div className="sm:col-span-3">
          <FormNotice state={state} />
        </div>
        <Field label="Name">
          <Input name="name" defaultValue={subteam.name} required maxLength={40} aria-invalid={!!fe.name} />
          <FieldError message={fe.name} />
        </Field>
        <Field label="Description">
          <Input name="description" defaultValue={subteam.description ?? ""} maxLength={160} aria-invalid={!!fe.description} />
          <FieldError message={fe.description} />
        </Field>
        <Field label="Color" className="sm:col-span-3 md:col-span-1">
          <div className="pt-1.5">
            <ColorPalette value={subteam.color} idPrefix={`st-${subteam.id}`} />
            <FieldError message={fe.color} />
          </div>
        </Field>
        <div className="flex items-center justify-between gap-3 sm:col-span-3">
          <p className="text-xs text-ink-4">
            {subteam._count.memberships} member{subteam._count.memberships === 1 ? "" : "s"} · {subteam._count.postings} posting
            {subteam._count.postings === 1 ? "" : "s"} · {subteam._count.workstreams} workstream{subteam._count.workstreams === 1 ? "" : "s"}
          </p>
          <div className="flex items-center gap-2">
            <Button type="submit" variant="secondary" size="sm" disabled={pending}>
              {pending ? "Saving…" : "Save"}
            </Button>
            <Button
              type="submit"
              variant="danger"
              size="sm"
              formAction={deleteSubteam}
              formNoValidate
              onClick={(e) => {
                const msg =
                  inUse > 0
                    ? `Delete “${subteam.name}”? ${inUse} linked record${inUse === 1 ? "" : "s"} will be left without a subteam.`
                    : `Delete “${subteam.name}”?`;
                if (!window.confirm(msg)) e.preventDefault();
              }}
            >
              Delete
            </Button>
          </div>
        </div>
      </form>
    </li>
  );
}

function AddSubteamForm({ club }: { club: ClubRef }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(createSubteam, null);
  const fe = state?.fieldErrors ?? {};
  return (
    <form action={action} className="grid gap-4 sm:grid-cols-[1fr_1fr_auto]" key={state?.success ?? "add"}>
      <HiddenClub club={club} />
      <div className="sm:col-span-3">
        <FormNotice state={state} />
      </div>
      <Field label="Name">
        <Input name="name" placeholder="e.g. Firmware" required maxLength={40} aria-invalid={!!fe.name} />
        <FieldError message={fe.name} />
      </Field>
      <Field label="Description">
        <Input name="description" placeholder="What this subteam owns" maxLength={160} aria-invalid={!!fe.description} />
        <FieldError message={fe.description} />
      </Field>
      <Field label="Color" className="sm:col-span-3 md:col-span-1">
        <div className="pt-1.5">
          <ColorPalette idPrefix="st-new" />
          <FieldError message={fe.color} />
        </div>
      </Field>
      <div className="flex justify-end sm:col-span-3">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Adding…" : "Add subteam"}
        </Button>
      </div>
    </form>
  );
}

export function SubteamEditor({ club, subteams }: { club: ClubRef; subteams: SubteamRow[] }) {
  return (
    <div>
      {subteams.length === 0 ? (
        <p className="py-4 text-sm text-ink-3">No subteams yet. Add one below.</p>
      ) : (
        <ul className="divide-y divide-line-soft">
          {subteams.map((s) => (
            <SubteamRowForm key={s.id} club={club} subteam={s} />
          ))}
        </ul>
      )}
      <div className="mt-6 border-t border-line pt-6">
        <div className="eyebrow mb-4">Add a subteam</div>
        <AddSubteamForm club={club} />
      </div>
    </div>
  );
}
