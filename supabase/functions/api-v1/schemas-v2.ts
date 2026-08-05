import { z } from "npm:zod@4.4.3";

export const MAX_BODY_BYTES = 1_000_000;
export const MAX_PAGE_SIZE = 100;
export const MAX_OFFSET = 10_000;
export const uuid = z.string().uuid();
export const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((value) => {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return false;
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}, "Invalid calendar date");

const money = z.number().finite().positive().max(999_999_999_999.99);
const nullableUuid = uuid.nullable().optional();
const shortText = (max: number) => z.string().trim().min(1).max(max);
const optionalNote = z.string().trim().max(2000).nullable().optional();

const transactionFields = {
  description: shortText(160), amount: money, kind: z.enum(["income", "expense"]),
  status: z.enum(["planned", "posted"]), category_id: nullableUuid,
  transaction_date: isoDate, note: optionalNote
};
export const transactionInput = z.object({
  ...transactionFields,
  status: transactionFields.status.default("posted"),
  idempotency_key: z.string().trim().min(8).max(128).optional()
}).strict();
export const transactionPatch = z.object(transactionFields).partial().strict();

const categoryFields = {
  name: shortText(60), scope: z.enum(["income", "expense", "both"]),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/), archived: z.boolean()
};
export const categoryInput = z.object({
  ...categoryFields,
  scope: categoryFields.scope.default("both"),
  color: categoryFields.color.default("#22c55e"),
  archived: categoryFields.archived.default(false)
}).strict();
export const categoryPatch = z.object(categoryFields).partial().strict();

const recurringFields = {
  description: shortText(160), amount: money, kind: z.enum(["income", "expense"]),
  category_id: nullableUuid, frequency: z.enum(["daily", "weekly", "monthly", "yearly"]),
  interval_count: z.number().int().min(1).max(365), anchor_day: z.number().int().min(1).max(31),
  start_date: isoDate, next_date: isoDate, end_date: isoDate.nullable().optional(),
  auto_post: z.boolean(), active: z.boolean(), note: optionalNote
};
export const recurringInput = z.object({
  ...recurringFields,
  interval_count: recurringFields.interval_count.default(1),
  auto_post: recurringFields.auto_post.default(true),
  active: recurringFields.active.default(true)
}).strict();
export const recurringPatch = z.object(recurringFields).partial().strict();

const subscriptionFields = {
  name: shortText(120), amount: money, category_id: nullableUuid,
  cycle: z.enum(["monthly", "yearly"]), interval_count: z.number().int().min(1).max(120),
  billing_day: z.number().int().min(1).max(31), start_date: isoDate, next_charge: isoDate,
  end_date: isoDate.nullable().optional(), active: z.boolean(), auto_post: z.boolean(),
  reminder_days: z.number().int().min(0).max(60),
  website: z.string().url().max(500).nullable().optional(), note: optionalNote
};
export const subscriptionInput = z.object({
  ...subscriptionFields,
  cycle: subscriptionFields.cycle.default("monthly"),
  interval_count: subscriptionFields.interval_count.default(1),
  active: subscriptionFields.active.default(true),
  auto_post: subscriptionFields.auto_post.default(true),
  reminder_days: subscriptionFields.reminder_days.default(3)
}).strict();
export const subscriptionPatch = z.object(subscriptionFields).partial().strict();

const budgetFields = {
  category_id: uuid,
  month: isoDate.refine((value) => value.endsWith("-01"), "Month must be the first day of a month"),
  amount: money, rollover: z.boolean()
};
export const budgetInput = z.object({ ...budgetFields, rollover: budgetFields.rollover.default(false) }).strict();
export const budgetPatch = z.object(budgetFields).partial().strict();

export const profilePatch = z.object({
  display_name: z.string().trim().min(2).max(80), currency: z.string().regex(/^[A-Z]{3}$/),
  locale: z.string().trim().min(2).max(20), timezone: z.string().trim().min(1).max(64)
}).partial().strict();
export const settingsPatch = z.object({
  theme: z.enum(["system", "light", "dark"]), privacy_mode: z.boolean(), compact_mode: z.boolean(),
  week_starts_on: z.number().int().min(0).max(6), reminder_days: z.number().int().min(0).max(60)
}).partial().strict();
export const notificationPatch = z.object({ read: z.boolean() }).strict();
export const importInput = z.object({
  transactions: z.array(transactionInput.extend({
    idempotency_key: z.string().trim().min(8).max(128)
  }).strict()).min(1).max(500)
}).strict();
export const automationInput = z.object({
  through: isoDate.optional(), max_occurrences: z.number().int().min(1).max(500).optional()
}).strict();
