import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "./password";

describe("password hashing", () => {
  it("produces a bcrypt hash rather than storing the password", async () => {
    const hash = await hashPassword("clubrecruit");
    expect(hash).not.toContain("clubrecruit");
    expect(hash).toMatch(/^\$2[aby]\$10\$/);
    expect(hash).toHaveLength(60);
  });

  it("salts, so the same password hashes differently every time", async () => {
    const [a, b] = await Promise.all([hashPassword("clubrecruit"), hashPassword("clubrecruit")]);
    expect(a).not.toBe(b);
    expect(await verifyPassword("clubrecruit", a)).toBe(true);
    expect(await verifyPassword("clubrecruit", b)).toBe(true);
  });

  it("verifies the right password and rejects the wrong one", async () => {
    const hash = await hashPassword("correct horse battery staple");
    expect(await verifyPassword("correct horse battery staple", hash)).toBe(true);
    expect(await verifyPassword("Correct horse battery staple", hash)).toBe(false);
    expect(await verifyPassword("", hash)).toBe(false);
    expect(await verifyPassword("correct horse battery stapl", hash)).toBe(false);
  });

  it("does not throw on a malformed stored hash", async () => {
    expect(await verifyPassword("clubrecruit", "not-a-hash")).toBe(false);
  });
});
