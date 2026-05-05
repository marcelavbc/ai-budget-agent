"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { BudgetClientDetails, BudgetClientItem } from "@/features/budgets/types/budget";
import type { BudgetLineRow, BudgetRow, ClientRow } from "@/features/budgets/types/budgetsDb";
import { normalizeBudgetStatus } from "@/features/budgets/lib/budgetStatus";
import { updateBudgetWithLines } from "@/features/budgets/lib/budgetsClient";
import { createInvoiceFromBudget } from "@/features/invoices/lib/invoicesClient";
import { useGenerateBudgetDraft } from "@/features/budgets/hooks/useGenerateBudgetDraft";
import { budgetLinesToClientItems } from "@/features/budgets/lib/budgetLineToClientItem";
import { useQuoteNumber } from "@/features/budgets/hooks/useQuoteNumber";
import type { InvoicePricingMode } from "@/features/invoices/types/invoice";
import {
  buildInitialBudgetEditClientDetails,
  buildInitialBudgetEditItems,
} from "@/features/budgets/lib/mapBudgetEditInitialState";

export function useBudgetEditController(args: {
  budget: BudgetRow;
  client: ClientRow;
  lines: BudgetLineRow[];
}) {
  const { budget, client, lines } = args;
  const router = useRouter();
  const { submit, loading, formError } = useGenerateBudgetDraft();
  const [invoiceError, setInvoiceError] = useState<string | null>(null);
  const [isGeneratingInvoice, startGeneratingInvoice] = useTransition();
  const [invoiceBusyMode, setInvoiceBusyMode] =
    useState<InvoicePricingMode | null>(null);

  const initialClient: BudgetClientDetails = useMemo(
    () => buildInitialBudgetEditClientDetails({ budget, client }),
    [budget, client]
  );

  const initialItems: BudgetClientItem[] = useMemo(
    () => buildInitialBudgetEditItems({ lines }),
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
            e instanceof Error ? e.message : "No s'ha pogut generar la factura."
          );
        } finally {
          setInvoiceBusyMode(null);
        }
      })();
    });
  }

  return {
    router,
    budgetId: budget.id,

    // AI
    submit,
    loading,
    formError,

    // draft state
    clientDetails,
    items,
    setItems,
    quoteManuallyEdited,
    setClientWithAutoQuote,
    onQuoteNumberChange,
    resetAutomation,

    // save/back
    handleSave,
    onBack: () => router.push(`/budgets/${budget.id}`),

    // invoice
    status,
    showInvoiceActions,
    invoiceError,
    invoicePending,
    invoiceBusyMode,
    runCreateInvoice,

    // UI helpers
    showPdf: status !== "approved",
    appendAiLines: (lines: unknown) => {
      // keep behavior identical: BudgetAIInput only calls this after submit() returns lines
      setItems((prev) => [...prev, ...budgetLinesToClientItems(lines as never)]);
    },
    updateItem: (id: string, patch: Partial<BudgetClientItem>) => {
      setItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, ...patch } : item))
      );
    },
    removeItem: (id: string) => {
      setItems((prev) => prev.filter((item) => item.id !== id));
    },
  };
}

