import type { BudgetClientDetails, BudgetClientItem } from "@/features/budgets/types/budget";
import type { TablesInsert } from "@/core/types/supabase";

export function normalizeOptionalString(value: string | null | undefined): string | null {
  const v = (value ?? "").trim();
  return v.length > 0 ? v : null;
}

export function deriveBudgetTitle(client: BudgetClientDetails): string | null {
  const name = client.nameOrCompany.trim();
  if (name.length > 0) return name;
  return null;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function calcBudgetHeaderAmounts(
  items: BudgetClientItem[],
  taxRate: number
) {
  const subtotal = items.reduce((sum, item) => sum + (item.total ?? 0), 0);
  const tax_amount = round2(subtotal * (taxRate / 100));
  return { subtotal, tax_amount };
}

export function calcTotalsFromSubtotal(subtotal: number, taxRate: number) {
  const tax_amount = round2(subtotal * (taxRate / 100));
  const total = round2(subtotal + tax_amount);
  return { subtotal, tax_amount, total };
}

export function toBudgetLineRows(
  budgetId: string,
  items: BudgetClientItem[]
): TablesInsert<"budget_lines">[] {
  return items.map((item, idx) => {
    const quantity = item.quantity ?? 1;
    const lineTotal = item.total ?? 0;
    const unitPrice =
      item.unitPrice ??
      (quantity > 0 ? round2(lineTotal / quantity) : 0);

    return {
      budget_id: budgetId,
      title: normalizeOptionalString(item.title),
      description: (item.description ?? "").trim(),
      quantity,
      unit: normalizeOptionalString(item.unitLabel ?? null),
      unit_price: unitPrice,
      line_total: lineTotal,
      option_group_id: normalizeOptionalString(item.optionGroupId),
      option_label: normalizeOptionalString(item.optionLabel),
      sort_order: idx,
    };
  });
}

