import type { MonthSummary, Transaction } from "../types";

export function toCents(value: number) {
  if (!Number.isFinite(value)) throw new Error("Valor monetário inválido.");
  return Math.round((value + Number.EPSILON) * 100);
}

export function fromCents(value: number) {
  return value / 100;
}

export function addMoney(values: Iterable<number>) {
  let cents = 0;
  for (const value of values) cents += toCents(value);
  return fromCents(cents);
}

export function subtractMoney(left: number, right: number) {
  return fromCents(toCents(left) - toCents(right));
}

export function monthSummary(rows: Transaction[]): MonthSummary {
  const postedIncome = addMoney(
    rows.filter((item) => item.status === "posted" && item.kind === "income")
      .map((item) => item.amount)
  );
  const postedExpense = addMoney(
    rows.filter((item) => item.status === "posted" && item.kind === "expense")
      .map((item) => item.amount)
  );
  const plannedIncome = addMoney(
    rows.filter((item) => item.status === "planned" && item.kind === "income")
      .map((item) => item.amount)
  );
  const plannedExpense = addMoney(
    rows.filter((item) => item.status === "planned" && item.kind === "expense")
      .map((item) => item.amount)
  );
  const balance = subtractMoney(postedIncome, postedExpense);

  return {
    income: postedIncome,
    expense: postedExpense,
    balance,
    plannedIncome,
    plannedExpense,
    savingsRate: postedIncome > 0 ? (balance / postedIncome) * 100 : 0
  };
}
