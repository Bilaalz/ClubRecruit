import { describe, expect, it } from "vitest";
import { APPLICATION_STEPS, applicationStepIndex, formatBytes, formatDuration } from "./applications";

describe("applicationStepIndex", () => {
  it("advances one step at a time through the flow", () => {
    expect(applicationStepIndex("SUBMITTED")).toBe(0);
    expect(applicationStepIndex("INTERVIEW_COMPLETE")).toBe(1);
    expect(applicationStepIndex("UNDER_REVIEW")).toBe(2);
  });

  it("treats both decisions as the final step", () => {
    expect(applicationStepIndex("ACCEPTED")).toBe(3);
    expect(applicationStepIndex("REJECTED")).toBe(3);
  });

  it("never points past the last timeline step", () => {
    for (const status of ["SUBMITTED", "INTERVIEW_COMPLETE", "UNDER_REVIEW", "ACCEPTED", "REJECTED"] as const) {
      expect(applicationStepIndex(status)).toBeLessThan(APPLICATION_STEPS.length);
    }
  });
});

describe("formatBytes", () => {
  it("scales to B, KB and MB", () => {
    expect(formatBytes(0)).toBe("0 B");
    expect(formatBytes(1023)).toBe("1023 B");
    expect(formatBytes(1024)).toBe("1 KB");
    expect(formatBytes(87_000)).toBe("85 KB");
    expect(formatBytes(1_572_864)).toBe("1.5 MB");
  });
});

describe("formatDuration", () => {
  it("renders seconds as m:ss", () => {
    expect(formatDuration(0)).toBe("0:00");
    expect(formatDuration(45)).toBe("0:45");
    expect(formatDuration(60)).toBe("1:00");
    expect(formatDuration(212)).toBe("3:32");
  });
});
