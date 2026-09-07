import { describe, expect, it } from "vitest";
import { isAllowedEmail, safeNext, universityForEmail } from "./auth";

const UOFT = { id: "u1", domain: "utoronto.ca", altDomains: ["mail.utoronto.ca"] };
const WATERLOO = { id: "u2", domain: "uwaterloo.ca", altDomains: [] };
const UNIVERSITIES = [UOFT, WATERLOO];

describe("universityForEmail", () => {
  it("matches the primary domain", () => {
    expect(universityForEmail("priya@utoronto.ca", UNIVERSITIES)).toBe(UOFT);
    expect(universityForEmail("someone@uwaterloo.ca", UNIVERSITIES)).toBe(WATERLOO);
  });

  it("matches an alternate domain", () => {
    expect(universityForEmail("aisha@mail.utoronto.ca", UNIVERSITIES)).toBe(UOFT);
  });

  it("is case insensitive and tolerates surrounding whitespace in the domain", () => {
    expect(universityForEmail("Priya@UToronto.CA", UNIVERSITIES)).toBe(UOFT);
    expect(universityForEmail("priya@ utoronto.ca ", UNIVERSITIES)).toBe(UOFT);
  });

  it("rejects look-alike and subdomain-suffix attacks", () => {
    for (const email of [
      "attacker@utoronto.ca.evil.com",
      "attacker@evil-utoronto.ca",
      "attacker@notutoronto.ca",
      "attacker@gmail.com",
    ]) {
      expect(universityForEmail(email, UNIVERSITIES)).toBeNull();
    }
  });

  it("uses the last @ so an address cannot smuggle a domain in the local part", () => {
    expect(universityForEmail("utoronto.ca@gmail.com", UNIVERSITIES)).toBeNull();
    expect(universityForEmail("weird@name@utoronto.ca", UNIVERSITIES)).toBe(UOFT);
  });

  it("rejects malformed addresses", () => {
    for (const email of ["", "no-at-sign", "@utoronto.ca", "priya@", "priya"]) {
      expect(universityForEmail(email, UNIVERSITIES)).toBeNull();
    }
  });
});

describe("isAllowedEmail", () => {
  it("is true only when some university claims the domain", () => {
    expect(isAllowedEmail("priya@utoronto.ca", UNIVERSITIES)).toBe(true);
    expect(isAllowedEmail("priya@gmail.com", UNIVERSITIES)).toBe(false);
    expect(isAllowedEmail("priya@utoronto.ca", [])).toBe(false);
  });
});

describe("safeNext", () => {
  it("passes through same-origin relative paths", () => {
    expect(safeNext("/dashboard")).toBe("/dashboard");
    expect(safeNext("/clubs/worldcup/board?workstream=w1")).toBe("/clubs/worldcup/board?workstream=w1");
  });

  it("falls back for open-redirect attempts", () => {
    for (const next of ["//evil.com", "https://evil.com", "http://evil.com", "/\\evil.com", "evil.com"]) {
      expect(safeNext(next)).toBe("/dashboard");
    }
  });

  it("falls back for non-string input", () => {
    for (const next of [undefined, null, 42, {}, ["/dashboard"]]) {
      expect(safeNext(next)).toBe("/dashboard");
    }
  });

  it("refuses to bounce back into the auth routes", () => {
    for (const next of ["/login", "/signup", "/login?next=%2F", "/signup?next=%2F", "/logout", "/logout?next=%2F"]) {
      expect(safeNext(next)).toBe("/dashboard");
    }
  });

  it("honours a custom fallback", () => {
    expect(safeNext("//evil.com", "/")).toBe("/");
  });
});
