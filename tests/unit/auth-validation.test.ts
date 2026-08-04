import { describe, expect, it } from "vitest";
import { emailSchema, normalizeEmail } from "../../src/features/auth/validation";

describe("auth e-mail validation", () => {
  it("normalizes spaces and letter case", () => {
    expect(normalizeEmail("  GUI@Example.COM ")).toBe("gui@example.com");
  });

  it("rejects malformed and oversized addresses", () => {
    expect(emailSchema.safeParse("sem-arroba").success).toBe(false);
    expect(emailSchema.safeParse(`${"a".repeat(250)}@example.com`).success).toBe(false);
  });

  it("rejects an empty address before calling Auth", () => {
    expect(emailSchema.safeParse("").success).toBe(false);
  });
});
