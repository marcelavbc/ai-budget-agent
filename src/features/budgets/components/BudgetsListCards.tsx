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

export function BudgetsListCards({
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
    <ul className={`${styles.list} ${styles.listMobile}`}>
      {budgets.map((b) => {
        const title = (b.title ?? "").trim() || "Pressupost sense títol";
        const quote = (b.quote_number ?? "").trim();
        const docDate = formatBudgetListDate(b.document_date);

        return (
          <li key={b.id}>
            <div className={styles.card}>
              <div className={styles.cardTop}>
                <div className={styles.cardTopLeft}>
                  <Link className={styles.cardTitleLink} href={`/budgets/${b.id}/edit`}>
                    <h3 className={styles.cardTitle}>{title}</h3>
                  </Link>
                </div>
              </div>

              <div className={styles.cardFooter}>
                <div className={styles.meta}>
                  <StatusPill
                    budgetId={b.id}
                    initialStatus={b.status}
                    onStatusChange={(next) => onStatusChange(b.id, next)}
                  />

                  {docDate ? (
                    <span>
                      <span className={styles.k}>Data</span>
                      {docDate}
                    </span>
                  ) : null}

                  {quote ? (
                    <span>
                      <span className={styles.k}>Núm.</span>
                      {quote}
                    </span>
                  ) : null}
                </div>

                <div className={styles.cardActions}>
                  <BudgetListItemActions
                    budgetId={b.id}
                    budgetStatus={b.status}
                    onInvoiceCreated={(pricingMode, invoiceId) =>
                      onInvoiceCreated(b.id, pricingMode, invoiceId)
                    }
                    variant="icons"
                  />
                </div>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

