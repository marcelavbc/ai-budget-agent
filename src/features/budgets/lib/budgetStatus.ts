export type BudgetStatus = "draft" | "sent" | "approved" | "invoiced";

export function normalizeBudgetStatus(
  value: string | null | undefined
): BudgetStatus {
  const v = (value ?? "").trim().toLowerCase();
  if (v === "sent") return "sent";
  if (v === "approved") return "approved";
  if (v === "invoiced") return "invoiced";
  return "draft";
}

export function normalizeBudgetStatusOrAll(
  value: string | null | undefined
): BudgetStatus | "all" {
  const v = (value ?? "").trim().toLowerCase();
  if (v === "draft") return "draft";
  if (v === "sent") return "sent";
  if (v === "approved") return "approved";
  if (v === "invoiced") return "invoiced";
  return "all";
}

export function budgetStatusLabel(value: BudgetStatus): string {
  if (value === "draft") return "Esborrany";
  if (value === "sent") return "Enviat";
  if (value === "invoiced") return "Facturat";
  return "Aprovat";
}

export function budgetStatusOrAllLabel(value: BudgetStatus | "all"): string {
  if (value === "all") return "Tots";
  return budgetStatusLabel(value);
}

