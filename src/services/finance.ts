import { z } from "zod";
import { supabase } from "../lib/supabase";
import { apiRequest } from "./api";
import type { BudgetFormInput, RecurrenceFormInput, SubscriptionFormInput, TransactionFormInput } from "../schemas";
import type { Category, FinanceSnapshot, Profile, UserSettings } from "../types";

const profileSchema=z.object({user_id:z.string(),display_name:z.string(),currency:z.string(),locale:z.string(),timezone:z.string(),created_at:z.string(),updated_at:z.string()});
const settingsSchema=z.object({user_id:z.string(),theme:z.enum(["system","light","dark"]),privacy_mode:z.boolean(),compact_mode:z.boolean(),week_starts_on:z.number(),reminder_days:z.number(),created_at:z.string(),updated_at:z.string()});
const categorySchema=z.object({id:z.string(),user_id:z.string(),name:z.string(),scope:z.enum(["income","expense","both"]),color:z.string(),archived:z.boolean(),created_at:z.string(),updated_at:z.string()});
const transactionSchema=z.object({id:z.string(),user_id:z.string(),description:z.string(),amount:z.coerce.number(),kind:z.enum(["income","expense"]),status:z.enum(["planned","posted"]),source:z.enum(["manual","recurrence","subscription","import","api"]),category_id:z.string().nullable(),transaction_date:z.string(),competence_month:z.string().nullable(),note:z.string().nullable(),recurrence_id:z.string().nullable(),subscription_id:z.string().nullable(),occurrence_date:z.string().nullable(),idempotency_key:z.string().nullable(),created_at:z.string(),updated_at:z.string()});
const recurrenceSchema=z.object({id:z.string(),user_id:z.string(),description:z.string(),amount:z.coerce.number(),kind:z.enum(["income","expense"]),category_id:z.string().nullable(),frequency:z.enum(["daily","weekly","monthly","yearly"]),interval_count:z.number(),anchor_day:z.number(),start_date:z.string(),next_date:z.string(),end_date:z.string().nullable(),auto_post:z.boolean(),active:z.boolean(),note:z.string().nullable(),last_posted_at:z.string().nullable(),created_at:z.string(),updated_at:z.string()});
const subscriptionSchema=z.object({id:z.string(),user_id:z.string(),name:z.string(),amount:z.coerce.number(),category_id:z.string().nullable(),cycle:z.enum(["monthly","yearly"]),interval_count:z.number(),billing_day:z.number(),start_date:z.string(),next_charge:z.string(),end_date:z.string().nullable(),active:z.boolean(),auto_post:z.boolean(),reminder_days:z.number(),website:z.string().nullable(),note:z.string().nullable(),last_posted_at:z.string().nullable(),created_at:z.string(),updated_at:z.string()});
const budgetSchema=z.object({id:z.string(),user_id:z.string(),category_id:z.string(),month:z.string(),amount:z.coerce.number(),rollover:z.boolean(),created_at:z.string(),updated_at:z.string()});
const snapshotSchema=z.object({profile:profileSchema.nullable(),settings:settingsSchema.nullable(),categories:z.array(categorySchema),transactions:z.array(transactionSchema),recurringRules:z.array(recurrenceSchema),subscriptions:z.array(subscriptionSchema),budgets:z.array(budgetSchema),truncated:z.boolean().default(false)});
function parse<T>(schema:z.ZodType<T>,value:unknown,label:string):T{const result=schema.safeParse(value);if(!result.success)throw new Error(`Resposta inválida da API em ${label}.`);return result.data}
export const authService={
  async signIn(email:string,password:string){const{error}=await supabase.auth.signInWithPassword({email:email.trim(),password});if(error)throw new Error("E-mail ou senha inválidos.")},
  async signUp(email:string,password:string,displayName:string){const{error}=await supabase.auth.signUp({email:email.trim(),password,options:{data:{display_name:displayName.trim()}}});if(error)throw new Error("Não foi possível criar a conta.")},
  async signOut(){await supabase.auth.signOut({scope:"local"})}
};
export const financeService={
  async loadSnapshot():Promise<FinanceSnapshot>{const data=await apiRequest<unknown>("/snapshot");const parsed=parse(snapshotSchema,data,"snapshot");if(parsed.truncated)throw new Error("Há dados demais para esta tela. Use a API paginada.");return parsed},
  postDueItems:(through?:string)=>apiRequest("/automations/post-due",{method:"POST",body:JSON.stringify({...(through?{through}:{}),max_occurrences:120})}),
  saveTransaction:(input:TransactionFormInput,id?:string)=>apiRequest(`/transactions${id?`/${id}`:""}`,{method:id?"PATCH":"POST",body:JSON.stringify(input)}),
  deleteTransaction:(id:string)=>apiRequest<void>(`/transactions/${id}`,{method:"DELETE"}),
  saveRecurrence:(input:RecurrenceFormInput,id?:string)=>apiRequest(`/recurrences${id?`/${id}`:""}`,{method:id?"PATCH":"POST",body:JSON.stringify(input)}),
  deleteRecurrence:(id:string)=>apiRequest<void>(`/recurrences/${id}`,{method:"DELETE"}),
  saveSubscription:(input:SubscriptionFormInput,id?:string)=>apiRequest(`/subscriptions${id?`/${id}`:""}`,{method:id?"PATCH":"POST",body:JSON.stringify(input)}),
  deleteSubscription:(id:string)=>apiRequest<void>(`/subscriptions/${id}`,{method:"DELETE"}),
  saveBudget:(input:BudgetFormInput,id?:string)=>apiRequest(`/budgets${id?`/${id}`:""}`,{method:id?"PATCH":"POST",body:JSON.stringify(input)}),
  deleteBudget:(id:string)=>apiRequest<void>(`/budgets/${id}`,{method:"DELETE"}),
  saveCategory:(input:Pick<Category,"name"|"scope"|"color"|"archived">,id?:string)=>apiRequest(`/categories${id?`/${id}`:""}`,{method:id?"PATCH":"POST",body:JSON.stringify(input)}),
  updateProfile:(input:Pick<Profile,"display_name"|"currency"|"locale"|"timezone">)=>apiRequest("/profile",{method:"PATCH",body:JSON.stringify(input)}),
  updateSettings:(input:Partial<Pick<UserSettings,"theme"|"privacy_mode"|"compact_mode"|"week_starts_on"|"reminder_days">>)=>apiRequest("/settings",{method:"PATCH",body:JSON.stringify(input)})
};
