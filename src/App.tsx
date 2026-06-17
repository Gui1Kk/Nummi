import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  BrainCircuit,
  CheckCircle2,
  Cloud,
  CloudOff,
  CreditCard,
  Edit3,
  Eye,
  EyeOff,
  Home,
  LoaderCircle,
  LogOut,
  PiggyBank,
  Plus,
  Save,
  Target,
  Trash2,
  TrendingDown,
  TrendingUp,
  WalletCards,
  X
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { apiService, hasRemoteBackend } from "./services/api";
import type {
  FinanceData,
  FinancialSummary,
  Goal,
  Investment,
  SyncStatus,
  Transaction,
  TransactionType,
  User,
  Voucher
} from "./types";
import {
  calculateSummary,
  emptyFinanceData,
  formatCurrency,
  groupByAmount,
  makeId,
  parseNumber,
  todayIso
} from "./utils";

type View = "dashboard" | "transactions" | "vouchers" | "investments" | "goals" | "ai";
type ToastType = "success" | "error" | "warning";

interface ToastState {
  message: string;
  type: ToastType;
}

interface AuthScreenProps {
  onLogin: (user: User, remember: boolean) => void;
}

interface DashboardProps {
  user: User;
  onLogout: () => void;
}

interface AiReport {
  generatedAt: string;
  remoteText?: string;
}

const categories = ["Geral", "Moradia", "Alimentacao", "Transporte", "Lazer", "Saude", "Trabalho", "Divida"];
const investmentTypes = ["Renda Fixa", "Renda Variavel", "Fundos Imobiliarios", "Cripto", "Reserva de Emergencia"];
const chartColors = ["#2563eb", "#16a34a", "#dc2626", "#f59e0b", "#7c3aed", "#0891b2"];
const navItems: Array<{ id: View; icon: LucideIcon; label: string }> = [
  { id: "dashboard", icon: Home, label: "Visao Geral" },
  { id: "transactions", icon: WalletCards, label: "Transacoes" },
  { id: "vouchers", icon: CreditCard, label: "Vales" },
  { id: "investments", icon: PiggyBank, label: "Carteira" },
  { id: "goals", icon: Target, label: "Metas" },
  { id: "ai", icon: BrainCircuit, label: "Consultor" }
];

const sessionKeys = {
  localUser: "finai:user:persistent",
  sessionUser: "finai:user:session"
};

const readStoredUser = () => {
  const raw = localStorage.getItem(sessionKeys.localUser) || sessionStorage.getItem(sessionKeys.sessionUser);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
};

const storeUser = (user: User, remember: boolean) => {
  sessionStorage.removeItem(sessionKeys.sessionUser);
  localStorage.removeItem(sessionKeys.localUser);
  const target = remember ? localStorage : sessionStorage;
  target.setItem(remember ? sessionKeys.localUser : sessionKeys.sessionUser, JSON.stringify(user));
};

const clearStoredUser = () => {
  localStorage.removeItem(sessionKeys.localUser);
  sessionStorage.removeItem(sessionKeys.sessionUser);
};

const cx = (...values: Array<string | false | null | undefined>) => values.filter(Boolean).join(" ");

const maskValue = (value: string, privacyMode: boolean) => (privacyMode ? "R$ •••••" : value);

function Toast({ toast, onClose }: { toast: ToastState; onClose: () => void }) {
  return (
    <button className={cx("toast", `toast--${toast.type}`)} onClick={onClose} type="button">
      <CheckCircle2 size={18} />
      <span>{toast.message}</span>
      <X size={16} />
    </button>
  );
}

function EmptyState({ title, action }: { title: string; action?: string }) {
  return (
    <div className="empty-state">
      <p>{title}</p>
      {action ? <span>{action}</span> : null}
    </div>
  );
}

function MetricCard({
  label,
  value,
  icon: Icon,
  tone = "neutral",
  privacyMode
}: {
  label: string;
  value: number;
  icon: typeof Home;
  tone?: "neutral" | "good" | "bad" | "blue";
  privacyMode: boolean;
}) {
  return (
    <section className={cx("metric-card", `metric-card--${tone}`)}>
      <div>
        <span>{label}</span>
        <strong>{maskValue(formatCurrency(value), privacyMode)}</strong>
      </div>
      <Icon size={24} />
    </section>
  );
}

function ProgressBar({ current, total }: { current: number; total: number }) {
  const percentage = total > 0 ? Math.min(100, Math.max(0, (current / total) * 100)) : 0;
  return (
    <div className="progress" aria-label={`${Math.round(percentage)}%`}>
      <span style={{ width: `${percentage}%` }} />
    </div>
  );
}

function PieChart({ data }: { data: Array<{ label: string; value: number }> }) {
  const filtered = data.filter((item) => item.value > 0);
  const total = filtered.reduce((sum, item) => sum + item.value, 0);

  if (!total) {
    return <EmptyState title="Sem dados suficientes para grafico." />;
  }

  let cumulative = 0;
  const slices = filtered.map((item, index) => {
    const start = cumulative / total;
    cumulative += item.value;
    const end = cumulative / total;
    const largeArc = end - start > 0.5 ? 1 : 0;
    const startX = Math.cos(2 * Math.PI * start);
    const startY = Math.sin(2 * Math.PI * start);
    const endX = Math.cos(2 * Math.PI * end);
    const endY = Math.sin(2 * Math.PI * end);
    const path =
      item.value === total
        ? "M 1 0 A 1 1 0 1 1 -1 0 A 1 1 0 1 1 1 0"
        : `M 0 0 L ${startX} ${startY} A 1 1 0 ${largeArc} 1 ${endX} ${endY} Z`;
    return <path key={item.label} d={path} fill={chartColors[index % chartColors.length]} />;
  });

  return (
    <div className="chart-block">
      <svg className="pie-chart" viewBox="-1.1 -1.1 2.2 2.2" role="img" aria-label="Grafico de pizza">
        <g transform="rotate(-90)">{slices}</g>
      </svg>
      <div className="chart-legend">
        {filtered.slice(0, 6).map((item, index) => (
          <div key={item.label}>
            <span style={{ background: chartColors[index % chartColors.length] }} />
            <p>{item.label}</p>
            <strong>{Math.round((item.value / total) * 100)}%</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

function AuthScreen({ onLogin }: AuthScreenProps) {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    const result = isRegister
      ? await apiService.register(username.trim(), email.trim(), password)
      : await apiService.login(username.trim(), password);

    setLoading(false);

    if (result.status === "success" && result.user) {
      onLogin(result.user, remember);
      return;
    }

    setError(result.message || "Nao foi possivel autenticar.");
  };

  return (
    <main className="auth-shell">
      <section className="auth-panel">
        <div className="auth-brand">
          <BrainCircuit size={42} />
          <div>
            <h1>FinAI 4.0 Pro</h1>
            <p>Controle financeiro pessoal com dados organizados e consultoria inteligente.</p>
          </div>
        </div>

        <form className="form-stack" onSubmit={handleSubmit}>
          <label>
            Usuario ou e-mail
            <input value={username} onChange={(event) => setUsername(event.target.value)} required autoComplete="username" />
          </label>

          {isRegister ? (
            <label>
              E-mail
              <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" required autoComplete="email" />
            </label>
          ) : null}

          <label>
            Senha
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              type="password"
              minLength={3}
              autoComplete={isRegister ? "new-password" : "current-password"}
            />
          </label>

          <label className="check-row">
            <input checked={remember} onChange={(event) => setRemember(event.target.checked)} type="checkbox" />
            Manter conectado neste navegador
          </label>

          {error ? <div className="form-error">{error}</div> : null}

          <button className="primary-button" disabled={loading} type="submit">
            {loading ? <LoaderCircle className="spin" size={18} /> : null}
            {isRegister ? "Criar conta" : "Entrar"}
          </button>
        </form>

        <button className="link-button" onClick={() => setIsRegister((current) => !current)} type="button">
          {isRegister ? "Ja tenho conta" : "Criar uma nova conta"}
        </button>
      </section>
    </main>
  );
}

function Dashboard({ user, onLogout }: DashboardProps) {
  const [view, setView] = useState<View>("dashboard");
  const [data, setData] = useState<FinanceData>(emptyFinanceData);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("loading");
  const [privacyMode, setPrivacyMode] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [aiReport, setAiReport] = useState<AiReport | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  const [editingTransaction, setEditingTransaction] = useState<string | null>(null);
  const [transactionForm, setTransactionForm] = useState({
    description: "",
    amount: "",
    type: "expense" as TransactionType,
    category: "Geral",
    date: todayIso()
  });

  const [editingVoucher, setEditingVoucher] = useState<string | null>(null);
  const [voucherForm, setVoucherForm] = useState({ name: "", total: "", used: "" });
  const [voucherUseId, setVoucherUseId] = useState<string | null>(null);
  const [voucherUseAmount, setVoucherUseAmount] = useState("");

  const [editingInvestment, setEditingInvestment] = useState<string | null>(null);
  const [investmentForm, setInvestmentForm] = useState({
    name: "",
    amount: "",
    type: "Renda Fixa",
    isDeductible: false
  });

  const [editingGoal, setEditingGoal] = useState<string | null>(null);
  const [goalForm, setGoalForm] = useState({ name: "", current: "", target: "" });

  const summary = useMemo(() => calculateSummary(data), [data]);
  const expensesByCategory = useMemo(
    () => groupByAmount(data.transactions.filter((item) => item.type === "expense"), "category", "amount"),
    [data.transactions]
  );
  const investmentsByType = useMemo(() => groupByAmount(data.investments, "type", "amount"), [data.investments]);
  const vouchersUsage = useMemo(() => data.vouchers.map((item) => ({ label: item.name, value: item.used })), [data.vouchers]);

  useEffect(() => {
    let mounted = true;
    setSyncStatus("loading");
    apiService.loadData(user.username).then((result) => {
      if (!mounted) return;
      if (result.status === "success" && result.data) {
        setData(result.data);
        setSyncStatus(result.source === "remote" ? "online" : "local");
      } else {
        setSyncStatus("error");
        showToast(result.message || "Nao foi possivel carregar os dados.", "error");
      }
    });
    return () => {
      mounted = false;
    };
  }, [user.username]);

  const showToast = (message: string, type: ToastType = "success") => {
    setToast({ message, type });
    window.setTimeout(() => setToast(null), 3200);
  };

  const commitData = async (nextData: FinanceData, successMessage: string) => {
    setData(nextData);
    setSyncStatus("saving");
    const result = await apiService.saveData(user.username, nextData);
    if (result.status === "success") {
      setSyncStatus(result.source === "remote" ? "online" : "local");
      showToast(successMessage, result.source === "remote" ? "success" : "warning");
    } else {
      setSyncStatus("error");
      showToast(result.message || "Dados salvos localmente, mas a nuvem falhou.", "warning");
    }
  };

  const resetTransactionForm = () => {
    setEditingTransaction(null);
    setTransactionForm({ description: "", amount: "", type: "expense", category: "Geral", date: todayIso() });
  };

  const saveTransaction = (event: FormEvent) => {
    event.preventDefault();
    const amount = parseNumber(transactionForm.amount);
    if (!transactionForm.description.trim() || amount <= 0) return;

    const payload: Transaction = {
      id: editingTransaction || makeId(),
      description: transactionForm.description.trim(),
      amount,
      type: transactionForm.type,
      category: transactionForm.category,
      date: transactionForm.date || todayIso(),
      createdAt: editingTransaction
        ? data.transactions.find((item) => item.id === editingTransaction)?.createdAt || todayIso()
        : todayIso()
    };

    const transactions = editingTransaction
      ? data.transactions.map((item) => (item.id === editingTransaction ? payload : item))
      : [payload, ...data.transactions];

    resetTransactionForm();
    void commitData({ ...data, transactions }, "Lancamento salvo.");
  };

  const editTransaction = (item: Transaction) => {
    setEditingTransaction(item.id);
    setTransactionForm({
      description: item.description,
      amount: String(item.amount),
      type: item.type,
      category: item.category,
      date: item.date || todayIso()
    });
    setView("transactions");
  };

  const deleteTransaction = (id: string) => {
    void commitData({ ...data, transactions: data.transactions.filter((item) => item.id !== id) }, "Lancamento removido.");
  };

  const resetVoucherForm = () => {
    setEditingVoucher(null);
    setVoucherForm({ name: "", total: "", used: "" });
  };

  const saveVoucher = (event: FormEvent) => {
    event.preventDefault();
    const total = parseNumber(voucherForm.total);
    const used = parseNumber(voucherForm.used);
    if (!voucherForm.name.trim() || total <= 0) return;

    const existing = data.vouchers.find((item) => item.id === editingVoucher);
    const payload: Voucher = {
      id: editingVoucher || makeId(),
      name: voucherForm.name.trim(),
      total,
      used: Math.min(total, Math.max(0, used)),
      createdAt: existing?.createdAt || todayIso(),
      history: existing?.history || []
    };

    const vouchers = editingVoucher
      ? data.vouchers.map((item) => (item.id === editingVoucher ? payload : item))
      : [payload, ...data.vouchers];

    resetVoucherForm();
    void commitData({ ...data, vouchers }, "Vale salvo.");
  };

  const editVoucher = (item: Voucher) => {
    setEditingVoucher(item.id);
    setVoucherForm({ name: item.name, total: String(item.total), used: String(item.used) });
    setView("vouchers");
  };

  const useVoucher = (event: FormEvent) => {
    event.preventDefault();
    if (!voucherUseId) return;
    const amount = parseNumber(voucherUseAmount);
    if (amount <= 0) return;

    const vouchers = data.vouchers.map((item) => {
      if (item.id !== voucherUseId) return item;
      const used = Math.min(Number(item.total || 0), Number(item.used || 0) + amount);
      return {
        ...item,
        used,
        history: [...(item.history || []), { id: makeId(), amount, date: todayIso() }]
      };
    });

    setVoucherUseId(null);
    setVoucherUseAmount("");
    void commitData({ ...data, vouchers }, "Uso do vale registrado.");
  };

  const deleteVoucher = (id: string) => {
    void commitData({ ...data, vouchers: data.vouchers.filter((item) => item.id !== id) }, "Vale removido.");
  };

  const resetInvestmentForm = () => {
    setEditingInvestment(null);
    setInvestmentForm({ name: "", amount: "", type: "Renda Fixa", isDeductible: false });
  };

  const saveInvestment = (event: FormEvent) => {
    event.preventDefault();
    const amount = parseNumber(investmentForm.amount);
    if (!investmentForm.name.trim() || amount <= 0) return;

    const existing = data.investments.find((item) => item.id === editingInvestment);
    const payload: Investment = {
      id: editingInvestment || makeId(),
      name: investmentForm.name.trim(),
      amount,
      type: investmentForm.type,
      isDeductible: investmentForm.isDeductible,
      createdAt: existing?.createdAt || todayIso()
    };

    const investments = editingInvestment
      ? data.investments.map((item) => (item.id === editingInvestment ? payload : item))
      : [payload, ...data.investments];

    resetInvestmentForm();
    void commitData({ ...data, investments }, "Investimento salvo.");
  };

  const editInvestment = (item: Investment) => {
    setEditingInvestment(item.id);
    setInvestmentForm({
      name: item.name,
      amount: String(item.amount),
      type: item.type,
      isDeductible: Boolean(item.isDeductible)
    });
    setView("investments");
  };

  const deleteInvestment = (id: string) => {
    void commitData({ ...data, investments: data.investments.filter((item) => item.id !== id) }, "Investimento removido.");
  };

  const resetGoalForm = () => {
    setEditingGoal(null);
    setGoalForm({ name: "", current: "", target: "" });
  };

  const saveGoal = (event: FormEvent) => {
    event.preventDefault();
    const target = parseNumber(goalForm.target);
    if (!goalForm.name.trim() || target <= 0) return;

    const existing = data.goals.find((item) => item.id === editingGoal);
    const payload: Goal = {
      id: editingGoal || makeId(),
      name: goalForm.name.trim(),
      current: parseNumber(goalForm.current),
      target,
      createdAt: existing?.createdAt || todayIso()
    };

    const goals = editingGoal ? data.goals.map((item) => (item.id === editingGoal ? payload : item)) : [payload, ...data.goals];
    resetGoalForm();
    void commitData({ ...data, goals }, "Meta salva.");
  };

  const editGoal = (item: Goal) => {
    setEditingGoal(item.id);
    setGoalForm({ name: item.name, current: String(item.current), target: String(item.target) });
    setView("goals");
  };

  const deleteGoal = (id: string) => {
    void commitData({ ...data, goals: data.goals.filter((item) => item.id !== id) }, "Meta removida.");
  };

  const generateReport = async () => {
    setAiLoading(true);
    setAiReport(null);

    const prompt = [
      "Aja como contador pessoal senior.",
      "Analise estes dados financeiros e responda em texto curto, profissional e pratico.",
      JSON.stringify({ summary, data })
    ].join("\n");

    const insight = await apiService.requestAiInsight(user.username, prompt);
    setAiReport({
      generatedAt: new Date().toLocaleString("pt-BR"),
      remoteText: insight.status === "success" ? insight.data?.text : undefined
    });
    setAiLoading(false);
  };

  if (syncStatus === "loading") {
    return (
      <main className="loading-screen">
        <LoaderCircle className="spin" size={34} />
        <p>Carregando seus dados financeiros...</p>
      </main>
    );
  }

  return (
    <main className="app-shell">
      {toast ? <Toast toast={toast} onClose={() => setToast(null)} /> : null}

      <aside className="sidebar">
        <div className="sidebar-brand">
          <BrainCircuit size={30} />
          <div>
            <strong>FinAI 4.0</strong>
            <span>{user.email || user.username}</span>
          </div>
        </div>

        <nav className="nav-list">
          {navItems.map(({ id, icon: Icon, label }) => (
            <button className={cx(view === id && "active")} key={id} onClick={() => setView(id)} type="button">
              <Icon size={18} />
              {label}
            </button>
          ))}
        </nav>

        <div className="sidebar-actions">
          <button onClick={() => setPrivacyMode((current) => !current)} type="button">
            {privacyMode ? <Eye size={18} /> : <EyeOff size={18} />}
            {privacyMode ? "Mostrar valores" : "Ocultar valores"}
          </button>
          <button onClick={onLogout} type="button">
            <LogOut size={18} />
            Sair
          </button>
        </div>
      </aside>

      <section className="content">
        <header className="topbar">
          <div>
            <p>Controle Financeiro</p>
            <h1>{viewTitle(view)}</h1>
          </div>
          <SyncBadge status={syncStatus} />
        </header>

        {view === "dashboard" ? (
          <DashboardView
            data={data}
            summary={summary}
            expensesByCategory={expensesByCategory}
            investmentsByType={investmentsByType}
            privacyMode={privacyMode}
            onEditGoal={editGoal}
            onSelectView={setView}
          />
        ) : null}

        {view === "transactions" ? (
          <TransactionsView
            form={transactionForm}
            setForm={setTransactionForm}
            transactions={data.transactions}
            editingId={editingTransaction}
            privacyMode={privacyMode}
            onCancel={resetTransactionForm}
            onDelete={deleteTransaction}
            onEdit={editTransaction}
            onSubmit={saveTransaction}
          />
        ) : null}

        {view === "vouchers" ? (
          <VouchersView
            form={voucherForm}
            setForm={setVoucherForm}
            vouchers={data.vouchers}
            editingId={editingVoucher}
            privacyMode={privacyMode}
            usageId={voucherUseId}
            usageAmount={voucherUseAmount}
            vouchersUsage={vouchersUsage}
            onCancel={resetVoucherForm}
            onDelete={deleteVoucher}
            onEdit={editVoucher}
            onSubmit={saveVoucher}
            onUseSubmit={useVoucher}
            setUsageAmount={setVoucherUseAmount}
            setUsageId={setVoucherUseId}
          />
        ) : null}

        {view === "investments" ? (
          <InvestmentsView
            form={investmentForm}
            setForm={setInvestmentForm}
            investments={data.investments}
            editingId={editingInvestment}
            investmentsByType={investmentsByType}
            privacyMode={privacyMode}
            onCancel={resetInvestmentForm}
            onDelete={deleteInvestment}
            onEdit={editInvestment}
            onSubmit={saveInvestment}
          />
        ) : null}

        {view === "goals" ? (
          <GoalsView
            form={goalForm}
            setForm={setGoalForm}
            goals={data.goals}
            editingId={editingGoal}
            privacyMode={privacyMode}
            onCancel={resetGoalForm}
            onDelete={deleteGoal}
            onEdit={editGoal}
            onSubmit={saveGoal}
          />
        ) : null}

        {view === "ai" ? (
          <AiView
            data={data}
            loading={aiLoading}
            privacyMode={privacyMode}
            report={aiReport}
            summary={summary}
            onGenerate={generateReport}
          />
        ) : null}
      </section>
    </main>
  );
}

function viewTitle(view: View) {
  const titles: Record<View, string> = {
    dashboard: "Visao Geral",
    transactions: "Transacoes",
    vouchers: "Gestao de Vales",
    investments: "Carteira de Investimentos",
    goals: "Metas Financeiras",
    ai: "Consultor Financeiro"
  };
  return titles[view];
}

function SyncBadge({ status }: { status: SyncStatus }) {
  if (status === "saving") {
    return (
      <span className="sync-badge sync-badge--saving">
        <LoaderCircle className="spin" size={16} />
        Salvando
      </span>
    );
  }

  if (status === "online") {
    return (
      <span className="sync-badge sync-badge--online">
        <Cloud size={16} />
        Sincronizado
      </span>
    );
  }

  if (status === "error") {
    return (
      <span className="sync-badge sync-badge--error">
        <CloudOff size={16} />
        Nuvem indisponivel
      </span>
    );
  }

  return (
    <span className="sync-badge sync-badge--local">
      <CloudOff size={16} />
      Modo local{hasRemoteBackend ? " / fallback" : ""}
    </span>
  );
}

function DashboardView({
  data,
  summary,
  expensesByCategory,
  investmentsByType,
  privacyMode,
  onEditGoal,
  onSelectView
}: {
  data: FinanceData;
  summary: FinancialSummary;
  expensesByCategory: Array<{ label: string; value: number }>;
  investmentsByType: Array<{ label: string; value: number }>;
  privacyMode: boolean;
  onEditGoal: (goal: Goal) => void;
  onSelectView: (view: View) => void;
}) {
  return (
    <div className="page-grid">
      <div className="metric-grid">
        <MetricCard label="Entradas" value={summary.income} icon={TrendingUp} tone="good" privacyMode={privacyMode} />
        <MetricCard label="Saidas" value={summary.expense} icon={TrendingDown} tone="bad" privacyMode={privacyMode} />
        <MetricCard label="Investido" value={summary.invested} icon={PiggyBank} tone="blue" privacyMode={privacyMode} />
        <MetricCard label="Saldo livre" value={summary.balance} icon={WalletCards} privacyMode={privacyMode} />
      </div>

      <section className="panel">
        <div className="panel-title">
          <h2>Gastos por categoria</h2>
          <BarChart3 size={18} />
        </div>
        <PieChart data={expensesByCategory} />
      </section>

      <section className="panel">
        <div className="panel-title">
          <h2>Carteira</h2>
          <PiggyBank size={18} />
        </div>
        <PieChart data={investmentsByType} />
      </section>

      <section className="panel panel--wide">
        <div className="panel-title">
          <h2>Ultimos lancamentos</h2>
          <button className="ghost-button" onClick={() => onSelectView("transactions")} type="button">
            Ver todos
          </button>
        </div>
        {data.transactions.length ? (
          <div className="simple-list">
            {data.transactions.slice(0, 6).map((item) => (
              <div key={item.id}>
                <span className={cx("dot", item.type === "income" ? "dot--good" : "dot--bad")} />
                <p>{item.description}</p>
                <strong>{maskValue(formatCurrency(item.amount), privacyMode)}</strong>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="Nenhum lancamento ainda." action="Cadastre entradas e saidas para gerar a visao geral." />
        )}
      </section>

      <section className="panel">
        <div className="panel-title">
          <h2>Metas ativas</h2>
          <button className="ghost-button" onClick={() => onSelectView("goals")} type="button">
            Nova meta
          </button>
        </div>
        {data.goals.length ? (
          <div className="goal-list">
            {data.goals.slice(0, 4).map((goal) => (
              <button key={goal.id} onClick={() => onEditGoal(goal)} type="button">
                <span>{goal.name}</span>
                <strong>{maskValue(`${formatCurrency(goal.current)} / ${formatCurrency(goal.target)}`, privacyMode)}</strong>
                <ProgressBar current={goal.current} total={goal.target} />
              </button>
            ))}
          </div>
        ) : (
          <EmptyState title="Sem metas cadastradas." />
        )}
      </section>
    </div>
  );
}

function TransactionsView({
  form,
  setForm,
  transactions,
  editingId,
  privacyMode,
  onCancel,
  onDelete,
  onEdit,
  onSubmit
}: {
  form: { description: string; amount: string; type: TransactionType; category: string; date: string };
  setForm: (form: { description: string; amount: string; type: TransactionType; category: string; date: string }) => void;
  transactions: Transaction[];
  editingId: string | null;
  privacyMode: boolean;
  onCancel: () => void;
  onDelete: (id: string) => void;
  onEdit: (item: Transaction) => void;
  onSubmit: (event: FormEvent) => void;
}) {
  return (
    <div className="split-layout">
      <section className="panel">
        <div className="panel-title">
          <h2>{editingId ? "Editar lancamento" : "Novo lancamento"}</h2>
        </div>
        <form className="form-stack" onSubmit={onSubmit}>
          <label>
            Nome
            <input value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} required />
          </label>
          <label>
            Valor
            <input value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} inputMode="decimal" required />
          </label>
          <label>
            Data
            <input value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} type="date" />
          </label>
          <label>
            Categoria
            <select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>
              {categories.map((category) => (
                <option key={category}>{category}</option>
              ))}
            </select>
          </label>
          <div className="segmented">
            <button className={cx(form.type === "income" && "active")} onClick={() => setForm({ ...form, type: "income" })} type="button">
              Entrada
            </button>
            <button className={cx(form.type === "expense" && "active")} onClick={() => setForm({ ...form, type: "expense" })} type="button">
              Saida
            </button>
          </div>
          <div className="button-row">
            {editingId ? (
              <button className="secondary-button" onClick={onCancel} type="button">
                Cancelar
              </button>
            ) : null}
            <button className="primary-button" type="submit">
              <Save size={18} />
              Salvar
            </button>
          </div>
        </form>
      </section>

      <section className="panel">
        <div className="panel-title">
          <h2>Historico</h2>
          <span>{transactions.length} itens</span>
        </div>
        {transactions.length ? (
          <div className="table-list">
            {transactions.map((item) => (
              <article key={item.id} className="row-card">
                <div>
                  <span className={cx("item-icon", item.type === "income" ? "item-icon--good" : "item-icon--bad")}>
                    {item.type === "income" ? <TrendingUp size={17} /> : <TrendingDown size={17} />}
                  </span>
                  <div>
                    <strong>{item.description}</strong>
                    <p>
                      {item.category} • {item.date}
                    </p>
                  </div>
                </div>
                <aside>
                  <strong className={item.type === "income" ? "money-good" : "money-bad"}>
                    {item.type === "expense" ? "- " : ""}
                    {maskValue(formatCurrency(item.amount), privacyMode)}
                  </strong>
                  <div className="icon-actions">
                    <button onClick={() => onEdit(item)} title="Editar" type="button">
                      <Edit3 size={16} />
                    </button>
                    <button onClick={() => onDelete(item.id)} title="Apagar" type="button">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </aside>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState title="Nenhuma transacao cadastrada." />
        )}
      </section>
    </div>
  );
}

function VouchersView({
  form,
  setForm,
  vouchers,
  editingId,
  privacyMode,
  usageId,
  usageAmount,
  vouchersUsage,
  onCancel,
  onDelete,
  onEdit,
  onSubmit,
  onUseSubmit,
  setUsageAmount,
  setUsageId
}: {
  form: { name: string; total: string; used: string };
  setForm: (form: { name: string; total: string; used: string }) => void;
  vouchers: Voucher[];
  editingId: string | null;
  privacyMode: boolean;
  usageId: string | null;
  usageAmount: string;
  vouchersUsage: Array<{ label: string; value: number }>;
  onCancel: () => void;
  onDelete: (id: string) => void;
  onEdit: (item: Voucher) => void;
  onSubmit: (event: FormEvent) => void;
  onUseSubmit: (event: FormEvent) => void;
  setUsageAmount: (value: string) => void;
  setUsageId: (id: string | null) => void;
}) {
  return (
    <div className="split-layout">
      <section className="panel">
        <div className="panel-title">
          <h2>{editingId ? "Editar vale" : "Novo vale"}</h2>
          <CreditCard size={18} />
        </div>
        <form className="form-stack" onSubmit={onSubmit}>
          <label>
            Nome
            <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
          </label>
          <label>
            Valor total
            <input value={form.total} onChange={(event) => setForm({ ...form, total: event.target.value })} inputMode="decimal" required />
          </label>
          <label>
            Ja usado
            <input value={form.used} onChange={(event) => setForm({ ...form, used: event.target.value })} inputMode="decimal" />
          </label>
          <div className="button-row">
            {editingId ? (
              <button className="secondary-button" onClick={onCancel} type="button">
                Cancelar
              </button>
            ) : null}
            <button className="primary-button" type="submit">
              <Save size={18} />
              Salvar vale
            </button>
          </div>
        </form>
      </section>

      <section className="panel">
        <div className="panel-title">
          <h2>Vales cadastrados</h2>
          <span>{vouchers.length} itens</span>
        </div>
        {vouchers.length ? (
          <div className="voucher-grid">
            {vouchers.map((voucher) => {
              const available = Number(voucher.total || 0) - Number(voucher.used || 0);
              return (
                <article className="voucher-card" key={voucher.id}>
                  <div className="voucher-head">
                    <div>
                      <strong>{voucher.name}</strong>
                      <p>Total {maskValue(formatCurrency(voucher.total), privacyMode)}</p>
                    </div>
                    <div className="icon-actions">
                      <button onClick={() => onEdit(voucher)} title="Editar" type="button">
                        <Edit3 size={16} />
                      </button>
                      <button onClick={() => onDelete(voucher.id)} title="Apagar" type="button">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  <strong className="voucher-balance">{maskValue(formatCurrency(available), privacyMode)}</strong>
                  <span>Disponivel</span>
                  <ProgressBar current={voucher.used} total={voucher.total} />
                  <button className="secondary-button" onClick={() => setUsageId(voucher.id)} type="button">
                    Registrar uso
                  </button>
                </article>
              );
            })}
          </div>
        ) : (
          <EmptyState title="Nenhum vale cadastrado." />
        )}
        {vouchers.length ? (
          <div className="chart-section">
            <h3>Uso por vale</h3>
            <PieChart data={vouchersUsage} />
          </div>
        ) : null}
      </section>

      {usageId ? (
        <div className="modal-backdrop">
          <form className="modal-card" onSubmit={onUseSubmit}>
            <h2>Registrar uso do vale</h2>
            <input value={usageAmount} onChange={(event) => setUsageAmount(event.target.value)} inputMode="decimal" autoFocus required />
            <div className="button-row">
              <button className="secondary-button" onClick={() => setUsageId(null)} type="button">
                Cancelar
              </button>
              <button className="primary-button" type="submit">
                Confirmar
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}

function InvestmentsView({
  form,
  setForm,
  investments,
  editingId,
  investmentsByType,
  privacyMode,
  onCancel,
  onDelete,
  onEdit,
  onSubmit
}: {
  form: { name: string; amount: string; type: string; isDeductible: boolean };
  setForm: (form: { name: string; amount: string; type: string; isDeductible: boolean }) => void;
  investments: Investment[];
  editingId: string | null;
  investmentsByType: Array<{ label: string; value: number }>;
  privacyMode: boolean;
  onCancel: () => void;
  onDelete: (id: string) => void;
  onEdit: (item: Investment) => void;
  onSubmit: (event: FormEvent) => void;
}) {
  return (
    <div className="split-layout">
      <section className="panel">
        <div className="panel-title">
          <h2>{editingId ? "Editar ativo" : "Novo ativo"}</h2>
          <PiggyBank size={18} />
        </div>
        <form className="form-stack" onSubmit={onSubmit}>
          <label>
            Nome do ativo
            <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
          </label>
          <label>
            Valor
            <input value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} inputMode="decimal" required />
          </label>
          <label>
            Tipo
            <select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })}>
              {investmentTypes.map((type) => (
                <option key={type}>{type}</option>
              ))}
            </select>
          </label>
          <label className="check-row">
            <input checked={form.isDeductible} onChange={(event) => setForm({ ...form, isDeductible: event.target.checked })} type="checkbox" />
            Deduzir do saldo livre
          </label>
          <div className="button-row">
            {editingId ? (
              <button className="secondary-button" onClick={onCancel} type="button">
                Cancelar
              </button>
            ) : null}
            <button className="primary-button" type="submit">
              <Save size={18} />
              Salvar ativo
            </button>
          </div>
        </form>
      </section>

      <section className="panel">
        <div className="panel-title">
          <h2>Carteira</h2>
          <span>{investments.length} itens</span>
        </div>
        {investments.length ? (
          <div className="card-grid">
            {investments.map((item) => (
              <article className="asset-card" key={item.id}>
                <div className="asset-top">
                  <span>{item.type}</span>
                  <div className="icon-actions">
                    <button onClick={() => onEdit(item)} title="Editar" type="button">
                      <Edit3 size={16} />
                    </button>
                    <button onClick={() => onDelete(item.id)} title="Apagar" type="button">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <strong>{item.name}</strong>
                <p>{maskValue(formatCurrency(item.amount), privacyMode)}</p>
                {item.isDeductible ? <em>Deduzido do saldo livre</em> : null}
              </article>
            ))}
          </div>
        ) : (
          <EmptyState title="Nenhum investimento cadastrado." />
        )}
        {investments.length ? (
          <div className="chart-section">
            <h3>Distribuicao da carteira</h3>
            <PieChart data={investmentsByType} />
          </div>
        ) : null}
      </section>
    </div>
  );
}

function GoalsView({
  form,
  setForm,
  goals,
  editingId,
  privacyMode,
  onCancel,
  onDelete,
  onEdit,
  onSubmit
}: {
  form: { name: string; current: string; target: string };
  setForm: (form: { name: string; current: string; target: string }) => void;
  goals: Goal[];
  editingId: string | null;
  privacyMode: boolean;
  onCancel: () => void;
  onDelete: (id: string) => void;
  onEdit: (item: Goal) => void;
  onSubmit: (event: FormEvent) => void;
}) {
  return (
    <div className="split-layout">
      <section className="panel">
        <div className="panel-title">
          <h2>{editingId ? "Editar meta" : "Nova meta"}</h2>
          <Target size={18} />
        </div>
        <form className="form-stack" onSubmit={onSubmit}>
          <label>
            Nome da meta
            <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
          </label>
          <label>
            Valor atual
            <input value={form.current} onChange={(event) => setForm({ ...form, current: event.target.value })} inputMode="decimal" />
          </label>
          <label>
            Valor alvo
            <input value={form.target} onChange={(event) => setForm({ ...form, target: event.target.value })} inputMode="decimal" required />
          </label>
          <div className="button-row">
            {editingId ? (
              <button className="secondary-button" onClick={onCancel} type="button">
                Cancelar
              </button>
            ) : null}
            <button className="primary-button" type="submit">
              <Save size={18} />
              Salvar meta
            </button>
          </div>
        </form>
      </section>

      <section className="panel">
        <div className="panel-title">
          <h2>Minhas metas</h2>
          <span>{goals.length} itens</span>
        </div>
        {goals.length ? (
          <div className="goal-list">
            {goals.map((goal) => (
              <article key={goal.id}>
                <div className="goal-row">
                  <strong>{goal.name}</strong>
                  <div className="icon-actions">
                    <button onClick={() => onEdit(goal)} title="Editar" type="button">
                      <Edit3 size={16} />
                    </button>
                    <button onClick={() => onDelete(goal.id)} title="Apagar" type="button">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <p>{maskValue(`${formatCurrency(goal.current)} / ${formatCurrency(goal.target)}`, privacyMode)}</p>
                <ProgressBar current={goal.current} total={goal.target} />
              </article>
            ))}
          </div>
        ) : (
          <EmptyState title="Nenhuma meta cadastrada." />
        )}
      </section>
    </div>
  );
}

function AiView({
  data,
  loading,
  privacyMode,
  report,
  summary,
  onGenerate
}: {
  data: FinanceData;
  loading: boolean;
  privacyMode: boolean;
  report: AiReport | null;
  summary: FinancialSummary;
  onGenerate: () => void;
}) {
  const savingsRate = summary.income > 0 ? Math.round((summary.balance / summary.income) * 100) : 0;
  const expenseRate = summary.income > 0 ? Math.round((summary.expense / summary.income) * 100) : 0;
  const diagnosis =
    summary.income === 0
      ? "Cadastre suas entradas para o parecer ficar mais preciso."
      : summary.balance >= 0
        ? "Fluxo positivo. O foco agora e separar reserva, metas e aportes."
        : "Fluxo negativo. Priorize corte de despesas e revisao de dividas.";

  return (
    <div className="ai-layout">
      <section className="ai-hero">
        <BrainCircuit size={44} />
        <h2>Consultor financeiro</h2>
        <p>Um parecer pratico em formato de contador: diagnostico, riscos e proximas acoes.</p>
        <button className="primary-button" disabled={loading} onClick={onGenerate} type="button">
          {loading ? <LoaderCircle className="spin" size={18} /> : <BrainCircuit size={18} />}
          Gerar parecer
        </button>
      </section>

      {report ? (
        <section className="panel report-panel">
          <div className="panel-title">
            <h2>Parecer executivo</h2>
            <span>{report.generatedAt}</span>
          </div>
          <div className="report-grid">
            <article>
              <span>Diagnostico</span>
              <strong>{diagnosis}</strong>
            </article>
            <article>
              <span>Taxa de economia</span>
              <strong>{summary.income > 0 ? `${savingsRate}%` : "Sem base"}</strong>
            </article>
            <article>
              <span>Peso das despesas</span>
              <strong>{summary.income > 0 ? `${expenseRate}% da renda` : "Sem base"}</strong>
            </article>
            <article>
              <span>Itens analisados</span>
              <strong>{data.transactions.length + data.investments.length + data.vouchers.length + data.goals.length}</strong>
            </article>
          </div>
          <table className="report-table">
            <tbody>
              <tr>
                <th>Entradas</th>
                <td>{maskValue(formatCurrency(summary.income), privacyMode)}</td>
              </tr>
              <tr>
                <th>Saidas</th>
                <td>{maskValue(formatCurrency(summary.expense), privacyMode)}</td>
              </tr>
              <tr>
                <th>Saldo livre</th>
                <td>{maskValue(formatCurrency(summary.balance), privacyMode)}</td>
              </tr>
              <tr>
                <th>Carteira</th>
                <td>{maskValue(formatCurrency(summary.invested), privacyMode)}</td>
              </tr>
            </tbody>
          </table>
          <div className="action-notes">
            <h3>Proximas acoes</h3>
            <p>1. Marque investimentos dedutiveis apenas quando o aporte sair do saldo do mes.</p>
            <p>2. Use categorias de despesa com consistencia para os graficos ficarem confiaveis.</p>
            <p>3. Atualize vales quando usar, pois eles podem esconder gasto real se ficarem fora do controle.</p>
          </div>
          {report.remoteText ? (
            <div className="remote-insight">
              <h3>Observacao da IA remota</h3>
              <p>{report.remoteText}</p>
            </div>
          ) : null}
        </section>
      ) : (
        <section className="panel">
          <EmptyState title="Gere um parecer quando tiver dados suficientes." action="O relatorio local funciona mesmo antes do deploy do Apps Script." />
        </section>
      )}
    </div>
  );
}

export function App() {
  const [user, setUser] = useState<User | null>(() => readStoredUser());

  const handleLogin = (nextUser: User, remember: boolean) => {
    storeUser(nextUser, remember);
    setUser(nextUser);
  };

  const handleLogout = () => {
    clearStoredUser();
    setUser(null);
  };

  if (!user) {
    return <AuthScreen onLogin={handleLogin} />;
  }

  return <Dashboard user={user} onLogout={handleLogout} />;
}
