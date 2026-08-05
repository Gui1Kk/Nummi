import { z } from "zod";
import { supabase } from "../lib/supabase";
import { apiDownload, apiRequest } from "./api";
import { normalizeEmail } from "../features/auth/validation";
import type { BudgetFormInput, RecurrenceFormInput, SubscriptionFormInput, TransactionFormInput } from "../schemas";
import type { BudgetStatus, Category, FinanceSnapshot, Notification, Profile, UserSettings } from "../types";

const profileSchema=z.object({user_id:z.string(),display_name:z.string(),currency:z.string(),locale:z.string(),timezone:z.string(),account_role:z.enum(["user","admin"]),created_at:z.string(),updated_at:z.string()});
const settingsSchema=z.object({user_id:z.string(),theme:z.enum(["system","light","dark"]),privacy_mode:z.boolean(),compact_mode:z.boolean(),week_starts_on:z.number(),reminder_days:z.number(),created_at:z.string(),updated_at:z.string()});
const categorySchema=z.object({id:z.string(),user_id:z.string(),name:z.string(),scope:z.enum(["income","expense","both"]),color:z.string(),archived:z.boolean(),created_at:z.string(),updated_at:z.string()});
const transactionSchema=z.object({id:z.string(),user_id:z.string(),description:z.string(),amount:z.coerce.number(),kind:z.enum(["income","expense"]),status:z.enum(["planned","posted"]),source:z.enum(["manual","recurrence","subscription","import","api"]),category_id:z.string().nullable(),transaction_date:z.string(),competence_month:z.string().nullable(),note:z.string().nullable(),recurrence_id:z.string().nullable(),subscription_id:z.string().nullable(),occurrence_date:z.string().nullable(),idempotency_key:z.string().nullable(),created_at:z.string(),updated_at:z.string()});
const recurrenceSchema=z.object({id:z.string(),user_id:z.string(),description:z.string(),amount:z.coerce.number(),kind:z.enum(["income","expense"]),category_id:z.string().nullable(),frequency:z.enum(["daily","weekly","monthly","yearly"]),interval_count:z.number(),anchor_day:z.number(),start_date:z.string(),next_date:z.string(),end_date:z.string().nullable(),auto_post:z.boolean(),active:z.boolean(),note:z.string().nullable(),last_posted_at:z.string().nullable(),created_at:z.string(),updated_at:z.string()});
const subscriptionSchema=z.object({id:z.string(),user_id:z.string(),name:z.string(),amount:z.coerce.number(),category_id:z.string().nullable(),cycle:z.enum(["monthly","yearly"]),interval_count:z.number(),billing_day:z.number(),start_date:z.string(),next_charge:z.string(),end_date:z.string().nullable(),active:z.boolean(),auto_post:z.boolean(),reminder_days:z.number(),website:z.string().nullable(),note:z.string().nullable(),last_posted_at:z.string().nullable(),created_at:z.string(),updated_at:z.string()});
const budgetSchema=z.object({id:z.string(),user_id:z.string(),category_id:z.string(),month:z.string(),amount:z.coerce.number(),rollover:z.boolean(),created_at:z.string(),updated_at:z.string()});
const notificationSchema=z.object({id:z.string(),user_id:z.string(),kind:z.string(),title:z.string(),message:z.string(),due_at:z.string().nullable(),read_at:z.string().nullable(),entity_type:z.string().nullable(),entity_id:z.string().nullable(),created_at:z.string()});
const snapshotSchema=z.object({profile:profileSchema.nullable(),settings:settingsSchema.nullable(),categories:z.array(categorySchema),transactions:z.array(transactionSchema),recurringRules:z.array(recurrenceSchema),subscriptions:z.array(subscriptionSchema),budgets:z.array(budgetSchema),notifications:z.array(notificationSchema),truncated:z.boolean().default(false)});
const budgetStatusSchema=z.object({category_id:z.string(),base_amount:z.coerce.number(),rollover_amount:z.coerce.number(),effective_amount:z.coerce.number(),spent:z.coerce.number(),remaining:z.coerce.number(),rollover:z.boolean()});

type RedirectMode="confirmed"|"recovery"|"email-change";
function redirectUrl(mode:RedirectMode){const url=new URL(window.location.origin);url.searchParams.set("auth",mode);return url.toString()}
export class AuthServiceError extends Error{constructor(public code:string,message:string){super(message);this.name="AuthServiceError"}}
function authError(error:unknown,fallback:string):never{const record=error&&typeof error==="object"?error as Record<string,unknown>:null;const code=typeof record?.code==="string"?record.code:"auth_error";const messages:Record<string,string>={email_not_confirmed:"Seu e-mail ainda não foi confirmado. Abra o link enviado ou solicite um novo.",invalid_credentials:"E-mail ou senha inválidos.",user_already_exists:"Já existe uma conta com esse e-mail.",weak_password:"A senha foi considerada fraca. Use uma senha mais longa e única.",over_email_send_rate_limit:"Aguarde um minuto antes de solicitar outro e-mail.",over_request_rate_limit:"Muitas tentativas. Aguarde alguns minutos e tente novamente.",same_password:"A nova senha precisa ser diferente da senha atual.",reauthentication_needed:"Confirme sua identidade novamente para concluir esta alteração.",redirect_to_not_allowed:"O endereço de retorno não está autorizado no Supabase.",signup_disabled:"Novos cadastros estão temporariamente indisponíveis.",email_address_invalid:"Informe um e-mail válido."};throw new AuthServiceError(code,messages[code]??fallback)}

export const authService={
 async signIn(email:string,password:string){const{error}=await supabase.auth.signInWithPassword({email:normalizeEmail(email),password});if(error)authError(error,"Não foi possível entrar.")},
 async signUp(email:string,password:string,displayName:string){const normalizedName=displayName.trim();if(normalizedName.length<2)throw new AuthServiceError("invalid_display_name","Informe seu nome.");const{data,error}=await supabase.auth.signUp({email:normalizeEmail(email),password,options:{data:{display_name:normalizedName},emailRedirectTo:redirectUrl("confirmed")}});if(error)authError(error,"Não foi possível criar a conta.");return{requiresConfirmation:!data.session}},
 async resendConfirmation(email:string){const{error}=await supabase.auth.resend({type:"signup",email:normalizeEmail(email),options:{emailRedirectTo:redirectUrl("confirmed")}});if(error)authError(error,"Não foi possível reenviar a confirmação.")},
 async requestPasswordReset(email:string){const{error}=await supabase.auth.resetPasswordForEmail(normalizeEmail(email),{redirectTo:redirectUrl("recovery")});if(error)authError(error,"Não foi possível solicitar a recuperação.")},
 async finishPasswordRecovery(password:string){const{error}=await supabase.auth.updateUser({password});if(error)authError(error,"Não foi possível alterar a senha.")},
 async updatePassword(currentPassword:string,password:string){const{data:userData,error:userError}=await supabase.auth.getUser();if(userError||!userData.user.email)authError(userError,"Não foi possível validar a sessão.");const{error:verifyError}=await supabase.auth.signInWithPassword({email:userData.user.email,password:currentPassword});if(verifyError)throw new AuthServiceError("invalid_current_password","A senha atual está incorreta.");const{error}=await supabase.auth.updateUser({password});if(error)authError(error,"Não foi possível alterar a senha.")},
 async updateEmail(email:string){const{error}=await supabase.auth.updateUser({email:normalizeEmail(email)},{emailRedirectTo:redirectUrl("email-change")});if(error)authError(error,"Não foi possível alterar o e-mail.")},
 async signOut(scope:"local"|"global"|"others"="local"){const{error}=await supabase.auth.signOut({scope});if(error)authError(error,"Não foi possível encerrar a sessão.")}
};

export const financeService={
 async loadSnapshot(from:string,to:string):Promise<FinanceSnapshot>{const raw=await apiRequest<unknown>(`/snapshot?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`);const parsed=snapshotSchema.safeParse(raw);if(!parsed.success)throw new Error("Resposta inválida da API em snapshot.");if(parsed.data.truncated)throw new Error("Há dados demais para esta competência. Use filtros ou a API paginada.");return{profile:parsed.data.profile,settings:parsed.data.settings,categories:parsed.data.categories,transactions:parsed.data.transactions,recurringRules:parsed.data.recurringRules,subscriptions:parsed.data.subscriptions,budgets:parsed.data.budgets,notifications:parsed.data.notifications}},
 postDueItems:(through?:string)=>apiRequest("/automations/post-due",{method:"POST",body:JSON.stringify({...through?{through}:{},max_occurrences:120})}),
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
 async getBudgetStatus(month:string):Promise<BudgetStatus[]>{const data=await apiRequest<unknown>(`/budgets/status?month=${encodeURIComponent(month)}`);return z.array(budgetStatusSchema).parse(data)},
 saveCategory:(input:Pick<Category,"name"|"scope"|"color"|"archived">,id?:string)=>apiRequest(`/categories${id?`/${id}`:""}`,{method:id?"PATCH":"POST",body:JSON.stringify(input)}),
 deleteCategory:(id:string)=>apiRequest<void>(`/categories/${id}`,{method:"DELETE"}),
 updateProfile:(input:Partial<Pick<Profile,"display_name"|"currency"|"locale"|"timezone">>)=>apiRequest("/profile",{method:"PATCH",body:JSON.stringify(input)}),
 updateSettings:(input:Partial<Pick<UserSettings,"theme"|"privacy_mode"|"compact_mode"|"week_starts_on"|"reminder_days">>)=>apiRequest("/settings",{method:"PATCH",body:JSON.stringify(input)}),
 markNotification:(id:string,read:boolean)=>apiRequest<Notification>(`/notifications/${id}`,{method:"PATCH",body:JSON.stringify({read})}),
 deleteNotification:(id:string)=>apiRequest<void>(`/notifications/${id}`,{method:"DELETE"}),
 exportTransactionsCsv:(from:string,to:string)=>apiDownload(`/export/transactions?format=csv&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,`nummi-${from}-${to}.csv`)
};
