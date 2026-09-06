import Link from "next/link";
import { SubteamChip } from "@/components/clubs/subteam-chip";
import { formatDate } from "@/lib/postings";

/** Row used on the dashboard and club overview. */
export function PostingListItem({
  posting,
  showClub = false,
}: {
  posting: {
    id: string;
    title: string;
    openings: number;
    closesAt: Date | null;
    subteam: { name: string; color: string } | null;
    club?: { slug: string; name: string } | null;
  };
  showClub?: boolean;
}) {
  return (
    <li className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 py-4">
      <div className="min-w-0">
        <Link href={`/postings/${posting.id}`} className="font-medium hover:underline">
          {posting.title}
        </Link>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-3">
          {showClub && posting.club && (
            <Link href={`/clubs/${posting.club.slug}`} className="hover:underline">
              {posting.club.name}
            </Link>
          )}
          <SubteamChip subteam={posting.subteam} />
        </div>
      </div>
      <div className="flex items-center gap-6 text-xs text-ink-3">
        <span>
          {posting.openings} opening{posting.openings === 1 ? "" : "s"}
        </span>
        <span>{posting.closesAt ? `Closes ${formatDate(posting.closesAt)}` : "Rolling"}</span>
        <Link href={`/postings/${posting.id}`} className="text-ink underline-offset-2 hover:underline">
          View →
        </Link>
      </div>
    </li>
  );
}
