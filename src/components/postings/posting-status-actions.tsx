import { Button, buttonClasses } from "@/components/ui";
import Link from "next/link";
import { setPostingStatus } from "@/lib/postings-actions";
import type { PostingStatus } from "@/generated/prisma/enums";

/** Publish / Close / Reopen + Edit for a postings table row. Server component; plain forms. */
export function PostingStatusActions({
  club,
  posting,
}: {
  club: { id: string; slug: string };
  posting: { id: string; status: PostingStatus };
}) {
  const next: { status: PostingStatus; label: string; variant: "primary" | "secondary" | "danger" } | null =
    posting.status === "DRAFT"
      ? { status: "OPEN", label: "Publish", variant: "primary" }
      : posting.status === "OPEN"
        ? { status: "CLOSED", label: "Close", variant: "danger" }
        : { status: "OPEN", label: "Reopen", variant: "secondary" };

  return (
    <div className="flex items-center justify-end gap-2">
      {next && (
        <form action={setPostingStatus}>
          <input type="hidden" name="clubId" value={club.id} />
          <input type="hidden" name="slug" value={club.slug} />
          <input type="hidden" name="id" value={posting.id} />
          <input type="hidden" name="status" value={next.status} />
          <Button type="submit" size="sm" variant={next.variant}>
            {next.label}
          </Button>
        </form>
      )}
      <Link href={`/clubs/${club.slug}/manage/postings/${posting.id}/edit`} className={buttonClasses({ variant: "ghost", size: "sm" })}>
        Edit
      </Link>
    </div>
  );
}
