"use client";

import Link from "next/link";
import { BudgetListItemActions } from "@/features/budgets/components/BudgetListItemActions";
import { StatusPill } from "@/features/budgets/components/StatusPill";
import { formatBudgetListDate } from "@/features/budgets/lib/budgetsListFormatting";
import type { BudgetStatus } from "@/features/budgets/lib/budgetStatus";
import type { BudgetListRow } from "@/features/budgets/types/budgetsDb";
import type { CssModuleStyles } from "@/features/budgets/types/styles";
import type { BudgetInvoiceIds } from "@/features/invoices/lib/invoices";
import type { InvoicePricingMode } from "@/features/invoices/types/invoice";

export function BudgetsListTable({
  styles,
  budgets,
  getMergedInvoiceIds,
  onStatusChange,
  onInvoiceCreated,
}: {
  styles: CssModuleStyles;
  budgets: BudgetListRow[];
  getMergedInvoiceIds: (budgetId: string) => BudgetInvoiceIds;
  onStatusChange: (budgetId: string, next: BudgetStatus) => void;
  onInvoiceCreated: (budgetId: string, pricingMode: InvoicePricingMode, invoiceId: string) => void;
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
                  <Link className={styles.quoteLink} href={`/budgets/${b.id}/edit`}>
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
                      onInvoiceCreated={(pricingMode, invoiceId) =>
                        onInvoiceCreated(b.id, pricingMode, invoiceId)
                      }
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

