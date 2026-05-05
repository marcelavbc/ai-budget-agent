import type { BudgetInvoiceIds } from "@/features/invoices/lib/invoices";

export function mergeBudgetInvoiceIds(
  budgetId: string,
  base: Record<string, BudgetInvoiceIds>,
  overrides: Partial<Record<string, Partial<BudgetInvoiceIds>>>
): BudgetInvoiceIds {
  const row = base[budgetId] ?? { withoutIva: null, withIva: null };
  const o = overrides[budgetId];
  return {
    withoutIva: o?.withoutIva ?? row.withoutIva,
    withIva: o?.withIva ?? row.withIva,
  };
}

