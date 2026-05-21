"use client";

import { useState } from "react";
import type {
  BudgetClientDetails,
  BudgetClientItem,
  BudgetLine,
} from "@/features/budgets/types/budget";
import { defaultBudgetClientDetails } from "@/features/budgets/types/budget";
import { saveBudgetWithLines } from "@/features/budgets/lib/budgetsClient";
import { useGenerateBudgetDraft } from "@/features/budgets/hooks/useGenerateBudgetDraft";
import { budgetLinesToClientItemsFromAI } from "@/features/budgets/lib/budgetLinesToClientItemsFromAI";
import { useQuoteNumber } from "@/features/budgets/hooks/useQuoteNumber";

export function useBudgetCreateController() {
  const { submit, loading, formError } = useGenerateBudgetDraft();

  const [clientDetails, setClientDetails] = useState<BudgetClientDetails>(
    defaultBudgetClientDetails()
  );
  const [items, setItems] = useState<BudgetClientItem[]>([]);

  const {
    quoteManuallyEdited,
    setClientWithAutoQuote,
    onQuoteNumberChange,
    resetAutomation,
  } = useQuoteNumber({ setClientDetails, initialManuallyEdited: false });

  async function handleSave({
    client,
    items,
  }: {
    client: BudgetClientDetails;
    items: BudgetClientItem[];
  }) {
    await saveBudgetWithLines({ client, items });
  }

  return {
    // AI
    submit,
    loading,
    formError,

    // draft state
    clientDetails,
    items,
    quoteManuallyEdited,
    setClientWithAutoQuote,
    onQuoteNumberChange,
    resetAutomation,

    // save/back
    handleSave,

    appendAiLines: (lines: BudgetLine[]) => {
      setItems((prev) => [...prev, ...budgetLinesToClientItemsFromAI(lines)]);
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
