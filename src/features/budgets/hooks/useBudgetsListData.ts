"use client";

import { useMemo, useState } from "react";
import type { BudgetListRow } from "@/features/budgets/types/budgetsDb";
import type { BudgetStatus } from "@/features/budgets/lib/budgetStatus";

export function useBudgetsListData({ budgets }: { budgets: BudgetListRow[] }) {
  const [statusOverrides, setStatusOverrides] = useState<
    Map<string, BudgetStatus>
  >(() => new Map());

  const items = useMemo(
    () =>
      budgets.map((b) => {
        const override = statusOverrides.get(b.id);
        return override !== undefined ? { ...b, status: override } : b;
      }),
    [budgets, statusOverrides]
  );

  function setBudgetStatus(budgetId: string, next: BudgetStatus) {
    setStatusOverrides((prev) => new Map(prev).set(budgetId, next));
  }

  return { items, setBudgetStatus };
}
