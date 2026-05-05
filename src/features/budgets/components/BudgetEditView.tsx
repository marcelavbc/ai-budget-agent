"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { BudgetClientDetails, BudgetClientItem } from "@/features/budgets/types/budget";
import type { BudgetLineRow, BudgetRow, ClientRow } from "@/features/budgets/types/budgetsDb";
import { normalizeBudgetStatus } from "@/features/budgets/lib/budgetStatus";
import { BudgetDraftView } from "@/features/budgets/components/BudgetDraftView";
import { BudgetAIInput } from "@/features/budgets/components/BudgetAIInput";
import { updateBudgetWithLines } from "@/features/budgets/lib/budgetsClient";
import { createInvoiceFromBudget } from "@/features/invoices/lib/invoicesClient";
import { useGenerateBudgetDraft } from "@/features/budgets/hooks/useGenerateBudgetDraft";
import { budgetLinesToClientItems } from "@/features/budgets/lib/budgetLineToClientItem";
import { useQuoteNumber } from "@/features/budgets/hooks/useQuoteNumber";
import type { InvoicePricingMode } from "@/features/invoices/types/invoice";
import styles from "./BudgetDraftView.module.css";

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

function normalizeUnitLabel(
  value: string | null | undefined
): BudgetClientItem["unitLabel"] {
  const v = (value ?? "").trim();
  if (v === "m²" || v === "unitat" || v === "partida") return v;
  return "partida";
}

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
  const router = useRouter();
  const { submit, loading, formError } = useGenerateBudgetDraft();
  const [invoiceError, setInvoiceError] = useState<string | null>(null);
  const [isGeneratingInvoice, startGeneratingInvoice] = useTransition();
  const [invoiceBusyMode, setInvoiceBusyMode] =
    useState<InvoicePricingMode | null>(null);

  const initialClient: BudgetClientDetails = useMemo(
    () => ({
      nameOrCompany: (client.name ?? "").trim(),
      address: (budget.job_address ?? client.address ?? "").trim(),
      quoteNumber: (budget.quote_number ?? "").trim(),
      date: (budget.document_date ?? "").trim(),
      estimatedTime: (budget.estimated_time ?? "").trim(),
    }),
    [
      budget.document_date,
      budget.estimated_time,
      budget.job_address,
      budget.quote_number,
      client.address,
      client.name,
    ]
  );

  const initialItems: BudgetClientItem[] = useMemo(
    () =>
      lines.map((l) => ({
        id: l.id,
        title: (l.title ?? "").trim() || "Partida",
        description: (l.description ?? "").trim(),
        quantity: l.quantity ?? 1,
        unitLabel: normalizeUnitLabel(l.unit),
        unitPrice: l.unit_price ?? 0,
        total: l.line_total ?? round2((l.quantity ?? 1) * (l.unit_price ?? 0)),
        optionGroupId: (l.option_group_id ?? undefined) || undefined,
        optionLabel: (l.option_label ?? undefined) || undefined,
      })),
    [lines]
  );

  const [clientDetails, setClientDetails] =
    useState<BudgetClientDetails>(initialClient);
  const [items, setItems] = useState<BudgetClientItem[]>(initialItems);

  const {
    quoteManuallyEdited,
    setClientWithAutoQuote,
    onQuoteNumberChange,
    resetAutomation,
  } = useQuoteNumber({ setClientDetails, initialManuallyEdited: true });

  async function handleSave({
    client,
    items,
  }: {
    client: BudgetClientDetails;
    items: BudgetClientItem[];
  }) {
    await updateBudgetWithLines({
      budgetId: budget.id,
      clientId: budget.client_id,
      client,
      items,
      taxRate: budget.tax_rate ?? 0,
      status: normalizeBudgetStatus(budget.status),
    });
    router.push(`/budgets/${budget.id}`);
  }

  const status = normalizeBudgetStatus(budget.status);
  const showInvoiceActions = status === "approved";
  const invoicePending = invoiceBusyMode !== null;

  function runCreateInvoice(mode: InvoicePricingMode) {
    if (isGeneratingInvoice || invoiceBusyMode) return;
    setInvoiceError(null);
    setInvoiceBusyMode(mode);
    startGeneratingInvoice(() => {
      void (async () => {
        try {
          const { invoiceId } = await createInvoiceFromBudget(budget.id, mode);
          router.push(`/invoices/${invoiceId}`);
        } catch (e) {
          setInvoiceError(
            e instanceof Error
              ? e.message
              : "No s'ha pogut generar la factura."
          );
        } finally {
          setInvoiceBusyMode(null);
        }
      })();
    });
  }

  return (
    <BudgetDraftView
      mode="edit"
      items={items}
      clientDetails={clientDetails}
      onClientDetailsChange={setClientWithAutoQuote}
      onItemChange={(id, patch) => {
        setItems((prev) =>
          prev.map((item) => (item.id === id ? { ...item, ...patch } : item))
        );
      }}
      onItemRemove={(id) => {
        setItems((prev) => prev.filter((item) => item.id !== id));
      }}
      itemsFooter={
        <BudgetAIInput
          loading={loading}
          formError={formError}
          submitLabel="Afegir"
          placeholder="Escriu el que vols afegir… (p. ex. Pintar passadís 8 m² + reparar esquerdes)"
          onSubmit={async (description) => {
            const lines = await submit(description);
            if (!lines) return false;
            setItems((prev) => [...prev, ...budgetLinesToClientItems(lines)]);
            return true;
          }}
        />
      }
      quoteManuallyEdited={quoteManuallyEdited}
      onQuoteNumberChange={onQuoteNumberChange}
      onResetQuoteAutomation={resetAutomation}
      onBack={() => router.push(`/budgets/${budget.id}`)}
      onSave={handleSave}
      showPdf={status !== "approved"}
      footerNotice={
        invoiceError ? (
          <p className={styles.saveError} role="alert">
            {invoiceError}
          </p>
        ) : null
      }
      footerActions={
        showInvoiceActions ? (
          <div className={styles.invoiceFooterCluster}>
            {invoiceWithoutIvaId?.trim() ? (
              <button
                type="button"
                className={styles.pdfBtn}
                onClick={() =>
                  router.push(`/invoices/${invoiceWithoutIvaId.trim()}`)
                }
              >
                Veure sense IVA
              </button>
            ) : (
              <button
                type="button"
                className={styles.pdfBtn}
                disabled={invoicePending}
                aria-busy={invoiceBusyMode === "without_iva" ? true : undefined}
                onClick={() => runCreateInvoice("without_iva")}
              >
                {invoiceBusyMode === "without_iva"
                  ? "Generant…"
                  : "Generar sense IVA"}
              </button>
            )}
            {invoiceWithIvaId?.trim() ? (
              <button
                type="button"
                className={styles.pdfBtn}
                onClick={() =>
                  router.push(`/invoices/${invoiceWithIvaId.trim()}`)
                }
              >
                Veure amb IVA
              </button>
            ) : (
              <button
                type="button"
                className={styles.pdfBtn}
                disabled={invoicePending}
                aria-busy={invoiceBusyMode === "with_iva" ? true : undefined}
                onClick={() => runCreateInvoice("with_iva")}
              >
                {invoiceBusyMode === "with_iva"
                  ? "Generant…"
                  : "Generar amb IVA"}
              </button>
            )}
          </div>
        ) : null
      }
    />
  );
}
