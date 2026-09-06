import { ButtonLink } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-24 text-center">
      <div className="font-serif text-8xl leading-none text-ink-4 sm:text-9xl">404</div>
      <h1 className="mt-6 font-serif text-3xl sm:text-4xl">There&rsquo;s nothing at this address.</h1>
      <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-ink-3 sm:text-base">
        The page may have moved, the record may have been removed, or the link was never right to begin with.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <ButtonLink href="/dashboard">Go to dashboard</ButtonLink>
        <ButtonLink href="/" variant="secondary">
          Home
        </ButtonLink>
      </div>
    </div>
  );
}
