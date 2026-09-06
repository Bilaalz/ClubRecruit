import { describe, expect, it } from "vitest";
import {
  ApplicationStatus,
  PostingStatus,
  Recommendation,
  TaskStatus,
  WorkstreamStatus,
} from "@/generated/prisma/enums";
import {
  applicationStatusTone,
  labelFor,
  postingStatusTone,
  recommendationTone,
  taskStatusTone,
  workstreamStatusTone,
} from "./status";

/**
 * These maps are `Record<Enum, BadgeTone>`, so a missing key is a type error at
 * build time — but the enums come from generated Prisma code, so this guards the
 * case where a schema change regenerates them and the maps are left behind.
 */
describe("tone maps cover every enum value", () => {
  const cases: Array<[string, Record<string, string>, Record<string, string>]> = [
    ["PostingStatus", PostingStatus, postingStatusTone],
    ["ApplicationStatus", ApplicationStatus, applicationStatusTone],
    ["Recommendation", Recommendation, recommendationTone],
    ["TaskStatus", TaskStatus, taskStatusTone],
    ["WorkstreamStatus", WorkstreamStatus, workstreamStatusTone],
  ];

  for (const [name, enumObject, toneMap] of cases) {
    it(name, () => {
      expect(Object.keys(toneMap).sort()).toEqual(Object.values(enumObject).sort());
      for (const tone of Object.values(toneMap)) {
        expect(["neutral", "ink", "ok", "warn", "bad", "outline"]).toContain(tone);
      }
    });
  }
});

describe("labelFor", () => {
  it("sentence-cases a SCREAMING_SNAKE enum value", () => {
    expect(labelFor("UNDER_REVIEW")).toBe("Under review");
    expect(labelFor("INTERVIEW_COMPLETE")).toBe("Interview complete");
    expect(labelFor("IN_PROGRESS")).toBe("In progress");
  });

  it("handles single words", () => {
    expect(labelFor("ACCEPTED")).toBe("Accepted");
    expect(labelFor("OPEN")).toBe("Open");
  });

  it("returns an empty string unchanged", () => {
    expect(labelFor("")).toBe("");
  });
});
