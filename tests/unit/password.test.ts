import { describe, expect, it } from "vitest";
import { passwordChecks, passwordSchema } from "../../src/features/auth/password";

describe("password policy", () => {
  it("rejects short and predictable passwords", () => {
    expect(passwordSchema.safeParse("12345678").success).toBe(false);
    expect(passwordSchema.safeParse("abcdefghij").success).toBe(false);
  });

  it("accepts a password with length, mixed case and number", () => {
    expect(passwordSchema.safeParse("NummiSeguro2026").success).toBe(true);
    expect(passwordChecks("NummiSeguro2026").every(check => check.ok)).toBe(true);
  });
});
