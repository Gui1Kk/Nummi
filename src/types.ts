export type TransactionKind = "income" | "expense";
export type TransactionStatus = "planned" | "posted";
export type TransactionSource = "manual" | "recurrence" | "subscription" | "import" | "api";
export type CategoryScope = "income" | "expense" | "both";
export type RecurrenceFrequency = "daily" | "weekly" | "monthly" | "yearly";
export type SubscriptionCycle = "monthly" | "yearly";
export type ThemeMode = "system" | "light" | "dark";
export type ViewId = "dashboard" | "transactions" | "automations" | "budgets" | "reports" | "settings" | "help";

export interface Profile { user_id: string; display_name: string; currency: string; locale: string; timezone: string; created_at: string; updated_at: string; }
export interface UserSettings { user_id: string; theme: ThemeMode; privacy_mode: boolean; compact_mode: boolean; week_starts_on: number; reminder_days: number; created_at: string; updated_at: string; }
export interface Category { id: string; user_id: string; name: string; scope: CategoryScope; color: string; archived: boolean; created_at: string; updated_at: string; }
export interface Transaction { id: string; user_id: string; description: string; amount: number; kind: TransactionKind; status: TransactionStatus; source: TransactionSource; category_id: string | null; transaction_date: string; competence_month: string | null; note: string | null; recurrence_id: string | null; subscription_id: string | null; occurrence_date: string | null; idempotency_key: string | null; created_at: string; updated_at: string; }
export interface RecurringRule { id: string; user_id: string; description: string; amount: number; kind: TransactionKind; category_id: string | null; frequency: RecurrenceFrequency; interval_count: number; anchor_day: number; start_date: string; next_date: string; end_date: string | null; auto_post: boolean; active: boolean; note: string | null; last_posted_at: string | null; created_at: string; updated_at: string; }
export interface Subscription { id: string; user_id: string; name: string; amount: number; category_id: string | null; cycle: SubscriptionCycle; interval_count: number; billing_day: number; start_date: string; next_charge: string; end_date: string | null; active: boolean; auto_post: boolean; reminder_days: number; website: string | null; note: string | null; last_posted_at: string | null; created_at: string; updated_at: string; }
export interface Budget { id: string; user_id: string; category_id: string; month: string; amount: number; rollover: boolean; created_at: string; updated_at: string; }
export interface FinanceSnapshot { profile: Profile | null; settings: UserSettings | null; categories: Category[]; transactions: Transaction[]; recurringRules: RecurringRule[]; subscriptions: Subscription[]; budgets: Budget[]; }
export interface MonthSummary { income: number; expense: number; balance: number; plannedIncome: number; plannedExpense: number; savingsRate: number; }
