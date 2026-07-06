"use client";

import Link from "next/link";
import { StatusPill } from "@/features/budgets/components/StatusPill";
import { formatBudgetListDate } from "@/features/budgets/lib/budgetsListFormatting";
import type { BudgetStatus } from "@/features/budgets/lib/budgetStatus";
import type { BudgetListRow } from "@/features/budgets/types/budgetsDb";
import { BudgetListItemActions } from "@/features/budgets/components/BudgetListItemActions";
import styles from "./BudgetsListTable.module.css";

export function BudgetsListTable({
  budgets,
  onStatusChange,
}: {
  budgets: BudgetListRow[];
  onStatusChange: (budgetId: string, next: BudgetStatus) => void;
}) {
  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.th}>Núm. pressupost</th>
            <th className={styles.th}>Client</th>
            <th className={styles.th}>Data</th>
            <th className={`${styles.th} ${styles.colLang}`}>Idioma</th>
            <th className={`${styles.th} ${styles.colStatus}`}>Estat</th>
            <th className={`${styles.th} ${styles.colActions}`}>Accions</th>
          </tr>
        </thead>
        <tbody>
          {budgets.map((b) => {
            const quote = (b.quote_number ?? "").trim() || "—";
            const client = (b.title ?? "").trim() || "—";
            const docDate = formatBudgetListDate(b.document_date) ?? "—";

            return (
              <tr key={b.id} className={styles.tr}>
                <td className={`${styles.td} ${styles.colQuote}`}>
                  <Link
                    className={styles.quoteLink}
                    href={`/budgets/${b.id}/edit`}
                  >
                    {quote}
                  </Link>
                </td>
                <td className={`${styles.td} ${styles.colClient}`}>{client}</td>
                <td className={`${styles.td} ${styles.colDate}`}>{docDate}</td>
                <td className={`${styles.td} ${styles.colLang}`}>
                  <span
                    className={
                      b.lang === "es"
                        ? `${styles.langBadge} ${styles.langBadgeEs}`
                        : styles.langBadge
                    }
                  >
                    {b.lang === "es" ? "ES" : "CA"}
                  </span>
                </td>
                <td className={`${styles.td} ${styles.colStatus}`}>
                  <StatusPill
                    budgetId={b.id}
                    initialStatus={b.status}
                    onStatusChange={(next) => onStatusChange(b.id, next)}
                  />
                </td>
                <td className={`${styles.td} ${styles.colActions}`}>
                  <div className={styles.rowActions}>
                    <BudgetListItemActions
                      budgetId={b.id}
                      budgetStatus={b.status}
                      budgetLang={b.lang}
                      invoiceId={b.invoice_id ?? null}
                      variant="icons"
                    />
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
