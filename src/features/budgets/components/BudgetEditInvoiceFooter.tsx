"use client";

import type { InvoicePricingMode } from "@/features/invoices/types/invoice";
import styles from "@/features/budgets/components/BudgetDraftView.module.css";

export function BudgetEditInvoiceFooter({
  invoiceWithoutIvaId,
  invoiceWithIvaId,
  invoicePending,
  invoiceBusyMode,
  onViewInvoice,
  onCreateInvoice,
}: {
  invoiceWithoutIvaId?: string | null;
  invoiceWithIvaId?: string | null;
  invoicePending: boolean;
  invoiceBusyMode: InvoicePricingMode | null;
  onViewInvoice: (invoiceId: string) => void;
  onCreateInvoice: (mode: InvoicePricingMode) => void;
}) {
  return (
    <div className={styles.invoiceFooterCluster}>
      {invoiceWithoutIvaId?.trim() ? (
        <button
          type="button"
          className={styles.pdfBtn}
          onClick={() => onViewInvoice(invoiceWithoutIvaId.trim())}
        >
          Veure sense IVA
        </button>
      ) : (
        <button
          type="button"
          className={styles.pdfBtn}
          disabled={invoicePending}
          aria-busy={invoiceBusyMode === "without_iva" ? true : undefined}
          onClick={() => onCreateInvoice("without_iva")}
        >
          {invoiceBusyMode === "without_iva" ? "Generant…" : "Generar sense IVA"}
        </button>
      )}

      {invoiceWithIvaId?.trim() ? (
        <button
          type="button"
          className={styles.pdfBtn}
          onClick={() => onViewInvoice(invoiceWithIvaId.trim())}
        >
          Veure amb IVA
        </button>
      ) : (
        <button
          type="button"
          className={styles.pdfBtn}
          disabled={invoicePending}
          aria-busy={invoiceBusyMode === "with_iva" ? true : undefined}
          onClick={() => onCreateInvoice("with_iva")}
        >
          {invoiceBusyMode === "with_iva" ? "Generant…" : "Generar amb IVA"}
        </button>
      )}
    </div>
  );
}

