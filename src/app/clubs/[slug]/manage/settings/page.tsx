import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getClubContext } from "@/lib/auth";
import { getClubSettings } from "@/lib/clubs";
import { ClubSettingsForm } from "@/components/clubs/club-settings-form";
import { SubteamEditor } from "@/components/clubs/subteam-editor";

export const metadata = { title: "Settings" };

export default async function ClubSettingsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const ctx = await getClubContext(slug);
  if (!ctx) notFound();
  if (!ctx.isAdmin) redirect(`/clubs/${slug}`);

  const club = await getClubSettings(ctx.club.id);
  if (!club) notFound();

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <div className="mb-8 border-b border-line pb-4">
        <div className="eyebrow mb-1">
          <Link href={`/clubs/${slug}/manage`} className="hover:underline">
            Manage
          </Link>
        </div>
        <h2 className="font-serif text-2xl">Settings</h2>
      </div>

      <section className="space-y-4">
        <h3 className="font-serif text-xl">Club details</h3>
        <ClubSettingsForm club={{ id: club.id, slug: club.slug, name: club.name, tagline: club.tagline, description: club.description }} />
      </section>

      <section className="mt-12 border-t border-line pt-8">
        <h3 className="font-serif text-xl">Subteams</h3>
        <p className="mt-1 mb-2 text-sm text-ink-3">
          Subteams group members, postings and workstreams. Deleting one keeps those records but unlinks them.
        </p>
        <SubteamEditor club={{ id: club.id, slug: club.slug }} subteams={club.subteams} />
      </section>
    </div>
  );
}
