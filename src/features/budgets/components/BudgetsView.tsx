"use client";

import type { BudgetListRow } from "@/features/budgets/types/budgetsDb";
import styles from "./BudgetsView.module.css";
import { useBudgetsListData } from "@/features/budgets/hooks/useBudgetsListData";
import { useBudgetsListFilters } from "@/features/budgets/hooks/useBudgetsListFilters";
import { useBudgetsListNewParam } from "@/features/budgets/hooks/useBudgetsListNewParam";
import { BudgetsEmptyResults } from "@/features/budgets/components/BudgetsEmptyResults";
import { BudgetsFiltersSection } from "@/features/budgets/components/BudgetsFiltersSection";
import { BudgetsListCards } from "@/features/budgets/components/BudgetsListCards";
import { BudgetsListTable } from "@/features/budgets/components/BudgetsListTable";

export function BudgetsView({ budgets }: { budgets: BudgetListRow[] }) {
  const mergedBudgets = useBudgetsListNewParam(budgets);
  const { items, setBudgetStatus } = useBudgetsListData({
    budgets: mergedBudgets,
  });
  const filters = useBudgetsListFilters(items);

  return (
    <div className={styles.viewRoot}>
      <BudgetsFiltersSection filters={filters} />

      <div className={styles.resultsScroll}>
        {filters.filtered.length === 0 ? (
          <BudgetsEmptyResults styles={styles} onReset={filters.reset} />
        ) : (
          <>
            <BudgetsListCards
              budgets={filters.filtered}
              onStatusChange={setBudgetStatus}
            />

            <BudgetsListTable
              budgets={filters.filtered}
              onStatusChange={setBudgetStatus}
            />
          </>
        )}
      </div>
    </div>
  );
}
