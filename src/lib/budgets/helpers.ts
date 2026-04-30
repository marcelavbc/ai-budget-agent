import type { BudgetClientDetails, BudgetClientItem } from "@/types/budget";
import type { TablesInsert } from "@/types/supabase";

export function normalizeOptionalString(value: string | null | undefined): string | null {
  const v = (value ?? "").trim();
  return v.length > 0 ? v : null;
}

export function deriveBudgetTitle(client: BudgetClientDetails): string | null {
  const name = client.nameOrCompany.trim();
  const addr = client.address.trim();
  if (name.length > 0) return name;
  if (addr.length > 0) return addr;
  return null;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function calcTotals(items: BudgetClientItem[], taxRate: number) {
  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const tax_amount = round2(subtotal * (taxRate / 100));
  const total = round2(subtotal + tax_amount);
  return { subtotal, tax_amount, total };
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
  return items.map((item, idx) => ({
    budget_id: budgetId,
    title: normalizeOptionalString(item.title),
    description: normalizeOptionalString(item.description),
    quantity: item.quantity ?? 1,
    unit: normalizeOptionalString(item.unitLabel ?? null),
    unit_price: item.unitPrice ?? null,
    line_total: item.total,
    sort_order: idx,
  }));
}

