import { describe, expect, it } from "vitest";
import { MOCK_MODEL, mockEvaluate } from "./mock";
import { RUBRIC_CRITERIA } from "./samples";
import { EvaluationResultSchema, recommendationForScore, type EvaluationInput } from "./schema";

const posting: EvaluationInput["posting"] = {
  title: "Autonomy Software Developer",
  clubName: "UofT Robotics Association",
  subteamName: "Software",
  description: "Work on the rover autonomy stack: perception, planning and control in ROS 2.",
  requirements: ["Python or C++", "ROS 2 fundamentals", "Comfortable on the Linux command line"],
  responsibilities: ["Write navigation nodes", "Test in simulation", "Support field testing"],
};

const strong: EvaluationInput = {
  posting,
  applicant: { name: "Aisha Rahman", program: "Computer Science", year: 2 },
  coverNote: "I want to work on the ROS 2 navigation stack with the software subteam.",
  resumeText: [
    "AISHA RAHMAN — BSc Computer Science, Year 2",
    "- Built a ROS 2 line follower in C++ and Python on a Raspberry Pi 4",
    "- Wrote a navigation node tested in simulation across 40 runs",
    "- Automated a Linux command line deploy that cut setup from 30 minutes to 4",
    "- Reviewed pull requests for a team of 6 students",
  ].join("\n"),
  transcript: [
    { speaker: "Interviewer", text: "Tell me about a robotics project you worked on.", atSec: 0 },
    {
      speaker: "Candidate",
      text: "We built a ROS 2 line follower last year. I owned the perception node in C++ and we tested it in simulation before field testing, which cut our debugging time by about 40 percent across 12 runs.",
      atSec: 8,
    },
    { speaker: "Interviewer", text: "How comfortable are you on Linux?", atSec: 60 },
    {
      speaker: "Candidate",
      text: "Very comfortable. I scripted our Linux command line setup in Python and documented it for the team, so 6 new members onboarded in one afternoon instead of a week.",
      atSec: 66,
    },
  ],
};

const weak: EvaluationInput = {
  posting,
  applicant: { name: "Taylor Nguyen", program: null, year: 1 },
  coverNote: null,
  resumeText: "TAYLOR NGUYEN — first year student. Interested in joining a club this year.",
  transcript: [
    { speaker: "Interviewer", text: "Tell me about a robotics project you worked on.", atSec: 0 },
    { speaker: "Candidate", text: "Um, I guess I haven't really done one yet.", atSec: 6 },
    { speaker: "Interviewer", text: "Why do you want this role?", atSec: 30 },
    { speaker: "Candidate", text: "It would probably look good on my resume, I think.", atSec: 34 },
  ],
};

const empty: EvaluationInput = {
  posting: { ...posting, description: "", requirements: [], responsibilities: [] },
  applicant: { name: "", program: null, year: null },
  coverNote: null,
  resumeText: "",
  transcript: [],
};

describe("mockEvaluate", () => {
  it("returns a result that satisfies the shared evaluation contract", () => {
    for (const input of [strong, weak, empty]) {
      expect(EvaluationResultSchema.safeParse(mockEvaluate(input)).success).toBe(true);
    }
  });

  it("is deterministic — the same input always scores the same", () => {
    expect(mockEvaluate(strong)).toEqual(mockEvaluate(strong));
    expect(mockEvaluate(weak)).toEqual(mockEvaluate(weak));
  });

  it("scores the rubric criteria in canonical order, 1–5 each", () => {
    const { rubric } = mockEvaluate(strong);
    expect(rubric.map((r) => r.criterion)).toEqual([...RUBRIC_CRITERIA]);
    for (const row of rubric) {
      expect(row.score).toBeGreaterThanOrEqual(1);
      expect(row.score).toBeLessThanOrEqual(5);
      expect(row.note).not.toBe("");
    }
  });

  it("ranks a matching candidate above a non-matching one", () => {
    const a = mockEvaluate(strong);
    const b = mockEvaluate(weak);
    expect(a.overallScore).toBeGreaterThan(b.overallScore);
    expect(a.rubric[0].score).toBeGreaterThan(b.rubric[0].score);
  });

  it("keeps the recommendation consistent with the overall score", () => {
    for (const input of [strong, weak, empty]) {
      const result = mockEvaluate(input);
      expect(result.recommendation).toBe(recommendationForScore(result.overallScore));
    }
  });

  it("names the posting requirements it found, and the ones it did not", () => {
    expect(mockEvaluate(strong).strengths.join(" ")).toMatch(/Python|Ros|C\+\+/i);
    expect(mockEvaluate(weak).concerns.join(" ")).toMatch(/no evidence of/i);
  });

  it("always gives an admin something to read", () => {
    for (const input of [strong, weak, empty]) {
      const result = mockEvaluate(input);
      expect(result.summary.length).toBeGreaterThan(20);
      expect(result.strengths.length).toBeGreaterThan(0);
      expect(result.strengths.length).toBeLessThanOrEqual(3);
      expect(result.concerns.length).toBeGreaterThan(0);
      expect(result.concerns.length).toBeLessThanOrEqual(3);
    }
  });

  it("identifies itself so the review UI can label mock scores", () => {
    expect(MOCK_MODEL).toBe("mock-v1");
  });
});
