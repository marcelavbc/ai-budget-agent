"use client";

import { useEffect, useState } from "react";
import type { BudgetListRow } from "@/features/budgets/types/budgetsDb";
import type { BudgetInvoiceIds } from "@/features/invoices/lib/invoices";
import type { BudgetStatus } from "@/features/budgets/lib/budgetStatus";
import { mergeBudgetInvoiceIds } from "@/features/budgets/lib/mergeBudgetInvoiceIds";

export function useBudgetsListData({
  budgets,
  invoiceIdsByBudgetId,
}: {
  budgets: BudgetListRow[];
  invoiceIdsByBudgetId: Record<string, BudgetInvoiceIds>;
}) {
  const [items, setItems] = useState<BudgetListRow[]>(() => budgets);
  const [invoiceOverrides, setInvoiceOverrides] = useState<
    Partial<Record<string, Partial<BudgetInvoiceIds>>>
  >({});

  useEffect(() => {
    setItems(budgets);
  }, [budgets]);

  function setBudgetStatus(budgetId: string, next: BudgetStatus) {
    setItems((prev) =>
      prev.map((b) => (b.id === budgetId ? { ...b, status: next } : b))
    );
  }

  function getMergedInvoiceIds(budgetId: string): BudgetInvoiceIds {
    return mergeBudgetInvoiceIds(budgetId, invoiceIdsByBudgetId, invoiceOverrides);
  }

  return {
    items,
    setItems,
    invoiceOverrides,
    setInvoiceOverrides,
    setBudgetStatus,
    getMergedInvoiceIds,
  };
}

