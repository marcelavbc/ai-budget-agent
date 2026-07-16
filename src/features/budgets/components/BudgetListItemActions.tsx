"use client";

import Link from "next/link";
import { FileDown, Eye } from "lucide-react";
import styles from "./BudgetListItemActions.module.css";
import { usePdfExport } from "@/features/budgets/hooks/usePdfExport";
import type {
  BudgetClientDetails,
  BudgetClientItem,
} from "@/features/budgets/types/budget";
import type {
  BudgetLineRow,
  BudgetRow,
} from "@/features/budgets/types/budgetsDb";
import type { ContactRow } from "@/features/contacts/lib/contacts";
import { getBudgetExportData } from "@/features/budgets/lib/budgetsClient";
import { normalizeBudgetStatus } from "@/features/budgets/lib/budgetStatus";

export function BudgetListItemActions({
  budgetId,
  budgetStatus,
  budgetLang,
  invoiceId,
  variant = "full",
}: {
  budgetId: string;
  budgetStatus?: string | null;
  budgetLang?: string | null;
  invoiceId?: string | null;
  variant?: "full" | "icons";
}) {
  const { exportPdf, generating, pdfError, setPdfError } = usePdfExport();

  const isInvoiced = normalizeBudgetStatus(budgetStatus) === "invoiced";

  async function handleGeneratePdf(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    e.stopPropagation();
    const lang = budgetLang === "es" ? "es" : "ca";
    try {
      const data = (await getBudgetExportData(budgetId)) as unknown;
      if (typeof data !== "object" || data === null) {
        throw new Error("No s'ha pogut generar el PDF. Torna-ho a provar.");
      }
      const budget = (data as { budget?: unknown }).budget as
        | BudgetRow
        | undefined;
      const client = (data as { client?: unknown }).client as
        | ContactRow
        | undefined;
      const lines = (data as { lines?: unknown }).lines as
        | BudgetLineRow[]
        | undefined;
      if (!budget || !client || !Array.isArray(lines)) {
        throw new Error("No s'ha pogut generar el PDF. Torna-ho a provar.");
      }

      const itemsForPdf: BudgetClientItem[] = lines.map((l) => ({
        id: l.id,
        title: (l.title ?? "").trim() || "Linia",
        description: (l.description ?? "").trim(),
        total: l.line_total ?? 0,
        quantity: l.quantity ?? undefined,
        unitLabel: (l.unit ?? undefined) as BudgetClientItem["unitLabel"],
        unitPrice: l.unit_price ?? undefined,
        optionGroupId: (l.option_group_id ?? undefined) || undefined,
        optionLabel: (l.option_label ?? undefined) || undefined,
      }));

      const clientForPdf: BudgetClientDetails = {
        nameOrCompany: (client.name ?? "").trim(),
        jobAddressStreet: (budget.job_address_street ?? "").trim(),
        jobAddressPostalCode: (budget.job_address_postal_code ?? "").trim(),
        jobAddressCity: (budget.job_address_city ?? "").trim(),
        taxRate: budget.tax_rate ?? 0,
        quoteNumber: (budget.quote_number ?? "").trim(),
        date: (budget.document_date ?? "").trim(),
        estimatedTime: (budget.estimated_time ?? "").trim(),
        lang,
      };

      await exportPdf({
        client: clientForPdf,
        items: itemsForPdf,
      });
    } catch (err) {
      setPdfError(
        err instanceof Error
          ? err.message
          : "No s'ha pogut generar el PDF. Torna-ho a provar."
      );
    }
  }

  const nonEmptyInvoiceId = (invoiceId ?? "").trim();

  return (
    <div
      className={`${styles.root} ${variant === "icons" ? styles.rootIcons : ""}`}
    >
      {isInvoiced ? (
        <>
          {nonEmptyInvoiceId ? (
            <Link
              href={`/invoices/${nonEmptyInvoiceId}`}
              onClick={(e) => e.stopPropagation()}
              className={variant === "icons" ? styles.iconBtn : styles.btn}
              aria-label="Veure factura"
              title="Veure factura"
            >
              <Eye size={18} aria-hidden="true" />
            </Link>
          ) : null}
        </>
      ) : (
        <>
          <button
            type="button"
            disabled={generating}
            className={
              variant === "icons"
                ? styles.iconBtn
                : `${styles.btn} ${styles.primary}`
            }
            aria-busy={generating || undefined}
            aria-label="Generar PDF"
            title="PDF"
            onClick={handleGeneratePdf}
          >
            {variant === "icons" ? (
              generating ? (
                "..."
              ) : (
                <FileDown size={18} aria-hidden="true" />
              )
            ) : generating ? (
              "PDF..."
            ) : (
              "PDF"
            )}
          </button>
        </>
      )}

      {!isInvoiced && pdfError ? (
        <p className={styles.error} role="alert">
          {pdfError}
        </p>
      ) : null}
    </div>
  );
}
