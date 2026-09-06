"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { safeNext, universityForEmail } from "@/lib/auth";
import { hashPassword, verifyPassword } from "@/lib/password";
import { createSession, destroySession } from "@/lib/session";

export type AuthFormState = { error?: string; fieldErrors?: Record<string, string> };

const emailSchema = z.string().trim().toLowerCase().email("Enter a valid email address.").max(200);
const passwordSchema = z.string().min(8, "Use at least 8 characters.").max(200, "That password is too long.");

const signupSchema = z.object({
  name: z.string().trim().min(1, "Enter your name.").max(80, "Keep your name under 80 characters."),
  email: emailSchema,
  password: passwordSchema,
  program: z.string().trim().max(120).optional().transform((v) => (v ? v : undefined)),
  year: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? Number(v) : undefined))
    .pipe(z.number().int().min(1).max(6).optional()),
});

const loginSchema = z.object({ email: emailSchema, password: z.string().min(1, "Enter your password.").max(200) });

function fieldErrorsOf(err: z.ZodError) {
  const out: Record<string, string> = {};
  for (const issue of err.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

function str(formData: FormData, key: string) {
  const v = formData.get(key);
  return typeof v === "string" ? v : undefined;
}

function domainHint(universities: { domain: string; altDomains: string[] }[]) {
  const all = universities.flatMap((u) => [u.domain, ...u.altDomains]).map((d) => `@${d}`);
  return all.length ? ` (e.g. ${all.join(" or ")})` : "";
}

export async function signup(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const parsed = signupSchema.safeParse({
    name: str(formData, "name"),
    email: str(formData, "email"),
    password: str(formData, "password"),
    program: str(formData, "program"),
    year: str(formData, "year"),
  });
  if (!parsed.success) return { fieldErrors: fieldErrorsOf(parsed.error) };
  const { name, email, password, program, year } = parsed.data;

  const universities = await db.university.findMany({ select: { id: true, domain: true, altDomains: true } });
  const university = universityForEmail(email, universities);
  if (!university) {
    return { error: `Sign up with your university email${domainHint(universities)}`, fieldErrors: { email: "Not a recognised university domain." } };
  }

  const existing = await db.user.findUnique({ where: { email }, select: { id: true } });
  if (existing) {
    return { error: "An account with that email already exists. Log in instead.", fieldErrors: { email: "Already registered." } };
  }

  const passwordHash = await hashPassword(password);
  const user = await db.user.create({
    data: { name, email, passwordHash, program, year, universityId: university.id },
    select: { id: true },
  });
  await createSession(user.id);
  redirect(safeNext(str(formData, "next")));
}

export async function login(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const parsed = loginSchema.safeParse({ email: str(formData, "email"), password: str(formData, "password") });
  if (!parsed.success) return { fieldErrors: fieldErrorsOf(parsed.error) };
  const { email, password } = parsed.data;

  const user = await db.user.findUnique({ where: { email }, select: { id: true, passwordHash: true } });
  const ok = !!user?.passwordHash && (await verifyPassword(password, user.passwordHash));
  if (!user || !ok) return { error: "Email or password is incorrect." };

  await createSession(user.id);
  redirect(safeNext(str(formData, "next")));
}

export async function logout() {
  await destroySession();
  redirect("/login");
}
