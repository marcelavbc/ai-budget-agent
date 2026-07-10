import type { BudgetListRow } from "@/features/budgets/types/budgetsDb";
import {
  normalizeBudgetStatus,
  type BudgetStatus,
} from "@/features/budgets/lib/budgetStatus";
import { toComparableBudgetListDate } from "@/features/budgets/lib/budgetsListFormatting";

export function filterBudgets(
  items: BudgetListRow[],
  filters: {
    query: string;
    selectedStatuses: Set<BudgetStatus>;
    dateFrom: string;
    dateTo: string;
  }
): BudgetListRow[] {
  const q = filters.query.trim().toLowerCase();
  const from = filters.dateFrom.trim();
  const to = filters.dateTo.trim();

  return items.filter((b) => {
    if (filters.selectedStatuses.size > 0) {
      const s = normalizeBudgetStatus(b.status);
      if (!filters.selectedStatuses.has(s)) return false;
    }

    if (q) {
      const haystack = [b.title ?? "", b.quote_number ?? "", b.job_address ?? ""]
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(q)) return false;
    }

    const d = toComparableBudgetListDate(b.document_date);
    if ((from || to) && !d) return false;
    if (from && d && d < from) return false;
    if (to && d && d > to) return false;

    return true;
  });
}
