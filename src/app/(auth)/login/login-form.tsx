"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { login, type AuthFormState } from "@/lib/auth-actions";
import { Button, Card, CardBody, CardHeader, CardTitle, Field, Input } from "@/components/ui";

const DEMO_PASSWORD = "clubrecruit";
const DEMO_ACCOUNTS = [
  { email: "priya@utoronto.ca", label: "Club owner" },
  { email: "marcus@utoronto.ca", label: "Software lead" },
  { email: "aisha@mail.utoronto.ca", label: "Applicant" },
  { email: "newstudent@mail.utoronto.ca", label: "New student" },
];

export function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState<AuthFormState, FormData>(login, {});
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const fe = state.fieldErrors ?? {};

  function fillDemo(demoEmail: string) {
    setEmail(demoEmail);
    setPassword(DEMO_PASSWORD);
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="eyebrow mb-2">ClubRecruit</div>
        <h1 className="font-serif text-3xl leading-tight">Welcome back</h1>
        <p className="mt-2 text-sm text-ink-3">Log in with your university email.</p>
      </div>

      <Card>
        <CardBody className="py-6">
          <form action={action} className="space-y-4" noValidate>
            <input type="hidden" name="next" value={next} />
            <Field label="Email" hint={fe.email}>
              <Input
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@utoronto.ca"
                aria-invalid={!!fe.email}
              />
            </Field>
            <Field label="Password" hint={fe.password}>
              <Input
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-invalid={!!fe.password}
              />
            </Field>
            {state.error && (
              <p className="border-l-2 border-bad pl-3 text-sm text-bad" role="alert">
                {state.error}
              </p>
            )}
            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? "Logging in…" : "Log in"}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-ink-3">
            New here?{" "}
            <Link href={next === "/dashboard" ? "/signup" : `/signup?next=${encodeURIComponent(next)}`} className="underline">
              Create an account
            </Link>
          </p>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Demo accounts</CardTitle>
            <p className="mt-1 text-xs text-ink-4">
              Password for all: <code className="rounded-sm bg-cream-3 px-1 py-0.5 text-ink">{DEMO_PASSWORD}</code>
            </p>
          </div>
        </CardHeader>
        <ul className="divide-y divide-line-soft">
          {DEMO_ACCOUNTS.map((a) => (
            <li key={a.email} className="flex items-center justify-between gap-3 px-5 py-3">
              <div className="min-w-0">
                <div className="truncate text-sm">{a.email}</div>
                <div className="text-xs text-ink-4">{a.label}</div>
              </div>
              <Button type="button" variant="secondary" size="sm" onClick={() => fillDemo(a.email)}>
                Use
              </Button>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
