import { z } from "zod";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Informe uma data válida.").refine((value) => {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return false;
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}, "Informe uma data existente.");
const amount = z.number().finite().positive("O valor deve ser maior que zero.").max(999_999_999_999.99);
const optionalUuid = z.string().uuid().nullable();

export const transactionFormSchema = z.object({ description: z.string().trim().min(1, "Informe uma descrição.").max(160), amount, kind: z.enum(["income", "expense"]), status: z.enum(["planned", "posted"]), category_id: optionalUuid, transaction_date: isoDate, note: z.string().trim().max(2000).nullable() }).strict();
export const recurrenceFormSchema = z.object({ description: z.string().trim().min(1).max(160), amount, kind: z.enum(["income", "expense"]), category_id: optionalUuid, frequency: z.enum(["daily", "weekly", "monthly", "yearly"]), interval_count: z.number().int().min(1).max(365), anchor_day: z.number().int().min(1).max(31), start_date: isoDate, next_date: isoDate, end_date: isoDate.nullable(), auto_post: z.boolean(), active: z.boolean(), note: z.string().trim().max(2000).nullable() }).strict();
export const subscriptionFormSchema = z.object({ name: z.string().trim().min(1).max(120), amount, category_id: optionalUuid, cycle: z.enum(["monthly", "yearly"]), interval_count: z.number().int().min(1).max(120), billing_day: z.number().int().min(1).max(31), start_date: isoDate, next_charge: isoDate, end_date: isoDate.nullable(), active: z.boolean(), auto_post: z.boolean(), reminder_days: z.number().int().min(0).max(60), website: z.string().url().max(500).nullable().or(z.literal(null)), note: z.string().trim().max(2000).nullable() }).strict();
export const budgetFormSchema = z.object({ category_id: z.string().uuid(), month: z.string().regex(/^\d{4}-\d{2}-01$/), amount, rollover: z.boolean() }).strict();

export type TransactionFormInput = z.infer<typeof transactionFormSchema>;
export type RecurrenceFormInput = z.infer<typeof recurrenceFormSchema>;
export type SubscriptionFormInput = z.infer<typeof subscriptionFormSchema>;
export type BudgetFormInput = z.infer<typeof budgetFormSchema>;
