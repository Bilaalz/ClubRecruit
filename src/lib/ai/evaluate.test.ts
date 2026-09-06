import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RUBRIC_CRITERIA } from "./samples";
import { EvaluationResultSchema, type EvaluationInput } from "./schema";

const { parse } = vi.hoisted(() => ({ parse: vi.fn() }));

vi.mock("@anthropic-ai/sdk", () => ({
  default: class Anthropic {
    messages = { parse };
  },
}));

const { CLAUDE_MODEL, runEvaluator } = await import("./evaluate");
const { MOCK_MODEL } = await import("./mock");

const input: EvaluationInput = {
  posting: {
    title: "Autonomy Software Developer",
    clubName: "UofT Robotics Association",
    subteamName: "Software",
    description: "Work on the rover autonomy stack.",
    requirements: ["Python or C++", "ROS 2 fundamentals"],
    responsibilities: ["Write navigation nodes"],
  },
  applicant: { name: "Aisha Rahman", program: "Computer Science", year: 2 },
  coverNote: null,
  resumeText: "Built a ROS 2 line follower in C++ and Python. Tested navigation nodes in simulation across 40 runs.",
  transcript: [
    { speaker: "Interviewer", text: "Tell me about a robotics project.", atSec: 0 },
    { speaker: "Candidate", text: "We built a line follower and I owned the perception node.", atSec: 8 },
  ],
};

/** A well-formed Claude reply, with the rubric deliberately out of order. */
const claudeReply = (overrides: Record<string, unknown> = {}) => ({
  stop_reason: "end_turn",
  parsed_output: {
    overallScore: 82,
    recommendation: "STRONG_YES",
    summary: "Directly relevant robotics experience.",
    strengths: ["Owned a perception node."],
    concerns: ["No CAN bus exposure."],
    rubric: [...RUBRIC_CRITERIA].reverse().map((criterion) => ({ criterion, score: 4, note: "note" })),
  },
  ...overrides,
});

beforeEach(() => {
  parse.mockReset();
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("runEvaluator — choosing an evaluator", () => {
  it("scores offline when no API key is configured, without calling Claude", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "");

    const { result, model } = await runEvaluator(input);

    expect(model).toBe(MOCK_MODEL);
    expect(parse).not.toHaveBeenCalled();
    expect(EvaluationResultSchema.safeParse(result).success).toBe(true);
  });

  it("uses Claude when a key is present", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "test-key");
    parse.mockResolvedValue(claudeReply());

    const { result, model } = await runEvaluator(input);

    expect(model).toBe(CLAUDE_MODEL);
    expect(parse).toHaveBeenCalledOnce();
    expect(result.overallScore).toBe(82);
  });

  it("sends the posting, resume and transcript in the prompt", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "test-key");
    parse.mockResolvedValue(claudeReply());

    await runEvaluator(input);

    const prompt = parse.mock.calls[0][0].messages[0].content as string;
    expect(prompt).toContain("Autonomy Software Developer");
    expect(prompt).toContain("ROS 2 fundamentals");
    expect(prompt).toContain("line follower");
    expect(prompt).toContain("[0:08] Candidate:");
  });
});

/**
 * The evaluator is the one place the app depends on a third party. A club admin
 * opening the pipeline should never see a blank score because Anthropic had a bad
 * minute, so every failure mode has to land on the offline scorer instead.
 */
describe("runEvaluator — degrading to the offline scorer", () => {
  beforeEach(() => {
    vi.stubEnv("ANTHROPIC_API_KEY", "test-key");
  });

  it("falls back when the API call throws", async () => {
    parse.mockRejectedValue(new Error("503 Service Unavailable"));

    const { result, model } = await runEvaluator(input);

    expect(model).toBe(`${MOCK_MODEL} (fallback)`);
    expect(EvaluationResultSchema.safeParse(result).success).toBe(true);
  });

  it("falls back when the model refuses", async () => {
    parse.mockResolvedValue(claudeReply({ stop_reason: "refusal", stop_details: { explanation: "no" } }));

    const { model } = await runEvaluator(input);

    expect(model).toBe(`${MOCK_MODEL} (fallback)`);
  });

  it("falls back when the model returns a payload that breaks the schema", async () => {
    parse.mockResolvedValue(claudeReply({ parsed_output: { overallScore: 900, recommendation: "SURE" } }));

    const { result, model } = await runEvaluator(input);

    expect(model).toBe(`${MOCK_MODEL} (fallback)`);
    expect(result.overallScore).toBeLessThanOrEqual(100);
  });

  it("records the fallback in the model name, so a mock score is never mistaken for Claude", async () => {
    parse.mockRejectedValue(new Error("boom"));
    const { model } = await runEvaluator(input);
    expect(model).toContain("fallback");
    expect(model).not.toBe(CLAUDE_MODEL);
  });
});

describe("runEvaluator — normalising Claude's rubric", () => {
  beforeEach(() => {
    vi.stubEnv("ANTHROPIC_API_KEY", "test-key");
  });

  it("reorders the rubric into the canonical criteria order", async () => {
    parse.mockResolvedValue(claudeReply());

    const { result } = await runEvaluator(input);

    expect(result.rubric.map((r) => r.criterion)).toEqual([...RUBRIC_CRITERIA]);
  });

  it("fills in a criterion the model renamed, rather than dropping the row", async () => {
    const rubric = RUBRIC_CRITERIA.map((criterion, i) => ({
      criterion: i === 0 ? "Experience (relevant)" : criterion,
      score: 5,
      note: "note",
    }));
    parse.mockResolvedValue(claudeReply({ parsed_output: { ...claudeReply().parsed_output, rubric } }));

    const { result } = await runEvaluator(input);

    expect(result.rubric).toHaveLength(RUBRIC_CRITERIA.length);
    expect(result.rubric.map((r) => r.criterion)).toEqual([...RUBRIC_CRITERIA]);
    expect(result.rubric[0].score).toBe(5);
  });
});
