import { Suspense, lazy, useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  HelpCircle,
  LayoutDashboard,
  ListChecks,
  LogOut,
  RefreshCw,
  Repeat2,
  Settings,
  WalletCards
} from "lucide-react";
import { AuthScreen } from "./features/auth/AuthScreen";
import { PasswordRecoveryScreen } from "./features/auth/PasswordRecoveryScreen";
import { StatusMessage } from "./components/ui";
import { useFinance } from "./hooks/useFinance";
import { authService } from "./services/finance";
import { formatCurrency, monthEnd, monthKey, monthStart } from "./lib/format";
import type { ViewId } from "./types";

const DashboardView = lazy(() => import("./features/dashboard/DashboardView")
  .then((module) => ({ default: module.DashboardView })));
const TransactionsView = lazy(() => import("./features/transactions/TransactionsView")
  .then((module) => ({ default: module.TransactionsView })));
const AutomationsView = lazy(() => import("./features/automations/AutomationsView")
  .then((module) => ({ default: module.AutomationsView })));
const BudgetsView = lazy(() => import("./features/budgets/BudgetsView")
  .then((module) => ({ default: module.BudgetsView })));
const ReportsView = lazy(() => import("./features/reports/ReportsView")
  .then((module) => ({ default: module.ReportsView })));
const SettingsView = lazy(() => import("./features/settings/SettingsView")
  .then((module) => ({ default: module.SettingsView })));
const HelpView = lazy(() => import("./features/help/HelpView")
  .then((module) => ({ default: module.HelpView })));

const nav: Array<[ViewId, string, typeof LayoutDashboard]> = [
  ["dashboard", "Visão geral", LayoutDashboard],
  ["transactions", "Lançamentos", WalletCards],
  ["automations", "Recorrências", Repeat2],
  ["budgets", "Orçamentos", ListChecks],
  ["reports", "Relatórios", BarChart3],
  ["settings", "Conta e ajustes", Settings],
  ["help", "Ajuda", HelpCircle]
];

export default function App() {
  const finance = useFinance();
  const [view, setView] = useState<ViewId>("dashboard");
  const [month, setMonth] = useState(monthKey());
  const [message, setMessage] = useState("");
  const [tone, setTone] = useState<"info" | "success" | "warning" | "error">("info");
  const [busy, setBusy] = useState(false);

  const categoryMap = useMemo(
    () => new Map(finance.snapshot.categories.map((item) => [item.id, item])),
    [finance.snapshot.categories]
  );
  const monthRows = useMemo(
    () => finance.snapshot.transactions.filter(
      (item) => item.transaction_date >= monthStart(month)
        && item.transaction_date <= monthEnd(month)
    ),
    [finance.snapshot.transactions, month]
  );
  const summary = finance.summaryForMonth(month);

  useEffect(() => {
    const theme = finance.snapshot.settings?.theme ?? "dark";
    document.documentElement.dataset.theme = theme === "light" ? "light" : "dark";
    document.documentElement.classList.toggle(
      "compact",
      finance.snapshot.settings?.compact_mode ?? false
    );
  }, [finance.snapshot.settings?.theme, finance.snapshot.settings?.compact_mode]);

  useEffect(() => {
    const url = new URL(window.location.href);
    const auth = url.searchParams.get("auth");
    if (auth === "confirmed") {
      setTone("success");
      setMessage("E-mail confirmado. Sua conta está pronta para entrar.");
    } else if (auth === "email-change") {
      setTone("success");
      setMessage("Novo e-mail confirmado. O endereço da conta foi atualizado.");
      setView("settings");
    } else {
      return;
    }

    url.searchParams.delete("auth");
    window.history.replaceState({}, "", url);
  }, []);

  async function run(action: () => Promise<unknown>, ok: string): Promise<boolean> {
    setBusy(true);
    setMessage("");
    try {
      await action();
      await finance.refresh(false);
      setTone("success");
      setMessage(ok);
      return true;
    } catch (caught) {
      setTone("error");
      setMessage(caught instanceof Error ? caught.message : "A operação falhou.");
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function remove(action: () => Promise<void>) {
    if (!window.confirm("Excluir este registro? Esta ação não pode ser desfeita.")) return;
    await run(action, "Registro excluído.");
  }

  if (finance.loading) {
    return (
      <main className="splash">
        <div className="brand-mark">N</div>
        <p>Preparando sua visão financeira…</p>
      </main>
    );
  }

  if (finance.recoveryMode) {
    return (
      <PasswordRecoveryScreen
        onDone={() => {
          finance.finishRecovery();
          void finance.refresh(true);
        }}
      />
    );
  }

  if (!finance.session) return <AuthScreen initialMessage={finance.error ?? ""} />;

  const privacy = finance.snapshot.settings?.privacy_mode ?? false;
  const money = (value: number) => privacy ? "R$ •••••" : formatCurrency(value);

  let content: React.ReactNode;
  if (view === "dashboard") {
    content = (
      <DashboardView
        month={month}
        onMonth={setMonth}
        summary={summary}
        rows={monthRows}
        subscriptions={finance.snapshot.subscriptions}
        categoryMap={categoryMap}
        money={money}
        privacy={privacy}
      />
    );
  } else if (view === "transactions") {
    content = (
      <TransactionsView
        rows={monthRows}
        categories={finance.snapshot.categories}
        money={money}
        busy={busy}
        run={run}
        remove={remove}
      />
    );
  } else if (view === "automations") {
    content = (
      <AutomationsView
        rules={finance.snapshot.recurringRules}
        subscriptions={finance.snapshot.subscriptions}
        categories={finance.snapshot.categories}
        money={money}
        busy={busy}
        run={run}
        remove={remove}
      />
    );
  } else if (view === "budgets") {
    content = (
      <BudgetsView
        month={month}
        budgets={finance.snapshot.budgets}
        categories={finance.snapshot.categories}
        rows={monthRows}
        money={money}
        busy={busy}
        run={run}
        remove={remove}
      />
    );
  } else if (view === "reports") {
    content = (
      <ReportsView
        month={month}
        onMonth={setMonth}
        summary={summary}
        rows={monthRows}
        categories={finance.snapshot.categories}
        money={money}
      />
    );
  } else if (view === "settings") {
    content = (
      <SettingsView
        profile={finance.snapshot.profile}
        settings={finance.snapshot.settings}
        categories={finance.snapshot.categories}
        email={finance.session.user.email ?? "E-mail indisponível"}
        busy={busy}
        run={run}
        remove={remove}
      />
    );
  } else {
    content = <HelpView />;
  }

  return (
    <div className="shell">
      <aside>
        <div className="logo"><span>N</span><b>Nummi</b></div>
        <nav aria-label="Navegação principal">
          {nav.map(([id, label, Icon]) => (
            <button
              key={id}
              className={view === id ? "active" : ""}
              onClick={() => setView(id)}
              aria-current={view === id ? "page" : undefined}
            >
              <Icon size={18} />
              <span>{label}</span>
            </button>
          ))}
        </nav>
        <button
          onClick={() => {
            void authService.signOut("local").catch((caught) => {
              setTone("error");
              setMessage(caught instanceof Error ? caught.message : "Não foi possível sair.");
            });
          }}
        >
          <LogOut size={18} />
          <span>Sair</span>
        </button>
      </aside>

      <main>
        <header>
          <div>
            <p>Controle financeiro pessoal</p>
            <h1>{nav.find((item) => item[0] === view)?.[1]}</h1>
          </div>
          <button
            className="refresh"
            onClick={() => finance.refresh(true)}
            disabled={finance.refreshing}
          >
            <RefreshCw className={finance.refreshing ? "spin" : ""} size={17} />
            Atualizar
          </button>
        </header>

        {(message || finance.error) && (
          <StatusMessage tone={finance.error ? "error" : tone}>
            {message || finance.error}
          </StatusMessage>
        )}

        <Suspense fallback={<div className="view-loading">Carregando tela…</div>}>
          {content}
        </Suspense>
      </main>
    </div>
  );
}
