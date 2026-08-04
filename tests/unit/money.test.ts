import { describe, expect, it } from "vitest";
import { addMoney, monthSummary, subtractMoney, toCents } from "../../src/lib/money";
import type { Transaction } from "../../src/types";

function transaction(
  amount: number,
  kind: Transaction["kind"],
  status: Transaction["status"]
): Transaction {
  return {
    id: crypto.randomUUID(),
    user_id: crypto.randomUUID(),
    description: "Teste",
    amount,
    kind,
    status,
    source: "manual",
    category_id: null,
    transaction_date: "2026-08-01",
    competence_month: "2026-08-01",
    note: null,
    recurrence_id: null,
    subscription_id: null,
    occurrence_date: null,
    idempotency_key: null,
    created_at: "2026-08-01T00:00:00Z",
    updated_at: "2026-08-01T00:00:00Z"
  };
}

describe("money arithmetic", () => {
  it("avoids binary floating-point drift", () => {
    expect(0.1 + 0.2).not.toBe(0.3);
    expect(addMoney([0.1, 0.2])).toBe(0.3);
    expect(subtractMoney(0.3, 0.1)).toBe(0.2);
  });

  it("rounds values to the nearest cent", () => {
    expect(toCents(10.005)).toBe(1001);
  });

  it("keeps planned and posted values separated", () => {
    const summary = monthSummary([
      transaction(1000, "income", "posted"),
      transaction(249.9, "expense", "posted"),
      transaction(50.1, "expense", "posted"),
      transaction(500, "income", "planned"),
      transaction(80, "expense", "planned")
    ]);

    expect(summary.income).toBe(1000);
    expect(summary.expense).toBe(300);
    expect(summary.balance).toBe(700);
    expect(summary.plannedIncome).toBe(500);
    expect(summary.plannedExpense).toBe(80);
    expect(summary.savingsRate).toBe(70);
  });
});
