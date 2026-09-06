import { describe, expect, it } from "vitest";
import { columnLabel, formatDue, isOverdue, toDateInput } from "./shared";

/** Midday local time, so a timezone offset can never shift the calendar date. */
const localNoon = (year: number, monthIndex: number, day: number) =>
  new Date(year, monthIndex, day, 12, 0, 0).toISOString();

describe("columnLabel", () => {
  it("gives the board heading for a status", () => {
    expect(columnLabel("IN_PROGRESS")).toBe("In progress");
    expect(columnLabel("IN_REVIEW")).toBe("In review");
    expect(columnLabel("BACKLOG")).toBe("Backlog");
  });
});

describe("toDateInput", () => {
  it("formats an ISO string for a date input", () => {
    expect(toDateInput(localNoon(2026, 8, 12))).toBe("2026-09-12");
    expect(toDateInput(localNoon(2026, 0, 5))).toBe("2026-01-05");
  });

  it("returns an empty string when there is no date", () => {
    expect(toDateInput(null)).toBe("");
    expect(toDateInput(undefined)).toBe("");
    expect(toDateInput("")).toBe("");
  });
});

describe("formatDue", () => {
  it("omits the year for dates in the current year", () => {
    const thisYear = new Date().getFullYear();
    expect(formatDue(localNoon(thisYear, 8, 12))).toBe("Sep 12");
  });

  it("includes the year for dates outside it", () => {
    const otherYear = new Date().getFullYear() - 2;
    expect(formatDue(localNoon(otherYear, 8, 12))).toBe(`Sep 12 ${otherYear}`);
  });
});

describe("isOverdue", () => {
  const now = new Date("2026-09-06T12:00:00.000Z").getTime();
  const yesterday = "2026-09-05T12:00:00.000Z";
  const tomorrow = "2026-09-07T12:00:00.000Z";

  it("flags a past due date on unfinished work", () => {
    expect(isOverdue({ dueDate: yesterday, status: "IN_PROGRESS" }, now)).toBe(true);
  });

  it("never flags finished work", () => {
    expect(isOverdue({ dueDate: yesterday, status: "DONE" }, now)).toBe(false);
  });

  it("does not flag future or missing due dates", () => {
    expect(isOverdue({ dueDate: tomorrow, status: "TODO" }, now)).toBe(false);
    expect(isOverdue({ dueDate: null, status: "TODO" }, now)).toBe(false);
  });
});
