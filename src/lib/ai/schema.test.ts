import { describe, expect, it } from "vitest";
import { RUBRIC_CRITERIA } from "./samples";
import { EvaluationResultSchema, recommendationForScore } from "./schema";

describe("recommendationForScore", () => {
  it("maps each band, including its boundaries", () => {
    expect(recommendationForScore(100)).toBe("STRONG_YES");
    expect(recommendationForScore(80)).toBe("STRONG_YES");
    expect(recommendationForScore(79)).toBe("YES");
    expect(recommendationForScore(65)).toBe("YES");
    expect(recommendationForScore(64)).toBe("MAYBE");
    expect(recommendationForScore(45)).toBe("MAYBE");
    expect(recommendationForScore(44)).toBe("NO");
    expect(recommendationForScore(0)).toBe("NO");
  });
});

const valid = {
  overallScore: 72,
  recommendation: "YES" as const,
  summary: "Strong course projects, thin on firmware.",
  strengths: ["Ships working code."],
  concerns: ["No CAN bus exposure."],
  rubric: RUBRIC_CRITERIA.map((criterion) => ({ criterion, score: 4, note: "note" })),
};

describe("EvaluationResultSchema", () => {
  it("accepts a well-formed evaluation", () => {
    expect(EvaluationResultSchema.parse(valid)).toEqual(valid);
  });

  it("rejects an out-of-range overall score", () => {
    for (const overallScore of [-1, 101, 72.5]) {
      expect(EvaluationResultSchema.safeParse({ ...valid, overallScore }).success).toBe(false);
    }
  });

  it("rejects a rubric that is not one row per criterion", () => {
    expect(EvaluationResultSchema.safeParse({ ...valid, rubric: valid.rubric.slice(1) }).success).toBe(false);
    expect(EvaluationResultSchema.safeParse({ ...valid, rubric: [...valid.rubric, valid.rubric[0]] }).success).toBe(
      false,
    );
  });

  it("rejects rubric scores outside 1–5", () => {
    for (const score of [0, 6, 3.5]) {
      const rubric = valid.rubric.map((r, i) => (i === 0 ? { ...r, score } : r));
      expect(EvaluationResultSchema.safeParse({ ...valid, rubric }).success).toBe(false);
    }
  });

  it("rejects an unknown recommendation", () => {
    expect(EvaluationResultSchema.safeParse({ ...valid, recommendation: "PROBABLY" }).success).toBe(false);
  });

  it("requires a summary and at least one strength", () => {
    expect(EvaluationResultSchema.safeParse({ ...valid, summary: "" }).success).toBe(false);
    expect(EvaluationResultSchema.safeParse({ ...valid, strengths: [] }).success).toBe(false);
  });

  it("allows no concerns but caps the lists at five", () => {
    expect(EvaluationResultSchema.safeParse({ ...valid, concerns: [] }).success).toBe(true);
    expect(EvaluationResultSchema.safeParse({ ...valid, concerns: Array(6).fill("x") }).success).toBe(false);
    expect(EvaluationResultSchema.safeParse({ ...valid, strengths: Array(6).fill("x") }).success).toBe(false);
  });
});
