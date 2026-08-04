import { describe, expect, it } from "vitest";
import { emailChangeSchema, isoDate, recurrenceFormSchema, subscriptionFormSchema, transactionFormSchema } from "../../src/schemas";

describe("financial form schemas", () => {
  it("rejects impossible dates and unexpected fields", () => {
    expect(isoDate.safeParse("2026-02-31").success).toBe(false);
    expect(transactionFormSchema.safeParse({ description:"Teste", amount:10, kind:"expense", status:"posted", category_id:null, transaction_date:"2026-07-31", note:null, user_id:"forged" }).success).toBe(false);
  });

  it("rejects recurrence dates before their start", () => {
    expect(recurrenceFormSchema.safeParse({ description:"Conta", amount:100, kind:"expense", category_id:null, frequency:"monthly", interval_count:1, anchor_day:31, start_date:"2026-03-31", next_date:"2026-02-28", end_date:null, auto_post:true, active:true, note:null }).success).toBe(false);
  });

  it("normalizes an empty subscription website to null", () => {
    const parsed = subscriptionFormSchema.parse({ name:"Nuvem", amount:20, category_id:null, cycle:"monthly", interval_count:1, billing_day:1, start_date:"2026-07-01", next_charge:"2026-08-01", end_date:null, active:true, auto_post:true, reminder_days:3, website:"", note:null });
    expect(parsed.website).toBeNull();
  });

  it("requires matching e-mail confirmation", () => {
    expect(emailChangeSchema.safeParse({ email:"novo@example.com", confirmation:"outro@example.com" }).success).toBe(false);
  });
});
