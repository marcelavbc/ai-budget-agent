"use client";

import type { BudgetLineRow, BudgetRow, ClientRow } from "@/features/budgets/types/budgetsDb";
import { BudgetDraftView } from "@/features/budgets/components/BudgetDraftView";
import { BudgetAIInput } from "@/features/budgets/components/BudgetAIInput";
import { BudgetEditInvoiceFooter } from "@/features/budgets/components/BudgetEditInvoiceFooter";
import { useBudgetEditController } from "@/features/budgets/hooks/useBudgetEditController";
import styles from "./BudgetDraftView.module.css";

export function BudgetEditView({
  budget,
  client,
  lines,
  invoiceWithoutIvaId,
  invoiceWithIvaId,
}: {
  budget: BudgetRow;
  client: ClientRow;
  lines: BudgetLineRow[];
  invoiceWithoutIvaId?: string | null;
  invoiceWithIvaId?: string | null;
}) {
  const c = useBudgetEditController({ budget, client, lines });

  return (
    <BudgetDraftView
      mode="edit"
      items={c.items}
      clientDetails={c.clientDetails}
      onClientDetailsChange={c.setClientWithAutoQuote}
      onItemChange={c.updateItem}
      onItemRemove={c.removeItem}
      itemsFooter={
        <BudgetAIInput
          loading={c.loading}
          formError={c.formError}
          submitLabel="Afegir"
          placeholder="Escriu el que vols afegir… (p. ex. Pintar passadís 8 m² + reparar esquerdes)"
          onSubmit={async (description) => {
            const lines = await c.submit(description);
            if (!lines) return false;
            c.appendAiLines(lines);
            return true;
          }}
        />
      }
      quoteManuallyEdited={c.quoteManuallyEdited}
      onQuoteNumberChange={c.onQuoteNumberChange}
      onResetQuoteAutomation={c.resetAutomation}
      onBack={c.onBack}
      onSave={c.handleSave}
      showPdf={c.showPdf}
      footerNotice={
        c.invoiceError ? (
          <p className={styles.saveError} role="alert">
            {c.invoiceError}
          </p>
        ) : null
      }
      footerActions={
        c.showInvoiceActions ? (
          <BudgetEditInvoiceFooter
            invoiceWithoutIvaId={invoiceWithoutIvaId}
            invoiceWithIvaId={invoiceWithIvaId}
            invoicePending={c.invoicePending}
            invoiceBusyMode={c.invoiceBusyMode}
            onViewInvoice={(invoiceId: string) => c.router.push(`/invoices/${invoiceId}`)}
            onCreateInvoice={c.runCreateInvoice}
          />
        ) : null
      }
    />
  );
}
