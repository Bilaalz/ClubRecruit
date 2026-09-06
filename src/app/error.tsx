"use client";

import { useEffect } from "react";
import { Button, ButtonLink } from "@/components/ui";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-3xl px-6 py-24 text-center">
      <div className="eyebrow">Something went wrong</div>
      <h1 className="mt-3 font-serif text-3xl sm:text-4xl">That didn&rsquo;t work.</h1>
      <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-ink-3 sm:text-base">
        {error.message || "An unexpected error interrupted this page."}
        {error.digest && <span className="mt-1 block font-mono text-xs text-ink-4">ref {error.digest}</span>}
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button onClick={reset}>Retry</Button>
        <ButtonLink href="/dashboard" variant="secondary">
          Go to dashboard
        </ButtonLink>
      </div>
    </div>
  );
}
