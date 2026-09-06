"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireClubAdmin } from "@/lib/auth";
import { SUBTEAM_COLORS } from "@/lib/clubs";

export type ActionState = { error?: string; success?: string; fieldErrors?: Record<string, string> } | null;

function toState(error: z.ZodError): ActionState {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!fieldErrors[key]) fieldErrors[key] = issue.message;
  }
  return { error: "Please fix the highlighted fields.", fieldErrors };
}

function revalidateClub(slug: string) {
  revalidatePath("/dashboard");
  revalidatePath(`/clubs/${slug}`, "layout");
}

// ── Club details ─────────────────────────────────────────────

const clubSchema = z.object({
  clubId: z.string().min(1),
  slug: z.string().min(1),
  name: z.string().trim().min(3, "Name needs at least 3 characters").max(80, "Name is too long"),
  tagline: z.string().trim().max(140, "Keep the tagline under 140 characters").transform((v) => v || null),
  description: z.string().trim().min(20, "Describe the club in at least 20 characters"),
});

export async function updateClub(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = clubSchema.safeParse({
    clubId: formData.get("clubId"),
    slug: formData.get("slug"),
    name: formData.get("name"),
    tagline: formData.get("tagline") ?? "",
    description: formData.get("description"),
  });
  if (!parsed.success) return toState(parsed.error);
  const { clubId, slug, ...data } = parsed.data;
  await requireClubAdmin(clubId);

  await db.club.update({ where: { id: clubId }, data });
  revalidateClub(slug);
  return { success: "Club details saved." };
}

// ── Subteams ─────────────────────────────────────────────────

const colorSchema = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, "Pick a color")
  .refine((c) => (SUBTEAM_COLORS as readonly string[]).includes(c.toUpperCase()), "Pick a color from the palette")
  .transform((c) => c.toUpperCase());

const subteamSchema = z.object({
  clubId: z.string().min(1),
  slug: z.string().min(1),
  name: z.string().trim().min(2, "Name needs at least 2 characters").max(40, "Name is too long"),
  description: z.string().trim().max(160, "Keep it under 160 characters").transform((v) => v || null),
  color: colorSchema,
});

function parseSubteam(formData: FormData) {
  return subteamSchema.safeParse({
    clubId: formData.get("clubId"),
    slug: formData.get("slug"),
    name: formData.get("name"),
    description: formData.get("description") ?? "",
    color: formData.get("color") ?? SUBTEAM_COLORS[0],
  });
}

export async function createSubteam(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = parseSubteam(formData);
  if (!parsed.success) return toState(parsed.error);
  const { clubId, slug, ...data } = parsed.data;
  await requireClubAdmin(clubId);

  const dupe = await db.subteam.findUnique({ where: { clubId_name: { clubId, name: data.name } }, select: { id: true } });
  if (dupe) return { fieldErrors: { name: "A subteam with that name already exists." }, error: "Please fix the highlighted fields." };

  const last = await db.subteam.findFirst({ where: { clubId }, orderBy: { order: "desc" }, select: { order: true } });
  await db.subteam.create({ data: { clubId, ...data, order: (last?.order ?? -1) + 1 } });
  revalidateClub(slug);
  return { success: `Added ${data.name}.` };
}

export async function updateSubteam(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const id = String(formData.get("id") ?? "");
  const parsed = parseSubteam(formData);
  if (!parsed.success) return toState(parsed.error);
  const { clubId, slug, ...data } = parsed.data;
  await requireClubAdmin(clubId);

  const existing = await db.subteam.findFirst({ where: { id, clubId }, select: { id: true } });
  if (!existing) return { error: "Subteam not found." };

  const dupe = await db.subteam.findFirst({ where: { clubId, name: data.name, NOT: { id } }, select: { id: true } });
  if (dupe) return { fieldErrors: { name: "A subteam with that name already exists." }, error: "Please fix the highlighted fields." };

  await db.subteam.update({ where: { id }, data });
  revalidateClub(slug);
  return { success: "Saved." };
}

const deleteSchema = z.object({ clubId: z.string().min(1), slug: z.string().min(1), id: z.string().min(1) });

/** Deletes a subteam. Memberships/postings/workstreams are set to null by the schema. */
export async function deleteSubteam(formData: FormData) {
  const parsed = deleteSchema.safeParse({
    clubId: formData.get("clubId"),
    slug: formData.get("slug"),
    id: formData.get("id"),
  });
  if (!parsed.success) throw new Error("Invalid request.");
  const { clubId, slug, id } = parsed.data;
  await requireClubAdmin(clubId);

  const existing = await db.subteam.findFirst({ where: { id, clubId }, select: { id: true } });
  if (!existing) throw new Error("Subteam not found.");

  await db.subteam.delete({ where: { id } });
  revalidateClub(slug);
}
