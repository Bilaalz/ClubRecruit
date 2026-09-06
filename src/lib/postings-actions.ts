"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireClubAdmin } from "@/lib/auth";
import { PostingStatus } from "@/generated/prisma/enums";

export type ActionState = { error?: string; fieldErrors?: Record<string, string> } | null;

/** "one per line" textarea → trimmed, non-empty string[] */
function lines(value: FormDataEntryValue | null) {
  return String(value ?? "")
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);
}

const postingSchema = z.object({
  clubId: z.string().min(1),
  slug: z.string().min(1),
  title: z.string().trim().min(3, "Title needs at least 3 characters").max(120, "Title is too long"),
  subteamId: z.string().optional().transform((v) => (v ? v : null)),
  description: z.string().trim().min(20, "Describe the role in at least 20 characters"),
  requirements: z.array(z.string()),
  responsibilities: z.array(z.string()),
  interviewQuestions: z.array(z.string()),
  openings: z.coerce.number().int("Openings must be a whole number").min(1, "At least one opening").max(99, "That is a lot of openings"),
  closesAt: z
    .string()
    .optional()
    .transform((v) => (v ? new Date(`${v}T23:59:59`) : null))
    .refine((d) => d === null || !Number.isNaN(d.getTime()), "Invalid close date"),
  status: z.enum(PostingStatus),
});

function parsePosting(formData: FormData) {
  return postingSchema.safeParse({
    clubId: formData.get("clubId"),
    slug: formData.get("slug"),
    title: formData.get("title"),
    subteamId: formData.get("subteamId") ?? "",
    description: formData.get("description"),
    requirements: lines(formData.get("requirements")),
    responsibilities: lines(formData.get("responsibilities")),
    interviewQuestions: lines(formData.get("interviewQuestions")),
    openings: formData.get("openings"),
    closesAt: formData.get("closesAt") ?? "",
    status: formData.get("status"),
  });
}

function toState(error: z.ZodError): ActionState {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!fieldErrors[key]) fieldErrors[key] = issue.message;
  }
  return { error: "Please fix the highlighted fields.", fieldErrors };
}

async function assertSubteam(clubId: string, subteamId: string | null) {
  if (!subteamId) return true;
  const s = await db.subteam.findFirst({ where: { id: subteamId, clubId }, select: { id: true } });
  return !!s;
}

function revalidatePosting(slug: string, id?: string) {
  revalidatePath("/dashboard");
  revalidatePath(`/clubs/${slug}`);
  revalidatePath(`/clubs/${slug}/manage`);
  revalidatePath(`/clubs/${slug}/manage/postings`);
  if (id) revalidatePath(`/postings/${id}`);
}

export async function createPosting(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = parsePosting(formData);
  if (!parsed.success) return toState(parsed.error);
  const { clubId, slug, ...data } = parsed.data;
  await requireClubAdmin(clubId);
  if (!(await assertSubteam(clubId, data.subteamId))) return { error: "That subteam does not belong to this club." };

  const posting = await db.posting.create({ data: { clubId, ...data } });
  revalidatePosting(slug, posting.id);
  redirect(`/clubs/${slug}/manage/postings`);
}

export async function updatePosting(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const id = String(formData.get("id") ?? "");
  const parsed = parsePosting(formData);
  if (!parsed.success) return toState(parsed.error);
  const { clubId, slug, ...data } = parsed.data;
  await requireClubAdmin(clubId);
  if (!(await assertSubteam(clubId, data.subteamId))) return { error: "That subteam does not belong to this club." };

  const existing = await db.posting.findFirst({ where: { id, clubId }, select: { id: true } });
  if (!existing) return { error: "Posting not found." };

  await db.posting.update({ where: { id }, data });
  revalidatePosting(slug, id);
  redirect(`/clubs/${slug}/manage/postings`);
}

const TRANSITIONS: Record<PostingStatus, PostingStatus[]> = {
  DRAFT: ["OPEN"],
  OPEN: ["CLOSED"],
  CLOSED: ["OPEN"],
};

const statusSchema = z.object({
  clubId: z.string().min(1),
  slug: z.string().min(1),
  id: z.string().min(1),
  status: z.enum(PostingStatus),
});

/** Publish (DRAFT→OPEN), Close (OPEN→CLOSED), Reopen (CLOSED→OPEN). */
export async function setPostingStatus(formData: FormData) {
  const parsed = statusSchema.safeParse({
    clubId: formData.get("clubId"),
    slug: formData.get("slug"),
    id: formData.get("id"),
    status: formData.get("status"),
  });
  if (!parsed.success) throw new Error("Invalid request.");
  const { clubId, slug, id, status } = parsed.data;
  await requireClubAdmin(clubId);

  const posting = await db.posting.findFirst({ where: { id, clubId }, select: { status: true } });
  if (!posting) throw new Error("Posting not found.");
  if (!TRANSITIONS[posting.status].includes(status)) {
    throw new Error(`Cannot move a ${posting.status.toLowerCase()} posting to ${status.toLowerCase()}.`);
  }

  await db.posting.update({ where: { id }, data: { status } });
  revalidatePosting(slug, id);
}
