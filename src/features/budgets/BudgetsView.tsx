import { FormEvent, useState } from "react";
import { Pencil, Trash2, X } from "lucide-react";
import { Card, EmptyState, Field } from "../../components/ui";
import { budgetFormSchema, type BudgetFormInput } from "../../schemas";
import { financeService } from "../../services/finance";
import { addMoney, subtractMoney } from "../../lib/money";
import type { Budget, Category, Transaction } from "../../types";

interface BudgetsViewProps {
  month: string;
  budgets: Budget[];
  categories: Category[];
  rows: Transaction[];
  money: (value: number) => string;
  busy: boolean;
  run: (action: () => Promise<unknown>, message: string) => Promise<boolean>;
  remove: (action: () => Promise<void>) => Promise<void>;
}

function blank(month: string): BudgetFormInput {
  return { category_id: "", month: `${month}-01`, amount: 0, rollover: false };
}

export function BudgetsView({
  month,
  budgets,
  categories,
  rows,
  money,
  busy,
  run,
  remove
}: BudgetsViewProps) {
  const [form, setForm] = useState<BudgetFormInput>(blank(month));
  const [editing, setEditing] = useState<string | null>(null);
  const [error, setError] = useState("");

  const monthBudgets = budgets.filter((item) => item.month.startsWith(month));
  const categoryMap = new Map(categories.map((item) => [item.id, item]));

  function cancel() {
    setEditing(null);
    setForm(blank(month));
    setError("");
  }

  function edit(item: Budget) {
    setEditing(item.id);
    setForm({
      category_id: item.category_id,
      month: item.month,
      amount: item.amount,
      rollover: item.rollover
    });
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    const parsed = budgetFormSchema.safeParse(form);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Confira o orçamento.");
      return;
    }
    if (await run(
      () => financeService.saveBudget(parsed.data, editing ?? undefined),
      editing ? "Orçamento atualizado." : "Orçamento salvo."
    )) cancel();
  }

  return (
    <>
      <Card
        title={editing ? "Editar orçamento" : "Orçamento mensal"}
        subtitle="Defina um teto por categoria, sem misturar com o saldo"
      >
        <form className="grid" onSubmit={submit} noValidate>
          <Field label="Categoria">
            <select
              value={form.category_id}
              onChange={(event) => setForm({ ...form, category_id: event.target.value })}
              required
              disabled={busy}
            >
              <option value="">Selecione</option>
              {categories
                .filter((category) => !category.archived
                  && (category.scope === "expense" || category.scope === "both"))
                .map((category) => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
            </select>
          </Field>
          <Field label="Mês">
            <input
              type="month"
              value={form.month.slice(0, 7)}
              onChange={(event) => setForm({ ...form, month: `${event.target.value}-01` })}
              disabled={busy}
            />
          </Field>
          <Field label="Limite">
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={form.amount || ""}
              onChange={(event) => setForm({ ...form, amount: event.target.valueAsNumber })}
              disabled={busy}
            />
          </Field>
          <label className="check">
            <input
              type="checkbox"
              checked={form.rollover}
              onChange={(event) => setForm({ ...form, rollover: event.target.checked })}
              disabled={busy}
            />
            Carregar saldo não usado
          </label>
          {error && <p className="form-error" role="alert">{error}</p>}
          <div className="form-actions">
            <button className="primary" disabled={busy}>
              {editing ? "Salvar alteração" : "Salvar orçamento"}
            </button>
            {editing && (
              <button type="button" className="secondary" onClick={cancel} disabled={busy}>
                <X size={16} />Cancelar
              </button>
            )}
          </div>
        </form>
      </Card>

      {monthBudgets.length ? (
        <div className="metrics budget-cards">
          {monthBudgets.map((item) => {
            const spent = addMoney(rows
              .filter((row) => row.kind === "expense"
                && row.status === "posted"
                && row.category_id === item.category_id)
              .map((row) => row.amount));
            const remaining = subtractMoney(item.amount, spent);
            const exceeded = remaining < 0;
            const ratio = item.amount > 0 ? Math.min(100, (spent / item.amount) * 100) : 0;

            return (
              <Card
                key={item.id}
                title={categoryMap.get(item.category_id)?.name ?? "Categoria"}
                actions={(
                  <div className="row-actions">
                    <button
                      type="button"
                      className="icon"
                      onClick={() => edit(item)}
                      aria-label="Editar orçamento"
                      disabled={busy}
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      type="button"
                      className="icon danger-icon"
                      onClick={() => remove(() => financeService.deleteBudget(item.id))}
                      aria-label="Excluir orçamento"
                      disabled={busy}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
              >
                <strong>{money(spent)} <small>/ {money(item.amount)}</small></strong>
                <div className="progress"><span style={{ width: `${ratio}%` }} /></div>
                <p className={exceeded ? "bad" : "muted"}>
                  {exceeded
                    ? `Excedido em ${money(Math.abs(remaining))}`
                    : `Restam ${money(remaining)}`}
                </p>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card title="Orçamentos">
          <EmptyState
            title="Nenhum limite neste mês"
            description="Crie um orçamento por categoria para enxergar desvios antes do fim do mês."
          />
        </Card>
      )}
    </>
  );
}
