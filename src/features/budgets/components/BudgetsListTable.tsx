"use client";

import { useRouter } from "next/navigation";
import { StatusPill } from "@/features/budgets/components/StatusPill";
import { formatBudgetListDate } from "@/features/budgets/lib/budgetsListFormatting";
import type { BudgetStatus } from "@/features/budgets/lib/budgetStatus";
import type { BudgetListRow } from "@/features/budgets/types/budgetsDb";
import styles from "./BudgetsListTable.module.css";

export function BudgetsListTable({
  budgets,
  onStatusChange,
}: {
  budgets: BudgetListRow[];
  onStatusChange: (budgetId: string, next: BudgetStatus) => void;
}) {
  const router = useRouter();

  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.th}>Núm. pressupost</th>
            <th className={styles.th}>Client</th>
            <th className={styles.th}>Data</th>
            <th className={`${styles.th} ${styles.colStatus}`}>Estat</th>
          </tr>
        </thead>
        <tbody>
          {budgets.map((b) => {
            const quote = (b.quote_number ?? "").trim() || "—";
            const client = (b.title ?? "").trim() || "—";
            const docDate = formatBudgetListDate(b.document_date) ?? "—";
            return (
              <tr
                key={b.id}
                className={`${styles.tr} ${styles.trClickable}`}
                onClick={() => {
                  if (b.status === "invoiced") {
                    const inv = (b.invoice_id ?? "").trim();
                    if (inv) router.push(`/invoices/${inv}`);
                    return;
                  }
                  router.push(`/budgets/${b.id}/edit`);
                }}
              >
                <td className={`${styles.td} ${styles.colQuote}`}>{quote}</td>
                <td className={`${styles.td} ${styles.colClient}`}>{client}</td>
                <td className={`${styles.td} ${styles.colDate}`}>{docDate}</td>

                <td className={`${styles.td} ${styles.colStatus}`}>
                  <StatusPill
                    budgetId={b.id}
                    initialStatus={b.status}
                    onStatusChange={(next) => onStatusChange(b.id, next)}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
