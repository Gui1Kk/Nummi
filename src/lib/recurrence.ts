import type { RecurrenceFrequency, SubscriptionCycle } from "../types";

const iso = (date: Date) => `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
const parse = (value: string) => { const [year, month, day] = value.split("-").map(Number); if (!year || !month || !day) throw new Error("Data inválida"); const date = new Date(Date.UTC(year, month - 1, day)); if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) throw new Error("Data inválida"); return date; };
const daysInMonth = (year: number, monthIndex: number) => new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();

export function nextOccurrence(current: string, frequency: RecurrenceFrequency, intervalCount: number, anchorDay: number): string {
  const date = parse(current);
  if (!Number.isInteger(intervalCount) || intervalCount < 1) throw new Error("Intervalo inválido");
  if (!Number.isInteger(anchorDay) || anchorDay < 1 || anchorDay > 31) throw new Error("Dia-base inválido");
  if (frequency === "daily") date.setUTCDate(date.getUTCDate() + intervalCount);
  else if (frequency === "weekly") date.setUTCDate(date.getUTCDate() + intervalCount * 7);
  else if (frequency === "monthly") { const targetMonth = date.getUTCMonth() + intervalCount; const targetYear = date.getUTCFullYear() + Math.floor(targetMonth / 12); const normalizedMonth = ((targetMonth % 12) + 12) % 12; date.setUTCFullYear(targetYear, normalizedMonth, Math.min(anchorDay, daysInMonth(targetYear, normalizedMonth))); }
  else { const targetYear = date.getUTCFullYear() + intervalCount; const month = date.getUTCMonth(); date.setUTCFullYear(targetYear, month, Math.min(anchorDay, daysInMonth(targetYear, month))); }
  return iso(date);
}

export function nextSubscription(current: string, cycle: SubscriptionCycle, intervalCount: number, billingDay: number): string { return nextOccurrence(current, cycle === "monthly" ? "monthly" : "yearly", intervalCount, billingDay); }
