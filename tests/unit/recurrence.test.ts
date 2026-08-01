import { describe, expect, it } from "vitest";
import { nextOccurrence, nextSubscription } from "../../src/lib/recurrence";

describe("recurrence dates", () => {
  it("preserves end-of-month anchors", () => {
    expect(nextOccurrence("2026-01-31", "monthly", 1, 31)).toBe("2026-02-28");
    expect(nextOccurrence("2026-02-28", "monthly", 1, 31)).toBe("2026-03-31");
    expect(nextOccurrence("2028-01-31", "monthly", 1, 31)).toBe("2028-02-29");
  });
  it("advances weekly and yearly schedules", () => {
    expect(nextOccurrence("2026-07-31", "weekly", 2, 31)).toBe("2026-08-14");
    expect(nextSubscription("2024-02-29", "yearly", 1, 29)).toBe("2025-02-28");
  });
  it("rejects invalid interval data", () => {
    expect(() => nextOccurrence("2026-01-01", "monthly", 0, 1)).toThrow();
    expect(() => nextOccurrence("2026-01-01", "monthly", 1, 32)).toThrow();
  });
});
