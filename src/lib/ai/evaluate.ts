import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { db } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";
import { RUBRIC_CRITERIA, type TranscriptTurn } from "./samples";
import { EvaluationResultSchema, type EvaluationInput, type EvaluationResult } from "./schema";
import { mockEvaluate, MOCK_MODEL } from "./mock";

export const CLAUDE_MODEL = "claude-opus-5";

/**
 * Evaluate an application (resume + interview transcript) against its posting and
 * store the result on the Evaluation row. Uses Claude when ANTHROPIC_API_KEY is set,
 * otherwise the deterministic mock. Any Claude failure falls back to the mock.
 */
export async function evaluateApplication(applicationId: string): Promise<void> {
  const app = await db.application.findUnique({
    where: { id: applicationId },
    include: {
      posting: { include: { club: { select: { name: true } }, subteam: { select: { name: true } } } },
      applicant: { select: { name: true, program: true, year: true } },
      resume: true,
      interview: true,
    },
  });
  if (!app) throw new Error("Application not found.");
  if (!app.resume) throw new Error("Application has no resume.");
  if (!app.interview) throw new Error("Application has no interview.");

  const input: EvaluationInput = {
    posting: {
      title: app.posting.title,
      clubName: app.posting.club.name,
      subteamName: app.posting.subteam?.name ?? null,
      description: app.posting.description,
      requirements: app.posting.requirements,
      responsibilities: app.posting.responsibilities,
    },
    applicant: { name: app.applicant.name, program: app.applicant.program, year: app.applicant.year },
    coverNote: app.coverNote,
    resumeText: app.resume.extractedText,
    transcript: parseTranscript(app.interview.transcript),
  };

  const { result, model } = await runEvaluator(input);

  const data = {
    overallScore: result.overallScore,
    recommendation: result.recommendation,
    summary: result.summary,
    strengths: result.strengths,
    concerns: result.concerns,
    rubric: result.rubric as Prisma.InputJsonValue,
    model,
  };

  await db.evaluation.upsert({
    where: { applicationId },
    create: { applicationId, ...data },
    update: { ...data, createdAt: new Date() },
  });
}

/** Runs Claude if configured, else the mock. Exported for scripts/tests. */
export async function runEvaluator(input: EvaluationInput): Promise<{ result: EvaluationResult; model: string }> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return { result: mockEvaluate(input), model: MOCK_MODEL };
  }
  try {
    const result = await evaluateWithClaude(input);
    return { result, model: CLAUDE_MODEL };
  } catch (err) {
    console.warn("[ai/evaluate] Claude evaluation failed; falling back to mock:", err instanceof Error ? err.message : err);
    return { result: mockEvaluate(input), model: `${MOCK_MODEL} (fallback)` };
  }
}

async function evaluateWithClaude(input: EvaluationInput): Promise<EvaluationResult> {
  const client = new Anthropic();
  const response = await client.messages.parse({
    model: CLAUDE_MODEL,
    max_tokens: 4000,
    output_config: { effort: "medium", format: zodOutputFormat(EvaluationResultSchema) },
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: buildPrompt(input) }],
  });

  if (response.stop_reason === "refusal") {
    throw new Error(`Claude refused: ${response.stop_details?.explanation ?? "no explanation"}`);
  }
  // parse() already validated against the schema; re-run zod to be explicit and to
  // normalise anything odd (e.g. rubric criteria order).
  const parsed = EvaluationResultSchema.safeParse(response.parsed_output);
  if (!parsed.success) throw new Error(`Claude returned an invalid evaluation: ${parsed.error.message}`);
  return normaliseRubric(parsed.data);
}

const SYSTEM_PROMPT = `You evaluate student applications to university club roles. You are given the posting, the applicant's resume text and a transcript of a short recorded interview.

Score the candidate against the posting only — not against a professional hiring bar. These are students; relevant course projects and hobby work count.

Use exactly these five rubric criteria, in this order, each scored 1–5 with a one-sentence note:
${RUBRIC_CRITERIA.map((c, i) => `${i + 1}. ${c}`).join("\n")}

overallScore is 0–100. recommendation: STRONG_YES (≥80), YES (65–79), MAYBE (45–64), NO (<45).
summary is 2–3 sentences for a club admin skimming a pipeline. strengths: 2–3 short bullets. concerns: 1–3 short bullets. Be concrete — cite specific things from the resume or transcript.`;

function buildPrompt(input: EvaluationInput): string {
  const { posting, applicant } = input;
  const lines = [
    `# Posting: ${posting.title}`,
    `Club: ${posting.clubName}${posting.subteamName ? ` · Subteam: ${posting.subteamName}` : ""}`,
    "",
    posting.description,
    "",
    "## Requirements",
    ...posting.requirements.map((r) => `- ${r}`),
    "",
    "## Responsibilities",
    ...posting.responsibilities.map((r) => `- ${r}`),
    "",
    `# Applicant: ${applicant.name}`,
    `${applicant.program ?? "Program not given"}${applicant.year ? `, year ${applicant.year}` : ""}`,
  ];
  if (input.coverNote) lines.push("", "## Cover note", input.coverNote);
  lines.push("", "## Resume (extracted text)", input.resumeText, "", "## Interview transcript");
  for (const turn of input.transcript) lines.push(`[${formatSec(turn.atSec)}] ${turn.speaker}: ${turn.text}`);
  lines.push("", "Evaluate this application.");
  return lines.join("\n");
}

function formatSec(s: number) {
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, "0")}`;
}

/** Make sure the rubric has one row per criterion, in canonical order. */
function normaliseRubric(result: EvaluationResult): EvaluationResult {
  const byName = new Map(result.rubric.map((r) => [r.criterion.toLowerCase(), r]));
  const rubric = RUBRIC_CRITERIA.map((criterion, i) => {
    const row = byName.get(criterion.toLowerCase()) ?? result.rubric[i];
    return { criterion, score: row?.score ?? 3, note: row?.note ?? "" };
  });
  return { ...result, rubric };
}

export function parseTranscript(json: unknown): TranscriptTurn[] {
  if (!Array.isArray(json)) return [];
  return json
    .filter((t): t is TranscriptTurn => !!t && typeof t === "object" && typeof (t as TranscriptTurn).text === "string")
    .map((t) => ({
      speaker: t.speaker === "Interviewer" ? "Interviewer" : "Candidate",
      text: t.text,
      atSec: typeof t.atSec === "number" ? t.atSec : 0,
    }));
}
