export type BudgetStatus = "draft" | "invoiced";

export function normalizeBudgetStatus(
  value: string | null | undefined
): BudgetStatus {
  const v = (value ?? "").trim().toLowerCase();
  if (v === "invoiced") return "invoiced";
  return "draft";
}

export function normalizeBudgetStatusOrAll(
  value: string | null | undefined
): BudgetStatus | "all" {
  const v = (value ?? "").trim().toLowerCase();
  if (v === "draft") return "draft";
  if (v === "invoiced") return "invoiced";
  return "all";
}

export function budgetStatusLabel(value: BudgetStatus): string {
  if (value === "invoiced") return "Facturat";
  return "Esborrany";
}

export function budgetStatusOrAllLabel(value: BudgetStatus | "all"): string {
  if (value === "all") return "Tots";
  return budgetStatusLabel(value);
}
