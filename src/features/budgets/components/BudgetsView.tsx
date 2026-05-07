"use client";

import type { BudgetListRow } from "@/features/budgets/types/budgetsDb";
import styles from "./BudgetsView.module.css";
import { useBodyOverflowHidden } from "@/features/budgets/hooks/useBodyOverflowHidden";
import { useBudgetsListData } from "@/features/budgets/hooks/useBudgetsListData";
import { useBudgetsListFilters } from "@/features/budgets/hooks/useBudgetsListFilters";
import { BudgetsEmptyResults } from "@/features/budgets/components/BudgetsEmptyResults";
import { BudgetsFiltersSection } from "@/features/budgets/components/BudgetsFiltersSection";
import { BudgetsListCards } from "@/features/budgets/components/BudgetsListCards";
import { BudgetsListTable } from "@/features/budgets/components/BudgetsListTable";

export function BudgetsView({ budgets }: { budgets: BudgetListRow[] }) {
  useBodyOverflowHidden("hidden");
  const { items, setBudgetStatus } = useBudgetsListData({
    budgets,
  });
  const filters = useBudgetsListFilters(items);

  return (
    <div className={styles.viewRoot}>
      <BudgetsFiltersSection
        styles={styles}
        filters={filters}
      />

      <div className={styles.resultsScroll}>
        {filters.filtered.length === 0 ? (
          <BudgetsEmptyResults styles={styles} onReset={filters.reset} />
        ) : (
          <>
            <BudgetsListCards
              styles={styles}
              budgets={filters.filtered}
              onStatusChange={setBudgetStatus}
            />

            <BudgetsListTable
              styles={styles}
              budgets={filters.filtered}
              onStatusChange={setBudgetStatus}
            />
          </>
        )}
      </div>
    </div>
  );
}
