"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { evaluateApplication } from "@/lib/ai/evaluate";
import { buildTranscript } from "@/lib/ai/samples";
import type { Prisma } from "@/generated/prisma/client";

const CreateApplicationSchema = z.object({
  postingId: z.string().min(1),
  coverNote: z.string().trim().max(2000).optional().default(""),
  fileName: z.string().trim().min(1).max(200).default("resume.pdf"),
  sizeBytes: z.coerce.number().int().min(0).max(50_000_000).default(0),
  extractedText: z.string().trim().min(20, "Extracted text is too short.").max(20_000),
});

export type ActionState = { error?: string } | undefined;

/** Step 1: create Application(SUBMITTED) + Resume, then go to the interview. */
export async function createApplication(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const parsed = CreateApplicationSchema.safeParse({
    postingId: formData.get("postingId"),
    coverNote: formData.get("coverNote") ?? "",
    fileName: formData.get("fileName") || "resume.pdf",
    sizeBytes: formData.get("sizeBytes") || 0,
    extractedText: formData.get("extractedText"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the form." };
  }
  const { postingId, coverNote, fileName, sizeBytes, extractedText } = parsed.data;

  const posting = await db.posting.findUnique({ where: { id: postingId }, select: { id: true, status: true } });
  if (!posting) return { error: "This posting no longer exists." };
  if (posting.status !== "OPEN") return { error: "This posting is not accepting applications." };

  const existing = await db.application.findUnique({
    where: { postingId_applicantId: { postingId, applicantId: user.id } },
    select: { id: true, interview: { select: { id: true } } },
  });
  if (existing) {
    redirect(existing.interview ? `/applications/${existing.id}` : `/postings/${postingId}/apply/interview`);
  }

  const application = await db.application.create({
    data: { postingId, applicantId: user.id, status: "SUBMITTED", coverNote: coverNote || null },
    select: { id: true },
  });
  await db.resume.create({
    data: {
      applicationId: application.id,
      fileName: fileName.toLowerCase().endsWith(".pdf") ? fileName : `${fileName}.pdf`,
      fileUrl: `/demo/resumes/${application.id}.pdf`,
      sizeBytes,
      extractedText,
    },
  });

  revalidatePath("/applications");
  revalidatePath("/dashboard");
  revalidatePath(`/postings/${postingId}`);
  redirect(`/postings/${postingId}/apply/interview`);
}

const SubmitInterviewSchema = z.object({
  applicationId: z.string().min(1),
  answers: z.array(z.string().trim().min(1, "Every question needs an answer.")).min(1),
});

/** Step 2: store the interview, run the AI evaluation, move to UNDER_REVIEW. */
export async function submitInterview(applicationId: string, answers: string[]): Promise<{ error?: string } | void> {
  const user = await requireUser();
  const parsed = SubmitInterviewSchema.safeParse({ applicationId, answers });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Please answer every question." };

  const app = await db.application.findUnique({
    where: { id: parsed.data.applicationId },
    include: { posting: { select: { id: true, interviewQuestions: true } }, interview: { select: { id: true } } },
  });
  if (!app || app.applicantId !== user.id) return { error: "Application not found." };
  if (app.interview) redirect(`/postings/${app.posting.id}/apply/done`);
  if (parsed.data.answers.length !== app.posting.interviewQuestions.length) {
    return { error: "Please answer every question before finishing." };
  }

  const { transcript, durationSec } = buildTranscript(app.posting.interviewQuestions, parsed.data.answers);

  await db.interview.create({
    data: {
      applicationId: app.id,
      recordingUrl: `/demo/recordings/${app.id}.webm`,
      durationSec,
      transcript: transcript as unknown as Prisma.InputJsonValue,
    },
  });
  await db.application.update({ where: { id: app.id }, data: { status: "INTERVIEW_COMPLETE" } });

  try {
    await evaluateApplication(app.id);
    await db.application.update({ where: { id: app.id }, data: { status: "UNDER_REVIEW" } });
  } catch (err) {
    // Leave it at INTERVIEW_COMPLETE; an admin can re-run evaluation later.
    console.error("[applications] evaluation failed", err);
  }

  revalidatePath("/applications");
  revalidatePath(`/applications/${app.id}`);
  revalidatePath("/dashboard");
  redirect(`/postings/${app.posting.id}/apply/done`);
}
