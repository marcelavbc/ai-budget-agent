"use client";

import { useMemo, useRef } from "react";
import type {
  BudgetLineRow,
  BudgetRow,
  ContactRow,
} from "@/features/budgets/types/budgetsDb";
import { normalizeBudgetStatus } from "@/features/budgets/lib/budgetStatus";
import { updateBudgetWithLines } from "@/features/budgets/lib/budgetsClient";
import { useBudgetController } from "@/features/budgets/hooks/useBudgetController";
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

  const initialClient = useMemo(
    () => buildInitialBudgetEditClientDetails({ budget, contact }),
    [budget, contact]
  );

  const initialItems = useMemo(
    () => buildInitialBudgetEditItems({ lines }),
    [lines]
  );

  const selectedContactIdRef = useRef<string | null>(budget.contact_id);

  const controller = useBudgetController({
    initialClientDetails: initialClient,
    initialItems,
    initialContactId: budget.contact_id,
    initialManuallyEdited: true,
    onSave: async ({ client, items }) => {
      await updateBudgetWithLines({
        budgetId: budget.id,
        contactId: selectedContactIdRef.current ?? budget.contact_id,
        client,
        items,
        taxRate: budget.tax_rate ?? 0,
        status: normalizeBudgetStatus(budget.status),
      });
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
    setItems: controller.setItems,
    quoteManuallyEdited: controller.quoteManuallyEdited,
    setClientWithAutoQuote: controller.setClientWithAutoQuote,
    onQuoteNumberChange: controller.onQuoteNumberChange,
    resetAutomation: controller.resetAutomation,

    // save/back
    handleSave: controller.handleSave,
    onContactSelect: controller.onContactSelect,

    appendAiLines: controller.appendAiLines,
    updateItem: controller.updateItem,
    removeItem: controller.removeItem,
    replaceItems: controller.replaceItems,
  };
}
