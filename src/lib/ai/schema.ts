import { z } from "zod";
import { RUBRIC_CRITERIA } from "./samples";

export const RecommendationSchema = z.enum(["STRONG_YES", "YES", "MAYBE", "NO"]);

export const RubricRowSchema = z.object({
  criterion: z.string().min(1),
  score: z.number().int().min(1).max(5),
  note: z.string(),
});

/** Shape returned by both Claude (structured output) and the mock scorer. */
export const EvaluationResultSchema = z.object({
  overallScore: z.number().int().min(0).max(100),
  recommendation: RecommendationSchema,
  summary: z.string().min(1),
  strengths: z.array(z.string().min(1)).min(1).max(5),
  concerns: z.array(z.string().min(1)).max(5),
  rubric: z.array(RubricRowSchema).length(RUBRIC_CRITERIA.length),
});

export type EvaluationResult = z.infer<typeof EvaluationResultSchema>;
export type Recommendation = z.infer<typeof RecommendationSchema>;

/** Input every evaluator receives — a plain, serialisable view of the application. */
export type EvaluationInput = {
  posting: {
    title: string;
    clubName: string;
    subteamName: string | null;
    description: string;
    requirements: string[];
    responsibilities: string[];
  };
  applicant: { name: string; program: string | null; year: number | null };
  coverNote: string | null;
  resumeText: string;
  transcript: Array<{ speaker: "Interviewer" | "Candidate"; text: string; atSec: number }>;
};

export function recommendationForScore(score: number): Recommendation {
  if (score >= 80) return "STRONG_YES";
  if (score >= 65) return "YES";
  if (score >= 45) return "MAYBE";
  return "NO";
}
