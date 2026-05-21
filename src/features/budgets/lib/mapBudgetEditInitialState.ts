import type { BudgetClientDetails, BudgetClientItem } from "@/features/budgets/types/budget";
import type { BudgetLineRow, BudgetRow, ClientRow } from "@/features/budgets/types/budgetsDb";

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

function normalizeUnitLabel(
  value: string | null | undefined
): BudgetClientItem["unitLabel"] {
  const v = (value ?? "").trim();
  if (v === "m²" || v === "unitat" || v === "partida") return v;
  return "partida";
}

export function buildInitialBudgetEditClientDetails(args: {
  budget: BudgetRow;
  client: ClientRow;
}): BudgetClientDetails {
  const { budget, client } = args;
  return {
    nameOrCompany: (client.name ?? "").trim(),
    addressStreet: (client.address_street ?? "").trim(),
    addressPostalCode: (client.address_postal_code ?? "").trim(),
    addressCity: (client.address_city ?? "").trim(),
    quoteNumber: (budget.quote_number ?? "").trim(),
    date: (budget.document_date ?? "").trim(),
    estimatedTime: (budget.estimated_time ?? "").trim(),
  };
}

export function buildInitialBudgetEditItems(args: {
  lines: BudgetLineRow[];
}): BudgetClientItem[] {
  const { lines } = args;
  return lines.map((l) => ({
    id: l.id,
    title: (l.title ?? "").trim() || "Partida",
    description: (l.description ?? "").trim(),
    quantity: l.quantity ?? 1,
    unitLabel: normalizeUnitLabel(l.unit),
    unitPrice: l.unit_price ?? 0,
    total: l.line_total ?? round2((l.quantity ?? 1) * (l.unit_price ?? 0)),
    optionGroupId: (l.option_group_id ?? undefined) || undefined,
    optionLabel: (l.option_label ?? undefined) || undefined,
  }));
}

