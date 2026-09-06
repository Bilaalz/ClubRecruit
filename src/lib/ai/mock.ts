// Deterministic evaluator used when ANTHROPIC_API_KEY is not set (or Claude fails).
// Same input → same output. No randomness, no clock.

import { RUBRIC_CRITERIA } from "./samples";
import { recommendationForScore, type EvaluationInput, type EvaluationResult } from "./schema";

export const MOCK_MODEL = "mock-v1";

const STOPWORDS = new Set(
  `a an and are as at be been by for from has have how i if in into is it its of on or our so that the their them there these they this to up us was we were what when which who will with you your able some one per month week hours hour weekend session including comfortable exposure willingness basic strong course project internship concepts get`.split(
    /\s+/,
  ),
);

const PAST_TENSE = /\b\w{3,}ed\b/g;
const WE_WORDS = /\b(we|our|us|team|teammate|teammates)\b/gi;
const I_WORDS = /\b(i|my|me)\b/gi;
const NUMBERS = /\b\d[\d,.%]*\b/g;

/** Very light stemmer so "tests" matches "test" and "designed" matches "design". */
function stem(t: string): string {
  if (t.length <= 4) return t;
  if (t.endsWith("ies")) return t.slice(0, -3) + "y";
  if (t.endsWith("ing") && t.length > 6) return t.slice(0, -3);
  if (t.endsWith("ed") && t.length > 5) return t.slice(0, -2);
  if (t.endsWith("es") && t.length > 5) return t.slice(0, -2);
  if (t.endsWith("s") && !t.endsWith("ss")) return t.slice(0, -1);
  return t;
}

function tokeniseRaw(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9+#./ -]/g, " ")
    .split(/[\s/-]+/)
    .map((t) => t.replace(/^[.-]+|[.-]+$/g, ""))
    .filter((t) => t.length >= 2 && !STOPWORDS.has(t) && !/^\d+$/.test(t));
}

function tokenise(text: string): string[] {
  return tokeniseRaw(text).map(stem);
}

function uniq<T>(xs: T[]): T[] {
  return Array.from(new Set(xs));
}

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

function count(re: RegExp, text: string) {
  return (text.match(re) ?? []).length;
}

function titleCase(s: string) {
  return s.length <= 3 ? s.toUpperCase() : s[0].toUpperCase() + s.slice(1);
}

function list(words: string[]) {
  if (words.length === 0) return "";
  if (words.length === 1) return words[0];
  return `${words.slice(0, -1).join(", ")} and ${words[words.length - 1]}`;
}

export function mockEvaluate(input: EvaluationInput): EvaluationResult {
  const { posting } = input;
  const candidateTurns = input.transcript.filter((t) => t.speaker === "Candidate");
  const answers = candidateTurns.map((t) => t.text);
  const transcriptText = answers.join("\n");
  const resumeText = input.resumeText;

  // ── Keywords from the posting ──────────────────────────────
  const reqKeywords = uniq(tokenise(posting.requirements.join(" ")));
  const descKeywords = uniq(tokenise(`${posting.description} ${posting.responsibilities.join(" ")} ${posting.title}`));
  const allKeywords = uniq([...reqKeywords, ...descKeywords]);
  // Stem → the posting's original spelling, so text reads "SolidWorks" not "solidwork".
  const display = new Map<string, string>();
  for (const raw of tokeniseRaw(`${posting.requirements.join(" ")} ${posting.description} ${posting.responsibilities.join(" ")} ${posting.title}`)) {
    if (!display.has(stem(raw))) display.set(stem(raw), raw);
  }
  const show = (k: string) => titleCase(display.get(k) ?? k);

  const resumeTokens = new Set(tokenise(resumeText));
  const transcriptTokens = new Set(tokenise(transcriptText));

  const resumeHits = allKeywords.filter((k) => resumeTokens.has(k));
  const transcriptHits = allKeywords.filter((k) => transcriptTokens.has(k));
  const reqResumeHits = reqKeywords.filter((k) => resumeTokens.has(k));
  const missingReq = reqKeywords.filter((k) => !resumeTokens.has(k) && !transcriptTokens.has(k));

  const reqCoverage = reqKeywords.length ? reqResumeHits.length / reqKeywords.length : 0;

  // ── Answer quality signals ─────────────────────────────────
  const words = transcriptText.split(/\s+/).filter(Boolean).length;
  const avgWords = answers.length ? words / answers.length : 0;
  const numbers = count(NUMBERS, transcriptText);
  const pastTense = count(PAST_TENSE, transcriptText);
  const weWords = count(WE_WORDS, transcriptText);
  const iWords = count(I_WORDS, transcriptText);
  const hedges = count(/\b(um|uh|probably|maybe|i guess|i think|kind of|sort of)\b/gi, transcriptText);
  const resumeBullets = count(/^\s*[-•]/gm, resumeText);
  const resumeNumbers = count(NUMBERS, resumeText);

  // ── Rubric (1–5 each) ──────────────────────────────────────
  // Relevant experience: requirement coverage in the resume + resume substance.
  const experience = clamp(Math.round(1 + reqCoverage * 2.5 + Math.min(1.5, resumeBullets / 3)), 1, 5);
  // Technical depth: overall keyword coverage across both sources + quantified resume claims.
  const depth = clamp(Math.round(1 + Math.min(2, resumeHits.length / 5) + Math.min(1, transcriptHits.length / 3) + Math.min(1, resumeNumbers / 6)), 1, 5);
  // Communication: answer length, specificity (numbers, past-tense verbs), few hedges.
  const commRaw = 1 + Math.min(1.5, avgWords / 35) + Math.min(1, numbers / 2) + Math.min(1, pastTense / 6) - Math.min(1, hedges / 4);
  const communication = clamp(Math.round(commRaw), 1, 5);
  // Motivation & fit: mentions of the club/role/posting vocabulary in the transcript + cover note.
  const fitMentions = transcriptHits.length + (input.coverNote ? Math.min(2, tokenise(input.coverNote).filter((t) => allKeywords.includes(t)).length) : 0);
  const extrinsic = count(/\b(resume|cv|look good|networking|meet people)\b/gi, transcriptText);
  const intrinsic = count(/\b(want|excites?|excited|interested|love|enjoy|learn|join|curious|proud|real)\b/gi, transcriptText);
  const motivation = clamp(Math.round(2 + Math.min(2, fitMentions / 2) + Math.min(1, intrinsic / 2) - Math.min(1.5, extrinsic)), 1, 5);
  // Collaboration: first-person plural vs singular, teamwork vocabulary.
  const teamWords = count(/\b(team|teammate|teammates|lead|together|pair|review|mentor|trained|coordinated|group)\b/gi, `${transcriptText}\n${resumeText}`);
  const alone = count(/\b(alone|by myself|on my own)\b/gi, transcriptText);
  const collabRaw = 1 + Math.min(1.5, weWords / 2) + Math.min(1.5, teamWords / 4) + (iWords > 0 && weWords / Math.max(1, iWords) > 0.25 ? 0.5 : 0) - alone;
  const collaboration = clamp(Math.round(collabRaw), 1, 5);

  const rubricScores = [experience, depth, communication, motivation, collaboration];
  const rubric = RUBRIC_CRITERIA.map((criterion, i) => ({
    criterion,
    score: rubricScores[i],
    note: rubricNote(criterion, rubricScores[i], { reqResumeHits: reqResumeHits.map(show), transcriptHits: transcriptHits.map(show), numbers, pastTense, avgWords, weWords, hedges }),
  }));

  // Weighted overall (experience and depth count a little more).
  const weights = [0.25, 0.25, 0.2, 0.15, 0.15];
  const weighted = rubricScores.reduce((acc, s, i) => acc + ((s - 1) / 4) * weights[i], 0); // 0..1
  // 10 + 0..85 from the rubric, plus small bonuses for requirement coverage and concrete figures.
  const overallScore = clamp(Math.round(12 + weighted * 85 + reqCoverage * 5 + Math.min(3, numbers)), 0, 100);
  const recommendation = recommendationForScore(overallScore);

  // ── Text ───────────────────────────────────────────────────
  const first = input.applicant.name.split(/\s+/)[0] || "The candidate";
  const matched = uniq([...reqResumeHits, ...resumeHits]).slice(0, 4).map(show);
  const spoken = transcriptHits.slice(0, 3).map(show);

  const strengths: string[] = [];
  if (matched.length) strengths.push(`Resume covers ${list(matched)} from the posting${posting.subteamName ? ` for ${posting.subteamName}` : ""}.`);
  if (numbers >= 2) strengths.push(`Answers are quantified (${numbers} concrete figures) rather than general.`);
  if (spoken.length) strengths.push(`Speaks directly to ${list(spoken)} when describing past work.`);
  if (weWords >= 3) strengths.push("Frames past work in terms of the team rather than only individual effort.");
  if (avgWords >= 45 && strengths.length < 3) strengths.push("Gives full, structured answers with clear context and outcome.");
  if (strengths.length === 0) strengths.push("Enthusiastic and honest about current gaps.");

  const concerns: string[] = [];
  if (missingReq.length) concerns.push(`No evidence of ${list(missingReq.slice(0, 3).map(show))} in the resume or interview.`);
  if (avgWords < 30) concerns.push(`Interview answers are short (about ${Math.round(avgWords)} words each) and stay high-level.`);
  if (hedges >= 3) concerns.push("Several hedged answers; hard to tell what they have actually done.");
  if (alone > 0) concerns.push("Describes preferring to work alone; collaboration is a core part of the role.");
  if (extrinsic > 0) concerns.push("Motivation reads as resume-driven rather than interest in the work.");
  if (concerns.length === 0) concerns.push(`Limited evidence of ${posting.subteamName ? `${posting.subteamName.toLowerCase()}-specific` : "role-specific"} work beyond what the resume lists; worth probing in a follow-up.`);

  const summary = [
    `${first} ${experience >= 4 ? "brings directly relevant experience" : experience >= 3 ? "has some relevant background" : "has limited relevant experience"} for ${posting.title}${matched.length ? `, with the resume matching ${list(matched.slice(0, 3))}` : ""}.`,
    communication >= 4
      ? "Interview answers are specific and well structured, with concrete outcomes."
      : communication >= 3
        ? "Interview answers are reasonable but could be more specific about personal contributions."
        : "Interview answers are brief and generic, which makes depth hard to assess.",
    recommendation === "STRONG_YES"
      ? "Recommend moving forward."
      : recommendation === "YES"
        ? "Worth a follow-up conversation with the subteam lead."
        : recommendation === "MAYBE"
          ? "Borderline; consider against the rest of the pool."
          : "Not a fit for this role right now.",
  ].join(" ");

  return {
    overallScore,
    recommendation,
    summary,
    strengths: strengths.slice(0, 3),
    concerns: concerns.slice(0, 3),
    rubric,
  };
}

function rubricNote(
  criterion: string,
  score: number,
  s: { reqResumeHits: string[]; transcriptHits: string[]; numbers: number; pastTense: number; avgWords: number; weWords: number; hedges: number },
): string {
  switch (criterion) {
    case "Relevant experience":
      return s.reqResumeHits.length
        ? `Resume matches ${list(s.reqResumeHits.slice(0, 3))}.`
        : "Resume does not mention the listed requirements.";
    case "Technical / skill depth":
      return s.transcriptHits.length
        ? `Interview references ${list(s.transcriptHits.slice(0, 3))}.`
        : "Interview stays general; depth not demonstrated.";
    case "Communication":
      return `~${Math.round(s.avgWords)} words per answer, ${s.numbers} figures, ${s.hedges} hedges.`;
    case "Motivation & fit":
      return score >= 4 ? "Clear reasons for wanting this specific role." : score >= 3 ? "Reasonable but general motivation." : "Motivation is vague or external.";
    case "Collaboration":
      return s.weWords >= 3 ? "Talks about the team and shared outcomes." : "Few examples of working with others.";
    default:
      return "";
  }
}
