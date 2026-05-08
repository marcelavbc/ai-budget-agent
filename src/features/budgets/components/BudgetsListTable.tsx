"use client";

import Link from "next/link";
import { StatusPill } from "@/features/budgets/components/StatusPill";
import { formatBudgetListDate } from "@/features/budgets/lib/budgetsListFormatting";
import type { BudgetStatus } from "@/features/budgets/lib/budgetStatus";
import type { BudgetListRow } from "@/features/budgets/types/budgetsDb";
import type { CssModuleStyles } from "@/features/budgets/types/styles";
import { BudgetListItemActions } from "./BudgetListItemActions";

export function BudgetsListTable({
  styles,
  budgets,
  onStatusChange,
}: {
  styles: CssModuleStyles;
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
                      invoiceId={b.invoice_id ?? null}
                      clientName={b.title}
                      clientTaxId={null}
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
