"use client";

import { useActionState } from "react";
import { cn } from "@/lib/cn";

export type FormState = { error?: string; success?: string } | undefined;
export type FormAction = (prev: FormState, formData: FormData) => Promise<FormState>;

/**
 * `<form>` bound to a server action that returns `{ error }` / `{ success }`
 * instead of throwing. Inputs are disabled while pending and the message renders
 * inline under the fields. Use it wherever a plain server-component form used to
 * `action={serverAction}` directly.
 */
export function ActionForm({
  action,
  className,
  children,
  ...props
}: Omit<React.ComponentProps<"form">, "action"> & { action: FormAction }) {
  const [state, formAction, pending] = useActionState(action, undefined);
  // Layout classes go on the fieldset so `space-y-*` etc. still apply to the fields.
  return (
    <form action={formAction} aria-busy={pending || undefined} {...props}>
      <fieldset disabled={pending} className={cn("min-w-0", className, pending && "opacity-70")}>
        {children}
      </fieldset>
      <FormMessage state={state} />
    </form>
  );
}

export function FormMessage({ state, className }: { state: FormState; className?: string }) {
  if (!state?.error && !state?.success) return null;
  return (
    <p
      role={state.error ? "alert" : "status"}
      className={cn(
        "mt-4 rounded-sm border px-3 py-2 text-sm",
        state.error ? "border-bad/40 bg-[#f1dede] text-bad" : "border-ok/40 bg-[#e3eee3] text-ok",
        className,
      )}
    >
      {state.error ?? state.success}
    </p>
  );
}
