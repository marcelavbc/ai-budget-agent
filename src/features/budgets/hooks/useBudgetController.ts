"use client";

import { useRef, useState } from "react";
import type {
  BudgetClientDetails,
  BudgetClientItem,
  BudgetLine,
} from "@/features/budgets/types/budget";
import { useGenerateBudgetDraft } from "@/features/budgets/hooks/useGenerateBudgetDraft";
import { budgetLinesToClientItemsFromAI } from "@/features/budgets/lib/budgetLinesToClientItemsFromAI";
import { useQuoteNumber } from "@/features/budgets/hooks/useQuoteNumber";
import { usePricePerSqm } from "@/features/budgets/hooks/usePricePerSqm";

export interface UseBudgetControllerArgs {
  initialClientDetails: BudgetClientDetails;
  initialItems: BudgetClientItem[];
  initialContactId: string | null;
  initialManuallyEdited: boolean;
  onSave: (args: {
    client: BudgetClientDetails;
    items: BudgetClientItem[];
  }) => Promise<void>;
}

export function useBudgetController(args: UseBudgetControllerArgs) {
  const {
    initialClientDetails,
    initialItems,
    initialContactId,
    initialManuallyEdited,
    onSave,
  } = args;

  const onSaveRef = useRef(onSave);
  onSaveRef.current = onSave;

  const { submit, loading, formError } = useGenerateBudgetDraft();

  const [clientDetails, setClientDetails] = useState<BudgetClientDetails>(
    initialClientDetails
  );
  const [items, setItems] = useState<BudgetClientItem[]>(initialItems);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(
    initialContactId
  );

  const {
    quoteManuallyEdited,
    setClientWithAutoQuote,
    onQuoteNumberChange,
    resetAutomation,
  } = useQuoteNumber({ setClientDetails, initialManuallyEdited });

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
    await onSaveRef.current({ client, items });
  }

  return {
    submit,
    loading,
    formError,
    pricePerSqm,
    setPricePerSqm,
    clientDetails,
    items,
    setItems,
    selectedContactId,
    quoteManuallyEdited,
    setClientWithAutoQuote,
    onQuoteNumberChange,
    resetAutomation,
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
