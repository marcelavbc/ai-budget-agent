"use client";

import type { InvoicePricingMode } from "@/features/invoices/types/invoice";
import type { BudgetListRow } from "@/features/budgets/types/budgetsDb";
import type { BudgetInvoiceIds } from "@/features/invoices/lib/invoices";
import styles from "./BudgetsView.module.css";
import { useBodyOverflowHidden } from "@/features/budgets/hooks/useBodyOverflowHidden";
import { useBudgetsListData } from "@/features/budgets/hooks/useBudgetsListData";
import { useBudgetsListFilters } from "@/features/budgets/hooks/useBudgetsListFilters";
import { BudgetsEmptyResults } from "@/features/budgets/components/BudgetsEmptyResults";
import { BudgetsFiltersSection } from "@/features/budgets/components/BudgetsFiltersSection";
import { BudgetsListCards } from "@/features/budgets/components/BudgetsListCards";
import { BudgetsListTable } from "@/features/budgets/components/BudgetsListTable";

export function BudgetsView({
  budgets,
  invoiceIdsByBudgetId,
}: {
  budgets: BudgetListRow[];
  invoiceIdsByBudgetId: Record<string, BudgetInvoiceIds>;
}) {
  useBodyOverflowHidden("hidden");
  const { items, setInvoiceOverrides, setBudgetStatus, getMergedInvoiceIds } =
    useBudgetsListData({
      budgets,
      invoiceIdsByBudgetId,
    });
  const filters = useBudgetsListFilters(items);

  return (
    <div className={styles.viewRoot}>
      <BudgetsFiltersSection
        styles={styles}
        menusRef={filters.menusRef}
        filtersOpen={filters.filtersOpen}
        setFiltersOpen={filters.setFiltersOpen}
        openMenu={filters.openMenu}
        setOpenMenu={filters.setOpenMenu}
        activeFilterCount={filters.activeFilterCount}
        statusIsActive={filters.statusIsActive}
        periodIsActive={filters.periodIsActive}
        selectedStatuses={filters.selectedStatuses}
        statusLabel={filters.statusLabel}
        toggleStatus={filters.toggleStatus}
        period={filters.period}
        setPeriod={filters.setPeriod}
        periodLabel={filters.periodLabel}
        dateFrom={filters.dateFrom}
        setDateFrom={filters.setDateFrom}
        dateTo={filters.dateTo}
        setDateTo={filters.setDateTo}
        searchInputProps={filters.searchInputProps}
        resultsLabel={filters.resultsLabel}
        hasFilters={filters.hasFilters}
        onReset={filters.reset}
      />

      <div className={styles.resultsScroll}>
        {filters.filtered.length === 0 ? (
          <BudgetsEmptyResults styles={styles} onReset={filters.reset} />
        ) : (
          <>
            <BudgetsListCards
              styles={styles}
              budgets={filters.filtered}
              getMergedInvoiceIds={getMergedInvoiceIds}
              onStatusChange={setBudgetStatus}
              onInvoiceCreated={(
                budgetId: string,
                pricingMode: InvoicePricingMode,
                invoiceId: string
              ) =>
                setInvoiceOverrides((prev) => {
                  const cur = prev[budgetId] ?? {};
                  return {
                    ...prev,
                    [budgetId]: {
                      ...cur,
                      [pricingMode === "without_iva" ? "withoutIva" : "withIva"]:
                        invoiceId,
                    },
                  };
                })
              }
            />

            <BudgetsListTable
              styles={styles}
              budgets={filters.filtered}
              getMergedInvoiceIds={getMergedInvoiceIds}
              onStatusChange={setBudgetStatus}
              onInvoiceCreated={(
                budgetId: string,
                pricingMode: InvoicePricingMode,
                invoiceId: string
              ) =>
                setInvoiceOverrides((prev) => {
                  const cur = prev[budgetId] ?? {};
                  return {
                    ...prev,
                    [budgetId]: {
                      ...cur,
                      [pricingMode === "without_iva" ? "withoutIva" : "withIva"]:
                        invoiceId,
                    },
                  };
                })
              }
            />
          </>
        )}
      </div>
    </div>
  );
}
