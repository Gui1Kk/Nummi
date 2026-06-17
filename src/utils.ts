import type { FinancialSummary, FinanceData } from "./types";

export const emptyFinanceData = (): FinanceData => ({
  transactions: [],
  investments: [],
  vouchers: [],
  goals: []
});

export const todayIso = () => new Date().toISOString().slice(0, 10);

export const makeId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

export const formatCurrency = (value: number) =>
  Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });

export const parseNumber = (value: string | number) => {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  const normalized = value.replace(/\./g, "").replace(",", ".");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const calculateSummary = (data: FinanceData): FinancialSummary => {
  const income = data.transactions
    .filter((item) => item.type === "income")
    .reduce((total, item) => total + Number(item.amount || 0), 0);

  const expense = data.transactions
    .filter((item) => item.type === "expense")
    .reduce((total, item) => total + Number(item.amount || 0), 0);

  const invested = data.investments.reduce((total, item) => total + Number(item.amount || 0), 0);
  const deductibleInvestments = data.investments
    .filter((item) => item.isDeductible)
    .reduce((total, item) => total + Number(item.amount || 0), 0);

  const voucherTotal = data.vouchers.reduce((total, item) => total + Number(item.total || 0), 0);
  const voucherUsed = data.vouchers.reduce((total, item) => total + Number(item.used || 0), 0);

  const goalsCurrent = data.goals.reduce((total, item) => total + Number(item.current || 0), 0);
  const goalsTarget = data.goals.reduce((total, item) => total + Number(item.target || 0), 0);

  return {
    income,
    expense,
    invested,
    deductibleInvestments,
    balance: income - expense - deductibleInvestments,
    voucherTotal,
    voucherUsed,
    voucherAvailable: voucherTotal - voucherUsed,
    goalsCurrent,
    goalsTarget
  };
};

export const groupByAmount = <T extends object>(
  items: T[],
  key: keyof T,
  amountKey: keyof T
) => {
  const grouped = new Map<string, number>();
  items.forEach((item) => {
    const label = String(item[key] || "Geral");
    const amount = Number(item[amountKey] || 0);
    grouped.set(label, (grouped.get(label) || 0) + amount);
  });
  return Array.from(grouped.entries()).map(([label, value]) => ({ label, value }));
};
