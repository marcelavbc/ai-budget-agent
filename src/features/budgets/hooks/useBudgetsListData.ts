"use client";

import { useEffect, useState } from "react";
import type { BudgetListRow } from "@/features/budgets/types/budgetsDb";
import type { BudgetStatus } from "@/features/budgets/lib/budgetStatus";

export function useBudgetsListData({ budgets }: { budgets: BudgetListRow[] }) {
  const [items, setItems] = useState<BudgetListRow[]>(() => budgets);

  useEffect(() => {
    setItems(budgets);
  }, [budgets]);

  function setBudgetStatus(budgetId: string, next: BudgetStatus) {
    setItems((prev) =>
      prev.map((b) => (b.id === budgetId ? { ...b, status: next } : b))
    );
  }

  return { items, setItems, setBudgetStatus };
}
