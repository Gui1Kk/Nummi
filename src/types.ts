export type TransactionType = "income" | "expense";

export type SyncStatus = "idle" | "loading" | "saving" | "online" | "local" | "error";

export interface User {
  username: string;
  email?: string;
}

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: TransactionType;
  category: string;
  date: string;
  createdAt: string;
}

export interface Investment {
  id: string;
  name: string;
  amount: number;
  type: string;
  isDeductible: boolean;
  createdAt: string;
}

export interface VoucherUse {
  id: string;
  amount: number;
  date: string;
}

export interface Voucher {
  id: string;
  name: string;
  total: number;
  used: number;
  createdAt: string;
  history: VoucherUse[];
}

export interface Goal {
  id: string;
  name: string;
  current: number;
  target: number;
  createdAt: string;
}

export interface FinanceData {
  transactions: Transaction[];
  investments: Investment[];
  vouchers: Voucher[];
  goals: Goal[];
}

export interface FinancialSummary {
  income: number;
  expense: number;
  invested: number;
  deductibleInvestments: number;
  balance: number;
  voucherTotal: number;
  voucherUsed: number;
  voucherAvailable: number;
  goalsCurrent: number;
  goalsTarget: number;
}

export interface ApiResult<T = unknown> {
  status: "success" | "error";
  data?: T;
  user?: User;
  message?: string;
  source?: "remote" | "local";
}
