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
  ContactRow,
} from "@/features/budgets/types/budgetsDb";
import { normalizeBudgetStatus } from "@/features/budgets/lib/budgetStatus";
import { updateBudgetWithLines } from "@/features/budgets/lib/budgetsClient";
import { useGenerateBudgetDraft } from "@/features/budgets/hooks/useGenerateBudgetDraft";
import { budgetLinesToClientItems } from "@/features/budgets/lib/budgetLineToClientItem";
import { useQuoteNumber } from "@/features/budgets/hooks/useQuoteNumber";
import { usePricePerSqm } from "@/features/budgets/hooks/usePricePerSqm";
import {
  buildInitialBudgetEditClientDetails,
  buildInitialBudgetEditItems,
} from "@/features/budgets/lib/mapBudgetEditInitialState";

export function useBudgetEditController(args: {
  budget: BudgetRow;
  contact: ContactRow;
  lines: BudgetLineRow[];
}) {
  const { budget, contact, lines } = args;
  const { submit, loading, formError } = useGenerateBudgetDraft();

  const initialClient: BudgetClientDetails = useMemo(
    () => buildInitialBudgetEditClientDetails({ budget, contact }),
    [budget, contact]
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

  const { pricePerSqm, setPricePerSqm, applyPriceToNewItems } = usePricePerSqm({
    items,
    onItemsReplace: (items) => setItems(items),
  });

  async function handleSave({
    client,
    items,
  }: {
    client: BudgetClientDetails;
    items: BudgetClientItem[];
  }) {
    await updateBudgetWithLines({
      budgetId: budget.id,
      clientId: budget.contact_id,
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
    pricePerSqm,
    setPricePerSqm,

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
      const newItems = applyPriceToNewItems(budgetLinesToClientItems(lines));
      setItems((prev) => [...prev, ...newItems]);
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
