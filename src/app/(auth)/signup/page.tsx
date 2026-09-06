import { db } from "@/lib/db";
import { safeNext } from "@/lib/auth";
import { SignupForm } from "./signup-form";

export const metadata = { title: "Sign up" };

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const universities = await db.university.findMany({ select: { domain: true, altDomains: true }, orderBy: { name: "asc" } });
  const domains = universities.flatMap((u) => [u.domain, ...u.altDomains]);
  return (
    <div className="mx-auto max-w-md px-6 py-16">
      <SignupForm next={safeNext(next)} domains={domains} />
    </div>
  );
}
