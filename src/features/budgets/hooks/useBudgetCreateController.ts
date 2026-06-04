"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type {
  BudgetClientDetails,
  BudgetClientItem,
  BudgetLine,
} from "@/features/budgets/types/budget";
import { defaultBudgetClientDetails } from "@/features/budgets/types/budget";
import {
  saveBudgetWithLines,
  updateBudgetWithLines,
} from "@/features/budgets/lib/budgetsClient";
import { useGenerateBudgetDraft } from "@/features/budgets/hooks/useGenerateBudgetDraft";
import { budgetLinesToClientItemsFromAI } from "@/features/budgets/lib/budgetLinesToClientItemsFromAI";
import { useQuoteNumber } from "@/features/budgets/hooks/useQuoteNumber";
import { usePricePerSqm } from "@/features/budgets/hooks/usePricePerSqm";
import type { BudgetStatus } from "@/features/budgets/lib/budgetStatus";

export function useBudgetCreateController() {
  const router = useRouter();
  const { submit, loading, formError } = useGenerateBudgetDraft();

  const [clientDetails, setClientDetails] = useState<BudgetClientDetails>(
    defaultBudgetClientDetails()
  );
  const [items, setItems] = useState<BudgetClientItem[]>([]);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(
    null
  );
  const [persistedBudget] = useState<{
    budgetId: string;
    contactId: string;
  } | null>(null);
  const [budgetStatus, setBudgetStatus] = useState<BudgetStatus>("draft");

  const {
    quoteManuallyEdited,
    setClientWithAutoQuote,
    onQuoteNumberChange,
    resetAutomation,
  } = useQuoteNumber({ setClientDetails, initialManuallyEdited: false });

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
    if (persistedBudget) {
      await updateBudgetWithLines({
        budgetId: persistedBudget.budgetId,
        contactId: persistedBudget.contactId,
        client,
        items,
        taxRate: 0,
        status: budgetStatus,
      });
      return;
    }

    const { budgetId } = await saveBudgetWithLines({
      client,
      items,
      contactId: selectedContactId,
    });
    router.push(`/budgets?new=${encodeURIComponent(budgetId)}`);
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
    quoteManuallyEdited,
    setClientWithAutoQuote,
    onQuoteNumberChange,
    resetAutomation,

    // save / edit chrome
    persistedBudget,
    budgetStatus,
    setBudgetStatus,
    handleSave,
    onContactSelect: setSelectedContactId,

    appendAiLines: (lines: BudgetLine[]) => {
      const newItems = applyPriceToNewItems(
        budgetLinesToClientItemsFromAI(lines)
      );
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
