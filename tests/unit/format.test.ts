import { describe, expect, it } from "vitest";
import { formatCurrency, formatDate, monthKey, todayIso } from "../../src/lib/format";

describe("regional formatting", () => {
  it("uses the configured currency and locale", () => {
    expect(formatCurrency(1234.56, "USD", "en-US")).toBe("$1,234.56");
    expect(formatCurrency(1234.56, "BRL", "pt-BR")).toContain("1.234,56");
  });

  it("derives the local calendar day from the configured timezone", () => {
    const instant = new Date("2026-08-05T01:00:00.000Z");
    expect(todayIso("America/Porto_Velho", instant)).toBe("2026-08-04");
    expect(todayIso("UTC", instant)).toBe("2026-08-05");
    expect(monthKey(instant, "America/Porto_Velho")).toBe("2026-08");
  });

  it("formats date-only values without shifting the day", () => {
    expect(formatDate("2026-08-04", "pt-BR")).toContain("04");
  });
});
