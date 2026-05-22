"use client";

import { useMemo, useState } from "react";
import type {
  BudgetClientDetails,
  BudgetClientItem,
  BudgetLine,
} from "@/features/budgets/types/budget";
import type {
  BudgetLineRow,
  BudgetRow,
  ClientRow,
} from "@/features/budgets/types/budgetsDb";
import { normalizeBudgetStatus } from "@/features/budgets/lib/budgetStatus";
import { updateBudgetWithLines } from "@/features/budgets/lib/budgetsClient";
import { useGenerateBudgetDraft } from "@/features/budgets/hooks/useGenerateBudgetDraft";
import { budgetLinesToClientItems } from "@/features/budgets/lib/budgetLineToClientItem";
import { useQuoteNumber } from "@/features/budgets/hooks/useQuoteNumber";
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
  const { submit, loading, formError } = useGenerateBudgetDraft();

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
  }

  return {
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

    appendAiLines: (lines: BudgetLine[]) => {
      setItems((prev) => [...prev, ...budgetLinesToClientItems(lines)]);
    },
    updateItem: (id: string, patch: Partial<BudgetClientItem>) => {
      setItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, ...patch } : item))
      );
    },
    removeItem: (id: string) => {
      setItems((prev) => prev.filter((item) => item.id !== id));
    },
    replaceItems: (items: BudgetClientItem[]) => {
      setItems(items);
    },
  };
}
