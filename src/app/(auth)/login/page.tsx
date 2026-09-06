import { safeNext } from "@/lib/auth";
import { LoginForm } from "./login-form";

export const metadata = { title: "Log in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return (
    <div className="mx-auto max-w-md px-6 py-16">
      <LoginForm next={safeNext(next)} />
    </div>
  );
}
