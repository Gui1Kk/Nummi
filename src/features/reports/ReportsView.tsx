import { useMemo, useState } from "react";
import { Download } from "lucide-react";
import { Card, EmptyState, StatusMessage } from "../../components/ui";
import { monthEnd, monthLabel, monthStart } from "../../lib/format";
import { addMoney } from "../../lib/money";
import { financeService } from "../../services/finance";
import type { Category, MonthSummary, Transaction } from "../../types";

interface ReportsViewProps {
  month: string;
  onMonth: (month: string) => void;
  summary: MonthSummary;
  rows: Transaction[];
  categories: Category[];
  money: (value: number) => string;
}

export function ReportsView({
  month,
  onMonth,
  summary,
  rows,
  categories,
  money
}: ReportsViewProps) {
  const [exporting, setExporting] = useState(false);
  const [message, setMessage] = useState("");
  const [tone, setTone] = useState<"success" | "error">("success");

  const categoryMap = useMemo(
    () => new Map(categories.map((item) => [item.id, item])),
    [categories]
  );
  const byCategory = useMemo(() => Array.from(categoryMap.values())
    .map((category) => ({
      category,
      total: addMoney(rows
        .filter((item) => item.kind === "expense"
          && item.status === "posted"
          && item.category_id === category.id)
        .map((item) => item.amount))
    }))
    .filter((item) => item.total > 0)
    .sort((left, right) => right.total - left.total), [categoryMap, rows]);
  const total = addMoney(byCategory.map((item) => item.total));

  async function exportCsv() {
    setExporting(true);
    setMessage("");
    try {
      await financeService.exportTransactionsCsv(monthStart(month), monthEnd(month));
      setTone("success");
      setMessage("Exportação preparada.");
    } catch (caught) {
      setTone("error");
      setMessage(caught instanceof Error ? caught.message : "Não foi possível exportar.");
    } finally {
      setExporting(false);
    }
  }

  return (
    <>
      <section className="hero">
        <div>
          <p>Relatório mensal</p>
          <h2>{monthLabel(month)}</h2>
          <small>Somente valores realizados entram no resultado</small>
        </div>
        <div className="hero-actions">
          <input
            aria-label="Selecionar mês do relatório"
            type="month"
            value={month}
            onChange={(event) => onMonth(event.target.value)}
          />
          <button
            type="button"
            className="hero-button"
            onClick={exportCsv}
            disabled={exporting}
          >
            <Download size={16} />
            {exporting ? "Exportando…" : "Baixar CSV"}
          </button>
        </div>
      </section>

      {message && <StatusMessage tone={tone}>{message}</StatusMessage>}

      <div className="metrics report-summary">
        <Card title="Resultado">
          <strong className={summary.balance >= 0 ? "good" : "bad"}>
            {money(summary.balance)}
          </strong>
        </Card>
        <Card title="Taxa de poupança"><strong>{summary.savingsRate.toFixed(1)}%</strong></Card>
        <Card title="Previsto a receber"><strong>{money(summary.plannedIncome)}</strong></Card>
        <Card title="Previsto a pagar"><strong>{money(summary.plannedExpense)}</strong></Card>
      </div>

      <Card
        title="Despesas por categoria"
        subtitle="Distribuição do que foi efetivamente pago"
      >
        {byCategory.length ? (
          <div className="category-report">
            {byCategory.map(({ category, total: categoryTotal }) => (
              <div key={category.id} className="category-row">
                <div>
                  <span className="category-dot" style={{ background: category.color }} />
                  <b>{category.name}</b>
                </div>
                <div
                  className="category-bar"
                  role="img"
                  aria-label={`${category.name}: ${total ? ((categoryTotal / total) * 100).toFixed(1) : "0"}% das despesas`}
                >
                  <span
                    style={{
                      width: `${total ? (categoryTotal / total) * 100 : 0}%`,
                      background: category.color
                    }}
                  />
                </div>
                <strong>{money(categoryTotal)}</strong>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title="Sem despesas realizadas"
            description="O relatório será preenchido quando houver saídas realizadas nesta competência."
          />
        )}
      </Card>
    </>
  );
}
