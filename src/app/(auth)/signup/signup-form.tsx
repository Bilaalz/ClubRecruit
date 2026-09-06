"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signup, type AuthFormState } from "@/lib/auth-actions";
import { Button, Card, CardBody, Field, Input, Select } from "@/components/ui";

export function SignupForm({ next, domains }: { next: string; domains: string[] }) {
  const [state, action, pending] = useActionState<AuthFormState, FormData>(signup, {});
  const fe = state.fieldErrors ?? {};
  const domainHint = domains.length ? `Must end in ${domains.map((d) => `@${d}`).join(" or ")}.` : undefined;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="eyebrow mb-2">ClubRecruit</div>
        <h1 className="font-serif text-3xl leading-tight">Create your account</h1>
        <p className="mt-2 text-sm text-ink-3">Signup is restricted to university email addresses.</p>
      </div>

      <Card>
        <CardBody className="py-6">
          <form action={action} className="space-y-4" noValidate>
            <input type="hidden" name="next" value={next} />
            <Field label="Full name" hint={fe.name}>
              <Input name="name" autoComplete="name" required placeholder="Ada Lovelace" aria-invalid={!!fe.name} />
            </Field>
            <Field label="University email" hint={fe.email ?? domainHint}>
              <Input name="email" type="email" autoComplete="email" required placeholder="you@mail.utoronto.ca" aria-invalid={!!fe.email} />
            </Field>
            <Field label="Password" hint={fe.password ?? "At least 8 characters."}>
              <Input name="password" type="password" autoComplete="new-password" required minLength={8} aria-invalid={!!fe.password} />
            </Field>
            <div className="grid grid-cols-3 gap-3">
              <Field label="Program" className="col-span-2" hint={fe.program}>
                <Input name="program" placeholder="Computer Science" aria-invalid={!!fe.program} />
              </Field>
              <Field label="Year" hint={fe.year}>
                <Select name="year" defaultValue="" aria-invalid={!!fe.year}>
                  <option value="">—</option>
                  {[1, 2, 3, 4, 5, 6].map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
            {state.error && (
              <p className="border-l-2 border-bad pl-3 text-sm text-bad" role="alert">
                {state.error}
              </p>
            )}
            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? "Creating account…" : "Sign up"}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-ink-3">
            Already have an account?{" "}
            <Link href={next === "/dashboard" ? "/login" : `/login?next=${encodeURIComponent(next)}`} className="underline">
              Log in
            </Link>
          </p>
        </CardBody>
      </Card>
    </div>
  );
}
