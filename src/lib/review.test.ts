import { describe, expect, it } from "vitest";
import { formatBytes, formatClock, formatDate, formatRelative, isApplicationStatus, STATUS_ORDER } from "./review";

describe("isApplicationStatus", () => {
  it("accepts every status the pipeline shows", () => {
    for (const status of STATUS_ORDER) {
      expect(isApplicationStatus(status)).toBe(true);
    }
  });

  it("rejects anything else, including lower case and non-strings", () => {
    for (const value of ["accepted", "PENDING", "", null, undefined, 1, {}]) {
      expect(isApplicationStatus(value)).toBe(false);
    }
  });
});

describe("formatRelative", () => {
  const now = new Date("2026-09-06T12:00:00Z");
  const ago = (ms: number) => new Date(now.getTime() - ms);

  it("describes past times", () => {
    expect(formatRelative(ago(30_000), now)).toBe("just now");
    expect(formatRelative(ago(60_000), now)).toBe("1 minute ago");
    expect(formatRelative(ago(5 * 60_000), now)).toBe("5 minutes ago");
    expect(formatRelative(ago(3 * 3_600_000), now)).toBe("3 hours ago");
    expect(formatRelative(ago(2 * 86_400_000), now)).toBe("2 days ago");
    expect(formatRelative(ago(3 * 604_800_000), now)).toBe("3 weeks ago");
    expect(formatRelative(ago(2 * 2_592_000_000), now)).toBe("2 months ago");
    expect(formatRelative(ago(31_536_000_000), now)).toBe("1 year ago");
  });

  it("describes future times", () => {
    expect(formatRelative(ago(-2 * 86_400_000), now)).toBe("in 2 days");
    expect(formatRelative(ago(-3_600_000), now)).toBe("in 1 hour");
  });

  it("picks the largest unit that fits, truncating", () => {
    expect(formatRelative(ago(89 * 60_000), now)).toBe("1 hour ago");
    expect(formatRelative(ago(13 * 86_400_000), now)).toBe("1 week ago");
  });
});

describe("formatBytes", () => {
  it("scales to B, KB and MB", () => {
    expect(formatBytes(0)).toBe("0 B");
    expect(formatBytes(512)).toBe("512 B");
    expect(formatBytes(1024)).toBe("1 KB");
    expect(formatBytes(153_600)).toBe("150 KB");
    expect(formatBytes(1_048_576)).toBe("1.0 MB");
    expect(formatBytes(2_621_440)).toBe("2.5 MB");
  });
});

describe("formatClock", () => {
  it("renders seconds as m:ss", () => {
    expect(formatClock(0)).toBe("0:00");
    expect(formatClock(9)).toBe("0:09");
    expect(formatClock(60)).toBe("1:00");
    expect(formatClock(125)).toBe("2:05");
    expect(formatClock(3_600)).toBe("60:00");
  });
});

describe("formatDate", () => {
  it("renders an em dash for a missing date", () => {
    expect(formatDate(null)).toBe("—");
    expect(formatDate(undefined)).toBe("—");
  });

  it("renders a short date", () => {
    expect(formatDate(new Date(2026, 8, 6))).toBe("Sep 6, 2026");
  });
});
