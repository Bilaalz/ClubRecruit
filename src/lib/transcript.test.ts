import { describe, expect, it } from "vitest";
import { parseRubric, parseTranscript } from "./transcript";

describe("parseTranscript", () => {
  it("keeps well-formed turns", () => {
    expect(
      parseTranscript([
        { speaker: "Interviewer", text: "Tell me about a project.", atSec: 0 },
        { speaker: "Candidate", text: "I built a rover chassis.", atSec: 12 },
      ]),
    ).toEqual([
      { speaker: "Interviewer", text: "Tell me about a project.", atSec: 0 },
      { speaker: "Candidate", text: "I built a rover chassis.", atSec: 12 },
    ]);
  });

  it("returns an empty array for anything that is not an array", () => {
    for (const bad of [null, undefined, {}, "[]", 3]) {
      expect(parseTranscript(bad)).toEqual([]);
    }
  });

  it("drops turns without text and defaults a missing timestamp to 0", () => {
    expect(parseTranscript([{ speaker: "Candidate" }, null, "x", { speaker: "Candidate", text: "ok" }])).toEqual([
      { speaker: "Candidate", text: "ok", atSec: 0 },
    ]);
  });

  it("treats any speaker other than Candidate as the interviewer", () => {
    const turns = parseTranscript([
      { speaker: "System", text: "a", atSec: 1 },
      { speaker: "Candidate", text: "b", atSec: 2 },
    ]);
    expect(turns.map((t) => t.speaker)).toEqual(["Interviewer", "Candidate"]);
  });
});

describe("parseRubric", () => {
  it("clamps scores into 0–5 and rounds them", () => {
    const rows = parseRubric([
      { criterion: "Communication", score: 9, note: "" },
      { criterion: "Depth", score: -4, note: "" },
      { criterion: "Fit", score: 3.6, note: "" },
    ]);
    expect(rows.map((r) => r.score)).toEqual([5, 0, 4]);
  });

  it("drops rows with no criterion and defaults a missing note", () => {
    expect(parseRubric([{ score: 4 }, { criterion: "Collaboration", score: 4 }])).toEqual([
      { criterion: "Collaboration", score: 4, note: "" },
    ]);
  });

  it("scores a non-numeric score as 0", () => {
    expect(parseRubric([{ criterion: "Communication", score: "4", note: "n" }])).toEqual([
      { criterion: "Communication", score: 0, note: "n" },
    ]);
  });
});
