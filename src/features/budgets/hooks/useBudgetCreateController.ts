"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { defaultBudgetClientDetails } from "@/features/budgets/types/budget";
import { saveBudgetWithLines } from "@/features/budgets/lib/budgetsClient";
import { useBudgetController } from "@/features/budgets/hooks/useBudgetController";
import type { BudgetStatus } from "@/features/budgets/lib/budgetStatus";

export function useBudgetCreateController() {
  const router = useRouter();
  const [persistedBudget] = useState<{
    budgetId: string;
    contactId: string;
  } | null>(null);
  const [budgetStatus, setBudgetStatus] = useState<BudgetStatus>("draft");

  const selectedContactIdRef = useRef<string | null>(null);

  const controller = useBudgetController({
    initialClientDetails: defaultBudgetClientDetails(),
    initialItems: [],
    initialContactId: null,
    initialManuallyEdited: false,
    onSave: async ({ client, items }) => {
      const { budgetId } = await saveBudgetWithLines({
        client,
        items,
        contactId: selectedContactIdRef.current,
      });
      const target = `/budgets/${encodeURIComponent(budgetId)}/edit`;
      router.push(target);

      // Fallback for cases where another client navigation wins after save.
      if (process.env.NODE_ENV !== "test") {
        window.setTimeout(() => {
          if (window.location.pathname !== target) {
            window.location.assign(target);
          }
        }, 0);
      }
    },
  });

  selectedContactIdRef.current = controller.selectedContactId;

  return {
    // AI
    submit: controller.submit,
    loading: controller.loading,
    formError: controller.formError,
    pricePerSqm: controller.pricePerSqm,
    setPricePerSqm: controller.setPricePerSqm,

    // draft state
    clientDetails: controller.clientDetails,
    items: controller.items,
    quoteManuallyEdited: controller.quoteManuallyEdited,
    setClientWithAutoQuote: controller.setClientWithAutoQuote,
    onQuoteNumberChange: controller.onQuoteNumberChange,
    resetAutomation: controller.resetAutomation,

    // save / edit chrome
    persistedBudget,
    budgetStatus,
    setBudgetStatus,
    handleSave: controller.handleSave,
    onContactSelect: controller.onContactSelect,

    appendAiLines: controller.appendAiLines,
    updateItem: controller.updateItem,
    removeItem: controller.removeItem,
    replaceItems: controller.replaceItems,
  };
}
