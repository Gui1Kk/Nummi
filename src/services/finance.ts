import { z } from "zod";
import { supabase } from "../lib/supabase";
import { apiDownload, apiRequest } from "./api";
import type { BudgetFormInput, RecurrenceFormInput, SubscriptionFormInput, TransactionFormInput } from "../schemas";
import type { Category, FinanceSnapshot, Profile, UserSettings } from "../types";

const profileSchema = z.object({ user_id:z.string(), display_name:z.string(), currency:z.string(), locale:z.string(), timezone:z.string(), created_at:z.string(), updated_at:z.string() });
const settingsSchema = z.object({ user_id:z.string(), theme:z.enum(["system","light","dark"]), privacy_mode:z.boolean(), compact_mode:z.boolean(), week_starts_on:z.number(), reminder_days:z.number(), created_at:z.string(), updated_at:z.string() });
const categorySchema = z.object({ id:z.string(), user_id:z.string(), name:z.string(), scope:z.enum(["income","expense","both"]), color:z.string(), archived:z.boolean(), created_at:z.string(), updated_at:z.string() });
const transactionSchema = z.object({ id:z.string(), user_id:z.string(), description:z.string(), amount:z.coerce.number(), kind:z.enum(["income","expense"]), status:z.enum(["planned","posted"]), source:z.enum(["manual","recurrence","subscription","import","api"]), category_id:z.string().nullable(), transaction_date:z.string(), competence_month:z.string().nullable(), note:z.string().nullable(), recurrence_id:z.string().nullable(), subscription_id:z.string().nullable(), occurrence_date:z.string().nullable(), idempotency_key:z.string().nullable(), created_at:z.string(), updated_at:z.string() });
const recurrenceSchema = z.object({ id:z.string(), user_id:z.string(), description:z.string(), amount:z.coerce.number(), kind:z.enum(["income","expense"]), category_id:z.string().nullable(), frequency:z.enum(["daily","weekly","monthly","yearly"]), interval_count:z.number(), anchor_day:z.number(), start_date:z.string(), next_date:z.string(), end_date:z.string().nullable(), auto_post:z.boolean(), active:z.boolean(), note:z.string().nullable(), last_posted_at:z.string().nullable(), created_at:z.string(), updated_at:z.string() });
const subscriptionSchema = z.object({ id:z.string(), user_id:z.string(), name:z.string(), amount:z.coerce.number(), category_id:z.string().nullable(), cycle:z.enum(["monthly","yearly"]), interval_count:z.number(), billing_day:z.number(), start_date:z.string(), next_charge:z.string(), end_date:z.string().nullable(), active:z.boolean(), auto_post:z.boolean(), reminder_days:z.number(), website:z.string().nullable(), note:z.string().nullable(), last_posted_at:z.string().nullable(), created_at:z.string(), updated_at:z.string() });
const budgetSchema = z.object({ id:z.string(), user_id:z.string(), category_id:z.string(), month:z.string(), amount:z.coerce.number(), rollover:z.boolean(), created_at:z.string(), updated_at:z.string() });
const snapshotSchema = z.object({ profile:profileSchema.nullable(), settings:settingsSchema.nullable(), categories:z.array(categorySchema), transactions:z.array(transactionSchema), recurringRules:z.array(recurrenceSchema), subscriptions:z.array(subscriptionSchema), budgets:z.array(budgetSchema), truncated:z.boolean().default(false) });

function parse<T>(schema:z.ZodType<T>, value:unknown, label:string):T { const result=schema.safeParse(value); if(!result.success) throw new Error(`Resposta inválida da API em ${label}.`); return result.data; }
function redirectUrl(mode:"confirmed"|"recovery") { const url=new URL(window.location.origin); url.searchParams.set("auth",mode); return url.toString(); }
export class AuthServiceError extends Error { constructor(public code:string,message:string){super(message);this.name="AuthServiceError";} }
function authError(error:{code?:string;message?:string;status?:number}|null,fallback:string):never { const code=error?.code??"auth_error"; const messages:Record<string,string>={email_not_confirmed:"Seu e-mail ainda não foi confirmado. Abra o link enviado ou solicite um novo.",invalid_credentials:"E-mail ou senha inválidos.",user_already_exists:"Já existe uma conta com esse e-mail.",weak_password:"A senha foi considerada fraca. Use uma senha mais longa e única.",over_email_send_rate_limit:"Aguarde um minuto antes de solicitar outro e-mail.",over_request_rate_limit:"Muitas tentativas. Aguarde alguns minutos e tente novamente.",same_password:"A nova senha precisa ser diferente da senha atual.",reauthentication_needed:"Confirme sua identidade novamente para concluir esta alteração.",redirect_to_not_allowed:"O endereço de retorno não está autorizado no Supabase."}; throw new AuthServiceError(code,messages[code]??fallback); }

export const authService={
  async signIn(email:string,password:string){const{error}=await supabase.auth.signInWithPassword({email:email.trim().toLowerCase(),password});if(error)authError(error,"Não foi possível entrar.");},
  async signUp(email:string,password:string,displayName:string){const{data,error}=await supabase.auth.signUp({email:email.trim().toLowerCase(),password,options:{data:{display_name:displayName.trim()},emailRedirectTo:redirectUrl("confirmed")}});if(error)authError(error,"Não foi possível criar a conta.");return{requiresConfirmation:!data.session};},
  async resendConfirmation(email:string){const{error}=await supabase.auth.resend({type:"signup",email:email.trim().toLowerCase(),options:{emailRedirectTo:redirectUrl("confirmed")}});if(error)authError(error,"Não foi possível reenviar a confirmação.");},
  async requestPasswordReset(email:string){const{error}=await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(),{redirectTo:redirectUrl("recovery")});if(error&&error.code==="over_email_send_rate_limit")authError(error,"Aguarde antes de solicitar outro e-mail.");},
  async finishPasswordRecovery(password:string){const{error}=await supabase.auth.updateUser({password});if(error)authError(error,"Não foi possível alterar a senha.");},
  async updatePassword(currentPassword:string,password:string){const{error}=await supabase.auth.updateUser({password,currentPassword});if(error)authError(error,"Não foi possível alterar a senha. Confira a senha atual.");},
  async updateEmail(email:string){const{error}=await supabase.auth.updateUser({email:email.trim().toLowerCase()},{emailRedirectTo:redirectUrl("confirmed")});if(error)authError(error,"Não foi possível alterar o e-mail.");},
  async signOut(scope:"local"|"global"|"others"="local"){const{error}=await supabase.auth.signOut({scope});if(error)authError(error,"Não foi possível encerrar a sessão.");}
};

export const financeService={
  async loadSnapshot():Promise<FinanceSnapshot>{const data=await apiRequest<unknown>("/snapshot");const parsed=parse(snapshotSchema,data,"snapshot");if(parsed.truncated)throw new Error("Há dados demais para a visão completa. Use filtros ou a API paginada.");return parsed;},
  postDueItems:(through?:string)=>apiRequest("/automations/post-due",{method:"POST",body:JSON.stringify({...(through?{through}:{}),max_occurrences:120})}),
  saveTransaction:(input:TransactionFormInput,id?:string)=>apiRequest(`/transactions${id?`/${id}`:""}`,{method:id?"PATCH":"POST",body:JSON.stringify(input)}),
  deleteTransaction:(id:string)=>apiRequest<void>(`/transactions/${id}`,{method:"DELETE"}),
  saveRecurrence:(input:RecurrenceFormInput,id?:string)=>apiRequest(`/recurrences${id?`/${id}`:""}`,{method:id?"PATCH":"POST",body:JSON.stringify(input)}),
  patchRecurrence:(id:string,input:Partial<RecurrenceFormInput>)=>apiRequest(`/recurrences/${id}`,{method:"PATCH",body:JSON.stringify(input)}),
  deleteRecurrence:(id:string)=>apiRequest<void>(`/recurrences/${id}`,{method:"DELETE"}),
  saveSubscription:(input:SubscriptionFormInput,id?:string)=>apiRequest(`/subscriptions${id?`/${id}`:""}`,{method:id?"PATCH":"POST",body:JSON.stringify(input)}),
  patchSubscription:(id:string,input:Partial<SubscriptionFormInput>)=>apiRequest(`/subscriptions/${id}`,{method:"PATCH",body:JSON.stringify(input)}),
  deleteSubscription:(id:string)=>apiRequest<void>(`/subscriptions/${id}`,{method:"DELETE"}),
  saveBudget:(input:BudgetFormInput,id?:string)=>apiRequest(`/budgets${id?`/${id}`:""}`,{method:id?"PATCH":"POST",body:JSON.stringify(input)}),
  deleteBudget:(id:string)=>apiRequest<void>(`/budgets/${id}`,{method:"DELETE"}),
  saveCategory:(input:Pick<Category,"name"|"scope"|"color"|"archived">,id?:string)=>apiRequest(`/categories${id?`/${id}`:""}`,{method:id?"PATCH":"POST",body:JSON.stringify(input)}),
  deleteCategory:(id:string)=>apiRequest<void>(`/categories/${id}`,{method:"DELETE"}),
  updateProfile:(input:Partial<Pick<Profile,"display_name"|"currency"|"locale"|"timezone">>)=>apiRequest("/profile",{method:"PATCH",body:JSON.stringify(input)}),
  updateSettings:(input:Partial<Pick<UserSettings,"theme"|"privacy_mode"|"compact_mode"|"week_starts_on"|"reminder_days">>)=>apiRequest("/settings",{method:"PATCH",body:JSON.stringify(input)}),
  exportTransactionsCsv:(from:string,to:string)=>apiDownload(`/export/transactions?format=csv&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,`nummi-${from}-${to}.csv`)
};
