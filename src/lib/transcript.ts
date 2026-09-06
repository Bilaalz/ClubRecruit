/**
 * Guards for the Json columns on Interview (`transcript`) and Evaluation (`rubric`).
 * Both the AI evaluator and the review UI read these; validate the shape in one place.
 * No server imports here so client components can use it too.
 */

export type TranscriptTurn = { speaker: "Interviewer" | "Candidate"; text: string; atSec: number };
export type RubricRow = { criterion: string; score: number; note: string };

export function parseTranscript(json: unknown): TranscriptTurn[] {
  if (!Array.isArray(json)) return [];
  return json.flatMap((t) => {
    if (!t || typeof t !== "object") return [];
    const o = t as Record<string, unknown>;
    if (typeof o.text !== "string") return [];
    const speaker = o.speaker === "Candidate" ? "Candidate" : "Interviewer";
    return [{ speaker, text: o.text, atSec: typeof o.atSec === "number" ? o.atSec : 0 }];
  });
}

export function parseRubric(json: unknown): RubricRow[] {
  if (!Array.isArray(json)) return [];
  return json.flatMap((r) => {
    if (!r || typeof r !== "object") return [];
    const o = r as Record<string, unknown>;
    if (typeof o.criterion !== "string") return [];
    const score = typeof o.score === "number" ? Math.min(5, Math.max(0, Math.round(o.score))) : 0;
    return [{ criterion: o.criterion, score, note: typeof o.note === "string" ? o.note : "" }];
  });
}
